/**
 * Conditional Logic Engine
 * 
 * Evaluates whether a question should be shown based on conditional rules
 * and the answers provided so far.
 */

/**
 * Evaluates a single condition against the current answers
 * @param {Object} condition - The condition to evaluate
 * @param {string} condition.questionKey - The key of the question to check
 * @param {string} condition.operator - The operator: 'equals', 'notEquals', 'contains'
 * @param {*} condition.value - The value to compare against
 * @param {Object} answersSoFar - The current answers keyed by questionKey
 * @returns {boolean} - Whether the condition is met
 */
function evaluateCondition(condition, answersSoFar) {
    const { questionKey, operator, value } = condition;

    // Get the answer for this question, handle missing gracefully
    const answer = answersSoFar[questionKey];

    // If the answer is undefined or null, handle based on operator
    if (answer === undefined || answer === null) {
        // For 'notEquals', missing value means it's not equal to the target
        if (operator === 'notEquals') {
            return true;
        }
        // For other operators, missing value means condition is not met
        return false;
    }

    switch (operator) {
        case 'equals':
            // Handle array comparison for multi-select
            if (Array.isArray(answer)) {
                if (Array.isArray(value)) {
                    return JSON.stringify(answer.sort()) === JSON.stringify(value.sort());
                }
                return answer.includes(value);
            }
            return answer === value;

        case 'notEquals':
            if (Array.isArray(answer)) {
                if (Array.isArray(value)) {
                    return JSON.stringify(answer.sort()) !== JSON.stringify(value.sort());
                }
                return !answer.includes(value);
            }
            return answer !== value;

        case 'contains':
            if (Array.isArray(answer)) {
                // Check if array contains the value
                return answer.some(item =>
                    String(item).toLowerCase().includes(String(value).toLowerCase())
                );
            }
            // String contains check (case-insensitive)
            return String(answer).toLowerCase().includes(String(value).toLowerCase());

        default:
            // Unknown operator, default to true (show the question)
            console.warn(`Unknown operator: ${operator}`);
            return true;
    }
}

/**
 * Determines whether a question should be shown based on its conditional rules
 * and the answers provided so far.
 * 
 * @param {Object|null} rules - The conditional rules for the question
 * @param {string} rules.logic - How to combine conditions: 'AND' or 'OR'
 * @param {Array} rules.conditions - Array of condition objects
 * @param {Object} answersSoFar - The current answers keyed by questionKey
 * @returns {boolean} - Whether the question should be shown
 */
function shouldShowQuestion(rules, answersSoFar) {
    // If no rules, always show the question
    if (!rules || !rules.conditions || rules.conditions.length === 0) {
        return true;
    }

    const { logic, conditions } = rules;

    // Evaluate all conditions
    const results = conditions.map(condition =>
        evaluateCondition(condition, answersSoFar || {})
    );

    // Combine results based on logic operator
    if (logic === 'OR') {
        // OR: at least one condition must be true
        return results.some(result => result === true);
    } else {
        // AND (default): all conditions must be true
        return results.every(result => result === true);
    }
}

module.exports = {
    shouldShowQuestion,
    evaluateCondition
};
