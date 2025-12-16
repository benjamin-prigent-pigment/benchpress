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
            writer.writerow(['id', 'name', 'description', 'variants', 'isSplit', 'splitParts'])
    
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
            
            # Try to read isSplit and splitParts from CSV (new format)
            is_split = False
            split_parts = None
            
            if 'isSplit' in row and row.get('isSplit'):
                # New format: read from CSV
                try:
                    is_split = json.loads(row['isSplit']) if row['isSplit'] else False
                except (json.JSONDecodeError, ValueError):
                    # If not valid JSON, try as string
                    is_split = row['isSplit'].lower() in ('true', '1', 'yes')
                
                if 'splitParts' in row and row.get('splitParts'):
                    try:
                        split_parts = json.loads(row['splitParts']) if row['splitParts'] else None
                    except (json.JSONDecodeError, ValueError):
                        split_parts = None
            else:
                # Backward compatibility: determine from variant structure
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
        writer.writerow(['id', 'name', 'description', 'variants', 'isSplit', 'splitParts'])
        for comp in components:
            writer.writerow([
                comp['id'],
                comp['name'],
                comp['description'],
                json.dumps(comp['variants']),
                json.dumps(comp.get('isSplit', False)),
                json.dumps(comp.get('splitParts', None))
            ])


def read_templates():
    """Read all templates from CSV with backward compatibility"""
    if not TEMPLATES_FILE.exists():
        return []
    
    templates = []
    try:
        with open(TEMPLATES_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            expected_columns = ['id', 'name', 'description', 'text', 'components', 'variant_scopes']
            
            # Validate header
            if not reader.fieldnames:
                print("Error: CSV file has no header row")
                return []
            
            # Check if all expected columns are present
            missing_columns = [col for col in expected_columns if col not in reader.fieldnames]
            if missing_columns:
                print(f"Warning: CSV file missing columns: {missing_columns}")
            
            for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
                try:
                    # Validate that we have an 'id' field and it's a valid integer
                    if 'id' not in row or not row.get('id', '').strip():
                        print(f"Warning: Row {row_num} missing 'id' field, skipping")
                        continue
                    
                    # Clean the id field - remove any whitespace
                    id_value = row['id'].strip()
                    
                    # Check if id looks like JSON (starts with { or [) - indicates corruption
                    if id_value.startswith('{') or id_value.startswith('[') or (id_value.startswith('"') and '"' in id_value[1:]):
                        print(f"Error: Row {row_num} has corrupted 'id' field (looks like JSON): '{id_value[:50]}...'")
                        print(f"Full row data: {dict(row)}")
                        continue
                    
                    try:
                        template_id = int(id_value)
                    except (ValueError, TypeError) as e:
                        print(f"Error: Row {row_num} has invalid 'id' value '{id_value[:50]}...': {e}")
                        print(f"Row keys: {list(row.keys())}")
                        print(f"Row values (first 100 chars each): {[str(v)[:100] for v in row.values()]}")
                        continue
                    
                    # Parse components JSON if present, otherwise default to empty list
                    components = []
                    if 'components' in row and row.get('components'):
                        try:
                            components = json.loads(row['components'])
                        except (json.JSONDecodeError, ValueError):
                            components = []
                    
                    # Handle description with backward compatibility (default to empty string)
                    description = row.get('description', '')
                    
                    # Parse variant_scopes JSON if present, otherwise default to empty array
                    variant_scopes = []
                    if 'variant_scopes' in row and row.get('variant_scopes'):
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
                        except (json.JSONDecodeError, ValueError, TypeError) as e:
                            print(f"Warning: Row {row_num} has invalid variant_scopes JSON, using empty array: {e}")
                            variant_scopes = []
                    
                    templates.append({
                        'id': template_id,
                        'name': row.get('name', ''),
                        'description': description,
                        'text': row.get('text', ''),
                        'components': components,
                        'variantScopes': variant_scopes
                    })
                except Exception as e:
                    print(f"Error reading row {row_num}: {e}")
                    print(f"Row data: {dict(row) if row else 'None'}")
                    continue
    except Exception as e:
        print(f"Fatal error reading templates CSV: {e}")
        import traceback
        traceback.print_exc()
    return templates


def write_templates(templates):
    """Write all templates to CSV"""
    ensure_data_dir()
    with open(TEMPLATES_FILE, 'w', newline='', encoding='utf-8') as f:
        # Use QUOTE_ALL to ensure all fields are properly quoted, especially JSON fields
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow(['id', 'name', 'description', 'text', 'components', 'variant_scopes'])
        for template in templates:
            # Get components, default to empty list if not present
            components = template.get('components', [])
            # Get description, default to empty string if not present
            description = template.get('description', '')
            # Get variantScopes, default to empty array if not present
            variant_scopes = template.get('variantScopes', [])
            # Ensure all values are strings for CSV writing
            writer.writerow([
                str(template['id']),
                str(template.get('name', '')),
                str(description),
                str(template.get('text', '')),
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

