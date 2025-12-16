import { useState } from 'react';
import IconGreyButton from '../buttons/IconGreyButton';
import SplitNumberSystem from './SplitNumberSystem';
import SplitVariable from './SplitVariable';
import { IoAdd } from 'react-icons/io5';
import './SplitVariableList.css';

function SplitVariableList({
  variables = [],
  splitParts = [],
  onVariablesChange,
  onSplitPartsChange,
  onError,
  disabled = false
}) {
  const [newVariable, setNewVariable] = useState(null);

  const handleAdd = () => {
    if (disabled) return;
    setNewVariable({}); // Empty object triggers edit mode in SplitVariable
  };

  const handleSaveNew = (value) => {
    console.log('[SplitVariableList] handleSaveNew called with:', {
      value: value,
      valueKeys: Object.keys(value || {}).join(', '),
      splitParts: splitParts.join(', ')
    });
    
    // Validate all parts are filled
    const missingParts = splitParts.filter(part => !value[part]?.trim());
    if (missingParts.length > 0) {
      console.warn('[SplitVariableList] Cannot save: missing parts', missingParts);
      if (onError) onError(`All parts must be filled. Missing: ${missingParts.join(', ')}`);
      return;
    }
    
    // Ensure value keys are in splitParts order
    const orderedValue = {};
    splitParts.forEach(part => {
      orderedValue[part] = value[part]?.trim() || '';
    });
    
    console.log('[SplitVariableList] Adding new variable with order:', {
      splitParts: splitParts.join(', '),
      valueKeys: Object.keys(value).join(', '),
      orderedKeys: Object.keys(orderedValue).join(', '),
      orderedValue: orderedValue
    });
    
    const newVariables = [...variables, orderedValue];
    console.log('[SplitVariableList] Calling onVariablesChange with', newVariables.length, 'variables');
    onVariablesChange(newVariables);
    setNewVariable(null);
    if (onError) onError(null);
  };

  const handleCancelNew = () => {
    setNewVariable(null);
  };

  const handleSave = (index, value) => {
    // Validate all parts are filled
    if (!splitParts.every(part => value[part]?.trim())) {
      if (onError) onError('All parts must be filled');
      return;
    }
    
    // Ensure value keys are in splitParts order
    const orderedValue = {};
    splitParts.forEach(part => {
      orderedValue[part] = value[part]?.trim() || '';
    });
    
    const valueKeys = Object.keys(value).join(', ');
    const orderedKeys = Object.keys(orderedValue).join(', ');
    if (valueKeys !== orderedKeys) {
      console.log('[SplitVariableList] Reordering variable at index', index, ':', {
        splitParts: splitParts.join(', '),
        originalKeys: valueKeys,
        orderedKeys: orderedKeys
      });
    }
    
    const updated = [...variables];
    updated[index] = orderedValue;
    onVariablesChange(updated);
    if (onError) onError(null);
  };

  const handleDelete = (index) => {
    if (variables.length <= 2) {
      if (onError) onError('At least 2 variables are required');
      return;
    }
    const updated = variables.filter((_, i) => i !== index);
    onVariablesChange(updated);
    if (onError) onError(null);
  };

  return (
    <div className="split-variable-list">
      <div className="split-variable-list-header">
        <h3 className="split-variable-list-title">
          Variables ({variables.length})
        </h3>
        {!disabled && (
          <IconGreyButton
            icon={<IoAdd size={18} />}
            onClick={handleAdd}
            ariaLabel="Add variable"
            title="Add variable"
            disabled={newVariable !== null}
          />
        )}
      </div>

      <SplitNumberSystem
        splitParts={splitParts}
        onSplitPartsChange={onSplitPartsChange}
        onError={onError}
        disabled={disabled}
      />

      <div className="split-variable-list-content">
        {variables.map((variable, index) => (
          <SplitVariable
            key={index}
            variable={variable}
            splitParts={splitParts}
            onSave={(value) => handleSave(index, value)}
            onDelete={() => handleDelete(index)}
            canDelete={variables.length > 2}
            disabled={disabled}
          />
        ))}

        {newVariable !== null && (
          <SplitVariable
            variable={newVariable}
            splitParts={splitParts}
            onSave={handleSaveNew}
            onDelete={handleCancelNew}
            canDelete={true}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}

export default SplitVariableList;

