import { JwtPayload } from '#src/auth/types/jwt-payload.type';

export interface TypedRequest {
  user?: JwtPayload;
  params: Record<string, string>;
}
