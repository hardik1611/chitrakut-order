import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderRoutingModule } from './order-routing.module';
import { OrderComponent } from './order/order.component';
import { MaterialModule } from '../shared/material-module.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FilterPipe } from '../pipe/search.pipe';


@NgModule({
  declarations: [
    OrderComponent,
    FilterPipe
  ],
  imports: [
    CommonModule,
    OrderRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule  ]
})
export class OrderModule { }
