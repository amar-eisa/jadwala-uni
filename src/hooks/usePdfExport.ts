import { useCallback, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = useCallback(async (
    elementId: string,
    options: ExportOptions = {}
  ) => {
    const {
      filename = 'timetable',
      title = 'الجداول الدراسية',
      orientation = 'landscape'
    } = options;

    setIsExporting(true);

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate dimensions
      const imgWidth = orientation === 'landscape' ? 297 : 210; // A4 dimensions in mm
      const pageHeight = orientation === 'landscape' ? 210 : 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      // Add title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (imgWidth - titleWidth) / 2, 15);

      // Add date
      const date = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const dateWidth = pdf.getTextWidth(date);
      pdf.text(date, (imgWidth - dateWidth) / 2, 22);

      // Add the timetable image
      const imgData = canvas.toDataURL('image/png');
      const startY = 28;
      const availableHeight = pageHeight - startY - 10;
      
      // Scale image to fit
      let finalImgHeight = imgHeight;
      let finalImgWidth = imgWidth - 20; // 10mm margin on each side
      
      if (finalImgHeight > availableHeight) {
        const scale = availableHeight / finalImgHeight;
        finalImgHeight = availableHeight;
        finalImgWidth = finalImgWidth * scale;
      }

      const xOffset = (imgWidth - finalImgWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, startY, finalImgWidth, finalImgHeight);

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
