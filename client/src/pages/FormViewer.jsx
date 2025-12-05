import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { shouldShowQuestion } from '../utils/conditionalLogic';
import FormField from '../components/FormField';
import ServerStatus from '../components/ServerStatus';
import '../styles/FormViewer.css';

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
            await api.post(`/forms/${formId}/submit`, { answers: filteredAnswers });
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
            <div className="form-viewer-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading form...</p>
                </div>
            </div>
        );
    }

    if (error && !form) {
        return (
            <div className="form-viewer-container">
                <div className="error-state">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')}>Go Home</button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="form-viewer-container">
                <div className="success-state">
                    <div className="success-icon">✓</div>
                    <h2>Thank You!</h2>
                    <p>Your response has been submitted successfully.</p>
                    <button onClick={() => {
                        setSubmitted(false);
                        setAnswers({});
                        form.questions.forEach(q => {
                            if (q.type === 'multipleSelects' || q.type === 'multipleAttachments') {
                                setAnswers(prev => ({ ...prev, [q.questionKey]: [] }));
                            } else {
                                setAnswers(prev => ({ ...prev, [q.questionKey]: '' }));
                            }
                        });
                    }}>
                        Submit Another Response
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="form-viewer-container">
            <div className="form-viewer-card">
                <header className="form-header">
                    <h1>{form.name}</h1>
                    {form.description && <p className="form-description">{form.description}</p>}
                </header>

                {error && (
                    <div className="error-banner">
                        {error}
                        <button onClick={() => setError(null)}>×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-body">
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

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="submit-button"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
            <ServerStatus />
        </div>
    );
}

export default FormViewer;
