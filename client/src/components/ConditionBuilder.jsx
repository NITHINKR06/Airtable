import { useState } from 'react';
import '../styles/ConditionBuilder.css';

const OPERATORS = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' }
];

function ConditionBuilder({ rules, questions, currentQuestionKey, onChange }) {
    const [isExpanded, setIsExpanded] = useState(!!rules?.conditions?.length);

    // Get available questions for conditions (exclude current question and questions after it)
    const currentIndex = questions.findIndex(q => q.questionKey === currentQuestionKey);
    const availableQuestions = questions.filter((q, index) => index < currentIndex);

    const initializeRules = () => {
        if (!rules) {
            onChange({
                logic: 'AND',
                conditions: []
            });
        }
        setIsExpanded(true);
    };

    const addCondition = () => {
        if (!rules) {
            initializeRules();
            return;
        }

        const newCondition = {
            questionKey: availableQuestions[0]?.questionKey || '',
            operator: 'equals',
            value: ''
        };

        onChange({
            ...rules,
            conditions: [...(rules.conditions || []), newCondition]
        });
    };

    const updateCondition = (index, field, value) => {
        const newConditions = [...(rules?.conditions || [])];
        newConditions[index] = { ...newConditions[index], [field]: value };

        onChange({
            ...rules,
            conditions: newConditions
        });
    };

    const removeCondition = (index) => {
        const newConditions = rules.conditions.filter((_, i) => i !== index);

        if (newConditions.length === 0) {
            onChange(null);
            setIsExpanded(false);
        } else {
            onChange({
                ...rules,
                conditions: newConditions
            });
        }
    };

    const toggleLogic = () => {
        onChange({
            ...rules,
            logic: rules.logic === 'AND' ? 'OR' : 'AND'
        });
    };

    const clearRules = () => {
        onChange(null);
        setIsExpanded(false);
    };

    const getQuestionOptions = (questionKey) => {
        const question = questions.find(q => q.questionKey === questionKey);
        return question?.options || [];
    };

    const getQuestionType = (questionKey) => {
        const question = questions.find(q => q.questionKey === questionKey);
        return question?.type;
    };

    if (availableQuestions.length === 0) {
        return (
            <div className="condition-builder">
                <p className="no-conditions-available">
                    Add questions above this one to create conditional logic.
                </p>
            </div>
        );
    }

    if (!isExpanded && (!rules || !rules.conditions?.length)) {
        return (
            <div className="condition-builder">
                <button type="button" className="add-condition-btn" onClick={() => {
                    initializeRules();
                    addCondition();
                }}>
                    + Add Condition
                </button>
            </div>
        );
    }

    return (
        <div className="condition-builder expanded">
            <div className="conditions-header">
                <span className="conditions-label">
                    Show this question when
                </span>
                {rules?.conditions?.length > 1 && (
                    <button type="button" className="logic-toggle" onClick={toggleLogic}>
                        {rules.logic}
                    </button>
                )}
                <button type="button" className="clear-btn" onClick={clearRules}>
                    Clear
                </button>
            </div>

            <div className="conditions-list">
                {rules?.conditions?.map((condition, index) => {
                    const questionType = getQuestionType(condition.questionKey);
                    const options = getQuestionOptions(condition.questionKey);
                    const isSelectType = questionType === 'singleSelect' || questionType === 'multipleSelects';

                    return (
                        <div key={index} className="condition-row">
                            {index > 0 && (
                                <span className="logic-connector">{rules.logic}</span>
                            )}

                            <select
                                value={condition.questionKey}
                                onChange={(e) => updateCondition(index, 'questionKey', e.target.value)}
                                className="condition-question"
                            >
                                <option value="">Select question</option>
                                {availableQuestions.map(q => (
                                    <option key={q.questionKey} value={q.questionKey}>
                                        {q.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={condition.operator}
                                onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                                className="condition-operator"
                            >
                                {OPERATORS.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                            </select>

                            {isSelectType && options.length > 0 ? (
                                <select
                                    value={condition.value}
                                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                    className="condition-value"
                                >
                                    <option value="">Select value</option>
                                    {options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={condition.value}
                                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                    placeholder="Value"
                                    className="condition-value"
                                />
                            )}

                            <button
                                type="button"
                                className="remove-condition-btn"
                                onClick={() => removeCondition(index)}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>

            <button type="button" className="add-condition-btn" onClick={addCondition}>
                + Add Condition
            </button>
        </div>
    );
}

export default ConditionBuilder;
