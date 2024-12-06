import RedisService from './services/RedisService.js';

class Whiteboard {
    async loadStoredData(whiteboardId) {
        return await RedisService.getWhiteboardData(whiteboardId) || [];
    }

    async handleEventsAndData(content) {
        const whiteboardId = content.wid;
        const currentData = await RedisService.getWhiteboardData(whiteboardId) || [];
        currentData.push(content);
        await RedisService.saveWhiteboardData(whiteboardId, currentData);
    }
}

export { Whiteboard as default };
