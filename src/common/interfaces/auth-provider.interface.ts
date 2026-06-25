export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  tenantId?: string;
}

export interface AuthUserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
  tenantId?: string;
}

export interface IAuthProvider {
  validateToken(token: string): Promise<JwtPayload | null>;
  getUser(userId: string): Promise<AuthUserData | null>;
  createUser(data: {
    email: string;
    name?: string;
    authProviderId?: string;
  }): Promise<AuthUserData>;
  getUsers(): Promise<AuthUserData[]>;
}
