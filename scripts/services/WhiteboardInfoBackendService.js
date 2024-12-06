import RedisService from './RedisService.js';

export default class WBInfoBackendService {
    constructor() {
        this.whiteboards = new Map();
    }

    join(socketId, whiteboardId, screenResolution) {
        if (!this.whiteboards.has(whiteboardId)) {
            this.whiteboards.set(whiteboardId, new Map());
        }
        const whiteboard = this.whiteboards.get(whiteboardId);
        whiteboard.set(socketId, { screenResolution });
    }

    leave(socketId, whiteboardId) {
        if (this.whiteboards.has(whiteboardId)) {
            const whiteboard = this.whiteboards.get(whiteboardId);
            whiteboard.delete(socketId);
            if (whiteboard.size === 0) {
                this.whiteboards.delete(whiteboardId);
            }
        }
    }

    getInfo(whiteboardId) {
        return this.whiteboards.get(whiteboardId) || new Map();
    }

    setScreenResolution(socketId, whiteboardId, screenResolution) {
        if (this.whiteboards.has(whiteboardId)) {
            const whiteboard = this.whiteboards.get(whiteboardId);
            if (whiteboard.has(socketId)) {
                const userInfo = whiteboard.get(socketId);
                userInfo.screenResolution = screenResolution;
                whiteboard.set(socketId, userInfo);
            }
        }
    }
}
