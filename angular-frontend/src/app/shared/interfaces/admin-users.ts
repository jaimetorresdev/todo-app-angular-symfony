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
  passwordTemporal: string;
}