"""Metadata management for results"""

import csv
from .paths import RESULTS_DIR, RESULTS_METADATA_FILE
from utils import DATA_DIR


def read_results_metadata():
    """Read all results metadata from CSV.
    
    Returns:
        List of result metadata dicts with keys: id, filename, template_id, 
        upload_date, status, error_message
    """
    if not RESULTS_METADATA_FILE.exists():
        return []
    
    metadata = []
    with open(RESULTS_METADATA_FILE, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            metadata.append({
                'id': int(row['id']),
                'filename': row['filename'],
                'template_id': int(row['template_id']),
                'upload_date': row['upload_date'],
                'status': row['status'],
                'error_message': row.get('error_message', '')
            })
    return metadata


def write_results_metadata(metadata):
    """Write/update results metadata to CSV.
    
    Args:
        metadata: List of result metadata dicts
    """
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(RESULTS_METADATA_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'filename', 'template_id', 'upload_date', 'status', 'error_message'])
        for item in metadata:
            writer.writerow([
                item['id'],
                item['filename'],
                item['template_id'],
                item['upload_date'],
                item['status'],
                item.get('error_message', '')
            ])


def get_next_result_id():
    """Get the next available result ID from metadata.
    
    Returns:
        Next available integer ID
    """
    metadata = read_results_metadata()
    if not metadata:
        return 1
    return max(item['id'] for item in metadata) + 1


def get_result_status(result_id):
    """Check result status from metadata.
    
    Args:
        result_id: ID of the result
        
    Returns:
        Status string: 'processing', 'ready', or 'error'
        None if result doesn't exist
    """
    metadata = read_results_metadata()
    result = next((r for r in metadata if r['id'] == result_id), None)
    if not result:
        return None
    return result['status']


def delete_result(result_id):
    """Delete a result and its associated files.
    
    Args:
        result_id: ID of the result to delete
        
    Returns:
        Tuple: (success: bool, error_message: str or None)
    """
    try:
        # Read metadata
        metadata = read_results_metadata()
        result = next((r for r in metadata if r['id'] == result_id), None)
        
        if not result:
            return False, f'Result with id {result_id} not found'
        
        # Delete the CSV file
        from .paths import RESULTS_DIR
        filepath = RESULTS_DIR / result['filename']
        if filepath.exists():
            filepath.unlink()
        
        # Remove from metadata
        metadata = [r for r in metadata if r['id'] != result_id]
        write_results_metadata(metadata)
        
        return True, None
    except Exception as e:
        return False, str(e)

