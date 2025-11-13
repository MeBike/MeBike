import Redis from 'ioredis'
import { connection } from '~/lib/queue/connection'

export const redisPublisher = new Redis(connection);

export const createRedisSubscriber = () => {
  return new Redis(connection);
};
