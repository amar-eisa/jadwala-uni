import { ProfessorWorkload, RoomUtilization, SubjectAllocation, Conflict, Gap } from '@/hooks/useReports';
import { DAY_LABELS } from '@/types/database';
import jsPDF from 'jspdf';

interface ReportsData {
  workloadData: ProfessorWorkload[];
  utilizationData: RoomUtilization[];
  subjectAllocationData: SubjectAllocation[];
  conflictsData: Conflict[];
  gapsData: Gap[];
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const escapeCSV = (val: string) => {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
};

const escapeXml = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildCSVSection(title: string, headers: string[], rows: string[][]): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(escapeCSV(title));
  lines.push(headers.map(escapeCSV).join(','));
  rows.forEach(row => lines.push(row.map(escapeCSV).join(',')));
  return lines.join('\n');
}

export function exportReportsToCSV(data: ReportsData) {
  const BOM = '\uFEFF';
  let csv = BOM;
  csv += escapeCSV('تقارير النظام - ' + new Date().toLocaleDateString('ar-SA'));

  // Workload
  csv += buildCSVSection(
    'عبء العمل الأسبوعي للأساتذة',
    ['الأستاذ', 'الساعات الأسبوعية', 'المحاضرات المجدولة', 'المواد'],
    data.workloadData.map(w => [w.name, String(w.totalHours), String(w.lectureCount), w.subjects.join('، ')])
  );

  // Rooms
  csv += buildCSVSection(
    'استخدام القاعات',
    ['القاعة', 'النوع', 'الفترات المستخدمة', 'الفترات الفارغة', 'نسبة الإشغال'],
    data.utilizationData.map(r => [r.name, r.type, String(r.usedSlots), String(r.freeSlots), `${r.percentage}%`])
  );

  // Subjects
  csv += buildCSVSection(
    'توزيع المواد',
    ['المادة', 'الدفعة', 'الأستاذ', 'الساعات المطلوبة', 'المجدولة', 'الحالة'],
    data.subjectAllocationData.map(s => [s.subjectName, s.groupName, s.professorName, String(s.requiredHours), String(s.allocatedHours), s.isFullyScheduled ? 'مكتمل' : `ناقص ${s.deficit}`])
  );

  // Conflicts
  csv += buildCSVSection(
    'التعارضات',
    ['النوع', 'الاسم', 'اليوم', 'الوقت', 'المواد المتعارضة'],
    data.conflictsData.map(c => [c.type === 'professor' ? 'أستاذ' : 'قاعة', c.entityName, DAY_LABELS[c.day as keyof typeof DAY_LABELS] || c.day, c.time, c.subjects.join('، ')])
  );

  // Gaps
  csv += buildCSVSection(
    'الفجوات الزمنية',
    ['الدفعة', 'اليوم', 'عدد الفترات', 'من', 'إلى'],
    data.gapsData.map(g => [g.groupName, DAY_LABELS[g.day as keyof typeof DAY_LABELS] || g.day, String(g.gapSize), g.fromTime, g.toTime])
  );

  downloadFile(csv, 'تقارير-النظام.csv', 'text/csv;charset=utf-8;');
}

