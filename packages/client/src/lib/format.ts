import { PostCategory } from './api/posts';

const CATEGORY_LABELS: Record<PostCategory, string> = {
  restaurant: 'Eat',
  cafe: 'Café',
  etc: 'Spot',
};

export function categoryLabel(category: PostCategory) {
  return CATEGORY_LABELS[category] ?? category;
}

// Magazine-style date: 2026. 11. 05
export function formatDate(value: string) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}`;
}

// Posts have no title field, so the first line of the content stands in for one.
export function postTitle(content: string) {
  return (
    content
      .split('\n')
      .find((line) => line.trim())
      ?.trim() ?? ''
  );
}
