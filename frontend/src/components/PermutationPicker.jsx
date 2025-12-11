import React, { useState, useEffect } from 'react';
import { IoPencil, IoCheckmark, IoClose } from 'react-icons/io5';
import ComponentVariantScopeList from './ComponentVariantScopeList';
import IconGreyButton from './buttons/IconGreyButton';
import PrimaryButton from './buttons/PrimaryButton';
import SecondaryButton from './buttons/SecondaryButton';
import './PermutationPicker.css';

/**
 * PermutationPicker - Master component for managing variant scopes
 * Props:
 * - template: template object
 * - componentsMap: map of component name -> component object
 * - variantScopes: current variant scopes from template
 * - onSave: callback(variantScopes) when saving
 * - saving: whether save is in progress
 */
function PermutationPicker({
  template,
  componentsMap,
  variantScopes = {},
  onSave,
  saving = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localScopes, setLocalScopes] = useState({});

  // Initialize local scopes from props
  useEffect(() => {
    setLocalScopes(variantScopes || {});
  }, [variantScopes]);

  // Get components used in template
  const components = template?.components || [];

  // Handle scope change from child component
  const handleScopeChange = (componentName, variantIndex, allowedComponents) => {
    setLocalScopes(prev => {
      const newScopes = { ...prev };
      
      // Get other components for this component
      const otherComponents = components.filter(c => c !== componentName);
      
      // Calculate total number of variants from other components
      const totalOtherVariants = otherComponents.reduce((total, compName) => {
        const comp = componentsMap[compName];
        if (comp && comp.variants) {
          return total + comp.variants.length;
        }
        return total;
      }, 0);
      
      // Initialize component entry if needed
      if (!newScopes[componentName]) {
        newScopes[componentName] = {};
      }

      // If all other variants are allowed, remove the scope entry (default behavior)
      // Otherwise, set the scope
      // allowedComponents now contains variant identifiers like "ComponentName:variantIndex"
      if (allowedComponents.length === totalOtherVariants && totalOtherVariants > 0) {
        // All other variants allowed - remove this variant's scope (use default)
        delete newScopes[componentName][variantIndex];
        // If component has no scopes left, remove it
        if (Object.keys(newScopes[componentName]).length === 0) {
          delete newScopes[componentName];
        }
      } else {
        // Set the scope (allowedComponents contains variant identifiers)
        newScopes[componentName][variantIndex] = allowedComponents;
      }

      return newScopes;
    });
  };

  // Handle edit start
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original scopes
    setLocalScopes(variantScopes || {});
  };

  // Handle save
  const handleSave = () => {
    // Normalize: remove empty component entries
    const normalizedScopes = {};
    for (const [compName, scopes] of Object.entries(localScopes)) {
      if (scopes && Object.keys(scopes).length > 0) {
        normalizedScopes[compName] = scopes;
      }
    }
    
    // If normalized is empty, send empty object
    const finalScopes = Object.keys(normalizedScopes).length === 0 ? {} : normalizedScopes;
    
    onSave(finalScopes);
    setIsEditing(false);
  };

  // Generate summary text
  const getSummary = () => {
    if (!variantScopes || Object.keys(variantScopes).length === 0) {
      return 'All variants can map to all components (no restrictions)';
    }

    const componentCount = Object.keys(variantScopes).length;
    const totalRestrictions = Object.values(variantScopes).reduce(
      (sum, scopes) => sum + Object.keys(scopes).length,
      0
    );

    return `${totalRestrictions} variant restriction(s) across ${componentCount} component(s)`;
  };

  if (!template || !components || components.length === 0) {
    return (
      <div className="permutation-picker-empty">
        No components found in template
      </div>
    );
  }

  return (
    <div className="permutation-picker">
      <div className="permutation-picker-header">
        <h3>Variants scopes</h3>
        {!isEditing && (
          <IconGreyButton
            icon={<IoPencil size={20} />}
            onClick={handleStartEdit}
            ariaLabel="Edit variant scopes"
            title="Edit variant scopes"
          />
        )}
      </div>

      {!isEditing ? (
        <div className="permutation-picker-display">
          <div className="permutation-picker-summary">
            {getSummary()}
          </div>
        </div>
      ) : (
        <div className="permutation-picker-edit">
          <ComponentVariantScopeList
            components={components}
            componentsMap={componentsMap}
            variantScopes={localScopes}
            onScopeChange={handleScopeChange}
          />
          <div className="permutation-picker-actions">
            <SecondaryButton
              onClick={handleCancel}
              disabled={saving}
            >
              <IoClose size={18} style={{ marginRight: '6px' }} />
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleSave}
              disabled={saving}
            >
              <IoCheckmark size={18} style={{ marginRight: '6px' }} />
              {saving ? 'Saving...' : 'Save'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default PermutationPicker;
