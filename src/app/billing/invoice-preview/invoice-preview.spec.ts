import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicePreview } from './invoice-preview';

describe('InvoicePreview', () => {
  let component: InvoicePreview;
  let fixture: ComponentFixture<InvoicePreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicePreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicePreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
