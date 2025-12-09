# New feature documentation

# User need
- Once the user has generated the benchmark set with this tool, they will need show the results somewhere.
- We have decided that the display and analysis of the tests will be stored on this project. 
- This feature will add a way to upload results and diplay them 

# User journey
1. In a new tab in the sidenav, the user can access a page called "results".
2. In the top right corner of the result list page in the header, they see a button that says: "upload a new test"
3. This button opens a modal that asks the user to upload a CSV of the results and to select an existing template. The system automatically uses the template's permutation file for validation. The user then clicks upload.
4. the user is redirected to the result item page.
4. The results are computing, so the user can see a loading state on the result item page
5. The results are ready, the user can see them.
6. The user can navigate back to the result list page and click on a button also on the top right corner that says "compare"
7. The compare feature enables them to compare two past results.

# Pages

## 1. Result list page: 
1.1 This page lists all the results uploaded in the past. 
1.2 The label of the card is composed of the date and time at wich the result file was uploaded combined with the template name.
1.3 users can click on the result list items
1.4 there is a button called "Compare results" that leads to the compare page.

## 2. Result item page: 
2.1 The page shows most important KPIs about one result. It helps understand of the results are good or bad.
2.2 This can be accessed from the result list page.
2.3 There is a list of charts and KPIs - the list goes as followed:

2.3.1 High level section at the top: 
2.3.1.1 Pass Rate (% of 1s in the test_array) for all rows
2.3.1.2 Zero-Error Runs (% of permutation_item_id where all tests passed on all runs, meaning test_array = all 1s).
2.3.1.3 Performance Speed: time_spent normal distribution chart - with mediam, average, max, min
2.3.1.4 Behavioral Efficiency: Median HITL Turns, Median Tool Calls, Median ReACT Agent Calls, Forbidden Tool Call Rate

2.3.2 For each component, there is a dedicated section, with tailored kpis and charts as well.
2.3.2.1 Pass Rate
2.3.2.2 Zero-Error Runs
2.3.2.3 Performance Speed
2.3.2.4 Behavioral Efficiency

## 3. Result compare page:
3.1 The top of the page has 2 drop downs. 
3.2 This page enable to compare two results.
3.3 The page is composed of the same components of the result item page.


# Frontend consideration
**Chart Library**: **Recharts** is recommended for this project:
   - Install: `npm install recharts`
   - Key components to use:
     - `<BarChart>` / `<Bar>` for histograms/distributions
     - `<LineChart>` / `<Line>` for trends (if needed)
     - `<ResponsiveContainer>` for responsive charts
     - Custom tooltips and legends for KPI displays

# Data storage

## Format of the result CSV

The CSV has always the same format. 
COLUMN 1: permutation_item_id - the ID from the experted permutation
COLUMN 2: run_id - there are multiple runs for the same permutation permutation_item_id, this is an integer. 
COLUMN 3: test_array - array bool values [0,0,0,0,1...]. The amount of items in the array is the amount of things tested, for that permutation_item. 0 means test failed, 1 means test successful.
COLUMN 4: HITL_turns_int - the number of times the fake user (the LLM passing as the user) interacted with the AI agent.
COLUMN 5: tool_call_int - the number of tool calls necessary to perform this task.
COLUMN 6: ReACT_agent_calls - the number of agent calls for this task
COLUMN 7: forbidden_tool_calls - number of wrong tool calls
COLUMN 8: time_spent - amount of time spent by the AI on the task

## Storage of the results

- Each time a user adds a new result, it will be stored in `backend/data/results/`
- Metadata about each result (id, template_id, upload_date) will be stored in `backend/data/results_metadata.csv`
- This storage enables listing all results, retrieving individual results, and comparing results 

# Backend features

## API Endpoints

### Results Management
- `POST /api/results/upload` - Upload a new result CSV file
  - Request: multipart/form-data with `file` (CSV) and `template_id` (integer)
  - Response: `{ id, filename, template_id, upload_date, status: 'processing' }`
  - Validates CSV format, validates permutation_item_id against template's permutation file, and saves to `backend/data/results/`
  - Creates metadata entry in `backend/data/results_metadata.csv`
  - Returns immediately (processing happens asynchronously or on-demand)
  - **Note**: The permutation file is automatically determined from `template_id` → `template_name` → `permutations_{template_name}.csv`

