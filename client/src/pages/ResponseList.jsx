import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import '../styles/ResponseList.css';

function ResponseList() {
    const { formId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [form, setForm] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedResponse, setExpandedResponse] = useState(null);

    useEffect(() => {
        fetchData();
    }, [formId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch form details
            const formResponse = await api.get(`/forms/${formId}`);
            setForm(formResponse.data.form);

            // Fetch responses
            const responsesResponse = await api.get(`/forms/${formId}/responses`);
            setResponses(responsesResponse.data.responses || []);
        } catch (err) {
            console.error('Error fetching data:', err);
            if (err.response?.status === 403) {
                setError('You do not have permission to view these responses');
            } else if (err.response?.status === 404) {
                setError('Form not found');
            } else {
                setError('Failed to load responses');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getQuestionLabel = (questionKey) => {
        if (!form) return questionKey;
        const question = form.questions.find(q => q.questionKey === questionKey);
        return question?.label || questionKey;
    };

    const formatAnswerValue = (value) => {
        if (value === null || value === undefined) return '-';
        if (Array.isArray(value)) {
            if (value.length === 0) return '-';
            // Check if it's attachments
            if (value[0]?.url) {
                return `${value.length} file(s)`;
            }
            return value.join(', ');
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return String(value);
    };

    const toggleExpand = (responseId) => {
        setExpandedResponse(expandedResponse === responseId ? null : responseId);
    };

    if (loading) {
        return (
            <div className="response-list-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading responses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="response-list-container">
                <div className="error-state">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="response-list-container">
            <header className="response-header">
                <div className="header-left">
                    <Link to="/dashboard" className="back-link">← Back</Link>
                    <div>
                        <h1>Responses</h1>
                        <p className="form-name">{form?.name}</p>
                    </div>
                </div>
                <div className="header-right">
                    <span className="response-count">{responses.length} responses</span>
                    {responses.length > 0 && (
                        <div className="export-buttons">
                            <button
                                className="export-btn"
                                onClick={() => {
                                    const token = localStorage.getItem('token');
                                    window.open(`${import.meta.env.VITE_API_URL}/forms/${formId}/responses/export/csv?token=${token}`, '_blank');
                                }}
                            >
                                📥 CSV
                            </button>
                            <button
                                className="export-btn"
                                onClick={() => {
                                    const token = localStorage.getItem('token');
                                    window.open(`${import.meta.env.VITE_API_URL}/forms/${formId}/responses/export/json?token=${token}`, '_blank');
                                }}
                            >
                                📥 JSON
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="response-main">
                {responses.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h2>No responses yet</h2>
                        <p>Share your form to start collecting responses</p>
                        <div className="share-link">
                            <input
                                type="text"
                                readOnly
                                value={`${window.location.origin}/form/${formId}`}
                                onClick={(e) => e.target.select()}
                            />
                            <button onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/form/${formId}`);
                                alert('Link copied!');
                            }}>
                                Copy Link
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="responses-table-container">
                        <table className="responses-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Submitted</th>
                                    <th>Status</th>
                                    <th>Preview</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {responses.map((response) => (
                                    <>
                                        <tr key={response.id} className={response.status === 'deletedInAirtable' ? 'deleted' : ''}>
                                            <td className="id-cell">
                                                <span title={response.airtableRecordId}>
                                                    {response.airtableRecordId.substring(0, 10)}...
                                                </span>
                                            </td>
                                            <td>{formatDate(response.createdAt)}</td>
                                            <td>
                                                <span className={`status-badge ${response.status}`}>
                                                    {response.status === 'active' ? 'Active' : 'Deleted in Airtable'}
                                                </span>
                                            </td>
                                            <td className="preview-cell">
                                                {response.answersPreview || 'No preview'}
                                            </td>
                                            <td>
                                                <button
                                                    className="expand-btn"
                                                    onClick={() => toggleExpand(response.id)}
                                                >
                                                    {expandedResponse === response.id ? 'Hide' : 'View'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedResponse === response.id && (
                                            <tr className="expanded-row">
                                                <td colSpan={5}>
                                                    <div className="response-details">
                                                        <h4>Full Response</h4>
                                                        <div className="answers-grid">
                                                            {Object.entries(response.answers || {}).map(([key, value]) => (
                                                                <div key={key} className="answer-item">
                                                                    <span className="answer-label">{getQuestionLabel(key)}</span>
                                                                    <span className="answer-value">{formatAnswerValue(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="response-meta">
                                                            <span>Airtable Record ID: {response.airtableRecordId}</span>
                                                            <span>Updated: {formatDate(response.updatedAt)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ResponseList;
