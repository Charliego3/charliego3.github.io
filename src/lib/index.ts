// place files you want to import through the `$lib` alias in this folder.
export function toFixedTruncate(value: string | number, digits = 2): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) return "0.00";

    const factor = 10 ** digits;
    const truncated = Math.trunc(num * factor) / factor;
    return truncated.toFixed(digits);
}
