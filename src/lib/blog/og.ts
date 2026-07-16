import { getPostBySlug } from './posts';

export function ogImageForPost(slug: string) {
  const post = getPostBySlug(slug);
  return [{
    url: `/og/${slug}.png`,
    width: 1200,
    height: 630,
    alt: post?.title ?? 'אוטולוג',
  }];
}
