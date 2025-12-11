"""Permutation generation logic"""

import hashlib
from itertools import product

from utils import read_components
from .extraction import extract_components_from_template
from .scope_filter import is_combination_allowed


def calculate_permutations(template_text, variant_scopes=None):
    """
    Calculate the number of permutations for a template.
    If variant_scopes is provided, only counts allowed combinations.
    """
    component_usages = extract_components_from_template(template_text)
    if not component_usages:
        return 0
    
    components = read_components()
    component_map = {comp['name']: comp for comp in components}
    
    # Group by component name (split parts of same component count as one dimension)
    unique_components = {}
    for usage in component_usages:
        name = usage['name']
        if name not in component_map:
            return 0  # Component not found
        
        # Only count each component once (even if multiple parts are used)
        if name not in unique_components:
            unique_components[name] = component_map[name]
    
    # If no variant scopes, calculate simple product
    if not variant_scopes:
        total = 1
        for component in unique_components.values():
            variant_count = len(component['variants'])
            total *= variant_count
        return total
    
    # With variant scopes, need to count allowed combinations
    unique_component_names = list(unique_components.keys())
    variant_lists = [unique_components[name]['variants'] for name in unique_component_names]
    
    count = 0
    for combination in product(*variant_lists):
        if is_combination_allowed(combination, unique_component_names, variant_scopes, component_map):
            count += 1
    
    return count


def generate_permutation_data(template_text, variant_scopes=None):
    """
    Generate all permutations for a template with metadata.
    If variant_scopes is provided, only generates allowed combinations.
    
    Returns a list of dictionaries with:
    - 'text': The generated text with placeholders replaced
    - 'mapping': List of dicts with component name and variant used (split components show all parts)
    - 'id': Hash-based ID for the permutation
    """
    component_usages = extract_components_from_template(template_text)
    if not component_usages:
        # No components, return template as-is
        text_hash = hashlib.md5(template_text.encode('utf-8')).hexdigest()
        return [{
            'text': template_text,
            'mapping': [],
            'id': text_hash
        }]
    
    components = read_components()
    component_map = {comp['name']: comp for comp in components}
    
    # Group usages by component name (split parts of same component are grouped together)
    component_groups = {}
    for usage in component_usages:
        name = usage['name']
        if name not in component_map:
            return []  # Component not found
        
        if name not in component_groups:
            component_groups[name] = {
                'component': component_map[name],
                'parts': []
            }
        
        if usage['part']:
            component_groups[name]['parts'].append(usage['part'])
    
    # Get unique component names (one dimension per component, not per part)
    unique_component_names = list(component_groups.keys())
    
    # Get all variant lists (one per component)
    variant_lists = []
    for name in unique_component_names:
        component = component_map[name]
        variant_lists.append(component['variants'])
    
    # Generate all combinations
    permutations = []
    for combination in product(*variant_lists):
        # Apply scope filtering if variant_scopes is provided
        if variant_scopes and not is_combination_allowed(combination, unique_component_names, variant_scopes, component_map):
            continue
        
        result = template_text
        mapping = []
        
        # Replace placeholders and build mapping
        for name, variant in zip(unique_component_names, combination):
            component = component_map[name]
            group = component_groups[name]
            
            # Check if this component is split
            if component.get('isSplit', False) and group['parts']:
                # Split component: replace all part placeholders
                split_parts = component.get('splitParts', [])
                variant_dict = variant  # variant is already a dict for split components
                
                # Replace each part placeholder
                for part in group['parts']:
                    if part in variant_dict:
                        placeholder = f"{{{{{name}/{part}}}}}"
                        result = result.replace(placeholder, variant_dict[part])
                
                # Build mapping entry for split component
                mapping_entry = {name: {}}
                for part in split_parts:
                    if part in variant_dict:
                        mapping_entry[name][part] = variant_dict[part]
                mapping.append(mapping_entry)
            else:
                # Regular component: replace simple placeholder
                placeholder = f"{{{{{name}}}}}"
                result = result.replace(placeholder, variant)
                mapping.append({name: variant})
        
        # Generate hash-based ID from the final text
        text_hash = hashlib.md5(result.encode('utf-8')).hexdigest()
        
        permutations.append({
            'text': result,
            'mapping': mapping,
            'id': text_hash
        })
    
    return permutations
