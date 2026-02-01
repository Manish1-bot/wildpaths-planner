import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { useProject } from '@/hooks/useProjects';
import { useTreeAnalysisResults } from '@/hooks/useTreeImpactAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Trees,
  AlertTriangle,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

export default function TreeImpactReportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { analysisResults, isLoading: resultsLoading } = useTreeAnalysisResults(projectId);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const latestResult = analysisResults[0];

  const generatePDF = async () => {
    if (!latestResult || !project) return;

    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Title
      doc.setFontSize(22);
      doc.setTextColor(34, 139, 34); // Forest green
      doc.text('EcoImpact', margin, yPos);
      yPos += 8;

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Tree Impact Analysis Report', margin, yPos);
      yPos += 12;

      // Project Info
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Project: ${project.name}`, margin, yPos);
      yPos += 6;
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 6;
      doc.text(`Analysis Date: ${new Date(latestResult.created_at).toLocaleDateString()}`, margin, yPos);
      yPos += 15;

      // Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Executive Summary', margin, yPos);
      yPos += 8;

      const summary = latestResult.summary as any;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      const impactLevel = summary?.impact_level || 'Unknown';
      const summaryText = `This report presents the findings of a tree impact analysis conducted to assess the environmental impact of planned development. The analysis identified ${latestResult.affected_trees.toLocaleString()} trees at risk out of ${latestResult.total_trees.toLocaleString()} total trees surveyed, representing a ${latestResult.tree_loss_percentage}% potential tree loss. The overall impact level is assessed as ${impactLevel}.`;
      
      const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
      doc.text(splitSummary, margin, yPos);
      yPos += splitSummary.length * 5 + 10;

      // Key Metrics Table
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Key Metrics', margin, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Trees Surveyed', latestResult.total_trees.toLocaleString()],
          ['Trees Affected', latestResult.affected_trees.toLocaleString()],
          ['Trees Safe', latestResult.safe_trees.toLocaleString()],
          ['Tree Loss Percentage', `${latestResult.tree_loss_percentage}%`],
          ['Buffer Zone Distance', `${latestResult.buffer_meters} meters`],
          ['Impact Level', impactLevel],
        ],
        theme: 'striped',
        headStyles: { fillColor: [34, 139, 34] },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Impact Analysis
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Impact Analysis', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      let impactAnalysisText = '';
      if (latestResult.tree_loss_percentage > 30) {
        impactAnalysisText = 'The proposed development poses a SEVERE environmental impact with potential loss of over 30% of surveyed trees. Immediate re-evaluation of the development plan is strongly recommended.';
      } else if (latestResult.tree_loss_percentage > 15) {
        impactAnalysisText = 'The proposed development poses a HIGH environmental impact. Alternative designs should be explored to minimize tree loss, and a comprehensive mitigation strategy is required.';
      } else if (latestResult.tree_loss_percentage > 5) {
        impactAnalysisText = 'The proposed development poses a MODERATE environmental impact. Mitigation measures should be implemented, including tree transplantation and replanting programs.';
      } else {
        impactAnalysisText = 'The proposed development poses a LOW environmental impact. Standard environmental protection measures should be sufficient.';
      }

      const splitImpact = doc.splitTextToSize(impactAnalysisText, pageWidth - 2 * margin);
      doc.text(splitImpact, margin, yPos);
      yPos += splitImpact.length * 5 + 15;

      // Recommendations
      const recommendations = summary?.recommendations || [];
      if (recommendations.length > 0) {
        // Check if we need a new page
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Recommendations', margin, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Recommendation']],
          body: recommendations.map((rec: string, idx: number) => [
            (idx + 1).toString(),
            rec,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [34, 139, 34] },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 'auto' },
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | EcoImpact - GIS-Based Environmental Impact Analysis System`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      doc.save(`tree-impact-report-${project.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);

      toast({
        title: 'Report Generated',
        description: 'Your Tree Impact Analysis Report has been downloaded.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCSV = () => {
    if (!latestResult || !project) return;

    const summary = latestResult.summary as any;
    const recommendations = summary?.recommendations || [];

    const csvContent = [
      'EcoImpact - Tree Impact Analysis Report',
      `Project,${project.name}`,
      `Report Date,${new Date().toLocaleDateString()}`,
      `Analysis Date,${new Date(latestResult.created_at).toLocaleDateString()}`,
      '',
      'Key Metrics',
      'Metric,Value',
      `Total Trees,${latestResult.total_trees}`,
      `Affected Trees,${latestResult.affected_trees}`,
      `Safe Trees,${latestResult.safe_trees}`,
      `Tree Loss Percentage,${latestResult.tree_loss_percentage}%`,
      `Buffer Zone,${latestResult.buffer_meters} meters`,
      `Impact Level,${summary?.impact_level || 'Unknown'}`,
      '',
      'Recommendations',
      ...recommendations.map((rec: string, idx: number) => `${idx + 1},${rec}`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tree-impact-summary-${project.name.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV Exported',
      description: 'Summary data has been exported to CSV.',
    });
  };

  if (projectLoading || resultsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!project || !latestResult) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {!project ? 'Project not found' : 'No analysis results available'}
              </p>
              <Button asChild>
                <Link to={project ? `/project/${project.id}/tree-impact` : '/projects'}>
                  {project ? 'Run Analysis First' : 'Back to Projects'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const summary = latestResult.summary as any;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/project/${project.id}/tree-impact`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-heading font-bold mb-2">Tree Impact Report</h1>
            <p className="text-muted-foreground">
              Generate and download the tree impact analysis report
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={generatePDF} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Report Preview */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading">Report Preview</CardTitle>
            <CardDescription>
              Preview of the report content that will be generated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Header Section */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-green-600 mb-1">EcoImpact</h2>
              <h3 className="text-xl font-semibold mb-4">Tree Impact Analysis Report</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Project: {project.name}</p>
                <p>Report Generated: {new Date().toLocaleDateString()}</p>
                <p>Analysis Date: {new Date(latestResult.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Key Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Trees</p>
                  <p className="text-2xl font-bold">{latestResult.total_trees.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Affected Trees</p>
                  <p className="text-2xl font-bold text-red-600">{latestResult.affected_trees.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Safe Trees</p>
                  <p className="text-2xl font-bold text-green-600">{latestResult.safe_trees.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tree Loss</p>
                  <p className="text-2xl font-bold text-orange-600">{latestResult.tree_loss_percentage}%</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Buffer Zone</p>
                  <p className="text-2xl font-bold">{latestResult.buffer_meters}m</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Impact Level</p>
                  <Badge className={
                    summary?.impact_level === 'Severe' ? 'bg-red-500' :
                    summary?.impact_level === 'High' ? 'bg-orange-500' :
                    summary?.impact_level === 'Moderate' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }>
                    {summary?.impact_level || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {summary?.recommendations?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Recommendations</h4>
                <ul className="space-y-2">
                  {summary.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
