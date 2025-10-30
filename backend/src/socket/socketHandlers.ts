import { Server as SocketIOServer, Socket } from 'socket.io';
import { TestCaseService } from '@/services/testCaseService';

export interface SocketEvents {
  // Eventos do cliente para o servidor
  'test:create': (data: { name: string; description: string; code?: string }) => void;
  'test:run': (data: { testId: string }) => void;
  'test:stop': (data: { testId: string }) => void;
  'test:subscribe': (data: { testId: string }) => void;
  'test:unsubscribe': (data: { testId: string }) => void;
  
  // Eventos do servidor para o cliente
  'test:created': (data: any) => void;
  'test:updated': (data: any) => void;
  'test:deleted': (data: { testId: string }) => void;
  'test:running': (data: { testId: string; status: string }) => void;
  'test:completed': (data: { testId: string; result: any }) => void;
  'test:error': (data: { testId: string; error: string }) => void;
  'connection:status': (data: { status: string; message: string }) => void;
}

export const setupSocketHandlers = (io: SocketIOServer): void => {
  const testCaseService = new TestCaseService();

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Enviar status de conexão
    socket.emit('connection:status', {
      status: 'connected',
      message: 'Conectado ao servidor de testes'
    });

    // Evento: Criar novo teste
    socket.on('test:create', async (data) => {
      try {
        const newTest = await testCaseService.createTest(data);
        socket.emit('test:created', newTest);
        
        // Notificar todos os clientes sobre o novo teste
        io.emit('test:created', newTest);
        
        console.log(`✅ Teste criado: ${newTest.id}`);
      } catch (error) {
        socket.emit('test:error', {
          testId: 'unknown',
          error: 'Erro ao criar teste'
        });
      }
    });

    // Evento: Executar teste
    socket.on('test:run', async (data) => {
      try {
        const { testId } = data;
        const test = await testCaseService.getTestById(testId);
        
        if (!test) {
          socket.emit('test:error', {
            testId,
            error: 'Teste não encontrado'
          });
          return;
        }

        // Notificar que o teste está rodando
        socket.emit('test:running', {
          testId,
          status: 'running'
        });

        // Simular execução do teste
        const updatedTest = await testCaseService.runTest(testId);
        
        if (updatedTest) {
          // Simular delay da execução
          setTimeout(() => {
            socket.emit('test:completed', {
              testId,
              result: updatedTest
            });
            
            // Notificar todos os clientes sobre a atualização
            io.emit('test:updated', updatedTest);
          }, 2000);
        }
        
        console.log(`▶️ Teste executando: ${testId}`);
      } catch (error) {
        socket.emit('test:error', {
          testId: data.testId,
          error: 'Erro ao executar teste'
        });
      }
    });

    // Evento: Parar teste
    socket.on('test:stop', async (data) => {
      try {
        const { testId } = data;
        const test = await testCaseService.getTestById(testId);
        
        if (test) {
          await testCaseService.updateTest(testId, { status: 'pending' });
          socket.emit('test:updated', test);
          
          console.log(`⏹️ Teste parado: ${testId}`);
        }
      } catch (error) {
        socket.emit('test:error', {
          testId: data.testId,
          error: 'Erro ao parar teste'
        });
      }
    });

    // Evento: Inscrever-se em atualizações de um teste
    socket.on('test:subscribe', (data) => {
      const { testId } = data;
      socket.join(`test:${testId}`);
      console.log(`👂 Cliente ${socket.id} inscrito no teste ${testId}`);
    });

    // Evento: Cancelar inscrição em um teste
    socket.on('test:unsubscribe', (data) => {
      const { testId } = data;
      socket.leave(`test:${testId}`);
      console.log(`🔇 Cliente ${socket.id} cancelou inscrição no teste ${testId}`);
    });

    // Evento: Desconexão
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Cliente desconectado: ${socket.id} - Motivo: ${reason}`);
    });

    // Evento: Erro de conexão
    socket.on('error', (error) => {
      console.error(`❌ Erro no socket ${socket.id}:`, error);
    });
  });

  console.log('🔌 Socket.IO handlers configurados');
};
