from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
import numpy as np
from io import StringIO, BytesIO
import tempfile
import os

app = FastAPI(
    title="TerraByte API",
    description="Wildlife Corridor Planning Backend",
    version="1.0.0"
)

# CORS - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class AnalyzeRequest(BaseModel):
    project_id: str
    dataset_id: str
    analysis_type: str = "full"

class CorridorRequest(BaseModel):
    project_id: str
    name: str
    geojson_data: Dict[str, Any]

class ReportRequest(BaseModel):
    project_id: str

class AnalysisResult(BaseModel):
    id: str
    project_id: str
    analysis_type: str
    results: Dict[str, Any]
    explanations: Dict[str, str]

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "terrabyte-api"}

# Upload GIS Data
@app.post("/api/upload-gis")
async def upload_gis(
    file: UploadFile = File(...),
    project_id: str = Form(...)
):
    """Upload and process GIS files (GeoJSON, CSV, Shapefile)"""
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        gdf = None
        
        if filename.endswith('.geojson') or filename.endswith('.json'):
            # Parse GeoJSON
            geojson = json.loads(content.decode('utf-8'))
            gdf = gpd.GeoDataFrame.from_features(geojson['features'])
            
        elif filename.endswith('.csv'):
            # Parse CSV with coordinates
            df = pd.read_csv(StringIO(content.decode('utf-8')))
            
            # Find lat/lng columns
            lat_col = next((c for c in df.columns if c.lower() in ['latitude', 'lat', 'y']), None)
            lng_col = next((c for c in df.columns if c.lower() in ['longitude', 'lng', 'lon', 'long', 'x']), None)
            
            if lat_col and lng_col:
                from shapely.geometry import Point
                geometry = [Point(xy) for xy in zip(df[lng_col], df[lat_col])]
                gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")
            else:
                raise HTTPException(400, "CSV must have latitude/longitude columns")
                
        elif filename.endswith('.shp') or filename.endswith('.zip'):
            # Handle Shapefile (needs temp file)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.zip' if filename.endswith('.zip') else '.shp') as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            
            try:
                gdf = gpd.read_file(tmp_path)
            finally:
                os.unlink(tmp_path)
        else:
            raise HTTPException(400, f"Unsupported file type: {filename}")
        
        if gdf is None or len(gdf) == 0:
            raise HTTPException(400, "No valid features found in file")
        
        # Convert to GeoJSON for response
        geojson_output = json.loads(gdf.to_json())
        
        # Calculate basic stats
        stats = {
            "feature_count": len(gdf),
            "geometry_types": gdf.geometry.geom_type.unique().tolist(),
            "columns": list(gdf.columns),
            "crs": str(gdf.crs) if gdf.crs else "Unknown"
        }
        
        return {
            "success": True,
            "project_id": project_id,
            "filename": file.filename,
            "stats": stats,
            "geojson": geojson_output
        }
        
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON format")
    except Exception as e:
        raise HTTPException(500, f"Processing error: {str(e)}")

