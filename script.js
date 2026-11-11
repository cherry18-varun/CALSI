/**
 * ==============================================================================
 * JAVASCRIPT LOGIC - MODERN CALCULATOR
 * ==============================================================================
 * 
 * This script handles all calculator operations:
 * 1. State Management: Keeping track of current/previous numbers and active operator.
 * 2. Mathematical Computation: Safe calculations (+, -, *, /) and edge cases.
 * 3. Event Listeners: Responding to button clicks and keyboard presses.
 * 4. DOM Updates: Keeping the user interface in sync with the state.
 */

// -----------------------------------------------------------------------------
// 1. DOM Elements (Connecting HTML to JavaScript)
// -----------------------------------------------------------------------------
const previousOperandElement = document.getElementById("previousOperand");
const currentOperandElement = document.getElementById("currentOperand");
const buttonsContainer = document.querySelector(".buttons-grid");

// -----------------------------------------------------------------------------
// 2. Application State Variables
// -----------------------------------------------------------------------------
// Represents the number currently being entered or the most recent result.
let currentOperand = "0";

// Stores the number that was entered before choosing an operator.
let previousOperand = "";

// Holds the active math operator ("+", "-", "×", "÷").
let operation = null;

// Flag: When true, typing a new number will overwrite the display instead of appending.
// (e.g., right after selecting an operator or getting a calculation result).
let shouldResetScreen = false;

// -----------------------------------------------------------------------------
// 3. Core Calculator Functions
// -----------------------------------------------------------------------------

/**
 * Resets all calculator state variables back to their defaults (AC button).
 */
function clearAll() {
  currentOperand = "0";
  previousOperand = "";
  operation = null;
  shouldResetScreen = false;
  updateDisplay();
}

/**
 * Appends a digit (0-9) to the current operand display.
 * @param {string} number - The digit clicked by the user.
 */
function appendNumber(number) {
  // If we just pressed an operator or "=", start typing a fresh number.
  if (shouldResetScreen || currentOperand === "Error") {
    currentOperand = "";
    shouldResetScreen = false;
  }

  // Prevent multiple leading zeros (e.g., "000" stays "0").
  if (currentOperand === "0" && number === "0") return;

  // If display is currently just "0" and user types a non-zero number, replace "0".
  if (currentOperand === "0") {
    currentOperand = number;
  } else {
    currentOperand += number;
  }

  updateDisplay();
}

/**
 * Appends a decimal point (.) ensuring only one decimal can exist per number.
 */
function appendDecimal() {
  if (shouldResetScreen || currentOperand === "Error") {
    currentOperand = "0";
    shouldResetScreen = false;
  }

  // Prevent adding more than one decimal point.
  if (currentOperand.includes(".")) return;

  currentOperand += ".";
  updateDisplay();
}

/**
 * Deletes the last typed digit (Backspace functionality).
 */
function deleteLastDigit() {
  if (shouldResetScreen || currentOperand === "Error") {
    clearAll();
    return;
  }

  // If there's only one character or a negative single digit, reset back to "0".
  if (currentOperand.length === 1 || (currentOperand.length === 2 && currentOperand.startsWith("-"))) {
    currentOperand = "0";
  } else {
    currentOperand = currentOperand.slice(0, -1);
  }

  updateDisplay();
}

/**
 * Toggles the positive/negative sign of the current number (+/- button).
 */
function toggleSign() {
  if (currentOperand === "0" || currentOperand === "Error") return;

  if (currentOperand.startsWith("-")) {
    currentOperand = currentOperand.substring(1);
  } else {
    currentOperand = "-" + currentOperand;
  }

  updateDisplay();
}

/**
 * Converts current number to a percentage by dividing it by 100 (% button).
 */
function computePercent() {
  if (currentOperand === "Error") return;

  const current = parseFloat(currentOperand);
  if (isNaN(current)) return;

  // Round result to prevent JavaScript floating point inaccuracies (e.g., 0.070000000001)
  const result = roundPrecision(current / 100);
  currentOperand = result.toString();
  shouldResetScreen = true;
  updateDisplay();
}

/**
 * Called when an operator (+, -, ×, ÷) is selected.
 * @param {string} selectedOperation - The chosen operator symbol.
 */
function chooseOperation(selectedOperation) {
  if (currentOperand === "Error") return;

  // If the user already picked an operator and clicks another without typing a number,
  // simply change the pending operator.
  if (operation !== null && shouldResetScreen) {
    operation = selectedOperation;
    updateDisplay();
    return;
  }

  // If we already have a previous number waiting, compute the intermediate result first.
  // This allows chained operations (e.g., 2 + 3 + 4 -> computes 5 first).
  if (previousOperand !== "") {
    compute();
  }

  operation = selectedOperation;
  previousOperand = currentOperand;
  shouldResetScreen = true;
  updateDisplay();
}

/**
 * Helper to solve JavaScript floating point precision issues (e.g. 0.1 + 0.2 = 0.30000000000000004).
 * Rounds to a maximum of 12 decimal places.
 */
