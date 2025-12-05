/**
 * Conditional Logic Engine (Client-side)
 * 
 * Evaluates whether a question should be shown based on conditional rules
 * and the answers provided so far.
 */

/**
 * Evaluates a single condition against the current answers
 */
function evaluateCondition(condition, answersSoFar) {
    const { questionKey, operator, value } = condition;

    const answer = answersSoFar[questionKey];

    // Handle missing answers gracefully
    if (answer === undefined || answer === null) {
        if (operator === 'notEquals') {
            return true;
        }
        return false;
    }

    switch (operator) {
        case 'equals':
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
                return answer.some(item =>
                    String(item).toLowerCase().includes(String(value).toLowerCase())
                );
            }
            return String(answer).toLowerCase().includes(String(value).toLowerCase());

        default:
            console.warn(`Unknown operator: ${operator}`);
            return true;
    }
}

/**
 * Determines whether a question should be shown based on its conditional rules
 * and the answers provided so far.
 * 
 * @param {Object|null} rules - The conditional rules for the question
 * @param {Object} answersSoFar - The current answers keyed by questionKey
 * @returns {boolean} - Whether the question should be shown
 */
export function shouldShowQuestion(rules, answersSoFar) {
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
        return results.some(result => result === true);
    } else {
        // AND (default)
        return results.every(result => result === true);
    }
}

export default shouldShowQuestion;
