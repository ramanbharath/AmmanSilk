import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerReport } from './customer-report';

describe('CustomerReport', () => {
  let component: CustomerReport;
  let fixture: ComponentFixture<CustomerReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
