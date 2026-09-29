import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Ranking } from './ranking';

describe('Ranking', () => {
  let fixture: ComponentFixture<Ranking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Ranking] }).compileComponents();
    fixture = TestBed.createComponent(Ranking);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
