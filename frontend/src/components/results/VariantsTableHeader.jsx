import './VariantsTableHeader.css';

function VariantsTableHeader({ variants = [] }) {
  return (
    <thead className="variants-table-header">
      <tr>
        <th className="variants-table-header-cell variants-table-header-cell-overall">
          Overall
        </th>
        {variants.map(({ componentName, variantKey }) => (
          <th 
            key={`${componentName}-${variantKey}`}
            className="variants-table-header-cell"
          >
            <div className="variants-table-header-label">
              <span className="variants-table-header-component">{componentName}</span>
              <span className="variants-table-header-separator">:</span>
              <span className="variants-table-header-variant">{variantKey}</span>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

export default VariantsTableHeader;

