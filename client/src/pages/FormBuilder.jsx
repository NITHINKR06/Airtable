import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ConditionBuilder from '../components/ConditionBuilder';
import ServerStatus from '../components/ServerStatus';
import Navigation from '../components/Navigation';
import FormPreview from '../components/FormPreview';
import { ArrowLeft, Save, X, Eye } from 'lucide-react';

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
    const [showPreview, setShowPreview] = useState(false);

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
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-[2px] relative z-10">
                <div className="w-12 h-12 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 text-sm">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/80 backdrop-blur-[2px] relative z-10">
            <Navigation />

            {error && (
                <div className="bg-red-50 border-b border-red-200 text-red-800 px-5 md:px-10 py-3 flex justify-between items-center max-w-7xl mx-auto">
                    <span className="text-sm">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="bg-transparent border-0 text-red-800 text-xl cursor-pointer hover:text-red-900 p-1"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            <main className="max-w-4xl mx-auto px-5 md:px-10 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm font-medium"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{isEditing ? 'Edit Form' : 'Create New Form'}</h1>
                    <p className="text-gray-600 text-sm mt-2">Build your form step by step</p>
                </div>
                {/* Form Details Section */}
                <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Form Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="formName" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Form Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="formName"
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="e.g., Customer Feedback Form"
                                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Description <span className="text-gray-400 text-xs">(optional)</span>
                            </label>
                            <textarea
                                id="formDescription"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Brief description of what this form is for"
                                rows={3}
                                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-400 transition-colors resize-y"
                            />
                        </div>
                    </div>
                </section>

                {/* Airtable Selection Section */}
                <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Connect to Airtable</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="baseSelect" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Select Base <span className="text-red-500">*</span>
                            </label>
                            {loadingBases ? (
                                <div className="px-3 py-2 text-gray-500 text-sm bg-gray-50 rounded-lg">Loading bases...</div>
                            ) : (
                                <select
                                    id="baseSelect"
                                    value={selectedBase?.id || ''}
                                    onChange={handleBaseChange}
                                    disabled={isEditing}
                                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-400 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                                >
                                    <option value="" className="text-gray-400">Choose a base...</option>
                                    {bases.map(base => (
                                        <option key={base.id} value={base.id} className="text-gray-900">{base.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {selectedBase && (
                            <div>
                                <label htmlFor="tableSelect" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Select Table <span className="text-red-500">*</span>
                                </label>
                                {loadingTables ? (
                                    <div className="px-3 py-2 text-gray-500 text-sm bg-gray-50 rounded-lg">Loading tables...</div>
                                ) : (
                                    <select
                                        id="tableSelect"
                                        value={selectedTable?.id || ''}
                                        onChange={handleTableChange}
                                        disabled={isEditing}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-400 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:border-gray-300"
                                    >
                                        <option value="" className="text-gray-400">Choose a table...</option>
                                        {tables.map(table => (
                                            <option key={table.id} value={table.id} className="text-gray-900">{table.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Field Selection Section */}
                {selectedTable && (
                    <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Select Fields</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            Click fields to add them to your form
                        </p>

                        {loadingFields ? (
                            <div className="px-3 py-2 text-gray-500 text-sm bg-gray-50 rounded-lg">Loading fields...</div>
                        ) : availableFields.length === 0 ? (
                            <div className="px-3 py-2 text-gray-500 text-sm bg-gray-50 rounded-lg">No supported fields found in this table.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {availableFields.map(field => {
                                    const isSelected = questions.some(q => q.airtableFieldId === field.id);
                                    return (
                                        <button
                                            key={field.id}
                                            type="button"
                                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${isSelected
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                                                : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                                                }`}
                                            onClick={() => handleFieldSelect(field)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{field.name}</span>
                                                {isSelected && <span className="text-indigo-600 font-bold text-base">✓</span>}
                                            </div>
                                            <span className="text-xs text-gray-500 mt-0.5 block">{getFieldTypeLabel(field.type)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Questions Configuration Section */}
                {questions.length > 0 && (
                    <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Step 4: Configure Questions</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            Customize your questions and add conditional logic
                        </p>

                        <div className="space-y-4">
                            {questions.map((question, index) => (
                                <div key={question.questionKey} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="p-1.5 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                                                onClick={() => moveQuestion(index, -1)}
                                                disabled={index === 0}
                                                title="Move up"
                                            >
                                                ↑
                                            </button>
                                            <span className="font-semibold text-gray-700 min-w-[1.5rem] text-center text-sm">Q{index + 1}</span>
                                            <button
                                                type="button"
                                                className="p-1.5 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                                                onClick={() => moveQuestion(index, 1)}
                                                disabled={index === questions.length - 1}
                                                title="Move down"
                                            >
                                                ↓
                                            </button>
                                        </div>
                                        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">{getFieldTypeLabel(question.type)}</span>
                                        <button
                                            type="button"
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            onClick={() => removeQuestion(question.questionKey)}
                                            title="Remove question"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Question Label</label>
                                            <input
                                                type="text"
                                                value={question.label}
                                                onChange={(e) => updateQuestion(question.questionKey, { label: e.target.value })}
                                                placeholder="Enter question label"
                                                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-gray-400 transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={question.required}
                                                    onChange={(e) => updateQuestion(question.questionKey, { required: e.target.checked })}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">Required field</span>
                                            </label>
                                        </div>

                                        {question.options?.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Options</label>
                                                <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700">
                                                    {question.options.join(', ')}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Conditional Logic</label>
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
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium text-sm transition-all duration-200 hover:bg-gray-50"
                        onClick={() => navigate('/dashboard')}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-purple-300 text-purple-700 rounded-lg font-medium text-sm transition-all duration-200 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setShowPreview(true)}
                        disabled={questions.length === 0}
                        title="Preview how your form will look to respondents"
                    >
                        <Eye size={16} />
                        Preview
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm transition-all duration-200 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleSave}
                        disabled={saving || !formName || !selectedBase || !selectedTable || questions.length === 0}
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : (isEditing ? 'Update Form' : 'Create Form')}
                    </button>
                </div>
            </main>
            <ServerStatus />

            {/* Form Preview Modal */}
            <FormPreview
                form={{
                    name: formName || 'Untitled Form',
                    description: formDescription,
                    questions
                }}
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
            />
        </div>
    );
}

export default FormBuilder;
