"""Utility functions for results management"""

import csv
import io
import json
import os
import re
import statistics
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from utils import DATA_DIR, read_templates

# Paths
RESULTS_DIR = DATA_DIR / 'results'
RESULTS_METADATA_FILE = DATA_DIR / 'results_metadata.csv'


def _sanitize_filename(name):
    """Sanitize template name for use in filename (same as permutations.py)"""
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
    templates = read_templates()
    template = next((t for t in templates if t['id'] == template_id), None)
    if not template:
        raise ValueError(f'Template with id {template_id} not found')
    return get_permutation_file_path(template['name'])


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


def parse_result_csv(file):
    """Parse uploaded CSV file and return structured data.
    
    Args:
        file: File object (from Flask request.files) or file path string
        
    Returns:
        List of dicts with keys: permutation_item_id, run_id, test_array, 
        HITL_turns_int, tool_call_int, ReACT_agent_calls, forbidden_tool_calls, time_spent,
        permutation_object (optional): JSON array of component mappings
        
    Raises:
        ValueError: If CSV is malformed or cannot be parsed
    """
    # Handle both file objects and file paths
    if isinstance(file, str):
        file_obj = open(file, 'r', newline='', encoding='utf-8')
        should_close = True
    else:
        # File object from Flask - reset position
        file.seek(0)
        file_obj = file
        should_close = False
    
    data = []
    try:
        reader = csv.DictReader(file_obj)
        
        # Check if file has content
        if not reader.fieldnames:
            raise ValueError('CSV file is empty or has no header row')
        
        # Check required columns
        required_columns = [
            'permutation_item_id', 'run_id', 'test_array', 
            'HITL_turns_int', 'tool_call_int', 'ReACT_agent_calls', 
            'forbidden_tool_calls', 'time_spent'
        ]
        
        missing_columns = set(required_columns) - set(reader.fieldnames)
        if missing_columns:
            raise ValueError(f'Missing required columns: {", ".join(sorted(missing_columns))}')
        
        # Parse each row
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
            try:
                # Parse test_array from JSON string
                # CSV may have quotes around the JSON, so strip them
                test_array_str = row.get('test_array', '').strip()
                if not test_array_str:
                    raise ValueError(f'Row {row_num}: test_array is required')
                
                # Remove surrounding quotes if present (CSV quoting)
                if test_array_str.startswith('"') and test_array_str.endswith('"'):
                    test_array_str = test_array_str[1:-1]
                elif test_array_str.startswith("'") and test_array_str.endswith("'"):
                    test_array_str = test_array_str[1:-1]
                
                try:
                    test_array = json.loads(test_array_str)
                    if not isinstance(test_array, list):
                        raise ValueError(f'Row {row_num}: test_array must be a JSON array')
                except json.JSONDecodeError as e:
                    raise ValueError(f'Row {row_num}: test_array is not valid JSON: {str(e)}')
                
                # Parse permutation_object if present (optional column for backward compatibility)
                permutation_object = None
                if 'permutation_object' in row and row.get('permutation_object'):
                    perm_obj_str = row['permutation_object'].strip()
                    # Remove surrounding quotes if present (CSV quoting)
                    if perm_obj_str.startswith('"') and perm_obj_str.endswith('"'):
                        perm_obj_str = perm_obj_str[1:-1]
                    elif perm_obj_str.startswith("'") and perm_obj_str.endswith("'"):
                        perm_obj_str = perm_obj_str[1:-1]
                    try:
                        permutation_object = json.loads(perm_obj_str)
                        if not isinstance(permutation_object, list):
                            raise ValueError(f'Row {row_num}: permutation_object must be a JSON array')
                    except json.JSONDecodeError as e:
                        raise ValueError(f'Row {row_num}: permutation_object is not valid JSON: {str(e)}')
                
                # Build data dict
                row_data = {
                    'permutation_item_id': row['permutation_item_id'].strip(),
                    'run_id': int(row['run_id']),
                    'test_array': test_array,
                    'HITL_turns_int': int(row['HITL_turns_int']),
                    'tool_call_int': int(row['tool_call_int']),
                    'ReACT_agent_calls': int(row['ReACT_agent_calls']),
                    'forbidden_tool_calls': int(row['forbidden_tool_calls']),
                    'time_spent': float(row['time_spent'])
                }
                if permutation_object is not None:
                    row_data['permutation_object'] = permutation_object
                data.append(row_data)
            except (ValueError, KeyError) as e:
                # Re-raise with row number context if not already included
                error_msg = str(e)
                if f'Row {row_num}' not in error_msg:
                    raise ValueError(f'Row {row_num}: {error_msg}')
                raise
            except (TypeError, ValueError) as e:
                # Handle type conversion errors
                raise ValueError(f'Row {row_num}: Invalid data type - {str(e)}')
    
    except csv.Error as e:
        raise ValueError(f'CSV parsing error: {str(e)}')
    except Exception as e:
        # Catch any other errors and provide clear message
        if isinstance(e, ValueError):
            raise  # Re-raise ValueError as-is
        raise ValueError(f'Error reading CSV file: {str(e)}')
    finally:
        if should_close:
            file_obj.close()
        else:
            # Reset file position for Flask file object
            file.seek(0)
    
    return data


