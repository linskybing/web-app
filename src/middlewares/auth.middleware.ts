import { expressjwt } from 'express-jwt';
import { config } from '../config/config';
import { Request, Response, NextFunction } from 'express';
export const authenticateJWT = expressjwt({
  secret: config.jwtSecret,
  algorithms: ['HS256'],
}).unless({
  path: ['/api/users/login', '/api/users/register'],
});

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.auth?.role === 'admin') {
    next();
    return;
  }
  res.status(403).json({ message: 'Admin access required' });
};
