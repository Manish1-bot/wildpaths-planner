# TerraByte Python Backend

This is the FastAPI backend for the TerraByte Wildlife Corridor Planning System.
You need to deploy this separately from the Lovable frontend.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/terrabyte"
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-key"
```

4. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `POST /api/upload-gis` - Upload GeoJSON/Shapefile files
- `POST /api/analyze` - Perform GIS analysis
- `GET /api/projects` - Get user projects
- `POST /api/corridor` - Save corridor design
- `POST /api/report` - Generate PDF report
- `GET /health` - Health check

## Deployment Options

1. **Render.com** - Easy Python deployment
2. **Railway.app** - Simple container deployment
3. **Heroku** - Classic PaaS option
4. **DigitalOcean App Platform** - Managed deployment
5. **AWS Lambda + API Gateway** - Serverless option

## After Deployment

Set the `PYTHON_API_URL` secret in your Lovable project to your deployed API URL.
