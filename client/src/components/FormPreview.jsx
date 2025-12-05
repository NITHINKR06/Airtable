import { useState, useEffect } from 'react';
import { shouldShowQuestion } from '../utils/conditionalLogic';
import FormField from './FormField';
import { X, Eye, EyeOff, RotateCcw } from 'lucide-react';

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

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

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

        if (!form?.questions) return errors;

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
        if (!form?.questions) return;

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
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8">
                {/* Modal */}
                <div className="relative w-full max-w-3xl max-h-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Eye size={18} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-semibold truncate">Form Preview</h2>
                                <p className="text-xs sm:text-sm text-white/80 hidden sm:block">See how your form looks to respondents</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* Toggle Conditional Info - Hidden on mobile */}
                            <button
                                onClick={() => setShowConditionalInfo(!showConditionalInfo)}
                                className={`hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${showConditionalInfo
                                        ? 'bg-white/30 text-white'
                                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                                    }`}
                                title="Toggle conditional logic info"
                            >
                                {showConditionalInfo ? <Eye size={14} /> : <EyeOff size={14} />}
                                <span className="hidden md:inline">Conditions</span>
                            </button>
                            {/* Reset Button */}
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-white/20 transition-colors"
                                title="Reset form"
                            >
                                <RotateCcw size={14} />
                                <span className="hidden sm:inline">Reset</span>
                            </button>
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                title="Close preview"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                        <div className="p-3 sm:p-4 md:p-6">
                            {/* Conditional Info Panel */}
                            {showConditionalInfo && hiddenQuestions.length > 0 && (
                                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <h3 className="text-xs sm:text-sm font-semibold text-amber-800 mb-1 sm:mb-2 flex items-center gap-2">
                                        <span>📋</span> Conditional Logic Active
                                    </h3>
                                    <p className="text-xs sm:text-sm text-amber-700 mb-2">
                                        {hiddenQuestions.length} question{hiddenQuestions.length > 1 ? 's are' : ' is'} hidden:
                                    </p>
                                    <ul className="text-xs sm:text-sm text-amber-600 list-disc list-inside space-y-0.5">
                                        {hiddenQuestions.slice(0, 5).map(q => (
                                            <li key={q.questionKey} className="truncate">{q.label}</li>
                                        ))}
                                        {hiddenQuestions.length > 5 && (
                                            <li className="text-amber-500">...and {hiddenQuestions.length - 5} more</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Form Preview Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <header className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200 bg-gray-50/50">
                                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1">
                                        {form?.name || 'Untitled Form'}
                                    </h1>
                                    {form?.description && (
                                        <p className="text-gray-600 text-xs sm:text-sm">{form.description}</p>
                                    )}
                                </header>

                                <form onSubmit={handlePreviewSubmit} className="px-4 sm:px-6 py-4 sm:py-6">
                                    {visibleQuestions.length === 0 ? (
                                        <div className="text-center py-8 sm:py-12 text-gray-500">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                                <Eye size={20} className="text-gray-400" />
                                            </div>
                                            <p className="text-sm sm:text-lg font-medium mb-1 sm:mb-2">No visible questions</p>
                                            <p className="text-xs sm:text-sm">Add questions to your form to see them here.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 sm:space-y-6">
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
                                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                                            <button
                                                type="submit"
                                                className="w-full px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                                            >
                                                Submit (Preview Only)
                                            </button>
                                            <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3">
                                                This is a preview. Submit will validate but won't save data.
                                            </p>
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Stats */}
                            <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <strong className="text-gray-900">{visibleQuestions.length}</strong>
                                    <span className="hidden xs:inline">visible</span> question{visibleQuestions.length !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                    <strong className="text-gray-900">{hiddenQuestions.length}</strong>
                                    <span className="hidden xs:inline">hidden</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <strong className="text-gray-900">{form?.questions?.filter(q => q.required).length || 0}</strong>
                                    required
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FormPreview;
