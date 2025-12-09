import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function TimeSpentDistributionChart({ data, median, average, max, min }) {
  if (!data || data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  // Format data for Recharts
  const chartData = data.map((bin, index) => ({
    name: `${bin.bin_start.toFixed(1)}s`,
    count: bin.count,
    binStart: bin.bin_start,
    binEnd: bin.bin_end,
  }));

  return (
    <div className="time-spent-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [value, 'Count']}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                const bin = payload[0].payload;
                return `${bin.binStart.toFixed(2)}s - ${bin.binEnd.toFixed(2)}s`;
              }
              return label;
            }}
          />
          <Bar dataKey="count" fill="#007bff" />
          {median !== undefined && (
            <ReferenceLine 
              x={chartData.findIndex(d => d.binStart <= median && d.binEnd >= median) >= 0 
                ? chartData[chartData.findIndex(d => d.binStart <= median && d.binEnd >= median)].name 
                : chartData[0]?.name} 
              stroke="#ff6b6b" 
              strokeDasharray="3 3"
              label={{ value: 'Median', position: 'top' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Median:</span>
          <span className="stat-value">{median?.toFixed(2)}s</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average:</span>
          <span className="stat-value">{average?.toFixed(2)}s</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Min:</span>
          <span className="stat-value">{min?.toFixed(2)}s</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max:</span>
          <span className="stat-value">{max?.toFixed(2)}s</span>
        </div>
      </div>
    </div>
  );
}

export default TimeSpentDistributionChart;

