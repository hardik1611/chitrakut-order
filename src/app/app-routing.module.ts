import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'current',
    loadChildren: () =>
      import('../app/order/order.module').then((m) => m.OrderModule),
  },
  {
    path: 'new',
    loadChildren: () =>
      import('../app/new-order/new-order.module').then((m) => m.NewOrderModule),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'new',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
