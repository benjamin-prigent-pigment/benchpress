"""Utility functions for CSV file handling"""

import csv
import json
import os
from pathlib import Path

# Path to data directory
DATA_DIR = Path(__file__).parent / 'data'
COMPONENTS_FILE = DATA_DIR / 'components.csv'
TEMPLATES_FILE = DATA_DIR / 'templates.csv'
RESULTS_DIR = DATA_DIR / 'results'
RESULTS_METADATA_FILE = DATA_DIR / 'results_metadata.csv'


def ensure_data_dir():
    """Ensure data directory exists"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def init_csv_files():
    """Initialize CSV files with headers if they don't exist"""
    ensure_data_dir()
    
    # Create results directory if it doesn't exist
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Initialize components.csv
    if not COMPONENTS_FILE.exists():
        with open(COMPONENTS_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'name', 'description', 'variants'])
    
    # Initialize templates.csv
    if not TEMPLATES_FILE.exists():
        with open(TEMPLATES_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'name', 'description', 'text', 'components', 'variant_scopes'])
    
    # Initialize results_metadata.csv
    if not RESULTS_METADATA_FILE.exists():
        with open(RESULTS_METADATA_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'filename', 'template_id', 'upload_date', 'status', 'error_message'])


def read_components():
    """Read all components from CSV with backward compatibility"""
    if not COMPONENTS_FILE.exists():
        return []
    
    components = []
    with open(COMPONENTS_FILE, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse variants JSON
            variants = json.loads(row['variants']) if row['variants'] else []
            
            # Determine if component is split based on variant structure
            is_split = False
            split_parts = None
            
            if variants and isinstance(variants[0], dict):
                # Variants are objects, so this is a split component
                is_split = True
                # Extract split parts from first variant
                split_parts = list(variants[0].keys()) if variants else []
            
            component = {
                'id': int(row['id']),
                'name': row['name'],
                'description': row['description'],
                'variants': variants,
                'isSplit': is_split,
                'splitParts': split_parts
            }
            components.append(component)
    return components


def write_components(components):
    """Write all components to CSV"""
    ensure_data_dir()
    with open(COMPONENTS_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'name', 'description', 'variants'])
        for comp in components:
            writer.writerow([
                comp['id'],
                comp['name'],
                comp['description'],
                json.dumps(comp['variants'])
            ])


def read_templates():
    """Read all templates from CSV with backward compatibility"""
    if not TEMPLATES_FILE.exists():
        return []
    
    templates = []
    with open(TEMPLATES_FILE, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse components JSON if present, otherwise default to empty list
            components = []
            if 'components' in row and row['components']:
                try:
                    components = json.loads(row['components'])
                except (json.JSONDecodeError, ValueError):
                    components = []
            
            # Handle description with backward compatibility (default to empty string)
            description = row.get('description', '')
            
            # Parse variant_scopes JSON if present, otherwise default to empty array
            variant_scopes = []
            if 'variant_scopes' in row and row['variant_scopes']:
                try:
                    variant_scopes_raw = json.loads(row['variant_scopes'])
                    # Check if it's an array (new format)
                    if isinstance(variant_scopes_raw, list):
                        variant_scopes = variant_scopes_raw
                    # Backward compatibility: if it's a dict (old format), convert to empty array
                    elif isinstance(variant_scopes_raw, dict):
                        # Old format - convert to empty array (all combinations allowed)
                        variant_scopes = []
                    else:
                        variant_scopes = []
                except (json.JSONDecodeError, ValueError, TypeError):
                    variant_scopes = []
            
            templates.append({
                'id': int(row['id']),
                'name': row['name'],
                'description': description,
                'text': row['text'],
                'components': components,
                'variantScopes': variant_scopes
            })
    return templates


def write_templates(templates):
    """Write all templates to CSV"""
    ensure_data_dir()
    with open(TEMPLATES_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'name', 'description', 'text', 'components', 'variant_scopes'])
        for template in templates:
            # Get components, default to empty list if not present
            components = template.get('components', [])
            # Get description, default to empty string if not present
            description = template.get('description', '')
            # Get variantScopes, default to empty array if not present
            variant_scopes = template.get('variantScopes', [])
            writer.writerow([
                template['id'],
                template['name'],
                description,
                template['text'],
                json.dumps(components),
                json.dumps(variant_scopes)
            ])


def get_next_id(items):
    """Get the next available ID for a list of items"""
    if not items:
        return 1
    return max(item['id'] for item in items) + 1


def find_component_by_name(name):
    """Find a component by name (case-insensitive)"""
    components = read_components()
    for comp in components:
        if comp['name'].lower() == name.lower():
            return comp
    return None


def is_component_used_in_templates(component_name):
    """Check if a component is used in any template (regular or split parts)"""
    templates = read_templates()
    # Check for regular usage: {{component_name}}
    # In f-strings, {{ becomes a single {, so {{{{ becomes {{
    regular_placeholder = f"{{{{{component_name}}}}}"
    # Check for split usage: {{component_name/part}}
    # Pattern matches {{component_name/ (e.g., {{metadata/)
    split_pattern = f"{{{{{component_name}/"
    
    for template in templates:
        if regular_placeholder in template['text']:
            return True
        if split_pattern in template['text']:
            return True
    return False


def is_component_split(component):
    """Check if a component is split"""
    return component.get('isSplit', False)


def get_component_split_parts(component):
    """Get split parts for a component, or None if not split"""
    if is_component_split(component):
        return component.get('splitParts', [])
    return None


def validate_split_component(component):
    """Validate split component structure. Returns (is_valid, error_message)"""
    is_split = component.get('isSplit', False)
    split_parts = component.get('splitParts', None)
    variants = component.get('variants', [])
    
    if is_split:
        # Must have splitParts
        if not split_parts or not isinstance(split_parts, list):
            return False, 'Split component must have splitParts array'
        
        if len(split_parts) < 2:
            return False, 'Split component must have at least 2 parts'
        
        # Check for duplicate part names
        if len(split_parts) != len(set(split_parts)):
            return False, 'Split parts must be unique'
        
        # Variants must be array of objects
        if not variants or not isinstance(variants, list):
            return False, 'Split component must have variants array'
        
        if len(variants) < 2:
            return False, 'Split component must have at least 2 variants'
        
        # Each variant must be an object with all split parts
        for i, variant in enumerate(variants):
            if not isinstance(variant, dict):
                return False, f'Variant {i} must be an object'
            
            # Check all split parts are present
            for part in split_parts:
                if part not in variant:
                    return False, f'Variant {i} missing part "{part}"'
    else:
        # Non-split: variants must be array of strings
        if not variants or not isinstance(variants, list):
            return False, 'Component must have variants array'
        
        if len(variants) < 2:
            return False, 'Component must have at least 2 variants'
        
        for i, variant in enumerate(variants):
            if not isinstance(variant, str):
                return False, f'Variant {i} must be a string'
    
    return True, None

