import './VariantsTableHeader.css';

function VariantsTableHeader({ variants = [], totalRows }) {
  const totalN = totalRows || variants.reduce((sum, { variantData }) => sum + (variantData.row_count || 0), 0);

  return (
    <thead className="variants-table-header">
      <tr>
        <th className="variants-table-header-cell variants-table-header-cell-test-name">
          Testing:
        </th>
        <th className="variants-table-header-cell variants-table-header-cell-overall">
          Overall (N={totalN})
        </th>
        {variants.map(({ componentName, variantKey }) => {
          const fullLabel = `${componentName}: ${variantKey}`;
          return (
            <th 
              key={`${componentName}-${variantKey}`}
              className="variants-table-header-cell variants-table-header-cell-hoverable"
              title={fullLabel}
            >
              <div className="variants-table-header-label">
                <div className="variants-table-header-line">
                  <span className="variants-table-header-component">{componentName}</span>
                </div>
                <div className="variants-table-header-line">
                  <span className="variants-table-header-separator">:</span>
                  <span className="variants-table-header-variant">{variantKey}</span>
                </div>
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export default VariantsTableHeader;

