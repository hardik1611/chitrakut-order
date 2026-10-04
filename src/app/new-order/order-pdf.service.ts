import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { StoredShade } from './order-storage.service';

(pdfMake as any).vfs = pdfFonts.vfs;

@Injectable()
export class OrderPdfService {
  download(items: StoredShade[], totalQuantity: number): void {
    this.createDocument(items, totalQuantity).download('order.pdf');
  }

  async share(items: StoredShade[], totalQuantity: number): Promise<'shared' | 'cancelled' | 'downloaded'> {
    const pdf = this.createDocument(items, totalQuantity);
    const blob = await new Promise<Blob>((resolve, reject) => {
      try {
        pdf.getBlob(resolve);
      } catch (error) {
        reject(error);
      }
    });
    if (
      typeof File === 'undefined' ||
      typeof navigator.share !== 'function' ||
      typeof navigator.canShare !== 'function'
    ) {
      this.downloadBlob(blob, 'order.pdf');
      return 'downloaded';
    }

    const file = new File([blob], 'order.pdf', { type: 'application/pdf' });
    if (!navigator.canShare({ files: [file] })) {
      this.downloadBlob(blob, file.name);
      return 'downloaded';
    }

    try {
      await navigator.share({
        files: [file],
        title: 'Chitrakut Order',
      });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }

      this.downloadBlob(blob, file.name);
      return 'downloaded';
    }
  }

  private createDocument(items: StoredShade[], totalQuantity: number): any {
    const now = new Date();
    const date = now.toLocaleString('gu-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const columnsPerPage = 5;
    const rowsPerColumn = 30;
    const itemsPerPage = rowsPerColumn * columnsPerPage;
    const pages: StoredShade[][] = [];
    for (let index = 0; index < items.length; index += itemsPerPage) {
      pages.push(items.slice(index, index + itemsPerPage));
    }

    const documentDefinition: any = {
      pageSize: 'A4',
      pageMargins: [24, 24, 24, 24],
      defaultStyle: { fontSize: 8 },
      content: pages.flatMap((pageItems, pageIndex) => [
        {
          ...(pageIndex > 0 ? { pageBreak: 'before' } : {}),
          columns: [
            { text: 'Chitrakut Order', bold: true, width: '25%' },
            { text: date, width: '25%' },
            { text: `Number: ${items.length}`, width: '20%' },
            { text: `Box: ${totalQuantity}`, width: '20%' },
            { text: `Page: ${pageIndex + 1}`, width: '10%', alignment: 'right' },
          ],
          margin: [0, 0, 0, 8],
        },
        {
          columns: Array.from({ length: columnsPerPage }, (_, columnIndex) => {
            const itemsPerColumn = Math.ceil(pageItems.length / columnsPerPage);
            const column = pageItems.slice(
              columnIndex * itemsPerColumn,
              (columnIndex + 1) * itemsPerColumn
            );
            if (column.length === 0) {
              return { width: '*', text: '' };
            }

            const rows = column.map((item, rowIndex) => {
              const fillColor = rowIndex % 2 === 0 ? '#eeeeee' : '#ffffff';
              return [
                { text: item.num, noWrap: true, fillColor },
                {
                  text: String(item.qty),
                  alignment: 'center',
                  noWrap: true,
                  fillColor,
                },
              ];
            });

            return {
              width: '*',
              margin: [0, 0, 4, 0],
              table: {
                headerRows: 1,
                dontBreakRows: true,
                keepWithHeaderRows: 1,
                widths: ['*', 30],
                body: [
                  [
                    { text: 'Number', style: 'tableHeader', noWrap: true },
                    {
                      text: 'Qty',
                      style: 'tableHeader',
                      alignment: 'center',
                      noWrap: true,
                    },
                  ],
                  ...rows,
                ],
              },
              layout: {
                hLineWidth: () => 0.6,
                vLineWidth: () => 0.6,
                hLineColor: () => '#888888',
                vLineColor: () => '#888888',
                paddingLeft: () => 5,
                paddingRight: () => 5,
                paddingTop: () => 5,
                paddingBottom: () => 5,
              },
              fontSize: 12,
            };
          }),
          columnGap: 2,
        },
      ]),
      styles: {
        tableHeader: { bold: true, fontSize: 13, fillColor: '#dddddd' },
      },
    };

    return pdfMake.createPdf(documentDefinition);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}
