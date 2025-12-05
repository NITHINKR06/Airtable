import { useState, useEffect } from 'react';
import { shouldShowQuestion } from '../utils/conditionalLogic';
import FormField from './FormField';
import { X, Eye, EyeOff } from 'lucide-react';

/**
 * FormPreview Component
 * Displays a live preview of the form as it would appear to end-users.
 * Supports conditional logic evaluation in real-time.
 */
function FormPreview({ form, isOpen, onClose }) {
    const [answers, setAnswers] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [showConditionalInfo, setShowConditionalInfo] = useState(true);

    // Reset answers when form changes or modal opens
    useEffect(() => {
        if (isOpen && form?.questions) {
            const initialAnswers = {};
            form.questions.forEach(q => {
                if (q.type === 'multipleSelects' || q.type === 'multipleAttachments') {
                    initialAnswers[q.questionKey] = [];
                } else {
                    initialAnswers[q.questionKey] = '';
                }
            });
            setAnswers(initialAnswers);
            setValidationErrors({});
        }
    }, [isOpen, form]);

    const handleAnswerChange = (questionKey, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionKey]: value
        }));

        // Clear validation error for this field
        if (validationErrors[questionKey]) {
            setValidationErrors(prev => {
                const next = { ...prev };
                delete next[questionKey];
                return next;
            });
        }
    };

    const validateForm = () => {
        const errors = {};

        form.questions.forEach(question => {
            // Only validate visible questions
            if (!shouldShowQuestion(question.conditionalRules, answers)) {
                return;
            }

            if (question.required) {
                const answer = answers[question.questionKey];

                if (answer === undefined || answer === null || answer === '') {
                    errors[question.questionKey] = `${question.label} is required`;
                } else if (Array.isArray(answer) && answer.length === 0) {
                    errors[question.questionKey] = `${question.label} is required`;
                }
            }
        });

        return errors;
    };

    const handlePreviewSubmit = (e) => {
        e.preventDefault();

        // Validate
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        // Show success message (in preview mode, don't actually submit)
        alert('✅ Form validation passed! In live mode, this would submit the response.');
    };

    const handleReset = () => {
        const initialAnswers = {};
        form.questions.forEach(q => {
            if (q.type === 'multipleSelects' || q.type === 'multipleAttachments') {
                initialAnswers[q.questionKey] = [];
            } else {
                initialAnswers[q.questionKey] = '';
            }
        });
        setAnswers(initialAnswers);
        setValidationErrors({});
    };

    if (!isOpen) return null;

    const visibleQuestions = form?.questions?.filter(q =>
        shouldShowQuestion(q.conditionalRules, answers)
    ) || [];

    const hiddenQuestions = form?.questions?.filter(q =>
        !shouldShowQuestion(q.conditionalRules, answers)
    ) || [];

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-gray-50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Eye size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Form Preview</h2>
                            <p className="text-sm text-gray-500">See how your form looks to respondents</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowConditionalInfo(!showConditionalInfo)}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showConditionalInfo
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            title="Toggle conditional logic info"
                        >
                            {showConditionalInfo ? <Eye size={16} /> : <EyeOff size={16} />}
                            Conditional Info
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-2xl mx-auto">
                        {/* Conditional Info Panel */}
                        {showConditionalInfo && hiddenQuestions.length > 0 && (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <h3 className="text-sm font-semibold text-amber-800 mb-2">
                                    📋 Conditional Logic Active
                                </h3>
                                <p className="text-sm text-amber-700 mb-2">
                                    {hiddenQuestions.length} question{hiddenQuestions.length > 1 ? 's are' : ' is'} currently hidden based on your answers:
                                </p>
                                <ul className="text-sm text-amber-600 list-disc list-inside">
                                    {hiddenQuestions.map(q => (
                                        <li key={q.questionKey}>{q.label}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Form Preview Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <header className="px-6 md:px-8 py-6 md:py-8 border-b border-gray-200">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                    {form?.name || 'Untitled Form'}
                                </h1>
                                {form?.description && (
                                    <p className="text-gray-600 text-sm md:text-base">{form.description}</p>
                                )}
                            </header>

                            <form onSubmit={handlePreviewSubmit} className="px-6 md:px-8 py-6 md:py-8">
                                {visibleQuestions.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Eye size={24} className="text-gray-400" />
                                        </div>
                                        <p className="text-lg font-medium mb-2">No visible questions</p>
                                        <p className="text-sm">Add questions to your form to see them here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {visibleQuestions.map((question) => (
                                            <FormField
                                                key={question.questionKey}
                                                question={question}
                                                value={answers[question.questionKey]}
                                                onChange={(value) => handleAnswerChange(question.questionKey, value)}
                                                error={validationErrors[question.questionKey]}
                                            />
                                        ))}
                                    </div>
                                )}

                                {visibleQuestions.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <button
                                            type="submit"
                                            className="w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                        >
                                            Submit (Preview Only)
                                        </button>
                                        <p className="text-center text-xs text-gray-500 mt-3">
                                            This is a preview. Clicking submit will validate the form but won't save any data.
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Stats */}
                        <div className="mt-6 flex justify-center gap-6 text-sm text-gray-500">
                            <span>
                                <strong className="text-gray-900">{visibleQuestions.length}</strong> visible question{visibleQuestions.length !== 1 ? 's' : ''}
                            </span>
                            <span>
                                <strong className="text-gray-900">{hiddenQuestions.length}</strong> hidden by conditions
                            </span>
                            <span>
                                <strong className="text-gray-900">{form?.questions?.filter(q => q.required).length || 0}</strong> required
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FormPreview;
