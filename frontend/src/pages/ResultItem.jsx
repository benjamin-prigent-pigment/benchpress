import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResult } from '../hooks/useResults';
import { resultsAPI } from '../utils/resultsAPI';
import SecondaryPageHeader from '../components/header/SecondaryPageHeader';
import SectionHeader from '../components/header/SectionHeader';
import KPICard from '../components/charts/KPICard';
import TimeSpentDistributionChart from '../components/charts/TimeSpentDistributionChart';
import BehavioralEfficiencyCard from '../components/charts/BehavioralEfficiencyCard';
import './ResultItem.css';

function ResultItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { result, loading, error, refresh } = useResult(id);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this result? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await resultsAPI.deleteResult(id);
      navigate('/results');
    } catch (err) {
      console.error('[ResultItem] Error deleting result:', err);
      alert(`Failed to delete result: ${err.message || 'Unknown error'}`);
      setIsDeleting(false);
    }
  };

  // Poll for updates if status is 'processing'
  useEffect(() => {
    if (result?.status === 'processing') {
      const interval = setInterval(() => {
        refresh();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [result?.status, refresh]);

  if (loading) {
    return (
      <div className="result-item">
        <SecondaryPageHeader title="Result" backPath="/results" />
        <div className="loading">Loading result...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-item">
        <SecondaryPageHeader title="Result" backPath="/results" />
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-item">
        <SecondaryPageHeader title="Result" backPath="/results" />
        <div className="error">Result not found</div>
      </div>
    );
  }

  // If status is 'processing', show processing state
  if (result.status === 'processing') {
    return (
      <div className="result-item">
        <SecondaryPageHeader title="Result" backPath="/results" />
        <div className="processing-state">
          <div className="processing-spinner"></div>
          <p>Processing result data...</p>
          <p className="processing-note">This may take a few moments. The page will update automatically.</p>
          <button className="btn-secondary" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // If status is 'error', show error state
  if (result.status === 'error') {
    return (
      <div className="result-item">
        <SecondaryPageHeader title="Result" backPath="/results" />
        <div className="error-state">
          <h2>Error Processing Result</h2>
          <p>{result.error_message || 'An error occurred while processing this result.'}</p>
        </div>
      </div>
    );
  }

  // If result doesn't have high_level data, it might still be processing
  if (!result.high_level) {
    return (
      <div className="result-item">
        <SecondaryPageHeader title="Result" backPath="/results" />
        <div className="processing-state">
          <p>Calculating KPIs...</p>
          <button className="btn-secondary" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const { high_level, components } = result;
  
  // Handle both nested and flattened data structures
  const behavioralEfficiency = high_level.behavioral_efficiency || {};
  const medianHITLTurns = high_level.median_hitl_turns ?? behavioralEfficiency.median_hitl_turns;
  const medianToolCalls = high_level.median_tool_calls ?? behavioralEfficiency.median_tool_calls;
  const medianReACTCalls = high_level.median_react_agent_calls ?? behavioralEfficiency.median_react_agent_calls;
  const forbiddenToolCallRate = high_level.forbidden_tool_call_rate ?? behavioralEfficiency.forbidden_tool_call_rate;

  // Collect all variants from all components
  const allVariants = [];
  if (components) {
    Object.entries(components).forEach(([componentName, componentData]) => {
      if (componentData.has_data !== false && componentData.variants) {
        Object.entries(componentData.variants).forEach(([variantKey, variantData]) => {
          allVariants.push({
            componentName,
            variantKey,
            variantData
          });
        });
      }
    });
  }



  return (
    <div className="result-item">
      
      <SecondaryPageHeader 
        title="Result Analysis" 
        backPath="/results"
        onDelete={handleDelete}
        deleteLabel="Delete Result"
        deleteDisabled={isDeleting}
      />
    
      
      <SectionHeader 
        title="Pass rates"
        label="How many times the tests were successful"
      />
      <div className="kpi-grid">
        <KPICard
          label="Overall score"
          value={high_level.pass_rate}
          format="percentage"
        />
        {allVariants.map(({ componentName, variantKey, variantData }) => (
          <KPICard
            key={`${componentName}-${variantKey}`}
            label={`${componentName}: ${variantKey}`}
            value={variantData.pass_rate}
            format="percentage"
            n={variantData.row_count}
          />
        ))}
      </div>

      <SectionHeader 
        title="Zero-Error Runs" 
        label="How many times all the runs of a test were successful"
      />
      <div className="kpi-grid">
        <KPICard
          label="Overall score"
          value={high_level.zero_error_runs}
          format="percentage"
        />
        {allVariants.map(({ componentName, variantKey, variantData }) => (
          <KPICard
            key={`${componentName}-${variantKey}`}
            label={`${componentName}: ${variantKey}`}
            value={variantData.zero_error_runs}
            format="percentage"
            n={variantData.row_count}
          />
        ))}
      </div>

      <SectionHeader 
        title="Median HITL Turns" 
        label="How many times the fake user (the LLM passing as the user) interacted with the AI agent"
      />
      <div className="kpi-grid">
        <KPICard
          label="Overall score"
          value={medianHITLTurns}
          format="number"
        />
        {allVariants.map(({ componentName, variantKey, variantData }) => {
          const variantBehavioralEfficiency = variantData.behavioral_efficiency || {};
          const variantValue = variantData.median_hitl_turns ?? variantBehavioralEfficiency.median_hitl_turns;
          return (
            <KPICard
              key={`${componentName}-${variantKey}`}
              label={`${componentName}: ${variantKey}`}
              value={variantValue}
              format="number"
              n={variantData.row_count}
            />
          );
        })}
      </div>

      <SectionHeader 
        title="Median Tool Calls" 
        label="How many times AI tools was were called"
      />
      <div className="kpi-grid">
        <KPICard
          label="Overall score"
          value={medianToolCalls}
          format="number"
        />
        {allVariants.map(({ componentName, variantKey, variantData }) => {
          const variantBehavioralEfficiency = variantData.behavioral_efficiency || {};
          const variantValue = variantData.median_tool_calls ?? variantBehavioralEfficiency.median_tool_calls;
          return (
            <KPICard
              key={`${componentName}-${variantKey}`}
              label={`${componentName}: ${variantKey}`}
              value={variantValue}
              format="number"
              n={variantData.row_count}
            />
          );
        })}
      </div>

      <SectionHeader 
        title="Median ReACT Calls" 
        label="How many times some ReACT agent was called"
      />
      <div className="kpi-grid">
        <KPICard
          label="Overall score"
          value={medianReACTCalls}
          format="number"
        />
        {allVariants.map(({ componentName, variantKey, variantData }) => {
          const variantBehavioralEfficiency = variantData.behavioral_efficiency || {};
          const variantValue = variantData.median_react_agent_calls ?? variantBehavioralEfficiency.median_react_agent_calls;
          return (
            <KPICard
              key={`${componentName}-${variantKey}`}
              label={`${componentName}: ${variantKey}`}
              value={variantValue}
              format="number"
              n={variantData.row_count}
            />
          );
        })}
      </div>

      <SectionHeader 
        title="Median forbidden tool call " 
        label="How many times the AI agent called the wrong tools"
      />
      <div className="kpi-grid">
        <KPICard
          label="Overall score"
          value={forbiddenToolCallRate}
          format="number"
        />
        {allVariants.map(({ componentName, variantKey, variantData }) => {
          const variantBehavioralEfficiency = variantData.behavioral_efficiency || {};
          const variantValue = variantData.forbidden_tool_call_rate ?? variantBehavioralEfficiency.forbidden_tool_call_rate;
          return (
            <KPICard
              key={`${componentName}-${variantKey}`}
              label={`${componentName}: ${variantKey}`}
              value={variantValue}
              format="number"
              n={variantData.row_count}
            />
          );
        })}
      </div>

      <SectionHeader title="Performance Speed" />
      <div className="chart-section">
        <TimeSpentDistributionChart
          data={high_level.performance_speed?.histogram}
          median={high_level.performance_speed?.median}
          average={high_level.performance_speed?.average}
          max={high_level.performance_speed?.max}
          min={high_level.performance_speed?.min}
        />
      </div>

      
    </div>
  );
}

export default ResultItem;
