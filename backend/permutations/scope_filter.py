"""Scope filtering logic for variant combinations"""


def get_variant_index(component_name, variant, component_map):
    """
    Get the index of a variant within a component's variants list.
    For split components, variant is a dict. For regular components, variant is a string.
    """
    component = component_map.get(component_name)
    if not component:
        return None
    
    variants = component.get('variants', [])
    for i, v in enumerate(variants):
        if v == variant:
            return i
    
    return None


def is_combination_allowed(combination, component_names, variant_scopes, component_map):
    """
    Check if a combination of variants is allowed based on variant scopes.
    
    Args:
        combination: tuple of variants (one per component)
        component_names: list of component names in order
        variant_scopes: dict of {component_name: {variant_index: [allowed_variant_identifiers]}}
                        where allowed_variant_identifiers are in format "ComponentName:variantIndex"
        component_map: dict mapping component names to component objects
    
    Returns:
        True if combination is allowed, False if restricted
    """
    if not variant_scopes:  # Empty = allow all
        return True
    
    for i, (component_name, variant) in enumerate(zip(component_names, combination)):
        variant_index = get_variant_index(component_name, variant, component_map)
        
        if variant_index is None:
            # Variant not found, skip this check
            continue
        
        # Access scope - variant_index is an integer (but may be string key from JSON)
        scope_dict = variant_scopes.get(component_name, {})
        # Handle both string and int keys (JSON keys are strings)
        scope = scope_dict.get(variant_index) or scope_dict.get(str(variant_index))
        
        if scope is not None:  # Scope defined for this variant
            # Build variant identifiers for all other components in the combination
            other_variant_ids = []
            for j, (other_comp_name, other_variant) in enumerate(zip(component_names, combination)):
                if j != i:  # Skip current component
                    other_variant_idx = get_variant_index(other_comp_name, other_variant, component_map)
                    if other_variant_idx is not None:
                        other_variant_ids.append(f"{other_comp_name}:{other_variant_idx}")
            
            # Check if all other variant identifiers are in the scope
            if not all(variant_id in scope for variant_id in other_variant_ids):
                return False
    
    return True
