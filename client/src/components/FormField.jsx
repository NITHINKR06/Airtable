import { useState } from 'react';

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
        // Store actual File objects instead of blob URLs
        // The files will be uploaded when the form is submitted
        const attachments = files.map(file => ({
            file: file, // Store the actual File object
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
                        className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 text-sm md:text-base placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                            error 
                                ? 'border-red-400 bg-red-50 focus:ring-red-500/20 focus:border-red-500' 
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                    />
                );

            case 'multilineText':
                return (
                    <textarea
                        value={value || ''}
                        onChange={handleChange}
                        placeholder={`Enter ${question.label.toLowerCase()}`}
                        rows={4}
                        className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 text-sm md:text-base placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y ${
                            error 
                                ? 'border-red-400 bg-red-50 focus:ring-red-500/20 focus:border-red-500' 
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                    />
                );

            case 'singleSelect':
                return (
                    <select
                        value={value || ''}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 text-sm md:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer ${
                            error 
                                ? 'border-red-400 bg-red-50 focus:ring-red-500/20 focus:border-red-500' 
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                        <option value="" className="text-gray-400">-- Select an option --</option>
                        {question.options?.map((option) => (
                            <option key={option} value={option} className="text-gray-900">
                                {option}
                            </option>
                        ))}
                    </select>
                );

            case 'multipleSelects':
                return (
                    <div className={`flex flex-col gap-3 py-2.5 ${
                        error ? 'border border-red-500 rounded-lg p-3' : ''
                    }`}>
                        {question.options?.map((option) => (
                            <label key={option} className="flex items-center gap-3 cursor-pointer px-3.5 py-2.5 rounded-lg transition-colors hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={(value || []).includes(option)}
                                    onChange={() => handleMultiSelectChange(option)}
                                    className="w-5 h-5 cursor-pointer text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-gray-700 text-sm md:text-base">{option}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'multipleAttachments':
                return (
                    <div className={`border-2 border-dashed rounded-xl p-7 transition-all duration-200 ${
                        dragOver 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : error 
                                ? 'border-red-500' 
                                : 'border-gray-300'
                    }`}>
                        <div
                            className="text-center"
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                const files = Array.from(e.dataTransfer.files);
                                const attachments = files.map(file => ({
                                    file: file,
                                    filename: file.name,
                                    size: file.size,
                                    type: file.type
                                }));
                                onChange([...(value || []), ...attachments]);
                            }}
                        >
                            <p className="text-gray-600 mb-3 text-sm md:text-base">Drag & drop files here or</p>
                            <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer text-sm md:text-base font-medium transition-colors hover:bg-indigo-700">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                Browse files
                            </label>
                        </div>

                        {value && value.length > 0 && (
                            <div className="mt-4 flex flex-col gap-2">
                                {value.map((attachment, index) => (
                                    <div key={index} className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">{attachment.filename}</span>
                                        <button
                                            type="button"
                                            className="w-6 h-6 flex items-center justify-center bg-red-50 border-0 rounded text-red-700 cursor-pointer text-sm hover:bg-red-100 transition-colors"
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
        <div className={`mb-7 ${error ? 'has-error' : ''}`}>
            <label className="block font-semibold text-gray-700 mb-2.5 text-sm md:text-base">
                {question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {renderField()}

            {error && <span className="text-red-500 text-xs mt-1.5 block">{error}</span>}
        </div>
    );
}

export default FormField;
