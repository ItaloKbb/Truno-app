import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Book } from './book';

describe('Book', () => {
  let fixture: ComponentFixture<Book>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Book] }).compileComponents();
    fixture = TestBed.createComponent(Book);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
