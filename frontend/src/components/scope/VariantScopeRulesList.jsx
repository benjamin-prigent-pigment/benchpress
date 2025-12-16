import React, { useState } from 'react';
import { IoAdd, IoTrash } from 'react-icons/io5';
import AddRuleModal from './AddRuleModal';
import IconPrimaryButton from '../buttons/IconPrimaryButton';
import IconDestructionButton from '../buttons/IconDestructionButton';
import './VariantScopeRulesList.css';

/**
 * VariantScopeRulesList - Rules list container with add/delete functionality
 * Props:
 * - rules: array of deny rules [{variant1: "ComponentName:variantIndex", variant2: "ComponentName:variantIndex"}, ...]
 * - componentsMap: map of component name -> component object
 * - templateComponents: array of component names in template
 * - onAddRule: callback(variant1Id, variant2Id) when rule is added (single rule)
 * - onAddRulesBatch: optional callback(variant1Id, variant2Ids[]) when multiple rules are added (batch)
 * - onDeleteRule: callback(index) when rule is deleted
 */
function VariantScopeRulesList({
  rules = [],
  componentsMap,
  templateComponents = [],
  onAddRule,
  onAddRulesBatch,
  onDeleteRule
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get display text for a variant identifier
  const getVariantDisplayText = (variantId) => {
    const [compName, variantIdxStr] = variantId.split(':');
    const variantIdx = parseInt(variantIdxStr);
    
    const component = componentsMap[compName];
    if (!component || !component.variants) {
      return variantId; // Fallback
    }
    
    const variant = component.variants[variantIdx];
    if (variant === undefined) {
      return variantId; // Fallback
    }
    
    const isSplit = component.isSplit || false;
    const splitParts = component.splitParts || [];
    
    if (isSplit && typeof variant === 'object') {
      const variantText = splitParts.map(part => `${variant[part] || ''}`).join(': ');
      return `${compName}: ${variantText}`;
    } else {
      return `${compName}: ${String(variant)}`;
    }
  };

  const handleAddRule = (variant1Id, variant2Id) => {
    console.log('[VariantScopeRulesList] handleAddRule called', { variant1Id, variant2Id, currentRulesCount: rules.length });
    
    // Check for duplicate rule (order-independent)
    const ruleKey1 = [variant1Id, variant2Id].sort().join('|');
    const isDuplicate = rules.some(rule => {
      const existingKey = [rule.variant1, rule.variant2].sort().join('|');
      return existingKey === ruleKey1;
    });

    if (isDuplicate) {
      console.log('[VariantScopeRulesList] Duplicate rule detected, not adding:', { variant1Id, variant2Id, ruleKey: ruleKey1 });
      alert('This rule already exists');
      return;
    }

    console.log('[VariantScopeRulesList] Rule is not duplicate, calling onAddRule:', { variant1Id, variant2Id });
    onAddRule(variant1Id, variant2Id);
    console.log('[VariantScopeRulesList] onAddRule call completed');
  };

  const handleAddRulesBatch = (variant1Id, variant2Ids) => {
    console.log('[VariantScopeRulesList] handleAddRulesBatch called', { variant1Id, variant2Ids, variant2Count: variant2Ids.length, currentRulesCount: rules.length });
    
    if (!onAddRulesBatch) {
      console.log('[VariantScopeRulesList] onAddRulesBatch not available, falling back to individual calls');
      variant2Ids.forEach(v2Id => handleAddRule(variant1Id, v2Id));
      return;
    }

    // Filter out duplicates before calling batch handler
    const rulesToAdd = variant2Ids.filter(v2Id => {
      const ruleKey = [variant1Id, v2Id].sort().join('|');
      const isDuplicate = rules.some(rule => {
        const existingKey = [rule.variant1, rule.variant2].sort().join('|');
        return existingKey === ruleKey;
      });
      
      if (isDuplicate) {
        console.log('[VariantScopeRulesList] Skipping duplicate in batch:', { variant1Id, variant2Id: v2Id });
      }
      
      return !isDuplicate;
    });

    if (rulesToAdd.length === 0) {
      console.log('[VariantScopeRulesList] All rules in batch are duplicates');
      alert('All selected rules already exist');
      return;
    }

    if (rulesToAdd.length < variant2Ids.length) {
      console.log('[VariantScopeRulesList] Some rules were duplicates, adding', rulesToAdd.length, 'out of', variant2Ids.length);
    }

    console.log('[VariantScopeRulesList] Calling onAddRulesBatch with', rulesToAdd.length, 'rules');
    onAddRulesBatch(variant1Id, rulesToAdd);
    console.log('[VariantScopeRulesList] onAddRulesBatch call completed');
  };

  return (
    <div className="variant-scope-rules-list">
      <div className="rules-list-header">
        <h4>Deny Rules</h4>
        <IconPrimaryButton
          icon={<IoAdd size={18} />}
          onClick={() => setIsModalOpen(true)}
          ariaLabel="Add rule"
          title="Add rule"
        />
      </div>

      {rules.length === 0 ? (
        <div className="rules-list-empty">
          No deny rules. All variant combinations are allowed.
        </div>
      ) : (
        <div className="rules-list-items">
          {rules.map((rule, index) => {
            const variant1Text = getVariantDisplayText(rule.variant1);
            const variant2Text = getVariantDisplayText(rule.variant2);
            
            return (
              <div key={index} className="rule-item">
                <div className="rule-item-content">
                  <span className="rule-variant">{variant1Text}</span>
                  <span className="rule-separator">×</span>
                  <span className="rule-variant">{variant2Text}</span>
                </div>
                <IconDestructionButton
                  icon={<IoTrash size={16} />}
                  onClick={() => onDeleteRule(index)}
                  ariaLabel="Delete rule"
                  title="Delete rule"
                />
              </div>
            );
          })}
        </div>
      )}

      <AddRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddRule}
        onAddBatch={onAddRulesBatch ? handleAddRulesBatch : undefined}
        componentsMap={componentsMap}
        templateComponents={templateComponents}
        existingRules={rules}
      />
    </div>
  );
}

export default VariantScopeRulesList;

