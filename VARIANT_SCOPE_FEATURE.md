# Variant Scope Feature - Implementation Plan

## Overview
Allow users to control which component variants can map to which other components within a template, instead of the current full cartesian product.

## Data Model

**Template Structure**: Add `variantScopes` field
- Type: `dict` (JSON object)
- Structure: `{component_name: {variant_index: [allowed_component_names]}}`
- Example: `{"persona": {0: ["block_type", "metadata"], 1: ["block_type"]}}`
- Default: `{}` (empty = all variants map to all components - backward compatible)
- Storage: New `variant_scopes` column in `templates.csv` (JSON string)

---

## Backend Changes

### 1. Data Persistence (`backend/utils.py`)
- Update `read_templates()`: Parse `variant_scopes` field, default to `{}`
- Update `write_templates()`: Write `variant_scopes` as JSON string
- Update CSV header to include `variant_scopes` column

### 2. API Endpoints (`backend/app.py`)
- Update `create_template`, `update_template`, `get_template` to handle `variantScopes`
- Add validation: variant scope must only reference components used in template

### 3. Permutation Module Refactor
**Split `backend/permutations.py` into:**
- `backend/permutations/__init__.py` - Public API exports
- `backend/permutations/extraction.py` - `extract_components_from_template()`
- `backend/permutations/generation.py` - `generate_permutation_data()`, `calculate_permutations()`
- `backend/permutations/scope_filter.py` - NEW: Scope filtering logic
- `backend/permutations/export.py` - CSV export functions

### 4. Scope Filtering Logic (`backend/permutations/scope_filter.py`)

**Function**: `is_combination_allowed(combination, component_names, variant_scopes)`
- Input: `combination` = tuple of variants, `component_names` = list of component names in order, `variant_scopes` = scope dict
- Logic: For each variant in combination, check if its scope allows all other components in the combination
- Return: `True` if allowed, `False` if restricted

**Simplified Logic**:
```python
def is_combination_allowed(combination, component_names, variant_scopes):
    if not variant_scopes:  # Empty = allow all
        return True
    
    for i, (component_name, variant) in enumerate(zip(component_names, combination)):
        variant_index = get_variant_index(component_name, variant)
        scope = variant_scopes.get(component_name, {}).get(variant_index)
        
        if scope is not None:  # Scope defined for this variant
            # Check all other components in combination are allowed
            other_components = [name for j, name in enumerate(component_names) if j != i]
            if not all(comp in scope for comp in other_components):
                return False
    
    return True
```

**Integration**: Modify `generate_permutation_data()` to filter combinations:
```python
for combination in product(*variant_lists):
    if is_combination_allowed(combination, unique_component_names, variant_scopes):
        # Generate permutation...
```

---

## Frontend Changes

### Component Hierarchy

1. **PermutationPicker** (Master - edit/save mode)
   - Props: `template`, `componentsMap`, `variantScopes`, `onSave(variantScopes)`
   - State: `isEditing`, `localScopes`, `saving`
   - Features: Display summary / Edit mode with save/cancel

2. **ComponentVariantScopeList** (Lists all components)
   - Props: `components[]`, `componentsMap`, `variantScopes`, `onScopeChange(componentName, variantIndex, allowedComponents[])`
   - Maps through components, renders ComponentVariantScope for each

3. **ComponentVariantScope** (One component with variants)
   - Props: `componentName`, `component`, `otherComponents[]`, `variantScopes`, `onScopeChange(variantIndex, allowedComponents[])`
   - Shows component name/description, maps variants to VariantScopeRow

4. **VariantScopeRow** (One variant with checkboxes)
   - Props: `variant`, `variantIndex`, `componentName`, `isSplit`, `splitParts[]`, `otherComponents[]`, `allowedComponents[]`, `onChange(allowedComponents[])`
   - Displays variant text, checkboxes for each other component, select/deselect all

### Data Flow

**State Management**: PermutationPicker holds all state, passes down read-only props and update callbacks

**Update Flow**: 
1. User toggles checkbox in VariantScopeRow
2. `onChange` updates allowedComponents array
3. Callback chain: VariantScopeRow → ComponentVariantScope → ComponentVariantScopeList → PermutationPicker
4. PermutationPicker updates `localScopes` state
5. Save button calls `onSave(localScopes)` → API update

**Default Initialization**: 
- If `variantScopes` is `{}`, don't pre-populate
- In UI, show all checkboxes checked (default state)
- Only save non-default scopes to backend (or save empty `{}` to mean "all allowed")

---

## Files to Create

**Backend:**
1. `backend/permutations/__init__.py`
2. `backend/permutations/extraction.py`
3. `backend/permutations/generation.py`
4. `backend/permutations/scope_filter.py`
5. `backend/permutations/export.py`

**Frontend:**
6. `frontend/src/components/PermutationPicker.jsx` + `.css`
7. `frontend/src/components/ComponentVariantScopeList.jsx` + `.css`
8. `frontend/src/components/ComponentVariantScope.jsx` + `.css`
9. `frontend/src/components/VariantScopeRow.jsx` + `.css`

## Files to Modify

1. `backend/utils.py` - Template read/write
2. `backend/app.py` - Template API endpoints
3. `backend/permutations.py` - Refactor into module
4. `frontend/src/pages/TemplateItem.jsx` - Add PermutationPicker
5. `frontend/src/utils/api.js` - Update templateAPI if needed

---

## Implementation Order

1. **Backend Data Model**
   - Update `utils.py` for `variant_scopes` field
   - Update `app.py` endpoints
   - Test backward compatibility

2. **Backend Permutation Logic**
   - Refactor `permutations.py` into module
   - Create `scope_filter.py` with filtering logic
   - Update `generate_permutation_data()` to use filtering
   - Test with scope restrictions

3. **Frontend UI**
   - Create components bottom-up: VariantScopeRow → ComponentVariantScope → ComponentVariantScopeList → PermutationPicker
   - Integrate into TemplateItem.jsx
   - Wire up API calls
   - Test with various configurations

---

## Key Considerations

- **Backward Compatibility**: Empty `variant_scopes` = all variants map to all components
- **Validation**: Scope must only reference components in template
- **Performance**: Filter during generation, not after
- **Default State**: UI shows all checked, backend stores `{}` for "all allowed"

---

## Testing Checklist

- [ ] Templates without variant_scopes work as before
- [ ] Permutation count updates with scope restrictions
- [ ] CSV generation respects scopes
- [ ] UI displays and saves scopes correctly
- [ ] Validation prevents invalid configurations
- [ ] Refactored module maintains public API
