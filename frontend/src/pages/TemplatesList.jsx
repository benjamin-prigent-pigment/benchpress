import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateAPI } from '../utils/api';
import PrimaryPageHeader from '../components/header/PrimaryPageHeader';
import PrimaryButton from '../components/buttons/PrimaryButton';
import SecondaryButton from '../components/buttons/SecondaryButton';
import './TemplatesList.css';

function TemplatesList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateAPI.getAll();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    try {
      const newTemplate = await templateAPI.create({ 
        name: newTemplateName,
        description: newTemplateDescription 
      });
      setNewTemplateName('');
      setNewTemplateDescription('');
      setShowCreateForm(false);
      navigate(`/templates/${newTemplate.id}`);
    } catch (err) {
      setError('Failed to create template');
      console.error(err);
    }
  };


  if (loading) {
    return <div className="templates-list">Loading...</div>;
  }

  return (
    <div className="templates-list">
      <PrimaryPageHeader title="Templates">
        <PrimaryButton onClick={() => setShowCreateForm(true)}>
          Add template
        </PrimaryButton>
      </PrimaryPageHeader>

      {showCreateForm && (
        <div className="create-form">
          <form onSubmit={handleCreateTemplate}>
            <input
              type="text"
              placeholder="Template name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              placeholder="Template description (optional)"
              value={newTemplateDescription}
              onChange={(e) => setNewTemplateDescription(e.target.value)}
            />
            <div className="form-actions">
              <PrimaryButton type="submit">Save</PrimaryButton>
              <SecondaryButton 
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTemplateName('');
                  setNewTemplateDescription('');
                }}
              >
                Cancel
              </SecondaryButton>
            </div>
          </form>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <div className="templates-grid">
        {templates.length === 0 ? (
          <p>No templates yet. Create one to get started.</p>
        ) : (
          templates.map((template) => (
            <div 
              key={template.id} 
              className="template-card"
              onClick={() => navigate(`/templates/${template.id}`)}
            >
              <h3>{template.name}</h3>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TemplatesList;

