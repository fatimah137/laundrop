import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function toSafeLines(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || '-'), maxWidth);
}

function withFallback(value) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

export function downloadMlPdfReport({
  title,
  subtitle,
  period,
  generatedAt,
  summaryRows = [],
  tableHead = [],
  tableBody = [],
  notes,
  filename,
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(withFallback(title), margin, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(withFallback(subtitle), margin, 66);

  doc.setTextColor(30, 41, 59);
  doc.text(`Periode: ${withFallback(period)}`, margin, 84);
  doc.text(`Dicetak: ${withFallback(generatedAt)}`, margin, 100);

  autoTable(doc, {
    startY: 118,
    theme: 'grid',
    head: [['Ringkasan', 'Nilai']],
    body: summaryRows.map((row) => [withFallback(row.label), withFallback(row.value)]),
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 6,
      lineColor: [226, 232, 240],
      lineWidth: 1,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 170, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
  });

  const summaryBottom = doc.lastAutoTable?.finalY || 130;

  if (tableHead.length > 0 && tableBody.length > 0) {
    autoTable(doc, {
      startY: summaryBottom + 16,
      theme: 'striped',
      head: [tableHead.map((h) => withFallback(h))],
      body: tableBody.map((row) => row.map((cell) => withFallback(cell))),
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 5,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });
  }

  const tableBottom = doc.lastAutoTable?.finalY || summaryBottom;

  if (notes) {
    const lines = toSafeLines(doc, notes, pageWidth - margin * 2);
    const noteY = Math.min(tableBottom + 24, doc.internal.pageSize.getHeight() - 80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Catatan AI', margin, noteY);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, margin, noteY + 14);
  }

  const safeFilename = filename || `laporan-ml-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
}
