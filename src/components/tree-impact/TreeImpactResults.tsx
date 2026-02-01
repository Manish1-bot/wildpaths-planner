import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trees, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3,
  Lightbulb,
  TrendingDown
} from 'lucide-react';
import { TreeAnalysisResult } from '@/hooks/useTreeImpactAnalysis';
import { formatDistanceToNow } from 'date-fns';

interface TreeImpactResultsProps {
  result: TreeAnalysisResult;
}

export function TreeImpactResults({ result }: TreeImpactResultsProps) {
  const summary = result.summary as any;
  const impactLevel = summary?.impact_level || 'Unknown';
  const recommendations = summary?.recommendations || [];

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'Severe': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trees className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Trees</p>
                <p className="text-2xl font-bold">{result.total_trees.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Affected Trees</p>
                <p className="text-2xl font-bold text-red-600">{result.affected_trees.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Safe Trees</p>
                <p className="text-2xl font-bold text-green-600">{result.safe_trees.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tree Loss</p>
                <p className="text-2xl font-bold text-orange-600">{result.tree_loss_percentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Visualization */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Impact Analysis Summary
          </CardTitle>
          <CardDescription>
            Analysis performed {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })} 
            with {result.buffer_meters}m buffer zone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Impact Level</span>
            <Badge className={getImpactColor(impactLevel)}>
              {impactLevel}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tree Impact Progress</span>
              <span className="text-muted-foreground">
                {result.affected_trees} / {result.total_trees} trees affected
              </span>
            </div>
            <div className="relative h-4 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-green-500 rounded-l-full"
                style={{ width: `${100 - result.tree_loss_percentage}%` }}
              />
              <div 
                className="absolute inset-y-0 right-0 bg-red-500 rounded-r-full"
                style={{ width: `${result.tree_loss_percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Safe ({(100 - result.tree_loss_percentage).toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Affected ({result.tree_loss_percentage}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Buffer Zone</p>
              <p className="font-medium">{result.buffer_meters} meters</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Analysis Date</p>
              <p className="font-medium">
                {new Date(result.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Based on the analysis results, here are suggested mitigation measures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
