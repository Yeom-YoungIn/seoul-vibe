import sanitizeHtml = require('sanitize-html');

/** 아티클 본문 HTML 허용 규칙. 저장 시점과 SEO 렌더가 같은 규칙을 쓴다 */
export const sanitizeArticleHtml = (html: string): string =>
  sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: { a: ['href', 'rel', 'target'], img: ['src', 'alt'] },
    allowedSchemes: ['http', 'https'],
  });
