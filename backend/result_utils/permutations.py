"""Permutation mapping utilities for component-level analysis"""

import csv
import json
from .paths import get_permutation_file_path
from utils import read_templates


def load_permutation_mapping(template_id):
    """Load permutation mapping for component-level analysis.
    
    This function reads the permutation file and creates a lookup dictionary
    that maps permutation_item_id to component mappings.
    
    Args:
        template_id: ID of the template
        
    Returns:
        Tuple: (permutation_lookup: dict, components: list[str])
        permutation_lookup maps permutation_item_id → {component_name: variant_used}
        
    Raises:
        ValueError: If template_id doesn't exist
        FileNotFoundError: If permutation file doesn't exist
    """
    # Read template to get template_name and components list
    templates = read_templates()
    template = next((t for t in templates if t['id'] == template_id), None)
    if not template:
        raise ValueError(f'Template with id {template_id} not found')
    
    template_name = template['name']
    components = template.get('components', [])
    
    # Get permutation file path
    permutation_file_path = get_permutation_file_path(template_name)
    if not permutation_file_path.exists():
        raise FileNotFoundError(f'Permutation file not found for template {template_name}')
    
    # Read permutation file and create lookup
    permutation_lookup = {}
    with open(permutation_file_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Ensure perm_id is a string to match result CSV format
            perm_id = str(row['id'])
            permutations_json = row['permutations']
            
            # Parse permutations JSON array
            try:
                perms = json.loads(permutations_json)
                # Create mapping: component_name → variant_used
                component_mapping = {}
                for perm_item in perms:
                    # Each item is a dict with one key-value pair
                    # For regular: {"persona": "variant text"}
                    # For split: {"metadata": {"a": "name", "b": "value"}}
                    for comp_name, variant in perm_item.items():
                        component_mapping[comp_name] = variant
                
                permutation_lookup[perm_id] = component_mapping
            except json.JSONDecodeError:
                # Skip invalid rows
                continue
    
    return permutation_lookup, components

