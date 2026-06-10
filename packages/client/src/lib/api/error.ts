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
