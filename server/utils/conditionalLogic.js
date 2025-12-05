/**
 * Pure function to determine if a question should be shown based on conditional rules
 * 
 * @param {Object|null} rules - ConditionalRules object or null
 * @param {Object} answersSoFar - Record of questionKey -> answer values
 * @returns {boolean} - true if question should be shown, false otherwise
 */
function shouldShowQuestion(rules, answersSoFar) {
  // If no rules, always show the question
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  // Evaluate each condition
  const conditionResults = rules.conditions.map(condition => {
    const { questionKey, operator, value } = condition;
    const answerValue = answersSoFar[questionKey];

    // If answer is missing, condition fails (don't crash)
    if (answerValue === undefined || answerValue === null) {
      return false;
    }

    // Evaluate based on operator
    switch (operator) {
      case 'equals':
        return String(answerValue) === String(value);
      
      case 'notEquals':
        return String(answerValue) !== String(value);
      
      case 'contains':
        // For arrays (multi-select), check if value is in array
        if (Array.isArray(answerValue)) {
          return answerValue.includes(value);
        }
        // For strings, check if string contains value
        return String(answerValue).toLowerCase().includes(String(value).toLowerCase());
      
      default:
        return false;
    }
  });

  // Combine results based on logic operator
  if (rules.logic === 'AND') {
    return conditionResults.every(result => result === true);
  } else if (rules.logic === 'OR') {
    return conditionResults.some(result => result === true);
  }

  // Default to false if logic is invalid
  return false;
}

module.exports = {
  shouldShowQuestion
};

