

# TerraByte - Geospatial Wildlife Corridor Planning System
## Complete Development Plan

---

## 🎯 Project Overview

A production-ready GIS platform for wildlife conservation planning, featuring interactive map visualization, corridor design tools, geospatial file handling, and report generation.

**Architecture**: React frontend (Lovable) + Supabase (auth, database, storage) + External Python API (for complex GIS processing)

---

## 📦 Phase 1: Foundation & Authentication

### 1.1 Project Setup & Design System
- Configure the conservation-themed color palette (forest greens, earth tones, conservation blues)
- Set up Roboto/Lato typography
- Create reusable UI components (glassmorphic cards, buttons, forms)

### 1.2 Authentication System with Supabase
- Login & registration pages with modern glassmorphic design
- Email/password authentication
- Role-based access control with 4 roles:
  - **Planner** - Full access to all tools
  - **NGO** - View + basic editing
  - **Researcher** - View + analysis tools
  - **Admin** - System management
- Protected routes based on user roles
- Password reset functionality

### 1.3 Database Schema
- `profiles` table (linked to auth.users)
- `user_roles` table with secure role management
- `projects` table for organizing work
- `datasets` table for tracking uploaded files
- `corridors` table for saving corridor designs

---

## 📦 Phase 2: Dashboard & Project Management

### 2.1 Main Dashboard
- Welcome section with user stats
- Project cards grid with filtering
- Recent activity feed
- Quick action buttons (upload data, new project, recent analysis)
- Storage usage indicator

### 2.2 Project Management
- Create/edit/delete projects
- Project metadata (name, region, species, status)
- Project-based file organization
- Team collaboration (for multi-user scenarios)

### 2.3 About System Page
- Hero section with system branding
- Features overview with icons
- Use cases for different user roles
- Technology stack display

---

## 📦 Phase 3: Map Visualization Platform

### 3.1 Interactive Map Interface
- MapLibre GL JS with OpenStreetMap tiles
- Full-screen responsive map layout
- Zoom controls and basemap selector (satellite, terrain, streets)
- Coordinates display and search bar

### 3.2 Layer Management System
- Layer panel with visibility toggles
- Layer opacity controls
- Layer ordering (drag and drop)
- Layer grouping (Development, Habitat, Wildlife, Analysis)
- Auto-generated legends

### 3.3 Sample Data Integration
- Pre-loaded demo GIS data:
  - Sample forest cover polygons
  - Road network lines
  - Protected area boundaries
  - Urban development zones
  - Sample wildlife sighting points

### 3.4 Measurement Tools
- Distance measurement (line tool)
- Area measurement (polygon tool)
- Display in metric/imperial units

---

## 📦 Phase 4: GIS File Upload & Processing

### 4.1 Upload Interface
- Drag-and-drop file zone
- Supported formats display (GeoJSON, Shapefile, KML, GPX, CSV)
- Upload progress with file validation
- File size limits and format checking

### 4.2 File Processing (Client-side with Turf.js)
- Parse GeoJSON files directly in browser
- Convert coordinates to standard CRS
- Extract metadata (bounds, feature count, geometry types)
- Generate preview thumbnails

### 4.3 Dataset Management
- Uploaded files list per project
- Metadata editor (region, species, ecosystem type)
- Preview on map button
- Delete and version history
- Supabase Storage for file persistence

### 4.4 Python Backend API Structure (Reference)
- Document the expected API endpoints:
  - `POST /api/upload` - file upload & parsing
  - `POST /api/analyze/fragmentation` - habitat analysis
  - `POST /api/analyze/connectivity` - corridor analysis
  - `GET /api/datasets/{id}` - retrieve processed data
- Mock these endpoints initially for frontend development

---

## 📦 Phase 5: Corridor Design Studio

### 5.1 Drawing Tools
- Corridor drawing tool (polyline with snapping)
- Freehand drawing option
- Vertex editing (add, move, delete points)
- Smooth path option (Bezier curves)

### 5.2 Buffer Zone Creation
- Buffer zone tool with adjustable distance
- Visual buffer preview before applying
- Symmetric and asymmetric buffer options
- Multi-ring buffer generation

