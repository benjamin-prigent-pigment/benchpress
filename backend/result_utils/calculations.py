"""KPI calculation functions with detailed mathematical documentation.

This module contains all the mathematical calculations used to compute Key Performance
Indicators (KPIs) from result data. Each function includes detailed explanations of
the mathematical formulas and algorithms used.

Data Structure:
    Each result row contains:
    - permutation_item_id: Unique identifier for the permutation being tested
    - run_id: Identifier for a specific run of a permutation
    - test_array: List of binary values (0 or 1) indicating pass/fail for each test, multiple things are being tested in each permutation
    - HITL_turns_int: Number of Human-In-The-Loop turns required
    - tool_call_int: Number of tool calls made
    - ReACT_agent_calls: Number of ReACT agent calls
    - forbidden_tool_calls: Number of forbidden tool calls
    - time_spent: Time taken in seconds
"""

import json
import statistics
from collections import defaultdict


def calculate_high_level_kpis(result_data):
    """Calculate high-level KPIs for all result data.
    
    This function computes aggregate metrics across all permutations and runs:
    
    1. Pass Rate: Overall success rate across all test items
    2. Zero-Error Runs: Percentage of permutations with perfect runs
    3. Performance Speed: Statistical analysis of time_spent values
    4. Behavioral Efficiency: Median values for interaction metrics
    
    Mathematical Formulas:
    
    Pass Rate = (Σ all test items that passed) / (Total number of test items)
              = (Count of 1s in all test_arrays) / (Total length of all test_arrays)
    
    Zero-Error Runs = (Permutations with all runs passing) / (Total unique permutations)
                    = (Count of permutation_item_ids where all runs have all 1s) / 
                      (Total unique permutation_item_ids)
    
    Performance Speed uses standard statistical measures:
    - Median: Middle value when sorted (50th percentile)
    - Average: Arithmetic mean = Σ(time_spent) / N
    - Max: Maximum value
    - Min: Minimum value
    - Histogram: Distribution across 10 equal-width bins
    
    Behavioral Efficiency uses median values (robust to outliers):
    - Median HITL turns: Middle value of HITL_turns_int
    - Median tool calls: Middle value of tool_call_int
    - Median ReACT calls: Middle value of ReACT_agent_calls
    - Median Forbidden tool calls: Middle value of forbidden_tool_calls
    
    Args:
        result_data: List of dicts from parse_result_csv or read_result_csv
                    Each dict represents one row of result data
        
    Returns:
        Dict with KPIs:
        {
            'pass_rate': float (0.0 to 1.0),
            'zero_error_runs': float (0.0 to 1.0),
            'total_rows': int,
            'performance_speed': {
                'median': float,
                'average': float,
                'max': float,
                'min': float,
                'histogram': [
                    {'bin_start': float, 'bin_end': float, 'count': int},
                    ...
                ]
            },
            'behavioral_efficiency': {
                'median_hitl_turns': float,
                'median_tool_calls': float,
                'median_react_agent_calls': float,
                'median_forbidden_tool_calls': float
            }
        }
    """
    # Handle empty data case
    if not result_data:
        return {
            'pass_rate': 0.0,
            'zero_error_runs': 0.0,
            'total_rows': 0,
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
                'median_forbidden_tool_calls': 0.0
            }
        }
    
    # Calculate total number of rows in the CSV
    total_rows = len(result_data)
    
    # ========================================================================
    # 1. PASS RATE CALCULATION
    # ========================================================================
    # Formula: Pass Rate = (Sum of all passing tests) / (Total test items)
    # 
    # Algorithm:
    # 1. Flatten all test_arrays into a single list
    # 2. Count the number of 1s (passes)
    # 3. Divide by total length
    #
    # Example:
    #   Row 1: test_array = [1, 1, 0]  (2 passes, 1 fail)
    #   Row 2: test_array = [1, 0, 1]  (2 passes, 1 fail)
    #   Total: 4 passes / 6 tests = 0.667 (66.7% pass rate)
    
    all_test_items = []
    for row in result_data:
        all_test_items.extend(row['test_array'])
    
    if all_test_items:
        # Pass rate = (number of 1s) / (total items)
        pass_rate = sum(all_test_items) / len(all_test_items)
    else:
        pass_rate = 0.0
    
    # ========================================================================
    # 2. ZERO-ERROR RUNS CALCULATION
    # ========================================================================
    # Formula: Zero-Error Runs = (Perfect permutations) / (Total permutations)
    #
    # A "zero-error run" means a permutation_item_id where ALL runs have
    # ALL tests passing (all 1s in test_array).
    #
    # Algorithm:
    # 1. Group rows by permutation_item_id
    # 2. For each permutation, check if ALL runs have ALL tests passing
    # 3. Count perfect permutations
    # 4. Divide by total unique permutations
    #
    # Example:
    #   Permutation "A": 3 runs, all with test_array = [1, 1, 1] → Perfect ✓
    #   Permutation "B": 2 runs, one with [1, 0, 1] → Not perfect ✗
    #   Result: 1 perfect / 2 total = 0.5 (50%)
    
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
            # If any test in any run is not 1, this permutation is not perfect
            if not all(test == 1 for test in run['test_array']):
                all_passing = False
                break
        
        if all_passing:
            zero_error_count += 1
    
    zero_error_runs = zero_error_count / total_permutations if total_permutations > 0 else 0.0
    
    # ========================================================================
    # 3. PERFORMANCE SPEED CALCULATION
    # ========================================================================
    # Statistical analysis of time_spent values
    #
    # Median: Middle value when sorted (robust to outliers)
    #   - If N is odd: median = value at position (N+1)/2
    #   - If N is even: median = average of values at positions N/2 and (N/2)+1
    #
    # Average (Mean): Arithmetic mean = Σ(x_i) / N
    #
    # Histogram: Distribution of values across 10 equal-width bins
    #   - Bin width = (max - min) / 10
    #   - Each value falls into bin: floor((value - min) / bin_width)
    #   - Bins are [min, min+width), [min+width, min+2*width), ..., [min+9*width, max]
    
    time_spent_values = [row['time_spent'] for row in result_data]
    
    if time_spent_values:
        # Calculate basic statistics
        time_spent_median = statistics.median(time_spent_values)
        time_spent_average = statistics.mean(time_spent_values)
        time_spent_max = max(time_spent_values)
        time_spent_min = min(time_spent_values)
        
        # Create histogram data (10 bins)
        # Algorithm:
        # 1. Calculate bin width: (max - min) / 10
        # 2. For each value, determine which bin it belongs to
        # 3. Count values in each bin
        if len(time_spent_values) > 1:
            bin_width = (time_spent_max - time_spent_min) / 10
            bins = [0] * 10
            
            for value in time_spent_values:
                # Calculate bin index: floor((value - min) / bin_width)
                # Clamp to [0, 9] to handle edge case where value == max
                bin_index = min(int((value - time_spent_min) / bin_width), 9) if bin_width > 0 else 0
                bins[bin_index] += 1
            
            # Create histogram structure with bin boundaries
            histogram = [
                {
                    'bin_start': time_spent_min + i * bin_width,
                    'bin_end': time_spent_min + (i + 1) * bin_width,
                    'count': bins[i]
                }
                for i in range(10)
            ]
        else:
            # Special case: only one value, create single bin
            histogram = [{'bin_start': time_spent_min, 'bin_end': time_spent_max, 'count': 1}]
    else:
        time_spent_median = 0.0
        time_spent_average = 0.0
        time_spent_max = 0.0
        time_spent_min = 0.0
        histogram = []
    
    # ========================================================================
    # 4. BEHAVIORAL EFFICIENCY CALCULATION
    # ========================================================================
    # Uses median values (robust to outliers) for interaction metrics
    #
    # Median: Middle value when sorted
    #   - More robust than mean when data has outliers
    #   - Represents the "typical" value
    #
    # Median Forbidden tool calls: Middle value of forbidden_tool_calls
    #   - Note: Despite the name "rate", this actually returns a count
    
    hitl_turns_values = [row['HITL_turns_int'] for row in result_data]
    tool_calls_values = [row['tool_call_int'] for row in result_data]
    react_calls_values = [row['ReACT_agent_calls'] for row in result_data]
    forbidden_calls_values = [row['forbidden_tool_calls'] for row in result_data]
    
    # Calculate medians (returns 0.0 if list is empty)
    median_hitl_turns = statistics.median(hitl_turns_values) if hitl_turns_values else 0.0
    median_tool_calls = statistics.median(tool_calls_values) if tool_calls_values else 0.0
    median_react_agent_calls = statistics.median(react_calls_values) if react_calls_values else 0.0
    median_forbidden_tool_calls = statistics.median(forbidden_calls_values) if forbidden_calls_values else 0.0
    
    return {
        'pass_rate': pass_rate,
        'zero_error_runs': zero_error_runs,
        'total_rows': total_rows,
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
            'median_forbidden_tool_calls': median_forbidden_tool_calls
        }
    }


