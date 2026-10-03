import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, FormBuilder } from '@angular/forms';
import { BOX_NUMBER } from '../../shared/num';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { range } from 'rxjs';
import { DatePipe } from '@angular/common';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.vfs;
@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
  providers: [DatePipe],
})
export class OrderComponent implements OnInit {
  numbers = BOX_NUMBER;
  printData: any[] = [];
  searchText: any;
  todayDate = new Date();
  orderForm: FormGroup;
  totalOrderQty = 0;
  constructor(
    private fb: FormBuilder,
    public datepipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.orderForm = this.fb.group({
      shades: this.fb.array([]),
    });

    this.numbers.forEach((num: any, i: any) => {
      this.addShades(num);
    });

    this.checkAndDeleteExpiredData();
  }

  addShades(num: any) {
    this.shadesArray().push(
      this.fb.group({
        num: num,
        qty: [{ value: 0, disabled: true }],
        sel: '',
      })
    );
  }

  increaseNum(i: any) {
    let creds = this.orderForm.controls['shades'] as FormArray;
    let currVal = parseInt(creds.controls[i].get('qty')?.value);
    const incVal = currVal + 1;
    creds.controls[i].get('qty')?.setValue(incVal);
    this.setPrintData();
  }

  decreaseNum(i: any) {
    let creds = this.orderForm.controls['shades'] as FormArray;
    let currVal = parseInt(creds.controls[i].get('qty')?.value);
    if (currVal > 0) {
      const incVal = currVal - 1;
      creds.controls[i].get('qty')?.setValue(incVal);
      this.setPrintData();
    }
  }

  gotoBottom() {
    const element = document.getElementById('htmlData');

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth', // You can use 'auto' for instant scrolling
        block: 'start', // You can use 'center' or 'end' for different alignment
      });
    }
  }

  gotoUp() {
    const element = document.getElementById('example');

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth', // You can use 'auto' for instant scrolling
        block: 'start', // You can use 'center' or 'end' for different alignment
      });
    }
  }

  // Function to check and delete expired data
  checkAndDeleteExpiredData(key = 'order') {
    const storedData = localStorage.getItem(key);

    if (storedData) {
      const data = JSON.parse(storedData);
      const now = new Date().getTime();

      this.orderForm.setValue(data.value);

      if (now > data.expiration) {
        localStorage.removeItem(key);
      }
    }

    this.setPrintData();
  }

  storeData() {
    const now = new Date();
    const expirationDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const data = {
      value: this.orderForm.getRawValue(),
      expiration: expirationDate.getTime(),
    };

    localStorage.setItem('order', JSON.stringify(data));
  }

  clearAll() {
    this.shadesArray().controls.forEach((element: any) => {
      element.get('qty').setValue('0');
      element.get('sel').setValue('0');
    });
    this.setPrintData();
  }

  shadesArray(): FormArray {
    return this.orderForm.get('shades') as FormArray;
  }

  changeQty(e: any, i: any) {
    this.shadesArray().at(i).get('qty')?.setValue(e.value);
    this.setPrintData();
    this.storeData();
  }

  sumFn() {
    this.totalOrderQty = 0;
    this.printData.forEach((itm: any) => {
      this.totalOrderQty = this.totalOrderQty + parseInt(itm.qty);
    });
  }

  setPrintData() {
    let printData: any = this.orderForm.getRawValue().shades;
    this.printData = printData.filter((itm: any) => itm.qty > 0);
    this.sumFn();
    this.cdr.detectChanges();
  }

  openPDF(): void {
    let DATA: any = document.getElementById('htmlData');

    let HTML_Width = DATA?.clientWidth || 0;
    let HTML_Height = DATA?.clientHeight || 0;
    let top_left_margin = 5;
    let PDF_Width = HTML_Width + top_left_margin * 2;
    let PDF_Height: any = PDF_Width * 1.5 + top_left_margin * 2 || 0;
    let canvas_image_width = HTML_Width;
    let canvas_image_height = HTML_Height;

    let totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;

    html2canvas(DATA).then((canvas) => {
      canvas.getContext('2d');

      console.log(canvas.height + '  ' + canvas.width);

      let imgData = canvas.toDataURL('image/jpeg');
      let pdf = new jsPDF('p', 'pt', [PDF_Width, PDF_Height]);

      for (let i = 0; i <= totalPDFPages; i++) {
        pdf.addPage([PDF_Width, PDF_Height], 'p');
        pdf.addImage(
          imgData,
          'JPG',
          top_left_margin,
          -(PDF_Height * i) + top_left_margin * 4,
          canvas_image_width,
          canvas_image_height
        );
      }

      pdf.deletePage(1);

      let date = this.datepipe.transform(new Date(), 'dd-MM-YYYY hh:mm:ss a');
      let filename = 'ચિત્રકૂટ ઓર્ડર - ' + date + '.pdf';

      pdf.save(filename);
    });
  }

  openPDFNew() {
    const data = this.printData;   // [{num, qty}, ...]
    const totalQty = this.totalOrderQty;
    const today = new Date().toLocaleString("gu-IN", {
      hour12: true,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  
    // Break into chunks of 15 rows (1 column = 15 rows)
    const chunkSize = 25;
    const chunkArray = (arr:any, size:any) => {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };
  
    const chunks = chunkArray(data, chunkSize);
  
    // Now group 6 columns = 1 page section
    const pageColumnSize = 6;
    const pages = chunkArray(chunks, pageColumnSize);
  
    const docContent:any[] = [];
  
    pages.forEach((pageColumns, pageIndex) => {
  
      // Add header
      docContent.push({
        margin: [10, 0, 0, 5],
        columns: [
          { text: "Chitrakut Order", bold: true, fontSize: 10, width: "20%" },
          { text: today, width: "25%" },
          { text: `Number : ${data.length}`, width: "20%" },
          { text: `Box : ${totalQty}`, width: "20%" },
          { text: `Page : ${pageIndex + 1}`, width: "10%", alignment: "right" }
        ]
      });
  
      const columnTables = pageColumns.map((col:any) => {
        return {
          width: "16%",
          margin: [0, 0, 5, 0],
          table: {
            widths: ["*", "30%"],
            body: [
              [{ text: "Number", bold: true }, { text: "Qty", bold: true }],
              ...col.map((item:any) => [item.num, item.qty])
            ]
          }
        };
      });
  
      docContent.push({
        columns: columnTables
      });
  
      docContent.push({ text: "", margin: [0, 10] });
    });
  
    const docDefinition:any = {
      pageSize: "A4",
      defaultStyle: {
        fontSize: 8   // change to 7 or 6 if needed
      },
      pageMargins: [12, 12, 20, 12],
      content: docContent
    };
  
    pdfMake.createPdf(docDefinition).download("order.pdf");
  }

  clearsearchFn() {
    this.searchText = '';
  }
}
