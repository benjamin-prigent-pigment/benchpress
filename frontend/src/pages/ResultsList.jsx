import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResults } from '../hooks/useResults';
import ResultUploadModal from '../components/ResultUploadModal';
import PrimaryPageHeader from '../components/header/PrimaryPageHeader';
import PrimaryButton from '../components/buttons/PrimaryButton';
import SecondaryButton from '../components/buttons/SecondaryButton';
import './ResultsList.css';

function ResultsList() {
  const navigate = useNavigate();
  const { results, loading, error, refresh } = useResults();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = `status-badge status-${status}`;
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    return <span className={statusClass}>{statusLabel}</span>;
  };

  if (loading) {
    return (
      <div className="results-list">
        <PrimaryPageHeader title="Results" />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="results-list">
      <PrimaryPageHeader title="Results">
        <SecondaryButton onClick={() => navigate('/results/compare')}>
          Compare results
        </SecondaryButton>
        <PrimaryButton onClick={() => setShowUploadModal(true)}>
          Upload a new test
        </PrimaryButton>
      </PrimaryPageHeader>

      {error && <div className="error">{error}</div>}

      <div className="results-grid">
        {results.length === 0 ? (
          <div className="empty-state">
            <p>No results uploaded yet.</p>
            <p>Upload a test result to get started.</p>
          </div>
        ) : (
          results.map((result) => (
            <div 
              key={result.id} 
              className="result-card"
              onClick={() => navigate(`/results/${result.id}`)}
            >
              <div className="result-card-header">
                <h3>{formatDate(result.upload_date)}</h3>
                {getStatusBadge(result.status)}
              </div>
              <div className="result-card-body">
                <p className="result-template-name">{result.template_name}</p>
                <p className="result-filename">{result.filename}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <ResultUploadModal 
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          refresh(); // Refresh results list after upload
        }}
      />
    </div>
  );
}

export default ResultsList;
