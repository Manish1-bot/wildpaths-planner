import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Trees, TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react';

interface AnalyticsDashboardProps {
  treeData?: {
    total: number;
    affected: number;
    safe: number;
    bySpecies: [string, number][];
    byHealth: [string, number][];
    byImpact: [string, number][];
  };
  corridorData?: {
    totalCorridors: number;
    byStatus: [string, number][];
    byPriority: [string, number][];
    avgConnectivity: number;
  };
  observationData?: {
    total: number;
    byType: [string, number][];
    byRisk: [string, number][];
    recentTrend: { date: string; count: number }[];
  };
  type?: 'tree' | 'corridor' | 'combined';
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  safe: '#22c55e',
  affected: '#ef4444',
  atRisk: '#f59e0b',
  excellent: '#22c55e',
  good: '#84cc16',
  fair: '#eab308',
  poor: '#f97316',
  dead: '#6b7280',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
  critical: '#dc2626',
};

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export function AnalyticsDashboard({ 
  treeData, 
  corridorData, 
  observationData,
  type = 'combined' 
}: AnalyticsDashboardProps) {
  // Prepare tree impact pie data
  const treeImpactPie = treeData ? [
    { name: 'Safe', value: treeData.safe, color: COLORS.safe },
    { name: 'Affected', value: treeData.affected, color: COLORS.affected },
  ] : [];

  // Prepare species bar data
  const speciesBar = treeData?.bySpecies.slice(0, 8).map(([species, count]) => ({
    species: species.length > 15 ? species.substring(0, 15) + '...' : species,
    count,
  })) || [];

  // Prepare health distribution
  const healthData = treeData?.byHealth.map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: COLORS[status.toLowerCase() as keyof typeof COLORS] || '#6b7280',
  })) || [];

  // Observation type data
  const observationTypeData = observationData?.byType.map(([type, count]) => ({
    type: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    count,
  })) || [];

  // Risk distribution
  const riskData = observationData?.byRisk.map(([level, count]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: count,
    color: COLORS[level.toLowerCase() as keyof typeof COLORS] || '#6b7280',
  })) || [];

  const showTreeAnalytics = type === 'tree' || type === 'combined';
  const showCorridorAnalytics = type === 'corridor' || type === 'combined';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {treeData && (
          <>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trees</p>
                    <p className="text-3xl font-bold">{treeData.total.toLocaleString()}</p>
                  </div>
                  <Trees className="h-10 w-10 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Safe Trees</p>
                    <p className="text-3xl font-bold text-green-600">{treeData.safe.toLocaleString()}</p>
                  </div>
                  <Shield className="h-10 w-10 text-green-600 opacity-20" />
                </div>
                <Badge className="mt-2 bg-green-500/10 text-green-600" variant="outline">
                  {treeData.total > 0 ? Math.round((treeData.safe / treeData.total) * 100) : 0}% Safe
                </Badge>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Affected Trees</p>
                    <p className="text-3xl font-bold text-red-600">{treeData.affected.toLocaleString()}</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-red-600 opacity-20" />
                </div>
                <Badge className="mt-2 bg-red-500/10 text-red-600" variant="outline">
                  {treeData.total > 0 ? Math.round((treeData.affected / treeData.total) * 100) : 0}% Affected
                </Badge>
              </CardContent>
            </Card>
          </>
        )}
        {observationData && (
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Observations</p>
                  <p className="text-3xl font-bold">{observationData.total.toLocaleString()}</p>
                </div>
                <Activity className="h-10 w-10 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tree Impact Pie Chart */}
        {showTreeAnalytics && treeData && treeData.total > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Tree Impact Distribution</CardTitle>
              <CardDescription>Safe vs Affected trees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={treeImpactPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {treeImpactPie.map((entry, index) => (
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

        {/* Species Distribution Bar Chart */}
        {showTreeAnalytics && speciesBar.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Species Distribution</CardTitle>
              <CardDescription>Top species by count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speciesBar} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis dataKey="species" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Distribution */}
        {showTreeAnalytics && healthData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Health Status Distribution</CardTitle>
              <CardDescription>Tree health breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {healthData.map((entry, index) => (
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

        {/* Observation Types */}
        {observationTypeData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Observation Types</CardTitle>
              <CardDescription>Field observations by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={observationTypeData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Distribution */}
        {riskData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Risk Zone Distribution</CardTitle>
              <CardDescription>Observations by risk level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {riskData.map((entry, index) => (
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

        {/* Observation Trend */}
        {observationData?.recentTrend && observationData.recentTrend.length > 0 && (
          <Card className="glass-card col-span-full">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Observation Trend
              </CardTitle>
              <CardDescription>Field observations over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={observationData.recentTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
