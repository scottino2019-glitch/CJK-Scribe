import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface ExportPdfOptions {
  filename?: string;
  format?: 'A4' | 'B5' | 'Letter';
  paperBgColor?: string;
  marginMm?: number;
  onProgress?: (progress: number, stage: string) => void;
}

const FORMAT_SPECS: Record<
  'a4' | 'b5' | 'letter',
  {
    widthPx: number;
    heightPx: number;
    jsPdfFormat: string | [number, number];
    widthMm: number;
    heightMm: number;
  }
> = {
  a4: {
    widthPx: 794,
    heightPx: 1123,
    jsPdfFormat: 'a4',
    widthMm: 210,
    heightMm: 297,
  },
  b5: {
    widthPx: 665,
    heightPx: 945,
    jsPdfFormat: [176, 250],
    widthMm: 176,
    heightMm: 250,
  },
  letter: {
    widthPx: 816,
    heightPx: 1056,
    jsPdfFormat: 'letter',
    widthMm: 215.9,
    heightMm: 279.4,
  },
};

export interface ExportResult {
  blob: Blob;
  blobUrl: string;
  filename: string;
}

export async function exportDocumentToPdf(
  elementIds: string[],
  options: ExportPdfOptions = {}
): Promise<ExportResult> {
  const {
    filename = 'cjk_document.pdf',
    format = 'A4',
    paperBgColor = '#ffffff',
    marginMm = 20,
    onProgress,
  } = options;

  try {
    onProgress?.(10, 'Preparazione pagine...');

    const pdfFormat = format.toLowerCase() as 'a4' | 'b5' | 'letter';
    const spec = FORMAT_SPECS[pdfFormat] || FORMAT_SPECS.a4;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: spec.jsPdfFormat,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Ensure all web fonts are fully loaded before capturing
    if (document.fonts) {
      onProgress?.(15, 'Caricamento font calligrafici...');
      await document.fonts.ready;
    }

    let renderedCount = 0;

    for (let i = 0; i < elementIds.length; i++) {
      const elId = elementIds[i];
      const el = document.getElementById(elId);
      if (!el) {
        console.warn(`Element with ID "${elId}" not found for PDF export.`);
        continue;
      }

      onProgress?.(
        Math.round(20 + ((i + 1) / elementIds.length) * 65),
        `Elaborazione pagina ${i + 1} di ${elementIds.length}...`
      );

      // Preload all images in the page to ensure complete rendering without cropping or blanks
      const pageImages = Array.from(el.querySelectorAll('img'));
      if (pageImages.length > 0) {
        await Promise.all(
          pageImages.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete && img.naturalHeight !== 0) {
                  resolve(true);
                } else {
                  img.onload = () => resolve(true);
                  img.onerror = () => resolve(false);
                  setTimeout(resolve, 2500);
                }
              })
          )
        );
      }

      const marginPx = Math.round(marginMm * 3.7795);

      // Render page using html2canvas-pro with exact dimensions to avoid any character stretching
      const canvas = await html2canvas(el, {
        width: spec.widthPx,
        height: spec.heightPx,
        windowWidth: spec.widthPx,
        windowHeight: spec.heightPx,
        scale: 2.5, // Crisp high-DPI resolution for Chinese & Korean strokes
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: paperBgColor,
        ignoreElements: (element) => {
          return (
            element.classList?.contains('no-print') ||
            element.getAttribute('data-no-export') === 'true'
          );
        },
        onclone: (clonedDoc) => {
          // Copy fonts and stylesheets to cloned document to guarantee font metrics
          const styles = document.querySelectorAll('link[rel="stylesheet"], style');
          styles.forEach((s) => {
            clonedDoc.head.appendChild(s.cloneNode(true));
          });

          const clonedPage = clonedDoc.getElementById(elId);
          if (clonedPage) {
            clonedPage.style.boxShadow = 'none';
            clonedPage.style.border = 'none';
            clonedPage.style.borderRadius = '0px';
            clonedPage.style.width = `${spec.widthPx}px`;
            clonedPage.style.height = `${spec.heightPx}px`;
            clonedPage.style.minHeight = `${spec.heightPx}px`;
            clonedPage.style.maxHeight = `${spec.heightPx}px`;
            clonedPage.style.maxWidth = `${spec.widthPx}px`;
            clonedPage.style.boxSizing = 'border-box';
            clonedPage.style.overflow = 'hidden';
            clonedPage.style.margin = '0px';
            clonedPage.style.backgroundColor = paperBgColor;
            clonedPage.style.transform = 'none';
            clonedPage.style.padding = `${marginPx}px`;

            // Explicitly force grid pattern overlay dimensions to match content container
            const gridPattern = clonedPage.querySelector('.grid-pattern-overlay') as HTMLElement | null;
            if (gridPattern) {
              gridPattern.style.top = '0px';
              gridPattern.style.left = '0px';
              gridPattern.style.right = '0px';
              gridPattern.style.bottom = '0px';
              gridPattern.style.width = '100%';
              gridPattern.style.height = '100%';
              gridPattern.style.display = 'block';
            }

            // Explicitly force traditional border overlay dimensions
            const borderOverlay = clonedPage.querySelector('.traditional-border-overlay') as HTMLElement | null;
            if (borderOverlay) {
              borderOverlay.style.top = '0px';
              borderOverlay.style.left = '0px';
              borderOverlay.style.right = '0px';
              borderOverlay.style.bottom = '0px';
              borderOverlay.style.width = '100%';
              borderOverlay.style.height = '100%';
              borderOverlay.style.display = 'block';
            }
          }

          // Prevent any images from overflowing
          const allImages = clonedDoc.querySelectorAll('img');
          allImages.forEach((img) => {
            img.style.maxWidth = '100%';
            img.style.objectFit = 'contain';
          });

          // Remove active outlines and selection highlights from cloned DOM
          const activeRings = clonedDoc.querySelectorAll('.ring-1, .ring-2, .bg-amber-500\\/5');
          activeRings.forEach((ring) => {
            ring.classList.remove('ring-1', 'ring-2', 'ring-amber-700/60', 'ring-amber-500/60', 'bg-amber-500/5');
          });

          const noPrints = clonedDoc.querySelectorAll('.no-print');
          noPrints.forEach((np) => {
            (np as HTMLElement).style.display = 'none';
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');

      if (renderedCount > 0) {
        pdf.addPage(spec.jsPdfFormat, 'portrait');
      }

      // Strictly preserve geometric aspect ratio: NEVER stretch characters
      const canvasRatio = canvas.width / canvas.height;
      const targetRatio = pageWidth / pageHeight;

      let drawWidth = pageWidth;
      let drawHeight = pageHeight;
      let posX = 0;
      let posY = 0;

      if (Math.abs(canvasRatio - targetRatio) > 0.002) {
        if (canvasRatio > targetRatio) {
          drawHeight = pageWidth / canvasRatio;
          posY = (pageHeight - drawHeight) / 2;
        } else {
          drawWidth = pageHeight * canvasRatio;
          posX = (pageWidth - drawWidth) / 2;
        }
      }

      pdf.addImage(imgData, 'PNG', posX, posY, drawWidth, drawHeight, undefined, 'FAST');
      renderedCount++;
    }

    if (renderedCount === 0) {
      throw new Error('Nessuna pagina trovata da esportare.');
    }

    onProgress?.(92, 'Generazione file PDF...');

    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Automatic direct download triggering
    try {
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = filename;
      downloadAnchor.style.display = 'none';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      setTimeout(() => {
        try {
          document.body.removeChild(downloadAnchor);
        } catch (_) {}
      }, 5000);
    } catch (downloadErr) {
      console.warn('Programmatic download anchor triggered fallback:', downloadErr);
    }

    onProgress?.(100, 'Completato!');

    return {
      blob: pdfBlob,
      blobUrl,
      filename,
    };
  } catch (error) {
    console.error('Errore durante l\'esportazione del PDF:', error);
    throw error;
  }
}

export function printDocumentDirectly(): void {
  window.print();
}
