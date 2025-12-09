# KPI Calculation Verification

This document verifies the mathematical soundness of the KPI calculations in `backend/results_utils.py`.

## Main Calculation Functions

### 1. `calculate_high_level_kpis(result_data)` (lines 590-710)

#### 1.1 Pass Rate (lines 618-626)
**Formula:** `pass_rate = sum(all_test_items == 1) / total_test_items`

**Verification:**
- ✅ Collects all test items from all rows: `all_test_items.extend(row['test_array'])`
- ✅ Calculates: `sum(all_test_items) / len(all_test_items)`
- ✅ Since test_array contains 0s and 1s, `sum()` correctly counts passing tests
- ✅ Division by total length gives the proportion (0.0 to 1.0)
- **Math is CORRECT**

#### 1.2 Zero-Error Runs (lines 628-647)
**Formula:** `zero_error_runs = (permutations with all runs passing) / (total unique permutations)`

**Verification:**
- ✅ Groups rows by `permutation_item_id`
- ✅ For each permutation, checks if ALL runs have ALL tests passing (all 1s)
- ✅ Counts permutations where `all_passing == True`
- ✅ Calculates: `zero_error_count / total_permutations`
- **Math is CORRECT**

#### 1.3 Performance Speed (lines 649-680)
**Metrics:** median, average, max, min, histogram

**Verification:**
- ✅ `statistics.median(time_spent_values)` - correct median calculation
- ✅ `statistics.mean(time_spent_values)` - correct mean calculation
- ✅ `max(time_spent_values)` and `min(time_spent_values)` - correct
- ✅ Histogram with 10 bins:
  - `bin_width = (max - min) / 10` - correct
  - `bin_index = int((value - min) / bin_width)` - correct binning
  - Edge case: `min(..., 9)` prevents index overflow
- **Math is CORRECT**

#### 1.4 Behavioral Efficiency (lines 682-692)
**Metrics:** median_hitl_turns, median_tool_calls, median_react_agent_calls, forbidden_tool_call_rate

**Verification:**
- ✅ `statistics.median(hitl_turns_values)` - correct
- ✅ `statistics.median(tool_calls_values)` - correct
- ✅ `statistics.median(react_calls_values)` - correct
- ⚠️ **Forbidden Tool Call Rate:**
  - Current: `forbidden_calls_sum / tool_calls_sum`
  - This calculates a **RATE** (proportion), not a count
  - Returns a decimal (0.0 to 1.0)
  - **ISSUE:** User mentioned it should be an integer, not a percentage
  - **Question:** Do we want the actual count of forbidden calls, or the rate?
  - If count is needed: use `forbidden_calls_sum` directly
  - If rate is correct: current implementation is mathematically sound

**Math is CORRECT for rate calculation, but may need to change to count**

### 2. `calculate_component_kpis(result_data, component_name, permutation_lookup)` (lines 766-980)

This function calculates the same metrics as high-level, but filtered by component variant.

#### 2.1 Variant-Level Calculations (lines 828-895)
**Verification:**
- ✅ Pass rate: Same logic as high-level, filtered by variant rows
- ✅ Zero-error runs: Same logic, filtered by variant rows
- ✅ Performance speed: Same statistics, filtered by variant rows
- ✅ Behavioral efficiency: Same calculations, filtered by variant rows
- ✅ `row_count = len(variant_rows)` - correct count
- **Math is CORRECT**

#### 2.2 Aggregated Component-Level Calculations (lines 897-965)
**Verification:**
- ✅ **Pass Rate Aggregation (lines 902-904):**
  - Uses weighted average: `sum(pass_rate * row_count) / total_rows`
  - This is mathematically correct for aggregating proportions
- ✅ **Zero-Error Runs Aggregation (lines 906-924):**
  - Recalculates from all variant rows combined
  - Groups by permutation_item_id across all variants
  - Counts permutations where all runs pass
  - **Math is CORRECT**
- ✅ **Performance Aggregation (lines 927-938):**
  - Combines all time_spent values from all variants
  - Calculates statistics on combined dataset
  - **Math is CORRECT**
- ✅ **Behavioral Efficiency Aggregation (lines 940-945):**
  - Combines all values from all variants
  - Calculates medians on combined dataset
  - Forbidden tool call rate: `all_forbidden_calls / sum(all_tool_calls)`
  - **Math is CORRECT**

## Potential Issues Found

### Issue 1: Forbidden Tool Call Rate vs Count
**Location:** Lines 692, 877, 944

**Current Implementation:**
```python
forbidden_tool_call_rate = forbidden_calls_sum / tool_calls_sum
```

**Issue:**
- Returns a rate (0.0 to 1.0), not an integer count
- User mentioned it should be an integer
- Frontend displays it as a number (not percentage), which is correct for a rate
- But if user wants the actual count, we need to return `forbidden_calls_sum` instead

**Recommendation:**
- Clarify with user: Do they want:
  1. **Rate** (forbidden_calls / total_tool_calls) - current implementation
  2. **Count** (total forbidden_calls) - would need to change

### Issue 2: Histogram Edge Case
**Location:** Line 663

**Current Implementation:**
```python
bin_index = min(int((value - time_spent_min) / bin_width), 9) if bin_width > 0 else 0
```

**Potential Issue:**
- When `value == time_spent_max`, the calculation might place it in bin 9, which is correct
- However, if `value` is exactly at the boundary, it could be placed in the wrong bin
- **Minor issue:** The `min(..., 9)` prevents index overflow, but the boundary handling could be improved

**Recommendation:**
- Current implementation is acceptable for most cases
- Could improve by using `<=` comparison for the last bin

## Summary

✅ **All major calculations are mathematically sound**
✅ **Pass rate, zero-error runs, and performance metrics are correct**
✅ **Component-level aggregations use appropriate weighted averages**
⚠️ **Forbidden tool call rate is correct as a rate, but may need to be changed to count if user wants integer**

## Recommendations

1. **Clarify forbidden tool call metric:**
   - If rate is desired: Keep current implementation, ensure frontend displays as decimal (0.05) not percentage (5%)
   - If count is desired: Change to return `forbidden_calls_sum` directly

2. **Add unit tests** to verify calculations with known data

3. **Consider adding validation** to ensure data integrity (e.g., tool_calls_sum > 0 before division)