# Analyze Data
@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_data(request: AnalyzeRequest):
    """Perform GIS analysis on uploaded data"""
    try:
        # In a real implementation, you would fetch the dataset from database
        # For now, we return mock analysis results
        
        results = {
            "species_summary": {
                "total_sightings": 50,
                "species_breakdown": {
                    "Tiger": 12,
                    "Elephant": 18,
                    "Leopard": 8,
                    "Deer": 12
                },
                "area_covered_sqkm": 125.5
            },
            "fragmentation": {
                "patch_count": 5,
                "avg_patch_size_sqkm": 25.1,
                "fragmentation_index": 0.42,
                "fragmentation_level": "Moderate"
            },
            "connectivity": {
                "score": 68,
                "connections": [
                    {"from": "Northern Reserve", "to": "Central Sanctuary", "quality": "Good"},
                    {"from": "Central Sanctuary", "to": "Southern Fragment", "quality": "Moderate"},
                    {"from": "Southern Fragment", "to": "Eastern Grassland", "quality": "Poor"}
                ]
            },
            "risk_zones": [
                {"name": "Highway NH-44 Crossing", "type": "road_crossing", "risk_level": "High", "location": [77.3, 28.58]},
                {"name": "Railway Junction", "type": "railway_crossing", "risk_level": "High", "location": [77.4, 28.65]},
                {"name": "Agricultural Expansion", "type": "land_use_change", "risk_level": "Medium", "location": [77.5, 28.52]}
            ],
            "recommendations": [
                {"action": "Build wildlife underpass", "priority": "High", "description": "Install underpass at Highway NH-44 km 45 to allow safe animal crossing"},
                {"action": "Establish buffer zone", "priority": "High", "description": "Create 500m buffer along the North-Central corridor"},
                {"action": "Restore habitat connectivity", "priority": "Medium", "description": "Plant native vegetation to connect Southern Fragment to Central Sanctuary"},
                {"action": "Install wildlife fencing", "priority": "Medium", "description": "Fence railway line between km 12-18 with escape gaps"},
                {"action": "Community engagement", "priority": "Low", "description": "Work with local communities on crop protection measures"}
            ]
        }
        
        explanations = {
            "overview": f"Your dataset contains wildlife observations across a 125.5 sq.km study area. We identified 4 species with a total of 50 sightings, with Elephants being the most frequently observed (36%).",
            "fragmentation": "We identified 5 distinct habitat patches with an average size of 25.1 sq.km. The fragmentation index of 0.42 indicates moderate fragmentation. This means wildlife populations may face some challenges in moving between habitat patches, but the situation is manageable with targeted interventions.",
            "connectivity": "The connectivity score of 68/100 suggests moderate connectivity between habitat patches. The northern and central areas are well connected, but connectivity to southern and eastern patches needs improvement. Wildlife corridor establishment would significantly improve gene flow between populations.",
            "risks": "We identified 3 high-priority risk zones: 1) Highway NH-44 crossing poses the greatest threat due to heavy traffic, 2) Railway junction has recorded wildlife mortality incidents, 3) Agricultural expansion is gradually encroaching on the eastern habitat patch.",
            "recommendations": "Based on our analysis, we recommend prioritizing the highway underpass construction as it will have the greatest impact on reducing wildlife mortality. The buffer zone establishment should follow, providing safe passage for animals moving between the northern and central reserves."
        }
        
        return AnalysisResult(
            id=f"analysis_{request.project_id}_{request.dataset_id}",
            project_id=request.project_id,
            analysis_type=request.analysis_type,
            results=results,
            explanations=explanations
        )
        
    except Exception as e:
        raise HTTPException(500, f"Analysis error: {str(e)}")

# Save Corridor Design
@app.post("/api/corridor")
async def save_corridor(request: CorridorRequest):
    """Save a corridor design"""
    try:
        # Validate GeoJSON
        geojson = request.geojson_data
        if 'type' not in geojson:
            raise HTTPException(400, "Invalid GeoJSON: missing type")
        
        # In production, save to database
        corridor_id = f"corridor_{request.project_id}_{hash(request.name) % 10000}"
        
        return {
            "success": True,
            "id": corridor_id,
            "name": request.name,
            "project_id": request.project_id
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error saving corridor: {str(e)}")

# Generate Report
@app.post("/api/report")
async def generate_report(request: ReportRequest):
    """Generate a PDF report"""
    try:
        # In production, this would:
        # 1. Fetch all project data from database
        # 2. Generate PDF using reportlab
        # 3. Upload to storage
        # 4. Return download URL
        
        report_id = f"report_{request.project_id}_{int(np.random.random() * 10000)}"
        
        return {
            "success": True,
            "id": report_id,
            "title": f"TerraByte Analysis Report",
            "project_id": request.project_id,
            "pdf_url": None,  # Would be actual URL in production
            "report_data": {
                "generated_at": "2024-01-30T12:00:00Z",
                "sections": ["overview", "fragmentation", "connectivity", "risks", "recommendations"]
            }
        }
        
    except Exception as e:
        raise HTTPException(500, f"Report generation error: {str(e)}")

# Run with: uvicorn app.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
