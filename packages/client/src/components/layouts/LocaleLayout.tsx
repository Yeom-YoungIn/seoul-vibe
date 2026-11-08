import { useContext, useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { LanguageContext } from '../../hooks/useLanguage';
import { isUrlLang, toLanguage } from '../../lib/locale';
import MainLayout from './MainLayout';

/** /:lang 하위 공개 페이지. en/ko 외 접두어는 /en을 앞에 붙여 보낸다 */
export default function LocaleLayout() {
  const { lang } = useParams();
  const { pathname, search } = useLocation();
  const { language: stored, setLanguage } = useContext(LanguageContext);
  const valid = isUrlLang(lang);

  useEffect(() => {
    if (!valid) return;
    document.documentElement.lang = lang;
    if (stored !== toLanguage(lang)) setLanguage(toLanguage(lang));
  }, [valid, lang, stored, setLanguage]);

  // nginx SSI가 넣은 페이지별 <title>이 SPA 이동 후에도 남지 않도록 경로가 바뀔 때마다 기본값으로 되돌린다.
  // 상세 페이지는 데이터 로드 후 자기 제목으로 다시 설정한다.
  useEffect(() => {
    document.title = 'Seoul Vibe';
  }, [pathname]);

  if (!valid) return <Navigate to={`/en${pathname}${search}`} replace />;
  return <MainLayout />;
}
