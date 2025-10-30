import { Server as SocketIOServer } from 'socket.io';
import { TestExecutionLog, TestResult, SocketMessage } from '../types/socket';
export declare class SocketService {
    private io;
    constructor(io: SocketIOServer);
    sendToClient(socketId: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
    sendToTestSubscribers(testId: string, event: string, data: any): void;
    sendTestExecutionLog(testId: string, log: TestExecutionLog): void;
    sendTestResult(testId: string, result: TestResult): void;
    sendSystemMessage(message: SocketMessage): void;
    sendConnectionStatus(socketId: string, status: string, message: string): void;
    getConnectedClients(): string[];
    isClientConnected(socketId: string): boolean;
    getClientRooms(socketId: string): string[];
}
//# sourceMappingURL=socketService.d.ts.map