def save_result_csv(file, result_id):
    """Save uploaded CSV file to results directory.
    
    Args:
        file: File object (from Flask request.files)
        result_id: Integer ID for the result
        
    Returns:
        Filename string (e.g., 'result_1_20251208_143022.csv')
    """
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'result_{result_id}_{timestamp}.csv'
    filepath = RESULTS_DIR / filename
    
    # Save file
    file.save(str(filepath))
    
    return filename


def read_result_csv(result_id):
    """Read and parse a result CSV file.
    
    Args:
        result_id: ID of the result to read
        
    Returns:
        List of dicts with keys: permutation_item_id, run_id, test_array, 
        HITL_turns_int, tool_call_int, ReACT_agent_calls, forbidden_tool_calls, time_spent,
        permutation_object (optional): JSON array of component mappings
        
    Raises:
        FileNotFoundError: If result file doesn't exist
    """
    # Find the result file
    metadata = read_results_metadata()
    result = next((r for r in metadata if r['id'] == result_id), None)
    if not result:
        raise FileNotFoundError(f'Result with id {result_id} not found')
    
    filepath = RESULTS_DIR / result['filename']
    if not filepath.exists():
        raise FileNotFoundError(f'Result file {result["filename"]} not found')
    
    # Read and parse CSV
    data = []
    with open(filepath, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse test_array from JSON string
            test_array = json.loads(row['test_array']) if row['test_array'] else []
            
            # Parse permutation_object if present (optional column for backward compatibility)
            permutation_object = None
            if 'permutation_object' in row and row.get('permutation_object'):
                perm_obj_str = row['permutation_object'].strip()
                # Remove surrounding quotes if present (CSV quoting)
                if perm_obj_str.startswith('"') and perm_obj_str.endswith('"'):
                    perm_obj_str = perm_obj_str[1:-1]
                elif perm_obj_str.startswith("'") and perm_obj_str.endswith("'"):
                    perm_obj_str = perm_obj_str[1:-1]
                try:
                    permutation_object = json.loads(perm_obj_str)
                except json.JSONDecodeError:
                    # If parsing fails, skip this column but don't fail the whole row
                    permutation_object = None
            
            row_data = {
                'permutation_item_id': row['permutation_item_id'],
                'run_id': int(row['run_id']),
                'test_array': test_array,
                'HITL_turns_int': int(row['HITL_turns_int']),
                'tool_call_int': int(row['tool_call_int']),
                'ReACT_agent_calls': int(row['ReACT_agent_calls']),
                'forbidden_tool_calls': int(row['forbidden_tool_calls']),
                'time_spent': float(row['time_spent'])
            }
            if permutation_object is not None:
                row_data['permutation_object'] = permutation_object
            data.append(row_data)
    
    return data


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
        filepath = RESULTS_DIR / result['filename']
        if filepath.exists():
            filepath.unlink()
        
        # Remove from metadata
        metadata = [r for r in metadata if r['id'] != result_id]
        write_results_metadata(metadata)
        
        return True, None
    except Exception as e:
        return False, str(e)


def validate_result_csv(csv_data, template_id):
    """Validate CSV format and data integrity.
    
    Args:
        csv_data: File object or file path (from Flask request.files or string path)
        template_id: ID of the template to validate against
        
    Returns:
        Tuple: (is_valid: bool, errors: list[str])
    """
    errors = []
    
    # Check if CSV has permutation_object column - if so, we don't need to validate against permutation file
    has_permutation_object = False
    try:
        # Peek at the header to check for permutation_object column
        if isinstance(csv_data, str):
            peek_file = open(csv_data, 'r', newline='', encoding='utf-8')
        else:
            # File object from Flask - reset position and read as text
            csv_data.seek(0)
            file_content = csv_data.read()
            if isinstance(file_content, bytes):
                file_content = file_content.decode('utf-8')
            peek_file = io.StringIO(file_content)
        
        reader = csv.DictReader(peek_file)
        if reader.fieldnames and 'permutation_object' in reader.fieldnames:
            has_permutation_object = True
        
        if isinstance(csv_data, str):
            peek_file.close()
        else:
            # Reset the original file object position
            csv_data.seek(0)
    except Exception:
        # If we can't check, proceed with normal validation
        pass
    
    # Only validate against permutation file if permutation_object is not present
    valid_permutation_ids = set()
    if not has_permutation_object:
        # Get permutation file path
        try:
            permutation_file_path = get_permutation_file_path_from_template_id(template_id)
        except ValueError as e:
            return False, [str(e)]
        
        # Check if permutation file exists
        if not permutation_file_path.exists():
            return False, [f'Permutation file not found for template_id {template_id}. Please generate permutations first.']
        
        # Load valid permutation IDs from permutation file
        try:
            with open(permutation_file_path, 'r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    valid_permutation_ids.add(row['id'])
        except Exception as e:
            return False, [f'Error reading permutation file: {str(e)}']
    
    # Parse CSV data
    # csv_data can be a file object (from Flask) or a file path string
    if isinstance(csv_data, str):
        file_obj = open(csv_data, 'r', newline='', encoding='utf-8')
        should_close = True
    else:
        # File object from Flask - reset position and read as text
        csv_data.seek(0)
        # Read the file content and create a StringIO object for text mode
        file_content = csv_data.read()
        if isinstance(file_content, bytes):
            file_content = file_content.decode('utf-8')
        file_obj = io.StringIO(file_content)
        should_close = True
    
    try:
        reader = csv.DictReader(file_obj)
        
        # Check required columns
        required_columns = [
            'permutation_item_id', 'run_id', 'test_array', 
            'HITL_turns_int', 'tool_call_int', 'ReACT_agent_calls', 
            'forbidden_tool_calls', 'time_spent'
        ]
        
        if not reader.fieldnames:
            return False, ['CSV file is empty or has no header row']
        
        missing_columns = set(required_columns) - set(reader.fieldnames)
        if missing_columns:
            errors.append(f'Missing required columns: {", ".join(sorted(missing_columns))}')
        
        # Validate each row
        row_num = 1
        seen_permutation_ids = set()
        
        for row in reader:
            row_num += 1
            
            # Skip if we already found missing columns
            if missing_columns:
                continue
            
            # Validate permutation_item_id
            perm_id = row.get('permutation_item_id', '').strip()
            if not perm_id:
                errors.append(f'Row {row_num}: permutation_item_id is required')
            elif not has_permutation_object and perm_id not in valid_permutation_ids:
                # Only validate against permutation file if permutation_object is not present
                errors.append(f'Row {row_num}: permutation_item_id "{perm_id}" not found in permutation file')
            else:
                seen_permutation_ids.add(perm_id)
            
            # If permutation_object is present, validate it's valid JSON
            if has_permutation_object and 'permutation_object' in row and row.get('permutation_object'):
                perm_obj_str = row['permutation_object'].strip()
                # Remove surrounding quotes if present
                if perm_obj_str.startswith('"') and perm_obj_str.endswith('"'):
                    perm_obj_str = perm_obj_str[1:-1]
                elif perm_obj_str.startswith("'") and perm_obj_str.endswith("'"):
                    perm_obj_str = perm_obj_str[1:-1]
                try:
                    perm_obj = json.loads(perm_obj_str)
                    if not isinstance(perm_obj, list):
                        errors.append(f'Row {row_num}: permutation_object must be a JSON array')
                except json.JSONDecodeError as e:
                    errors.append(f'Row {row_num}: permutation_object is not valid JSON: {str(e)}')
            
            # Validate run_id
            try:
                run_id = int(row.get('run_id', ''))
                if run_id < 1:
                    errors.append(f'Row {row_num}: run_id must be >= 1, got {run_id}')
            except (ValueError, TypeError):
                errors.append(f'Row {row_num}: run_id must be an integer, got "{row.get("run_id")}"')
            
            # Validate test_array
            test_array_str = row.get('test_array', '').strip()
            if not test_array_str:
                errors.append(f'Row {row_num}: test_array is required')
            else:
                try:
                    test_array = json.loads(test_array_str)
                    if not isinstance(test_array, list):
                        errors.append(f'Row {row_num}: test_array must be a JSON array')
                    else:
                        for i, val in enumerate(test_array):
                            if val not in [0, 1]:
                                errors.append(f'Row {row_num}: test_array[{i}] must be 0 or 1, got {val}')
                except json.JSONDecodeError as e:
                    errors.append(f'Row {row_num}: test_array is not valid JSON: {str(e)}')
            
            # Validate HITL_turns_int
            try:
                hitl_turns = int(row.get('HITL_turns_int', ''))
                if hitl_turns < 0:
                    errors.append(f'Row {row_num}: HITL_turns_int must be >= 0, got {hitl_turns}')
            except (ValueError, TypeError):
                errors.append(f'Row {row_num}: HITL_turns_int must be an integer, got "{row.get("HITL_turns_int")}"')
            
            # Validate tool_call_int
            try:
                tool_calls = int(row.get('tool_call_int', ''))
                if tool_calls < 0:
                    errors.append(f'Row {row_num}: tool_call_int must be >= 0, got {tool_calls}')
            except (ValueError, TypeError):
                errors.append(f'Row {row_num}: tool_call_int must be an integer, got "{row.get("tool_call_int")}"')
            
            # Validate ReACT_agent_calls
            try:
                react_calls = int(row.get('ReACT_agent_calls', ''))
                if react_calls < 0:
                    errors.append(f'Row {row_num}: ReACT_agent_calls must be >= 0, got {react_calls}')
            except (ValueError, TypeError):
                errors.append(f'Row {row_num}: ReACT_agent_calls must be an integer, got "{row.get("ReACT_agent_calls")}"')
            
            # Validate forbidden_tool_calls
            try:
                forbidden_calls = int(row.get('forbidden_tool_calls', ''))
                if forbidden_calls < 0:
                    errors.append(f'Row {row_num}: forbidden_tool_calls must be >= 0, got {forbidden_calls}')
            except (ValueError, TypeError):
                errors.append(f'Row {row_num}: forbidden_tool_calls must be an integer, got "{row.get("forbidden_tool_calls")}"')
            
            # Validate time_spent
            try:
                time_spent = float(row.get('time_spent', ''))
                if time_spent < 0:
                    errors.append(f'Row {row_num}: time_spent must be >= 0, got {time_spent}')
            except (ValueError, TypeError):
                errors.append(f'Row {row_num}: time_spent must be a number, got "{row.get("time_spent")}"')
        
        # Limit error messages to avoid overwhelming output
        if len(errors) > 50:
            errors = errors[:50]
            errors.append(f'... and {len(errors) - 50} more errors (truncated)')
        
    except Exception as e:
        errors.append(f'Error reading CSV file: {str(e)}')
    finally:
        if should_close:
            file_obj.close()
        if not isinstance(csv_data, str):
            # Reset file position for Flask file object
            csv_data.seek(0)
    
    return len(errors) == 0, errors


def calculate_high_level_kpis(result_data):
    """Calculate high-level KPIs for all result data.
    
    Args:
        result_data: List of dicts from parse_result_csv or read_result_csv
        
    Returns:
        Dict with KPIs: pass_rate, zero_error_runs, performance_speed, behavioral_efficiency
    """
    if not result_data:
        return {
            'pass_rate': 0.0,
            'zero_error_runs': 0.0,
            'performance_speed': {
                'median': 0.0,
                'average': 0.0,
                'max': 0.0,
                'min': 0.0,
                'histogram': []
            },
            'behavioral_efficiency': {
                'median_hitl_turns': 0.0,
                'median_tool_calls': 0.0,
                'median_react_agent_calls': 0.0,
                'forbidden_tool_call_rate': 0  # Now returns count, not rate
            }
        }
    
    # 1. Pass Rate: (sum of all 1s) / (total test items)
    all_test_items = []
    for row in result_data:
        all_test_items.extend(row['test_array'])
    
    if all_test_items:
        pass_rate = sum(all_test_items) / len(all_test_items)
    else:
        pass_rate = 0.0
    
    # 2. Zero-Error Runs: (permutation_item_ids with all runs passing) / (total unique permutation_item_ids)
    # Group by permutation_item_id
    permutation_runs = defaultdict(list)
    for row in result_data:
        permutation_runs[row['permutation_item_id']].append(row)
    
    total_permutations = len(permutation_runs)
    zero_error_count = 0
    
    for perm_id, runs in permutation_runs.items():
        # Check if all runs for this permutation have all 1s
        all_passing = True
        for run in runs:
            if not all(test == 1 for test in run['test_array']):
                all_passing = False
                break
        if all_passing:
            zero_error_count += 1
    
    zero_error_runs = zero_error_count / total_permutations if total_permutations > 0 else 0.0
    
    # 3. Performance Speed: time_spent stats
    time_spent_values = [row['time_spent'] for row in result_data]
    
    if time_spent_values:
        time_spent_median = statistics.median(time_spent_values)
        time_spent_average = statistics.mean(time_spent_values)
        time_spent_max = max(time_spent_values)
        time_spent_min = min(time_spent_values)
        
        # Create histogram data (10 bins)
        if len(time_spent_values) > 1:
            bin_width = (time_spent_max - time_spent_min) / 10
            bins = [0] * 10
            for value in time_spent_values:
                bin_index = min(int((value - time_spent_min) / bin_width), 9) if bin_width > 0 else 0
                bins[bin_index] += 1
            histogram = [
                {
                    'bin_start': time_spent_min + i * bin_width,
                    'bin_end': time_spent_min + (i + 1) * bin_width,
                    'count': bins[i]
                }
                for i in range(10)
            ]
        else:
            histogram = [{'bin_start': time_spent_min, 'bin_end': time_spent_max, 'count': 1}]
    else:
        time_spent_median = 0.0
        time_spent_average = 0.0
        time_spent_max = 0.0
        time_spent_min = 0.0
        histogram = []
    
    # 4. Behavioral Efficiency
    hitl_turns_values = [row['HITL_turns_int'] for row in result_data]
    tool_calls_values = [row['tool_call_int'] for row in result_data]
    react_calls_values = [row['ReACT_agent_calls'] for row in result_data]
    forbidden_calls_sum = sum(row['forbidden_tool_calls'] for row in result_data)
    
    median_hitl_turns = statistics.median(hitl_turns_values) if hitl_turns_values else 0.0
    median_tool_calls = statistics.median(tool_calls_values) if tool_calls_values else 0.0
    median_react_agent_calls = statistics.median(react_calls_values) if react_calls_values else 0.0
    # Return count instead of rate
    forbidden_tool_call_count = int(forbidden_calls_sum)
    
    return {
        'pass_rate': pass_rate,
        'zero_error_runs': zero_error_runs,
        'performance_speed': {
            'median': time_spent_median,
            'average': time_spent_average,
            'max': time_spent_max,
            'min': time_spent_min,
            'histogram': histogram
        },
        'behavioral_efficiency': {
            'median_hitl_turns': median_hitl_turns,
            'median_tool_calls': median_tool_calls,
            'median_react_agent_calls': median_react_agent_calls,
            'forbidden_tool_call_rate': forbidden_tool_call_count  # Returns count, not rate
        }
    }


def load_permutation_mapping(template_id):
    """Load permutation mapping for component-level analysis.
    
    Args:
        template_id: ID of the template
        
    Returns:
        Tuple: (permutation_lookup: dict, components: list[str])
        permutation_lookup maps permutation_item_id → {component_name: variant_used}
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


def calculate_component_kpis(result_data, component_name, permutation_lookup=None):
    """Calculate KPIs for a specific component, broken down by variant.
    
    Args:
        result_data: List of dicts from parse_result_csv or read_result_csv
        component_name: Name of the component to analyze
        permutation_lookup: Optional dict mapping permutation_item_id → {component_name: variant_used}
                          If None, will try to extract from permutation_object in row data
        
    Returns:
        Dict with component-level KPIs organized by variant
    """
    # Group result rows by component variant
    variant_data = defaultdict(list)
    matched_count = 0
    unmatched_count = 0
    
    for row in result_data:
        component_mapping = None
        variant = None
        
        # First, try to get component mapping from permutation_object in the row (preferred method)
        if 'permutation_object' in row and row.get('permutation_object'):
            try:
                # permutation_object is a list like: [{"persona": "..."}, {"block_type": "..."}, ...]
                perm_obj = row['permutation_object']
                if isinstance(perm_obj, list):
                    # Convert list to dict: {component_name: variant_value}
                    component_mapping = {}
                    for perm_item in perm_obj:
                        if isinstance(perm_item, dict):
                            component_mapping.update(perm_item)
                    
                    if component_name in component_mapping:
                        variant = component_mapping[component_name]
            except (KeyError, TypeError, AttributeError):
                pass
        
        # Fall back to permutation_lookup if permutation_object not available
        if variant is None and permutation_lookup:
            perm_id = str(row['permutation_item_id'])
            if perm_id in permutation_lookup:
                component_mapping = permutation_lookup[perm_id]
                if component_name in component_mapping:
                    variant = component_mapping[component_name]
        
        # If we found a variant, add the row to the appropriate group
        if variant is not None:
            # For split components, variant is a dict, so convert to string for grouping
            # For regular components, variant is already a string
            if isinstance(variant, dict):
                # For split components, create a key from the dict
                variant_key = json.dumps(variant, sort_keys=True)
            else:
                variant_key = str(variant)
            variant_data[variant_key].append(row)
            matched_count += 1
        else:
            unmatched_count += 1
    
    # Calculate KPIs for each variant
    variant_kpis = {}
    for variant_key, variant_rows in variant_data.items():
        # Calculate same KPIs as high-level for this variant
        all_test_items = []
        for row in variant_rows:
            all_test_items.extend(row['test_array'])
        
        pass_rate = sum(all_test_items) / len(all_test_items) if all_test_items else 0.0
        
        # Zero-Error Runs for this variant
        permutation_runs = defaultdict(list)
        for row in variant_rows:
            permutation_runs[row['permutation_item_id']].append(row)
        
        total_permutations = len(permutation_runs)
        zero_error_count = 0
        for perm_id, runs in permutation_runs.items():
            all_passing = True
            for run in runs:
                if not all(test == 1 for test in run['test_array']):
                    all_passing = False
                    break
            if all_passing:
                zero_error_count += 1
        
        zero_error_runs = zero_error_count / total_permutations if total_permutations > 0 else 0.0
        
        # Performance Speed
        time_spent_values = [row['time_spent'] for row in variant_rows]
        if time_spent_values:
            time_spent_median = statistics.median(time_spent_values)
            time_spent_average = statistics.mean(time_spent_values)
            time_spent_max = max(time_spent_values)
            time_spent_min = min(time_spent_values)
        else:
            time_spent_median = 0.0
            time_spent_average = 0.0
            time_spent_max = 0.0
            time_spent_min = 0.0
        
        # Behavioral Efficiency
        hitl_turns_values = [row['HITL_turns_int'] for row in variant_rows]
        tool_calls_values = [row['tool_call_int'] for row in variant_rows]
        react_calls_values = [row['ReACT_agent_calls'] for row in variant_rows]
        forbidden_calls_sum = sum(row['forbidden_tool_calls'] for row in variant_rows)
        
        median_hitl_turns = statistics.median(hitl_turns_values) if hitl_turns_values else 0.0
        median_tool_calls = statistics.median(tool_calls_values) if tool_calls_values else 0.0
        median_react_agent_calls = statistics.median(react_calls_values) if react_calls_values else 0.0
        # Return count instead of rate
        forbidden_tool_call_count = int(forbidden_calls_sum)
        
        variant_kpis[variant_key] = {
            'pass_rate': pass_rate,
            'zero_error_runs': zero_error_runs,
            'performance_speed': {
                'median': time_spent_median,
                'average': time_spent_average,
                'max': time_spent_max,
                'min': time_spent_min
            },
            'behavioral_efficiency': {
                'median_hitl_turns': median_hitl_turns,
                'median_tool_calls': median_tool_calls,
                'median_react_agent_calls': median_react_agent_calls,
                'forbidden_tool_call_rate': forbidden_tool_call_count  # Returns count, not rate
            },
            'row_count': len(variant_rows)
        }
    
    # Aggregate across all variants for component-level summary
    if variant_kpis:
        # Calculate weighted averages across variants
        total_rows = sum(kpi['row_count'] for kpi in variant_kpis.values())
        if total_rows > 0:
            aggregated_pass_rate = sum(
                kpi['pass_rate'] * kpi['row_count'] for kpi in variant_kpis.values()
            ) / total_rows
            
            # For zero_error_runs, count unique permutations across all variants
            all_permutation_runs = defaultdict(list)
            for rows in variant_data.values():
                for row in rows:
                    perm_id = row['permutation_item_id']
                    all_permutation_runs[perm_id].append(row)
            
            total_unique_permutations = len(all_permutation_runs)
            zero_error_count = 0
            for perm_id, runs in all_permutation_runs.items():
                all_passing = True
                for run in runs:
                    if not all(test == 1 for test in run['test_array']):
                        all_passing = False
                        break
                if all_passing:
                    zero_error_count += 1
            
            aggregated_zero_error_runs = zero_error_count / total_unique_permutations if total_unique_permutations > 0 else 0.0
            
            # Aggregate performance and behavioral metrics (use all variant rows)
            all_time_spent = [row['time_spent'] for rows in variant_data.values() for row in rows]
            all_hitl_turns = [row['HITL_turns_int'] for rows in variant_data.values() for row in rows]
            all_tool_calls = [row['tool_call_int'] for rows in variant_data.values() for row in rows]
            all_react_calls = [row['ReACT_agent_calls'] for rows in variant_data.values() for row in rows]
            all_forbidden_calls = sum(row['forbidden_tool_calls'] for rows in variant_data.values() for row in rows)
            
            aggregated_performance = {
                'median': statistics.median(all_time_spent) if all_time_spent else 0.0,
                'average': statistics.mean(all_time_spent) if all_time_spent else 0.0,
                'max': max(all_time_spent) if all_time_spent else 0.0,
                'min': min(all_time_spent) if all_time_spent else 0.0
            }
            
            aggregated_behavioral = {
                'median_hitl_turns': statistics.median(all_hitl_turns) if all_hitl_turns else 0.0,
                'median_tool_calls': statistics.median(all_tool_calls) if all_tool_calls else 0.0,
                'median_react_agent_calls': statistics.median(all_react_calls) if all_react_calls else 0.0,
                'forbidden_tool_call_rate': int(all_forbidden_calls)  # Returns count, not rate
            }
        else:
            aggregated_pass_rate = 0.0
            aggregated_zero_error_runs = 0.0
            aggregated_performance = {'median': 0.0, 'average': 0.0, 'max': 0.0, 'min': 0.0}
            aggregated_behavioral = {
                'median_hitl_turns': 0.0,
                'median_tool_calls': 0.0,
                'median_react_agent_calls': 0.0,
                'forbidden_tool_call_rate': 0  # Returns count, not rate
            }
    else:
        aggregated_pass_rate = 0.0
        aggregated_zero_error_runs = 0.0
        aggregated_performance = {'median': 0.0, 'average': 0.0, 'max': 0.0, 'min': 0.0}
        aggregated_behavioral = {
            'median_hitl_turns': 0.0,
            'median_tool_calls': 0.0,
            'median_react_agent_calls': 0.0,
            'forbidden_tool_call_rate': 0  # Returns count, not rate
        }
    
    # Add a flag to indicate if data is unavailable (no matching permutation IDs)
    has_data = len(variant_data) > 0
    
    return {
        'component_name': component_name,
        'variants': variant_kpis,
        'aggregated': {
            'pass_rate': aggregated_pass_rate,
            'zero_error_runs': aggregated_zero_error_runs,
            'performance_speed': aggregated_performance,
            'behavioral_efficiency': aggregated_behavioral
        },
        'has_data': has_data  # Flag to indicate if component-level data is available
    }


def calculate_all_kpis(result_id):
    """Calculate all KPIs (high-level and component-level) for a result.
    
    Args:
        result_id: ID of the result
        
    Returns:
        Dict with complete KPI object including high-level and component-level metrics
        
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

