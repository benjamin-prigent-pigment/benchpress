"""CSV export functions for permutations"""

import csv
import io
import re
from pathlib import Path
import os


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
        import json
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
    data_dir = Path(__file__).parent.parent / 'data'
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