- `GET /api/results` - List all uploaded results
  - Response: `[{ id, filename, template_id, template_name, upload_date, status }]`
  - Sorted by upload_date (newest first)
  - Status can be: 'processing', 'ready', 'error'

- `GET /api/results/<result_id>` - Get a single result with computed KPIs
  - Response: Full result object with all KPIs and metrics
  - If still processing, returns `{ status: 'processing' }`
  - If ready, returns computed metrics (see KPI Calculation section)

- `GET /api/results/<result_id>/compare/<result_id2>` - Compare two results
  - Response: Comparison object with side-by-side metrics and differences
  - Same structure as single result but with arrays/objects for both results

## Data Storage Structure

### Result CSV Files
- Location: `backend/data/results/`
- Naming: `result_<result_id>_<timestamp>.csv` (e.g., `result_1_20251208_143022.csv`)
- Format: As specified in "Format of the result CSV" section above

### Permutation Export CSV Format
- Location: `backend/data/`
- Naming: `permutations_{template_name}.csv` (e.g., `permutations_Bench_Test_1.csv`)
- **Note**: Each template has exactly one permutation file (latest generation replaces the old one)
- Columns: `id` (permutation_item_id), `prompt` (final text), `permutations` (JSON array)
- The `permutations` column contains a JSON array mapping component names to variants used
- Example: `[{"persona": "You are a beginner modeler..."}, {"block_type": "Dimension"}, {"metadata": {"a": "name", "b": "new_block_name"}}]`
- This format enables mapping `permutation_item_id` → component variants for component-level analysis

### Results Metadata CSV
- Location: `backend/data/results_metadata.csv`
- Columns: `id, filename, template_id, upload_date, status, error_message`
- Purpose: Track all uploaded results, their associated templates, and processing status
- Example row: `1,result_1_20251208_143022.csv,1,2025-12-08 14:30:22,ready,`
- **Note**: The permutation file is automatically determined from `template_id` → `template_name` → `permutations_{template_name}.csv`

## CSV Parsing & Validation

### Validation Rules
1. **Required Columns**: Verify all 8 columns are present with correct names
2. **Data Types**:
   - `permutation_item_id`: string (matches format from permutation exports)
   - `run_id`: integer >= 1
   - `test_array`: valid JSON array of 0s and 1s (e.g., `[0,1,0,1]`)
   - `HITL_turns_int`: integer >= 0
   - `tool_call_int`: integer >= 0
   - `ReACT_agent_calls`: integer >= 0
   - `forbidden_tool_calls`: integer >= 0
   - `time_spent`: float >= 0 (seconds)
3. **Data Integrity**: 
   - Check that test_array values are only 0 or 1
   - Verify no negative values for numeric fields
   - Ensure permutation_item_id exists in the template's permutation file (`permutations_{template_name}.csv`)

### Parsing Function
- Parse CSV using Python's `csv` module
- Convert `test_array` from JSON string to Python list
- Store parsed data in memory or cache for KPI calculations
- Handle malformed CSV gracefully with clear error messages

## KPI Calculation Functions

### High-Level KPIs (All Rows)

1. **Pass Rate**
   - Formula: `(sum of all 1s in all test_arrays) / (total number of test items across all arrays)`
   - Implementation: Flatten all test_arrays, count 1s, divide by total length

2. **Zero-Error Runs**
   - Formula: `(count of permutation_item_id where ALL runs have test_array = all 1s) / (total unique permutation_item_ids)`
   - Implementation: Group by permutation_item_id, check if all runs for that ID have all 1s

3. **Performance Speed (time_spent)**
   - Calculate: median, average (mean), max, min
   - Distribution: Create histogram data for normal distribution chart
   - Data points: All time_spent values from all rows

