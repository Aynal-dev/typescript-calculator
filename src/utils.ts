import type { Operator } from "./types.js";

const MAX_PRECISION = 12;

export const isOperator = (value: string): value is Operator => {
  return value === "+" || value === "-" || value === "*" || value === "/";
};

export const roundToSafePrecision = (value: number): number => {
  return Number(value.toFixed(MAX_PRECISION));
};

export const formatDisplayValue = (value: string): string => {
  const [integerPart, decimalPart] = value.split(".");
  const displayInteger = Number(integerPart).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

  if (decimalPart === undefined) {
    return displayInteger;
  }

  return `${displayInteger}.${decimalPart}`;
};
