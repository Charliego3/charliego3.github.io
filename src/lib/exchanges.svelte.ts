import Decimal from "decimal.js";
import { settings } from "$lib/settings.svelte";

export interface Filters {
    max_price?: Decimal;
    min_price?: Decimal;
    tick_size?: Decimal; // 价格步长
    min_qty?: Decimal;
    max_qty?: Decimal;
    step_size?: Decimal; // 数量步长
}

export class Market {
    constructor(
        public symbol: string,
        public symbol_lower: string,
        public base: string,
        public quote: string,
        public price_precision: number,
        public quantity_precision: number,
        public base_asset_precision: number,
        public quote_asset_precision: number,
        public order_types: string[],
        public time_in_force: string[],
        public permission_sets: string[],
        public filters: Filters,
    ) { }

    parse_quote(value: any) {
        return new Decimal(value).toFixed(this.price_precision, Decimal.ROUND_DOWN);
    }

    parse_base(value: any) {
        return new Decimal(value).toFixed(this.quantity_precision, Decimal.ROUND_DOWN);
    }

    parse_numbers(value: any) {
        return new Decimal(value).toFixed(this.price_precision + this.quantity_precision, Decimal.ROUND_DOWN);
    }

    parse_quote_0(value: any) {
        return new Decimal(value).toDecimalPlaces(this.price_precision, Decimal.ROUND_DOWN).toFixed();
    }

    parse_base_0(value: any) {
        return new Decimal(value).toDecimalPlaces(this.quantity_precision, Decimal.ROUND_DOWN).toFixed();
    }
}

class ExchangeInfoStore {
    markets = $state<Market[] | null>(null);
    loading = $state(false);
    error = $state<string | null>(null);

    /** 只请求一次；已有数据则直接返回 */
    async load(kit_fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>, force = false) {
        if (this.markets && !force) return;

        this.loading = true;
        this.error = null;

        try {

            const res = await (kit_fetch ?? fetch)(`${settings.current().rest_domain}/fapi/v1/exchangeInfo`);
            if (!res.ok) throw new Error(String(res.status));
            const json = await res.json();

            this.markets = json.symbols.map((m: any) => {
                let filters: Filters = {};
                m.filters.map((f: any) => {
                    switch (f.filterType) {
                        case "PRICE_FILTER":
                            filters.max_price = new Decimal(f.maxPrice);
                            filters.min_price = new Decimal(f.minPrice);
                            filters.tick_size = new Decimal(f.tickSize);
                            break;
                        case "LOT_SIZE":
                            filters.min_qty = new Decimal(f.minQty);
                            filters.max_qty = new Decimal(f.maxQty);
                            filters.step_size = new Decimal(f.stepSize);
                            break;
                    }
                });
                return new Market(
                    m.symbol,
                    m.symbol.toLowerCase(),
                    m.baseAsset,
                    m.quoteAsset,
                    m.pricePrecision,
                    m.quantityPrecision,
                    m.baseAssetPrecision,
                    m.quotePrecision,
                    m.orderTypes,
                    m.timeInForce,
                    m.permissionSets,
                    filters,
                )
            });
        } catch (e) {
            this.error = e instanceof Error ? e.message : "load failed";
        } finally {
            this.loading = false;
        }

        return this.markets;
    }

    get_markets() {
        return this.markets;
    }

    get_market(symbol: string) {
        return this.markets?.find((x) => x.symbol === symbol.toUpperCase())!;
    }
}

export const exchanges = new ExchangeInfoStore();
