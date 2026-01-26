import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { UserWithDetails } from '@/hooks/useAdmin';

const PLAN_LABELS: Record<string, string> = {
  free: 'مجاني',
  basic: 'أساسي',
  premium: 'متميز',
  enterprise: 'مؤسسي',
};

export function generateInvoicePDF(user: UserWithDetails) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set up font (using default font which supports basic Latin characters)
  doc.setFont('helvetica');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246); // Primary blue color
  doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const invoiceDate = format(new Date(), 'dd/MM/yyyy');
  
  doc.text(`Invoice Number: ${invoiceNumber}`, margin, yPos);
  doc.text(`Date: ${invoiceDate}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 20;

  // Company info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('University Scheduling System', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  doc.text('Scheduling Management Platform', margin, yPos);
  yPos += 20;

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Bill To section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 8;
  doc.text(user.full_name || 'N/A', margin, yPos);
  yPos += 6;
  doc.text(user.email || 'N/A', margin, yPos);
  yPos += 20;

  // Subscription details table header
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos - 2, pageWidth - (margin * 2), 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin + 5, yPos + 5);
  doc.text('Period', pageWidth / 2, yPos + 5, { align: 'center' });
  doc.text('Amount', pageWidth - margin - 5, yPos + 5, { align: 'right' });
  yPos += 15;

  // Subscription row
  doc.setFont('helvetica', 'normal');
  const planName = PLAN_LABELS[user.subscription?.plan_name || 'free'] || user.subscription?.plan_name;
  doc.text(`${planName} Plan Subscription`, margin + 5, yPos);
  
  const startDate = user.subscription?.start_date 
    ? format(new Date(user.subscription.start_date), 'dd/MM/yyyy')
    : 'N/A';
  const endDate = user.subscription?.end_date 
    ? format(new Date(user.subscription.end_date), 'dd/MM/yyyy')
    : 'Ongoing';
  doc.text(`${startDate} - ${endDate}`, pageWidth / 2, yPos, { align: 'center' });
  
  const amount = user.subscription?.price || 0;
  const currency = user.subscription?.currency || 'USD';
  doc.text(`${amount.toFixed(2)} ${currency}`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 20;

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', pageWidth - margin - 50, yPos);
  doc.text(`${amount.toFixed(2)} ${currency}`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 30;

  // Status
  const status = user.subscription?.status || 'active';
  const statusLabels: Record<string, string> = {
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    expired: 'EXPIRED',
    cancelled: 'CANCELLED',
  };
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subscription Status: ${statusLabels[status] || status}`, margin, yPos);
  yPos += 20;

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for your subscription!', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text('This is a computer-generated invoice.', pageWidth / 2, yPos, { align: 'center' });

  // Save the PDF
  const fileName = `invoice-${user.email?.split('@')[0] || 'user'}-${invoiceNumber}.pdf`;
  doc.save(fileName);
}