4. **Behavioral Efficiency**
   - Median HITL Turns: `median(all HITL_turns_int values)`
   - Median Tool Calls: `median(all tool_call_int values)`
   - Median ReACT Agent Calls: `median(all ReACT_agent_calls values)`
   - Forbidden Tool Call Rate: `(sum of all forbidden_tool_calls) / (sum of all tool_call_int)`

### Component-Level KPIs

**Simplified Approach**: 
- Templates have a `components` column (JSON array) that directly lists which components are used (e.g., `["persona", "metadata", "block_type"]`)
- Read the template's `components` column to get the list of components to analyze
- Use the permutation export CSV to map `permutation_item_id` → component variants used
- For each component in the template's `components` array, filter result rows and calculate KPIs

**Implementation**:
1. Read the template from `backend/data/templates.csv` and parse the `components` column (JSON array of component names)
2. Determine the permutation file path: `backend/data/permutations_{template_name}.csv`
3. Read the permutation CSV and parse the `permutations` column (JSON) to create a lookup: `permutation_item_id` → `{ component_name: variant_used }`
4. For each component name in the template's `components` array:
   - Filter result rows where that component's variant matches (for each variant of that component)
   - Calculate same KPIs (Pass Rate, Zero-Error Runs, Performance Speed, Behavioral Efficiency) for each variant
   - Aggregate across all variants of the component for component-level summary

## File Management Utilities

### New Utility Functions Needed (in `utils.py` or new `results_utils.py`)

- `read_results_metadata()` - Read all results metadata
- `write_results_metadata(metadata)` - Write/update results metadata
- `save_result_csv(file, result_id)` - Save uploaded CSV to results folder
- `read_result_csv(result_id)` - Read and parse a result CSV file
- `validate_result_csv(csv_data)` - Validate CSV format and data
- `get_result_status(result_id)` - Check if result is ready or still processing
- `get_permutation_file_path(template_name)` - Get the path to a template's permutation file: `backend/data/permutations_{template_name}.csv`
- `get_permutation_file_path_from_template_id(template_id)` - Get permutation file path from template_id (reads template to get name, then calls above)

## Comparison Logic

### Comparison Endpoint Implementation

1. Load both result CSVs
2. Calculate KPIs for both results (reuse single result calculation)
3. Compute differences:
   - Absolute differences: `result1_value - result2_value`
   - Percentage changes: `((result1_value - result2_value) / result2_value) * 100`
4. Return structured comparison object:
   ```json
   {
     "result1": { /* full KPI object */ },
     "result2": { /* full KPI object */ },
     "differences": {
       "pass_rate": { "absolute": 0.05, "percentage": 5.2 },
       "zero_error_runs": { "absolute": 0.1, "percentage": 10.0 },
       // ... etc
     }
   }
   ```

## Error Handling

- **Invalid CSV format**: Return 400 with specific validation errors
- **Missing template**: Return 404 if template_id doesn't exist
- **Processing errors**: Store error_message in metadata, return status 'error'
- **Missing permutation file**: If `permutations_{template_name}.csv` not found, return error (needed for validation and component-level analysis)
- **File not found**: Return 404 for non-existent result_id

## Permutation ID Tracking & Validation

### The Challenge
- Permutation IDs are MD5 hashes generated from the final permutation text
- IDs are deterministic: same template + same components = same IDs
- **Problem**: If template text or component variants change, regenerating permutations will create new IDs
- **Solution**: Each template has one permutation file (`permutations_{template_name}.csv`). When uploading results, we automatically use the current permutation file for that template.

### Implementation Tasks

