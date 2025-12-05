import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ServerStatus from '../components/ServerStatus';
import '../styles/Dashboard.css';

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
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>My Forms</h1>
                </div>
                <div className="header-right">
                    <span className="user-info">
                        {user?.email || user?.name || 'User'}
                    </span>
                    <button className="logout-button" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="actions-bar">
                    <Link to="/forms/new" className="create-button">
                        + Create New Form
                    </Link>
                </div>

                {loading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading forms...</p>
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <p>{error}</p>
                        <button onClick={fetchForms}>Retry</button>
                    </div>
                )}

                {!loading && !error && forms.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h2>No forms yet</h2>
                        <p>Create your first form to get started</p>
                        <Link to="/forms/new" className="create-button">
                            Create Form
                        </Link>
                    </div>
                )}

                {!loading && !error && forms.length > 0 && (
                    <div className="forms-grid">
                        {forms.map(form => (
                            <div key={form._id} className="form-card">
                                <div className="form-card-header">
                                    <h3>{form.name}</h3>
                                    <span className={`status-badge ${form.isPublished ? 'published' : 'draft'}`}>
                                        {form.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>

                                <div className="form-card-body">
                                    <p className="form-description">
                                        {form.description || 'No description'}
                                    </p>
                                    <div className="form-meta">
                                        <span title="Airtable Base">
                                            📊 {form.airtableBaseName || 'Base'}
                                        </span>
                                        <span title="Airtable Table">
                                            📋 {form.airtableTableName || 'Table'}
                                        </span>
                                    </div>
                                    <p className="form-date">
                                        Created: {formatDate(form.createdAt)}
                                    </p>
                                </div>

                                <div className="form-card-actions">
                                    <Link to={`/form/${form._id}`} className="action-link view">
                                        View Form
                                    </Link>
                                    <Link to={`/forms/${form._id}/edit`} className="action-link edit">
                                        Edit
                                    </Link>
                                    <Link to={`/forms/${form._id}/responses`} className="action-link responses">
                                        Responses
                                    </Link>
                                    <button
                                        className="action-button delete"
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
        </div>
    );
}

export default Dashboard;
