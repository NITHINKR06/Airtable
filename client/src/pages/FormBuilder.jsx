import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ConditionBuilder from '../components/ConditionBuilder';
import ServerStatus from '../components/ServerStatus';
import '../styles/FormBuilder.css';

function FormBuilder() {
    const { formId } = useParams();
    const isEditing = !!formId;
    const navigate = useNavigate();
    const { user } = useAuth();

    // Form metadata
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');

    // Airtable selection
    const [bases, setBases] = useState([]);
    const [selectedBase, setSelectedBase] = useState(null);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [availableFields, setAvailableFields] = useState([]);

    // Form questions
    const [questions, setQuestions] = useState([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingBases, setLoadingBases] = useState(true);
    const [loadingTables, setLoadingTables] = useState(false);
    const [loadingFields, setLoadingFields] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fetch bases on mount
    useEffect(() => {
        fetchBases();
    }, []);

    // Fetch existing form if editing
    useEffect(() => {
        if (isEditing) {
            fetchForm();
        }
    }, [formId]);

    const fetchBases = async () => {
        try {
            setLoadingBases(true);
            const response = await api.get('/airtable/bases');
            setBases(response.data.bases || []);
        } catch (err) {
            console.error('Error fetching bases:', err);
            setError('Failed to load Airtable bases');
        } finally {
            setLoadingBases(false);
        }
    };

    const fetchForm = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/forms/${formId}`);
            const form = response.data.form;

            setFormName(form.name);
            setFormDescription(form.description || '');
            setSelectedBase({ id: form.airtableBaseId, name: form.airtableBaseName });
            setSelectedTable({ id: form.airtableTableId, name: form.airtableTableName });
            setQuestions(form.questions || []);

            // Fetch tables and fields for the selected base/table
            await fetchTables(form.airtableBaseId);
            await fetchFields(form.airtableBaseId, form.airtableTableId);
        } catch (err) {
            console.error('Error fetching form:', err);
            setError('Failed to load form');
        } finally {
            setLoading(false);
        }
    };

    const fetchTables = async (baseId) => {
        try {
            setLoadingTables(true);
            const response = await api.get(`/airtable/bases/${baseId}/tables`);
            setTables(response.data.tables || []);
        } catch (err) {
            console.error('Error fetching tables:', err);
            setError('Failed to load tables');
        } finally {
            setLoadingTables(false);
        }
    };

    const fetchFields = async (baseId, tableId) => {
        try {
            setLoadingFields(true);
            const response = await api.get(`/airtable/bases/${baseId}/tables/${tableId}/fields`);
            setAvailableFields(response.data.fields || []);
        } catch (err) {
            console.error('Error fetching fields:', err);
            setError('Failed to load fields');
        } finally {
            setLoadingFields(false);
        }
    };

    const handleBaseChange = async (e) => {
        const baseId = e.target.value;
        const base = bases.find(b => b.id === baseId);
        setSelectedBase(base || null);
        setSelectedTable(null);
        setTables([]);
        setAvailableFields([]);
        setQuestions([]);

        if (baseId) {
            await fetchTables(baseId);
        }
    };

    const handleTableChange = async (e) => {
        const tableId = e.target.value;
        const table = tables.find(t => t.id === tableId);
        setSelectedTable(table || null);
        setAvailableFields([]);
        setQuestions([]);

        if (tableId && selectedBase) {
            await fetchFields(selectedBase.id, tableId);
        }
    };

    const handleFieldSelect = (field) => {
        const exists = questions.find(q => q.airtableFieldId === field.id);

        if (exists) {
            // Remove field
            setQuestions(questions.filter(q => q.airtableFieldId !== field.id));
        } else {
            // Add field
            const newQuestion = {
                questionKey: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                airtableFieldId: field.id,
                airtableFieldName: field.name,
                label: field.name,
                type: field.type,
                options: field.options || [],
                required: false,
                conditionalRules: null
            };
            setQuestions([...questions, newQuestion]);
        }
    };

    const updateQuestion = (questionKey, updates) => {
        setQuestions(questions.map(q =>
            q.questionKey === questionKey ? { ...q, ...updates } : q
        ));
    };

    const removeQuestion = (questionKey) => {
        setQuestions(questions.filter(q => q.questionKey !== questionKey));
    };

    const moveQuestion = (index, direction) => {
        const newQuestions = [...questions];
        const newIndex = index + direction;

        if (newIndex < 0 || newIndex >= questions.length) return;

        [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
        setQuestions(newQuestions);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            alert('Please enter a form name');
            return;
        }

        if (!selectedBase || !selectedTable) {
            alert('Please select a base and table');
            return;
        }

        if (questions.length === 0) {
            alert('Please add at least one question');
            return;
        }

        try {
            setSaving(true);

            const formData = {
                name: formName,
                description: formDescription,
                airtableBaseId: selectedBase.id,
                airtableBaseName: selectedBase.name,
                airtableTableId: selectedTable.id,
                airtableTableName: selectedTable.name,
                questions
            };

            if (isEditing) {
                await api.put(`/forms/${formId}`, formData);
            } else {
                await api.post('/forms', formData);
            }

            navigate('/dashboard');
        } catch (err) {
            console.error('Error saving form:', err);
            alert(err.response?.data?.error?.message || 'Failed to save form');
        } finally {
            setSaving(false);
        }
    };

    const getFieldTypeLabel = (type) => {
        const labels = {
            singleLineText: 'Short Text',
            multilineText: 'Long Text',
            singleSelect: 'Single Select',
            multipleSelects: 'Multi Select',
            multipleAttachments: 'File Upload'
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="form-builder-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading form...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="form-builder-container">
            <header className="builder-header">
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
                <h1>{isEditing ? 'Edit Form' : 'Create New Form'}</h1>
            </header>

            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <main className="builder-main">
                {/* Form Details Section */}
                <section className="builder-section">
                    <h2>Form Details</h2>
                    <div className="form-group">
                        <label htmlFor="formName">Form Name *</label>
                        <input
                            id="formName"
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Enter form name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="formDescription">Description</label>
                        <textarea
                            id="formDescription"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Enter form description (optional)"
                            rows={3}
                        />
                    </div>
                </section>

                {/* Airtable Selection Section */}
                <section className="builder-section">
                    <h2>Airtable Connection</h2>

                    <div className="form-group">
                        <label htmlFor="baseSelect">Select Base *</label>
                        {loadingBases ? (
                            <p className="loading-text">Loading bases...</p>
                        ) : (
                            <select
                                id="baseSelect"
                                value={selectedBase?.id || ''}
                                onChange={handleBaseChange}
                                disabled={isEditing}
                            >
                                <option value="">-- Select a Base --</option>
                                {bases.map(base => (
                                    <option key={base.id} value={base.id}>{base.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {selectedBase && (
                        <div className="form-group">
                            <label htmlFor="tableSelect">Select Table *</label>
                            {loadingTables ? (
                                <p className="loading-text">Loading tables...</p>
                            ) : (
                                <select
                                    id="tableSelect"
                                    value={selectedTable?.id || ''}
                                    onChange={handleTableChange}
                                    disabled={isEditing}
                                >
                                    <option value="">-- Select a Table --</option>
                                    {tables.map(table => (
                                        <option key={table.id} value={table.id}>{table.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                </section>

                {/* Field Selection Section */}
                {selectedTable && (
                    <section className="builder-section">
                        <h2>Select Fields</h2>
                        <p className="section-help">
                            Click on fields to add them to your form. Only supported field types are shown.
                        </p>

                        {loadingFields ? (
                            <p className="loading-text">Loading fields...</p>
                        ) : availableFields.length === 0 ? (
                            <p className="empty-text">No supported fields found in this table.</p>
                        ) : (
                            <div className="fields-grid">
                                {availableFields.map(field => {
                                    const isSelected = questions.some(q => q.airtableFieldId === field.id);
                                    return (
                                        <div
                                            key={field.id}
                                            className={`field-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleFieldSelect(field)}
                                        >
                                            <span className="field-name">{field.name}</span>
                                            <span className="field-type">{getFieldTypeLabel(field.type)}</span>
                                            {isSelected && <span className="selected-badge">✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Questions Configuration Section */}
                {questions.length > 0 && (
                    <section className="builder-section">
                        <h2>Configure Questions</h2>
                        <p className="section-help">
                            Customize labels, mark as required, and add conditional logic.
                        </p>

                        <div className="questions-list">
                            {questions.map((question, index) => (
                                <div key={question.questionKey} className="question-config">
                                    <div className="question-header">
                                        <div className="question-order">
                                            <button
                                                className="order-btn"
                                                onClick={() => moveQuestion(index, -1)}
                                                disabled={index === 0}
                                            >
                                                ↑
                                            </button>
                                            <span>{index + 1}</span>
                                            <button
                                                className="order-btn"
                                                onClick={() => moveQuestion(index, 1)}
                                                disabled={index === questions.length - 1}
                                            >
                                                ↓
                                            </button>
                                        </div>
                                        <span className="question-type">{getFieldTypeLabel(question.type)}</span>
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeQuestion(question.questionKey)}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="question-body">
                                        <div className="form-group">
                                            <label>Label</label>
                                            <input
                                                type="text"
                                                value={question.label}
                                                onChange={(e) => updateQuestion(question.questionKey, { label: e.target.value })}
                                                placeholder="Question label"
                                            />
                                        </div>

                                        <div className="form-group checkbox-group">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={question.required}
                                                    onChange={(e) => updateQuestion(question.questionKey, { required: e.target.checked })}
                                                />
                                                Required
                                            </label>
                                        </div>

                                        {question.options?.length > 0 && (
                                            <div className="form-group">
                                                <label>Options</label>
                                                <div className="options-preview">
                                                    {question.options.join(', ')}
                                                </div>
                                            </div>
                                        )}

                                        <div className="form-group">
                                            <label>Conditional Logic</label>
                                            <ConditionBuilder
                                                rules={question.conditionalRules}
                                                questions={questions}
                                                currentQuestionKey={question.questionKey}
                                                onChange={(rules) => updateQuestion(question.questionKey, { conditionalRules: rules })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Actions */}
                <div className="builder-actions">
                    <button
                        className="cancel-button"
                        onClick={() => navigate('/dashboard')}
                    >
                        Cancel
                    </button>
                    <button
                        className="save-button"
                        onClick={handleSave}
                        disabled={saving || !formName || !selectedBase || !selectedTable || questions.length === 0}
                    >
                        {saving ? 'Saving...' : (isEditing ? 'Update Form' : 'Create Form')}
                    </button>
                </div>
            </main>
            <ServerStatus />
        </div>
    );
}

export default FormBuilder;
