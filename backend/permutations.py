"""Permutation generation and CSV export logic"""

import csv
import hashlib
import io
import json
import re
from datetime import datetime
from itertools import product
from pathlib import Path
import os

from utils import read_components


def extract_components_from_template(template_text):
    """
    Extract component usage from template text.
    Returns a list of dicts with 'name' and optional 'part' for split components.
    Examples:
    - {{component_name}} -> {'name': 'component_name', 'part': None}
    - {{metadata/a}} -> {'name': 'metadata', 'part': 'a'}
    """
    # Pattern matches: {{component_name}} or {{component_name/part}}
    pattern = r'\{\{([^}/]+)(?:/([^}]+))?\}\}'
    matches = re.findall(pattern, template_text)
    
    # Convert to list of dicts, removing duplicates
    components = []
    seen = set()
    for match in matches:
        name = match[0].strip()
        part = match[1].strip() if match[1] else None
        key = (name, part)
        if key not in seen:
            seen.add(key)
            components.append({'name': name, 'part': part})
    
    return components


def calculate_permutations(template_text):
    """Calculate the number of permutations for a template"""
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
    
    # Calculate total permutations
    total = 1
    for component in unique_components.values():
        variant_count = len(component['variants'])
        total *= variant_count
    
    return total


def generate_permutation_data(template_text):
    """
    Generate all permutations for a template with metadata.
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


def sanitize_filename(name):
    """Sanitize template name for use in filename"""
    # Replace spaces and special characters with underscores
    # Keep only alphanumeric, underscores, and hyphens
    sanitized = re.sub(r'[^\w\-]', '_', name)
    # Remove multiple consecutive underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    # Remove leading/trailing underscores
    sanitized = sanitized.strip('_')
    return sanitized


def generate_csv_file(permutation_data, template_name=None):
    """
    Generate CSV file from permutation data.
    Returns tuple: (csv_bytes, filename)
    """
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['id', 'prompt', 'permutations'])
    
    # Write data rows
    for perm in permutation_data:
        # Convert mapping to JSON string
        mapping_json = json.dumps(perm['mapping'])
        writer.writerow([
            perm['id'],
            perm['text'],
            mapping_json
        ])
    
    # Convert to bytes
    output.seek(0)
    csv_bytes = io.BytesIO()
    csv_bytes.write(output.getvalue().encode('utf-8'))
    csv_bytes.seek(0)
    
    # Generate filename using template name
    if template_name:
        sanitized_name = sanitize_filename(template_name)
        filename = f'permutations_{sanitized_name}.csv'
    else:
        filename = 'permutations_unknown.csv'
    
    return csv_bytes, filename


def save_csv_to_file(csv_bytes, filename, template_name=None):
    """Save CSV file to data folder, replacing old file if it exists"""
    data_dir = Path(__file__).parent / 'data'
    data_dir.mkdir(exist_ok=True)
    
    export_file = data_dir / filename
    
    # Delete old file if it exists
    if export_file.exists():
        os.remove(export_file)
    
    # Reset bytes stream position and read content
    csv_bytes.seek(0)
    content = csv_bytes.read()
    
    # Write to file
    with open(export_file, 'wb') as f:
        f.write(content)
    
    # Reset bytes stream position again for potential reuse
    csv_bytes.seek(0)
    
    return export_file

