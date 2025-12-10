import KPICard from './KPICard';

function BehavioralEfficiencyCard({ data, comparison }) {
  if (!data) {
    return <div className="behavioral-efficiency-card">No data available</div>;
  }

  return (
    <div className="behavioral-efficiency-card">
      <h3>Behavioral Efficiency</h3>
      <div className="behavioral-metrics">
        <KPICard
          label="Median HITL Turns"
          value={data.median_hitl_turns}
          format="number"
          comparison={comparison?.median_hitl_turns}
        />
        <KPICard
          label="Median Tool Calls"
          value={data.median_tool_calls}
          format="number"
          comparison={comparison?.median_tool_calls}
        />
        <KPICard
          label="Median ReACT Calls"
          value={data.median_react_agent_calls}
          format="number"
          comparison={comparison?.median_react_agent_calls}
        />
        <KPICard
          label="Median Forbidden Tool Calls"
          value={data.median_forbidden_tool_calls}
          format="number"
          comparison={comparison?.median_forbidden_tool_calls}
        />
      </div>
    </div>
  );
}

export default BehavioralEfficiencyCard;

