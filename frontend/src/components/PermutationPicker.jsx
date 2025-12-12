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

      // Get current scope for this variant (before update)
      const currentVariantId = `${componentName}:${variantIndex}`;
      const oldAllowedComponents = newScopes[componentName][variantIndex] || [];
      const oldAllowedSet = new Set(oldAllowedComponents);
      const newAllowedSet = new Set(allowedComponents);

      // Find variants that were added or removed
      const addedVariants = allowedComponents.filter(v => !oldAllowedSet.has(v));
      const removedVariants = oldAllowedComponents.filter(v => !newAllowedSet.has(v));

      // Helper function to get all possible variant IDs for a component (excluding itself)
      const getAllVariantIdsForComponent = (compName) => {
        return components
          .filter(c => c !== compName)
          .flatMap(comp => {
            const compData = componentsMap[comp];
            if (!compData || !compData.variants) return [];
            return compData.variants.map((_, idx) => `${comp}:${idx}`);
          });
      };

      // Update bidirectional relationships
      // When we add a variant to this scope, also add this variant to that variant's scope
      addedVariants.forEach(otherVariantId => {
        const [otherCompName, otherVariantIdxStr] = otherVariantId.split(':');
        const otherVariantIdx = parseInt(otherVariantIdxStr);
        
        // Initialize other component's scope if needed
        if (!newScopes[otherCompName]) {
          newScopes[otherCompName] = {};
        }
        
        // Get current allowed list for the other variant
        const otherVariantCurrentScope = newScopes[otherCompName][otherVariantIdx];
        
        // If no scope exists, it means all variants are allowed by default (including current variant)
        // So we don't need to do anything - it already allows the current variant
        if (otherVariantCurrentScope !== undefined) {
          // Scope exists, add current variant if not already present
          if (!otherVariantCurrentScope.includes(currentVariantId)) {
            newScopes[otherCompName][otherVariantIdx] = [...otherVariantCurrentScope, currentVariantId];
          }
        }
        // If scope doesn't exist, no action needed (default allows all)
      });

      // When we remove a variant from this scope, also remove this variant from that variant's scope
      removedVariants.forEach(otherVariantId => {
        const [otherCompName, otherVariantIdxStr] = otherVariantId.split(':');
        const otherVariantIdx = parseInt(otherVariantIdxStr);
        
        // Initialize other component's scope if needed
        if (!newScopes[otherCompName]) {
          newScopes[otherCompName] = {};
        }
        
        const otherVariantCurrentScope = newScopes[otherCompName][otherVariantIdx];
        
        if (otherVariantCurrentScope === undefined) {
          // No scope exists - means all variants are allowed by default
          // Create a scope with all variants EXCEPT the current variant
          const allOtherVariants = getAllVariantIdsForComponent(otherCompName);
          const updatedOtherAllowed = allOtherVariants.filter(v => v !== currentVariantId);
          
          // Calculate total variants for the other component
          const totalOtherVariantsForOther = components
            .filter(c => c !== otherCompName)
            .reduce((total, compName) => {
              const comp = componentsMap[compName];
              if (comp && comp.variants) {
                return total + comp.variants.length;
              }
              return total;
            }, 0);
          
          // Only create scope entry if not all variants are allowed
          if (updatedOtherAllowed.length < totalOtherVariantsForOther) {
            newScopes[otherCompName][otherVariantIdx] = updatedOtherAllowed;
          }
        } else {
          // Scope exists, remove current variant from it
          const updatedOtherAllowed = otherVariantCurrentScope.filter(v => v !== currentVariantId);
          
          // Check if we should remove the scope entry (if all variants are now allowed)
          const totalOtherVariantsForOther = components
            .filter(c => c !== otherCompName)
            .reduce((total, compName) => {
              const comp = componentsMap[compName];
              if (comp && comp.variants) {
                return total + comp.variants.length;
              }
              return total;
            }, 0);
          
          if (updatedOtherAllowed.length === totalOtherVariantsForOther && totalOtherVariantsForOther > 0) {
            // All variants allowed - remove scope entry (use default)
            delete newScopes[otherCompName][otherVariantIdx];
            if (Object.keys(newScopes[otherCompName]).length === 0) {
              delete newScopes[otherCompName];
            }
          } else {
            // Update the scope
            newScopes[otherCompName][otherVariantIdx] = updatedOtherAllowed;
          }
        }
      });

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
