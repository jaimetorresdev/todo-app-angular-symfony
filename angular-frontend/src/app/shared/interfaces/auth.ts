export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nombre?: string;
}

export interface UpdateProfilePayload {
  nombre: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  token: string;
}

export interface AuthenticatedUser {
  id: number;
  nombre?: string | null;
  email: string;
  roles: string[];
}

export interface UpdateProfileResponse {
  message: string;
  user: AuthenticatedUser;
}
