import { Server as SocketIOServer } from 'socket.io';
import { TestExecutionLog, TestResult, SocketMessage } from '@/types/socket';

export class SocketService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  // Enviar mensagem para um cliente específico
  sendToClient(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event, data);
  }

  // Enviar mensagem para todos os clientes
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Enviar mensagem para clientes inscritos em um teste específico
  sendToTestSubscribers(testId: string, event: string, data: any): void {
    this.io.to(`test:${testId}`).emit(event, data);
  }

  // Enviar log de execução de teste
  sendTestExecutionLog(testId: string, log: TestExecutionLog): void {
    this.sendToTestSubscribers(testId, 'test:log', log);
  }

  // Enviar resultado de teste
  sendTestResult(testId: string, result: TestResult): void {
    this.sendToTestSubscribers(testId, 'test:result', result);
    this.broadcast('test:completed', { testId, result });
  }

  // Enviar mensagem de sistema
  sendSystemMessage(message: SocketMessage): void {
    this.broadcast('system:message', message);
  }

  // Enviar status de conexão
  sendConnectionStatus(socketId: string, status: string, message: string): void {
    this.sendToClient(socketId, 'connection:status', { status, message });
  }

  // Obter informações sobre clientes conectados
  getConnectedClients(): string[] {
    return Array.from(this.io.sockets.sockets.keys());
  }

  // Verificar se um cliente está conectado
  isClientConnected(socketId: string): boolean {
    return this.io.sockets.sockets.has(socketId);
  }

  // Obter salas (testes) que um cliente está inscrito
  getClientRooms(socketId: string): string[] {
    const socket = this.io.sockets.sockets.get(socketId);
    return socket ? Array.from(socket.rooms) : [];
  }
}
