import { expressjwt } from 'express-jwt';
import { config } from '../config/config';

export const authenticateJWT = expressjwt({
  secret: config.jwtSecret,
  algorithms: ['HS256'],
}).unless({
  path: ['/api/users/login', '/api/users/register'],
});
