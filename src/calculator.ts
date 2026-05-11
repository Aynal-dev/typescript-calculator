import type { CalculatorState, DisplayPayload, Operator, ScientificFunction } from "./types.js";
import { formatDisplayValue, isOperator, roundToSafePrecision } from "./utils.js";

const HISTORY_LIMIT = 10;
const ERROR_MESSAGE = "Error";
const DEGREE_TO_RADIAN = Math.PI / 180;

export class Calculator {
  private state: CalculatorState;
  private readonly onStateChange: (payload: DisplayPayload) => void;

  constructor(onStateChange: (payload: DisplayPayload) => void) {
    this.onStateChange = onStateChange;
    this.state = {
      previousValue: "",
      currentValue: "0",
      operator: null,
      overwrite: false,
      history: [],
    };

    this.emitState();
  }

  public loadHistory(history: string[]): void {
    this.state.history = history.slice(0, HISTORY_LIMIT);
    this.emitState();
  }

  public appendNumber(digit: string): void {
    if (this.state.currentValue === ERROR_MESSAGE || this.state.overwrite) {
      this.state.currentValue = digit;
      this.state.overwrite = false;
      this.emitState();
      return;
    }

    if (this.state.currentValue === "0") {
      this.state.currentValue = digit;
    } else {
      this.state.currentValue += digit;
    }

    this.emitState();
  }

  public appendDecimal(): void {
    if (this.state.currentValue === ERROR_MESSAGE || this.state.overwrite) {
      this.state.currentValue = "0.";
      this.state.overwrite = false;
      this.emitState();
      return;
    }

    if (!this.state.currentValue.includes(".")) {
      this.state.currentValue += ".";
      this.emitState();
    }
  }

  public chooseOperator(operator: Operator): void {
    if (this.state.currentValue === ERROR_MESSAGE) {
      return;
    }

    if (this.state.operator && !this.state.overwrite) {
      const result = this.computeResult();

      if (result === null) {
        return;
      }

      this.state.previousValue = result;
    } else {
      this.state.previousValue = this.state.currentValue;
    }

    this.state.operator = operator;
    this.state.overwrite = true;
    this.emitState();
  }

  public compute(): void {
    if (this.state.operator === null || this.state.currentValue === ERROR_MESSAGE) {
      return;
    }

    const previous = this.state.previousValue;
    const current = this.state.currentValue;
    const operator = this.state.operator;
    const result = this.computeResult();

    if (result === null) {
      return;
    }

    this.state.history = [
      `${previous} ${operator} ${current} = ${result}`,
      ...this.state.history,
    ].slice(0, HISTORY_LIMIT);

    this.state.currentValue = result;
    this.state.previousValue = "";
    this.state.operator = null;
    this.state.overwrite = true;
    this.emitState();
  }

  public deleteLast(): void {
    if (this.state.overwrite || this.state.currentValue === ERROR_MESSAGE) {
      this.state.currentValue = "0";
      this.state.overwrite = false;
      this.emitState();
      return;
    }

    if (this.state.currentValue.length <= 1) {
      this.state.currentValue = "0";
    } else {
      this.state.currentValue = this.state.currentValue.slice(0, -1);
    }

    this.emitState();
  }

  public applyScientificFunction(func: ScientificFunction): void {
    if (this.state.currentValue === ERROR_MESSAGE) {
      return;
    }

    const current = this.parseValue(this.state.currentValue);

    if (Number.isNaN(current)) {
      this.setError("Invalid number");
      return;
    }

    const result = this.computeScientificResult(current, func);

    if (result === null) {
      return;
    }

    const label = this.getScientificLabel(func);
    const displayResult = formatDisplayValue(String(roundToSafePrecision(result)));

    this.state.history = [
      `${label}(${formatDisplayValue(String(current))}) = ${displayResult}`,
      ...this.state.history,
    ].slice(0, HISTORY_LIMIT);

    this.state.currentValue = displayResult;
    this.state.previousValue = "";
    this.state.operator = null;
    this.state.overwrite = true;
    this.emitState();
  }

  public clear(): void {
    this.state = {
      previousValue: "",
      currentValue: "0",
      operator: null,
      overwrite: false,
      history: this.state.history,
    };

    this.emitState();
  }

  private computeResult(): string | null {
    if (this.state.operator === null || !isOperator(this.state.operator)) {
      this.setError("Invalid operator");
      return null;
    }

    const previous = this.parseValue(this.state.previousValue);
    const current = this.parseValue(this.state.currentValue);

    if (Number.isNaN(previous) || Number.isNaN(current)) {
      this.setError("Invalid numbers");
      return null;
    }

    let result: number;

    switch (this.state.operator) {
      case "+":
        result = previous + current;
        break;
      case "-":
        result = previous - current;
        break;
      case "*":
        result = previous * current;
        break;
      case "/":
        if (current === 0) {
          this.setError("Division by zero");
          return null;
        }
        result = previous / current;
        break;
      default:
        this.setError("Unsupported operation");
        return null;
    }

    return formatDisplayValue(String(roundToSafePrecision(result)));
  }

  private computeScientificResult(current: number, func: ScientificFunction): number | null {
    switch (func) {
      case "square":
        return current * current;
      case "sqrt":
        if (current < 0) {
          this.setError("Invalid input");
          return null;
        }
        return Math.sqrt(current);
      case "reciprocal":
        if (current === 0) {
          this.setError("Division by zero");
          return null;
        }
        return 1 / current;
      case "sin":
        return Math.sin(current * DEGREE_TO_RADIAN);
      case "cos":
        return Math.cos(current * DEGREE_TO_RADIAN);
      case "tan":
        const tanValue = Math.tan(current * DEGREE_TO_RADIAN);
        if (!Number.isFinite(tanValue)) {
          this.setError("Undefined result");
          return null;
        }
        return tanValue;
      case "ln":
        if (current <= 0) {
          this.setError("Invalid input");
          return null;
        }
        return Math.log(current);
      case "exp":
        return Math.exp(current);
      case "abs":
        return Math.abs(current);
      default:
        this.setError("Unsupported function");
        return null;
    }
  }

  private getScientificLabel(func: ScientificFunction): string {
    switch (func) {
      case "square":
        return "sqr";
      case "sqrt":
        return "√";
      case "reciprocal":
        return "1/x";
      case "sin":
        return "sin";
      case "cos":
        return "cos";
      case "tan":
        return "tan";
      case "ln":
        return "ln";
      case "exp":
        return "eˣ";
      case "abs":
        return "abs";
      default:
        return "fn";
    }
  }

  private parseValue(value: string): number {
    return parseFloat(value.replace(/,/g, ""));
  }

  private setError(message: string): void {
    this.state.currentValue = ERROR_MESSAGE;
    this.state.previousValue = "";
    this.state.operator = null;
    this.state.overwrite = true;
    this.emitState(message);
  }

  private emitState(errorMessage = ""): void {
    const payload: DisplayPayload = {
      currentValue: this.state.currentValue,
      previousValue: this.state.operator
        ? `${formatDisplayValue(this.state.previousValue)} ${this.state.operator}`
        : this.state.previousValue,
      history: [...this.state.history],
      errorMessage,
    };

    this.onStateChange(payload);
  }
}
