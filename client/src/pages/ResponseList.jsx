import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ServerStatus from '../components/ServerStatus';
import Navigation from '../components/Navigation';
import { Download, Inbox, ArrowLeft } from 'lucide-react';

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
            <div className="min-h-screen bg-gray-50/80 backdrop-blur-[2px] relative z-10">
                <Navigation />
                <div className="text-center py-16 px-5">
                    <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading responses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50/80 backdrop-blur-[2px] relative z-10">
                <Navigation />
                <div className="flex items-center justify-center p-5 min-h-[calc(100vh-80px)]">
                    <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
                        <p className="text-red-600 mb-6">{error}</p>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/80 backdrop-blur-[2px] relative z-10">
            <Navigation />
            
            <main className="max-w-7xl mx-auto px-5 md:px-10 py-8">
                <div className="mb-6">
                    <Link 
                        to="/dashboard" 
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 m-0">Responses</h1>
                            <p className="text-gray-600 text-sm md:text-base mt-1">{form?.name}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-gray-600 text-sm font-medium">{responses.length} responses</span>
                            {responses.length > 0 && (
                                <div className="flex gap-2">
                                    <button
                                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                                        onClick={() => {
                                            const token = localStorage.getItem('token');
                                            window.open(`${import.meta.env.VITE_API_URL}/forms/${formId}/responses/export/csv?token=${token}`, '_blank');
                                        }}
                                    >
                                        <Download size={14} /> CSV
                                    </button>
                                    <button
                                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                                        onClick={() => {
                                            const token = localStorage.getItem('token');
                                            window.open(`${import.meta.env.VITE_API_URL}/forms/${formId}/responses/export/json?token=${token}`, '_blank');
                                        }}
                                    >
                                        <Download size={14} /> JSON
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {responses.length === 0 ? (
                    <div className="text-center py-16 px-5 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="text-indigo-600 mb-4 flex justify-center"><Inbox size={48} /></div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No responses yet</h2>
                        <p className="text-gray-600 mb-6">Share your form to start collecting responses</p>
                        <div className="flex gap-2 max-w-md mx-auto">
                            <input
                                type="text"
                                readOnly
                                value={`${window.location.origin}/form/${formId}`}
                                onClick={(e) => e.target.select()}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 cursor-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/form/${formId}`);
                                    alert('Link copied!');
                                }}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Submitted</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Preview</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {responses.map((response) => (
                                        <>
                                            <tr 
                                                key={response.id} 
                                                className={`hover:bg-gray-50 ${response.status === 'deletedInAirtable' ? 'opacity-60' : ''}`}
                                            >
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span title={response.airtableRecordId} className="font-mono">
                                                        {response.airtableRecordId.substring(0, 10)}...
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatDate(response.createdAt)}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        response.status === 'active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {response.status === 'active' ? 'Active' : 'Deleted in Airtable'}
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                    {response.answersPreview || 'No preview'}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium"
                                                        onClick={() => toggleExpand(response.id)}
                                                    >
                                                        {expandedResponse === response.id ? 'Hide' : 'View'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedResponse === response.id && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={5} className="px-4 md:px-6 py-6">
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Full Response</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                                {Object.entries(response.answers || {}).map(([key, value]) => (
                                                                    <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                                                                        <span className="block text-xs font-semibold text-gray-700 mb-1">{getQuestionLabel(key)}</span>
                                                                        <span className="text-sm text-gray-900">{formatAnswerValue(value)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
                                                                <span>Airtable Record ID: <span className="font-mono">{response.airtableRecordId}</span></span>
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
                    </div>
                )}
            </main>
            <ServerStatus />
        </div>
    );
}

export default ResponseList;
