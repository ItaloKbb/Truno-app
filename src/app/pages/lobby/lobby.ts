import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../../services/modules/auth.service';
import { LobbyService } from '../../services/lobby.service';

@Component({
	imports: [AsyncPipe],
	selector: 'app-lobby',
	templateUrl: './lobby.html',
	styleUrl: './lobby.css',
})
export class Lobby {
	private readonly lobby = inject(LobbyService);
	private readonly auth = inject(AuthService);
	private readonly reload = signal(0);

	protected readonly loadError = signal('');
	protected readonly creating = signal(false);
	protected readonly createError = signal('');
	protected readonly rooms$ = toObservable(this.reload).pipe(
		switchMap(() => {
			this.loadError.set('');
			return this.lobby.getAll().pipe(
				catchError((error: unknown) => {
					this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as mesas.');
					return of(null);
				}),
			);
		}),
	);

	protected createRoom(name: string): void {
		const hostId = this.auth.session()?.user.id;
		if (hostId === undefined || name.trim().length < 3) {
			this.createError.set('Entre na conta e escolha um nome com pelo menos 3 letras.');
			return;
		}

		this.creating.set(true);
		this.createError.set('');
		this.lobby
			.create({
				name: name.trim(),
				hostId: String(hostId),
				visibility: 'PUBLICA',
				maxPlayers: 2,
				pointsToWin: 12,
			})
			.subscribe({
				next: () => {
					this.creating.set(false);
					this.createError.set('');
					this.reload.set(this.reload() + 1);
				},
				error: (error: unknown) => {
					this.creating.set(false);
					this.createError.set(error instanceof Error ? error.message : 'Falha ao criar a mesa.');
				},
			});
	}
}
