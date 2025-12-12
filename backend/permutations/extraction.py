"""Component extraction from template text"""

import re


def extract_components_from_template(template_text):
    """
    Extract component usage from template text.
    Returns a list of dicts with 'name' and optional 'part' for split components.
    Examples:
    - {{component_name}} -> {'name': 'component_name', 'part': None}
    - {{metadata/a}} -> {'name': 'metadata', 'part': 'a'}
    """
    # Pattern matches: {{component_name}} or {{component_name/part}}
    pattern = r'\{\{([^}/]+)(?:/([^}]+))?\}\}'
    matches = re.findall(pattern, template_text)
    
    # Convert to list of dicts, removing duplicates
    components = []
    seen = set()
    for match in matches:
        name = match[0].strip()
        part = match[1].strip() if match[1] else None
        key = (name, part)
        if key not in seen:
            seen.add(key)
            components.append({'name': name, 'part': part})
    
    return components
