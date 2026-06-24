export interface JwtPayload {
  sub: string;
  username: string;
  nombre: string;
  nombreNegocio?: string;
  negocioId?: string;
  rol: string;
  iat?: number;
  exp?: number;
}
