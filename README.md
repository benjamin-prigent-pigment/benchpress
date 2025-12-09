# Bench Set Generator

## Purpose of this coding project
This is a software that enables a user to build a large set of benchmarking prompts to test their AI agent.
The benchmarking prompts are meant to be used by an LLM in a LLM-in-the-loop situation where the LLM fakes a user and communicates directly with the Agent being tested.

## High level system
- The benchmarking prompts are strings of text in MD format.
- The benchmarking prompts are made of static text concatenated with "components". 
- The "components" are strings of text as well. 
- The components have variants. 
- The total number of permutations is calculated by multiplying the number of variants in each component.
- Example: Template "please create a GPT route from {{start city}} to {{end city}}" with 3 start city variants and 4 end city variants = 3 × 4 = 12 permutations.
- Example: If your prompt has 3 components with 4, 3, and 5 variants respectively, then the total number of permutations is 4 × 3 × 5 = 60.

## Frontend Features

### Core Features (First Set)

#### 1. Component Management
- **Create Component**: Form to create a new component with:
  - Component name (required, unique identifier)
  - Component description (optional, for documentation)
  - List of variants (each variant is a text string)
- **Component List View**: Display all created components a page called components
- **Edit Component**: Modify existing component name, description, or variants, in a modal from the component page.
- **Delete Component**: Remove a component (not possible if the component is used in a template already)
- **Component Variant Management**:
  - Add new variant to a component
  - Edit existing variant text
  - Delete variant

#### 2. Prompt Template Management
- **Template List View**: Display all created templates
- **Create Template**: Create a new benchmarking prompt template
- **Template Editor**: 
  - Simple textarea for markdown/static text input
  - Insert component placeholders into the template (e.g., `{{component_name}}`)
- **Preview area**: you can preview the template by selecting a component variant
- **Edit Template**: Modify template text and component usage
- **Delete Template**: Remove a template (with confirmation)
- **Permutation counter**: next to the text aread is a counter of all the permutation
- **Generate button**: generate CSV file of the permulation. see below

#### 3. Export Functionality
- **Export Button**: Generate and download the full set of permutations as CSV
- **CSV format**: 1 column, with all the permuation

#### 4. User Interface Elements
- **Navigation**: side nav with 2 buttons: templates and components
- **templates list page**: list all the templates, with a add button
- **templates item page**: shows the text area input, the number of permulation, and the download button
- **components list page**: lists all the components, you see a button to create a new component
- **components item page**: shows a component title, description, and variants. you can create new variants

#### 5. User flows for creating items
- **New tempalte**: steps: user names template, user clicks save. user is redirected to the new template page.
- **New component**: steps: user names component, then add a description, then adds at least 2 variants, then clicks save.
- **New variant**: steps: users enter new variant name, user clicks save.

## Backend Features

### Core API Endpoints (Python - Flask/FastAPI)

#### Component Management
- `GET /api/components` - List all components (read from `backend/data/components.csv`)
- `POST /api/components` - Create new component
  - Request body: `{ name: string, description: string, variants: string[] }`
  - Validation: name required, at least 2 variants required
  - Save to `backend/data/components.csv`
- `GET /api/components/:id` - Get component details by ID
- `PUT /api/components/:id` - Update component (name, description, or variants)
  - Update `backend/data/components.csv`
- `DELETE /api/components/:id` - Delete component
  - Validation: Check if component is used in any template (prevent deletion if used)
  - Remove from `backend/data/components.csv`

#### Variant Management (within Component)
- `POST /api/components/:id/variants` - Add new variant to a component
  - Request body: `{ variant: string }`
  - Update component in `backend/data/components.csv`
- `PUT /api/components/:id/variants/:variantId` - Edit existing variant
- `DELETE /api/components/:id/variants/:variantId` - Delete variant from component
  - Validation: Ensure component has at least 2 variants after deletion

#### Template Management
- `GET /api/templates` - List all templates (read from `backend/data/templates.csv`)
- `POST /api/templates` - Create new template
  - Request body: `{ name: string }`
  - Creates template with empty text initially
  - Save to `backend/data/templates.csv`
  - Returns template with ID for redirect
- `GET /api/templates/:id` - Get template details (name, text content)
- `PUT /api/templates/:id` - Update template text/content
  - Request body: `{ text: string }`
  - Update `backend/data/templates.csv`
- `DELETE /api/templates/:id` - Delete template
  - Remove from `backend/data/templates.csv`

#### Permutation & Export
- `GET /api/templates/:id/count` - Get permutation count for a template
  - Parse template text to find component placeholders (e.g., `{{component_name}}`)
  - Calculate total permutations: multiply variants from each referenced component
  - Returns: `{ count: number, breakdown: string }`
- `POST /api/templates/:id/generate` - Generate and download CSV file
  - Parse template and generate all permutations
  - Create CSV with columns: id, prompt, permutations
  - Save to `backend/data/` folder as `permutations_{templatename}.csv` (replaces old file if exists)
  - Return CSV file as download response

### Data Storage (File-Based)
All data stored in CSV files in `backend/data/` folder:

- **`backend/data/components.csv`**: 
  - Columns: `id`, `name`, `description`, `variants` (JSON array of variant strings)
  - Example row: `1,"start city","Starting location",["Paris","London","Berlin"]`

- **`backend/data/templates.csv`**: 
  - Columns: `id`, `name`, `text`
  - Example row: `1,"Route Template","please create a GPT route from {{start city}} to {{end city}}"`

- **`backend/data/permutations_{templatename}.csv`**:
  - Generated CSV files with permutations (one file per template)
  - Format: CSV with columns "id", "prompt", "permutations"
  - Old file is replaced when a new permutation is generated for the same template

- All CRUD operations read from and write to these CSV files
- No database required - fully file-based storage

## Technical Stack
- **Frontend**: React (simple UI for internal tool)
- **Backend**: Python (Flask or FastAPI)
- **Storage**: File-based (CSV files stored in `backend/data/` folder)
  - Components stored in `backend/data/components.csv`
  - Templates stored in `backend/data/templates.csv`
  - Exported permutations saved in `backend/data/` folder as `permutations_{templatename}.csv`

## Coding Todo
- [x] Set up React frontend project structure
- [x] Design and implement simple React UI components
- [x] Set up Python backend (Flask)
- [x] Create `backend/data/` folder structure
- [x] Initialize CSV files (`components.csv`, `templates.csv`) with headers
- [x] Implement CSV file handling utilities (read/write/update)
- [x] Implement component CRUD operations (CSV-based)
- [x] Implement variant management endpoints (add/edit/delete variants)
- [x] Implement template CRUD operations (CSV-based)
- [x] Build component placeholder parsing logic (extract `{{component_name}}` from template text)
- [x] Build permutation generation logic (Python backend)
- [x] Implement permutation counter endpoint
- [x] Create CSV export functionality (single column format)
- [x] Add validation (component name uniqueness, minimum 2 variants, prevent deletion if component used)
- [x] Add error handling