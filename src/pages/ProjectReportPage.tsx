import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useAnalysis } from '@/hooks/useAnalysis';
import { FileText, Download, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


export default function ProjectReportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { analyses, isLoading: analysisLoading } = useAnalysis(projectId);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const latestAnalysis = analyses[0];

  const generatePDF = async () => {
    if (!project || !latestAnalysis) return;

    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Title
      doc.setFontSize(24);
      doc.setTextColor(34, 139, 34);
      doc.text('TerraByte', pageWidth / 2, y, { align: 'center' });
      y += 10;

      doc.setFontSize(16);
      doc.setTextColor(100, 100, 100);
      doc.text('Wildlife Corridor Analysis Report', pageWidth / 2, y, { align: 'center' });
      y += 20;

      // Project Info
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Project: ${project.name}`, 20, y);
      y += 8;

      if (project.region) {
        doc.setFontSize(11);
        doc.text(`Region: ${project.region}`, 20, y);
        y += 6;
      }

      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
      y += 15;

      // Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(34, 139, 34);
      doc.text('Executive Summary', 20, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const summaryText = latestAnalysis.explanations?.overview || 'Analysis completed successfully.';
      const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 40);
      doc.text(summaryLines, 20, y);
      y += summaryLines.length * 5 + 10;

      // Species Summary
      const results = latestAnalysis.results as any;
      if (results.species_summary) {
        doc.setFontSize(14);
        doc.setTextColor(34, 139, 34);
        doc.text('Data Overview', 20, y);
        y += 10;

        const speciesData = [
          ['Total Observations', String(results.species_summary.total_sightings)],
          ['Species Count', String(Object.keys(results.species_summary.species_breakdown || {}).length)],
          ['Area Covered', `${results.species_summary.area_covered_sqkm} sq.km`],
        ];

        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value']],
          body: speciesData,
          theme: 'striped',
          headStyles: { fillColor: [34, 139, 34] },
          margin: { left: 20, right: 20 },
        });

        y = (doc as any).lastAutoTable.finalY + 15;
      }

      // Fragmentation
      if (results.fragmentation) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(34, 139, 34);
        doc.text('Habitat Fragmentation Analysis', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const fragText = latestAnalysis.explanations?.fragmentation || '';
        const fragLines = doc.splitTextToSize(fragText, pageWidth - 40);
        doc.text(fragLines, 20, y);
        y += fragLines.length * 5 + 10;

        const fragData = [
          ['Habitat Patches', String(results.fragmentation.patch_count)],
          ['Average Patch Size', `${results.fragmentation.avg_patch_size_sqkm} sq.km`],
          ['Fragmentation Index', String(results.fragmentation.fragmentation_index)],
          ['Fragmentation Level', results.fragmentation.fragmentation_level],
        ];

        autoTable(doc, {
          startY: y,
          head: [['Metric', 'Value']],
          body: fragData,
          theme: 'striped',
          headStyles: { fillColor: [34, 139, 34] },
          margin: { left: 20, right: 20 },
        });

        y = (doc as any).lastAutoTable.finalY + 15;
      }

      // Connectivity
      if (results.connectivity) {
        if (y > 220) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(34, 139, 34);
        doc.text('Connectivity Analysis', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const connText = latestAnalysis.explanations?.connectivity || '';
        const connLines = doc.splitTextToSize(connText, pageWidth - 40);
        doc.text(connLines, 20, y);
        y += connLines.length * 5 + 10;

        doc.setFontSize(12);
        doc.setTextColor(34, 139, 34);
        doc.text(`Connectivity Score: ${results.connectivity.score}/100`, 20, y);
        y += 15;
      }

      // Recommendations
      if (results.recommendations && results.recommendations.length > 0) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(34, 139, 34);
        doc.text('Recommendations', 20, y);
        y += 10;

        const recData = results.recommendations.map((rec: any, idx: number) => [
          String(idx + 1),
          rec.action,
          rec.priority,
          rec.description,
        ]);

        autoTable(doc, {
          startY: y,
          head: [['#', 'Action', 'Priority', 'Description']],
          body: recData,
          theme: 'striped',
          headStyles: { fillColor: [34, 139, 34] },
          margin: { left: 20, right: 20 },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 40 },
            2: { cellWidth: 25 },
            3: { cellWidth: 'auto' },
          },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | Generated by TerraByte Wildlife Corridor Planning System`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      doc.save(`${project.name.replace(/\s+/g, '_')}_Report.pdf`);
      setGenerated(true);
      setTimeout(() => setGenerated(false), 3000);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (projectsLoading || analysisLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Project Not Found</CardTitle>
              <CardDescription>The project you're looking for doesn't exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/projects')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/project/${projectId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold mb-2">Generate Report</h1>
          <p className="text-muted-foreground">
            Generate a comprehensive PDF report for <span className="font-medium">{project.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Generator */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {project.name} Report
              </CardTitle>
              <CardDescription>
                Generate a PDF report based on the latest analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!latestAnalysis ? (
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    No analysis found for this project. Run an analysis first.
                  </p>
                  <Button variant="outline" onClick={() => navigate(`/project/${projectId}`)}>
                    Go to Project
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium mb-1">Analysis Available</p>
                    <p className="text-xs text-muted-foreground">
                      Type: {latestAnalysis.analysis_type} •{' '}
                      Created: {new Date(latestAnalysis.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    onClick={generatePDF}
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : generated ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Downloaded!
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate & Download PDF
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">Report Contents</CardTitle>
              <CardDescription>
                Your report will include the following sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { title: 'Cover Page', desc: 'Project name, region, and generation date' },
                  { title: 'Executive Summary', desc: 'Overview of the analysis and key findings' },
                  { title: 'Data Overview', desc: 'Species counts, area coverage, and observations' },
                  { title: 'Fragmentation Analysis', desc: 'Habitat patch analysis and fragmentation levels' },
                  { title: 'Connectivity Score', desc: 'How well habitat patches are connected' },
                  { title: 'Risk Zones', desc: 'Identified areas requiring attention' },
                  { title: 'Recommendations', desc: 'Actionable steps for conservation' },
                ].map((section, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
