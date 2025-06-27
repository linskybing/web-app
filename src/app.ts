import express from 'express';
import userRoutes from './routes/user.routes';
import { authenticateJWT } from './middlewares/auth.middleware';
import { config } from './config/config';

const app = express();

app.use(express.json());
app.use(authenticateJWT);
app.use('/api', userRoutes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
