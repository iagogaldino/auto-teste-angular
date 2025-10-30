import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import Delsuc from './delsuc';

describe('Delsuc', () => {
  let fixture: ComponentFixture<Delsuc>;
  let component: Delsuc;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Delsuc],
    }).compileComponents();

    fixture = TestBed.createComponent(Delsuc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});