"""Orchestrator for calculating all KPIs for a result"""

from .metadata import read_results_metadata, write_results_metadata
from .csv_parser import read_result_csv
from .calculations import calculate_high_level_kpis, calculate_component_kpis
from .permutations import load_permutation_mapping


def calculate_all_kpis(result_id):
    """Calculate all KPIs (high-level and component-level) for a result.
    
    This is the main orchestration function that:
    1. Loads result data and metadata
    2. Calculates high-level KPIs
    3. Determines available components (from permutation_object or template)
    4. Calculates component-level KPIs for each component
    5. Updates metadata status
    
    Args:
        result_id: ID of the result
        
    Returns:
        Dict with complete KPI object:
        {
            'result_id': int,
            'template_id': int,
            'high_level': {...},  # From calculate_high_level_kpis
            'components': {
                component_name: {...},  # From calculate_component_kpis
                ...
            }
        }
        
    Raises:
        FileNotFoundError: If result doesn't exist
        ValueError: If template or permutation file issues
    """
    # Load result CSV and metadata
    metadata = read_results_metadata()
    result_meta = next((r for r in metadata if r['id'] == result_id), None)
    if not result_meta:
        raise FileNotFoundError(f'Result with id {result_id} not found')
    
    template_id = result_meta['template_id']
    
    try:
        # Read result data
        result_data = read_result_csv(result_id)
        
        # Calculate high-level KPIs
        high_level_kpis = calculate_high_level_kpis(result_data)
        
        # Try to get components list from permutation_object in result data
        # If not available, fall back to template
        components = []
        permutation_lookup = None
        
        # Check if any rows have permutation_object
        has_permutation_object = any('permutation_object' in row and row.get('permutation_object') for row in result_data)
        
        if has_permutation_object:
            # Extract unique component names from permutation_object in result data
            component_set = set()
            for row in result_data:
                if 'permutation_object' in row and row.get('permutation_object'):
                    perm_obj = row['permutation_object']
                    if isinstance(perm_obj, list):
                        for perm_item in perm_obj:
                            if isinstance(perm_item, dict):
                                component_set.update(perm_item.keys())
            components = sorted(list(component_set))
        
        # Always try to load permutation_lookup as fallback for rows without permutation_object
        # or if we couldn't extract components from permutation_object
        try:
            lookup, template_components = load_permutation_mapping(template_id)
            permutation_lookup = lookup
            # If we didn't get components from permutation_object, use template components
            if not components:
                components = template_components
        except (FileNotFoundError, ValueError):
            # If permutation file doesn't exist or template not found, 
            # we can still do component-level analysis if permutation_object is available
            if not components:
                # Can't do component-level analysis without either permutation_object or template
                components = []
        
        # Calculate component-level KPIs for each component
        component_kpis = {}
        for component_name in components:
            component_kpis[component_name] = calculate_component_kpis(
                result_data, component_name, permutation_lookup
            )
        
        # Build complete KPI object
        kpi_object = {
            'result_id': result_id,
            'template_id': template_id,
            'high_level': high_level_kpis,
            'components': component_kpis
        }
        
        # Update metadata status to 'ready'
        result_meta['status'] = 'ready'
        result_meta['error_message'] = ''
        
        # Update metadata file
        metadata = read_results_metadata()
        for i, meta in enumerate(metadata):
            if meta['id'] == result_id:
                metadata[i] = result_meta
                break
        write_results_metadata(metadata)
        
        return kpi_object
        
    except Exception as e:
        # Update metadata status to 'error'
        result_meta['status'] = 'error'
        result_meta['error_message'] = str(e)
        
        # Update metadata file
        metadata = read_results_metadata()
        for i, meta in enumerate(metadata):
            if meta['id'] == result_id:
                metadata[i] = result_meta
                break
        write_results_metadata(metadata)
        
        raise

