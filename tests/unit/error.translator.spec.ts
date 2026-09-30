import { describe, it, expect } from 'vitest';
import { translateAuthError } from '@/services/error/authErrorTranslator';

describe('authErrorTranslator', () => {
  it('deve traduzir auth/invalid-credential para mensagem amigável', () => {
    const message = translateAuthError({ code: 'auth/invalid-credential' });
    expect(message).toBe('E-mail ou senha incorretos.');
  });

  it('deve traduzir auth/email-already-in-use', () => {
    const message = translateAuthError({ code: 'auth/email-already-in-use' });
    expect(message).toBe('Este endereço de e-mail já está sendo utilizado.');
  });

  it('deve retornar mensagem padrão para código desconhecido', () => {
    const message = translateAuthError({ code: 'auth/unknown-error-code' });
    expect(message).toBe('Ocorreu um erro ao processar a autenticação. Tente novamente.');
  });

  it('deve lidar com entrada nula ou indefinida', () => {
    const message = translateAuthError(null);
    expect(message).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });
});
