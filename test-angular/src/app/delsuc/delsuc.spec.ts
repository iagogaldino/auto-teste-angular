import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Delsuc } from './delsuc';

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

  it('should create the Delsuc component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the component template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});