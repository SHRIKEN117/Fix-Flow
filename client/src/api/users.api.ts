import { api } from './axios';
import { User, TechnicianProfile, ApiResponse, PaginatedResponse } from '@/types';

export const usersApi = {
  list: async (page = 1, limit = 20) => {
    const res = await api.get<PaginatedResponse<User>>(`/users?page=${page}&limit=${limit}`);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  },

  update: async (
    id: string,
    data: { name?: string; phone?: string; department?: string; specialization?: string; availability?: string }
  ) => {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}`, data);
    return res.data;
  },

  updateRole: async (id: string, role: string) => {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
    return res.data;
  },

  deactivate: async (id: string) => {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}/deactivate`);
    return res.data;
  },

  activate: async (id: string) => {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}/activate`);
    return res.data;
  },

  listTechnicians: async () => {
    const res = await api.get<ApiResponse<TechnicianProfile[]>>('/users/technicians');
    return res.data;
  },
};
