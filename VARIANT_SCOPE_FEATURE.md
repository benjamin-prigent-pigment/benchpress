# Variant Scope Feature - Implementation Plan

## Overview
Allow users to control which component variants can map to which other components within a template, instead of the current full cartesian product.

**UX Approach**: Rules-based deny list - users specify pairs of variants that cannot be combined.

## Data Model

**Template Structure**: Add `variantScopes` field
- Type: `array` (JSON array)
- Structure: `[{variant1: "ComponentName:variantIndex", variant2: "ComponentName:variantIndex"}, ...]`
- Example: `[{"variant1": "persona:0", "variant2": "block_type:1"}, {"variant1": "persona:1", "variant2": "metadata:2"}]`
- Default: `[]` (empty = all variants can combine - backward compatible)
- Storage: `variant_scopes` column in `templates.csv` (JSON string)

---

## Backend Changes

### 1. Data Persistence (`backend/utils.py`)
- No changes needed - already handles JSON array format

### 2. API Endpoints (`backend/app.py`)
- Update `validate_variant_scopes()`: Validate array format instead of dict format
- Validation: Rules must only reference components and variants used in template
- Each rule must have `variant1` and `variant2` fields with format "ComponentName:variantIndex"

### 3. Scope Filtering Logic (`backend/permutations/scope_filter.py`)

**Function**: `is_combination_allowed(combination, component_names, variant_scopes, component_map)`
- Input: `combination` = tuple of variants, `component_names` = list of component names in order, `variant_scopes` = array of deny rules, `component_map` = component data
- Logic: Check if combination matches any deny rule (both variants in rule are present in combination)
- Return: `True` if allowed, `False` if restricted

**Logic**:
```python
def is_combination_allowed(combination, component_names, variant_scopes, component_map):
    if not variant_scopes:  # Empty = allow all
        return True
    
    # Build variant identifiers for current combination
    combination_variant_ids = []
    for comp_name, variant in zip(component_names, combination):
        variant_idx = get_variant_index(comp_name, variant, component_map)
        if variant_idx is not None:
            combination_variant_ids.append(f"{comp_name}:{variant_idx}")
    
    # Check if any deny rule matches this combination
    for rule in variant_scopes:
        variant1_id = rule.get('variant1')
        variant2_id = rule.get('variant2')
        if variant1_id in combination_variant_ids and variant2_id in combination_variant_ids:
            return False  # This combination is denied
    
    return True
```

**Integration**: Modify `generate_permutation_data()` to filter combinations:
```python
for combination in product(*variant_lists):
    if is_combination_allowed(combination, unique_component_names, variant_scopes, component_map):
        # Generate permutation...
```

---

## Frontend Changes

### Component Hierarchy

1. **PermutationPicker** (Master - edit/save mode)
   - Props: `template`, `componentsMap`, `variantScopes`, `onSave(variantScopes)`
   - State: `isEditing`, `localRules`, `saving`
   - Features: Display summary / Edit mode with rules list and save/cancel

2. **VariantScopeRulesList** (Rules list container)
   - Props: `rules[]`, `componentsMap`, `onAddRule()`, `onDeleteRule(index)`
   - Displays list of rules, "+" button to add new rule, delete button per rule
   - Each rule shows: "Variant1 × Variant2" format

3. **AddRuleModal** (Modal for adding new rule)
   - Props: `isOpen`, `onClose`, `onAdd(variant1, variant2)`, `componentsMap`, `templateComponents[]`
   - Two select dropdowns showing all variants from all components in template
   - Format: "ComponentName: VariantText" in dropdowns
   - Validation: Cannot select same variant twice, cannot add duplicate rule

### Data Flow

**State Management**: PermutationPicker holds all state

**Update Flow**: 
1. User clicks "+" button → opens AddRuleModal
2. User selects 2 variants in modal → clicks Add
3. Modal calls `onAdd(variant1Id, variant2Id)` → PermutationPicker adds rule to `localRules`
4. User clicks delete on a rule → PermutationPicker removes rule from `localRules`
5. Save button calls `onSave(localRules)` → API update

**Default Initialization**: 
- If `variantScopes` is `[]`, show empty rules list
- Empty rules list = all combinations allowed

---

## Files to Create

**Frontend:**
1. `frontend/src/components/VariantScopeRulesList.jsx` + `.css` - Rules list with add/delete
2. `frontend/src/components/AddRuleModal.jsx` + `.css` - Modal for selecting 2 variants

## Files to Modify

**Backend:**
1. `backend/permutations/scope_filter.py` - Update `is_combination_allowed()` for deny-list logic
2. `backend/app.py` - Update `validate_variant_scopes()` for new array format
3. `backend/utils.py` - No changes needed (already handles JSON)

**Frontend:**
4. `frontend/src/components/PermutationPicker.jsx` - Replace ComponentVariantScopeList with VariantScopeRulesList
5. `frontend/src/pages/TemplateItem.jsx` - No changes (already uses PermutationPicker)

## Files to Delete

**Frontend:**
1. `frontend/src/components/ComponentVariantScopeList.jsx` + `.css`
2. `frontend/src/components/ComponentVariantScope.jsx` + `.css`
3. `frontend/src/components/VariantScopeRow.jsx` + `.css`

---

## Implementation Order

1. **Backend Data Model & Logic**
   - Update `scope_filter.py` - change `is_combination_allowed()` to deny-list logic
   - Update `app.py` - change `validate_variant_scopes()` to validate array format
   - Test backward compatibility (empty array = all allowed)

2. **Frontend UI**
   - Create `AddRuleModal.jsx` - modal with 2 variant select dropdowns
   - Create `VariantScopeRulesList.jsx` - rules list with add/delete buttons
   - Update `PermutationPicker.jsx` - replace old components with new rules list
   - Delete old components: ComponentVariantScopeList, ComponentVariantScope, VariantScopeRow
   - Test with various rule configurations

---

## Key Considerations

- **Backward Compatibility**: Empty `variant_scopes` array `[]` = all variants can combine
- **Validation**: Rules must only reference components and variants used in template
- **Performance**: Filter during generation, not after
- **Default State**: Empty rules list = all combinations allowed
- **Rule Format**: Each rule is `{variant1: "ComponentName:variantIndex", variant2: "ComponentName:variantIndex"}`
- **Duplicate Prevention**: Cannot add same rule twice

---

## Testing Checklist

- [ ] Templates without variant_scopes (or empty array) work as before
- [ ] Permutation count updates with deny rules
- [ ] CSV generation respects deny rules
- [ ] UI displays and saves rules correctly
- [ ] Validation prevents invalid configurations (non-existent components/variants)
- [ ] Cannot add duplicate rules
- [ ] Cannot select same variant twice in a rule
- [ ] Rules list shows readable variant names
