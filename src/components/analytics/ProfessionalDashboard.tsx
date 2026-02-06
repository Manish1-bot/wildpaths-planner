import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, ScatterChart,
  Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, Sankey, Layer, Rectangle
} from 'recharts';
import { 
  Trees, TrendingUp, AlertTriangle, Shield, Activity, 
  Route, MapPin, BarChart3, PieChart as PieChartIcon,
  Gauge, Calendar, Users, DollarSign
} from 'lucide-react';

interface CorridorStats {
  totalCorridors: number;
  totalLength: number;
  avgConnectivity: number;
  avgWidth: number;
  byStatus: [string, number][];
  byPriority: [string, number][];
  barriers: number;
  interventions: number;
}

interface TreeStats {
  total: number;
  affected: number;
  safe: number;
  directRemoval: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
  bySpecies: [string, number][];
  byHealth: [string, number][];
  bySize: [string, number][];
  totalCompensation: number;
}

interface ObservationStats {
  total: number;
  byType: [string, number][];
  byRisk: [string, number][];
  recentTrend: { date: string; count: number }[];
}

interface ProjectStats {
  name: string;
  area: number;
  startDate: string;
  endDate?: string;
  status: string;
  team?: number;
}

interface ProfessionalDashboardProps {
  corridorStats?: CorridorStats;
  treeStats?: TreeStats;
  observationStats?: ObservationStats;
  projectStats?: ProjectStats;
}

const IMPACT_COLORS = {
  safe: '#22c55e',
  low_impact: '#84cc16',
  medium_impact: '#f59e0b',
  high_impact: '#f97316',
  direct_removal: '#ef4444',
};

const STATUS_COLORS = {
  planning: '#3b82f6',
  active: '#22c55e',
  review: '#f59e0b',
  completed: '#8b5cf6',
};

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

export function ProfessionalDashboard({
  corridorStats,
  treeStats,
  observationStats,
  projectStats,
}: ProfessionalDashboardProps) {
  // Prepare chart data
  const impactPieData = treeStats ? [
    { name: 'Direct Removal', value: treeStats.directRemoval, color: IMPACT_COLORS.direct_removal },
    { name: 'High Impact', value: treeStats.highImpact, color: IMPACT_COLORS.high_impact },
    { name: 'Medium Impact', value: treeStats.mediumImpact, color: IMPACT_COLORS.medium_impact },
    { name: 'Low Impact', value: treeStats.lowImpact, color: IMPACT_COLORS.low_impact },
    { name: 'Safe', value: treeStats.safe, color: IMPACT_COLORS.safe },
  ].filter(d => d.value > 0) : [];

  const speciesBarData = treeStats?.bySpecies.slice(0, 10).map(([species, count]) => ({
    species: species.length > 12 ? species.substring(0, 12) + '...' : species,
    count,
    fullName: species,
  })) || [];

  const healthRadarData = treeStats?.byHealth.map(([status, count]) => ({
    subject: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    fullMark: treeStats.total,
  })) || [];

  const sizeScatterData = treeStats?.bySize.map(([size, count], idx) => ({
    size: idx + 1,
    count,
    label: size,
  })) || [];

  const observationTrendData = observationStats?.recentTrend || [];

  const riskPieData = observationStats?.byRisk.map(([level, count]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: count,
    color: PRIORITY_COLORS[level as keyof typeof PRIORITY_COLORS] || '#6b7280',
  })) || [];

  return (
    <div className="space-y-6">
      {/* Project Summary Row */}
      {projectStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Route className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p className="font-semibold truncate">{projectStats.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Area</p>
                  <p className="font-semibold">{projectStats.area.toLocaleString()} ha</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-semibold">{projectStats.startDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team</p>
                  <p className="font-semibold">{projectStats.team || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <Badge
                className={`w-full justify-center ${
                  projectStats.status === 'active' ? 'bg-green-500' :
                  projectStats.status === 'planning' ? 'bg-blue-500' :
                  'bg-purple-500'
                }`}
              >
                {projectStats.status.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tree Impact Stats */}
      {treeStats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <Trees className="h-8 w-8 mx-auto mb-2 text-primary opacity-60" />
              <p className="text-3xl font-bold">{treeStats.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Trees</p>
            </CardContent>
          </Card>
          <Card className="glass-card bg-red-500/5 border-red-500/20">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500 opacity-60" />
              <p className="text-3xl font-bold text-red-600">{treeStats.directRemoval}</p>
              <p className="text-xs text-muted-foreground">Direct Removal</p>
            </CardContent>
          </Card>
          <Card className="glass-card bg-orange-500/5 border-orange-500/20">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">{treeStats.highImpact}</p>
              <p className="text-xs text-muted-foreground">High Impact</p>
            </CardContent>
          </Card>
          <Card className="glass-card bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-yellow-600">{treeStats.mediumImpact}</p>
              <p className="text-xs text-muted-foreground">Medium Impact</p>
            </CardContent>
          </Card>
          <Card className="glass-card bg-green-500/5 border-green-500/20">
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-60" />
              <p className="text-3xl font-bold text-green-600">{treeStats.safe}</p>
              <p className="text-xs text-muted-foreground">Safe</p>
            </CardContent>
          </Card>
          <Card className="glass-card bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary opacity-60" />
              <p className="text-2xl font-bold">₹{(treeStats.totalCompensation / 100000).toFixed(1)}L</p>
              <p className="text-xs text-muted-foreground">Compensation</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Pie Chart - Impact Distribution */}
        {impactPieData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                Impact Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={impactPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {impactPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. Bar Chart - Species Vulnerability */}
        {speciesBarData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Species Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speciesBarData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis dataKey="species" type="category" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip content={({ payload }) => payload?.[0] && (
                      <div className="bg-background border rounded p-2 shadow-lg">
                        <p className="font-medium">{payload[0].payload.fullName}</p>
                        <p className="text-sm">Count: {payload[0].value}</p>
                      </div>
                    )} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. Radar Chart - Health Distribution */}
        {healthRadarData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Health Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={healthRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                    <Radar
                      name="Trees"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.5}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Area Chart - Observation Trend */}
        {observationTrendData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Observation Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={observationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. Risk Distribution Pie */}
        {riskPieData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Risk Zone Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {riskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 6. Corridor Stats */}
        {corridorStats && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" />
                Corridor Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{corridorStats.totalCorridors}</p>
                  <p className="text-xs text-muted-foreground">Corridors</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{corridorStats.totalLength.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Total km</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Avg Connectivity</span>
                  <span>{corridorStats.avgConnectivity.toFixed(0)}/100</span>
                </div>
                <Progress value={corridorStats.avgConnectivity} className="h-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Barriers:</span>
                <Badge variant="destructive">{corridorStats.barriers}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interventions:</span>
                <Badge variant="secondary">{corridorStats.interventions}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