def calculate_component_kpis(result_data, component_name, permutation_lookup=None, overall_kpis=None):
    """Calculate KPIs for a specific component, broken down by variant.
    
    This function performs component-level analysis by:
    1. Grouping result rows by component variant
    2. Calculating the same KPIs as high-level for each variant
    3. Calculating deltas (differences) from overall metrics for each variant
    4. Aggregating across all variants for component-level summary
    
    Mathematical Approach:
    
    Variant-Level KPIs:
    - Same calculations as calculate_high_level_kpis, but filtered to rows
      where the component uses a specific variant
    
    Variant Deltas:
    - Delta = variant_value - overall_value
    - Provides context for how each variant performs relative to the overall average
    - Example: pass_rate_delta = variant_pass_rate - overall_pass_rate
      (positive = better than average, negative = worse than average)
    
    Aggregated Component KPIs:
    - Pass Rate: Weighted average across variants
      = Σ(variant_pass_rate × variant_row_count) / total_rows
    - Zero-Error Runs: Calculated across all unique permutations in the component
    - Performance/Behavioral: Calculated from all rows (not weighted)
    
    Args:
        result_data: List of dicts from parse_result_csv or read_result_csv
        component_name: Name of the component to analyze
        permutation_lookup: Optional dict mapping permutation_item_id → 
                          {component_name: variant_used}
                          If None, will try to extract from permutation_object in row data
        overall_kpis: Optional dict from calculate_high_level_kpis containing overall metrics.
                      If provided, deltas will be calculated for each variant.
                      Expected format:
                      {
                          'pass_rate': float,
                          'zero_error_runs': float,
                          'performance_speed': {'median': float, ...},
                          'behavioral_efficiency': {
                              'median_hitl_turns': float,
                              'median_tool_calls': float,
                              'median_react_agent_calls': float,
                              'median_forbidden_tool_calls': float
                          }
                      }
        
    Returns:
        Dict with component-level KPIs:
        {
            'component_name': str,
            'variants': {
                variant_key: {
                    'pass_rate': float,
                    'pass_rate_delta': float,  # variant - overall
                    'zero_error_runs': float,
                    'zero_error_runs_delta': float,  # variant - overall
                    'performance_speed': {
                        'median': float,
                        'median_delta': float,  # variant - overall
                        ...
                    },
                    'behavioral_efficiency': {
                        'median_hitl_turns': float,
                        'median_hitl_turns_delta': float,  # variant - overall
                        'median_tool_calls': float,
                        'median_tool_calls_delta': float,  # variant - overall
                        'median_react_agent_calls': float,
                        'median_react_agent_calls_delta': float,  # variant - overall
                        'median_forbidden_tool_calls': float,
                        'median_forbidden_tool_calls_delta': float,  # variant - overall
                    },
                    'row_count': int
                },
                ...
            },
            'aggregated': {
                'pass_rate': float,
                'zero_error_runs': float,
                'performance_speed': {...},
                'behavioral_efficiency': {...}
            },
            'has_data': bool
        }
    """
    # Group result rows by component variant
    variant_data = defaultdict(list)
    matched_count = 0
    unmatched_count = 0
    
    # ========================================================================
    # STEP 1: GROUP ROWS BY VARIANT
    # ========================================================================
    # For each row, determine which variant of the component was used
    # Priority:
    # 1. Extract from permutation_object in row (preferred)
    # 2. Fall back to permutation_lookup if available
    
    for row in result_data:
        component_mapping = None
        variant = None
        
        # First, try to get component mapping from permutation_object in the row
        # permutation_object format: [{"persona": "..."}, {"block_type": "..."}, ...]
        if 'permutation_object' in row and row.get('permutation_object'):
            try:
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
    
    # ========================================================================
    # STEP 2: CALCULATE KPIs FOR EACH VARIANT
    # ========================================================================
    # For each variant, calculate the same KPIs as high-level analysis
    # This gives us variant-specific performance metrics
    
    variant_kpis = {}
    for variant_key, variant_rows in variant_data.items():
        # Calculate same KPIs as high-level for this variant
        # (Same formulas as in calculate_high_level_kpis)
        
        # Pass Rate for this variant
        all_test_items = []
        for row in variant_rows:
            all_test_items.extend(row['test_array'])
        
        pass_rate = sum(all_test_items) / len(all_test_items) if all_test_items else 0.0
        
        # Zero-Error Runs for this variant
        # Formula: (Perfect permutations for this variant) / (Total permutations for this variant)
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
        
        # Performance Speed for this variant
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
        
        # Behavioral Efficiency for this variant
        hitl_turns_values = [row['HITL_turns_int'] for row in variant_rows]
        tool_calls_values = [row['tool_call_int'] for row in variant_rows]
        react_calls_values = [row['ReACT_agent_calls'] for row in variant_rows]
        forbidden_calls_values = [row['forbidden_tool_calls'] for row in variant_rows]
        
        median_hitl_turns = statistics.median(hitl_turns_values) if hitl_turns_values else 0.0
        median_tool_calls = statistics.median(tool_calls_values) if tool_calls_values else 0.0
        median_react_agent_calls = statistics.median(react_calls_values) if react_calls_values else 0.0
        median_forbidden_tool_calls = statistics.median(forbidden_calls_values) if forbidden_calls_values else 0.0
        
        # ========================================================================
        # CALCULATE DELTAS FROM OVERALL METRICS
        # ========================================================================
        # Delta = variant_value - overall_value
        # Positive delta means variant performs better than overall (for metrics where higher is better)
        # Negative delta means variant performs worse than overall
        
        # Extract overall values if provided
        overall_pass_rate = overall_kpis.get('pass_rate') if overall_kpis else None
        overall_zero_error_runs = overall_kpis.get('zero_error_runs') if overall_kpis else None
        overall_performance_median = overall_kpis.get('performance_speed', {}).get('median') if overall_kpis else None
        overall_behavioral = overall_kpis.get('behavioral_efficiency', {}) if overall_kpis else {}
        overall_median_hitl_turns = overall_behavioral.get('median_hitl_turns')
        overall_median_tool_calls = overall_behavioral.get('median_tool_calls')
        overall_median_react_agent_calls = overall_behavioral.get('median_react_agent_calls')
        overall_median_forbidden_tool_calls = overall_behavioral.get('median_forbidden_tool_calls')
        
        # Calculate deltas (None if overall value not available)
        pass_rate_delta = (pass_rate - overall_pass_rate) if overall_pass_rate is not None else None
        zero_error_runs_delta = (zero_error_runs - overall_zero_error_runs) if overall_zero_error_runs is not None else None
        performance_median_delta = (time_spent_median - overall_performance_median) if overall_performance_median is not None else None
        median_hitl_turns_delta = (median_hitl_turns - overall_median_hitl_turns) if overall_median_hitl_turns is not None else None
        median_tool_calls_delta = (median_tool_calls - overall_median_tool_calls) if overall_median_tool_calls is not None else None
        median_react_agent_calls_delta = (median_react_agent_calls - overall_median_react_agent_calls) if overall_median_react_agent_calls is not None else None
        median_forbidden_tool_calls_delta = (median_forbidden_tool_calls - overall_median_forbidden_tool_calls) if overall_median_forbidden_tool_calls is not None else None
        
        variant_kpis[variant_key] = {
            'pass_rate': pass_rate,
            'pass_rate_delta': pass_rate_delta,
            'zero_error_runs': zero_error_runs,
            'zero_error_runs_delta': zero_error_runs_delta,
            'performance_speed': {
                'median': time_spent_median,
                'median_delta': performance_median_delta,
                'average': time_spent_average,
                'max': time_spent_max,
                'min': time_spent_min
            },
            'behavioral_efficiency': {
                'median_hitl_turns': median_hitl_turns,
                'median_hitl_turns_delta': median_hitl_turns_delta,
                'median_tool_calls': median_tool_calls,
                'median_tool_calls_delta': median_tool_calls_delta,
                'median_react_agent_calls': median_react_agent_calls,
                'median_react_agent_calls_delta': median_react_agent_calls_delta,
                'median_forbidden_tool_calls': median_forbidden_tool_calls,
                'median_forbidden_tool_calls_delta': median_forbidden_tool_calls_delta
            },
            'row_count': len(variant_rows)
        }
    
    # ========================================================================
    # STEP 3: AGGREGATE ACROSS ALL VARIANTS
    # ========================================================================
    # Calculate component-level summary metrics
    
    if variant_kpis:
        # Calculate weighted averages across variants
        total_rows = sum(kpi['row_count'] for kpi in variant_kpis.values())
        
        if total_rows > 0:
            # Aggregated Pass Rate: Weighted average
            # Formula: Σ(variant_pass_rate × variant_row_count) / total_rows
            aggregated_pass_rate = sum(
                kpi['pass_rate'] * kpi['row_count'] for kpi in variant_kpis.values()
            ) / total_rows
            
            # Zero-Error Runs: Calculate across all unique permutations in component
            # (Not a weighted average - counts unique perfect permutations)
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
            
            # Aggregate performance and behavioral metrics
            # Use all variant rows (not weighted - just calculate from all data)
            all_time_spent = [row['time_spent'] for rows in variant_data.values() for row in rows]
            all_hitl_turns = [row['HITL_turns_int'] for rows in variant_data.values() for row in rows]
            all_tool_calls = [row['tool_call_int'] for rows in variant_data.values() for row in rows]
            all_react_calls = [row['ReACT_agent_calls'] for rows in variant_data.values() for row in rows]
            all_forbidden_calls = [row['forbidden_tool_calls'] for rows in variant_data.values() for row in rows]
            
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
                'median_forbidden_tool_calls': statistics.median(all_forbidden_calls) if all_forbidden_calls else 0.0
            }
        else:
            aggregated_pass_rate = 0.0
            aggregated_zero_error_runs = 0.0
            aggregated_performance = {'median': 0.0, 'average': 0.0, 'max': 0.0, 'min': 0.0}
            aggregated_behavioral = {
                'median_hitl_turns': 0.0,
                'median_tool_calls': 0.0,
                'median_react_agent_calls': 0.0,
                'median_forbidden_tool_calls': 0.0
            }
    else:
        aggregated_pass_rate = 0.0
        aggregated_zero_error_runs = 0.0
        aggregated_performance = {'median': 0.0, 'average': 0.0, 'max': 0.0, 'min': 0.0}
        aggregated_behavioral = {
            'median_hitl_turns': 0.0,
            'median_tool_calls': 0.0,
            'median_react_agent_calls': 0.0,
            'median_forbidden_tool_calls': 0.0
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
        'has_data': has_data
    }

