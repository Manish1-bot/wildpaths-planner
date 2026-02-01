import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Layers, 
  Link2, 
  AlertTriangle, 
  Lightbulb,
  PieChart,
  MapPin
} from 'lucide-react';

interface AnalysisResultsProps {
  results: any;
  explanations: any;
}

export function AnalysisResults({ results, explanations }: AnalysisResultsProps) {
  if (!results) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6 text-center text-muted-foreground">
          No analysis results available. Upload data and run analysis to see results.
        </CardContent>
      </Card>
    );
  }

  const { species_summary, fragmentation, connectivity, risk_zones, recommendations } = results;

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <FileText className="h-5 w-5 text-primary" />
            Data Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{explanations?.overview}</p>
          
          {species_summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{species_summary.total_sightings}</p>
                <p className="text-sm text-muted-foreground">Total Observations</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {Object.keys(species_summary.species_breakdown || {}).length}
                </p>
                <p className="text-sm text-muted-foreground">Species Recorded</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {species_summary.area_covered_sqkm || 0}
                </p>
                <p className="text-sm text-muted-foreground">Area (sq.km)</p>
              </div>
            </div>
          )}

          {species_summary?.species_breakdown && Object.keys(species_summary.species_breakdown).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Species Breakdown:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(species_summary.species_breakdown).map(([species, count]) => (
                  <Badge key={species} variant="secondary">
                    {species}: {count as number}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fragmentation Analysis */}
      {fragmentation && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Layers className="h-5 w-5 text-accent" />
              Habitat Fragmentation
            </CardTitle>
            <CardDescription>Analysis of habitat patch distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{explanations?.fragmentation}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{fragmentation.patch_count}</p>
                <p className="text-sm text-muted-foreground">Patches</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{fragmentation.avg_patch_size_sqkm}</p>
                <p className="text-sm text-muted-foreground">Avg Size (sq.km)</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{fragmentation.fragmentation_index}</p>
                <p className="text-sm text-muted-foreground">Frag. Index</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Badge 
                  variant={
                    fragmentation.fragmentation_level === 'Low' ? 'default' :
                    fragmentation.fragmentation_level === 'Moderate' ? 'secondary' : 'destructive'
                  }
                  className="text-lg px-4 py-1"
                >
                  {fragmentation.fragmentation_level}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connectivity */}
      {connectivity && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Link2 className="h-5 w-5 text-secondary" />
              Connectivity Analysis
            </CardTitle>
            <CardDescription>How well habitat patches are connected</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{explanations?.connectivity}</p>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Connectivity Score</span>
                  <span className="text-sm font-bold text-primary">{connectivity.score}/100</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${connectivity.score}%` }}
                  />
                </div>
              </div>
            </div>

            {connectivity.connections && connectivity.connections.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Patch Connections:</p>
                {connectivity.connections.map((conn: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{conn.from}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-sm">{conn.to}</span>
                    <Badge 
                      variant={
                        conn.quality === 'Good' ? 'default' :
                        conn.quality === 'Moderate' ? 'secondary' : 'destructive'
                      }
                      className="ml-auto"
                    >
                      {conn.quality}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Risk Zones */}
      {risk_zones && risk_zones.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Risk Zones Identified
            </CardTitle>
            <CardDescription>Areas requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{explanations?.risks}</p>
            
            <div className="space-y-2">
              {risk_zones.map((zone: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <AlertTriangle className={`h-5 w-5 ${
                    zone.risk_level === 'High' ? 'text-destructive' :
                    zone.risk_level === 'Medium' ? 'text-yellow-500' : 'text-muted-foreground'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{zone.name}</p>
                    <p className="text-sm text-muted-foreground">{zone.type}</p>
                  </div>
                  <Badge variant={
                    zone.risk_level === 'High' ? 'destructive' :
                    zone.risk_level === 'Medium' ? 'secondary' : 'outline'
                  }>
                    {zone.risk_level} Risk
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Recommendations
            </CardTitle>
            <CardDescription>Suggested actions based on analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{explanations?.recommendations}</p>
            
            <div className="space-y-3">
              {recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="flex gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{rec.action}</p>
                      <Badge variant={
                        rec.priority === 'High' ? 'destructive' :
                        rec.priority === 'Medium' ? 'secondary' : 'outline'
                      }>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
