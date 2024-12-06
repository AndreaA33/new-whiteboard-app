import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

export default class RedisService {
    constructor() {
        this.client = null;
        this.subscriber = null;
    }

    async connect(config) {
        try {
            const redisConfig = {
                url: config.redis.url,
                password: config.redis.password
            };

            this.client = createClient(redisConfig);
            this.subscriber = this.client.duplicate();

            await this.client.connect();
            await this.subscriber.connect();

            console.log('Redis connection established successfully');

            return {
                pubClient: this.client,
                subClient: this.subscriber
            };
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    async getWhiteboardData(whiteboardId) {
        const data = await this.client.get(`whiteboard:${whiteboardId}`);
        return data ? JSON.parse(data) : [];
    }

    async saveWhiteboardData(whiteboardId, data) {
        await this.client.set(`whiteboard:${whiteboardId}`, JSON.stringify(data));
    }

    async getWhiteboardInfo(whiteboardId) {
        const info = await this.client.get(`whiteboardInfo:${whiteboardId}`);
        return info ? JSON.parse(info) : null;
    }

    async saveWhiteboardInfo(whiteboardId, info) {
        await this.client.set(`whiteboardInfo:${whiteboardId}`, JSON.stringify(info));
    }

    async createIOClients() {
        if (!this.client || !this.subscriber) {
            throw new Error('Redis clients not initialized. Call connect() first.');
        }
        return {
            pubClient: this.client,
            subClient: this.subscriber
        };
    }
} 