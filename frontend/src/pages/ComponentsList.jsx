import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { componentAPI } from '../utils/api';
import PrimaryPageHeader from '../components/header/PrimaryPageHeader';
import PrimaryButton from '../components/buttons/PrimaryButton';
import ComponentCreateModal from '../components/ComponentCreateModal';
import './ComponentsList.css';

function ComponentsList() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const data = await componentAPI.getAll();
      setComponents(data);
      setError(null);
    } catch (err) {
      setError('Failed to load components');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="components-list">Loading...</div>;
  }

  return (
    <div className="components-list">
      <PrimaryPageHeader title="Components">
        <PrimaryButton onClick={() => setShowCreateModal(true)}>
          Add component
        </PrimaryButton>
      </PrimaryPageHeader>

      <ComponentCreateModal 
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          loadComponents();
        }}
      />

      {error && <div className="error">{error}</div>}

      <div className="components-grid">
        {components.length === 0 ? (
          <p>No components yet. Create one to get started.</p>
        ) : (
          components.map((component) => (
            <div 
              key={component.id} 
              className="component-card"
              onClick={() => {
                if (component.id) {
                  navigate(`/components/${component.id}`);
                } else {
                  console.error('Component missing ID:', component);
                }
              }}
            >
              <h3>{component.name}</h3>
              {component.description && (
                <p className="component-description">{component.description}</p>
              )}
              <div className="component-variants-count">
                {component.variants?.length || 0} variant(s)
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ComponentsList;

