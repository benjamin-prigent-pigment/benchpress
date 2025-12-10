import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResult } from '../hooks/useResults';
import { resultsAPI } from '../utils/resultsAPI';
import SecondaryPageHeader from '../components/header/SecondaryPageHeader';
import SectionHeader from '../components/header/SectionHeader';
import TimeSpentDistributionChart from '../components/charts/TimeSpentDistributionChart';
import VariantsTableHeader from '../components/results/VariantsTableHeader';
import VariantsTableRow from '../components/results/VariantsTableRow';
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

  // Get total rows from backend (actual CSV row count)
  const totalRows = high_level.total_rows || 0;

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
        title="Metrics Overview"
        label="Key performance indicators across all variants"
      />
      <div className="variants-table-container">
        <table className="variants-table">
          <VariantsTableHeader variants={allVariants} totalRows={totalRows} />
          <tbody>
            <VariantsTableRow
              testName="Pass rates"
              overallValue={high_level.pass_rate}
              variants={allVariants.map(({ componentName, variantKey, variantData }) => ({
                componentName,
                variantKey,
                variantData: {
                  value: variantData.pass_rate,
                  n: variantData.row_count
                }
              }))}
              format="percentage"
            />
            <VariantsTableRow
              testName="Zero-Error Runs"
              overallValue={high_level.zero_error_runs}
              variants={allVariants.map(({ componentName, variantKey, variantData }) => ({
                componentName,
                variantKey,
                variantData: {
                  value: variantData.zero_error_runs,
                  n: variantData.row_count
                }
              }))}
              format="percentage"
            />
            <VariantsTableRow
              testName="Median HITL Turns"
              overallValue={medianHITLTurns}
              variants={allVariants.map(({ componentName, variantKey, variantData }) => {
                const variantBehavioralEfficiency = variantData.behavioral_efficiency || {};
                const variantValue = variantData.median_hitl_turns ?? variantBehavioralEfficiency.median_hitl_turns;
                return {
                  componentName,
                  variantKey,
                  variantData: {
                    value: variantValue,
                    n: variantData.row_count
                  }
                };
              })}
              format="number"
            />
            <VariantsTableRow
              testName="Median Tool Calls"
              overallValue={medianToolCalls}
              variants={allVariants.map(({ componentName, variantKey, variantData }) => {
                const variantBehavioralEfficiency = variantData.behavioral_efficiency || {};
                const variantValue = variantData.median_tool_calls ?? variantBehavioralEfficiency.median_tool_calls;
                return {
                  componentName,
                  variantKey,
                  variantData: {
                    value: variantValue,
                    n: variantData.row_count
                  }
                };
              })}
              format="number"
            />
            <VariantsTableRow
              testName="Median ReACT Calls"
              overallValue={medianReACTCalls}
              variants={allVariants.map(({ componentName, variantKey, variantData }) => {
                const variantBehavioralEfficiency = variantData.behavioral_efficiency || {};
                const variantValue = variantData.median_react_agent_calls ?? variantBehavioralEfficiency.median_react_agent_calls;
                return {
                  componentName,
                  variantKey,
                  variantData: {
                    value: variantValue,
                    n: variantData.row_count
                  }
                };
              })}
              format="number"
            />
            <VariantsTableRow
              testName="Forbidden Tool Call Rate"
              overallValue={forbiddenToolCallRate}
              variants={allVariants.map(({ componentName, variantKey, variantData }) => {
                const variantBehavioralEfficiency = variantData.behavioral_efficiency || {};
                const variantValue = variantData.forbidden_tool_call_rate ?? variantBehavioralEfficiency.forbidden_tool_call_rate;
                return {
                  componentName,
                  variantKey,
                  variantData: {
                    value: variantValue,
                    n: variantData.row_count
                  }
                };
              })}
              format="number"
            />
          </tbody>
        </table>
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
