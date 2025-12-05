import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './ResponsesList.css';

function ResponsesList() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(() => {
    api.get('/auth/me')
      .catch(() => {
        navigate('/');
      });
  }, [navigate]);

  const loadForm = useCallback(() => {
    if (!formId) return;
    api.get(`/forms/${formId}`)
      .then(response => {
        setForm(response.data);
      })
      .catch(error => {
        console.error('Error loading form:', error);
      });
  }, [formId]);

  const loadResponses = useCallback(() => {
    if (!formId) return;
    api.get(`/forms/${formId}/responses`)
      .then(response => {
        setResponses(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading responses:', error);
        setLoading(false);
      });
  }, [formId]);

  useEffect(() => {
    checkAuth();
    loadForm();
    loadResponses();
  }, [formId, checkAuth, loadForm, loadResponses]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getAnswerPreview = (answers) => {
    const keys = Object.keys(answers);
    if (keys.length === 0) return 'No answers';
    const firstKey = keys[0];
    const value = answers[firstKey];
    if (Array.isArray(value)) {
      return `${firstKey}: ${value.join(', ')}`;
    }
    return `${firstKey}: ${String(value).substring(0, 50)}`;
  };

  if (loading) {
    return <div className="loading">Loading responses...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Form Responses</h1>
        {form && <p>{form.formName}</p>}
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <div className="responses-list">
        {responses.length === 0 ? (
          <div className="card">
            <p>No responses yet.</p>
          </div>
        ) : (
          <table className="responses-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Answers Preview</th>
              </tr>
            </thead>
            <tbody>
              {responses.map(response => (
                <tr key={response.id}>
                  <td>{response.id.substring(0, 8)}...</td>
                  <td>{formatDate(response.createdAt)}</td>
                  <td>
                    <span className={`status ${response.status}`}>
                      {response.status}
                    </span>
                  </td>
                  <td>{getAnswerPreview(response.answers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ResponsesList;

