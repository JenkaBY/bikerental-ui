import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CustomerRatingService {
  private readonly ratings = new Map<string, number>();

  getRating(customerId: string): number {
    return this.ratings.get(customerId) ?? 5;
  }
}
