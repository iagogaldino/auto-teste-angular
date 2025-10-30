import { Server as SocketIOServer } from 'socket.io';
export interface SocketEvents {
    'test:create': (data: {
        name: string;
        description: string;
        code?: string;
    }) => void;
    'test:run': (data: {
        testId: string;
    }) => void;
    'test:stop': (data: {
        testId: string;
    }) => void;
    'test:subscribe': (data: {
        testId: string;
    }) => void;
    'test:unsubscribe': (data: {
        testId: string;
    }) => void;
    'test:created': (data: any) => void;
    'test:updated': (data: any) => void;
    'test:deleted': (data: {
        testId: string;
    }) => void;
    'test:running': (data: {
        testId: string;
        status: string;
    }) => void;
    'test:completed': (data: {
        testId: string;
        result: any;
    }) => void;
    'test:error': (data: {
        testId: string;
        error: string;
    }) => void;
    'connection:status': (data: {
        status: string;
        message: string;
    }) => void;
}
export declare const setupSocketHandlers: (io: SocketIOServer) => void;
//# sourceMappingURL=socketHandlers.d.ts.map