import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { shouldShowQuestion } from '../utils/conditionalLogic';
import './FormViewer.css';

function FormViewer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadForm = useCallback(() => {
    if (!formId) return;
    api.get(`/forms/${formId}`)
      .then(response => {
        setForm(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading form:', error);
        setError('Failed to load form');
        setLoading(false);
      });
  }, [formId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const updateAnswer = (questionKey, value) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionKey]: value };
      // Re-evaluate visible questions when answers change
      return updated;
    });
  };

  const isQuestionVisible = (question) => {
    if (!question.conditionalRules) return true;
    return shouldShowQuestion(question.conditionalRules, answers);
  };

  const getVisibleQuestions = () => {
    if (!form) return [];
    return form.questions.filter(q => isQuestionVisible(q));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validate required fields
    const visibleQuestions = getVisibleQuestions();
    const missingFields = visibleQuestions
      .filter(q => q.required && (!answers[q.questionKey] || answers[q.questionKey] === ''))
      .map(q => q.label);

    if (missingFields.length > 0) {
      setError(`Please fill in required fields: ${missingFields.join(', ')}`);
      setSubmitting(false);
      return;
    }

    api.post(`/forms/${formId}/submit`, { answers })
      .then(() => {
        alert('Form submitted successfully!');
        navigate('/dashboard');
      })
      .catch(error => {
        setError(error.response?.data?.error || 'Failed to submit form');
        setSubmitting(false);
      });
  };

  const renderQuestion = (question) => {
    const value = answers[question.questionKey] || '';

    switch (question.type) {
      case 'singleLineText':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateAnswer(question.questionKey, e.target.value)}
            required={question.required}
          />
        );

      case 'multilineText':
        return (
          <textarea
            value={value}
            onChange={(e) => updateAnswer(question.questionKey, e.target.value)}
            required={question.required}
          />
        );

      case 'singleSelect':
        return (
          <select
            value={value}
            onChange={(e) => updateAnswer(question.questionKey, e.target.value)}
            required={question.required}
          >
            <option value="">-- Select --</option>
            {question.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'multipleSelects':
        const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
        return (
          <div className="multi-select">
            {question.options.map(option => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option);
                    updateAnswer(question.questionKey, newValues);
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'multipleAttachments':
        return (
          <input
            type="file"
            multiple
            onChange={(e) => {
              // For file uploads, you'd need to handle file upload to a server first
              // This is a simplified version
              const files = Array.from(e.target.files);
              updateAnswer(question.questionKey, files.map(f => f.name));
            }}
            required={question.required}
          />
        );

      default:
        return <input type="text" value={value} onChange={(e) => updateAnswer(question.questionKey, e.target.value)} />;
    }
  };

  if (loading) {
    return <div className="loading">Loading form...</div>;
  }

  if (!form) {
    return <div className="error">Form not found</div>;
  }

  const visibleQuestions = getVisibleQuestions();

  return (
    <div className="container">
      <div className="header">
        <h1>{form.formName}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-viewer">
        {error && <div className="error">{error}</div>}

        {visibleQuestions.map((question, index) => (
          <div key={index} className="form-group">
            <label>
              {question.label}
              {question.required && <span className="required">*</span>}
            </label>
            {renderQuestion(question)}
          </div>
        ))}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Form'}
        </button>
      </form>
    </div>
  );
}

export default FormViewer;

