import { apiRequest } from './client';

export const usersApi = {
  // 내 프로필 조회
  getMe: () => apiRequest('/api/users/me'),

  // 내 프로필 수정 (닉네임 / 현재 비밀번호 확인 필요)
  updateMe: ({ currentPassword, nickname }) =>
    apiRequest('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, nickname }),
    }),

  // 회원 탈퇴 (비밀번호 확인 필요)
  withdraw: (password) =>
    apiRequest('/api/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    }),

  // 내 프로필 + 요청 통계 (users LEFT JOIN requests)
  getOverview: () => apiRequest('/api/users/me/overview'),

  // 자주 사용한 요청 URL Top N (users JOIN requests + GROUP BY)
  getTopEndpoints: (limit = 5) =>
    apiRequest(`/api/users/me/top-endpoints?limit=${limit}`),
};
