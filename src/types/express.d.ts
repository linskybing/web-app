import 'express';

declare module 'express' {
  interface Request {
    auth?: {
      username: string;
      [key: string]: any;
    };
  }
}
