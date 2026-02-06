import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { useProject } from '@/hooks/useProjects';
import { useTreeAnalysisResults } from '@/hooks/useTreeImpactAnalysis';
import { TreeImpactReportCharts } from '@/components/reports/TreeImpactReportCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet
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
  const [activeTab, setActiveTab] = useState('preview');

  const latestResult = analysisResults[0];

  // Generate sample growth projections
  const growthProjections = latestResult ? 
    Array.from({ length: 11 }, (_, i) => {
      const year = i;
      const baseHeight = 15;
      const naturalGrowth = baseHeight + (year * 0.8);
      const impactFactor = 0.6; // 40% reduction
      return {
        year,
        naturalHeight: parseFloat(naturalGrowth.toFixed(1)),
        projectedHeight: parseFloat((baseHeight + (year * 0.8 * impactFactor)).toFixed(1)),
        survivalProbability: parseFloat((100 - (year * 3 * (1 - impactFactor))).toFixed(1)),
        carbonLoss: parseFloat((year * 0.5 * (1 - impactFactor)).toFixed(2)),
      };
    }) : [];

  const generatePDF = async () => {
    if (!latestResult || !project) return;

    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = 20;

      // Cover Page
      doc.setFillColor(34, 85, 85);
      doc.rect(0, 0, pageWidth, 80, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ENVIRONMENTAL IMPACT', pageWidth / 2, 35, { align: 'center' });
      doc.text('ASSESSMENT REPORT', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(project.name, pageWidth / 2, 65, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      yPos = 100;
      
      // Report Info Box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.text(`Report ID: EIA-${Date.now().toString(36).toUpperCase()}`, margin + 10, yPos + 12);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, margin + 10, yPos + 24);
      doc.text(`Analysis Type: TREE IMPACT`, margin + 10, yPos + 36);
      doc.text(`Status: ${project.status?.toUpperCase() || 'ACTIVE'}`, pageWidth / 2, yPos + 12);
      doc.text(`Region: ${project.region || 'Not specified'}`, pageWidth / 2, yPos + 24);

      // Page 2: Executive Summary
      doc.addPage();
      yPos = margin;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('1. EXECUTIVE SUMMARY', margin, yPos);
      yPos += 15;
      
      doc.setFontSize(14);
      doc.text('Key Findings', margin, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const findings = [
        `• Total Trees Surveyed: ${latestResult.total_trees.toLocaleString()}`,
        `• Trees Affected: ${latestResult.affected_trees.toLocaleString()} (${latestResult.tree_loss_percentage}%)`,
        `• Trees Safe: ${latestResult.safe_trees.toLocaleString()}`,
        `• Buffer Zone: ${latestResult.buffer_meters} meters`,
      ];
      
      findings.forEach(f => {
        doc.text(f, margin, yPos);
        yPos += 6;
      });
      
      yPos += 10;

      // Impact Categories
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Distribution', margin, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Count', 'Percentage']],
        body: [
          ['Direct Removal', latestResult.affected_trees.toString(), `${latestResult.tree_loss_percentage}%`],
          ['Safe', latestResult.safe_trees.toString(), `${(100 - latestResult.tree_loss_percentage).toFixed(1)}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [34, 85, 85] },
        margin: { left: margin, right: margin },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Page 3: Methodology
      doc.addPage();
      yPos = margin;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('2. METHODOLOGY & PARAMETERS', margin, yPos);
      yPos += 15;

      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value', 'Description']],
        body: [
          ['Buffer Distance', `${latestResult.buffer_meters}m`, 'Impact assessment radius'],
          ['Root Zone Multiplier', '1.5x', 'Root zone = canopy × multiplier'],
          ['Distance Weight', '30%', 'Proximity to development'],
          ['Root Damage Weight', '25%', 'Root zone intersection'],
          ['Shadow Loss Weight', '20%', 'Canopy shadow impact'],
          ['Species Sensitivity', '15%', 'Species vulnerability index'],
          ['Tree Health Weight', '10%', 'Current health condition'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [34, 85, 85] },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Impact Score Formula:', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont('courier', 'normal');
      doc.text('Score = (Distance × 30%) + (Root Damage × 25%) + (Shadow × 20%) +', margin, yPos);
      yPos += 5;
      doc.text('        (Species Sensitivity × 15%) + (Health × 10%)', margin, yPos);

      // Page 4: Recommendations
      doc.addPage();
      yPos = margin;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('3. RECOMMENDATIONS', margin, yPos);
      yPos += 15;

      const recommendations = [
        { priority: 'CRITICAL', action: `Relocate ${Math.round(latestResult.affected_trees * 0.1)} high-value trees before construction` },
        { priority: 'HIGH', action: 'Install root barriers around remaining affected trees' },
        { priority: 'MEDIUM', action: 'Implement monthly health monitoring program' },
        { priority: 'STANDARD', action: `Plant ${latestResult.affected_trees * 3} replacement trees (3:1 ratio)` },
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Priority', 'Recommended Action']],
        body: recommendations.map(r => [r.priority, r.action]),
        theme: 'grid',
        headStyles: { fillColor: [34, 85, 85] },
        columnStyles: {
          0: { cellWidth: 30 },
        },
      });

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount} | Generated by EcoImpact Pro | ${new Date().toLocaleDateString()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`tree-impact-report-${project.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);

      toast({
        title: 'Report Generated',
        description: 'Your comprehensive Tree Impact Report has been downloaded.',
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

    const csvContent = [
      'EcoImpact - Tree Impact Analysis Report',
      `Project,${project.name}`,
      `Report Date,${new Date().toLocaleDateString()}`,
      '',
      'Key Metrics',
      'Metric,Value',
      `Total Trees,${latestResult.total_trees}`,
      `Affected Trees,${latestResult.affected_trees}`,
      `Safe Trees,${latestResult.safe_trees}`,
      `Tree Loss Percentage,${latestResult.tree_loss_percentage}%`,
      `Buffer Zone,${latestResult.buffer_meters} meters`,
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

  // Prepare chart data
  const chartData = {
    totalTrees: latestResult.total_trees,
    affectedTrees: latestResult.affected_trees,
    safeTrees: latestResult.safe_trees,
    directRemoval: Math.round(latestResult.affected_trees * 0.3),
    highImpact: Math.round(latestResult.affected_trees * 0.25),
    mediumImpact: Math.round(latestResult.affected_trees * 0.25),
    lowImpact: Math.round(latestResult.affected_trees * 0.2),
    impactPercentage: latestResult.tree_loss_percentage,
    totalCompensation: latestResult.affected_trees * 2500,
    bySpecies: summary?.speciesBreakdown || {
      'Unknown': { total: latestResult.total_trees, affected: latestResult.affected_trees, safe: latestResult.safe_trees }
    },
    byHealth: summary?.healthBreakdown || {
      'Good': { total: Math.round(latestResult.total_trees * 0.6), affected: Math.round(latestResult.affected_trees * 0.5) },
      'Fair': { total: Math.round(latestResult.total_trees * 0.3), affected: Math.round(latestResult.affected_trees * 0.35) },
      'Poor': { total: Math.round(latestResult.total_trees * 0.1), affected: Math.round(latestResult.affected_trees * 0.15) },
    },
    bySize: {
      'Small (<30cm)': { total: Math.round(latestResult.total_trees * 0.4), affected: Math.round(latestResult.affected_trees * 0.3) },
      'Medium (30-60cm)': { total: Math.round(latestResult.total_trees * 0.35), affected: Math.round(latestResult.affected_trees * 0.35) },
      'Large (60-100cm)': { total: Math.round(latestResult.total_trees * 0.2), affected: Math.round(latestResult.affected_trees * 0.25) },
      'Giant (>100cm)': { total: Math.round(latestResult.total_trees * 0.05), affected: Math.round(latestResult.affected_trees * 0.1) },
    },
    growthProjections,
  };

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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold">Tree Impact Report</h1>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                {project.name}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Comprehensive analysis with charts, projections, and recommendations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
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
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-xs">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Charts
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview">
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
                  <h2 className="text-2xl font-bold text-primary mb-1">EcoImpact Pro</h2>
                  <h3 className="text-xl font-semibold mb-4">Environmental Impact Assessment Report</h3>
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
                    <div className="p-4 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Affected Trees</p>
                      <p className="text-2xl font-bold text-destructive">{latestResult.affected_trees.toLocaleString()}</p>
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
                      <p className="text-sm text-muted-foreground">Compensation Est.</p>
                      <p className="text-xl font-bold">₹{(latestResult.affected_trees * 2500).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Recommendations</h4>
                  <ul className="space-y-2">
                    {[
                      { priority: 'CRITICAL', text: `Relocate ${Math.round(latestResult.affected_trees * 0.1)} high-value heritage trees` },
                      { priority: 'HIGH', text: 'Install root barriers for remaining affected trees' },
                      { priority: 'MEDIUM', text: 'Monthly health monitoring for 12 months' },
                      { priority: 'STANDARD', text: `Plant ${latestResult.affected_trees * 3} replacement trees` },
                    ].map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Badge className={
                          rec.priority === 'CRITICAL' ? 'bg-destructive' :
                          rec.priority === 'HIGH' ? 'bg-orange-500' :
                          rec.priority === 'MEDIUM' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }>
                          {rec.priority}
                        </Badge>
                        <span className="text-sm">{rec.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts">
            <TreeImpactReportCharts data={chartData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
