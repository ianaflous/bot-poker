import { createServer, Server } from 'http';
import express from 'express';
import * as net from 'net';

export class BotServer {
    public static readonly NODE_PORT:number = 3000;
    public static readonly SOCKET_PORT:number = 1348;
    public static readonly SOCKET_IP:string = '127.0.0.1';
    private app: express.Application;
    private server: Server;
    private nodePort: string | number;
    private socketPort: number;
    private socketIp: string;

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.nodePort = process.env.PORT || BotServer.NODE_PORT;
        this.socketIp = BotServer.SOCKET_IP;
        this.socketPort = BotServer.SOCKET_PORT;
    }

    private listen(): void {
        this.server.listen(this.nodePort, () => {
            console.log('Running server on port %s', this.nodePort);
        });

        var client = new net.Socket();
        client.connect(this.socketPort, this.socketIp, () => {
            console.log('client > Connected');
            client.write('Hello, server!');
        });

        client.on('data', (data) => {
            console.log('client > Received: ' + data);
            // manage data
            client.write('response data');
        });

        client.on('close', () => {
            console.log('client > Connection closed');
        });
        client.on('error', (error) => {
            console.log('Client > gets error: ', error);
            //client.destroy(); // kill client after server's response
        });

    }

    public getApp(): express.Application {
        return this.app;
    }
}