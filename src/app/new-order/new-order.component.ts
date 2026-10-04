import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { BOX_NUMBER } from '../shared/num';
import { OrderPdfService } from './order-pdf.service';
import { OrderStorageService, StoredShade } from './order-storage.service';

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss'],
  providers: [OrderStorageService, OrderPdfService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewOrderComponent implements OnInit {
  readonly quantities = [0, 5, 10, 15, 20, 30, 60, 90, 120, 150];
  readonly today = new Date();
  readonly orderForm: FormGroup;
  visibleShades: AbstractControl[] = [];
  orderItems: StoredShade[] = [];
  totalQuantity = 0;
  searchText = '';
  shareMessage = '';
  sharing = false;
  showingReview = false;
  confirmingClear = false;
  private previousPageScrollY = 0;
  private previousShadeListScrollOffset = 0;
  private oldVersionTapPending = false;
  private oldVersionTapTimeout?: number;

  @ViewChild(CdkVirtualScrollViewport)
  private viewport?: CdkVirtualScrollViewport;

  @ViewChild('orderHeader')
  private orderHeader?: ElementRef<HTMLElement>;

  @ViewChild('orderReview')
  private orderReview?: ElementRef<HTMLElement>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly storage: OrderStorageService,
    private readonly pdf: OrderPdfService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly router: Router
  ) {
    this.orderForm = this.formBuilder.group({
      shades: this.formBuilder.array([]),
    });
  }

  ngOnInit(): void {
    const savedQuantities = this.storage.loadQuantities();
    BOX_NUMBER.forEach((num) => {
      const quantity = savedQuantities.get(num) || 0;
      this.shades.push(
        this.formBuilder.group({
          num: [num],
          qty: [quantity],
          sel: [quantity === 0 ? '0' : String(quantity)],
        })
      );
    });
    this.visibleShades = this.shades.controls;
    this.updateOrderSummary();
  }

  get shades(): FormArray {
    return this.orderForm.get('shades') as FormArray;
  }

  setQuantity(shade: AbstractControl, quantity: number): void {
    shade.get('qty')?.setValue(quantity);
    shade.get('sel')?.setValue(String(quantity));
    this.saveOrder();
  }

  clearOrder(): void {
    this.confirmingClear = true;
    this.changeDetector.markForCheck();
  }

  cancelClear(): void {
    this.confirmingClear = false;
  }

  confirmClearOrder(): void {
    this.shades.controls.forEach((shade) => {
      shade.get('qty')?.setValue(0);
      shade.get('sel')?.setValue('0');
    });
    this.confirmingClear = false;
    this.saveOrder();
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.viewport?.scrollToOffset(0, 'auto');
  }

  filterShades(searchText: string): void {
    this.searchText = searchText;
    const normalizedSearch = searchText.trim().toLowerCase();
    this.visibleShades = normalizedSearch
      ? this.shades.controls.filter((shade) =>
          String(shade.get('num')?.value).toLowerCase().includes(normalizedSearch)
        )
      : this.shades.controls;
    this.viewport?.scrollToIndex(0);
    this.changeDetector.markForCheck();
  }

  trackByCode(_index: number, shade: AbstractControl): string {
    return String(shade.get('num')?.value);
  }

  downloadPdf(): void {
    this.pdf.download(this.orderItems, this.totalQuantity);
  }

  switchToOldVersion(event: MouseEvent): void {
    event.preventDefault();
    if (this.oldVersionTapPending) {
      this.oldVersionTapPending = false;
      window.clearTimeout(this.oldVersionTapTimeout);
      void this.router.navigateByUrl('/current');
      return;
    }

    this.oldVersionTapPending = true;
    this.oldVersionTapTimeout = window.setTimeout(() => {
      this.oldVersionTapPending = false;
    }, 800);
  }

  toggleOrderReview(): void {
    if (this.showingReview) {
      this.showingReview = false;
      requestAnimationFrame(() => {
        window.scrollTo(0, this.previousPageScrollY);
        this.viewport?.scrollToOffset(this.previousShadeListScrollOffset, 'auto');
      });
      return;
    }

    this.previousPageScrollY = window.scrollY;
    this.previousShadeListScrollOffset = this.viewport?.measureScrollOffset('top') || 0;
    this.showingReview = true;
    requestAnimationFrame(() => {
      if (!this.orderReview || !this.orderHeader) {
        return;
      }

      const reviewTop =
        this.orderReview.nativeElement.getBoundingClientRect().top + window.scrollY;
      const headerHeight = this.orderHeader.nativeElement.getBoundingClientRect().height;
      window.scrollTo({
        top: Math.max(0, reviewTop - headerHeight - 8),
        behavior: 'smooth',
      });
    });
  }

  async shareOrder(): Promise<void> {
    if (this.sharing || this.orderItems.length === 0) {
      return;
    }

    this.sharing = true;
    this.shareMessage = '';
    this.changeDetector.markForCheck();

    try {
      const result = await this.pdf.share(this.orderItems, this.totalQuantity);
      if (result === 'shared') {
        this.shareMessage = 'Choose WhatsApp from the share menu, then select the dealer.';
      } else if (result === 'cancelled') {
        this.shareMessage = 'Sharing was cancelled. Your order has not changed.';
      } else {
        this.shareMessage = 'Direct sharing is not available here. The PDF was downloaded; open it to share.';
      }
    } catch {
      this.shareMessage = 'Could not prepare the PDF. Please try Generate PDF instead.';
    } finally {
      this.sharing = false;
      this.changeDetector.markForCheck();
    }
  }

  private saveOrder(): void {
    const shades = this.orderForm.getRawValue().shades as StoredShade[];
    this.storage.save(shades);
    this.updateOrderSummary();
  }

  private updateOrderSummary(): void {
    const shades = this.orderForm.getRawValue().shades as StoredShade[];
    this.orderItems = shades.filter((shade) => Number(shade.qty) > 0);
    this.totalQuantity = this.orderItems.reduce(
      (total, shade) => total + Number(shade.qty),
      0
    );
    this.changeDetector.markForCheck();
  }
}
