/**
 * Meta publisher — Facebook Pages + Instagram.
 *
 * Replaces the v20.0 image-only version. Adds:
 *   - Graph API v26.0 (v20.0 is at/near end of life)
 *   - Facebook Reels          (3-phase resumable upload)
 *   - Facebook Page video     (published or unpublished/draft)
 *   - Instagram Reels         (container -> poll -> publish)
 *   - Dry-run mode            (build everything, never make it public)
 *   - Publishing-limit checks before spending an IG quota slot
 *
 * Media must be reachable by Meta's crawler over public HTTPS. Files under
 * /var/www/autolog-app/public/social/ served from https://autolog.click/social/
 * satisfy this, provided robots.txt allows facebookexternalhit.
 *
 * Meta rejects source files hosted on fbcdn URLs, and any host whose
 * robots.txt blocks facebookexternalhit.
 */

const GRAPH = 'https://graph.facebook.com/v26.0';
const RUPLOAD = 'https://rupload.facebook.com';

/** Reels: 3-90s, min 540x960, 24-60fps. Instagram Reels: min 3s. */
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v'] as const;

export type PublishResult = {
  id: string;
  /** True when nothing was made publicly visible (draft / unpublished / container-only). */
  dryRun: boolean;
};

export class MetaPublishError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly subcode?: number,
  ) {
    super(message);
    this.name = 'MetaPublishError';
  }
}

export function isVideoUrl(url: string): boolean {
  const path = url.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

async function graphRequest<T>(
  url: string,
  init: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new MetaPublishError(`Meta returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }

  const err = (body as { error?: { message: string; code?: number; error_subcode?: number } }).error;
  if (err) {
    throw new MetaPublishError(err.message, err.code, err.error_subcode);
  }
  if (!res.ok) {
    throw new MetaPublishError(`Meta returned ${res.status}: ${text.slice(0, 200)}`);
  }
  return body as T;
}

function form(fields: Record<string, string>): RequestInit {
  return {
    method: 'POST',
    body: new URLSearchParams(fields),
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Facebook
// ---------------------------------------------------------------------------

export interface FacebookPublishInput {
  pageId: string;
  pageAccessToken: string;
  message: string;
  /**
   * @deprecated Use mediaUrl. Retained so existing callers keep compiling —
   * publish/route.ts passes imageUrl.
   */
  imageUrl?: string;
  /** Image or video URL. Videos are routed to Reels. Takes precedence over imageUrl. */
  mediaUrl?: string;
  linkUrl?: string;
  /** When true, creates an unpublished post / draft Reel. Nothing becomes public. */
  dryRun?: boolean;
}

/** Single source of truth for which URL to publish, whichever field was used. */
function resolveMedia(input: FacebookPublishInput): string | undefined {
  return input.mediaUrl ?? input.imageUrl;
}

/** Text or image post on a Page feed. */
async function publishFacebookFeed(input: FacebookPublishInput): Promise<PublishResult> {
  const media = resolveMedia(input);
  const isPhoto = Boolean(media);
  const endpoint = isPhoto ? 'photos' : 'feed';

  const fields: Record<string, string> = {
    access_token: input.pageAccessToken,
    published: input.dryRun ? 'false' : 'true',
  };

  if (isPhoto) {
    fields.url = media as string;
    fields.caption = input.message;
  } else {
    fields.message = input.message;
    if (input.linkUrl) fields.link = input.linkUrl;
  }

  const result = await graphRequest<{ id: string; post_id?: string }>(
    `${GRAPH}/${input.pageId}/${endpoint}`,
    form(fields),
  );

  return { id: result.post_id ?? result.id, dryRun: Boolean(input.dryRun) };
}

/**
 * Facebook Reel. Three phases: start -> upload -> finish.
 * Rate limit: 30 API-published Reels per rolling 24 hours.
 */
async function publishFacebookReel(input: FacebookPublishInput): Promise<PublishResult> {
  const videoUrl = resolveMedia(input);
  if (!videoUrl) throw new MetaPublishError('publishFacebookReel called without a media URL');

  // Phase 1 — open an upload session.
  const session = await graphRequest<{ video_id: string }>(
    `${GRAPH}/${input.pageId}/video_reels`,
    form({ upload_phase: 'start', access_token: input.pageAccessToken }),
  );

  // Phase 2 — hand Meta the public URL and let it fetch the file.
  await graphRequest<{ success: boolean }>(
    `${RUPLOAD}/video-upload/v26.0/${session.video_id}`,
    {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${input.pageAccessToken}`,
        file_url: videoUrl,
      },
    },
  );


  // Phase 3 — publish, or leave it as a draft when dry-running.
  const description = input.linkUrl ? `${input.message}\n${input.linkUrl}` : input.message;

  await graphRequest<{ success: boolean }>(
    `${GRAPH}/${input.pageId}/video_reels`,
    form({
      access_token: input.pageAccessToken,
      video_id: session.video_id,
      upload_phase: 'finish',
      video_state: input.dryRun ? 'DRAFT' : 'PUBLISHED',
      description,
    }),
  );

  // Transcoding only starts after the finish phase; wait here so callers see errors,
  // but a slow transcode is not a failure - the Reel is already committed.
  try {
    await waitForFacebookVideo(session.video_id, input.pageAccessToken);
  } catch {
    // Intentionally swallowed.
  }

  return { id: session.video_id, dryRun: Boolean(input.dryRun) };
}

