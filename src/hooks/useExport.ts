import { ScheduleEntry, DayOfWeek, DAY_LABELS } from '@/types/database';

const DAYS_ORDER: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface ExportData {
  entries: ScheduleEntry[];
  timeSlots: TimeSlot[];
  title?: string;
}

function buildGrid(data: ExportData) {
  const { entries, timeSlots, title } = data;

  // Deduplicate time slots
  const seen = new Set<string>();
  const uniqueSlots = timeSlots
    .filter(s => {
      const key = `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const header = ['الفترة', ...DAYS_ORDER.map(d => DAY_LABELS[d])];

  const rows = uniqueSlots.map(slot => {
    const timeLabel = `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`;
    const cells = DAYS_ORDER.map(day => {
      const dayEntries = entries.filter(e => {
        const ts = e.time_slot;
        return ts?.day === day &&
          ts?.start_time.slice(0, 5) === slot.start_time.slice(0, 5) &&
          ts?.end_time.slice(0, 5) === slot.end_time.slice(0, 5);
      });
      if (dayEntries.length === 0) return '';
      return dayEntries.map(e => {
        const parts = [e.subject?.name, e.subject?.professor?.name, e.room?.name].filter(Boolean);
        return parts.join(' | ');
      }).join('\n');
    });
    return [timeLabel, ...cells];
  });

  return { header, rows, title };
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

export function exportToCSV(data: ExportData) {
  const { header, rows, title } = buildGrid(data);

  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvRows: string[] = [];
  if (title) csvRows.push(escapeCSV(title));
  csvRows.push(header.map(escapeCSV).join(','));
  rows.forEach(row => csvRows.push(row.map(escapeCSV).join(',')));

  // UTF-8 BOM for Arabic support in Excel
  const BOM = '\uFEFF';
  const csvContent = BOM + csvRows.join('\n');
  const filename = (title || 'الجدول-الدراسي') + '.csv';
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToExcel(data: ExportData) {
  const { header, rows, title } = buildGrid(data);

  const escapeXml = (val: string) => val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const buildRow = (cells: string[], bold = false) => {
    return '<Row>' + cells.map(cell => {
      const style = bold ? ' ss:StyleID="header"' : '';
      return `<Cell${style}><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
    }).join('') + '</Row>';
  };

  const xmlRows: string[] = [];
  if (title) {
    xmlRows.push(`<Row><Cell ss:StyleID="title"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row>`);
  }
  xmlRows.push(buildRow(header, true));
  rows.forEach(row => xmlRows.push(buildRow(row)));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="12"/></Style>
    <Style ss:ID="title"><Font ss:Size="16" ss:Bold="1"/><Alignment ss:Horizontal="Center"/></Style>
    <Style ss:ID="header"><Font ss:Size="12" ss:Bold="1"/><Interior ss:Color="#4472C4" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1"/><Alignment ss:Horizontal="Center"/></Style>
  </Styles>
  <Worksheet ss:Name="الجدول">
    <Table>${xmlRows.join('\n')}</Table>
  </Worksheet>
</Workbook>`;

  const filename = (title || 'الجدول-الدراسي') + '.xls';
  downloadFile(xml, filename, 'application/vnd.ms-excel');
}
