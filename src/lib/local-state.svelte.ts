export function local_state<T>(
    key: string,
    defaultValue: T,
    marshaller: (v: string) => T = (v) => v as T,
    unmarshaller: (v: T) => string = (v) => String(v),
) {
    // 1. 先从 localStorage 读
    let initial = defaultValue;
    if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(key);
        if (raw != null && raw !== "undefined") {
            try {
                initial = marshaller(raw);
            } catch {
                // 解析失败就用默认值
            }
        }
    }

    // 2. 用 $state 保存
    let value = $state<T>(initial);

    // 3. 变化时写回 localStorage
    $effect(() => {
        // 读一次 value，建立依赖
        const current = value;
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(key, unmarshaller(current));
        }
    });

    return {
        get current() {
            return value;
        },
        set current(v: T) {
            value = v;
        },
    };
}
