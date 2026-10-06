import { Component } from '@angular/core';

/** Moldura de chamas sobre a tela inteira; não captura cliques. */
@Component({
  selector: 'app-turn-flames',
  styleUrl: './turn-flames.css',
  templateUrl: './turn-flames.html',
  host: { 'aria-hidden': 'true' },
})
export class TurnFlames {}
