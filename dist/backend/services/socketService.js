"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
class SocketService {
    constructor(io) {
        this.io = io;
    }
    sendToClient(socketId, event, data) {
        this.io.to(socketId).emit(event, data);
    }
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    sendToTestSubscribers(testId, event, data) {
        this.io.to(`test:${testId}`).emit(event, data);
    }
    sendTestExecutionLog(testId, log) {
        this.sendToTestSubscribers(testId, 'test:log', log);
    }
    sendTestResult(testId, result) {
        this.sendToTestSubscribers(testId, 'test:result', result);
        this.broadcast('test:completed', { testId, result });
    }
    sendSystemMessage(message) {
        this.broadcast('system:message', message);
    }
    sendConnectionStatus(socketId, status, message) {
        this.sendToClient(socketId, 'connection:status', { status, message });
    }
    getConnectedClients() {
        return Array.from(this.io.sockets.sockets.keys());
    }
    isClientConnected(socketId) {
        return this.io.sockets.sockets.has(socketId);
    }
    getClientRooms(socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        return socket ? Array.from(socket.rooms) : [];
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=socketService.js.map