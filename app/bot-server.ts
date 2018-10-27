import { createServer, Server } from 'http';
import express from 'express';
import * as net from 'net';

import { CardStructure } from './structures/cardstructure';
import { PlayerStructure } from './structures/playerstructure';

export class BotServer {
    public static readonly NODE_PORT:number = 3000;
    public static readonly SOCKET_PORT:number = 1300;
    public static readonly SOCKET_IP:string = '127.0.0.1';
    private app: express.Application;
    private server: Server;
    private nodePort: string | number;
    private socketPort: number;
    private socketIp: string;
    private client;

    private id: number;
    private chips: number;
    private isDealer: boolean;
    private turn: number;
    private isRaisePreFlop: boolean;
    private isRaisePostFlop: boolean;
    private currentBet: number;
    private myLastBet: number;
    private blind: number;

    private myCards:CardStructure[];
    private board:CardStructure[];

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

    public getApp(): express.Application {
        return this.app;
    }

    private listen(): void {

        this.client = new net.Socket();
        this.client.connect(this.socketPort, this.socketIp, () => {
            console.log('client Connecting');
        });
        this.send('client.lobby.join', { name: 'Pickpoker' });
        this.client.on('data', (msgData) => {
            console.log('brut : '+msgData+' fin');
            const msgsJson = this.jsonMultiParse(msgData.toString());
            for (let msgJson of msgsJson) {
                console.log('input : ' + msgJson + ' end');
                switch (msgJson.id) {
                    case 'server.lobby.join.success':
                        this.onJoinSuccess();
                        break;
                    case 'server.game.start':
                        this.onGameStart(msgJson.data);
                        break;
                    case 'server.game.player.cards':
                        this.onPlayerCards(msgJson.data);
                        break;
                    case 'server.game.hand.start':
                        this.onHandStart(msgJson.data);
                        break;
                    case 'server.game.blind.change':
                        this.onBlindChange(msgJson.data);
                        break;
                    case 'server.game.turn.start':
                        this.onTurnStart();
                        break;
                    case 'server.game.player.action':
                        this.onPlayerAction(msgJson.data);
                        break;
                    case 'server.game.board.cards':
                        this.onBoardCards(msgJson.data);
                        break;
                    case 'server.game.player.play':
                        this.onPlayerPlay();
                        break;
                    case 'server.game.player.play.failure':
                        this.onPlayerPlayFailure();
                        break;
                    default:
                        console.log('msg not used : ' + msgJson.id);
                }
            }
        });

    }

    private onPlayerPlayFailure() {
        this.currentBet = 0;
        this.myLastBet = 0;
        this.send('client.game.player.play', {value: this.currentBet});
    }

    private onBoardCards(data) {
        this.board = data.cards;
    }

    private onPlayerPlay() {
        this.play();
        this.send('client.game.player.play', {value: this.currentBet});
    }

    private onPlayerAction(data) {
        if (data && data.value > 0) {
            this.currentBet = data.value;
        }
    }

    private onBlindChange(data) {
        this.blind = data.big;
    }

    private onHandStart(data) {
        this.newHand();
        this.updateChips(data.players);
        if (this.id === data.dealer) {
            this.isDealer = true;
        }
        console.log('my chips : '+this.chips);
    }

    private onPlayerCards(data) {
        this.myCards = data.cards;
    }

    private onGameStart(data) {
        console.log('Que la partie commence !');
        this.id = data.info.id;
        this.chips = data.info.chips;
        console.log('Mon id : '+this.id);
    }

    private onJoinSuccess() {
        console.log('Connected to game server');
    }

    public onTurnStart() {
        this.turn ++;
        this.isRaisePreFlop = false;
        this.isRaisePostFlop = false;
        this.currentBet = 0;
        this.myLastBet = 0
    }

    // Utils
    public send(messageId: string, messageData: any = null) {
        const message: any = {
            id: messageId
        };
        if (typeof messageData !== 'undefined') {
            message.data = messageData;
        }
        this.client.write(JSON.stringify(message));
    }
    // Utils
    public jsonMultiParse(input: string, acc: any[] = []): any[] {
        if (input.trim().length === 0) {
            return acc;
        }
        try {
            acc.push(JSON.parse(input));
            return acc;
        } catch (error) {
            const ERROR_REGEX = /^Unexpected token { in JSON at position (\d+)$/;
            const match = error.message.match(ERROR_REGEX);
            if (!match) {
                throw error;
            }
            const index = parseInt(match[1], 10);
            acc.push(JSON.parse(input.substr(0, index)));
            return this.jsonMultiParse(input.substr(index), acc);
        }
    }

    public play() {
        let raise = this.getRaise();
        if (this.turn === 1) {
            // PreFlop
            /*if (this.blind >= (1/10)*this.chips) {
                if (this.bonneMainPreFlop()) {
                    this.currentBet = this.chips;
                } else {
                    this.currentBet = 0;
                }
                return;
            }*/
            if (raise > ((1/10)*this.chips)) {
                this.currentBet = 0;
            } else if (((this.isDealer && raise===0) || (this.bonneMainPreFlop())) && !this.isRaisePreFlop) {
                this.currentBet =+ 3*this.blind;
                this.isRaisePreFlop = true;
            }
        } else {
            //PostFlop
            if (raise > ((1/10)*this.chips) || raise > (6*this.blind)) {
                this.currentBet = 0;
            } else if (((this.isDealer && raise===0) || raise <= this.blind) && !this.isRaisePostFlop) {
                this.currentBet =+ 3*this.blind;
                this.isRaisePostFlop = true;
            }
        }
        this.myLastBet = this.currentBet;
    }

    public getRaise() {
        let raise = this.currentBet - this.myLastBet;
        if (raise <= 0) {
            return 0;
        }
        return raise;
    }

    public updateChips(players: PlayerStructure[]) {
        for (let player of players){
            if (player.id === this.id) {
                this.chips = player.chips;
            }
        }
    }

    public newHand() {
        this.isRaisePreFlop = false;
        this.isRaisePostFlop = false;
        this.currentBet = 0;
        this.myLastBet = 0;
        this.turn = 0;
    }

    public bonneMainPreFlop(): boolean {
        return true;

    }

}