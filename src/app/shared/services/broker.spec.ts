import { TestBed } from '@angular/core/testing';

import { Broker } from './broker';

describe('Broker', () => {
  let service: Broker;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Broker);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
