import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SeoService } from './seo.service';

const CACHE_CONTROL = 'public, max-age=300';

/**
 * nginx SSI(/__seo/*)와 sitemap/robots 프록시가 호출하는 raw 응답 엔드포인트.
 * 전역 응답 래핑 인터셉터를 피하려고 @Res()로 직접 응답한다.
 */
@ApiExcludeController()
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('head/*')
  async head(@Req() req: Request, @Res() res: Response) {
    res.type('text/html').set('Cache-Control', CACHE_CONTROL).send(await this.seoService.head(stripPrefix(req, 'head')));
  }

  @Get('body/*')
  async body(@Req() req: Request, @Res() res: Response) {
    res.type('text/html').set('Cache-Control', CACHE_CONTROL).send(await this.seoService.body(stripPrefix(req, 'body')));
  }

  @Get('sitemap.xml')
  async sitemap(@Res() res: Response) {
    res.type('application/xml').set('Cache-Control', CACHE_CONTROL).send(await this.seoService.sitemap());
  }

  @Get('robots.txt')
  robots(@Res() res: Response) {
    res.type('text/plain').set('Cache-Control', CACHE_CONTROL).send(this.seoService.robots());
  }
}

const stripPrefix = (req: Request, kind: 'head' | 'body'): string =>
  req.path.replace(new RegExp(`^/seo/${kind}`), '') || '/';
