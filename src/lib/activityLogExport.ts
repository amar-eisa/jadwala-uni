import { ActivityLog } from '@/hooks/useActivityLog';
import jsPDF from 'jspdf';

const ACTION_LABELS: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  activate: 'تفعيل',
  deactivate: 'إلغاء تفعيل',
  copy: 'نسخ',
  generate: 'توليد',
};

const ENTITY_LABELS: Record<string, string> = {
  room: 'قاعة',
  professor: 'دكتور',
  subject: 'مادة',
  group: 'مجموعة',
  schedule: 'جدول',
  time_slot: 'فترة زمنية',
  schedule_entry: 'حصة',
  saved_schedule: 'جدول محفوظ',
};

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

export function exportActivityLogsToCSV(logs: ActivityLog[]) {
  const BOM = '\uFEFF';
  const header = ['#', 'العملية', 'الكيان', 'التفاصيل', 'التاريخ'];
  const rows = logs.map((log, i) => [
    String(i + 1),
    ACTION_LABELS[log.action] || log.action,
    ENTITY_LABELS[log.entity_type] || log.entity_type,
    JSON.stringify(log.details || {}).replace(/"/g, '""'),
    new Date(log.created_at).toLocaleString('ar-SA'),
  ]);

  const escape = (v: string) => v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
  const csv = BOM + [header.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  downloadFile(csv, 'سجل-النشاطات.csv', 'text/csv;charset=utf-8;');
}

export function exportActivityLogsToExcel(logs: ActivityLog[]) {
  const escapeXml = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const header = ['#', 'العملية', 'الكيان', 'التفاصيل', 'التاريخ'];
  
  const buildRow = (cells: string[], bold = false) => {
    const style = bold ? ' ss:StyleID="header"' : '';
    return '<Row>' + cells.map(c => `<Cell${style}><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('') + '</Row>';
  };

  const xmlRows = [
    '<Row><Cell ss:StyleID="title"><Data ss:Type="String">سجل النشاطات</Data></Cell></Row>',
    buildRow(header, true),
    ...logs.map((log, i) => buildRow([
      String(i + 1),
      ACTION_LABELS[log.action] || log.action,
      ENTITY_LABELS[log.entity_type] || log.entity_type,
      JSON.stringify(log.details || {}),
      new Date(log.created_at).toLocaleString('ar-SA'),
    ])),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="12"/></Style>
    <Style ss:ID="title"><Font ss:Size="16" ss:Bold="1"/><Alignment ss:Horizontal="Center"/></Style>
    <Style ss:ID="header"><Font ss:Size="12" ss:Bold="1"/><Interior ss:Color="#4472C4" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1"/><Alignment ss:Horizontal="Center"/></Style>
  </Styles>
  <Worksheet ss:Name="سجل النشاطات">
    <Table>${xmlRows.join('\n')}</Table>
  </Worksheet>
</Workbook>`;

  downloadFile(xml, 'سجل-النشاطات.xls', 'application/vnd.ms-excel');
}

export function exportActivityLogsToPDF(logs: ActivityLog[]) {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Title
  doc.setFontSize(18);
  doc.text('Activity Log Report', 148, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 148, 22, { align: 'center' });

  // Table
  let y = 35;
  const colWidths = [15, 40, 40, 120, 55];
  const headers = ['#', 'Action', 'Entity', 'Details', 'Date'];

  // Header row
  doc.setFillColor(68, 114, 196);
  doc.rect(10, y - 6, 270, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  let x = 12;
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });

  // Data rows
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  y += 8;

  logs.forEach((log, i) => {
    if (y > 190) {
      doc.addPage();
      y = 20;
    }

    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(10, y - 5, 270, 7, 'F');
    }

    x = 12;
    const row = [
      String(i + 1),
      ACTION_LABELS[log.action] || log.action,
      ENTITY_LABELS[log.entity_type] || log.entity_type,
      JSON.stringify(log.details || {}).slice(0, 80),
      new Date(log.created_at).toLocaleString(),
    ];
    row.forEach((cell, ci) => {
      doc.text(cell.slice(0, 60), x, y);
      x += colWidths[ci];
    });
    y += 7;
  });

  doc.save('activity-log.pdf');
}
