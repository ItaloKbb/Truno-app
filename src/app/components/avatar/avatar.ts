import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar implements OnChanges {
  @Input() name = '';
  @Input() avatarUrl: string | null | undefined;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  protected imageFailed = false;

  protected get initials(): string {
    return this.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
  }

  ngOnChanges(): void { this.imageFailed = false; }
  protected onImageError(): void { this.imageFailed = true; }
}
