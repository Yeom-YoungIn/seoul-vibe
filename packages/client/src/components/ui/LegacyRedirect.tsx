import { Navigate, useLocation } from 'react-router-dom';

/** 언어 접두어 도입 전 URL(/articles/..., /feed, /posts/...)을 /en 아래로 보낸다. 운영에서는 nginx 301이 먼저 처리한다 */
export default function LegacyRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`/en${pathname}${search}`} replace />;
}
