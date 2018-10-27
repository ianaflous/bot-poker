export class CardValue {
  public static readonly ACE = new CardValue('1',1);
  public static readonly TWO = new CardValue('2',2);
  public static readonly THREE = new CardValue('3',3);
  public static readonly FOUR = new CardValue('4',4);
  public static readonly FIVE = new CardValue('5',5);
  public static readonly SIX = new CardValue('6',6);
  public static readonly SEVEN = new CardValue('7',7);
  public static readonly EIGHT = new CardValue('8',8);
  public static readonly NINE = new CardValue('9',9);
  public static readonly TEN = new CardValue('10',10);
  public static readonly JACK = new CardValue('JACK',11);
  public static readonly QUEEN = new CardValue('QUEEN',12);
  public static readonly KING = new CardValue('KING',13);
  
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

  public static from(value: string): CardValue {
    if (value === 'ACE') {
      return CardValue.ACE;
    }
    if (value === 'TWO') {
      return CardValue.TWO;
    }
    if (value === 'THREE') {
      return CardValue.THREE;
    }
    if (value === 'FOUR') {
      return CardValue.FOUR;
    }
    if (value === 'FIVE') {
      return CardValue.FIVE;
    }
    if (value === 'SIX') {
      return CardValue.SIX;
    }
    if (value === 'SEVEN') {
      return CardValue.SEVEN;
    }
    if (value === 'EIGHT') {
      return CardValue.EIGHT;
    }
    if (value === 'NINE') {
      return CardValue.NINE;
    }
    if (value === 'TEN') {
      return CardValue.TEN;
    }
    if (value === 'JACK') {
      return CardValue.JACK;
    }
    if (value === 'QUEEN') {
      return CardValue.QUEEN;
    }
    if (value === 'KING') {
      return CardValue.KING;
    }

    return CardValue.ACE;
  }

  public static values(): CardValue[] {
    return [
      CardValue.ACE,
      CardValue.TWO,
      CardValue.THREE,
      CardValue.FOUR,
      CardValue.FIVE,
      CardValue.SIX,
      CardValue.SEVEN,
      CardValue.EIGHT,
      CardValue.NINE,
      CardValue.TEN,
      CardValue.JACK,
      CardValue.QUEEN,
      CardValue.KING
    ]
  }
}