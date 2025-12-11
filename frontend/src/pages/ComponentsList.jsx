import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { componentAPI } from '../utils/api';
import PrimaryPageHeader from '../components/header/PrimaryPageHeader';
import DropdownButton from '../components/buttons/DropdownButton';
import './ComponentsList.css';

function ComponentsList() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const handleCreateBasicComponent = async () => {
    try {
      setError(null);
      const componentData = {
        name: 'new basic component',
        description: 'describe the purpose of the component here',
        variants: ['label', 'label'],
        isSplit: false,
        splitParts: null
      };

      const newComponent = await componentAPI.create(componentData);
      if (newComponent && newComponent.id) {
        await loadComponents();
        navigate(`/components/${newComponent.id}`);
      } else {
        setError('Failed to create component: Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to create component');
      console.error(err);
    }
  };

  const handleCreateSplitComponent = async () => {
    try {
      setError(null);
      const componentData = {
        name: 'new split component',
        description: 'describe the purpose of the component here',
        variants: [
          { a: 'label', b: 'label' },
          { a: 'label', b: 'label' }
        ],
        isSplit: true,
        splitParts: ['a', 'b']
      };

      const newComponent = await componentAPI.create(componentData);
      if (newComponent && newComponent.id) {
        await loadComponents();
        navigate(`/components/${newComponent.id}`);
      } else {
        setError('Failed to create component: Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to create component');
      console.error(err);
    }
  };

  const handleDropdownSelect = (item) => {
    if (item === 'Basic component') {
      handleCreateBasicComponent();
    } else if (item === 'Split component') {
      handleCreateSplitComponent();
    }
  };

  if (loading) {
    return <div className="components-list">Loading...</div>;
  }

  return (
    <div className="components-list">
      <PrimaryPageHeader title="Components">
        <DropdownButton 
          placeholder="New component"
          items={[
            'Basic component',
            'Split component'
          ]}
          onSelect={handleDropdownSelect}
          width={210}
        />
      </PrimaryPageHeader>

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

