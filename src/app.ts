import express from 'express';
import http from 'http';
import userRoutes from './routes/routes';
import { authenticateJWT } from './middlewares/auth.middleware';
import { config } from './config/config';
import { setupWebTerminal } from './terminal-ws';
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(authenticateJWT);
app.use('/api', userRoutes);

setupWebTerminal(server);

server.listen(config.port, () => {
    console.log('Server is running on http://localhost:3000');
});

export default app;