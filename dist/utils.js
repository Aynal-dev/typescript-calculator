const MAX_PRECISION = 12;
export const isOperator = (value) => {
    return value === "+" || value === "-" || value === "*" || value === "/";
};
export const roundToSafePrecision = (value) => {
    return Number(value.toFixed(MAX_PRECISION));
};
export const formatDisplayValue = (value) => {
    const [integerPart, decimalPart] = value.split(".");
    const displayInteger = Number(integerPart).toLocaleString("en-US", {
        maximumFractionDigits: 0,
    });
    if (decimalPart === undefined) {
        return displayInteger;
    }
    return `${displayInteger}.${decimalPart}`;
};
//# sourceMappingURL=utils.js.map