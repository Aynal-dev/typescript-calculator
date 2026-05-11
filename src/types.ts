export type Operator = "+" | "-" | "*" | "/";

export type ScientificFunction =
  | "square"
  | "sqrt"
  | "reciprocal"
  | "sin"
  | "cos"
  | "tan"
  | "ln"
  | "exp"
  | "abs";

export type CalculatorAction =
  | "number"
  | "operator"
  | "decimal"
  | "clear"
  | "delete"
  | "equals"
  | "scientific"
  | "toggle-scientific";

export interface CalculatorState {
  previousValue: string;
  currentValue: string;
  operator: Operator | null;
  overwrite: boolean;
  history: string[];
}

export interface DisplayPayload {
  currentValue: string;
  previousValue: string;
  history: string[];
  errorMessage: string;
}