1. **Upload Endpoint**
   - User selects `template_id` when uploading results
   - System automatically determines permutation file: `template_id` → `template_name` → `permutations_{template_name}.csv`
   - No need for user to select which export file (there's only one per template)

2. **Validation Logic**
   - During CSV upload validation, read the template's permutation file from `backend/data/permutations_{template_name}.csv`
   - Extract all permutation IDs from the file (column 1: `id`)
   - Verify that all `permutation_item_id` values in the result CSV exist in the permutation file
   - Reject upload if any permutation_item_id is not found

3. **Component Mapping**
   - Read the template's `components` column from `backend/data/templates.csv` to get the list of components used
   - Read the permutation file: `backend/data/permutations_{template_name}.csv`
   - Parse the `permutations` column (JSON) to map `permutation_item_id` → component variants used
   - This enables component-level KPI analysis by filtering results by component variant

4. **Handle Missing Permutation Files**
   - If `permutations_{template_name}.csv` doesn't exist, return error during upload
   - User must generate permutations for the template first before uploading results

## Performance Considerations

- **Lazy Processing**: Calculate KPIs on-demand when `GET /api/results/<id>` is called (not during upload)
- **Caching**: Consider caching computed KPIs in memory or a separate cache file to avoid recalculating
- **Large Files**: For very large result CSVs, consider streaming/chunked processing
- **Async Processing**: If calculations are slow, consider background job processing with status updates
- **Permutation ID Lookup**: Cache the list of valid permutation IDs from permutation files to avoid re-reading on every validation

# Things to keep in mind while you build
- The compare page needs to not bug when there is no results uploaded yet. The dropdown should just show empty
- CSV validation should be strict - reject files that don't match the expected format
- **Permutation ID validation**: Must validate that all permutation_item_id values exist in the template's permutation file (`permutations_{template_name}.csv`)
- **Permutation file location**: Automatically determine from `template_id` → `template_name` → `backend/data/permutations_{template_name}.csv`
- **Component-level analysis**: Use template's `components` column to know which components to analyze, then use permutation file to map `permutation_item_id` → component variants
- Consider performance for large result files - may need pagination or lazy loading for charts
- Error states: handle cases where template's permutation file is missing (user must generate permutations first)
- Date/time formatting: ensure consistent format for upload_date display (consider timezone handling)


# Coding tasks

## Backend - Infrastructure & Utilities

- [x] Create `backend/data/results/` directory if it doesn't exist (in `init_csv_files()` or separate initialization)
- [x] Create `results_utils.py` file for results-specific utility functions
- [x] Implement `get_permutation_file_path(template_name)` - returns path to `backend/data/permutations_{template_name}.csv`
- [x] Implement `get_permutation_file_path_from_template_id(template_id)` - reads template to get name, then calls above
- [x] Implement `read_results_metadata()` - reads `backend/data/results_metadata.csv`, returns list of result metadata dicts
- [x] Implement `write_results_metadata(metadata)` - writes/updates `backend/data/results_metadata.csv`
- [x] Implement `get_next_result_id()` - gets next available result ID from metadata
- [x] Implement `save_result_csv(file, result_id)` - saves uploaded CSV to `backend/data/results/result_{id}_{timestamp}.csv`
- [x] Implement `read_result_csv(result_id)` - reads and parses result CSV file, returns list of dicts
- [x] Implement `validate_result_csv(csv_data, template_id)` - validates CSV format and data integrity:
  - [x] Check all 8 required columns exist with correct names
  - [x] Validate data types (permutation_item_id: string, run_id: int >= 1, test_array: JSON array of 0s/1s, etc.)
  - [x] Validate data integrity (test_array only 0s/1s, no negative numbers)
  - [x] Validate permutation_item_id exists in template's permutation file
  - [x] Return tuple: (is_valid: bool, errors: list[str])
- [x] Implement `get_result_status(result_id)` - checks metadata for result status ('processing', 'ready', 'error')

## Backend - CSV Parsing & Data Processing

- [x] Implement CSV parser function that:
  - [x] Uses Python's `csv` module to parse uploaded file
  - [x] Converts `test_array` from JSON string to Python list
  - [x] Handles malformed CSV with clear error messages
  - [x] Returns structured data: list of dicts with all columns

## Backend - KPI Calculation Functions

- [x] Create `calculate_high_level_kpis(result_data)` function:
  - [x] Calculate Pass Rate: (sum of all 1s) / (total test items)
  - [x] Calculate Zero-Error Runs: (permutation_item_ids with all runs passing) / (total unique permutation_item_ids)
  - [x] Calculate Performance Speed stats: median, average, max, min of time_spent
  - [x] Create histogram data for time_spent distribution (for chart)
  - [x] Calculate Behavioral Efficiency: median HITL_turns_int, median tool_call_int, median ReACT_agent_calls, forbidden_tool_call_rate
  - [x] Return structured dict with all KPIs
- [x] Create `load_permutation_mapping(template_id)` function:
  - [x] Reads template to get template_name and components list
  - [x] Reads permutation file: `permutations_{template_name}.csv`
  - [x] Parses `permutations` column (JSON) to create lookup: `permutation_item_id` → `{component_name: variant_used}`
  - [x] Returns tuple: (permutation_lookup: dict, components: list[str])
- [x] Create `calculate_component_kpis(result_data, component_name, permutation_lookup)` function:
  - [x] Filters result rows by component variant
  - [x] Calculates same KPIs as high-level (Pass Rate, Zero-Error Runs, Performance Speed, Behavioral Efficiency) for each variant
  - [x] Aggregates across all variants for component-level summary
  - [x] Returns dict with component-level KPIs organized by variant
- [x] Create `calculate_all_kpis(result_id)` function:
  - [x] Loads result CSV and metadata
  - [x] Calculates high-level KPIs
  - [x] Loads permutation mapping
  - [x] For each component in template, calculates component-level KPIs
  - [x] Returns complete KPI object with high-level and component-level metrics
  - [x] Updates metadata status to 'ready' on success, 'error' on failure

## Backend - API Endpoints

- [x] Implement `POST /api/results/upload` endpoint:
  - [x] Accept multipart/form-data with `file` (CSV) and `template_id` (integer)
  - [x] Validate template_id exists
  - [x] Check if permutation file exists for template (error if missing)
  - [x] Parse and validate CSV file
  - [x] Generate result_id and timestamp
  - [x] Save CSV file to `backend/data/results/`
  - [x] Create metadata entry with status 'processing'
  - [x] Return response: `{id, filename, template_id, upload_date, status: 'processing'}`
- [x] Implement `GET /api/results` endpoint:
  - [x] Read all results metadata
  - [x] Enrich with template_name from templates.csv
  - [x] Sort by upload_date (newest first)
  - [x] Return list: `[{id, filename, template_id, template_name, upload_date, status}]`
- [x] Implement `GET /api/results/<result_id>` endpoint:
  - [x] Check if result exists (404 if not)
  - [x] If status is 'processing', return `{status: 'processing'}`
  - [x] If status is 'error', return error details
  - [x] If status is 'ready', calculate KPIs (or load from cache) and return full result object
  - [x] If status is 'processing' but KPIs not calculated yet, calculate them and update status
- [x] Implement `GET /api/results/<result_id>/compare/<result_id2>` endpoint:
  - [x] Validate both result_ids exist
  - [x] Calculate KPIs for both results (reuse `calculate_all_kpis`)
  - [x] Compute differences: absolute and percentage changes for all metrics
  - [x] Return comparison object with both results and differences

## Frontend - Infrastructure

- [x] Install Recharts: `npm install recharts` in frontend directory
- [x] Add "Results" route to frontend router (check existing routing setup)
- [x] Add "Results" navigation item to SideNav component
- [x] Create `frontend/src/utils/resultsAPI.js` with API functions:
  - [x] `uploadResult(file, templateId)` - POST to `/api/results/upload`
  - [x] `getAllResults()` - GET `/api/results`
  - [x] `getResult(resultId)` - GET `/api/results/<id>`
  - [x] `compareResults(resultId1, resultId2)` - GET `/api/results/<id1>/compare/<id2>`
- [x] Create `frontend/src/hooks/useResults.js` hook for results data management
- [x] Create `frontend/src/hooks/useResultUpload.js` hook for upload functionality

## Frontend - Results List Page

- [x] Create `frontend/src/pages/ResultsList.jsx` component:
  - [x] Fetch and display all results using `getAllResults()`
  - [x] Show loading state while fetching
  - [x] Display results as cards with: date/time + template name as label
  - [x] Make cards clickable to navigate to result item page
  - [x] Add "Upload a new test" button in header (top right)
  - [x] Add "Compare results" button in header (top right) that navigates to compare page
  - [x] Handle empty state (no results uploaded yet)
- [x] Create `frontend/src/pages/ResultsList.css` for styling
- [x] Style result cards to match existing design patterns (similar to TemplatesList/ComponentsList)

## Frontend - Upload Modal

- [x] Create `frontend/src/components/ResultUploadModal.jsx` component:
  - [x] File input for CSV upload
  - [x] Dropdown/select for template selection (fetch from templates API)
  - [x] Upload button
  - [x] Loading state during upload
  - [x] Error handling and display
  - [x] On success: close modal and navigate to result item page
- [x] Create `frontend/src/components/ResultUploadModal.css` for styling
- [x] Integrate modal into ResultsList page (opens when "Upload a new test" clicked)

## Frontend - Result Item Page

- [x] Create `frontend/src/pages/ResultItem.jsx` component:
  - [x] Fetch result data using `getResult(resultId)`
  - [x] Show loading state if status is 'processing'
  - [x] Show error state if status is 'error'
  - [x] Display high-level KPIs section:
    - [x] Pass Rate (percentage display)
    - [x] Zero-Error Runs (percentage display)
    - [x] Performance Speed: time_spent distribution chart (BarChart from Recharts) with median, avg, max, min displayed
    - [x] Behavioral Efficiency: display median HITL Turns, median Tool Calls, median ReACT Calls, Forbidden Tool Call Rate
  - [x] Display component-level sections (one per component):
    - [x] Same KPIs as high-level but filtered by component variant
    - [x] Charts for each component variant
  - [x] Handle case where result is still processing (polling or refresh button)
- [x] Create `frontend/src/pages/ResultItem.css` for styling
- [x] Create chart components (or inline in ResultItem):
  - [x] `TimeSpentDistributionChart` - BarChart showing time_spent distribution
  - [x] Reusable chart components for component-level charts

## Frontend - Compare Page

- [ ] Create `frontend/src/pages/CompareResults.jsx` component:
  - [ ] Two dropdowns at top for selecting results to compare
  - [ ] Fetch available results for dropdowns (handle empty state gracefully)
  - [ ] Fetch comparison data when both results selected
  - [ ] Display side-by-side comparison of KPIs
  - [ ] Show differences (absolute and percentage) for each metric
  - [ ] Reuse chart components from ResultItem but show both results
  - [ ] Handle loading and error states
- [ ] Create `frontend/src/pages/CompareResults.css` for styling

## Frontend - Chart Components

- [ ] Create `frontend/src/components/charts/TimeSpentDistributionChart.jsx`:
  - [ ] Uses Recharts BarChart
  - [ ] Displays histogram of time_spent values
  - [ ] Shows median, average, max, min as annotations or in tooltip
  - [ ] Responsive container
- [ ] Create `frontend/src/components/charts/KPICard.jsx`:
  - [ ] Reusable component for displaying KPI metrics (Pass Rate, Zero-Error Runs, etc.)
  - [ ] Shows label, value, and optional comparison indicator
- [ ] Create `frontend/src/components/charts/BehavioralEfficiencyCard.jsx`:
  - [ ] Displays all behavioral efficiency metrics in a card format

## Testing & Polish

- [ ] Test CSV upload with valid file
- [ ] Test CSV upload with invalid format (missing columns, wrong types, etc.)
- [ ] Test CSV upload with permutation_item_id that doesn't exist in permutation file
- [ ] Test result list page with no results
- [ ] Test result item page with processing status (loading state)
- [ ] Test result item page with error status
- [ ] Test compare page with no results (empty dropdowns)
- [ ] Test compare page with two results selected
- [ ] Test navigation between pages
- [ ] Test date/time formatting consistency
- [ ] Verify charts render correctly with sample data
- [ ] Test with large result files (performance)
- [ ] Add error boundaries for graceful error handling
- [ ] Ensure responsive design works on mobile/tablet