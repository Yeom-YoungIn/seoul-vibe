/** 목적 - 크롤러 정책을 제공한다. 설명 - API의 텍스트 형식을 그대로 전달한다. */
import { Env, proxySeo } from '../functions-lib/seo';
export const onRequestGet: PagesFunction<Env> = ({ env }) => proxySeo(env.API_ORIGIN, 'robots.txt');
