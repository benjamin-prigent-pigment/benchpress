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
    console.log('[PermutationPicker] handleAddRule called', { variant1Id, variant2Id });
    
    setLocalRules(prev => {
      console.log('[PermutationPicker] Current local rules count:', prev.length);
      
      // Check for duplicate (order-independent)
      const ruleKey = [variant1Id, variant2Id].sort().join('|');
      const isDuplicate = prev.some(rule => {
        const existingKey = [rule.variant1, rule.variant2].sort().join('|');
        return existingKey === ruleKey;
      });

      if (isDuplicate) {
        console.log('[PermutationPicker] Duplicate rule detected in local state, not adding:', { variant1Id, variant2Id, ruleKey });
        return prev; // Don't add duplicate
      }

      const newRule = { variant1: variant1Id, variant2: variant2Id };
      const newRules = [...prev, newRule];
      console.log('[PermutationPicker] Adding new rule, new rules count:', newRules.length);
      console.log('[PermutationPicker] New rule:', newRule);
      console.log('[PermutationPicker] All new rules:', newRules);
      
      // Save immediately
      console.log('[PermutationPicker] Calling onSave with new rules...');
      onSave(newRules);
      console.log('[PermutationPicker] onSave call completed');
      
      return newRules;
    });
  };

  // Handle add multiple rules in batch - save immediately
  const handleAddRulesBatch = (variant1Id, variant2Ids) => {
    console.log('[PermutationPicker] handleAddRulesBatch called', { variant1Id, variant2Ids, variant2Count: variant2Ids.length });
    
    setLocalRules(prev => {
      console.log('[PermutationPicker] Current local rules count:', prev.length);
      
      // Create a set of existing rule keys for fast lookup
      const existingRuleKeys = new Set(
        prev.map(rule => {
          const key = [rule.variant1, rule.variant2].sort().join('|');
          return key;
        })
      );
      
      // Filter out duplicates and create new rules
      const newRulesToAdd = [];
      variant2Ids.forEach(variant2Id => {
        const ruleKey = [variant1Id, variant2Id].sort().join('|');
        if (!existingRuleKeys.has(ruleKey)) {
          existingRuleKeys.add(ruleKey); // Add to set to prevent duplicates within the batch
          newRulesToAdd.push({ variant1: variant1Id, variant2: variant2Id });
        } else {
          console.log('[PermutationPicker] Skipping duplicate in batch:', { variant1Id, variant2Id, ruleKey });
        }
      });

      if (newRulesToAdd.length === 0) {
        console.log('[PermutationPicker] All rules in batch are duplicates, no changes');
        return prev;
      }

      const newRules = [...prev, ...newRulesToAdd];
      console.log('[PermutationPicker] Adding', newRulesToAdd.length, 'new rules in batch, new total count:', newRules.length);
      console.log('[PermutationPicker] New rules to add:', newRulesToAdd);
      
      // Save immediately
      console.log('[PermutationPicker] Calling onSave with new rules (batch)...');
      onSave(newRules);
      console.log('[PermutationPicker] onSave call completed (batch)');
      
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
          onAddRulesBatch={handleAddRulesBatch}
          onDeleteRule={handleDeleteRule}
        />
      </div>
    </div>
  );
}

export default PermutationPicker;

