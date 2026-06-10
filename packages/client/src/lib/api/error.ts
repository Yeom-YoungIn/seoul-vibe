/**
 * 목적 - 클라이언트 전역에서 API 에러 메시지 해석 로직을 재사용하기 위해 추가됨
 * 설명 - unknown 에러 객체에서 서버 응답의 message 값을 안전하게 읽고, 문자열/배열 형태를 공통 규칙으로 정리한다.
 */
interface ApiErrorShape {
  response?: {
    data?: {
      message?: unknown;
    };
  };
}

function isApiErrorShape(error: unknown): error is ApiErrorShape {
  return typeof error === 'object' && error !== null && 'response' in error;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isApiErrorShape(error)) return fallback;

  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;

  return fallback;
}
