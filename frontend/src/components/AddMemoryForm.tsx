import React, { useState } from 'react';

interface AddMemoryFormProps {
  user_id: string;
  memoryType: 'memory' | 'trait' | 'context';
  onSubmit: (data: any) => void;
}

export const AddMemoryForm: React.FC<AddMemoryFormProps> = ({
  memoryType,
  onSubmit
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    memory_type: '',
    trait_type: '',
    trait_value: '',
    context_type: '',
    context_value: '',
    importance: 'medium',
    confidence: 0.5,
    source: 'user_input'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let submitData;
    
    switch (memoryType) {
      case 'memory':
        submitData = {
          content: formData.content,
          memory_type: formData.memory_type,
          importance: formData.importance,
          tags: []
        };
        break;
      case 'trait':
        submitData = {
          trait_type: formData.trait_type,
          trait_value: formData.trait_value,
          confidence: formData.confidence
        };
        break;
      case 'context':
        submitData = {
          context_type: formData.context_type,
          context_value: formData.context_value,
          importance: formData.importance,
          source: formData.source
        };
        break;
      default:
        return;
    }
    
    onSubmit(submitData);
    
    // Reset form
    setFormData({
      content: '',
      memory_type: '',
      trait_type: '',
      trait_value: '',
      context_type: '',
      context_value: '',
      importance: 'medium',
      confidence: 0.5,
      source: 'user_input'
    });
    setIsExpanded(false);
  };

  const getFormTitle = () => {
    switch (memoryType) {
      case 'memory': return 'Add New Memory';
      case 'trait': return 'Add Personal Trait';
      case 'context': return 'Add Life Context';
      default: return 'Add Item';
    }
  };

  const getFormIcon = () => {
    switch (memoryType) {
      case 'memory': return '📝';
      case 'trait': return '🎭';
      case 'context': return '📅';
      default: return '➕';
    }
  };

  return (
    <div className="add-memory-form">
      <button
        className="add-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="add-icon">{getFormIcon()}</span>
        {getFormTitle()}
      </button>
      
      {isExpanded && (
        <form className="memory-form" onSubmit={handleSubmit}>
          {memoryType === 'memory' && (
            <>
              <div className="form-group">
                <label htmlFor="content">Memory Content</label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Describe your memory, observation, or insight..."
                  required
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="memory_type">Type</label>
                <select
                  id="memory_type"
                  value={formData.memory_type}
                  onChange={(e) => setFormData({ ...formData, memory_type: e.target.value })}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="observation">Observation</option>
                  <option value="insight">Insight</option>
                  <option value="experience">Experience</option>
                  <option value="reflection">Reflection</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="importance">Importance</label>
                <select
                  id="importance"
                  value={formData.importance}
                  onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </>
          )}
          
          {memoryType === 'trait' && (
            <>
              <div className="form-group">
                <label htmlFor="trait_type">Trait Name</label>
                <input
                  type="text"
                  id="trait_type"
                  value={formData.trait_type}
                  onChange={(e) => setFormData({ ...formData, trait_type: e.target.value })}
                  placeholder="e.g., Optimistic, Creative, Analytical..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="trait_value">Description</label>
                <textarea
                  id="trait_value"
                  value={formData.trait_value}
                  onChange={(e) => setFormData({ ...formData, trait_value: e.target.value })}
                  placeholder="Describe this trait in more detail..."
                  required
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confidence">
                  Confidence: {Math.round(formData.confidence * 100)}%
                </label>
                <input
                  type="range"
                  id="confidence"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.confidence}
                  onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) })}
                />
              </div>
            </>
          )}
          
          {memoryType === 'context' && (
            <>
              <div className="form-group">
                <label htmlFor="context_type">Context Type</label>
                <select
                  id="context_type"
                  value={formData.context_type}
                  onChange={(e) => setFormData({ ...formData, context_type: e.target.value })}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="life_event">Life Event</option>
                  <option value="goal">Goal</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="context_value">Description</label>
                <textarea
                  id="context_value"
                  value={formData.context_value}
                  onChange={(e) => setFormData({ ...formData, context_value: e.target.value })}
                  placeholder="Describe the life event or goal..."
                  required
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="importance">Importance</label>
                <select
                  id="importance"
                  value={formData.importance}
                  onChange={(e) => setFormData({ ...formData, importance: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </>
          )}
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Add {memoryType === 'memory' ? 'Memory' : memoryType === 'trait' ? 'Trait' : 'Context'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setIsExpanded(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};