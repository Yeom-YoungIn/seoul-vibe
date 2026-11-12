/**
 * 목적 - 아티클 대표 이미지 컬럼을 추가하고, 서울 장소 아티클 10개에 위키미디어 공용 사진을 넣기 위해 추가됨
 * 설명 - 컬럼명은 엔티티 메타데이터에서 읽어 DB_NAMING_STRATEGY와 무관하게 동작한다 (TYPEORM_SYNC=true면 이미 있어 건너뜀).
 *        대표 이미지는 비어 있을 때만 넣고, 본문은 시드 원본 그대로일 때만 바꿔 관리자가 고친 내용을 덮어쓰지 않는다.
 */
import { In, MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Content } from '../content/shared/entities/content.entity';
import { sanitizeArticleHtml } from '../content/shared/sanitize-article-html';
import { SEOUL_PLACE_ARTICLES } from './seoul-place-articles.data';
import { SEOUL_PLACE_IMAGES } from './seoul-place-images.data';

type Image = (typeof SEOUL_PLACE_IMAGES)[keyof typeof SEOUL_PLACE_IMAGES]['cover'];

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const credit = (image: Image) =>
  `<a href="${image.page}">${escape(image.artist)}</a> · ${escape(image.license)} · Wikimedia Commons`;

/** 첫 문단 뒤에 본문 사진을, 맨 끝에 대표 사진 출처를 붙인다 */
const withImages = (html: string, locale: string, cover: Image, body: Image | null) => {
  const ko = locale === 'KO';
  const caption = (image: Image) => escape(ko ? image.captionKo : image.captionEn);
  const figure = body
    ? `<figure><img src="${body.url}" alt="${caption(body)}" /><figcaption>${caption(body)} — ${credit(body)}</figcaption></figure>`
    : '';
  const firstParagraphEnd = html.indexOf('</p>') + '</p>'.length;
  return (
    html.slice(0, firstParagraphEnd) +
    figure +
    html.slice(firstParagraphEnd) +
    `<p><small>${ko ? '대표 사진' : 'Cover photo'}: ${caption(cover)} — ${credit(cover)}</small></p>`
  );
};

const bodies = (slug: string, locale: string) => {
  const original = SEOUL_PLACE_ARTICLES.find((a) => a.slug === slug)!.translations.find(
    (t) => t.locale === locale
  )!.bodyHtml;
  const { cover, body } = SEOUL_PLACE_IMAGES[slug as keyof typeof SEOUL_PLACE_IMAGES];
  return {
    original: sanitizeArticleHtml(original),
    withImages: sanitizeArticleHtml(withImages(original, locale, cover, body)),
  };
};

export class AddArticleCoverImages1794474688000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const metadata = queryRunner.connection.getMetadata(Content);
    const column = metadata.findColumnWithPropertyName('coverImageUrl')!.databaseName;
    if (!(await queryRunner.hasColumn(metadata.tableName, column))) {
      await queryRunner.addColumn(
        metadata.tableName,
        new TableColumn({ name: column, type: 'varchar', length: '2048', isNullable: true })
      );
    }

    const contents = queryRunner.manager.getRepository(Content);
    const found = await contents.find({
      where: { slug: In(Object.keys(SEOUL_PLACE_IMAGES)) },
      relations: { translations: true },
    });
    for (const content of found) {
      content.coverImageUrl ??=
        SEOUL_PLACE_IMAGES[content.slug as keyof typeof SEOUL_PLACE_IMAGES].cover.url;
      for (const t of content.translations) {
        const body = bodies(content.slug, t.locale);
        if (t.bodyHtml === body.original) t.bodyHtml = body.withImages;
      }
      await contents.save(content);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const contents = queryRunner.manager.getRepository(Content);
    const found = await contents.find({
      where: { slug: In(Object.keys(SEOUL_PLACE_IMAGES)) },
      relations: { translations: true },
    });
    for (const content of found) {
      for (const t of content.translations) {
        const body = bodies(content.slug, t.locale);
        if (t.bodyHtml === body.withImages) t.bodyHtml = body.original;
      }
      await contents.save(content);
    }

    const metadata = queryRunner.connection.getMetadata(Content);
    await queryRunner.dropColumn(
      metadata.tableName,
      metadata.findColumnWithPropertyName('coverImageUrl')!.databaseName
    );
  }
}
