import './KPICard.css';

function KPICard({ label, value, format = 'number', comparison, n }) {
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

  const getComparisonIndicator = () => {
    if (!comparison) return null;
    
    const { absolute, percentage } = comparison;
    const isPositive = absolute > 0;
    const indicatorClass = isPositive ? 'comparison-positive' : 'comparison-negative';
    const sign = isPositive ? '+' : '';
    
    return (
      <div className={`comparison-indicator ${indicatorClass}`}>
        {sign}{percentage.toFixed(1)}%
      </div>
    );
  };

  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {formatValue(value)}
        {getComparisonIndicator()}
      </div>
      {n !== undefined && n !== null && (
        <div className="kpi-count">N = {n}</div>
      )}
    </div>
  );
}

export default KPICard;