### 5.3 Infrastructure Markers
- Marker palette for placing:
  - Overpasses (bridge icons)
  - Underpasses (tunnel icons)
  - Fencing markers
  - Warning signage
- Drag-and-drop placement
- Editable marker properties

### 5.4 Zone Tagging System
- Paint zones on map:
  - Safe zones (green)
  - Risk zones (red)
  - Restoration zones (yellow)
  - Monitoring zones (blue)
- Zone labeling and notes

### 5.5 Design Persistence
- Save corridor designs to database
- Load existing designs
- Version comparison
- Export designs as GeoJSON

---

## 📦 Phase 6: Analysis Tools

### 6.1 Client-side Analysis (Turf.js)
- Spatial intersection detection
- Union and difference operations
- Point-in-polygon checks
- Distance calculations
- Area calculations

### 6.2 Risk Mapping
- Overlay risk factors:
  - Road proximity analysis
  - Urban area buffers
  - Custom risk zone marking
- Risk score visualization (heatmap style)

### 6.3 Connectivity Scoring
- Simple connectivity metrics
- Corridor length and width calculations
- Habitat patch linkage visualization

### 6.4 Python Backend Integration Points
- Design frontend to call backend for advanced analysis:
  - Habitat fragmentation (patch detection, edge effects)
  - Least-cost path algorithms
  - Resistance surface modeling
- Show placeholder UI with "Backend required" indicators

---

## 📦 Phase 7: Report Generation

### 7.1 Report Builder
- Report type selector:
  - Corridor Planning Report
  - Fragmentation Analysis Report
  - Risk Assessment Report
  - Habitat Connectivity Report
- Template selection
- Content customization options

### 7.2 Data Visualization Components
- Charts using Recharts:
  - Bar charts (habitat statistics)
  - Pie charts (land use breakdown)
  - Line graphs (trends if temporal data)
- Map snapshots for reports

### 7.3 Report Content Generation
- Auto-generated executive summary
- Statistics compilation
- Map layout generator
- Recommendations section

### 7.4 Export System
- PDF export (using browser print or jsPDF)
- GeoJSON export for spatial data
- CSV export for tabular data
- PNG/JPEG map exports
- HTML interactive report option

---

## 📦 Phase 8: Polish & Advanced Features

### 8.1 Monitoring Dashboard (Optional)
- Processing queue status
- Before/after comparison views
- System performance metrics

### 8.2 Real-time Collaboration
- Basic project sharing between users
- Activity notifications

### 8.3 Accessibility & UX
- WCAG 2.1 AA compliance
- Keyboard navigation support
- High contrast mode toggle
- Mobile-responsive design

### 8.4 Documentation
- In-app help tooltips
- User guide pages
- API documentation for Python backend

---

## 🗂️ Data Model Summary

| Table | Purpose |
|-------|---------|
| `profiles` | User profile info (linked to auth.users) |
| `user_roles` | Role assignments (Planner, NGO, Researcher, Admin) |
| `projects` | Project containers for organizing work |
| `datasets` | Uploaded GIS file metadata |
| `corridors` | Saved corridor designs with geometry |
| `zones` | Marked zones (risk, safe, restoration) |
| `markers` | Infrastructure markers (overpasses, etc.) |
| `reports` | Generated report metadata |

---

## 🎨 Visual Design Summary

- **Primary Colors**: Forest greens (#2E8B57, #3CB371)
- **Secondary Colors**: Earth tones (#8B4513, #D2691E)
- **Accent Colors**: Conservation blues (#1E90FF, #4682B4)
- **Alert Colors**: Reds (#FF4500, #DC143C)
- **Style**: Government-grade scientific interface with glassmorphism effects
- **Typography**: Roboto Condensed (headings), Lato (body)

---

## 📍 Development Order

1. **Foundation** → Auth + Dashboard + Navigation
2. **Map Core** → MapLibre setup + layer management
3. **Data Flow** → File upload + dataset management
4. **Design Tools** → Corridor drawing + buffers + markers
5. **Analysis** → Basic analysis + risk mapping
6. **Reports** → Report builder + exports
7. **Polish** → Accessibility + mobile + documentation

Each phase will be fully functional before moving to the next, ensuring a working system at every stage.

