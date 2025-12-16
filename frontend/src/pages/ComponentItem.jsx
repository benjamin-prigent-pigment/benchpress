import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { componentAPI } from '../utils/api';
import SecondaryPageHeader from '../components/header/SecondaryPageHeader';
import ComponentAbout from '../components/new_temp_comp/ComponentAbout';
import NonSplitVariableList from '../components/new_temp_comp/NonSplitVariableList';
import SplitVariableList from '../components/new_temp_comp/SplitVariableList';
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
  const [isSplit, setIsSplit] = useState(false);
  const [splitParts, setSplitParts] = useState(['a', 'b']);
  const [numberOfSplits, setNumberOfSplits] = useState(2);

  useEffect(() => {
    setError(null);
    
    if (id && id !== 'undefined') {
      loadComponent();
    } else {
      setError('Invalid component ID');
      setLoading(false);
    }
  }, [id]);

  const loadComponent = async () => {
    if (!id || id === 'undefined') {
      setError('Invalid component ID');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await componentAPI.getById(id);
      console.log('[ComponentItem] ===== loadComponent called =====');
      console.log('[ComponentItem] 📥 Loaded component:', {
        id: data.id,
        name: data.name,
        isSplit: data.isSplit,
        splitParts: data.splitParts,
        variantsCount: data.variants?.length || 0
      });
      if (data.variants && data.variants.length > 0) {
        console.log('[ComponentItem] Last variant from API:', data.variants[data.variants.length - 1]);
      }
      
      setComponent(data);
      setName(data.name || '');
      setDescription(data.description || '');
      
      // Normalize variants to ensure they're in the correct order
      const loadedSplitParts = data.splitParts || ['a', 'b'];
      let normalizedVariants = data.variants || [];
      
      console.log('[ComponentItem] Before normalization:', {
        loadedSplitParts: loadedSplitParts.join(', '),
        variantsCount: normalizedVariants.length,
        lastVariantKeys: normalizedVariants.length > 0 && typeof normalizedVariants[normalizedVariants.length - 1] === 'object' 
          ? Object.keys(normalizedVariants[normalizedVariants.length - 1]).join(', ')
          : 'N/A'
      });
      
      // If it's a split component, normalize each variable to match splitParts order
      if (data.isSplit && normalizedVariants.length > 0) {
        normalizedVariants = normalizedVariants.map((variant, index) => {
          if (!variant || typeof variant !== 'object') return variant;
          
          // Check if order matches
          const variantKeys = Object.keys(variant);
          const keysMatch = variantKeys.length === loadedSplitParts.length &&
                           variantKeys.every((key, i) => key === loadedSplitParts[i]);
          
          if (!keysMatch) {
            console.log(`[ComponentItem] Normalizing variable ${index} order:`, {
              splitParts: loadedSplitParts.join(', '),
              variantKeys: variantKeys.join(', '),
              correcting: true
            });
            
            // Reorder to match splitParts
            const ordered = {};
            loadedSplitParts.forEach(part => {
              ordered[part] = variant[part] || '';
            });
            return ordered;
          }
          return variant;
        });
      }
      
      console.log('[ComponentItem] After normalization:', {
        variantsCount: normalizedVariants.length,
        lastVariantKeys: normalizedVariants.length > 0 && typeof normalizedVariants[normalizedVariants.length - 1] === 'object'
          ? Object.keys(normalizedVariants[normalizedVariants.length - 1]).join(', ')
          : 'N/A',
        lastVariant: normalizedVariants.length > 0 ? normalizedVariants[normalizedVariants.length - 1] : null
      });
      
      setVariants(normalizedVariants);
      setIsSplit(data.isSplit || false);
      setSplitParts(loadedSplitParts);
      setNumberOfSplits(loadedSplitParts.length);
      setError(null);
      console.log('[ComponentItem] ✅ Component loaded and state updated');
      console.log('[ComponentItem] ===== loadComponent complete =====');
    } catch (err) {
      console.error('[ComponentItem] ❌ Error loading component:', err);
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
    console.log('[ComponentItem] ===== handleSplitVariablesChange called =====');
    console.log('[ComponentItem] newVariants count:', newVariants.length);
    console.log('[ComponentItem] splitParts:', splitParts.join(', '));
    console.log('[ComponentItem] Current variants count:', variants.length);
    
    if (newVariants.length < 2) {
      console.warn('[ComponentItem] ❌ At least 2 variables are required');
      setError('At least 2 variables are required');
      return;
    }

    // Validate all variables are objects with all parts
    console.log('[ComponentItem] Validating variants...');
    console.log('[ComponentItem] Current variants count:', variants.length);
    console.log('[ComponentItem] New variants count:', newVariants.length);
    
    // Check if we're adding a new variant (newVariants.length > variants.length)
    const isAddingNew = newVariants.length > variants.length;
    const newVariantIndex = isAddingNew ? newVariants.length - 1 : -1;
    
    console.log('[ComponentItem] isAddingNew:', isAddingNew, 'newVariantIndex:', newVariantIndex);
    
    for (let i = 0; i < newVariants.length; i++) {
      const variant = newVariants[i];
      console.log(`[ComponentItem] Validating variant ${i}:`, variant);
      
      if (!variant || typeof variant !== 'object') {
        console.error(`[ComponentItem] ❌ Variable ${i + 1} must be an object with all parts`);
        setError(`Variable ${i + 1} must be an object with all parts`);
        return;
      }
      
      // Check all parts are present
      for (const part of splitParts) {
        if (!(part in variant)) {
          console.error(`[ComponentItem] ❌ Variable ${i + 1} missing part "${part}"`);
          setError(`Variable ${i + 1} missing part "${part}"`);
          return;
        }
      }
      
      // For newly added variants, require non-empty values
      // For existing variants that are being edited, also require non-empty values
      // Only allow empty values for variants that haven't changed
      const isNewVariant = i === newVariantIndex;
      const existingVariant = variants[i];
      const isVariantChanged = existingVariant && JSON.stringify(existingVariant) !== JSON.stringify(variant);
      
      if (isNewVariant || isVariantChanged) {
        console.log(`[ComponentItem] Validating variant ${i} (strict validation - ${isNewVariant ? 'new' : 'changed'})`);
        for (const part of splitParts) {
          if (!variant[part]?.trim()) {
            console.error(`[ComponentItem] ❌ Variable ${i + 1} missing or empty value for part "${part}"`);
            setError(`Variable ${i + 1} missing or empty value for part "${part}"`);
            return;
          }
        }
      } else {
        console.log(`[ComponentItem] Variant ${i} is unchanged (allowing empty values)`);
      }
    }
    console.log('[ComponentItem] ✅ All variants validated');

    try {
      // Ensure all variants have keys in splitParts order
      console.log('[ComponentItem] Normalizing variants to splitParts order...');
      const normalizedVariants = newVariants.map((variant, index) => {
        const ordered = {};
        splitParts.forEach(part => {
          ordered[part] = variant[part]?.trim() || '';
        });
        console.log(`[ComponentItem] Normalized variant ${index}:`, ordered);
        return ordered;
      });

      console.log('[ComponentItem] ✅ Normalized variants:', {
        count: normalizedVariants.length,
        splitParts: splitParts.join(', '),
        firstVariantKeys: Object.keys(normalizedVariants[0] || {}).join(', '),
        lastVariantKeys: Object.keys(normalizedVariants[normalizedVariants.length - 1] || {}).join(', '),
        lastVariant: normalizedVariants[normalizedVariants.length - 1]
      });

      setVariants(normalizedVariants);
      const data = { 
        name, 
        description, 
        variants: normalizedVariants,
        isSplit: true,
        splitParts: splitParts
      };
      
      console.log('[ComponentItem] 📤 Preparing API request:', {
        id: id,
        dataKeys: Object.keys(data),
        variantsCount: data.variants.length,
        splitParts: data.splitParts,
        lastVariant: data.variants[data.variants.length - 1]
      });
      
      console.log('[ComponentItem] Calling componentAPI.update...');
      const response = await componentAPI.update(id, data);
      console.log('[ComponentItem] ✅ API response received:', response);
      console.log('[ComponentItem] Response variants count:', response.variants?.length);
      
      console.log('[ComponentItem] Reloading component...');
      await loadComponent();
      console.log('[ComponentItem] ✅ Component reloaded after save');
      setError(null);
      console.log('[ComponentItem] ===== handleSplitVariablesChange complete =====');
    } catch (err) {
      console.error('[ComponentItem] ❌ Error saving split variables:', err);
      console.error('[ComponentItem] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
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

  if (loading) {
    return <div className="component-item">Loading...</div>;
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


