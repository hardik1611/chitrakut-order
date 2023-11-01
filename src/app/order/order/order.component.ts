import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, FormBuilder } from '@angular/forms';
import { BOX_NUMBER } from '../../shared/constant';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { range } from 'rxjs';
import { DatePipe } from '@angular/common';
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
      // this.addShades(num, false);
      if(i%2 === 0){
        this.addShades(num, true);
      }else{
        this.addShades(num, false);
      }
    });

    // this.checkAndDeleteExpiredData();
  }

  addShades(num: any, val: any) {
    let creds = this.orderForm.controls['shades'] as FormArray;
    if (val) {
      this.shadesArray().push(
        this.fb.group({
          num: num,
          qty: [{ value: '30', disabled: true }],
          sel: '30',
        })
      );
    } else {
      this.shadesArray().push(
        this.fb.group({
          num: num,
          qty: [{ value: 0, disabled: true }],
          sel: '',
        })
      );
    }
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
    const expirationDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));
    const data = {
      value: this.orderForm.getRawValue(),
      expiration: expirationDate.getTime(),
    };

    localStorage.setItem('order', JSON.stringify(data));
  }

  clearAll() {
    this.shadesArray().controls.forEach((element: any) => {
      element.get('qty').setValue('0');
      element.get('sel').setValue('');
    });
    this.setPrintData();
  }

  shadesArray(): FormArray {
    return this.orderForm.get('shades') as FormArray;
  }

  changeQty(e: any, i: any) {
    console.log('this', this.orderForm);

    this.shadesArray().at(i).get('qty')?.setValue(e.value);
    this.setPrintData();
    this.storeData();

   
  }

  sumFn(){
this.totalOrderQty = 0;
this.printData.forEach((itm:any)=>{
  this.totalOrderQty = this.totalOrderQty + parseInt(itm.qty);
})
  }
  setPrintData() {
    // this.printData = this.orderForm.getRawValue().shades;
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

    // let HTML_Width = DATA?.offsetWidth || 0;
    // let HTML_Height = DATA?.offsetHeight || 0;
    // let top_left_margin = 15;
    // let PDF_Width = HTML_Width + top_left_margin * 2;
    // let PDF_Height:any = PDF_Width * 1.5 + top_left_margin * 2 || 0;
    // let canvas_image_width = HTML_Width;
    // let canvas_image_height = HTML_Height;

    // let totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;

    // html2canvas(DATA).then(canvas => {
    //   canvas.getContext('2d');

    //   console.log(canvas.height + '  ' + canvas.width);

    //   let imgData = canvas.toDataURL('image/jpeg');
    //   let pdf = new jsPDF('p', 'pt', [PDF_Width, PDF_Height]);

    //   for (let i = 0; i <= totalPDFPages; i++) {
    //     pdf.addPage([PDF_Width, PDF_Height],'p');
    //     pdf.addImage(
    //       imgData,
    //       'JPG',
    //       top_left_margin,
    //       -(PDF_Height * i) + top_left_margin * 4,
    //       canvas_image_width,
    //       canvas_image_height
    //     );
    //   }

    //   pdf.deletePage(1)

    //   pdf.save('HTML-Document.pdf');
    // });

    // html2canvas(DATA).then((canvas) => {
    //   let fileWidth = 208;
    //   let fileHeight = (canvas.height * fileWidth) / canvas.width;
    //   const FILEURI = canvas.toDataURL('image/png');
    //   let PDF = new jsPDF('p', 'mm', 'a4');
    //   let position = 0;
    //   PDF.addImage(FILEURI, 'PNG', 0, position, fileWidth, fileHeight);
    //   PDF.save('angular-demo.pdf');
    // });
  }

  clearsearchFn() {
    this.searchText = '';
  }
}
