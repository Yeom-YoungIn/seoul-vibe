import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Content } from '../content/shared/entities/content.entity';
import { parseSeoPath, toLanguage, toUrlLang, UrlLang, URL_LANGS } from './seo-path';
import {
  ArticleSeoData,
  renderArticleBody,
  renderArticleHead,
  renderArticleListBody,
  renderDefaultHead,
  renderRobots,
  renderSitemap,
  SeoConfig,
  SitemapEntry,
} from './seo.render';

const LIST_LIMIT = 50;

@Injectable()
export class SeoService {
  private readonly cfg: SeoConfig;

  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    configService: ConfigService
  ) {
    this.cfg = {
      siteUrl: (configService.get<string>('SITE_URL') ?? 'http://localhost:5173').replace(
        /\/+$/,
        ''
      ),
      indexable: configService.get<string>('SEO_INDEXABLE') === 'true',
    };
  }

  async head(path: string): Promise<string> {
    const route = parseSeoPath(path);
    if (route.kind !== 'article') return renderDefaultHead(this.cfg, route);

    const article = await this.findArticle(route.slug, route.lang);
    return article
      ? renderArticleHead(this.cfg, article)
      : renderDefaultHead(this.cfg, route, { noindex: true });
  }

  async body(path: string): Promise<string> {
    const route = parseSeoPath(path);

    if (route.kind === 'article') {
      const article = await this.findArticle(route.slug, route.lang);
      return article ? renderArticleBody(article) : '';
    }

    if (route.kind === 'articles') {
      const contents = await this.contentRepository.find({
        where: {
          isPublished: true,
          deletedAt: IsNull(),
          translations: { locale: toLanguage(route.lang) },
        },
        relations: { translations: true },
        order: { createdAt: 'DESC' },
        take: LIST_LIMIT,
      });
      const items = contents.map((content) => ({
        slug: content.slug,
        title:
          content.translations.find((t) => t.locale === toLanguage(route.lang))?.title ??
          content.slug,
      }));
      return renderArticleListBody(route.lang, items);
    }

    return '';
  }

  async sitemap(): Promise<string> {
    const both = (pathFor: (lang: UrlLang) => string): SitemapEntry[] =>
      URL_LANGS.map((lang) => ({
        path: pathFor(lang),
        alternates: Object.fromEntries(URL_LANGS.map((l) => [l, pathFor(l)])),
      }));

    const entries = [...both((l) => `/${l}`), ...both((l) => `/${l}/articles`)];

    if (this.cfg.indexable) {
      const contents = await this.contentRepository.find({
        where: { isPublished: true, deletedAt: IsNull() },
        relations: { translations: true },
        order: { createdAt: 'DESC' },
      });

      for (const content of contents) {
        const langs = this.availableLangs(content);
        const pathFor = (lang: UrlLang) => `/${lang}/articles/${encodeURIComponent(content.slug)}`;
        const alternates = Object.fromEntries(langs.map((l) => [l, pathFor(l)]));
        for (const lang of langs) {
          entries.push({ path: pathFor(lang), alternates, lastmod: content.updatedAt });
        }
      }
    }

    return renderSitemap(this.cfg, entries);
  }

  robots(): string {
    return renderRobots(this.cfg);
  }

  private async findArticle(slug: string, lang: UrlLang): Promise<ArticleSeoData | null> {
    const content = await this.contentRepository.findOne({
      where: { slug, isPublished: true, deletedAt: IsNull() },
      relations: { translations: true },
    });
    const translation = content?.translations.find((t) => t.locale === toLanguage(lang));
    if (!content || !translation) return null;

    return {
      slug: content.slug,
      lang,
      title: translation.title,
      bodyHtml: translation.bodyHtml ?? null,
      bodyText: translation.bodyText ?? null,
      publishedAt: content.publishedAt ?? null,
      updatedAt: content.updatedAt ?? content.createdAt,
      availableLangs: this.availableLangs(content),
      sourceUrl: content.sourceUrl ?? null,
      sourceAuthor: content.sourceAuthor ?? null,
      sourceSiteName: content.sourceSiteName ?? null,
    };
  }

  private availableLangs(content: Content): UrlLang[] {
    const locales = new Set(content.translations.map((t) => toUrlLang(t.locale as 'KO' | 'EN')));
    return URL_LANGS.filter((lang) => locales.has(lang));
  }
}
