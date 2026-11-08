import { parseSourceMeta } from '../../../../src/content/admin/source/source-meta.parser';

describe('parseSourceMeta', () => {
  it('OG 메타와 article:author를 추출한다', () => {
    const html = `<html><head>
      <meta property="og:title" content="성수 카페 투어">
      <meta property="og:description" content="창가 자리가 좋은 곳">
      <meta property="og:site_name" content="네이버 블로그">
      <meta property="og:image" content="https://img.test/a.jpg">
      <meta property="article:author" content="카페러버">
      <title>무시됨</title>
    </head></html>`;

    expect(parseSourceMeta(html, 'https://blog.test/1')).toEqual({
      title: '성수 카페 투어',
      description: '창가 자리가 좋은 곳',
      siteName: '네이버 블로그',
      author: '카페러버',
      imageUrl: 'https://img.test/a.jpg',
    });
  });

  it('OG가 없으면 title과 meta description으로 폴백한다', () => {
    const html = `<html><head><title> 그냥 제목 </title><meta name="description" content="설명"></head></html>`;

    expect(parseSourceMeta(html, 'https://blog.test/1')).toEqual({
      title: '그냥 제목',
      description: '설명',
      siteName: null,
      author: null,
      imageUrl: null,
    });
  });

  it('상대 경로 og:image를 절대 URL로 바꾼다', () => {
    const html = `<meta property="og:image" content="/img/a.jpg">`;
    expect(parseSourceMeta(html, 'https://foo.tistory.com/12').imageUrl).toBe(
      'https://foo.tistory.com/img/a.jpg'
    );
  });

  it('HTML 엔티티를 디코딩한다', () => {
    const html = `<meta property="og:title" content="카페 &amp; 베이커리">`;
    expect(parseSourceMeta(html, 'https://blog.test/1').title).toBe('카페 & 베이커리');
  });

  it('빈 값은 null로 처리한다', () => {
    const html = `<meta property="og:title" content="   "><meta property="og:image" content="">`;
    const meta = parseSourceMeta(html, 'https://blog.test/1');
    expect(meta.title).toBeNull();
    expect(meta.imageUrl).toBeNull();
  });
});
