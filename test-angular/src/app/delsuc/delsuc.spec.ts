import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Delsuc } from './delsuc';

describe('Delsuc', () => {
  let component: Delsuc;
  let fixture: ComponentFixture<Delsuc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Delsuc]
    }).compileComponents();

    fixture = TestBed.createComponent(Delsuc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});