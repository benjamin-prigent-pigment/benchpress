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
        variant_scopes: dict of {component_name: {variant_index: [allowed_component_names]}}
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
        
        # Access scope - variant_index is an integer
        scope = variant_scopes.get(component_name, {}).get(variant_index)
        
        if scope is not None:  # Scope defined for this variant
            # Check all other components in combination are allowed
            other_components = [name for j, name in enumerate(component_names) if j != i]
            if not all(comp in scope for comp in other_components):
                return False
    
    return True
