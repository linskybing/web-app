import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload & {
        id: number;
        username: string;
        role: string;
      };
    }
  }
}