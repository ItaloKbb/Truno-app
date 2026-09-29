import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mockCards } from '../../models/mock/card.mock';
import { Book } from './book';

describe('Book', () => {
  let fixture: ComponentFixture<Book>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Book],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Book);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders the cards returned by the card service', async () => {
    http.expectOne('/api/cards').flush(mockCards.slice(0, 2));
    await fixture.whenStable();
    fixture.detectChanges();

    const images = fixture.nativeElement.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images[0]?.getAttribute('src')).toBe('/assets/cards/01-espadas.png');
    expect(fixture.nativeElement.textContent).not.toContain('Carregando cartas');
  });

  it('shows the service error instead of an empty catalog', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    http.expectOne('/api/cards').flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Falha ao carregar as cartas.');
    expect(fixture.nativeElement.querySelectorAll('img')).toHaveLength(0);
  });
});
