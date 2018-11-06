import { createServer, Server } from 'http';
import express from 'express';
import * as net from 'net';

import {Card} from "./models/card";
import {CardValue} from "./models/cardvalue";
import { PlayerStructure } from './structures/playerstructure';
import {CardKind} from "./models/cardkind";
import {CardColor} from "./models/cardcolor";

export class BotServer {
    public static readonly SOCKET_PORT:number = 4000;
    public static readonly SOCKET_IP:string = '127.0.0.1';
    private app: express.Application;
    private server: Server;
    private nodePort: string | number;
    private socketPort: number;
    private socketIp: string;
    private client;

    private id: number=0;
    private chips: number=0;
    private isDealer: boolean=false;
    private turn: number=0;
    private isRaisePreFlop: boolean=false;
    private isRaisePostFlop: boolean=false;
    private currentBet: number=0;
    private myLastBet: number=0;
    private blind: number=0;

    private myCards:Card[];
    private board:Card[];

    //indicateurs
    private fold: number=0;
    private raise: number=0;
    private goodPreFlop: number=0;
    private goodFlop: number=0;
    private raisePreFlop: number=0;
    private raisePostFlop: number=0;

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
        this.nodePort = process.env.PORT;
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
            //console.log('brut : '+msgData+' fin');
            const msgsJson = this.jsonMultiParse(msgData.toString());
            for (let msgJson of msgsJson) {
                //console.log('input : ' + msgJson + ' end');
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
                        //console.log('msg not used : ' + msgJson.id);
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
        for (let cardRecu of data.cards) {
            this.board.push(new Card(CardKind.from(cardRecu.kind), CardColor.from(cardRecu.color)));
        }
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
        this.board = [];

        this.updateChips(data.players);
        if (this.id === data.dealer) {
            this.isDealer = true;
        } else {
            this.isDealer = false;
        }
        console.log('chips : '+this.chips+' blind : '+this.blind+' raisePre : '+this.raisePreFlop+' raisePost : '+this.raisePostFlop+
            ' fold : '+this.fold+' preflop '+this.goodPreFlop+' flop '+this.goodFlop);
    }

    private onPlayerCards(data) {
        this.myCards  = [];
        for (let cardRecu of data.cards) {
            this.myCards.push(new Card(CardKind.from(cardRecu.kind), CardColor.from(cardRecu.color)));
        }
    }

    private onGameStart(data) {
        console.log('Que la partie commence !');
        this.id = data.info.id;
        this.chips = data.info.chips;
        console.log('Mon id : '+this.id);
        this.newHand();
    }

    private onJoinSuccess() {
        console.log('Connected to game server');
    }

