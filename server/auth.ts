// Credenciais de autenticação simples
const VALID_CREDENTIALS = {
  login: "barbara",
  senha: "mesquitaimoveis"
};

export function validateCredentials(login: string, senha: string): boolean {
  return login === VALID_CREDENTIALS.login && senha === VALID_CREDENTIALS.senha;
}

export function createSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
