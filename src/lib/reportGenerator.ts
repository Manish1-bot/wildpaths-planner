/**
 * Professional Report Generator
 * Generates comprehensive PDF reports with all required sections
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
  project: {
    name: string;
    description?: string;
    region?: string;
    startDate: string;
    status: string;
  };
  analysis: {
    type: 'tree_impact' | 'corridor' | 'combined';
    date: string;
    parameters: {
      bufferDistance?: number;
      rootZoneMultiplier?: number;
      season?: string;
    };
  };
  trees?: {
    total: number;
    affected: number;
    safe: number;
    directRemoval: number;
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
    impactPercentage: number;
    totalCompensation: number;
    bySpecies: Array<{ species: string; total: number; affected: number }>;
    byHealth: Array<{ status: string; count: number }>;
    bySize: Array<{ category: string; count: number }>;
    treeDetails?: Array<{
      id: string;
      species: string;
      height: number;
      dbh: number;
      health: string;
      impactScore: number;
      category: string;
      compensation: number;
      recommendation: string;
    }>;
  };
  corridor?: {
    name: string;
    length: number;
    width: number;
    connectivityScore: number;
    barriers: number;
    interventions: Array<{
      type: string;
      location: string;
      cost: number;
    }>;
  };
  mitigation?: {
    measures: Array<{
      type: string;
      priority: string;
      description: string;
      cost: number;
      timeline: string;
    }>;
    totalCost: number;
    timelineMonths: number;
  };
}

export function generateProfessionalReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper functions
  const addHeader = (text: string, size: number = 16) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, yPos);
    yPos += size * 0.5;
  };

  const addText = (text: string, size: number = 10) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, yPos);
    yPos += lines.length * size * 0.4 + 2;
  };

  const addSpacer = (height: number = 10) => {
    yPos += height;
  };

  const checkPageBreak = (neededHeight: number = 40) => {
    if (yPos + neededHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // ======= COVER PAGE =======
  doc.setFillColor(34, 85, 85);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ENVIRONMENTAL IMPACT', pageWidth / 2, 35, { align: 'center' });
  doc.text('ASSESSMENT REPORT', pageWidth / 2, 48, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(data.project.name, pageWidth / 2, 65, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  yPos = 100;
  
  // Report Info Box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.text(`Report ID: EIA-${Date.now().toString(36).toUpperCase()}`, margin + 10, yPos + 12);
  doc.text(`Date: ${data.analysis.date}`, margin + 10, yPos + 24);
  doc.text(`Analysis Type: ${data.analysis.type.replace('_', ' ').toUpperCase()}`, margin + 10, yPos + 36);
  doc.text(`Status: ${data.project.status.toUpperCase()}`, pageWidth / 2, yPos + 12);
  doc.text(`Region: ${data.project.region || 'Not specified'}`, pageWidth / 2, yPos + 24);
  
  yPos = 170;
  
  // Project Description
  if (data.project.description) {
    addHeader('PROJECT OVERVIEW', 14);
    addSpacer(5);
    addText(data.project.description);
  }
  
  // ======= PAGE 2: EXECUTIVE SUMMARY =======
  doc.addPage();
  yPos = margin;
  
  addHeader('1. EXECUTIVE SUMMARY', 18);
  addSpacer(10);
  
  if (data.trees) {
    addHeader('Key Findings', 14);
    addSpacer(5);
    
    const findings = [
      `• Total Trees Surveyed: ${data.trees.total.toLocaleString()}`,
      `• Trees Affected: ${data.trees.affected.toLocaleString()} (${data.trees.impactPercentage.toFixed(1)}%)`,
      `• Trees Safe: ${data.trees.safe.toLocaleString()}`,
      `• Estimated Compensation: ₹${data.trees.totalCompensation.toLocaleString()}`,
    ];
    
    findings.forEach(f => {
      addText(f, 11);
    });
    
    addSpacer(10);
    
    // Critical Observations
    addHeader('Critical Observations', 14);
    addSpacer(5);
    
    const observations = [
      `⚠️ HIGH PRIORITY: ${data.trees.directRemoval} trees require immediate relocation`,
      `⚠️ ${data.trees.highImpact} trees need protective measures`,
      `📊 Most affected species: ${data.trees.bySpecies[0]?.species || 'N/A'}`,
    ];
    
    observations.forEach(o => {
      addText(o, 11);
    });
  }
  
  // ======= PAGE 3: METHODOLOGY =======
  doc.addPage();
  yPos = margin;
  
  addHeader('2. METHODOLOGY & PARAMETERS', 18);
  addSpacer(10);
  
  addHeader('Analysis Parameters', 14);
  addSpacer(5);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value', 'Description']],
    body: [
      ['Buffer Distance', `${data.analysis.parameters.bufferDistance || 100}m`, 'Impact assessment radius'],
      ['Root Zone Multiplier', `${data.analysis.parameters.rootZoneMultiplier || 1.5}x`, 'Root zone = canopy × multiplier'],
      ['Season', data.analysis.parameters.season || 'Summer', 'Shadow analysis season'],
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
  
  addHeader('Impact Score Formula', 14);
  addSpacer(5);
  doc.setFontSize(9);
  doc.setFont('courier', 'normal');
  doc.text('Impact Score = (Distance × 30%) + (Root Damage × 25%) + (Shadow × 20%) +', margin, yPos);
  yPos += 5;
  doc.text('               (Species Sensitivity × 15%) + (Health × 10%)', margin, yPos);
  doc.setFont('helvetica', 'normal');
  
  // ======= PAGE 4: TREE-BY-TREE ANALYSIS =======
  if (data.trees?.treeDetails && data.trees.treeDetails.length > 0) {
    doc.addPage();
    yPos = margin;
    
    addHeader('3. TREE-BY-TREE ANALYSIS', 18);
    addSpacer(10);
    
    const tableData = data.trees.treeDetails.slice(0, 30).map(tree => [
      tree.id,
      tree.species,
      `${tree.height}m`,
      `${tree.dbh}cm`,
      tree.health,
      `${tree.impactScore}`,
      tree.category,
      `₹${tree.compensation.toLocaleString()}`,
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['ID', 'Species', 'Height', 'DBH', 'Health', 'Score', 'Category', 'Compensation']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 85, 85], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 30 },
        6: { cellWidth: 25 },
      },
    });
  }
  
  // ======= PAGE 5: SPECIES BREAKDOWN =======
  if (data.trees?.bySpecies && data.trees.bySpecies.length > 0) {
    doc.addPage();
    yPos = margin;
    
    addHeader('4. SPECIES-WISE IMPACT ANALYSIS', 18);
    addSpacer(10);
    
    const speciesData = data.trees.bySpecies.map(s => [
      s.species,
      s.total.toString(),
      s.affected.toString(),
      (s.total - s.affected).toString(),
      `${((s.affected / s.total) * 100).toFixed(1)}%`,
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Species', 'Total', 'Affected', 'Safe', 'Impact %']],
      body: speciesData,
      theme: 'striped',
      headStyles: { fillColor: [34, 85, 85] },
    });
  }
  
  // ======= PAGE 6: MITIGATION RECOMMENDATIONS =======
  if (data.mitigation) {
    doc.addPage();
    yPos = margin;
    
    addHeader('5. MITIGATION RECOMMENDATIONS', 18);
    addSpacer(10);
    
    // Summary Box
    doc.setFillColor(34, 85, 85);
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');
    doc.setFontSize(12);
    doc.text(`Total Implementation Cost: ₹${data.mitigation.totalCost.toLocaleString()}`, margin + 10, yPos + 12);
    doc.text(`Timeline: ${data.mitigation.timelineMonths} months`, margin + 10, yPos + 24);
    doc.setTextColor(0, 0, 0);
    
    yPos += 45;
    
    addHeader('Recommended Measures', 14);
    addSpacer(5);
    
    const measureData = data.mitigation.measures.map(m => [
      m.type.toUpperCase(),
      m.priority.toUpperCase(),
      m.description,
      `₹${m.cost.toLocaleString()}`,
      m.timeline,
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Type', 'Priority', 'Description', 'Cost', 'Timeline']],
      body: measureData,
      theme: 'grid',
      headStyles: { fillColor: [34, 85, 85] },
      columnStyles: {
        2: { cellWidth: 60 },
      },
    });
  }
  
  // ======= FINAL PAGE: APPROVALS =======
  doc.addPage();
  yPos = margin;
  
  addHeader('6. APPROVALS & SIGNATURES', 18);
  addSpacer(20);
  
  const approvalBoxes = [
    { title: 'Prepared By', role: 'Environmental Analyst' },
    { title: 'Reviewed By', role: 'Project Manager' },
    { title: 'Approved By', role: 'Director' },
  ];
  
  approvalBoxes.forEach((box, idx) => {
    checkPageBreak(60);
    
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 45, 'S');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(box.title, margin + 10, yPos + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(box.role, margin + 10, yPos + 22);
    
    doc.text('Signature: ________________', margin + 10, yPos + 36);
    doc.text('Date: ________________', pageWidth / 2, yPos + 36);
    
    yPos += 55;
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
  
  return doc;
}

export function downloadReport(data: ReportData, filename?: string) {
  const doc = generateProfessionalReport(data);
  const name = filename || `EcoImpact_Report_${Date.now()}.pdf`;
  doc.save(name);
}

export function getReportBlob(data: ReportData): Blob {
  const doc = generateProfessionalReport(data);
  return doc.output('blob');
}
