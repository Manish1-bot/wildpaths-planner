/**
 * Export Utilities for multiple formats
 * Supports GeoJSON, CSV, Excel-compatible formats
 */

import { TreeObservation } from '@/hooks/useTreeObservations';

// Download helper
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export trees as GeoJSON
export function exportTreesAsGeoJSON(trees: TreeObservation[], filename = 'trees.geojson') {
  const geojson = {
    type: 'FeatureCollection',
    features: trees.map(tree => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [tree.longitude, tree.latitude],
      },
      properties: {
        id: tree.id,
        tree_id: tree.tree_id,
        species: tree.species,
        height_meters: tree.height_meters,
        trunk_diameter_cm: tree.trunk_diameter_cm,
        canopy_diameter_meters: tree.canopy_diameter_meters,
        age_years: tree.age_years,
        health_status: tree.health_status,
        impact_status: tree.impact_status,
        impact_reason: tree.impact_reason,
        observation_date: tree.observation_date,
        notes: tree.notes,
      },
    })),
  };

  downloadFile(JSON.stringify(geojson, null, 2), filename, 'application/geo+json');
}

// Export trees as CSV
export function exportTreesAsCSV(trees: TreeObservation[], filename = 'trees.csv') {
  const headers = [
    'Tree ID',
    'Species',
    'Latitude',
    'Longitude',
    'Height (m)',
    'DBH (cm)',
    'Canopy Diameter (m)',
    'Age (years)',
    'Health Status',
    'Impact Status',
    'Impact Reason',
    'Observation Date',
    'Notes',
  ];

  const rows = trees.map(tree => [
    tree.tree_id || '',
    tree.species || '',
    tree.latitude,
    tree.longitude,
    tree.height_meters || '',
    tree.trunk_diameter_cm || '',
    tree.canopy_diameter_meters || '',
    tree.age_years || '',
    tree.health_status || '',
    tree.impact_status || '',
    tree.impact_reason || '',
    tree.observation_date || '',
    (tree.notes || '').replace(/"/g, '""'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

// Export analysis results
export function exportAnalysisAsJSON(analysis: any, filename = 'analysis.json') {
  downloadFile(JSON.stringify(analysis, null, 2), filename, 'application/json');
}

// Export impact analysis summary as CSV
export function exportImpactSummaryAsCSV(
  analysis: {
    total_trees: number;
    affected_trees: number;
    safe_trees: number;
    tree_loss_percentage: number;
    buffer_meters: number;
    by_species?: Record<string, { total: number; affected: number }>;
  },
  trees: TreeObservation[],
  filename = 'impact_analysis.csv'
) {
  const summaryRows = [
    ['IMPACT ANALYSIS SUMMARY'],
    [''],
    ['Metric', 'Value'],
    ['Total Trees', analysis.total_trees],
    ['Affected Trees', analysis.affected_trees],
    ['Safe Trees', analysis.safe_trees],
    ['Impact Percentage', `${analysis.tree_loss_percentage}%`],
    ['Buffer Distance', `${analysis.buffer_meters}m`],
    [''],
    ['TREE-BY-TREE DETAILS'],
    [''],
  ];

  const treeHeaders = [
    'Tree ID',
    'Species',
    'Latitude',
    'Longitude',
    'Height (m)',
    'DBH (cm)',
    'Health',
    'Impact Status',
  ];

  const treeRows = trees.map(tree => [
    tree.tree_id || tree.id.slice(0, 8),
    tree.species || 'Unknown',
    tree.latitude,
    tree.longitude,
    tree.height_meters || '',
    tree.trunk_diameter_cm || '',
    tree.health_status || '',
    tree.impact_status || 'unknown',
  ]);

  const csvContent = [
    ...summaryRows.map(row => row.join(',')),
    treeHeaders.join(','),
    ...treeRows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

// Export corridor data
export function exportCorridorAsGeoJSON(corridor: any, filename = 'corridor.geojson') {
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: corridor.geojson_data?.geometry || corridor.corridor_path_geojson,
        properties: {
          id: corridor.id,
          name: corridor.name,
          corridor_type: corridor.corridor_type,
          priority: corridor.priority,
          connectivity_score: corridor.connectivity_score,
          total_length_km: corridor.total_length_km,
          width_meters: corridor.width_meters,
          status: corridor.status,
        },
      },
    ],
  };

  downloadFile(JSON.stringify(geojson, null, 2), filename, 'application/geo+json');
}

// Export as KML for Google Earth
export function exportAsKML(
  features: Array<{ lat: number; lng: number; name: string; description?: string }>,
  filename = 'export.kml'
) {
  const placemarks = features.map(f => `
    <Placemark>
      <name>${escapeXml(f.name)}</name>
      <description>${escapeXml(f.description || '')}</description>
      <Point>
        <coordinates>${f.lng},${f.lat},0</coordinates>
      </Point>
    </Placemark>
  `).join('\n');

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(filename)}</name>
    ${placemarks}
  </Document>
</kml>`;

  downloadFile(kml, filename, 'application/vnd.google-earth.kml+xml');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate Excel-compatible XML (can be opened in Excel)
export function exportAsExcelXML(
  headers: string[],
  rows: (string | number)[][],
  filename = 'export.xml'
) {
  const headerCells = headers.map(h => `<Cell><Data ss:Type="String">${escapeXml(String(h))}</Data></Cell>`).join('');
  
  const dataRows = rows.map(row => {
    const cells = row.map(cell => {
      const type = typeof cell === 'number' ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${type}">${escapeXml(String(cell))}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Sheet1">
    <Table>
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

  downloadFile(xml, filename, 'application/vnd.ms-excel');
}
