import { Delsuc } from './delsuc';
import { TestBed } from '@angular/core/testing';

describe('Delsuc', () => {
  let component: Delsuc;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        Delsuc
      ],
    });
    const fixture = TestBed.createComponent(Delsuc);
    component = fixture.componentInstance;
  });

  it('should create the Delsuc component', () => {
    expect(component).toBeTruthy();
  });
});