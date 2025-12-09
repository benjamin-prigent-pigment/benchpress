import { useState, useEffect } from 'react';
import { componentAPI } from '../utils/api';

/**
 * Custom hook for components operations
 */
export const useComponents = () => {
  const [components, setComponents] = useState([]);
  const [componentsMap, setComponentsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const loadComponents = async () => {
    try {
      console.log('[useComponents] Loading components...');
      setLoading(true);
      const data = await componentAPI.getAll();
      console.log('[useComponents] Components loaded:', data);
      setComponents(data);
      // Create a map for quick lookup by name
      const map = {};
      data.forEach(comp => {
        map[comp.name] = comp;
      });
      setComponentsMap(map);
    } catch (err) {
      console.error('[useComponents] Failed to load components:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComponents();
  }, []);

  return {
    components,
    componentsMap,
    loading,
    reloadComponents: loadComponents
  };
};

