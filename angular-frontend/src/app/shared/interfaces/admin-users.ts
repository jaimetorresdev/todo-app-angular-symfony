export interface AdminUser {
  id: number;
  email: string;
  nombre?: string | null;
  roles: string[];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  nombre?: string;
  roles: string[];
}

export interface ResetPasswordResponse {
  message: string;
  usuario: AdminUser;
}

export interface UpdateUserPayload {
  nombre?: string;
  email?: string;
  roles?: string[];
}

export interface PaginatedUsersResponse {
  data: AdminUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}