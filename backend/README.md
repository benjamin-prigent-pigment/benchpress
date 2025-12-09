# Backend API

Flask-based REST API for the Bench Set Generator.

## Setup

1. Create and activate virtual environment (if not already done):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Components
- `GET /api/components` - List all components
- `POST /api/components` - Create new component
- `GET /api/components/:id` - Get component by ID
- `PUT /api/components/:id` - Update component
- `DELETE /api/components/:id` - Delete component

### Variants
- `POST /api/components/:id/variants` - Add variant to component
- `PUT /api/components/:id/variants/:variant_id` - Update variant
- `DELETE /api/components/:id/variants/:variant_id` - Delete variant

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create new template
- `GET /api/templates/:id` - Get template by ID
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Permutations
- `GET /api/templates/:id/count` - Get permutation count
- `POST /api/templates/:id/generate` - Generate and download CSV

## Data Storage

All data is stored in CSV files in the `data/` folder:
- `data/components.csv` - Component data
- `data/templates.csv` - Template data
- `data/permutations_{templatename}.csv` - Generated permutation CSV files (one per template, replaced on each generation)

