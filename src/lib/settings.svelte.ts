export interface Props {
    api_key: string;
    api_secret: string;
    rest_domain: string;
    public_stream_domain: string;
    market_stream_domain: string;
    private_stream_domain: string;
}

class Settings {
    api_key = $state<string>("");
    api_secret = $state<string>("");
    rest_domain = $state("https://fapi.binance.com");
    public_stream_domain = $state("wss://fstream.binance.com/public/stream");
    market_stream_domain = $state("wss://fstream.binance.com/market/stream");
    private_stream_domain = $state("wss://fstream.binance.com/private/ws/");

    constructor() {
        if (typeof localStorage !== "undefined") {
            this.load("api_key", v => this.api_key = v);
            this.load("api_secret", v => this.api_secret = v);
            this.load("rest_domain", v => this.rest_domain = v);
            this.load("public_stream_domain", v => this.public_stream_domain = v);
            this.load("market_stream_domain", v => this.market_stream_domain = v);
            this.load("private_stream_domain", v => this.private_stream_domain = v);
        }
    }

    is_invalid() {
        return !Boolean(this.api_key && this.api_secret);
    }

    current(): Props {
        return {
            api_key: this.api_key,
            api_secret: this.api_secret,
            rest_domain: this.rest_domain,
            public_stream_domain: this.public_stream_domain,
            market_stream_domain: this.market_stream_domain,
            private_stream_domain: this.private_stream_domain,
        } as Props;
    }

    set(props: Props) {
        this.api_key = props.api_key;
        this.api_secret = props.api_secret;
        this.rest_domain = props.rest_domain;
        this.public_stream_domain = props.public_stream_domain;
        this.market_stream_domain = props.market_stream_domain;
        this.private_stream_domain = props.private_stream_domain;
        localStorage.setItem("api_key", this.api_key);
        localStorage.setItem("api_secret", this.api_secret);
        localStorage.setItem("rest_domain", this.rest_domain);
        localStorage.setItem("public_stream_domain", this.public_stream_domain);
        localStorage.setItem("market_stream_domain", this.market_stream_domain);
        localStorage.setItem("private_stream_domain", this.private_stream_domain);
    }

    private load(key: string, callback: (v: string) => void) {
        const value = localStorage.getItem(key);
        if (value) callback(value);
    }
}

export const settings = new Settings();