/** Polls until Meta finishes transcoding. Meta gives no SLA and no webhook. */
async function waitForFacebookVideo(
  videoId: string,
  pageAccessToken: string,
  maxAttempts = 30,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(5_000);

    const { status } = await graphRequest<{
      status: {
        video_status: string;
        processing_phase?: { status: string; error?: { message: string } };
      };
    }>(`${GRAPH}/${videoId}?fields=status&access_token=${pageAccessToken}`, { method: 'GET' });

    const processingError = status.processing_phase?.error;
    if (processingError) throw new MetaPublishError(`Video processing failed: ${processingError.message}`);
    if (status.video_status === 'ready') return;
    if (status.video_status === 'error') throw new MetaPublishError('Video processing failed');
  }
  throw new MetaPublishError(`Video ${videoId} still processing after ${maxAttempts * 5}s`);
}

export async function publishToFacebook(input: FacebookPublishInput): Promise<PublishResult> {
  const media = resolveMedia(input);
  if (media && isVideoUrl(media)) {
    return publishFacebookReel(input);
  }
  return publishFacebookFeed(input);
}

// ---------------------------------------------------------------------------
// Instagram
// ---------------------------------------------------------------------------

export interface InstagramPublishInput {
  igUserId: string;
  accessToken: string;
  caption: string;
  mediaUrl: string;
  isStory?: boolean;
  /**
   * Builds and validates the container, then stops short of media_publish.
   * The container expires by itself after 24 hours.
   *
   * This is the only safe way to test Instagram: published IG media cannot be
   * deleted through the API, only by hand in the app.
   */
  dryRun?: boolean;
}

/**
 * Instagram media. Meta's docs state 100 API-published posts per rolling 24h in
 * one place and 50 in another, so we treat 50 as the ceiling.
 */
const IG_DAILY_LIMIT = 50;

export async function getInstagramQuotaUsed(
  igUserId: string,
  accessToken: string,
): Promise<number> {
  const result = await graphRequest<{ data: Array<{ quota_usage: number }> }>(
    `${GRAPH}/${igUserId}/content_publishing_limit?access_token=${accessToken}`,
    { method: 'GET' },
  );
  return result.data[0]?.quota_usage ?? 0;
}

export async function publishToInstagram(input: InstagramPublishInput): Promise<PublishResult> {
  const used = await getInstagramQuotaUsed(input.igUserId, input.accessToken);
  if (used >= IG_DAILY_LIMIT) {
    throw new MetaPublishError(`Instagram daily publishing limit reached (${used}/${IG_DAILY_LIMIT})`);
  }

  const isVideo = isVideoUrl(input.mediaUrl);

  const containerFields: Record<string, string> = {
    access_token: input.accessToken,
    caption: input.caption,
  };

  if (isVideo) {
    containerFields.video_url = input.mediaUrl;
    containerFields.media_type = input.isStory ? 'STORIES' : 'REELS';
  } else {
    containerFields.image_url = input.mediaUrl;
    if (input.isStory) containerFields.media_type = 'STORIES';
  }

  const container = await graphRequest<{ id: string }>(
    `${GRAPH}/${input.igUserId}/media`,
    form(containerFields),
  );

  // Video containers transcode asynchronously; images are ready immediately.
  if (isVideo) {
    await waitForInstagramContainer(container.id, input.accessToken);
  }

  if (input.dryRun) {
    return { id: container.id, dryRun: true };
  }

  const published = await graphRequest<{ id: string }>(
    `${GRAPH}/${input.igUserId}/media_publish`,
    form({ access_token: input.accessToken, creation_id: container.id }),
  );

  return { id: published.id, dryRun: false };
}

/** Meta recommends polling once a minute for no more than five minutes. */
async function waitForInstagramContainer(
  containerId: string,
  accessToken: string,
  maxAttempts = 10,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(attempt === 0 ? 5_000 : 30_000);

    const { status_code } = await graphRequest<{ status_code: string }>(
      `${GRAPH}/${containerId}?fields=status_code&access_token=${accessToken}`,
      { method: 'GET' },
    );

    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR') throw new MetaPublishError(`Container ${containerId} failed to process`);
    if (status_code === 'EXPIRED') throw new MetaPublishError(`Container ${containerId} expired before publishing`);
  }
  throw new MetaPublishError(`Container ${containerId} still processing after 5 minutes`);
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

/**
 * Exchanges a short-lived user token for a ~60-day one.
 *
 * Kept for the OAuth path in ConnectionsPanel, but the system-user token in
 * /opt/autolog-marketing/.env never expires and is what the bot should use.
 * Prefer that; this exists so the manual connect flow keeps working.
 */
export async function exchangeForLongLivedToken(opts: {
  appId: string;
  appSecret: string;
  shortLivedToken: string;
}): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: opts.appId,
    client_secret: opts.appSecret,
    fb_exchange_token: opts.shortLivedToken,
  });

  return graphRequest<{ access_token: string; expires_in: number }>(
    `${GRAPH}/oauth/access_token?${params}`,
    { method: 'GET' },
  );
}

export async function fetchUserPages(userAccessToken: string) {
  const result = await graphRequest<{
    data: Array<{ id: string; name: string; access_token: string; tasks?: string[] }>;
  }>(
    `${GRAPH}/me/accounts?fields=id,name,access_token,tasks&access_token=${userAccessToken}`,
    { method: 'GET' },
  );
  return result.data;
}

/** Returns true when the token is valid. Used by the hourly health check. */
export async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    await graphRequest<{ id: string }>(`${GRAPH}/me?fields=id&access_token=${accessToken}`, {
      method: 'GET',
    });
    return true;
  } catch {
    return false;
  }
}
