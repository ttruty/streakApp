import { TestBed } from '@angular/core/testing';

import { Achievement } from './achievement';

describe('Achievement', () => {
  let service: Achievement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Achievement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
