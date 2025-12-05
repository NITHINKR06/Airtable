import { useState } from 'react';
import '../styles/FormField.css';

function FormField({ question, value, onChange, error }) {
    const [dragOver, setDragOver] = useState(false);

    const handleChange = (e) => {
        onChange(e.target.value);
    };

    const handleMultiSelectChange = (option) => {
        const currentValue = Array.isArray(value) ? value : [];
        const newValue = currentValue.includes(option)
            ? currentValue.filter(v => v !== option)
            : [...currentValue, option];
        onChange(newValue);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        // For now, we'll just store file names - in production you'd upload to a service
        const attachments = files.map(file => ({
            url: URL.createObjectURL(file),
            filename: file.name,
            size: file.size,
            type: file.type
        }));
        onChange([...(value || []), ...attachments]);
    };

    const removeAttachment = (index) => {
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);
    };

    const renderField = () => {
        switch (question.type) {
            case 'singleLineText':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={handleChange}
                        placeholder={`Enter ${question.label.toLowerCase()}`}
                        className={error ? 'error' : ''}
                    />
                );

            case 'multilineText':
                return (
                    <textarea
                        value={value || ''}
                        onChange={handleChange}
                        placeholder={`Enter ${question.label.toLowerCase()}`}
                        rows={4}
                        className={error ? 'error' : ''}
                    />
                );

            case 'singleSelect':
                return (
                    <select
                        value={value || ''}
                        onChange={handleChange}
                        className={error ? 'error' : ''}
                    >
                        <option value="">-- Select an option --</option>
                        {question.options?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );

            case 'multipleSelects':
                return (
                    <div className={`checkbox-group ${error ? 'error' : ''}`}>
                        {question.options?.map((option) => (
                            <label key={option} className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={(value || []).includes(option)}
                                    onChange={() => handleMultiSelectChange(option)}
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'multipleAttachments':
                return (
                    <div className={`file-upload-area ${dragOver ? 'drag-over' : ''} ${error ? 'error' : ''}`}>
                        <div
                            className="drop-zone"
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                const files = Array.from(e.dataTransfer.files);
                                const attachments = files.map(file => ({
                                    url: URL.createObjectURL(file),
                                    filename: file.name,
                                    size: file.size,
                                    type: file.type
                                }));
                                onChange([...(value || []), ...attachments]);
                            }}
                        >
                            <p>Drag & drop files here or</p>
                            <label className="file-input-label">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="file-input"
                                />
                                Browse files
                            </label>
                        </div>

                        {value && value.length > 0 && (
                            <div className="attachments-list">
                                {value.map((attachment, index) => (
                                    <div key={index} className="attachment-item">
                                        <span className="attachment-name">{attachment.filename}</span>
                                        <button
                                            type="button"
                                            className="remove-attachment"
                                            onClick={() => removeAttachment(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={handleChange}
                        placeholder={`Enter ${question.label.toLowerCase()}`}
                    />
                );
        }
    };

    return (
        <div className={`form-field ${error ? 'has-error' : ''}`}>
            <label className="field-label">
                {question.label}
                {question.required && <span className="required-mark">*</span>}
            </label>

            {renderField()}

            {error && <span className="error-message">{error}</span>}
        </div>
    );
}

export default FormField;
