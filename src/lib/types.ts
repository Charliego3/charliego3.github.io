export interface Order {
    orderId: string;
    time: number;
    symbol: string;
    type: string;
    positionSide: string;
    price: number;
    origQty: number;
    executedQty: number;
    status: string;
    side: string;
}

export class OrderWrapper {

    orderId!: string;
    time!: number;
    symbol!: string;
    type!: string;
    positionSide!: string;
    price!: number;
    origQty!: number;
    executedQty!: number;
    status!: string;
    side!: string;

    constructor(public order: Order) {
        Object.assign(this, order);
    }

    is_short(): boolean { return this.order.positionSide === "SHORT" }
    is_long(): boolean { return this.order.positionSide === "LONG" }
    is_buy(): boolean { return this.order.side === "BUY" }
    is_sell(): boolean { return this.order.side === "SELL" }
}

export interface CandlestickItem {
    time: string;
    open: string;
    high: string;
    low: string;
    close: string;
    vol_size?: string;
}

export type Level = 'b' | 'a' | 'e';

export interface Question {
  /** DOM 锚点，如 q3-5 */
  id: string;
  /** 题号，如 3.5 */
  qn: string;
  title: string;
  level: Level;
  levelText: string;
  /** 答案区 HTML 片段，由 {@html} 渲染 */
  html: string;
}

export interface Section {
  id: string;
  idx: string;
  title: string;
  note: string;
  questions: Question[];
}

export interface Meta {
  kicker: string;
  title: string;
  subtitle: string;
  chips: string[];
  footer: string;
}

export interface InterviewData {
  meta: Meta;
  sections: Section[];
}

export interface QuestionWithSection extends Question {
  sectionId: string;
}
