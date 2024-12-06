import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

export default class RedisService {
    constructor() {
        this.client = null;
        this.subscriber = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const redisConfig = {
                url: `redis://redis-elasticache.h5vflu.ng.0001.euw2.cache.amazonaws.com:6379`,
                socket: {
                    connectTimeout: 10000, // 10 seconds
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.log('Too many retries, giving up');
                            return new Error('Too many retries');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            };

            this.client = createClient(redisConfig);
            this.subscriber = this.client.duplicate();

            await this.client.connect();
            await this.subscriber.connect();

            this.isConnected = true;
            console.log('Redis connection established successfully');

            return {
                pubClient: this.client,
                subClient: this.subscriber
            };
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            // Initialize in-memory fallback
            this.memoryStore = new Map();
            return null;
        }
    }

    async getWhiteboardData(whiteboardId) {
        if (!this.isConnected) {
            return this.memoryStore.get(`whiteboard:${whiteboardId}`) || [];
        }
        try {
            const data = await this.client.get(`whiteboard:${whiteboardId}`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Redis getWhiteboardData error:', error);
            return [];
        }
    }

    async saveWhiteboardData(whiteboardId, data) {
        if (!this.isConnected) {
            this.memoryStore.set(`whiteboard:${whiteboardId}`, data);
            return;
        }
        try {
            await this.client.set(`whiteboard:${whiteboardId}`, JSON.stringify(data));
        } catch (error) {
            console.error('Redis saveWhiteboardData error:', error);
        }
    }

    async getWhiteboardInfo(whiteboardId) {
        if (!this.isConnected) {
            return this.memoryStore.get(`whiteboardInfo:${whiteboardId}`) || null;
        }
        try {
            const info = await this.client.get(`whiteboardInfo:${whiteboardId}`);
            return info ? JSON.parse(info) : null;
        } catch (error) {
            console.error('Redis getWhiteboardInfo error:', error);
            return null;
        }
    }

    async saveWhiteboardInfo(whiteboardId, info) {
        if (!this.isConnected) {
            this.memoryStore.set(`whiteboardInfo:${whiteboardId}`, info);
            return;
        }
        try {
            await this.client.set(`whiteboardInfo:${whiteboardId}`, JSON.stringify(info));
        } catch (error) {
            console.error('Redis saveWhiteboardInfo error:', error);
        }
    }

    async createIOClients() {
        if (!this.isConnected) {
            return null;
        }
        if (!this.client || !this.subscriber) {
            throw new Error('Redis clients not initialized. Call connect() first.');
        }
        return {
            pubClient: this.client,
            subClient: this.subscriber
        };
    }
} 