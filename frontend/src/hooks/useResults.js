import { useState, useEffect } from 'react';
import { resultsAPI } from '../utils/resultsAPI';

/**
 * Hook for managing results data
 * @returns {Object} { results, loading, error, refresh }
 */
export function useResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resultsAPI.getAllResults();
      setResults(data);
    } catch (err) {
      console.error('[useResults] Error fetching results:', err);
      setError(err.message || 'Failed to fetch results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return {
    results,
    loading,
    error,
    refresh: fetchResults,
  };
}

/**
 * Hook for fetching a single result
 * @param {number} resultId - The result ID to fetch
 * @returns {Object} { result, loading, error, refresh }
 */
export function useResult(resultId) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResult = async () => {
    if (!resultId || resultId === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await resultsAPI.getResult(resultId);
      setResult(data);
    } catch (err) {
      console.error('[useResult] Error fetching result:', err);
      setError(err.message || 'Failed to fetch result');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId]);

  return {
    result,
    loading,
    error,
    refresh: fetchResult,
  };
}

