import './VariantsTableRow.css';

function VariantsTableRow({ 
  testName, 
  overallValue, 
  variants = [], 
  format = 'number' 
}) {
  const formatValue = (val) => {
    if (val === null || val === undefined) return 'N/A';
    
    if (format === 'percentage') {
      return `${(val * 100).toFixed(1)}%`;
    }
    
    if (format === 'number') {
      return val.toFixed(2);
    }
    
    return val;
  };

  return (
    <tr className="variants-table-row">
      <td className="variants-table-cell variants-table-cell-test-name">
        {testName}
      </td>
      <td className="variants-table-cell variants-table-cell-overall">
        <div className="variants-table-cell-content">
          <span className="variants-table-value">{formatValue(overallValue)}</span>
        </div>
      </td>
      {variants.map(({ componentName, variantKey, variantData }) => (
        <td 
          key={`${componentName}-${variantKey}`}
          className="variants-table-cell"
        >
          <div className="variants-table-cell-content">
            <span className="variants-table-value">{formatValue(variantData.value)}</span>
            {variantData.n !== undefined && variantData.n !== null && (
              <span className="variants-table-count">N = {variantData.n}</span>
            )}
          </div>
        </td>
      ))}
    </tr>
  );
}

export default VariantsTableRow;

