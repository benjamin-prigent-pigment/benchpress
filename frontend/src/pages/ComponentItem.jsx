import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { componentAPI } from '../utils/api';
import SecondaryPageHeader from '../components/header/SecondaryPageHeader';
import ComponentCreateModal from '../components/ComponentCreateModal';
import ComponentAbout from '../components/new_temp_comp/ComponentAbout';
import NonSplitVariableList from '../components/new_temp_comp/NonSplitVariableList';
import SplitVariableList from '../components/new_temp_comp/SplitVariableList';
import '../components/ComponentCreateModal.css';
import './ComponentItem.css';

function ComponentItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [component, setComponent] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [splitParts, setSplitParts] = useState(['a', 'b']);
  const [numberOfSplits, setNumberOfSplits] = useState(2);

  // Check if we're creating a new component - either id is 'new' or undefined (when route is /components/new)
  const isNew = !id || id === 'new' || location.pathname === '/components/new';

  useEffect(() => {
    setError(null);
    
    if (isNew) {
      setLoading(false);
      setShowCreateModal(true);
    } else if (id && id !== 'undefined') {
      loadComponent();
    } else {
      setError('Invalid component ID');
      setLoading(false);
    }
  }, [id, location.pathname]);

  const loadComponent = async () => {
    if (!id || id === 'undefined') {
      setError('Invalid component ID');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await componentAPI.getById(id);
      setComponent(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setVariants(data.variants || []);
      setIsSplit(data.isSplit || false);
      setSplitParts(data.splitParts || ['a', 'b']);
      setNumberOfSplits(data.splitParts ? data.splitParts.length : 2);
      setError(null);
    } catch (err) {
      setError('Failed to load component');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAbout = async (newName, newDescription) => {
    setName(newName);
    setDescription(newDescription);
    
    const data = { 
      name: newName, 
      description: newDescription, 
      variants,
      isSplit,
      splitParts: isSplit ? splitParts : null
    };
    
    await componentAPI.update(id, data);
    await loadComponent();
  };

  const handleVariablesChange = async (newVariants) => {
    if (newVariants.length < 2) {
      setError('At least 2 variables are required');
      return;
    }

    // Validate all variables are strings
    for (let i = 0; i < newVariants.length; i++) {
      if (typeof newVariants[i] !== 'string' || !newVariants[i].trim()) {
        setError(`Variable ${i + 1} must be a non-empty string`);
        return;
      }
    }

    try {
      setVariants(newVariants);
      const data = { 
        name, 
        description, 
        variants: newVariants,
        isSplit: false,
        splitParts: null
      };
      
      await componentAPI.update(id, data);
      await loadComponent();
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to save variables');
      // Revert on error
      await loadComponent();
    }
  };

  const handleSplitVariablesChange = async (newVariants) => {
    if (newVariants.length < 2) {
      setError('At least 2 variables are required');
      return;
    }

    // Validate all variables are objects with all parts
    for (let i = 0; i < newVariants.length; i++) {
      const variant = newVariants[i];
      if (!variant || typeof variant !== 'object') {
        setError(`Variable ${i + 1} must be an object with all parts`);
        return;
      }
      for (const part of splitParts) {
        if (!(part in variant) || !variant[part]?.trim()) {
          setError(`Variable ${i + 1} missing or empty value for part "${part}"`);
          return;
        }
      }
    }

    try {
      setVariants(newVariants);
      const data = { 
        name, 
        description, 
        variants: newVariants,
        isSplit: true,
        splitParts: splitParts
      };
      
      await componentAPI.update(id, data);
      await loadComponent();
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to save variables');
      // Revert on error
      await loadComponent();
    }
  };

  const handleSplitPartsChange = async (newSplitParts) => {
    if (!newSplitParts || newSplitParts.length < 2) {
      setError('Split component must have at least 2 parts');
      return;
    }

    // Validate unique part names
    const trimmedParts = newSplitParts.map(part => part.trim());
    if (trimmedParts.some(part => !part)) {
      setError('All split part names must be non-empty');
      return;
    }
    if (trimmedParts.length !== new Set(trimmedParts).size) {
      setError('Split part names must be unique');
      return;
    }

    // Remap existing variables to match new split parts
    const remappedVariants = variants.map(variant => {
      if (!variant || typeof variant !== 'object') return variant;
      const remapped = {};
      const oldParts = splitParts;
      for (let i = 0; i < trimmedParts.length; i++) {
        if (i < oldParts.length && oldParts[i] in variant) {
          remapped[trimmedParts[i]] = variant[oldParts[i]];
        } else {
          remapped[trimmedParts[i]] = '';
        }
      }
      return remapped;
    });

    try {
      setSplitParts(trimmedParts);
      setNumberOfSplits(trimmedParts.length);
      setVariants(remappedVariants);
      
      const data = { 
        name, 
        description, 
        variants: remappedVariants,
        isSplit: true,
        splitParts: trimmedParts
      };
      
      await componentAPI.update(id, data);
      await loadComponent();
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to save split parts');
      // Revert on error
      await loadComponent();
    }
  };

  const handleDeleteComponent = async () => {
    if (!window.confirm('Are you sure you want to delete this component?')) {
      return;
    }

    try {
      await componentAPI.delete(id);
      navigate('/components');
    } catch (err) {
      setError(err.message || 'Failed to delete component. It may be used in a template.');
    }
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    navigate('/components');
  };

  if (loading) {
    return <div className="component-item">Loading...</div>;
  }

  // Show create modal for new components
  if (isNew) {
    return (
      <>
        <ComponentCreateModal 
          isOpen={showCreateModal} 
          onClose={handleCreateModalClose}
        />
      </>
    );
  }

  return (
    <div className="component-item">
      <SecondaryPageHeader
        title={component?.name}
        backPath="/components"
        backLabel="Back to Components"
        onDelete={handleDeleteComponent}
        deleteLabel="Delete Component"
        className="component-header"
      />

      {error && <div className="error">{error}</div>}

      <div className="component-editor-layout">
        <ComponentAbout
          name={name}
          description={description}
          onSave={handleSaveAbout}
          onError={setError}
        />

        <div className="component-editor-main">
          {!isSplit ? (
            <NonSplitVariableList
              variables={variants}
              onVariablesChange={handleVariablesChange}
              onError={setError}
              disabled={false}
            />
          ) : (
            <SplitVariableList
              variables={variants}
              splitParts={splitParts}
              onVariablesChange={handleSplitVariablesChange}
              onSplitPartsChange={handleSplitPartsChange}
              onError={setError}
              disabled={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ComponentItem;

