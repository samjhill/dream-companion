import React, { useState } from 'react';
import './AddMemoryForm.css';

interface AddMemoryFormProps {
  user_id: string;
  memoryType: 'trait' | 'context' | 'memory';
  onSubmit: (data: any) => void;
}

export const AddMemoryForm: React.FC<AddMemoryFormProps> = ({
  memoryType,
  onSubmit
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFormFields = () => {
    switch (memoryType) {
      case 'trait':
        return {
          trait_type: { type: 'text', label: 'Trait Type', required: true },
          trait_value: { type: 'text', label: 'Trait Value', required: true },
          confidence: { type: 'number', label: 'Confidence (0-1)', required: true, min: 0, max: 1, step: 0.1 }
        };
      case 'context':
        return {
          context_type: { type: 'select', label: 'Context Type', required: true, options: ['life_event', 'goal'] },
          context_value: { type: 'textarea', label: 'Context Value', required: true },
          importance: { type: 'select', label: 'Importance', required: true, options: ['low', 'medium', 'high'] },
          source: { type: 'select', label: 'Source', required: true, options: ['conversation', 'dream', 'observation', 'user_input'] }
        };
      case 'memory':
        return {
          content: { type: 'textarea', label: 'Memory Content', required: true },
          memory_type: { type: 'select', label: 'Memory Type', required: true, options: ['dream_insight', 'conversation', 'observation', 'preference'] },
          importance: { type: 'select', label: 'Importance', required: true, options: ['low', 'medium', 'high'] },
          tags: { type: 'text', label: 'Tags (comma-separated)', required: false }
        };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Process tags if present
      if (formData.tags && typeof formData.tags === 'string') {
        formData.tags = formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      }
      
      await onSubmit(formData);
      setFormData({});
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(`Failed to submit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const renderField = (fieldName: string, fieldConfig: any) => {
    const { type, label, required, options, min, max, step } = fieldConfig;
    
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={label}
            required={required}
            className="form-input"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={label}
            required={required}
            className="form-textarea"
            rows={3}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, parseFloat(e.target.value))}
            placeholder={label}
            required={required}
            min={min}
            max={max}
            step={step}
            className="form-input"
          />
        );
      
      case 'select':
        return (
          <select
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            required={required}
            className="form-select"
          >
            <option value="">Select {label}</option>
            {options.map((option: string) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        );
      
      default:
        return null;
    }
  };

  const getFormTitle = () => {
    switch (memoryType) {
      case 'trait':
        return 'Add User Trait';
      case 'context':
        return 'Add Personal Context';
      case 'memory':
        return 'Add Memory';
      default:
        return 'Add Item';
    }
  };

  const getFormIcon = () => {
    switch (memoryType) {
      case 'trait':
        return '👤';
      case 'context':
        return '📝';
      case 'memory':
        return '🧠';
      default:
        return '➕';
    }
  };

  if (!isOpen) {
    return (
      <button
        className="add-memory-btn"
        onClick={() => setIsOpen(true)}
      >
        <span className="btn-icon">{getFormIcon()}</span>
        {getFormTitle()}
      </button>
    );
  }

  const fields = getFormFields();

  return (
    <div className="add-memory-form-overlay">
      <div className="add-memory-form">
        <div className="form-header">
          <h3>
            <span className="form-icon">{getFormIcon()}</span>
            {getFormTitle()}
          </h3>
          <button
            className="close-btn"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          {error && (
            <div className="form-error">
              <p>{error}</p>
            </div>
          )}
          
          {Object.entries(fields).map(([fieldName, fieldConfig]) => (
            <div key={fieldName} className="form-field">
              <label className="form-label">
                {fieldConfig.label}
                {fieldConfig.required && <span className="required">*</span>}
              </label>
              {renderField(fieldName, fieldConfig)}
            </div>
          ))}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
