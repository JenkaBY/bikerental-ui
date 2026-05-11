# Task 007: Spec for `CustomerSearchOptionComponent`

> **Applied Skill:** `angular-testing` — Dumb component test: verify template output for a given `Customer` input using `fixture.componentRef.setInput()`.

## 1. Objective

Create a unit test for `CustomerSearchOptionComponent` that verifies the rendered DOM for customers with and without name data.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step1/customer-search-option.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerSearchOptionComponent } from './customer-search-option.component';
import type { Customer } from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Create a new file from scratch.
* **Snippet:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Customer } from '@bikerental/shared';
import { CustomerSearchOptionComponent } from './customer-search-option.component';

const CUSTOMER_WITH_NAME: Customer = {
  id: '1',
  phone: '+79001234567',
  firstName: 'Anna',
  lastName: 'Ivanova',
};

describe('CustomerSearchOptionComponent', () => {
  let fixture: ComponentFixture<CustomerSearchOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSearchOptionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerSearchOptionComponent);
    fixture.componentRef.setInput('customer', CUSTOMER_WITH_NAME);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the phone number', () => {
    expect(fixture.nativeElement.textContent).toContain('+79001234567');
  });

  it('should display first name and last name', () => {
    expect(fixture.nativeElement.textContent).toContain('Anna');
    expect(fixture.nativeElement.textContent).toContain('Ivanova');
  });

  it('should always render two spans', () => {
    const spans = fixture.nativeElement.querySelectorAll('span');
    expect(spans.length).toBe(2);
  });
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng test operator --include="**/step1/customer-search-option**"
```
