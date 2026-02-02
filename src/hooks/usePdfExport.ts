import { useCallback, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import connectLogo from '@/assets/connect-logo.png';

interface ExportOptions {
  filename?: string;
  title?: string;
  groupName?: string;
  orientation?: 'portrait' | 'landscape';
  universityLogoUrl?: string | null;
  universityName?: string | null;
}

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = useCallback(async (
    elementId: string,
    options: ExportOptions = {}
  ) => {
    const {
      filename = 'timetable',
      groupName,
      orientation = 'landscape',
      universityLogoUrl,
      universityName
    } = options;

    setIsExporting(true);

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Format date in Arabic
      const date = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });

      // Generate title based on group name
      const title = groupName 
        ? `جدول المحاضرات لدفعة: ${groupName}`
        : 'الجداول الدراسية';

      // Create wrapper element with all content
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        width: 1123px;
        background: white;
        padding: 30px;
        direction: rtl;
        font-family: 'Cairo', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif;
        position: absolute;
        left: -9999px;
        top: 0;
      `;

      // University logo HTML (if available)
      const universityLogoHtml = universityLogoUrl 
        ? `<img src="${universityLogoUrl}" width="70" height="70" style="object-fit: contain;" crossorigin="anonymous" />`
        : '';

      // University name HTML (if available)
      const universityNameHtml = universityName
        ? `<p style="font-size: 12px; color: #6b7280; margin-top: 4px;">${universityName}</p>`
        : '';

      // Create header with university logo
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e5e7eb;
      `;
      header.innerHTML = `
        <div style="width: 80px; text-align: right;">
          ${universityLogoHtml}
        </div>
        <div style="flex: 1; text-align: center;">
          <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">
            ${title}
          </h1>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">
            ${date}
          </p>
          ${universityNameHtml}
        </div>
        <div style="width: 80px;"></div>
      `;

      // Clone the table element
      const tableClone = element.cloneNode(true) as HTMLElement;
      tableClone.style.cssText = `
        width: 100%;
        margin: 0;
      `;

      // Create footer
      const footer = document.createElement('div');
      footer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 15px;
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
        direction: rtl;
      `;
      footer.innerHTML = `
        <img src="${connectLogo}" width="50" height="40" style="object-fit: contain;" />
        <div style="flex: 1;">
          <p style="margin: 0; font-size: 13px; color: #374151; font-weight: 500;">
            جميع الحقوق محفوظة
          </p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280;">
            للتواصل: amareisa.info@gmail.com - +294 128150105
          </p>
        </div>
      `;

      // Assemble wrapper
      wrapper.appendChild(header);
      wrapper.appendChild(tableClone);
      wrapper.appendChild(footer);

      // Add to document temporarily
      document.body.appendChild(wrapper);

      // Convert to canvas
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
      });

      // Remove wrapper from document
      document.body.removeChild(wrapper);

      // A4 dimensions in mm
      const pdfWidth = orientation === 'landscape' ? 297 : 210;
      const pdfHeight = orientation === 'landscape' ? 210 : 297;

      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      // Calculate image dimensions to fit A4
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // If image is taller than page, scale it down
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      
      if (imgHeight > pdfHeight) {
        const scale = pdfHeight / imgHeight;
        finalHeight = pdfHeight;
        finalWidth = imgWidth * scale;
      }

      // Center the image on the page
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      // Add the image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      // Save the PDF
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportToPdf, isExporting };
}
