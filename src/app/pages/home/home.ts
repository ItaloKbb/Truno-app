import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CODE_MAX_LENGTH, CODE_MIN_LENGTH, NICKNAME_MAX_LENGTH } from '../../domain/auth';
import { AuthService, messageFromApi } from '../../services/modules/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  @Input({ required: true }) auth!: AuthService;
  @Output() loggedIn = new EventEmitter<void>();

  protected readonly nicknameMax = NICKNAME_MAX_LENGTH;
  protected readonly codeMin = CODE_MIN_LENGTH;
  protected readonly codeMax = CODE_MAX_LENGTH;

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  
  protected readonly form = new FormGroup({
    nickname: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(NICKNAME_MAX_LENGTH)],
    }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(CODE_MIN_LENGTH),
        Validators.maxLength(CODE_MAX_LENGTH),
      ],
    }),
  });

  protected fieldError(field: 'nickname' | 'code'): string {
    const control = this.form.controls[field];
    if (!control.touched && !control.dirty) return '';
    if (field === 'nickname') {
      if (control.hasError('required')) return 'Informe o apelido.';
      if (control.hasError('maxlength')) return `Use até ${NICKNAME_MAX_LENGTH} caracteres.`;
      return '';
    }
    if (control.hasError('required')) return 'Informe o código.';
    if (control.hasError('minlength') || control.hasError('maxlength')) {
      return `O código deve ter de ${CODE_MIN_LENGTH} a ${CODE_MAX_LENGTH} caracteres.`;
    }
    return '';
  }

  protected submit(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { nickname, code } = this.form.getRawValue();

    this.auth.login({ nickname, code }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.loggedIn.emit();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(messageFromApi(error, 'Não foi possível entrar. Tente novamente.'));
      },
    });
  }
}
