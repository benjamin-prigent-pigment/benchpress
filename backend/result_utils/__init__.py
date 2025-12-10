"""Result utilities package - modular utilities for results management

This package provides utilities for managing, parsing, validating, and analyzing
result CSV files. It is organized into modules:

- paths: File path utilities
- metadata: Metadata management (CRUD operations)
- csv_parser: CSV parsing and reading
- csv_validator: CSV validation
- calculations: KPI calculations with detailed mathematical documentation
- permutations: Permutation mapping utilities
- orchestrator: Main orchestration function for calculating all KPIs
"""

# Import all public functions for backward compatibility
from .paths import (
    get_permutation_file_path,
    get_permutation_file_path_from_template_id,
    RESULTS_DIR,
    RESULTS_METADATA_FILE
)

from .metadata import (
    read_results_metadata,
    write_results_metadata,
    get_next_result_id,
    get_result_status,
    delete_result
)

from .csv_parser import (
    parse_result_csv,
    save_result_csv,
    read_result_csv
)

from .csv_validator import (
    validate_result_csv
)

from .calculations import (
    calculate_high_level_kpis,
    calculate_component_kpis
)

from .permutations import (
    load_permutation_mapping
)

from .orchestrator import (
    calculate_all_kpis
)

__all__ = [
    # Paths
    'get_permutation_file_path',
    'get_permutation_file_path_from_template_id',
    'RESULTS_DIR',
    'RESULTS_METADATA_FILE',
    # Metadata
    'read_results_metadata',
    'write_results_metadata',
    'get_next_result_id',
    'get_result_status',
    'delete_result',
    # CSV Parser
    'parse_result_csv',
    'save_result_csv',
    'read_result_csv',
    # CSV Validator
    'validate_result_csv',
    # Calculations
    'calculate_high_level_kpis',
    'calculate_component_kpis',
    # Permutations
    'load_permutation_mapping',
    # Orchestrator
    'calculate_all_kpis',
]

