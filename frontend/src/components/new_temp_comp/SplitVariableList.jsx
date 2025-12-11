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
    // Validate all parts are filled
    if (!splitParts.every(part => value[part]?.trim())) {
      if (onError) onError('All parts must be filled');
      return;
    }
    onVariablesChange([...variables, value]);
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
    const updated = [...variables];
    updated[index] = value;
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

