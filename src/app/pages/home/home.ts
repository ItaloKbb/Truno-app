import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { safeReturnUrl } from '../../guards/return-url';
import { AuthService, messageFromApi } from '../../services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly mode = signal<'login' | 'forgot'>('login');
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal('');
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  protected showForgot(): void {
    this.mode.set('forgot');
    this.errorMessage.set('');
    this.infoMessage.set('');
    this.form.controls.password.disable();
  }

  protected showLogin(): void {
    this.mode.set('login');
    this.errorMessage.set('');
    this.infoMessage.set('');
    this.form.controls.password.enable();
  }

  protected fieldError(field: 'email' | 'password'): string {
    const control = this.form.controls[field];
    if (!control.touched && !control.dirty) return '';
    if (control.hasError('required')) {
      return field === 'email' ? 'Informe o e-mail.' : 'Informe a senha.';
    }
    if (control.hasError('email')) return 'Informe um e-mail válido.';
    if (control.hasError('minlength')) return 'A senha deve ter pelo menos 8 caracteres.';
    return '';
  }

  protected submit(): void {
    this.errorMessage.set('');
    this.infoMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();

    if (this.mode() === 'forgot') {
      this.auth.forgotPassword(email).subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.infoMessage.set(response.message);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.errorMessage.set(messageFromApi(error, 'Não foi possível enviar as instruções.'));
        },
      });
      return;
    }

    this.auth.login({ email, password }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router
          .navigateByUrl(safeReturnUrl(returnUrl))
          .finally(() => this.submitting.set(false));
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(messageFromApi(error, 'Não foi possível entrar. Tente novamente.'));
      },
    });
  }
}
