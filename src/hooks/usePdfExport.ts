import { useCallback, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  title?: string;
  groupName?: string;
  orientation?: 'portrait' | 'landscape';
}

// Connect logo as base64 - will be loaded dynamically
async function loadConnectLogoBase64(): Promise<string> {
  try {
    const response = await fetch('/src/assets/connect-logo.png');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load Connect logo:', error);
    return '';
  }
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
      orientation = 'landscape'
    } = options;

    // Generate title based on group name
    const title = groupName 
      ? `جدول المحاضرات لدفعة: ${groupName}`
      : 'الجداول الدراسية';

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

      // A4 dimensions in mm
      const imgWidth = orientation === 'landscape' ? 297 : 210;
      const pageHeight = orientation === 'landscape' ? 210 : 297;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      // Header section
      const headerY = 15;
      
      // Add title (centered)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (imgWidth - titleWidth) / 2, headerY);

      // Add date
      const date = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const dateWidth = pdf.getTextWidth(date);
      pdf.text(date, (imgWidth - dateWidth) / 2, headerY + 8);

      // Calculate image dimensions
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const startY = 30;
      const footerHeight = 25;
      const availableHeight = pageHeight - startY - footerHeight;
      
      // Scale image to fit
      let finalImgHeight = imgHeight;
      let finalImgWidth = imgWidth - 20; // 10mm margin on each side
      
      if (finalImgHeight > availableHeight) {
        const scale = availableHeight / finalImgHeight;
        finalImgHeight = availableHeight;
        finalImgWidth = finalImgWidth * scale;
      }

      // Add the timetable image (centered)
      const imgData = canvas.toDataURL('image/png');
      const xOffset = (imgWidth - finalImgWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, startY, finalImgWidth, finalImgHeight);

      // Footer section
      const footerY = pageHeight - 15;
      
      // Try to load Connect logo
      try {
        const logoBase64 = await loadConnectLogoBase64();
        if (logoBase64) {
          pdf.addImage(logoBase64, 'PNG', 10, footerY - 10, 15, 12);
        }
      } catch (e) {
        console.log('Could not add logo to PDF');
      }

      // Footer text (right-aligned for Arabic)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const footerText1 = 'جميع الحقوق محفوظة';
      const footerText2 = 'للتواصل: jadwala.app@gmail.com - +294 128150105';
      
      // Draw footer text (positioned to the right of the logo)
      pdf.text(footerText1, 30, footerY - 5);
      pdf.text(footerText2, 30, footerY + 1);

      // Add a subtle line above footer
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(10, footerY - 15, imgWidth - 10, footerY - 15);

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
