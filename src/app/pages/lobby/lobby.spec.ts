import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../services/modules/auth.service';
import { LobbyService } from '../../services/lobby.service';
import { Lobby } from './lobby';

describe('Lobby', () => {
  let fixture: ComponentFixture<Lobby>;
  let auth: { session: ReturnType<typeof vi.fn> };
  let lobby: { getAll: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { session: vi.fn(() => ({ user: { id: 42 } })) };
    lobby = {
      getAll: vi.fn(() => of([])),
      create: vi.fn(() => of({})),
    };

    await TestBed.configureTestingModule({
      imports: [Lobby],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: LobbyService, useValue: lobby },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Lobby);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads and displays the rooms from the service', async () => {
    lobby.getAll.mockReturnValue(
      of([
        {
          id: 'room-1',
          name: 'Mesa rápida',
          hostId: '42',
          visibility: 'PUBLICA',
          maxPlayers: 2,
          playerIds: ['42'],
          pointsToWin: 12,
          status: 'ABERTA',
        },
      ]),
    );
    fixture.componentInstance['reload'].set(1);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(lobby.getAll).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Mesa rápida');
  });

  it('creates a room with the signed-in user and reloads the list', async () => {
    const nameInput = fixture.nativeElement.querySelector('#room-name') as HTMLInputElement;
    nameInput.value = 'Mesa do Lucas';
    const form = fixture.nativeElement.querySelector('#create-room-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(lobby.create).toHaveBeenCalledWith({
      name: 'Mesa do Lucas',
      hostId: '42',
      visibility: 'PUBLICA',
      maxPlayers: 2,
      pointsToWin: 12,
    });
    expect(lobby.getAll).toHaveBeenCalledTimes(2);
  });
});
