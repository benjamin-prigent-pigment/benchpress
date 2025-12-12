import React, { useState, useEffect } from 'react';
import VariantScopeRulesList from './VariantScopeRulesList';
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

  // Handle add rule - save immediately
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

      const newRules = [...prev, { variant1: variant1Id, variant2: variant2Id }];
      // Save immediately
      onSave(newRules);
      return newRules;
    });
  };

  // Handle delete rule - save immediately
  const handleDeleteRule = (index) => {
    setLocalRules(prev => {
      const newRules = prev.filter((_, i) => i !== index);
      // Save immediately
      onSave(newRules);
      return newRules;
    });
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
      <div className="permutation-picker-edit">
        <VariantScopeRulesList
          rules={localRules}
          componentsMap={componentsMap}
          templateComponents={components}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
        />
      </div>
    </div>
  );
}

export default PermutationPicker;

