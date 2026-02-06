import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Scatter,
  Treemap
} from 'recharts';
import { 
  Trees, 
  TrendingUp, 
  AlertTriangle, 
  Leaf, 
  DollarSign,
  Target,
  Activity
} from 'lucide-react';

interface TreeImpactReportChartsProps {
  data: {
    totalTrees: number;
    affectedTrees: number;
    safeTrees: number;
    directRemoval: number;
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
    impactPercentage: number;
    totalCompensation: number;
    bySpecies: Record<string, { total: number; affected: number; safe: number }>;
    byHealth: Record<string, { total: number; affected: number }>;
    bySize: Record<string, { total: number; affected: number }>;
    growthProjections?: Array<{
      year: number;
      naturalHeight: number;
      projectedHeight: number;
      survivalProbability: number;
      carbonLoss: number;
    }>;
  };
}

const IMPACT_COLORS = {
  safe: '#22c55e',
  low_impact: '#84cc16',
  medium_impact: '#eab308',
  high_impact: '#f97316',
  direct_removal: '#ef4444',
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function TreeImpactReportCharts({ data }: TreeImpactReportChartsProps) {
  // Prepare impact distribution data
  const impactDistribution = [
    { name: 'Safe', value: data.safeTrees, color: IMPACT_COLORS.safe },
    { name: 'Low Impact', value: data.lowImpact, color: IMPACT_COLORS.low_impact },
    { name: 'Medium Impact', value: data.mediumImpact, color: IMPACT_COLORS.medium_impact },
    { name: 'High Impact', value: data.highImpact, color: IMPACT_COLORS.high_impact },
    { name: 'Direct Removal', value: data.directRemoval, color: IMPACT_COLORS.direct_removal },
  ].filter(d => d.value > 0);

  // Prepare species data for bar chart
  const speciesData = Object.entries(data.bySpecies)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([species, counts]) => ({
      species: species.length > 12 ? species.substring(0, 12) + '...' : species,
      affected: counts.affected,
      safe: counts.safe,
      total: counts.total,
      impactRate: ((counts.affected / counts.total) * 100).toFixed(1),
    }));

  // Prepare health distribution data
  const healthData = Object.entries(data.byHealth).map(([status, counts]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    total: counts.total,
    affected: counts.affected,
    safe: counts.total - counts.affected,
  }));

  // Prepare size distribution data
  const sizeData = Object.entries(data.bySize).map(([category, counts]) => ({
    name: category,
    total: counts.total,
    affected: counts.affected,
    impactRate: counts.total > 0 ? ((counts.affected / counts.total) * 100).toFixed(1) : 0,
  }));

  // Radar chart data for multi-criteria analysis
  const radarData = [
    { subject: 'Critical', A: data.directRemoval, fullMark: data.totalTrees / 4 },
    { subject: 'High Risk', A: data.highImpact, fullMark: data.totalTrees / 4 },
    { subject: 'Medium Risk', A: data.mediumImpact, fullMark: data.totalTrees / 4 },
    { subject: 'Low Risk', A: data.lowImpact, fullMark: data.totalTrees / 4 },
    { subject: 'Safe', A: data.safeTrees, fullMark: data.totalTrees },
  ];

  // Treemap data for compensation breakdown
  const compensationTreemap = Object.entries(data.bySpecies)
    .filter(([_, counts]) => counts.affected > 0)
    .map(([species, counts], idx) => ({
      name: species,
      size: counts.affected * 2000, // Estimated compensation per tree
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trees</p>
                <p className="text-3xl font-bold">{data.totalTrees.toLocaleString()}</p>
              </div>
              <Trees className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Affected</p>
                <p className="text-3xl font-bold text-red-600">{data.affectedTrees.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600 opacity-20" />
            </div>
            <Badge className="mt-2 bg-red-500/10 text-red-600" variant="outline">
              {data.impactPercentage.toFixed(1)}% Impact
            </Badge>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Safe</p>
                <p className="text-3xl font-bold text-green-600">{data.safeTrees.toLocaleString()}</p>
              </div>
              <Leaf className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compensation</p>
                <p className="text-2xl font-bold">₹{(data.totalCompensation / 100000).toFixed(1)}L</p>
              </div>
              <DollarSign className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impact Distribution Pie Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Impact Distribution
            </CardTitle>
            <CardDescription>Trees by impact severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={impactDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {impactDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), 'Trees']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Species Impact Bar Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Species Impact Analysis</CardTitle>
            <CardDescription>Affected vs Safe trees by species</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speciesData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis dataKey="species" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="safe" name="Safe" stackId="a" fill={IMPACT_COLORS.safe} />
                  <Bar dataKey="affected" name="Affected" stackId="a" fill={IMPACT_COLORS.direct_removal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Criteria Radar Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Risk Profile Analysis
            </CardTitle>
            <CardDescription>Multi-criteria risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                  <Radar
                    name="Trees"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Health vs Impact Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Health Status Impact</CardTitle>
            <CardDescription>Impact distribution by tree health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="safe" name="Safe" fill={IMPACT_COLORS.safe} />
                  <Bar dataKey="affected" name="Affected" fill={IMPACT_COLORS.direct_removal} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Size Category Impact */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Impact by Tree Size</CardTitle>
            <CardDescription>DBH category analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#94a3b8" />
                  <Bar dataKey="affected" name="Affected" fill={IMPACT_COLORS.high_impact} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Growth Projections Chart */}
        {data.growthProjections && data.growthProjections.length > 0 && (
          <Card className="glass-card col-span-full">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                10-Year Growth Projection
              </CardTitle>
              <CardDescription>
                Chapman-Richards model: Natural vs Development-impacted growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.growthProjections}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" label={{ value: 'Year', position: 'bottom' }} />
                    <YAxis yAxisId="left" label={{ value: 'Height (m)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Survival %', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="naturalHeight"
                      name="Natural Growth"
                      fill="#22c55e"
                      fillOpacity={0.3}
                      stroke="#22c55e"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="projectedHeight"
                      name="With Development"
                      fill="#ef4444"
                      fillOpacity={0.3}
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="survivalProbability"
                      name="Survival Probability"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Impact Summary Text */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-red-500/10">
              <p className="font-medium text-red-700 mb-2">Critical Actions Required</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {data.directRemoval} trees require immediate relocation</li>
                <li>• {data.highImpact} trees need protection measures</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10">
              <p className="font-medium text-yellow-700 mb-2">Monitoring Required</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {data.mediumImpact} trees need regular monitoring</li>
                <li>• {data.lowImpact} trees under standard protection</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10">
              <p className="font-medium text-green-700 mb-2">Protected Status</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {data.safeTrees} trees are outside impact zone</li>
                <li>• {((data.safeTrees / data.totalTrees) * 100).toFixed(1)}% of trees preserved</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
