const getToken = () => localStorage.getItem('token');

// 인증 토큰을 붙여 백엔드 API를 호출하는 공통 함수
export const apiRequest = async (url, options = {}) => {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `요청에 실패했습니다. (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
};
