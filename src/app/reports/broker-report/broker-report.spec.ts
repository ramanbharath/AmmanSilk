import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerReport } from './broker-report';

describe('BrokerReport', () => {
  let component: BrokerReport;
  let fixture: ComponentFixture<BrokerReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrokerReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrokerReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