function roundPrecision(num) {
  return Math.round((num + Number.EPSILON) * 1e12) / 1e12;
}

/**
 * Executes the arithmetic calculation based on previousOperand, currentOperand, and operation.
 */
function compute() {
  // If either the operator or previous number is missing, calculation cannot proceed.
  if (operation === null || previousOperand === "") return;

  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  // Guard against non-numeric values.
  if (isNaN(prev) || isNaN(current)) return;

  let calculationResult;

  switch (operation) {
    case "+":
      calculationResult = prev + current;
      break;
    case "-":
      calculationResult = prev - current;
      break;
    case "×":
    case "*":
      calculationResult = prev * current;
      break;
    case "÷":
    case "/":
      // Edge case: division by zero
      if (current === 0) {
        currentOperand = "Error";
        previousOperand = "";
        operation = null;
        shouldResetScreen = true;
        updateDisplay();
        return;
      }
      calculationResult = prev / current;
      break;
    default:
      return;
  }

  // Apply rounding to avoid JavaScript floating point errors
  const cleanResult = roundPrecision(calculationResult);

  currentOperand = cleanResult.toString();
  previousOperand = "";
  operation = null;
  shouldResetScreen = true;
  updateDisplay();
}

// -----------------------------------------------------------------------------
// 4. Display Formatting & Rendering
// -----------------------------------------------------------------------------

/**
 * Formats a raw number string with thousands commas (e.g., "1000000" -> "1,000,000")
 * while preserving in-progress decimal typing (e.g., "12." or "12.00").
 * @param {string} numberString - Raw string representation of number.
 * @returns {string} Formatted number string.
 */
function formatDisplayNumber(numberString) {
  if (numberString === "Error") return "Error";
  if (!numberString) return "";

  // Split into integer part and decimal part
  const parts = numberString.split(".");
  const integerPart = parseFloat(parts[0]);
  const decimalPart = parts[1];

  let formattedInteger = "";
  if (isNaN(integerPart)) {
    // Handle standalone "-" when entering negative numbers
    formattedInteger = parts[0] === "-" ? "-" : "";
  } else {
    // Format integer using locale string to insert commas
    formattedInteger = integerPart.toLocaleString("en-US");
  }

  // If user has typed a decimal point, re-attach it to the formatted integer
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  } else {
    return formattedInteger;
  }
}

/**
 * Updates the HTML display elements to reflect the current state.
 */
function updateDisplay() {
  // Update main number on the display
  currentOperandElement.innerText = formatDisplayNumber(currentOperand);

  // Update upper line showing previous operand and operation
  if (operation !== null && previousOperand !== "") {
    previousOperandElement.innerText = `${formatDisplayNumber(previousOperand)} ${operation}`;
  } else {
    previousOperandElement.innerText = "";
  }
}

// -----------------------------------------------------------------------------
// 5. Event Handling (Mouse Clicks & Keyboard Input)
// -----------------------------------------------------------------------------

/**
 * Event Delegation: A single click listener on the button grid.
 * We inspect data attributes (data-number, data-operation, data-action)
 * to decide which action to trigger.
 */
buttonsContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  // Case 1: Number button clicked (0-9)
  if (button.dataset.number !== undefined) {
    appendNumber(button.dataset.number);
    return;
  }

  // Case 2: Math operator clicked (+, -, ×, ÷)
  if (button.dataset.operation !== undefined) {
    chooseOperation(button.dataset.operation);
    return;
  }

  // Case 3: Action buttons (AC, +/-, %, decimal, =)
  const action = button.dataset.action;
  switch (action) {
    case "clear":
      clearAll();
      break;
    case "decimal":
      appendDecimal();
      break;
    case "toggle-sign":
      toggleSign();
      break;
    case "percent":
      computePercent();
      break;
    case "calculate":
      compute();
      break;
  }
});

/**
 * Keyboard Support: Allows users to type directly on their keyboard.
 */
window.addEventListener("keydown", (event) => {
  const key = event.key;

  // Numeric keys 0-9
  if (key >= "0" && key <= "9") {
    appendNumber(key);
    return;
  }

  // Decimal keys
  if (key === "." || key === ",") {
    appendDecimal();
    return;
  }

  // Operators
  if (key === "+") {
    chooseOperation("+");
    return;
  }
  if (key === "-") {
    chooseOperation("-");
    return;
  }
  if (key === "*" || key === "x" || key === "X") {
    chooseOperation("×");
    return;
  }
  if (key === "/") {
    // Prevent browser quick-find search shortcuts in some browsers
    event.preventDefault();
    chooseOperation("÷");
    return;
  }

  // Calculate (= or Enter)
  if (key === "=" || key === "Enter") {
    event.preventDefault();
    compute();
    return;
  }

  // Clear (Escape or c / C)
  if (key === "Escape" || key.toLowerCase() === "c") {
    clearAll();
    return;
  }

  // Backspace / Delete
  if (key === "Backspace" || key === "Delete") {
    deleteLastDigit();
    return;
  }
});

// Initialize display on page load
updateDisplay();

