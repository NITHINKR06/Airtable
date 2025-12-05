import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { uploadFiles } from '../api/client';
import { shouldShowQuestion } from '../utils/conditionalLogic';
import FormField from '../components/FormField';
import ServerStatus from '../components/ServerStatus';

function FormViewer() {
    const { formId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetchForm();
    }, [formId]);

    const fetchForm = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/forms/${formId}`);
            setForm(response.data.form);

            // Initialize answers
            const initialAnswers = {};
            response.data.form.questions.forEach(q => {
                if (q.type === 'multipleSelects' || q.type === 'multipleAttachments') {
                    initialAnswers[q.questionKey] = [];
                } else {
                    initialAnswers[q.questionKey] = '';
                }
            });
            setAnswers(initialAnswers);
        } catch (err) {
            console.error('Error fetching form:', err);
            setError('Failed to load form. It may not exist or you may not have access.');
        } finally {
            setLoading(false);
        }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        // Filter answers to only include visible questions
        const filteredAnswers = {};
        form.questions.forEach(question => {
            if (shouldShowQuestion(question.conditionalRules, answers)) {
                const answer = answers[question.questionKey];
                if (answer !== undefined && answer !== null && answer !== '' &&
                    !(Array.isArray(answer) && answer.length === 0)) {
                    filteredAnswers[question.questionKey] = answer;
                }
            }
        });

        try {
            setSubmitting(true);
            setError(null);

            // Upload files for attachment fields
            const processedAnswers = { ...filteredAnswers };

            for (const [questionKey, answer] of Object.entries(processedAnswers)) {
                // Find the question to check its type
                const question = form.questions.find(q => q.questionKey === questionKey);

                if (question?.type === 'multipleAttachments' && Array.isArray(answer)) {
                    // Extract File objects from attachments
                    const files = answer
                        .filter(att => att.file instanceof File)
                        .map(att => att.file);

                    if (files.length > 0) {
                        // Upload files to server
                        const uploadedFiles = await uploadFiles(files);

                        // Replace with uploaded file URLs
                        processedAnswers[questionKey] = uploadedFiles;
                    }
                }
            }

            await api.post(`/forms/${formId}/submit`, { answers: processedAnswers });
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting form:', err);
            const errorMessage = err.response?.data?.error?.message || 'Failed to submit form';
            const errorDetails = err.response?.data?.error?.details;

            if (errorDetails) {
                setError(`${errorMessage}: ${Array.isArray(errorDetails) ? errorDetails.join(', ') : errorDetails}`);
            } else {
                setError(errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-[2px] relative z-10">
                <div className="w-12 h-12 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 text-sm">Loading...</p>
            </div>
        );
    }

    if (error && !form) {
        return (
            <div className="min-h-screen bg-gray-50/80 backdrop-blur-[2px] flex items-center justify-center p-5 relative z-10">
                <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
                    <p className="text-red-600 mb-6">{error}</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50/80 backdrop-blur-[2px] flex items-center justify-center p-5 relative z-10">
                <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-10 max-w-md">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-green-600 text-3xl font-bold">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
                    <p className="text-gray-600 mb-6">Your response has been submitted successfully.</p>
                    <button 
                        onClick={() => {
                            setSubmitted(false);
                            setAnswers({});
                            form.questions.forEach(q => {
                                if (q.type === 'multipleSelects' || q.type === 'multipleAttachments') {
                                    setAnswers(prev => ({ ...prev, [q.questionKey]: [] }));
                                } else {
                                    setAnswers(prev => ({ ...prev, [q.questionKey]: '' }));
                                }
                            });
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                    >
                        Submit Another Response
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/80 backdrop-blur-[2px] py-8 md:py-12 px-5 relative z-10">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <header className="px-6 md:px-8 py-6 md:py-8 border-b border-gray-200">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{form.name}</h1>
                    {form.description && <p className="text-gray-600 text-sm md:text-base">{form.description}</p>}
                </header>

                {error && (
                    <div className="bg-red-50 border-b border-red-200 text-red-800 px-6 md:px-8 py-3 flex justify-between items-center">
                        <span>{error}</span>
                        <button 
                            onClick={() => setError(null)}
                            className="bg-transparent border-0 text-red-800 text-xl cursor-pointer hover:text-red-900"
                        >
                            ×
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="px-6 md:px-8 py-6 md:py-8">
                    <div className="space-y-6">
                        {form.questions.map((question, index) => {
                            const isVisible = shouldShowQuestion(question.conditionalRules, answers);

                            if (!isVisible) {
                                return null;
                            }

                            return (
                                <FormField
                                    key={question.questionKey}
                                    question={question}
                                    value={answers[question.questionKey]}
                                    onChange={(value) => handleAnswerChange(question.questionKey, value)}
                                    error={validationErrors[question.questionKey]}
                                />
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            className="w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md"
                            disabled={submitting}
                        >
                            {submitting ? 'Uploading & Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
            <ServerStatus />
        </div>
    );
}

export default FormViewer;
