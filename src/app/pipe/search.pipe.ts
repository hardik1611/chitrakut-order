import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;
    if (searchText == "") return items;

    searchText = searchText.toLowerCase();

    let o = items.filter(it => {
      return it.value.num.toLowerCase().includes(searchText);
    });

    console.log('0', o);
    return o;
  }
}