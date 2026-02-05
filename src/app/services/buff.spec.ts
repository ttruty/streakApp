import { TestBed } from '@angular/core/testing';

import { Buff } from './buff';

describe('Buff', () => {
  let service: Buff;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Buff);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
