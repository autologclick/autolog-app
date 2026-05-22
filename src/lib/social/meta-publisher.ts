/**
 * Meta Graph API publisher
 *
 * Wraps the three publish flows we support:
 *   - Facebook Page feed post
 *   - Instagram feed photo (two-step: create container → publish)
 *   - Instagram Story photo
 *
 * Caller passes in the access token from a SocialAccount row.
 * No tokens are stored or read inside this file.
 *
 * Reference:
 *   https://developers.facebook.com/docs/pages-api/posts
 *   https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

const GRAPH_VERSION = 'v20.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export interface FacebookPublishInput {
  pageId: string;
  pageAccessToken: string;
  message: string;
  imageUrl?: string;   // publicly reachable URL
  linkUrl?: string;
}

export async function publishToFacebook(input: FacebookPublishInput): Promise<{ id: string }> {
  // If we have an image, post it as a /photos so the image attaches.
  // Otherwise post text (+ optional link) to /feed.
  if (input.imageUrl) {
    const url = `${GRAPH}/${input.pageId}/photos`;
    const body = new URLSearchParams({
      url: input.imageUrl,
      caption: input.message,
      access_token: input.pageAccessToken,
    });
    return postForm(url, body);
  }

  const url = `${GRAPH}/${input.pageId}/feed`;
  const body = new URLSearchParams({
    message: input.message,
    access_token: input.pageAccessToken,
  });
  if (input.linkUrl) body.set('link', input.linkUrl);
  return postForm(url, body);
}

export interface InstagramPublishInput {
  igUserId: string;       // Instagram Business Account ID (NOT the page ID)
  accessToken: string;    // long-lived user token with instagram_content_publish
  imageUrl: string;       // publicly reachable URL — IG requires media
  caption: string;
  isStory?: boolean;
}

export async function publishToInstagram(input: InstagramPublishInput): Promise<{ id: string }> {
  // Step 1 — create media container
  const containerUrl = `${GRAPH}/${input.igUserId}/media`;
  const containerBody = new URLSearchParams({
    image_url: input.imageUrl,
    caption: input.caption,
    access_token: input.accessToken,
  });
  if (input.isStory) containerBody.set('media_type', 'STORIES');

  const container = await postForm(containerUrl, containerBody);

  // Step 2 — publish the container
  const publishUrl = `${GRAPH}/${input.igUserId}/media_publish`;
  const publishBody = new URLSearchParams({
    creation_id: container.id,
    access_token: input.accessToken,
  });
  return postForm(publishUrl, publishBody);
}

/**
 * Exchange a short-lived user token from the OAuth callback into a long-lived
 * one (60 days). Page tokens derived from a long-lived user token are
 * effectively permanent.
 */
export async function exchangeForLongLivedToken(opts: {
  shortLivedToken: string;
  appId: string;
  appSecret: string;
}): Promise<{ accessToken: string; expiresIn?: number }> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', opts.appId);
  url.searchParams.set('client_secret', opts.appSecret);
  url.searchParams.set('fb_exchange_token', opts.shortLivedToken);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

/**
 * Fetch the list of pages the user manages, along with each page's
 * Instagram business account (if connected). Used once during OAuth so the
 * admin can pick which page to publish from.
 */
export async function fetchUserPages(userAccessToken: string) {
  const url = new URL(`${GRAPH}/me/accounts`);
  url.searchParams.set('fields', 'id,name,access_token,instagram_business_account');
  url.searchParams.set('access_token', userAccessToken);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`fetchUserPages failed: ${await res.text()}`);
  return (await res.json()) as {
    data: Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string };
    }>;
  };
}

// ---------- internal ----------
async function postForm(url: string, body: URLSearchParams): Promise<{ id: string }> {
  const res = await fetch(url, { method: 'POST', body });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Meta Graph API ${res.status}: ${txt.slice(0, 300)}`);
  }
  return (await res.json()) as { id: string };
}
