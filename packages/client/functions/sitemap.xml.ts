/** 목적 - 사이트맵을 제공한다. 설명 - API의 XML 형식을 유지하고 장애 본문을 차단한다. */
import { Env, proxySeo } from '../functions-lib/seo';
export const onRequestGet: PagesFunction<Env> = ({ env }) =>
  proxySeo(env.API_ORIGIN, 'sitemap.xml');
