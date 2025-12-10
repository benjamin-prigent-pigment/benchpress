"""Flask application for Bench Set Generator API"""

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from utils import (
    read_components, write_components,
    read_templates, write_templates,
    get_next_id, find_component_by_name,
    is_component_used_in_templates,
    init_csv_files,
    validate_split_component
)
from permutations import (
    extract_components_from_template,
    calculate_permutations,
    generate_permutation_data,
    generate_csv_file,
    save_csv_to_file
)
from result_utils import (
    delete_result,
    parse_result_csv, validate_result_csv, save_result_csv,
    get_next_result_id, read_results_metadata, write_results_metadata,
    get_result_status, read_result_csv, calculate_all_kpis,
    get_permutation_file_path_from_template_id
)
from datetime import datetime

app = Flask(__name__)
CORS(app, expose_headers=['Content-Disposition'])  # Enable CORS for frontend and expose Content-Disposition header

# Initialize CSV files on startup
init_csv_files()


# ==================== Component Endpoints ====================

@app.route('/api/components', methods=['GET'])
def get_components():
    """Get all components"""
    try:
        components = read_components()
        return jsonify(components), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/components', methods=['POST'])
def create_component():
    """Create a new component"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        variants = data.get('variants', [])
        is_split = data.get('isSplit', False)
        split_parts = data.get('splitParts', None)
        
        # Validation
        if not name:
            return jsonify({'error': 'Component name is required'}), 400
        
        # Check for duplicate name
        if find_component_by_name(name):
            return jsonify({'error': 'Component name already exists'}), 400
        
        # Build component object
        new_component = {
            'id': 0,  # Will be set by get_next_id
            'name': name,
            'description': description,
            'variants': variants,
            'isSplit': is_split,
            'splitParts': split_parts if is_split else None
        }
        
        # Validate component structure
        is_valid, error_message = validate_split_component(new_component)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        components = read_components()
        new_component['id'] = get_next_id(components)
        components.append(new_component)
        write_components(components)
        
        return jsonify(new_component), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/components/<int:component_id>', methods=['GET'])
def get_component(component_id):
    """Get a component by ID"""
    try:
        components = read_components()
        component = next((c for c in components if c['id'] == component_id), None)
        if not component:
            return jsonify({'error': 'Component not found'}), 404
        return jsonify(component), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/components/<int:component_id>', methods=['PUT'])
def update_component(component_id):
    """Update a component (but cannot change isSplit status)"""
    try:
        data = request.get_json()
        components = read_components()
        component = next((c for c in components if c['id'] == component_id), None)
        
        if not component:
            return jsonify({'error': 'Component not found'}), 404
        
        # Prevent changing isSplit status
        if 'isSplit' in data:
            if data['isSplit'] != component.get('isSplit', False):
                return jsonify({'error': 'Cannot change component type (split/regular). Delete and recreate the component.'}), 400
        
        # Update fields
        if 'name' in data:
            new_name = data['name'].strip()
            if not new_name:
                return jsonify({'error': 'Component name is required'}), 400
            # Check for duplicate name (excluding current component)
            existing = find_component_by_name(new_name)
            if existing and existing['id'] != component_id:
                return jsonify({'error': 'Component name already exists'}), 400
            component['name'] = new_name
        
        if 'description' in data:
            component['description'] = data['description'].strip()
        
        if 'variants' in data:
            component['variants'] = data['variants']
        
        if 'splitParts' in data:
            component['splitParts'] = data['splitParts'] if component.get('isSplit', False) else None
        
        # Validate component structure
        is_valid, error_message = validate_split_component(component)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        write_components(components)
        return jsonify(component), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/components/<int:component_id>', methods=['DELETE'])
def delete_component(component_id):
    """Delete a component"""
    try:
        components = read_components()
        component = next((c for c in components if c['id'] == component_id), None)
        
        if not component:
            return jsonify({'error': 'Component not found'}), 404
        
        # Check if component is used in templates
        if is_component_used_in_templates(component['name']):
            return jsonify({'error': 'Cannot delete component: it is used in one or more templates'}), 400
        
        components = [c for c in components if c['id'] != component_id]
        write_components(components)
        return jsonify({'message': 'Component deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Variant Management ====================

@app.route('/api/components/<int:component_id>/variants', methods=['POST'])
def add_variant(component_id):
    """Add a variant to a component"""
    try:
        data = request.get_json()
        variant = data.get('variant', '').strip()
        
        if not variant:
            return jsonify({'error': 'Variant text is required'}), 400
        
        components = read_components()
        component = next((c for c in components if c['id'] == component_id), None)
        
        if not component:
            return jsonify({'error': 'Component not found'}), 404
        
        component['variants'].append(variant)
        write_components(components)
        return jsonify(component), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/components/<int:component_id>/variants/<int:variant_id>', methods=['PUT'])
def update_variant(component_id, variant_id):
    """Update a variant in a component"""
    try:
        data = request.get_json()
        new_variant = data.get('variant', '').strip()
        
        if not new_variant:
            return jsonify({'error': 'Variant text is required'}), 400
        
        components = read_components()
        component = next((c for c in components if c['id'] == component_id), None)
        
        if not component:
            return jsonify({'error': 'Component not found'}), 404
        
        if variant_id < 0 or variant_id >= len(component['variants']):
            return jsonify({'error': 'Variant not found'}), 404
        
        component['variants'][variant_id] = new_variant
        write_components(components)
        return jsonify(component), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/components/<int:component_id>/variants/<int:variant_id>', methods=['DELETE'])
def delete_variant(component_id, variant_id):
    """Delete a variant from a component"""
    try:
        components = read_components()
        component = next((c for c in components if c['id'] == component_id), None)
        
        if not component:
            return jsonify({'error': 'Component not found'}), 404
        
        if variant_id < 0 or variant_id >= len(component['variants']):
            return jsonify({'error': 'Variant not found'}), 404
        
        if len(component['variants']) <= 2:
            return jsonify({'error': 'At least 2 variants are required'}), 400
        
        component['variants'].pop(variant_id)
        write_components(components)
        return jsonify(component), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Template Endpoints ====================

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Get all templates"""
    try:
        templates = read_templates()
        return jsonify(templates), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/templates', methods=['POST'])
