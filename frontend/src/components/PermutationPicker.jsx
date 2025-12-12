import React, { useState, useEffect } from 'react';
import { IoPencil, IoCheckmark, IoClose } from 'react-icons/io5';
import VariantScopeRulesList from './VariantScopeRulesList';
import IconGreyButton from './buttons/IconGreyButton';
import PrimaryButton from './buttons/PrimaryButton';
import SecondaryButton from './buttons/SecondaryButton';
import './PermutationPicker.css';

/**
 * PermutationPicker - Master component for managing variant scopes
 * Props:
 * - template: template object
 * - componentsMap: map of component name -> component object
 * - variantScopes: current variant scopes from template (array of deny rules)
 * - onSave: callback(variantScopes) when saving
 * - saving: whether save is in progress
 */
function PermutationPicker({
  template,
  componentsMap,
  variantScopes = [],
  onSave,
  saving = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localRules, setLocalRules] = useState([]);

  // Initialize local rules from props
  useEffect(() => {
    // Handle backward compatibility: convert empty dict {} to empty array []
    if (Array.isArray(variantScopes)) {
      setLocalRules(variantScopes);
    } else if (variantScopes && typeof variantScopes === 'object' && Object.keys(variantScopes).length === 0) {
      setLocalRules([]);
    } else {
      setLocalRules([]);
    }
  }, [variantScopes]);

  // Get components used in template
  const components = template?.components || [];

  // Handle add rule
  const handleAddRule = (variant1Id, variant2Id) => {
    setLocalRules(prev => {
      // Check for duplicate (order-independent)
      const ruleKey = [variant1Id, variant2Id].sort().join('|');
      const isDuplicate = prev.some(rule => {
        const existingKey = [rule.variant1, rule.variant2].sort().join('|');
        return existingKey === ruleKey;
      });

      if (isDuplicate) {
        return prev; // Don't add duplicate
      }

      return [...prev, { variant1: variant1Id, variant2: variant2Id }];
    });
  };

  // Handle delete rule
  const handleDeleteRule = (index) => {
    setLocalRules(prev => prev.filter((_, i) => i !== index));
  };

  // Handle edit start
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original rules
    if (Array.isArray(variantScopes)) {
      setLocalRules(variantScopes);
    } else {
      setLocalRules([]);
    }
  };

  // Handle save
  const handleSave = () => {
    // Send array of rules (empty array if no rules)
    const finalRules = Array.isArray(localRules) ? localRules : [];
    onSave(finalRules);
    setIsEditing(false);
  };

  // Generate summary text
  const getSummary = () => {
    const rules = Array.isArray(variantScopes) ? variantScopes : [];
    
    if (rules.length === 0) {
      return 'All variant combinations are allowed (no deny rules)';
    }

    return `${rules.length} deny rule(s)`;
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
          <VariantScopeRulesList
            rules={localRules}
            componentsMap={componentsMap}
            templateComponents={components}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
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
