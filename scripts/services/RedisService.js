import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

export default class RedisService {
    constructor() {
        this.client = null;
        this.subscriber = null;
        this.isConnected = false;
        this.memoryStore = new Map();
    }

    async connect() {
        try {
            const redisConfig = {
                url: `redis://redis-cache-1.h5vflu.ng.0001.euw2.cache.amazonaws.com:6379`,
                socket: {
                    connectTimeout: 10000,
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

            this.client.on('error', (err) => console.error('Redis Client Error:', err));
            this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

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
            return null;
        }
    }

    async getWhiteboardData(whiteboardId) {
        if (!whiteboardId) return [];
        
        try {
            if (!this.isConnected) {
                return this.memoryStore.get(`whiteboard:${whiteboardId}`) || [];
            }
            const data = await this.client.get(`whiteboard:${whiteboardId}`);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Redis getWhiteboardData error:', error);
            return [];
        }
    }

    async saveWhiteboardData(whiteboardId, data) {
        if (!whiteboardId) return;
        
        try {
            if (!this.isConnected) {
                this.memoryStore.set(`whiteboard:${whiteboardId}`, data);
                return;
            }
            await this.client.set(`whiteboard:${whiteboardId}`, JSON.stringify(data));
        } catch (error) {
            console.error('Redis saveWhiteboardData error:', error);
        }
    }

    async getWhiteboardInfo(whiteboardId) {
        if (!whiteboardId) return null;
        
        try {
            if (!this.isConnected) {
                return this.memoryStore.get(`whiteboardInfo:${whiteboardId}`) || null;
            }
            const info = await this.client.get(`whiteboardInfo:${whiteboardId}`);
            return info ? JSON.parse(info) : null;
        } catch (error) {
            console.error('Redis getWhiteboardInfo error:', error);
            return null;
        }
    }

    async saveWhiteboardInfo(whiteboardId, info) {
        if (!whiteboardId) return;
        
        try {
            if (!this.isConnected) {
                this.memoryStore.set(`whiteboardInfo:${whiteboardId}`, info);
                return;
            }
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