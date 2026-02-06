import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Ruler, 
  Trees, 
  Calendar, 
  Heart, 
  Leaf,
  AlertTriangle,
  Info,
  TrendingDown
} from 'lucide-react';
import { TreeImpactScore, ScoreBreakdown } from '@/lib/scientificScoring';

interface TransparentScoreCardProps {
  score: TreeImpactScore;
  species: string;
  age: number;
  height?: number;
  distance?: number;
}

export function TransparentScoreCard({
  score,
  species,
  age,
  height,
  distance,
}: TransparentScoreCardProps) {
  const getCategoryStyles = (code: string) => {
    switch (code) {
      case 'CRITICAL': return 'bg-red-500/10 border-red-500 text-red-700';
      case 'HIGH': return 'bg-orange-500/10 border-orange-500 text-orange-700';
      case 'MODERATE': return 'bg-yellow-500/10 border-yellow-500 text-yellow-700';
      case 'LOW': return 'bg-lime-500/10 border-lime-500 text-lime-700';
      case 'NEGLIGIBLE': return 'bg-green-500/10 border-green-500 text-green-700';
      default: return 'bg-muted border-muted-foreground';
    }
  };

  const breakdownItems = [
    { key: 'distance', label: 'Distance to Development', icon: <Ruler className="h-4 w-4" />, max: 30 },
    { key: 'species', label: 'Species Sensitivity', icon: <Trees className="h-4 w-4" />, max: 25 },
    { key: 'age', label: 'Age Factor', icon: <Calendar className="h-4 w-4" />, max: 20 },
    { key: 'health', label: 'Health Status', icon: <Heart className="h-4 w-4" />, max: 15 },
    { key: 'ecological', label: 'Ecological Role', icon: <Leaf className="h-4 w-4" />, max: 10 },
  ];

  return (
    <Card className={`border-2 ${getCategoryStyles(score.category_code)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Trees className="h-5 w-5" />
              {score.tree_id}
            </CardTitle>
            <CardDescription className="mt-1">
              {species} • {age} years{height ? ` • ${height}m tall` : ''}
            </CardDescription>
          </div>
          <div className="text-right">
            <div 
              className="text-3xl font-bold" 
              style={{ color: score.category_color }}
            >
              {score.total_score}
            </div>
            <p className="text-xs text-muted-foreground">/100 points</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Badge */}
        <div className="p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4" style={{ color: score.category_color }} />
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: score.category_color, 
                color: score.category_color 
              }}
            >
              {score.category_code}
            </Badge>
          </div>
          <p className="text-sm">{score.category.split(' - ')[1]}</p>
        </div>

        <Separator />

        {/* Score Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4 text-primary" />
            Score Breakdown
          </div>
          
          {breakdownItems.map((item) => {
            const value = score.breakdown[item.key as keyof ScoreBreakdown];
            const percentage = (value / item.max) * 100;
            
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className="font-mono">
                    {value}/{item.max}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2" 
                  // indicatorClassName={percentage > 66 ? 'bg-red-500' : percentage > 33 ? 'bg-yellow-500' : 'bg-green-500'}
                />
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Recommendation */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs font-medium mb-1 text-muted-foreground">RECOMMENDATION</p>
          <p className="text-sm">{score.recommendation}</p>
        </div>

        {/* Compensation Value */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
          <span className="text-sm font-medium">Compensation Value</span>
          <span className="text-lg font-bold text-primary">
            ₹{score.compensation_value.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ScoreSummaryProps {
  summary: {
    total: number;
    critical: number;
    high: number;
    moderate: number;
    low: number;
    negligible: number;
    total_compensation: number;
    avg_score: number;
  };
}

export function ScoreSummary({ summary }: ScoreSummaryProps) {
  const categories = [
    { key: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700' },
    { key: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-700' },
    { key: 'moderate', label: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { key: 'low', label: 'Low', color: 'bg-lime-500', textColor: 'text-lime-700' },
    { key: 'negligible', label: 'Safe', color: 'bg-green-500', textColor: 'text-green-700' },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Impact Summary
        </CardTitle>
        <CardDescription>
          {summary.total} trees analyzed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Distribution */}
        <div className="flex h-4 rounded-full overflow-hidden">
          {categories.map((cat) => {
            const count = summary[cat.key as keyof typeof summary] as number;
            const percent = summary.total > 0 ? (count / summary.total) * 100 : 0;
            return percent > 0 ? (
              <div
                key={cat.key}
                className={cat.color}
                style={{ width: `${percent}%` }}
                title={`${cat.label}: ${count} trees (${percent.toFixed(1)}%)`}
              />
            ) : null;
          })}
        </div>

        {/* Category Counts */}
        <div className="grid grid-cols-5 gap-2">
          {categories.map((cat) => {
            const count = summary[cat.key as keyof typeof summary] as number;
            return (
              <div key={cat.key} className="text-center">
                <div className={`w-3 h-3 rounded-full ${cat.color} mx-auto mb-1`} />
                <p className={`text-lg font-bold ${cat.textColor}`}>{count}</p>
                <p className="text-[10px] text-muted-foreground">{cat.label}</p>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Average Score</p>
            <p className="text-2xl font-bold">{summary.avg_score}</p>
            <p className="text-xs text-muted-foreground">/100</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <p className="text-xs text-muted-foreground">Total Compensation</p>
            <p className="text-2xl font-bold text-primary">
              ₹{(summary.total_compensation / 100000).toFixed(1)}L
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
