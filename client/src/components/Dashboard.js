import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    api.get('/auth/me')
      .then(response => {
        setUser(response.data);
        loadForms();
      })
      .catch(() => {
        navigate('/');
      });
  }, [navigate]);

  const loadForms = () => {
    api.get('/forms')
      .then(response => {
        setForms(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading forms:', error);
        setLoading(false);
      });
  };

  const handleLogout = () => {
    api.post('/auth/logout')
      .then(() => {
        navigate('/');
      })
      .catch(error => {
        console.error('Logout error:', error);
        navigate('/');
      });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Airtable Form Builder</h1>
        <nav>
          <span>Welcome, {user?.name || user?.email}</span>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ marginLeft: '20px' }}>
            Logout
          </button>
        </nav>
      </div>

      <div className="dashboard-actions">
        <button className="btn btn-primary" onClick={() => navigate('/forms/new')}>
          Create New Form
        </button>
      </div>

      <div className="forms-list">
        <h2>Your Forms</h2>
        {forms.length === 0 ? (
          <div className="card">
            <p>No forms yet. Create your first form to get started!</p>
          </div>
        ) : (
          forms.map(form => (
            <div key={form._id} className="card">
              <h3>{form.formName}</h3>
              <p>Questions: {form.questions.length}</p>
              <div className="form-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate(`/form/${form._id}`)}
                >
                  View Form
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate(`/forms/${form._id}/edit`)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate(`/forms/${form._id}/responses`)}
                >
                  View Responses
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;