def create_template():
    """Create a new template"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        text = data.get('text', '')
        
        if not name:
            return jsonify({'error': 'Template name is required'}), 400
        
        # Extract unique component names from template text
        component_usages = extract_components_from_template(text)
        unique_components = list(set(usage['name'] for usage in component_usages))
        
        templates = read_templates()
        new_template = {
            'id': get_next_id(templates),
            'name': name,
            'description': description,
            'text': text,
            'components': unique_components
        }
        templates.append(new_template)
        write_templates(templates)
        
        return jsonify(new_template), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/templates/<int:template_id>', methods=['GET'])
def get_template(template_id):
    """Get a template by ID"""
    try:
        templates = read_templates()
        template = next((t for t in templates if t['id'] == template_id), None)
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        return jsonify(template), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/templates/<int:template_id>', methods=['PUT'])
def update_template(template_id):
    """Update a template"""
    try:
        data = request.get_json()
        templates = read_templates()
        template = next((t for t in templates if t['id'] == template_id), None)
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        if 'text' in data:
            template['text'] = data['text']
            # Extract unique component names from updated template text
            component_usages = extract_components_from_template(data['text'])
            template['components'] = list(set(usage['name'] for usage in component_usages))
        
        if 'name' in data:
            template['name'] = data['name'].strip()
        
        if 'description' in data:
            template['description'] = data['description'].strip()
        
        write_templates(templates)
        return jsonify(template), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Delete a template"""
    try:
        templates = read_templates()
        template = next((t for t in templates if t['id'] == template_id), None)
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        templates = [t for t in templates if t['id'] != template_id]
        write_templates(templates)
        return jsonify({'message': 'Template deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Permutation & Export ====================
# Permutation logic is now in permutations.py


@app.route('/api/templates/<int:template_id>/count', methods=['GET'])
def get_permutation_count(template_id):
    """Get permutation count for a template"""
    try:
        templates = read_templates()
        template = next((t for t in templates if t['id'] == template_id), None)
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        count = calculate_permutations(template['text'])
        component_usages = extract_components_from_template(template['text'])
        
        # Build breakdown string
        if not component_usages:
            breakdown = "No components found"
        else:
            components = read_components()
            component_map = {comp['name']: comp for comp in components}
            # Get unique component names (group split parts together)
            unique_names = set(usage['name'] for usage in component_usages)
            parts = []
            for name in unique_names:
                if name in component_map:
                    variant_count = len(component_map[name]['variants'])
                    parts.append(f"{variant_count} {name} variant(s)")
            breakdown = " × ".join(parts) if parts else "0"
        
        return jsonify({
            'count': count,
            'breakdown': breakdown
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/templates/<int:template_id>/generate', methods=['POST'])
def generate_csv(template_id):
    """Generate and download CSV file with all permutations"""
    try:
        templates = read_templates()
        template = next((t for t in templates if t['id'] == template_id), None)
        
        if not template:
            return jsonify({'error': 'Template not found'}), 404
        
        # Generate permutation data with IDs and mappings
        permutation_data = generate_permutation_data(template['text'])
        
        if not permutation_data:
            return jsonify({'error': 'No permutations generated. Check that all components exist.'}), 400
        
        # Generate CSV file using template name
        csv_bytes, filename = generate_csv_file(permutation_data, template['name'])
        
        # Save to data folder (replaces old file if exists)
        save_csv_to_file(csv_bytes, filename, template['name'])
        
        # Reset bytes stream position for download
        csv_bytes.seek(0)
        
        # Log the filename being sent
        print(f'[generate_csv] Sending file with filename: {filename}')
        
        response = send_file(
            csv_bytes,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
        # Ensure Content-Disposition header is set correctly
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== Results Endpoints ====================

@app.route('/api/results/upload', methods=['POST'])
def upload_result():
    """Upload a new result CSV file"""
    try:
        # Check if file and template_id are provided
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        template_id = request.form.get('template_id')
        if not template_id:
            return jsonify({'error': 'template_id is required'}), 400
        
        try:
            template_id = int(template_id)
        except ValueError:
            return jsonify({'error': 'template_id must be an integer'}), 400
        
        # Validate template_id exists
        templates = read_templates()
        template = next((t for t in templates if t['id'] == template_id), None)
        if not template:
            return jsonify({'error': f'Template with id {template_id} not found'}), 404
        
        # Check if permutation file exists for template
        try:
            permutation_file_path = get_permutation_file_path_from_template_id(template_id)
            if not permutation_file_path.exists():
                return jsonify({
                    'error': f'Permutation file not found for template. Please generate permutations first.'
                }), 400
        except ValueError as e:
            return jsonify({'error': str(e)}), 404
        
        # Validate CSV file
        is_valid, errors = validate_result_csv(file, template_id)
        if not is_valid:
            return jsonify({
                'error': 'CSV validation failed',
                'details': errors
            }), 400
        
        # Generate result_id and timestamp
        result_id = get_next_result_id()
        upload_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Save CSV file
        filename = save_result_csv(file, result_id)
        
        # Create metadata entry with status 'processing'
        metadata = read_results_metadata()
        metadata.append({
            'id': result_id,
            'filename': filename,
            'template_id': template_id,
            'upload_date': upload_date,
            'status': 'processing',
            'error_message': ''
        })
        write_results_metadata(metadata)
        
        return jsonify({
            'id': result_id,
            'filename': filename,
            'template_id': template_id,
            'upload_date': upload_date,
            'status': 'processing'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/results', methods=['GET'])
def get_results():
    """Get all uploaded results"""
    try:
        metadata = read_results_metadata()
        templates = read_templates()
        
        # Create template lookup
        template_lookup = {t['id']: t['name'] for t in templates}
        
        # Enrich metadata with template_name
        results = []
        for result in metadata:
            template_name = template_lookup.get(result['template_id'], 'Unknown')
            results.append({
                'id': result['id'],
                'filename': result['filename'],
                'template_id': result['template_id'],
                'template_name': template_name,
                'upload_date': result['upload_date'],
                'status': result['status']
            })
        
        # Sort by upload_date (newest first)
        # Parse date string for sorting
        results.sort(key=lambda x: datetime.strptime(x['upload_date'], '%Y-%m-%d %H:%M:%S'), reverse=True)
        
        return jsonify(results), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/results/<int:result_id>', methods=['GET'])
def get_result(result_id):
    """Get a single result with computed KPIs"""
    try:
        metadata = read_results_metadata()
        result_meta = next((r for r in metadata if r['id'] == result_id), None)
        
        if not result_meta:
            return jsonify({'error': 'Result not found'}), 404
        
        status = result_meta['status']
        
        # If status is 'error', return error details
        if status == 'error':
            return jsonify({
                'status': 'error',
                'error_message': result_meta.get('error_message', 'Unknown error')
            }), 200
        
        # If status is 'processing' or 'ready', try to calculate KPIs
        # This will update status to 'ready' on success or 'error' on failure
        try:
            kpi_object = calculate_all_kpis(result_id)
            # If calculation succeeds, return the full result object
            return jsonify(kpi_object), 200
        except Exception as e:
            # If calculation fails, check if status should be updated to error
            # (calculate_all_kpis should have already updated it, but check anyway)
            metadata = read_results_metadata()
            result_meta = next((r for r in metadata if r['id'] == result_id), None)
            if result_meta and result_meta['status'] == 'error':
                return jsonify({
                    'status': 'error',
                    'error_message': result_meta.get('error_message', str(e))
                }), 200
            else:
                # If status is still 'processing', return processing status
                # (calculation might be in progress or failed silently)
                return jsonify({'status': 'processing'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/results/<int:result_id>/compare/<int:result_id2>', methods=['GET'])
def compare_results(result_id, result_id2):
    """Compare two results"""
    try:
        # Validate both result_ids exist
        metadata = read_results_metadata()
        result1_meta = next((r for r in metadata if r['id'] == result_id), None)
        result2_meta = next((r for r in metadata if r['id'] == result_id2), None)
        
        if not result1_meta:
            return jsonify({'error': f'Result {result_id} not found'}), 404
        if not result2_meta:
            return jsonify({'error': f'Result {result_id2} not found'}), 404
        
        # Calculate KPIs for both results
        try:
            kpis1 = calculate_all_kpis(result_id)
            kpis2 = calculate_all_kpis(result_id2)
        except Exception as e:
            return jsonify({'error': f'Error calculating KPIs: {str(e)}'}), 500
        
        # Compute differences: absolute and percentage changes for all metrics
        def calculate_differences(val1, val2):
            """Calculate absolute and percentage differences"""
            if val2 == 0:
                return {'absolute': val1 - val2, 'percentage': 0.0 if val1 == 0 else 100.0}
            return {
                'absolute': val1 - val2,
                'percentage': ((val1 - val2) / val2) * 100
            }
        
        # Compare high-level KPIs
        high_level_diff = {
            'pass_rate': calculate_differences(
                kpis1['high_level']['pass_rate'],
                kpis2['high_level']['pass_rate']
            ),
            'zero_error_runs': calculate_differences(
                kpis1['high_level']['zero_error_runs'],
                kpis2['high_level']['zero_error_runs']
            ),
            'performance_speed': {
                'median': calculate_differences(
                    kpis1['high_level']['performance_speed']['median'],
                    kpis2['high_level']['performance_speed']['median']
                ),
                'average': calculate_differences(
                    kpis1['high_level']['performance_speed']['average'],
                    kpis2['high_level']['performance_speed']['average']
                ),
                'max': calculate_differences(
                    kpis1['high_level']['performance_speed']['max'],
                    kpis2['high_level']['performance_speed']['max']
                ),
                'min': calculate_differences(
                    kpis1['high_level']['performance_speed']['min'],
                    kpis2['high_level']['performance_speed']['min']
                )
            },
            'behavioral_efficiency': {
                'median_hitl_turns': calculate_differences(
                    kpis1['high_level']['behavioral_efficiency']['median_hitl_turns'],
                    kpis2['high_level']['behavioral_efficiency']['median_hitl_turns']
                ),
                'median_tool_calls': calculate_differences(
                    kpis1['high_level']['behavioral_efficiency']['median_tool_calls'],
                    kpis2['high_level']['behavioral_efficiency']['median_tool_calls']
                ),
                'median_react_agent_calls': calculate_differences(
                    kpis1['high_level']['behavioral_efficiency']['median_react_agent_calls'],
                    kpis2['high_level']['behavioral_efficiency']['median_react_agent_calls']
                ),
                'forbidden_tool_call_rate': calculate_differences(
                    kpis1['high_level']['behavioral_efficiency']['forbidden_tool_call_rate'],
                    kpis2['high_level']['behavioral_efficiency']['forbidden_tool_call_rate']
                )
            }
        }
        
        # Compare component-level KPIs
        # Get all unique component names from both results
        all_components = set(kpis1.get('components', {}).keys()) | set(kpis2.get('components', {}).keys())
        component_differences = {}
        
        for component_name in all_components:
            comp1 = kpis1.get('components', {}).get(component_name, {})
            comp2 = kpis2.get('components', {}).get(component_name, {})
            
            agg1 = comp1.get('aggregated', {})
            agg2 = comp2.get('aggregated', {})
            
            component_differences[component_name] = {
                'pass_rate': calculate_differences(
                    agg1.get('pass_rate', 0.0),
                    agg2.get('pass_rate', 0.0)
                ),
                'zero_error_runs': calculate_differences(
                    agg1.get('zero_error_runs', 0.0),
                    agg2.get('zero_error_runs', 0.0)
                ),
                'performance_speed': {
                    'median': calculate_differences(
                        agg1.get('performance_speed', {}).get('median', 0.0),
                        agg2.get('performance_speed', {}).get('median', 0.0)
                    ),
                    'average': calculate_differences(
                        agg1.get('performance_speed', {}).get('average', 0.0),
                        agg2.get('performance_speed', {}).get('average', 0.0)
                    )
                },
                'behavioral_efficiency': {
                    'median_hitl_turns': calculate_differences(
                        agg1.get('behavioral_efficiency', {}).get('median_hitl_turns', 0.0),
                        agg2.get('behavioral_efficiency', {}).get('median_hitl_turns', 0.0)
                    ),
                    'forbidden_tool_call_rate': calculate_differences(
                        agg1.get('behavioral_efficiency', {}).get('forbidden_tool_call_rate', 0.0),
                        agg2.get('behavioral_efficiency', {}).get('forbidden_tool_call_rate', 0.0)
                    )
                }
            }
        
        return jsonify({
            'result1': kpis1,
            'result2': kpis2,
            'differences': {
                'high_level': high_level_diff,
                'components': component_differences
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/results/<int:result_id>', methods=['DELETE'])
def delete_result_endpoint(result_id):
    """Delete a result"""
    try:
        success, error_message = delete_result(result_id)
        if not success:
            return jsonify({'error': error_message}), 404 if 'not found' in error_message.lower() else 500
        return jsonify({'message': 'Result deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)

