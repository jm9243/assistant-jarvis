/**
 * 认证 API
 */
import { request } from '@/services/api';
import type { IAuthCredentials, IAuthResponse, IUserProfile } from '@/types';

export const authAPI = {
  login: (payload: IAuthCredentials) =>
    request<IAuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { skipAuth: true },
    ),

  profile: () => request<IUserProfile>('/auth/profile'),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
      { skipAuth: true },
    ),
};
