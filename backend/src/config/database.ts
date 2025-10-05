import mysql from 'mysql2';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// 创建基础连接池
const basePool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'password',
  database: process.env.DB_NAME || 'your_app_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 使用 Promise 包装器 - 这是关键
export const dbPool = basePool.promise();

// Redis客户端
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err: Error) => console.log('Redis Client Error', err));

export const connectRedis = async (): Promise<void> => {
  await redisClient.connect();
};