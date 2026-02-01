# EcoImpact - GIS-Based Environmental Impact Analysis System

A production-grade GIS platform for environmental impact analysis, tree impact assessment, and conservation planning.

## Features

- **Authentication & RBAC**: Role-based access control with Supabase Auth
- **Project Management**: Create and manage environmental analysis projects
- **GIS File Upload**: Support for GeoJSON and CSV file formats
- **Interactive Map**: MapLibre-powered visualization with layer controls
- **Corridor Design Tools**: Draw polygons and paths for infrastructure planning
- **Tree Impact Analysis**: Before & after environmental change detection
  - Upload tree distribution data (baseline)
  - Upload development layers (roads, corridors, construction zones)
  - Spatial analysis with configurable buffer zones
  - Visual output showing affected (red) vs safe (green) trees
  - Numerical metrics and percentage calculations
- **Report Generation**: Professional PDF reports with jsPDF

## Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Maps**: MapLibre GL
- **Spatial Analysis**: Turf.js
- **Backend**: Supabase (Auth, Database, Storage)
- **PDF Generation**: jsPDF with jspdf-autotable

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

## Tree Impact Analysis Module

The Tree Impact Analysis module enables before-and-after environmental change detection:

1. **Upload Tree Data**: Upload GeoJSON or CSV with tree locations (latitude, longitude)
2. **Upload Development Layer**: Add roads, corridors, or construction zones
3. **Configure Buffer**: Set the buffer zone distance (default: 50 meters)
4. **Run Analysis**: Calculate spatial intersections using Turf.js
5. **View Results**: See affected vs safe trees on the map
6. **Generate Report**: Export PDF or CSV summary

### Example Metrics Output

```
Total trees: 1,250
Affected trees: 184
Safe trees: 1,066
Tree loss: 14.72%
```

## Project Structure

```
src/
├── components/
│   ├── analysis/         # Analysis result components
│   ├── layout/           # Header, navigation
│   ├── map/              # MapViewer component
│   ├── tree-impact/      # Tree Impact Analysis components
│   └── ui/               # shadcn/ui components
├── hooks/
│   ├── useTreeImpactAnalysis.ts  # Tree analysis logic
│   └── ...
├── pages/
│   ├── TreeImpactPage.tsx        # Main tree analysis page
│   ├── TreeImpactReportPage.tsx  # Report generation
│   └── ...
└── integrations/
    └── supabase/         # Database client & types
```

## License

© 2024 EcoImpact. Built for environmental impact analysis.
