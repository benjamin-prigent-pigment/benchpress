"""CSV parsing and reading utilities for result files"""

import csv
import json
from .paths import RESULTS_DIR
from .metadata import read_results_metadata


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
    from datetime import datetime
    
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

