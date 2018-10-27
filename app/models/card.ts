import { CardKind } from './cardkind';
import { CardColor } from './cardcolor';
import { CardStructure } from '../structures/cardstructure';

export class Card {
  private readonly _kind: CardKind;
  private readonly _color: CardColor;

  public constructor(kind: CardKind, color: CardColor) {
    this._kind = kind;
    this._color = color;
  }

  public get kind(): CardKind {
    return this._kind;
  }

  public get color(): CardColor {
    return this._color;
  }

  public toStructure(): CardStructure {
    return {
      color: this._color.value,
      kind: this._kind.value
    }
  }
}
