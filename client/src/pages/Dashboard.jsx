import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ServerStatus from '../components/ServerStatus';
import Navigation from '../components/Navigation';
import { ClipboardList, Database, Table2, Plus } from 'lucide-react';

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const response = await api.get('/forms');
            setForms(response.data.forms || []);
        } catch (err) {
            console.error('Error fetching forms:', err);
            setError('Failed to load forms');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteForm = async (formId) => {
        if (!window.confirm('Are you sure you want to delete this form?')) {
            return;
        }

        try {
            await api.delete(`/forms/${formId}`);
            setForms(forms.filter(f => f._id !== formId));
        } catch (err) {
            console.error('Error deleting form:', err);
            alert('Failed to delete form');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50/80 backdrop-blur-[2px] relative z-10">
            <Navigation />
            
            <main className="max-w-7xl mx-auto px-5 md:px-10 py-8 md:py-10">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Forms</h1>
                    <Link 
                        to="/forms/new" 
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm md:text-base transition-all duration-200 hover:bg-indigo-700 shadow-sm hover:shadow-md"
                    >
                        <Plus size={18} />
                        Create New Form
                    </Link>
                </div>

                {loading && (
                    <div className="text-center py-16 px-5 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading forms...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-16 px-5 bg-white rounded-xl shadow-sm border border-gray-200">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button 
                            onClick={fetchForms}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && forms.length === 0 && (
                    <div className="text-center py-16 px-5 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="text-indigo-600 mb-4 flex justify-center"><ClipboardList size={48} /></div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No forms yet</h2>
                        <p className="text-gray-600 mb-6">Create your first form to get started</p>
                        <Link 
                            to="/forms/new" 
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            Create Form
                        </Link>
                    </div>
                )}

                {!loading && !error && forms.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                        {forms.map(form => (
                            <div key={form._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                                <div className="p-5 md:p-6 flex justify-between items-start border-b border-gray-100">
                                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 m-0 pr-2">{form.name}</h3>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                                        form.isPublished 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {form.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>

                                <div className="p-5 md:p-6">
                                    <p className="text-gray-600 text-sm mb-4 min-h-[2.5rem]">
                                        {form.description || 'No description'}
                                    </p>
                                    <div className="flex gap-4 mb-3">
                                        <span className="text-gray-500 text-xs flex items-center gap-1" title="Airtable Base">
                                            <Database size={14} /> {form.airtableBaseName || 'Base'}
                                        </span>
                                        <span className="text-gray-500 text-xs flex items-center gap-1" title="Airtable Table">
                                            <Table2 size={14} /> {form.airtableTableName || 'Table'}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs m-0">
                                        Created: {formatDate(form.createdAt)}
                                    </p>
                                </div>

                                <div className="px-5 md:px-6 py-4 bg-gray-50 flex gap-3 flex-wrap">
                                    <Link 
                                        to={`/form/${form._id}`} 
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors hover:bg-indigo-700"
                                    >
                                        View Form
                                    </Link>
                                    <Link 
                                        to={`/forms/${form._id}/edit`} 
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors hover:bg-gray-300"
                                    >
                                        Edit
                                    </Link>
                                    <Link 
                                        to={`/forms/${form._id}/responses`} 
                                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors hover:bg-purple-200"
                                    >
                                        Responses
                                    </Link>
                                    <button
                                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium transition-colors hover:bg-red-100 border-0 cursor-pointer"
                                        onClick={() => handleDeleteForm(form._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <ServerStatus />
        </div>
    );
}

export default Dashboard;
