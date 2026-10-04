import { Injectable } from '@angular/core';

export interface StoredShade {
  num: string;
  qty: number;
  sel: string;
}

interface PersistedOrder {
  value: {
    shades: StoredShade[];
  };
  expiration: number;
}

@Injectable()
export class OrderStorageService {
  private readonly storageKey = 'order';
  private readonly oneDayMs = 24 * 60 * 60 * 1000;

  loadQuantities(): Map<string, number> {
    const serializedOrder = localStorage.getItem(this.storageKey);
    if (!serializedOrder) {
      return new Map<string, number>();
    }

    const savedOrder = JSON.parse(serializedOrder) as PersistedOrder;
    if (Date.now() > savedOrder.expiration) {
      localStorage.removeItem(this.storageKey);
      return new Map<string, number>();
    }

    return new Map(
      savedOrder.value.shades.map((shade) => [shade.num, Number(shade.qty)])
    );
  }

  save(shades: StoredShade[]): void {
    const order: PersistedOrder = {
      value: { shades },
      expiration: Date.now() + this.oneDayMs,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(order));
  }
}
