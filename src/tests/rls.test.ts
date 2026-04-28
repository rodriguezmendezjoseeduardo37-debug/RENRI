import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateTenantAccess, RLSError, requireTenantAccess } from '../lib/rls-middleware';
import { db } from '../db';
import { auth } from '../auth';

// Mock DB and Auth
vi.mock('../db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('../auth', () => ({
  auth: vi.fn(),
}));

describe('RLS Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateTenantAccess', () => {
    it('debería retornar true si el usuario pertenece al tenant', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({ id: 'user1', tenantId: 'tenant1' } as any);
      
      const result = await validateTenantAccess('user1', 'tenant1');
      expect(result).toBe(true);
    });

    it('debería lanzar RLSError si el usuario no existe', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(undefined);
      
      await expect(validateTenantAccess('user1', 'tenant1')).rejects.toThrow(RLSError);
      await expect(validateTenantAccess('user1', 'tenant1')).rejects.toThrow('Usuario no encontrado');
    });

    it('debería lanzar RLSError si el usuario no pertenece al tenant', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({ id: 'user1', tenantId: 'tenant2' } as any);
      
      await expect(validateTenantAccess('user1', 'tenant1')).rejects.toThrow(RLSError);
      await expect(validateTenantAccess('user1', 'tenant1')).rejects.toThrow('Acceso denegado: usuario no pertenece a este tenant');
    });
  });

  describe('requireTenantAccess', () => {
    it('debería retornar userId y tenantId si la sesión es válida y coincide', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user1', tenantId: 'tenant1' } } as any);
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({ id: 'user1', tenantId: 'tenant1' } as any);

      const result = await requireTenantAccess('tenant1');
      expect(result).toEqual({ userId: 'user1', tenantId: 'tenant1' });
    });

    it('debería lanzar error si no hay sesión', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      await expect(requireTenantAccess('tenant1')).rejects.toThrow(RLSError);
      await expect(requireTenantAccess('tenant1')).rejects.toThrow('No autenticado');
    });

    it('debería lanzar error si el tenantId de la sesión no coincide con el solicitado', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user1', tenantId: 'tenant2' } } as any);

      await expect(requireTenantAccess('tenant1')).rejects.toThrow(RLSError);
      await expect(requireTenantAccess('tenant1')).rejects.toThrow('Tenant mismatch');
    });
  });
});
