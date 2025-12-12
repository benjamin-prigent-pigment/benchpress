import React, { useState } from 'react';
import { IoAdd, IoTrash } from 'react-icons/io5';
import AddRuleModal from './AddRuleModal';
import IconPrimaryButton from './buttons/IconPrimaryButton';
import IconDestructionButton from './buttons/IconDestructionButton';
import './VariantScopeRulesList.css';

/**
 * VariantScopeRulesList - Rules list container with add/delete functionality
 * Props:
 * - rules: array of deny rules [{variant1: "ComponentName:variantIndex", variant2: "ComponentName:variantIndex"}, ...]
 * - componentsMap: map of component name -> component object
 * - templateComponents: array of component names in template
 * - onAddRule: callback(variant1Id, variant2Id) when rule is added
 * - onDeleteRule: callback(index) when rule is deleted
 */
function VariantScopeRulesList({
  rules = [],
  componentsMap,
  templateComponents = [],
  onAddRule,
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
    // Check for duplicate rule (order-independent)
    const ruleKey1 = [variant1Id, variant2Id].sort().join('|');
    const isDuplicate = rules.some(rule => {
      const existingKey = [rule.variant1, rule.variant2].sort().join('|');
      return existingKey === ruleKey1;
    });

    if (isDuplicate) {
      alert('This rule already exists');
      return;
    }

    onAddRule(variant1Id, variant2Id);
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
        componentsMap={componentsMap}
        templateComponents={templateComponents}
      />
    </div>
  );
}

export default VariantScopeRulesList;

