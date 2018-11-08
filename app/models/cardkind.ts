export class CardKind {
  public static readonly ACE = new CardKind('1',1);
  public static readonly TWO = new CardKind('2',2);
  public static readonly THREE = new CardKind('3',3);
  public static readonly FOUR = new CardKind('4',4);
  public static readonly FIVE = new CardKind('5',5);
  public static readonly SIX = new CardKind('6',6);
  public static readonly SEVEN = new CardKind('7',7);
  public static readonly EIGHT = new CardKind('8',8);
  public static readonly NINE = new CardKind('9',9);
  public static readonly TEN = new CardKind('10',10);
  public static readonly JACK = new CardKind('JACK',11);
  public static readonly QUEEN = new CardKind('QUEEN',12);
  public static readonly KING = new CardKind('KING',13);
  
  private readonly _value: string;
  private readonly _number: number;

  private constructor(value: string, number: number) {
    this._value = value;
    this._number = number;
  }

  public get value(): string {
    return this._value;
  }

  public get number(): number {
    return this._number;
  }

  public static from(value: string): CardKind {
    if (value === '1') {
      return CardKind.ACE;
    }
    if (value === '2') {
      return CardKind.TWO;
    }
    if (value === '3') {
      return CardKind.THREE;
    }
    if (value === '4') {
      return CardKind.FOUR;
    }
    if (value === '5') {
      return CardKind.FIVE;
    }
    if (value === '6') {
      return CardKind.SIX;
    }
    if (value === '7') {
      return CardKind.SEVEN;
    }
    if (value === '8') {
      return CardKind.EIGHT;
    }
    if (value === '9') {
      return CardKind.NINE;
    }
    if (value === '10') {
      return CardKind.TEN;
    }
    if (value === 'JACK') {
      return CardKind.JACK;
    }
    if (value === 'QUEEN') {
      return CardKind.QUEEN;
    }
    if (value === 'KING') {
      return CardKind.KING;
    }

    throw value;
  }

  public static values(): CardKind[] {
    return [
      CardKind.ACE,
      CardKind.TWO,
      CardKind.THREE,
      CardKind.FOUR,
      CardKind.FIVE,
      CardKind.SIX,
      CardKind.SEVEN,
      CardKind.EIGHT,
      CardKind.NINE,
      CardKind.TEN,
      CardKind.JACK,
      CardKind.QUEEN,
      CardKind.KING
    ]
  }
}