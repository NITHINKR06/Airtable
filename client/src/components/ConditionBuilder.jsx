import { useState } from 'react';

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
            <div className="mt-2">
                <p className="text-gray-400 text-xs italic m-0">
                    Add questions above this one to create conditional logic.
                </p>
            </div>
        );
    }

    if (!isExpanded && (!rules || !rules.conditions?.length)) {
        return (
            <div className="mt-2">
                <button 
                    type="button" 
                    className="px-4 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-600 text-sm cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700" 
                    onClick={() => {
                        initializeRules();
                        addCondition();
                    }}
                >
                    + Add Condition
                </button>
            </div>
        );
    }

    return (
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3.5 mb-3.5">
                <span className="text-xs text-gray-600 flex-1">
                    Show this question when
                </span>
                {rules?.conditions?.length > 1 && (
                    <button 
                        type="button" 
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold cursor-pointer hover:bg-indigo-700 transition-colors" 
                        onClick={toggleLogic}
                    >
                        {rules.logic}
                    </button>
                )}
                <button 
                    type="button" 
                    className="px-2.5 py-1 bg-red-50 text-red-700 rounded text-xs cursor-pointer hover:bg-red-100 transition-colors" 
                    onClick={clearRules}
                >
                    Clear
                </button>
            </div>

            <div className="flex flex-col gap-2.5 mb-3.5">
                {rules?.conditions?.map((condition, index) => {
                    const questionType = getQuestionType(condition.questionKey);
                    const options = getQuestionOptions(condition.questionKey);
                    const isSelectType = questionType === 'singleSelect' || questionType === 'multipleSelects';

                    return (
                        <div key={index} className="flex items-center gap-3 flex-wrap">
                            {index > 0 && (
                                <span className="text-xs text-indigo-600 font-semibold px-2 py-1 bg-indigo-50 rounded">{rules.logic}</span>
                            )}

                            <select
                                value={condition.questionKey}
                                onChange={(e) => updateCondition(index, 'questionKey', e.target.value)}
                                className="flex-1 min-w-[140px] px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-400 transition-colors cursor-pointer"
                            >
                                <option value="" className="text-gray-400">Select question</option>
                                {availableQuestions.map(q => (
                                    <option key={q.questionKey} value={q.questionKey} className="text-gray-900">
                                        {q.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={condition.operator}
                                onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                                className="w-[120px] px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-400 transition-colors cursor-pointer"
                            >
                                {OPERATORS.map(op => (
                                    <option key={op.value} value={op.value} className="text-gray-900">{op.label}</option>
                                ))}
                            </select>

                            {isSelectType && options.length > 0 ? (
                                <select
                                    value={condition.value}
                                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                    className="flex-1 min-w-[100px] px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-400 transition-colors cursor-pointer"
                                >
                                    <option value="" className="text-gray-400">Select value</option>
                                    {options.map(opt => (
                                        <option key={opt} value={opt} className="text-gray-900">{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={condition.value}
                                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                    placeholder="Value"
                                    className="flex-1 min-w-[100px] px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                                />
                            )}

                            <button
                                type="button"
                                className="w-7 h-7 flex items-center justify-center bg-red-50 border-0 rounded text-red-700 cursor-pointer text-base flex-shrink-0 hover:bg-red-100 transition-colors"
                                onClick={() => removeCondition(index)}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>

            <button 
                type="button" 
                className="px-4 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-600 text-sm cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700" 
                onClick={addCondition}
            >
                + Add Condition
            </button>
        </div>
    );
}

export default ConditionBuilder;
