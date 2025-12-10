"""
This file checks that the data from a result file is correct and makes sure it has all the right columns and information. 
If the file is missing important information or is broken, it gives a clear error.
"""

import csv
import io
import json
from .paths import get_permutation_file_path_from_template_id


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

