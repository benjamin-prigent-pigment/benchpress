import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { componentAPI } from '../utils/api';
import SecondaryPageHeader from '../components/header/SecondaryPageHeader';
import ComponentCreateModal from '../components/ComponentCreateModal';
import PrimaryButton from '../components/buttons/PrimaryButton';
import SecondaryButton from '../components/buttons/SecondaryButton';
import DangerButton from '../components/buttons/DangerButton';
import './ComponentItem.css';

function ComponentItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [component, setComponent] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState('');
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editVariantText, setEditVariantText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [splitParts, setSplitParts] = useState(['a', 'b']);

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
      setError(null);
    } catch (err) {
      setError('Failed to load component');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Component name is required');
      return;
    }

    if (variants.length < 2) {
      setError('At least 2 variants are required');
      return;
    }

    // Validate split component structure
    if (isSplit) {
      if (!splitParts || splitParts.length < 2) {
        setError('Split component must have at least 2 parts');
        return;
      }
      // Check all variants have all parts
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant || typeof variant !== 'object') {
          setError(`Variant ${i + 1} must be an object with all parts`);
          return;
        }
        for (const part of splitParts) {
          if (!(part in variant) || variant[part].trim() === '') {
            setError(`Variant ${i + 1} missing or empty value for part "${part}"`);
            return;
          }
        }
      }
    } else {
      // Validate regular variants are strings
      for (let i = 0; i < variants.length; i++) {
        if (typeof variants[i] !== 'string') {
          setError(`Variant ${i + 1} must be a string`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      const data = { 
        name, 
        description, 
        variants,
        isSplit,
        splitParts: isSplit ? splitParts : null
      };
      
      await componentAPI.update(id, data);
      await loadComponent();
      setShowEditModal(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = () => {
    if (isSplit) {
      if (!splitParts.every(part => newVariant[part]?.trim())) {
        setError('All parts must be filled');
        return;
      }
      setVariants([...variants, { ...newVariant }]);
      setNewVariant({});
    } else {
      if (!newVariant.trim()) return;
      setVariants([...variants, newVariant]);
      setNewVariant('');
    }
  };

  const handleStartEditVariant = (index, variant) => {
    setEditingVariantId(index);
    if (isSplit) {
      setEditVariantText({ ...variant });
    } else {
      setEditVariantText(variant);
    }
  };

  const handleSaveEditVariant = () => {
    if (isSplit) {
      // Validate all parts are filled
      if (!splitParts.every(part => editVariantText[part]?.trim())) {
        setError('All parts must be filled');
        return;
      }
      const updated = [...variants];
      updated[editingVariantId] = { ...editVariantText };
      setVariants(updated);
    } else {
      if (!editVariantText.trim()) return;
      const updated = [...variants];
      updated[editingVariantId] = editVariantText;
      setVariants(updated);
    }
    setEditingVariantId(null);
    setEditVariantText(isSplit ? {} : '');
  };

  const handleDeleteVariant = (index) => {
    if (variants.length <= 2) {
      setError('At least 2 variants are required');
      return;
    }
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
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

      <div className="component-editor">
        <div className="form-group">
          <label>Component Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., start city"
            disabled={!showEditModal}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            disabled={!showEditModal}
          />
        </div>

        <div className="form-group">
          <label>Component Type:</label>
          <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
            {component?.isSplit ? 'Split Component' : 'Regular Component'}
            {component?.isSplit && component?.splitParts && (
              <div style={{ marginTop: '4px', fontSize: '0.9em', color: '#666' }}>
                Parts: {component.splitParts.join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="variants-section">
          <label>Variants * (at least 2 required)</label>
          
          {!showEditModal ? (
            <div className="variants-list">
              {variants.map((variant, index) => (
                <div key={index} className="variant-item">
                  {isSplit ? (
                    <div>
                      {splitParts.map(part => (
                        <div key={part} style={{ marginBottom: '4px' }}>
                          <strong>{part}:</strong> {variant[part] || ''}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>{variant}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="variants-list">
                {variants.map((variant, index) => (
                  <div key={index} className="variant-item editable">
                    {editingVariantId === index ? (
                      <>
                        {isSplit ? (
                          <div>
                            {splitParts.map(part => (
                              <div key={part} style={{ marginBottom: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '4px' }}>
                                  <strong>{part}:</strong>
                                </label>
                                <input
                                  type="text"
                                  value={editVariantText[part] || ''}
                                  onChange={(e) => {
                                    setEditVariantText({
                                      ...editVariantText,
                                      [part]: e.target.value
                                    });
                                  }}
                                  placeholder={`Enter ${part} value`}
                                  style={{ width: '100%', marginBottom: '4px' }}
                                />
                              </div>
                            ))}
                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                              <PrimaryButton 
                                className="btn-small"
                                onClick={handleSaveEditVariant}
                              >
                                Save
                              </PrimaryButton>
                              <SecondaryButton 
                                className="btn-small"
                                onClick={() => {
                                  setEditingVariantId(null);
                                  setEditVariantText('');
                                }}
                              >
                                Cancel
                              </SecondaryButton>
                            </div>
                          </div>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={editVariantText}
                              onChange={(e) => setEditVariantText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveEditVariant()}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <PrimaryButton 
                                className="btn-small"
                                onClick={handleSaveEditVariant}
                              >
                                Save
                              </PrimaryButton>
                              <SecondaryButton 
                                className="btn-small"
                                onClick={() => {
                                  setEditingVariantId(null);
                                  setEditVariantText('');
                                }}
                              >
                                Cancel
                              </SecondaryButton>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {isSplit ? (
                          <div>
                            {splitParts.map(part => (
                              <div key={part} style={{ marginBottom: '4px' }}>
                                <strong>{part}:</strong> {variant[part] || ''}
                              </div>
                            ))}
                            <div className="variant-actions" style={{ marginTop: '8px' }}>
                              <SecondaryButton 
                                className="btn-small"
                                onClick={() => handleStartEditVariant(index, variant)}
                              >
                                Edit
                              </SecondaryButton>
                              <DangerButton 
                                className="btn-small"
                                onClick={() => handleDeleteVariant(index)}
                                disabled={variants.length <= 2}
                              >
                                Delete
                              </DangerButton>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span>{variant}</span>
                            <div className="variant-actions">
                              <SecondaryButton 
                                className="btn-small"
                                onClick={() => handleStartEditVariant(index, variant)}
                              >
                                Edit
                              </SecondaryButton>
                              <DangerButton 
                                className="btn-small"
                                onClick={() => handleDeleteVariant(index)}
                                disabled={variants.length <= 2}
                              >
                                Delete
                              </DangerButton>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="add-variant">
                {isSplit ? (
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      {splitParts.map(part => (
                        <div key={part} style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'block', marginBottom: '4px' }}>
                            <strong>{part}:</strong>
                          </label>
                          <input
                            type="text"
                            value={newVariant[part] || ''}
                            onChange={(e) => {
                              setNewVariant({
                                ...newVariant,
                                [part]: e.target.value
                              });
                            }}
                            placeholder={`Enter ${part} value`}
                            style={{ width: '100%' }}
                          />
                        </div>
                      ))}
                    </div>
                    <PrimaryButton 
                      onClick={handleAddVariant}
                      disabled={!splitParts.every(part => newVariant[part]?.trim())}
                    >
                      Add Variant
                    </PrimaryButton>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={newVariant}
                      onChange={(e) => setNewVariant(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddVariant()}
                      placeholder="Enter new variant"
                    />
                    <PrimaryButton onClick={handleAddVariant}>
                      Add Variant
                    </PrimaryButton>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="editor-actions">
          {!showEditModal ? (
            <PrimaryButton 
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </PrimaryButton>
          ) : (
            <>
              <PrimaryButton 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </PrimaryButton>
              <SecondaryButton 
                onClick={() => {
                  setShowEditModal(false);
                  loadComponent();
                }}
              >
                Cancel
              </SecondaryButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComponentItem;

