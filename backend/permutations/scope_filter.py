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
    Uses deny-list logic: variant_scopes is an array of rules that specify which variant pairs cannot be combined.
    
    Args:
        combination: tuple of variants (one per component)
        component_names: list of component names in order
        variant_scopes: array of deny rules, each rule is {variant1: "ComponentName:variantIndex", variant2: "ComponentName:variantIndex"}
                        Also accepts empty dict {} for backward compatibility (treated as empty array)
        component_map: dict mapping component names to component objects
    
    Returns:
        True if combination is allowed, False if restricted
    """
    if not variant_scopes:  # Empty = allow all
        return True
    
    # Backward compatibility: treat empty dict {} as empty array []
    if isinstance(variant_scopes, dict):
        return True  # Legacy format - allow all combinations
    
    # Build variant identifiers for current combination
    combination_variant_ids = []
    for comp_name, variant in zip(component_names, combination):
        variant_idx = get_variant_index(comp_name, variant, component_map)
        if variant_idx is not None:
            combination_variant_ids.append(f"{comp_name}:{variant_idx}")
    
    # Check if any deny rule matches this combination
    # A rule matches if both variants in the rule are present in the combination
    for rule in variant_scopes:
        variant1_id = rule.get('variant1')
        variant2_id = rule.get('variant2')
        
        if variant1_id and variant2_id:
            if variant1_id in combination_variant_ids and variant2_id in combination_variant_ids:
                return False  # This combination is denied
    
    return True
