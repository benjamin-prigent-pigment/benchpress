# Data Folder Structure

This folder contains all the data files used by the Bench Set Generator application. The application automatically creates these files with proper headers when first run, so you don't need to manually create them.

## Auto-Initialization

When you first start the application, it will automatically:
- Create the `data/` directory if it doesn't exist
- Create the `results/` subdirectory
- Initialize all CSV files with proper headers if they don't exist

You can start using the application immediately - empty files will be created automatically.

## File Structure

### 1. `components.csv`

Stores component definitions used in templates. Components are reusable variables that can be inserted into templates using the `{{component_name}}` syntax.

**Columns:**
- `id` (integer): Unique identifier for the component
- `name` (string): Component name (used in templates as `{{name}}`)
- `description` (string): Human-readable description
- `variants` (JSON array): Array of possible values for this component

**Component Types:**

**Regular Components:**
Variants are an array of strings. Example:
```csv
id,name,description,variants
1,block_type,The types of blocks,"[""Dimension"", ""Metric"", ""Transaction"", ""Folder"", ""Table""]"
2,persona,defining the persona of the user,"[""You are a beginner modeler at Pigment."", ""You are a senior modeler at Pigment.""]"
```

**Split Components:**
Variants are an array of objects with multiple parts. Used when you need to reference different parts of a component (e.g., `{{metadata/a}}` and `{{metadata/b}}`). Example:
```csv
id,name,description,variants
4,metadata,the metadata of the change being done,"[{""a"": ""name"", ""b"": ""new_block_name""}, {""a"": ""description"", ""b"": ""this is a new block description for this block""}, {""a"": ""folder_path"", ""b"": ""allblocks/new""}]"
```

### 2. `templates.csv`

Stores template definitions. Templates are text prompts that contain placeholders for components (e.g., `{{component_name}}`).

**Columns:**
- `id` (integer): Unique identifier for the template
- `name` (string): Template name
- `text` (string): Template text with component placeholders
- `components` (JSON array): Array of component names used in this template (auto-populated)

**Example:**
```csv
id,name,text,components
1,Bench Test 1,"Here is your persona: {{persona}}. 

Please take the {{block_type}} named --name-- and go update the {{metadata/a}}.

The new value is {{metadata/b}}. 

The final result you want is: {{end_result}}.","[""end_result"", ""block_type"", ""persona"", ""metadata""]"
```

**Placeholder Syntax:**
- Regular component: `{{component_name}}`
- Split component part: `{{component_name/part_name}}` (e.g., `{{metadata/a}}`)

### 3. `permutations_{template_name}.csv`

Generated files containing all permutations for a specific template. One file is created per template when you generate permutations.

**Columns:**
- `id` (string): Unique permutation ID (hash)
- `prompt` (string): Final prompt text with all placeholders replaced
- `permutations` (JSON array): Array mapping component names to their selected variants

**Example:**
```csv
id,prompt,permutations
889d5ead4b86607ce51e7687707f607d,"Here is your persona: You are a beginner modeler at Pigment. 

Please take the Dimension named --name-- and go update the name.

The new value is new_block_name. 

The final result you want is: {         ""block_type"": ""dimension"",         ""block_name"": ""country"",         ""block_folder"": ""default"",         ""properties"": []       }.",[{"persona": "You are a beginner modeler at Pigment."}, {"block_type": "Dimension"}, {"metadata": {"a": "name", "b": "new_block_name"}}]
```

**Note:** Each template has exactly one permutation file. Generating new permutations for the same template replaces the existing file.

### 4. `results/` Directory

Contains uploaded result CSV files from benchmark test runs. Files are automatically named with the pattern: `result_{id}_{timestamp}.csv`

**Result CSV Format:**

Each result CSV file contains test run data with the following columns:

- `permutation_item_id` (string): ID from the permutation file (matches `id` in `permutations_*.csv`)
- `run_id` (integer): Run number for this permutation (multiple runs per permutation)
- `permutation_object` (JSON array, optional): Component mappings for this permutation
- `test_array` (JSON array): Array of boolean values `[0,1,0,1,...]` where:
  - `0` = test failed
  - `1` = test passed
  - Length indicates number of tests performed
- `HITL_turns_int` (integer): Number of human-in-the-loop interactions
- `tool_call_int` (integer): Number of tool calls made
- `ReACT_agent_calls` (integer): Number of ReACT agent calls
- `forbidden_tool_calls` (integer): Number of incorrect/forbidden tool calls
- `time_spent` (float): Time spent on task in seconds

**Example:**
```csv
permutation_item_id,run_id,permutation_object,test_array,HITL_turns_int,tool_call_int,ReACT_agent_calls,forbidden_tool_calls,time_spent
abea7a1fb580f6708c3f0c521139d68b,1,"[{""persona"": ""You are a beginner modeler at Pigment.""}, {""block_type"": ""Dimension""}, {""metadata"": {""a"": ""name"", ""b"": ""new_block_name""}}]","[1,0,1,1,0,1]",2,2,3,0,19.12
abea7a1fb580f6708c3f0c521139d68b,2,"[{""persona"": ""You are a beginner modeler at Pigment.""}, {""block_type"": ""Dimension""}, {""metadata"": {""a"": ""name"", ""b"": ""new_block_name""}}]","[1,1,1,1,1]",2,4,4,0,25.82
```

### 5. `results_metadata.csv`

Tracks metadata about all uploaded result files.

**Columns:**
- `id` (integer): Unique result ID
- `filename` (string): Name of the result CSV file in `results/` directory
- `template_id` (integer): ID of the template this result is associated with
- `upload_date` (string): Timestamp when the result was uploaded (format: `YYYY-MM-DD HH:MM:SS`)
- `status` (string): Processing status (`processing`, `ready`, `error`)
- `error_message` (string): Error message if status is `error` (empty otherwise)

**Example:**
```csv
id,filename,template_id,upload_date,status,error_message
2,result_2_20251209_124554.csv,1,2025-12-09 12:45:54,ready,
3,result_3_20251209_125206.csv,1,2025-12-09 12:52:06,ready,
```

## Data Flow

1. **Create Components** → Stored in `components.csv`
2. **Create Templates** → Stored in `templates.csv` (references components)
3. **Generate Permutations** → Creates `permutations_{template_name}.csv`
4. **Upload Results** → Saves to `results/result_{id}_{timestamp}.csv` and updates `results_metadata.csv`
5. **View Analytics** → Application reads from result files and calculates KPIs

## Important Notes

- **JSON Formatting**: All JSON fields in CSV files must be properly escaped. The application handles this automatically when writing files.
- **File Encoding**: All files use UTF-8 encoding.
- **ID Management**: IDs are auto-incremented. Don't manually edit IDs unless you know what you're doing.
- **Data Integrity**: The application validates data when reading/writing. Invalid data will be rejected with error messages.

## Best Practices

1. **Backup**: Regularly backup your data folder if you have important test results
2. **Version Control**: This folder is excluded from Git by default (see `.gitignore`) - each user maintains their own data
3. **Naming**: Use descriptive names for components and templates
4. **Cleanup**: Periodically remove old result files if storage becomes an issue
5. **Validation**: Always validate your CSV files before uploading results

## Troubleshooting

- **Missing Files**: If files are missing, restart the application - they will be auto-created
- **Corrupted Data**: If a CSV file is corrupted, delete it and let the application recreate it (you'll lose that data)
- **Encoding Issues**: Ensure all CSV files are saved with UTF-8 encoding
- **JSON Errors**: Check that JSON arrays/objects in CSV cells are properly formatted and escaped

