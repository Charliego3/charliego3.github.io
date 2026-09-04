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
