import { useState } from 'react';
import NonSplitVariables from './NonSplitVariables';
import IconGreyButton from '../buttons/IconGreyButton';
import { IoAdd } from 'react-icons/io5';
import './NonSplitVariableList.css';

function NonSplitVariableList({
  variables = [],
  onVariablesChange,
  onError,
  disabled = false
}) {
  const [newVariable, setNewVariable] = useState(null);

  const handleAdd = () => {
    if (disabled) return;
    setNewVariable(''); // empty string triggers edit mode in NonSplitVariables
  };

  const handleSaveNew = (value) => {
    if (!value || !value.trim()) {
      if (onError) onError('Variable cannot be empty');
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
    if (!value || !value.trim()) {
      if (onError) onError('Variable cannot be empty');
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
    <div className="non-split-variable-list">
      <div className="non-split-variable-list-header">
        <h3 className="non-split-variable-list-title">
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

      <div className="non-split-variable-list-content">
        {variables.map((variable, index) => (
          <NonSplitVariables
            key={index}
            value={variable}
            onSave={(value) => handleSave(index, value)}
            onDelete={() => handleDelete(index)}
            canDelete={variables.length > 2}
            disabled={disabled}
          />
        ))}

        {newVariable !== null && (
          <NonSplitVariables
            value={newVariable}
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

export default NonSplitVariableList;

