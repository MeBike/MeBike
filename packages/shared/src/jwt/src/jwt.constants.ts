import * as dotenv from 'dotenv';
dotenv.config();

export const JWT_CONSTANTS = {
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'default_access_secret',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
  ACCESS_EXPIRATION_TIME: process.env.JWT_ACCESS_EXPIRATION_TIME || '15m',
  REFRESH_EXPIRATION_TIME: process.env.JWT_REFRESH_EXPIRATION_TIME || '7d',
};
