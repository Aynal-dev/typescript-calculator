import { Calculator } from "./calculator.js";
const previousValueElement = querySelector("#previousValue");
const currentValueElement = querySelector("#currentValue");
const historyListElement = querySelector("#historyList");
const errorIndicatorElement = querySelector("#errorIndicator");
const scientificToggleButton = querySelector("#scientificToggle");
const themeToggleButton = querySelector("#themeToggle");
const scientificPanel = querySelector("#scientificPanel");
const keyButtons = document.querySelectorAll(".key");
const HISTORY_STORAGE_KEY = "calculatorHistory";
const THEME_STORAGE_KEY = "calculatorTheme";
const calculator = new Calculator(handleStateChange);
let scientificMode = false;
let isDarkTheme = true;
let audioContext = null;
function querySelector(selector) {
    const element = document.querySelector(selector);
    if (element === null) {
        throw new Error(`Calculator DOM structure is missing the expected element: ${selector}`);
    }
    return element;
}
keyButtons.forEach((button) => {
    button.addEventListener("click", handleButtonClick);
});
window.addEventListener("keydown", handleKeyboardInput);
initializeTheme();
loadHistory();
function handleButtonClick(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const value = button.dataset.value ?? "";
    if (action === "operator" || action === "scientific") {
        playSound("operator");
    }
    else {
        playSound("click");
    }
    switch (action) {
        case "number":
            calculator.appendNumber(value);
            break;
        case "decimal":
            calculator.appendDecimal();
            break;
        case "operator":
            calculator.chooseOperator(value);
            break;
        case "clear":
            calculator.clear();
            break;
        case "delete":
            calculator.deleteLast();
            break;
        case "equals":
            calculator.compute();
            break;
        case "scientific":
            calculator.applyScientificFunction(value);
            break;
        case "toggle-scientific":
            handleToggleScientificMode();
            break;
        case "toggle-theme":
            handleToggleTheme();
            break;
        default:
            break;
    }
}
function handleToggleTheme() {
    isDarkTheme = !isDarkTheme;
    applyTheme();
}
function initializeTheme() {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light") {
        isDarkTheme = false;
    }
    else if (storedTheme === "dark") {
        isDarkTheme = true;
    }
    else {
        isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    applyTheme();
}
function applyTheme() {
    document.body.classList.toggle("theme-light", !isDarkTheme);
    document.body.classList.toggle("theme-dark", isDarkTheme);
    themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
    themeToggleButton.textContent = isDarkTheme ? "Dark" : "Light";
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkTheme ? "dark" : "light");
}
function loadHistory() {
    const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) {
        return;
    }
    try {
        const history = JSON.parse(stored);
        if (Array.isArray(history)) {
            calculator.loadHistory(history);
            renderHistory(history);
        }
    }
    catch {
        window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
}
function saveHistory(history) {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}
function getAudioContext() {
    if (audioContext) {
        return audioContext;
    }
    const constructor = window.AudioContext || window.webkitAudioContext;
    if (!constructor) {
        return null;
    }
    audioContext = new constructor();
    audioContext.resume().catch(() => {
        /* ignore resume errors */
    });
    return audioContext;
}
function playSound(type) {
    const context = getAudioContext();
    if (!context) {
        return;
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = type === "error" ? "triangle" : "sine";
    oscillator.frequency.value = type === "operator" ? 360 : type === "error" ? 220 : 520;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);
}
function handleToggleScientificMode() {
    scientificMode = !scientificMode;
    scientificPanel.classList.toggle("hidden", !scientificMode);
    scientificToggleButton.setAttribute("aria-pressed", String(scientificMode));
    scientificToggleButton.classList.toggle("key--active", scientificMode);
}
function handleKeyboardInput(event) {
    const key = event.key.toLowerCase();
    if (key >= "0" && key <= "9") {
        event.preventDefault();
        calculator.appendNumber(key);
        return;
    }
    if (key === ".") {
        event.preventDefault();
        calculator.appendDecimal();
        return;
    }
    if (["+", "-", "*", "/"].includes(key)) {
        event.preventDefault();
        calculator.chooseOperator(key);
        return;
    }
    if (key === "enter" || key === "=") {
        event.preventDefault();
        calculator.compute();
        return;
    }
    if (key === "backspace") {
        calculator.deleteLast();
        return;
    }
    if (key === "escape") {
        calculator.clear();
        return;
    }
    if (key === "s") {
        event.preventDefault();
        calculator.applyScientificFunction("sin");
        return;
    }
    if (key === "o") {
        event.preventDefault();
        calculator.applyScientificFunction("cos");
        return;
    }
    if (key === "t") {
        event.preventDefault();
        calculator.applyScientificFunction("tan");
        return;
    }
    if (key === "r") {
        event.preventDefault();
        calculator.applyScientificFunction("sqrt");
        return;
    }
    if (key === "q") {
        event.preventDefault();
        calculator.applyScientificFunction("square");
        return;
    }
    if (key === "l") {
        event.preventDefault();
        calculator.applyScientificFunction("ln");
        return;
    }
    if (key === "e") {
        event.preventDefault();
        calculator.applyScientificFunction("exp");
        return;
    }
    if (key === "a") {
        event.preventDefault();
        calculator.applyScientificFunction("abs");
        return;
    }
}
function handleStateChange(payload) {
    currentValueElement.textContent = payload.currentValue;
    previousValueElement.textContent = payload.previousValue;
    errorIndicatorElement.textContent = payload.errorMessage;
    renderHistory(payload.history);
    saveHistory(payload.history);
    if (payload.errorMessage) {
        playSound("error");
    }
}
function renderHistory(history) {
    if (history.length === 0) {
        historyListElement.textContent = "No calculation history yet.";
        return;
    }
    historyListElement.innerHTML = history
        .map((record) => `<div class="history-item">${record}</div>`)
        .join("");
}
//# sourceMappingURL=main.js.map