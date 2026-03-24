import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

export const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

export const connectRedis = async () => {
  // Upstash Redis uses REST API so it is connectionless
  console.log('Upstash Redis ready');
};