    public onTurnStart() {
        this.turn ++;
        //this.isRaisePreFlop = false;
        //this.isRaisePostFlop = false;
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
            let goodHand = this.isPreFlopGoodHand(this.myCards);

          //  console.log("cartes : " + this.myCards[0].kind.value +"_"+ this.myCards[0].color.value + ' / '+ this.myCards[1].kind.value +"_"+ this.myCards[1].color.value + " : " + goodHand);
            if (goodHand) {
                this.goodPreFlop++;
            }
            if (raise > 6*this.blind && !goodHand) {
                this.currentBet = 0;
                this.fold++;
                return;
            }
            if (goodHand && this.chips > (2*this.blind) && !this.isRaisePreFlop) {
                this.currentBet =+ 2*this.blind;
                this.isRaisePreFlop = true;
                this.raisePreFlop++;
            }
        } else if (this.turn > 1) {
            //PostFlops
            let goodHand = this.isPostFlopGoodHand(this.myCards, this.board);
            //console.log("Hand : " );
            //console.log(this.myCards);
            //console.log("Board : " );
            //console.log(this.board);
            if (goodHand) {
                this.goodFlop++;
            }
            if ((raise > 3*this.blind && !goodHand)) {
                this.currentBet = 0;
                this.fold++;
                return;
            }
            if (goodHand && this.chips > (2*this.blind) && !this.isRaisePostFlop) {
                this.currentBet =+ 2*this.blind;
                this.isRaisePostFlop = true;
                this.raisePostFlop++;
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

    //////////////////////////////////////////
    //Test bonne main
    ///////////////////////////////////////

    /**
     * Methode post flop
     *
     * retourne true si
     * 4 ou 5 cartes meme couleur au flop
     * 5 cartes meme couleur
     * brelan au flop
     * carre
     * suite de 4 cartes au flop
     * suite de 5 cartes
     *
     *
     * @param cardHand
     * @param card
     * @returns {boolean}
     */
    private isPostFlopGoodHand(cardHand: Card[], card: Card[]): boolean {

        let pairPreFlop = false;
        let colorPreFlop = false;

        if(cardHand[0].kind.number === cardHand[1].kind.number) {
            pairPreFlop =  true;
        }
        if(cardHand[0].color.number === cardHand[1].color.number) {
            colorPreFlop =  true;
        }

        let sameColor = 2;
        if(colorPreFlop) {
            for(let i=0; i < card.length; i++) {
                if(card[i].color.number === cardHand[0].color.number){
                    sameColor++;
                }
            }
        }
        if(card.length === 3 && sameColor > 3) {
            //4 ou plus au flop
            return true;
        }
        if(sameColor === 5) {
            //couleur
            return true;
        }

        let sameKind = 2;
        if (pairPreFlop) {
            for(let i=0; i < card.length; i++) {
                if(card[i].kind.number === cardHand[0].kind.number){
                    sameKind++;
                }
            }
        }
        if(card.length === 3 && sameKind > 3) {
            //brelan ou carre au flop
            return true;
        }
        if(sameKind === 4) {
            //carre
            return true;
        }

        //si on a deux cartes différentes en main je cherche une suite
        if (cardHand[0].kind.number != cardHand[1].kind.number) {
            let fullcard: Card[];
            fullcard = card.concat(cardHand);
            let hauteur = 0;
            let compteurAffile = 0;

            for (let valeur = 1; valeur < 14; valeur++) {
                for (let i = 0; i < fullcard.length; i++) {

                    if (fullcard[i].kind.number === valeur) {

                        if (hauteur === 0 || (valeur - 1) === hauteur) {
                            hauteur = valeur;
                            compteurAffile++;
                            break; //passe a la valeur suivante
                        }

                        if (compteurAffile === 4 && card.length === 3) {
                            //4 a la suite au flop
                            return true;
                        }

                        if (compteurAffile === 5) {
                            return true;
                        }
                    }
                }
                if (valeur != hauteur) {
                    //on a pas trouvé la suivante on reinit
                    compteurAffile = 0;
                    hauteur = 0;
                }
            }

        }

        return false;
    }

    /**
     * retourne true si groupe 1 2 ou 3
     *
     * Groupe 1 : AA, KK, QQ, JJ, AKs
     * Groupe 2: TT, AQs, AJs, KQs, AKo
     * Groupe 3: 99, JTs, QJs, KJs, ATs, AQo
     *
     * Groupe 4: T9s, KQo, 88, QTs, 98s, J9s, AJo, KTs
     * Groupe 5: 77, 87s, Q9s, T8s, KJo, QJo, JTo, 76s, 97s, Axs, 65s
     * Groupe 6: 66, ATo, 55,86s, KTo, QTo, 54s, K9s, J8s, 75s
     * Groupe 7: 44, J9o, 64s, T9o, 53s, 33, 98o, 43s, 22, Kxs, T7s, Q8s
     * Groupe 8: 87o, A9o, Q9o, 76,42s, 32s, 96s, 85s, 58o, J7s, 65o, 54o, 74s, K9o, T8o
     *
     *
     * @param card
     * @returns {boolean}
     */
    private isPreFlopGoodHand(card: Card[]): boolean {

        if(card[0].kind.number < CardValue.NINE.number || card[1].kind.number < CardValue.NINE.number) {
            if(card[0].kind.number != CardValue.ACE.number && card[1].kind.number != CardValue.ACE.number){
                //carte < 9 on degage
                return false;
            }
        }

        if(card[0].kind.number === card[1].kind.number) {
            //paire 99 TT JJ KK QQ AA
            return true;
        }
        if(this.getAx(card[0], card[1]) || this.getAx(card[1], card[0])) {
            // AKs AKo AQo AQs  //AJs   //ATs
            return true;
        }
        if(this.getKx(card[0], card[1]) || this.getKx(card[1], card[0])) {
            // KQs KJs
            return true;
        }
        if(this.getQx(card[0], card[1]) || this.getQx(card[1], card[0])) {
            // QJs QTs
            return true;
        }
         if(this.getJx(card[0], card[1]) || this.getJx(card[1], card[0])) {
            // JTs
            return true;
        }

     return false;
    }

    private getAx(card1: Card, card2: Card) : Boolean {
        if(card1.kind.number === CardValue.ACE.number) {
            if(card2.kind.number > CardValue.JACK.number) {
                // AKs AKo AQo AQs
                return true;
            }
            if(card2.kind.number === CardValue.JACK.number && card2.color.number === card1.color.number) {
                //AJs
                return true;
            }
            if(card2.kind.number === CardValue.TEN.number && card2.color.number === card1.color.number) {
                //ATs
                return true;
            }
        }
        return false;
    }
    private getKx(card1: Card, card2: Card) : Boolean {
        if(card1.kind.number === CardValue.KING.number) {
            if(card2.kind.number > CardValue.TEN.number && card2.color.number === card1.color.number) {
                // KQs KJs
                return true;
            }
        }
        return false;
    }
    private getQx(card1: Card, card2: Card) : Boolean {
        if(card1.kind.number === CardValue.QUEEN.number) {
            if(card2.kind.number > CardValue.TEN.number && card2.color.number === card1.color.number) {
                // QJs QTs
                return true;
            }
        }
        return false;
    }
    private getJx(card1: Card, card2: Card) : Boolean {
        if(card1.kind.number === CardValue.JACK.number) {
            if(card2.kind.number === CardValue.TEN.number && card2.color.number === card1.color.number) {
                // JTs
                return true;
            }
        }
        return false;
    }
}