import { createServer, Server } from 'http';
import express from 'express';
import SocketIO from 'socket.io';

export class BotServer {
    public static readonly PORT:number = 3000;
    private app: express.Application;
    private server: Server;
    private io: SocketIO.Server;
    private port: string | number;

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || BotServer.PORT;
    }

    private sockets(): void {
        this.io = SocketIO(this.server);
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        // Client socket pour les tests
        this.app.get('/test', function (req, res) {
            console.log("Get test");
            res.sendfile('views/index.html');
        });

        this.io.on('connect', (socket: any) => {
            console.log('Connected client on port %s.', this.port);
            socket.emit('news', { hello: 'world' });
            socket.on('my other event', function (data) {
                console.log(data);
            });
            socket.on('message', (m) => {
                console.log('[server](message): %s', JSON.stringify(m));
                this.io.emit('message', m);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });
    }

    public getApp(): express.Application {
        return this.app;
    }
}