/**
 * Pure function to determine if a question should be shown based on conditional rules
 * This is the same implementation as the backend for consistency
 */
export function shouldShowQuestion(rules, answersSoFar) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const conditionResults = rules.conditions.map(condition => {
    const { questionKey, operator, value } = condition;
    const answerValue = answersSoFar[questionKey];

    if (answerValue === undefined || answerValue === null) {
      return false;
    }

    switch (operator) {
      case 'equals':
        return String(answerValue) === String(value);
      case 'notEquals':
        return String(answerValue) !== String(value);
      case 'contains':
        if (Array.isArray(answerValue)) {
          return answerValue.includes(value);
        }
        return String(answerValue).toLowerCase().includes(String(value).toLowerCase());
      default:
        return false;
    }
  });

  if (rules.logic === 'AND') {
    return conditionResults.every(result => result === true);
  } else if (rules.logic === 'OR') {
    return conditionResults.some(result => result === true);
  }

  return false;
}

