export class CardColor {
  public static readonly SPADE = new CardColor('SPADE',1);
  public static readonly HEART = new CardColor('HEART',2);
  public static readonly CLUB = new CardColor('CLUB',3);
  public static readonly DIAMOND = new CardColor('DIAMOND',4);

  private readonly _value: string;
  private readonly _number: number;

  private constructor(value: string,number : number) {
    this._value = value;
    this._number = number;
  }

  public get value(): string {
    return this._value;
  }

  public get number(): number {
    return this._number
  }

  public static from(data: string): CardColor {
    if (data === 'SPADE') {
      return CardColor.SPADE;
    }
    if (data === 'HEART') {
      return CardColor.HEART;
    }
    if (data === 'CLUB') {
      return CardColor.CLUB;
    }
    if (data === 'DIAMOND') {
      return CardColor.DIAMOND;
    }
    return CardColor.SPADE;
  }

  public static values(): CardColor[] {
    return [
      CardColor.SPADE, CardColor.HEART, CardColor.CLUB, CardColor.DIAMOND
    ]
  }
}