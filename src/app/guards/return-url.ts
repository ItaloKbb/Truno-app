/** Aceita apenas caminhos internos. A tela de login não pode ser o destino. */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/home')) {
    return '/lobby';
  }
  return value;
}
