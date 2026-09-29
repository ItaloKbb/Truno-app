import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Partida } from './partida';

describe('Partida', () => {
  let fixture: ComponentFixture<Partida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Partida] }).compileComponents();
    fixture = TestBed.createComponent(Partida);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
