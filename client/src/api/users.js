import { apiRequest } from './client';

export const usersApi = {
  // 내 프로필 + 요청 통계 (users LEFT JOIN requests)
  getOverview: () => apiRequest('/api/users/me/overview'),

  // 자주 사용한 요청 URL Top N (users JOIN requests + GROUP BY)
  getTopEndpoints: (limit = 5) =>
    apiRequest(`/api/users/me/top-endpoints?limit=${limit}`),
};