function buildExcelSheet(title: string, headers: string[], rows: string[][]): string {
  const buildRow = (cells: string[], style = '') => 
    '<Row>' + cells.map(c => `<Cell${style}><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('') + '</Row>';

  return [
    `<Row><Cell ss:StyleID="title"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row>`,
    buildRow(headers, ' ss:StyleID="header"'),
    ...rows.map(row => buildRow(row)),
    '<Row></Row>',
  ].join('\n');
}

export function exportReportsToExcel(data: ReportsData) {
  let sheets = '';

  sheets += buildExcelSheet(
    'عبء الأساتذة',
    ['الأستاذ', 'الساعات', 'المحاضرات', 'المواد'],
    data.workloadData.map(w => [w.name, String(w.totalHours), String(w.lectureCount), w.subjects.join('، ')])
  );

  sheets += buildExcelSheet(
    'استخدام القاعات',
    ['القاعة', 'النوع', 'مستخدمة', 'فارغة', 'الإشغال'],
    data.utilizationData.map(r => [r.name, r.type, String(r.usedSlots), String(r.freeSlots), `${r.percentage}%`])
  );

  sheets += buildExcelSheet(
    'توزيع المواد',
    ['المادة', 'الدفعة', 'الأستاذ', 'المطلوب', 'المجدول', 'الحالة'],
    data.subjectAllocationData.map(s => [s.subjectName, s.groupName, s.professorName, String(s.requiredHours), String(s.allocatedHours), s.isFullyScheduled ? 'مكتمل' : `ناقص ${s.deficit}`])
  );

  sheets += buildExcelSheet(
    'التعارضات',
    ['النوع', 'الاسم', 'اليوم', 'الوقت', 'المواد'],
    data.conflictsData.map(c => [c.type === 'professor' ? 'أستاذ' : 'قاعة', c.entityName, DAY_LABELS[c.day as keyof typeof DAY_LABELS] || c.day, c.time, c.subjects.join('، ')])
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="12"/></Style>
    <Style ss:ID="title"><Font ss:Size="16" ss:Bold="1"/><Alignment ss:Horizontal="Center"/></Style>
    <Style ss:ID="header"><Font ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#4472C4" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
  </Styles>
  <Worksheet ss:Name="التقارير">
    <Table>${sheets}</Table>
  </Worksheet>
</Workbook>`;

  downloadFile(xml, 'تقارير-النظام.xls', 'application/vnd.ms-excel');
}

export function exportReportsToPDF(data: ReportsData) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  const addTitle = (text: string) => {
    if (y > 170) { doc.addPage(); y = 15; }
    doc.setFontSize(14);
    doc.setTextColor(68, 114, 196);
    doc.text(text, pageW / 2, y, { align: 'center' });
    y += 10;
  };

  const addTable = (headers: string[], rows: string[][], colWidths: number[]) => {
    // Header
    doc.setFillColor(68, 114, 196);
    doc.rect(10, y - 5, pageW - 20, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    let x = 12;
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
    y += 8;

    // Rows
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    rows.forEach((row, ri) => {
      if (y > 185) { doc.addPage(); y = 15; }
      if (ri % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(10, y - 4, pageW - 20, 6, 'F');
      }
      x = 12;
      row.forEach((cell, ci) => { doc.text(cell.slice(0, 50), x, y); x += colWidths[ci]; });
      y += 6;
    });
    y += 5;
  };

  // Main title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('System Reports', pageW / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, y, { align: 'center' });
  y += 12;

  // Workload
  addTitle('Professor Workload');
  addTable(
    ['Professor', 'Weekly Hours', 'Lectures', 'Subjects'],
    data.workloadData.map(w => [w.name, String(w.totalHours), String(w.lectureCount), w.subjects.join(', ')]),
    [50, 35, 35, 150]
  );

  // Rooms
  addTitle('Room Utilization');
  addTable(
    ['Room', 'Type', 'Used', 'Free', 'Utilization'],
    data.utilizationData.map(r => [r.name, r.type, String(r.usedSlots), String(r.freeSlots), `${r.percentage}%`]),
    [50, 40, 35, 35, 40]
  );

  // Subjects
  addTitle('Subject Allocation');
  addTable(
    ['Subject', 'Group', 'Professor', 'Required', 'Allocated', 'Status'],
    data.subjectAllocationData.map(s => [s.subjectName, s.groupName, s.professorName, String(s.requiredHours), String(s.allocatedHours), s.isFullyScheduled ? 'Complete' : `Missing ${s.deficit}`]),
    [45, 40, 45, 30, 30, 35]
  );

  // Conflicts
  if (data.conflictsData.length > 0) {
    addTitle('Conflicts');
    addTable(
      ['Type', 'Name', 'Day', 'Time', 'Subjects'],
      data.conflictsData.map(c => [c.type === 'professor' ? 'Professor' : 'Room', c.entityName, c.day, c.time, c.subjects.join(', ')]),
      [35, 45, 40, 50, 100]
    );
  }

  doc.save('system-reports.pdf');
}
