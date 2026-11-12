// 브라우저 CORS 제약을 피하기 위해 백엔드 프록시를 통해 대상 API를 호출한다.
export const sendRequest = async ({ url, method, headers, body }) => {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url, method, headers, body }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `요청에 실패했습니다. (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
};
