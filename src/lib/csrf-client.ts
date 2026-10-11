// Constantes CSRF compartidas entre cliente y servidor SIN importar
// código de servidor (crypto) en el bundle del navegador.
// Los valores deben coincidir con src/lib/csrf.ts.

export const CSRF_COOKIE = 'cps_csrf';
export const CSRF_HEADER = 'x-csrf-token';
