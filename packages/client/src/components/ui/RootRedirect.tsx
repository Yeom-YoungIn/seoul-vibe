import { Navigate } from 'react-router-dom';
import { getStoredLanguage, Language } from '../../hooks/useLanguage';
import { localePath } from '../../lib/locale';

const detectLanguage = (): Language =>
  getStoredLanguage() ?? (navigator.language.toLowerCase().startsWith('ko') ? 'KO' : 'EN');

export default function RootRedirect() {
  return <Navigate to={localePath(detectLanguage(), '/')} replace />;
}
