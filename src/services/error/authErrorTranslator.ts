const AUTH_ERROR_MAPPINGS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'Usuário não cadastrado.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este endereço de e-mail já está sendo utilizado.',
  'auth/weak-password': 'A senha deve conter no mínimo 6 caracteres.',
  'auth/invalid-email': 'Por favor, informe um endereço de e-mail válido.',
  'auth/popup-closed-by-user': 'O login com Google foi cancelado antes da conclusão.',
  'auth/network-request-failed': 'Falha na conexão. Por favor, verifique sua internet.',
  'auth/too-many-requests': 'Muitas tentativas sem sucesso. Aguarde um momento e tente novamente.',
  'auth/requires-recent-login': 'Esta ação requer uma nova autenticação recente.'
};

export function translateAuthError(errorOrCode: unknown): string {
  if (!errorOrCode) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  let code = '';
  if (typeof errorOrCode === 'string') {
    code = errorOrCode;
  } else if (typeof errorOrCode === 'object' && errorOrCode !== null && 'code' in errorOrCode) {
    code = String((errorOrCode as { code: unknown }).code);
  }

  return AUTH_ERROR_MAPPINGS[code] || 'Ocorreu um erro ao processar a autenticação. Tente novamente.';
}
