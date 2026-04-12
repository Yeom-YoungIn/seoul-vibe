export interface SignupInput {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export abstract class AuthServicePort {
  abstract signup(input: SignupInput): Promise<void>;
  abstract verifyEmail(token: string): Promise<void>;
  abstract login(input: LoginInput): Promise<TokenPair>;
  abstract logout(userId: string, tokenId: string): Promise<void>;
  abstract refresh(userId: string, tokenId: string): Promise<TokenPair>;
}
