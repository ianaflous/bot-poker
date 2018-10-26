import { createServer, Server } from 'http';
import express from 'express';
import * as net from 'net';
import {Card} from "./models/card";
import {CardValue} from "./models/cardvalue";

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
    private getGoodHand(cardHand: Card[], card: Card[]): boolean {

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
    private getGoodPreFlop(card: Card[]): boolean {

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