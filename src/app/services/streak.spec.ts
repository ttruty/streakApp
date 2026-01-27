import { TestBed } from '@angular/core/testing';

import { Streak } from './streak';

describe('Streak', () => {
  let service: Streak;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Streak);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
