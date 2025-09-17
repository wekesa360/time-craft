import { cors } from 'hono/cors';

export const customCors = () =>
  cors({
    origin: ['https://wellnessapp.com', 'https://app.wellnessapp.com', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  });