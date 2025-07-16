import express from 'express';
import http from 'http';
import userRoutes from './routes/routes';
import cors from 'cors';
import { authenticateJWT } from './middlewares/auth.middleware';
import { config } from './config/config';
import { setupWebSocket } from './socket/websocket';
const app = express();
const server = http.createServer(app);

// For CORS
const allowedOrigins = ['http://10.121.124.22:5173','http://api.core.local', 'http://app.core.local'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(authenticateJWT);
app.use('/api', userRoutes);

// setupWebTerminal(server);
// setupInformerSocket(server);
setupWebSocket(server);

server.listen(config.port, () => {
    console.log('Server is running on http://localhost:3000');
});

export default app;