import RedisService from './RedisService.js';

export default class WhiteboardInfoBackendService {
    async join(clientId, whiteboardId, screenResolution) {
        const info = await RedisService.getWhiteboardInfo(whiteboardId) || {
            nbConnectedUsers: 0,
            screenResolutions: {}
        };

        info.nbConnectedUsers++;
        info.screenResolutions[clientId] = screenResolution;

        await RedisService.saveWhiteboardInfo(whiteboardId, info);
    }

    async leave(clientId, whiteboardId) {
        const info = await RedisService.getWhiteboardInfo(whiteboardId);
        if (!info) return;

        info.nbConnectedUsers--;
        delete info.screenResolutions[clientId];

        if (info.nbConnectedUsers <= 0) {
            await RedisService.client.del(`whiteboardInfo:${whiteboardId}`);
        } else {
            await RedisService.saveWhiteboardInfo(whiteboardId, info);
        }
    }
}
