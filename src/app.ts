import express from 'express';
import userRoutes from './routes/user.routes';
import { authenticateJWT } from './middlewares/auth.middleware';
import { config } from './config/config';
import { testConnection } from './db/database';
const app = express();

app.use(express.json());
app.use(authenticateJWT);
app.use('/api', userRoutes);
app.listen(config.port, () => {
    testConnection();
    console.log('Server is running on http://localhost:3000');
});
export default app;