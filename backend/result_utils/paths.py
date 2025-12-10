"""
This file helps the app find the right files to use in the rest of the app. 
It can find the files for the results, the templates, and the permutations.
If something is missing, it gives a clear error.
"""

import re
from utils import DATA_DIR

# Paths
RESULTS_DIR = DATA_DIR / 'results'
RESULTS_METADATA_FILE = DATA_DIR / 'results_metadata.csv'


def _sanitize_filename(name):
    """Sanitize template name for use in filename (same as permutations.py)
    
    Args:
        name: Template name to sanitize
        
    Returns:
        Sanitized filename-safe string
    """
    # Replace spaces and special characters with underscores
    # Keep only alphanumeric, underscores, and hyphens
    sanitized = re.sub(r'[^\w\-]', '_', name)
    # Remove multiple consecutive underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    # Remove leading/trailing underscores
    sanitized = sanitized.strip('_')
    return sanitized


def get_permutation_file_path(template_name):
    """Get the path to a template's permutation file.
    
    Args:
        template_name: Name of the template
        
    Returns:
        Path object to permutations_{sanitized_template_name}.csv
    """
    sanitized_name = _sanitize_filename(template_name)
    return DATA_DIR / f'permutations_{sanitized_name}.csv'


def get_permutation_file_path_from_template_id(template_id):
    """Get permutation file path from template_id.
    
    Args:
        template_id: ID of the template
        
    Returns:
        Path object to permutations_{template_name}.csv
        
    Raises:
        ValueError: If template_id doesn't exist
    """
    from utils import read_templates
    
    templates = read_templates()
    template = next((t for t in templates if t['id'] == template_id), None)
    if not template:
        raise ValueError(f'Template with id {template_id} not found')
    return get_permutation_file_path(template['name'])

