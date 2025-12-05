import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import './FormBuilder.css';

function FormBuilder() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [formName, setFormName] = useState('');
  const [questions, setQuestions] = useState([]);

  const checkAuth = useCallback(() => {
    api.get('/auth/me')
      .catch(() => {
        navigate('/');
      });
  }, [navigate]);

  const loadBases = useCallback(() => {
    api.get('/airtable/bases')
      .then(response => {
        setBases(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading bases:', error);
        setLoading(false);
      });
  }, []);

  const loadTables = useCallback((baseId) => {
    if (!baseId) return;
    api.get(`/airtable/bases/${baseId}/tables`)
      .then(response => {
        setTables(response.data);
      })
      .catch(error => {
        console.error('Error loading tables:', error);
      });
  }, []);

  const loadFields = useCallback((baseId, tableId) => {
    if (!baseId || !tableId) return;
    api.get(`/airtable/bases/${baseId}/tables/${tableId}/fields`)
      .then(response => {
        setFields(response.data);
      })
      .catch(error => {
        console.error('Error loading fields:', error);
      });
  }, []);

  const loadForm = useCallback(() => {
    if (!formId) return;
    api.get(`/forms/${formId}`)
      .then(response => {
        const form = response.data;
        setFormName(form.formName);
        setSelectedBase(form.airtableBaseId);
        loadTables(form.airtableBaseId);
        setSelectedTable(form.airtableTableId);
        setQuestions(form.questions);
        // Load fields after table is set
        setTimeout(() => {
          loadFields(form.airtableBaseId, form.airtableTableId);
        }, 500);
      })
      .catch(error => {
        console.error('Error loading form:', error);
      });
  }, [formId, loadTables, loadFields]);

  useEffect(() => {
    checkAuth();
    loadBases();
    if (formId) {
      loadForm();
    }
  }, [formId, checkAuth, loadBases, loadForm]);

  const handleBaseChange = (e) => {
    const baseId = e.target.value;
    setSelectedBase(baseId);
    setSelectedTable('');
    setFields([]);
    setQuestions([]);
    loadTables(baseId);
  };

  const handleTableChange = (e) => {
    const tableId = e.target.value;
    setSelectedTable(tableId);
    setQuestions([]);
    loadFields(selectedBase, tableId);
  };

  const toggleFieldSelection = (field) => {
    const questionKey = field.name.toLowerCase().replace(/\s+/g, '_');
    const existingIndex = questions.findIndex(q => q.airtableFieldId === field.id);

    if (existingIndex >= 0) {
      // Remove field
      setQuestions(questions.filter((_, i) => i !== existingIndex));
    } else {
      // Add field
      const newQuestion = {
        questionKey,
        airtableFieldId: field.id,
        label: field.name,
        type: mapAirtableType(field.type),
        required: false,
        conditionalRules: null,
        options: field.options?.choices?.map(c => c.name) || []
      };
      setQuestions([...questions, newQuestion]);
    }
  };

  const mapAirtableType = (airtableType) => {
    const typeMap = {
      'singleLineText': 'singleLineText',
      'multilineText': 'multilineText',
      'singleSelect': 'singleSelect',
      'multipleSelects': 'multipleSelects',
      'multipleAttachments': 'multipleAttachments'
    };
    return typeMap[airtableType] || 'singleLineText';
  };

  const updateQuestion = (index, updates) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const addCondition = (questionIndex) => {
    const question = questions[questionIndex];
    const newCondition = {
      questionKey: questions[0]?.questionKey || '',
      operator: 'equals',
      value: ''
    };
    const existingRules = question.conditionalRules || { logic: 'AND', conditions: [] };
    existingRules.conditions.push(newCondition);
    updateQuestion(questionIndex, { conditionalRules: existingRules });
  };

  const removeCondition = (questionIndex, conditionIndex) => {
    const question = questions[questionIndex];
    const rules = question.conditionalRules;
    if (rules && rules.conditions) {
      rules.conditions.splice(conditionIndex, 1);
      if (rules.conditions.length === 0) {
        updateQuestion(questionIndex, { conditionalRules: null });
      } else {
        updateQuestion(questionIndex, { conditionalRules: rules });
      }
    }
  };

  const handleSave = () => {
    if (!selectedBase || !selectedTable || questions.length === 0) {
      alert('Please select a base, table, and add at least one question');
      return;
    }

    const formData = {
      airtableBaseId: selectedBase,
      airtableTableId: selectedTable,
      formName: formName || 'Untitled Form',
      questions
    };

    const request = formId
      ? api.put(`/forms/${formId}`, formData)
      : api.post('/forms', formData);

    request
      .then(() => {
        navigate('/dashboard');
      })
      .catch(error => {
        console.error('Error saving form:', error);
        alert('Failed to save form');
      });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>{formId ? 'Edit Form' : 'Create New Form'}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <div className="card">
        <div className="form-group">
          <label>Form Name</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Enter form name"
          />
        </div>

        <div className="form-group">
          <label>Select Airtable Base</label>
          <select value={selectedBase} onChange={handleBaseChange}>
            <option value="">-- Select Base --</option>
            {bases.map(base => (
              <option key={base.id} value={base.id}>{base.name}</option>
            ))}
          </select>
        </div>

        {selectedBase && (
          <div className="form-group">
            <label>Select Table</label>
            <select value={selectedTable} onChange={handleTableChange}>
              <option value="">-- Select Table --</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>{table.name}</option>
              ))}
            </select>
          </div>
        )}

        {fields.length > 0 && (
          <div className="form-group">
            <label>Select Fields for Form</label>
            <div className="fields-list">
              {fields.map(field => {
                const isSelected = questions.some(q => q.airtableFieldId === field.id);
                return (
                  <div key={field.id} className="field-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFieldSelection(field)}
                      />
                      {field.name} ({field.type})
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {questions.length > 0 && (
          <div className="questions-section">
            <h3>Configure Questions</h3>
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="question-card">
                <div className="form-group">
                  <label>Question Label</label>
                  <input
                    type="text"
                    value={question.label}
                    onChange={(e) => updateQuestion(qIndex, { label: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                    />
                    Required
                  </label>
                </div>

                <div className="conditional-logic">
                  <h4>Conditional Logic (Show this question if...)</h4>
                  {question.conditionalRules && (
                    <div className="form-group">
                      <label>Logic Operator</label>
                      <select
                        value={question.conditionalRules.logic}
                        onChange={(e) => {
                          const rules = { ...question.conditionalRules, logic: e.target.value };
                          updateQuestion(qIndex, { conditionalRules: rules });
                        }}
                      >
                        <option value="AND">AND (all conditions must be true)</option>
                        <option value="OR">OR (any condition can be true)</option>
                      </select>
                    </div>
                  )}

                  {question.conditionalRules?.conditions?.map((condition, cIndex) => (
                    <div key={cIndex} className="condition-item">
                      <select
                        value={condition.questionKey}
                        onChange={(e) => {
                          const updated = [...question.conditionalRules.conditions];
                          updated[cIndex].questionKey = e.target.value;
                          updateQuestion(qIndex, {
                            conditionalRules: { ...question.conditionalRules, conditions: updated }
                          });
                        }}
                      >
                        <option value="">-- Select Question --</option>
                        {questions.filter((_, i) => i !== qIndex).map((q, i) => (
                          <option key={i} value={q.questionKey}>{q.label}</option>
                        ))}
                      </select>

                      <select
                        value={condition.operator}
                        onChange={(e) => {
                          const updated = [...question.conditionalRules.conditions];
                          updated[cIndex].operator = e.target.value;
                          updateQuestion(qIndex, {
                            conditionalRules: { ...question.conditionalRules, conditions: updated }
                          });
                        }}
                      >
                        <option value="equals">equals</option>
                        <option value="notEquals">not equals</option>
                        <option value="contains">contains</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Value"
                        value={condition.value}
                        onChange={(e) => {
                          const updated = [...question.conditionalRules.conditions];
                          updated[cIndex].value = e.target.value;
                          updateQuestion(qIndex, {
                            conditionalRules: { ...question.conditionalRules, conditions: updated }
                          });
                        }}
                      />

                      <button
                        className="btn btn-secondary"
                        onClick={() => removeCondition(qIndex, cIndex)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    className="btn btn-secondary"
                    onClick={() => addCondition(qIndex)}
                  >
                    Add Condition
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-primary" onClick={handleSave}>
          Save Form
        </button>
      </div>
    </div>
  );
}

export default FormBuilder;

