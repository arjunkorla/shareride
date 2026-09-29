import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { AdminUsersController } from './admin-users.controller'
import type { PrismaService } from '../../common/prisma/prisma.service'
import type { AuditService } from '../../common/audit/audit.service'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'

// Closes docs/agent-handoff.md finding C04: `admin.user.manage` alone (held
// by plain ADMIN, not just SUPER_ADMIN) previously let any admin create —
// or reactivate — another admin account holding a MORE privileged role
// than their own, including SUPER_ADMIN itself. The fix is a grant
// ceiling: an admin may only grant/reactivate permissions that are already
// a subset of their own. No service layer here — this controller talks to
// Prisma directly, so it's tested the same hand-built-fake way as every
// *.service.spec.ts in this repo.
describe('AdminUsersController', () => {
  function makeCaller(permissions: string[]): AuthenticatedUser {
    return {
      id: 'caller-1',
      phone: null,
      email: 'caller@example.com',
      fullName: 'Caller Admin',
      roles: ['ADMIN'],
      admin: { roleKey: 'ADMIN', roleName: 'Admin', permissions: permissions as never },
    }
  }

  function makeRole(id: string, permissions: string[]) {
    return { id, key: id, name: id, permissions }
  }

  function makePrisma(options: { role?: ReturnType<typeof makeRole> | null; targetAdminUser?: { isActive: boolean; role: { permissions: string[] } } | null } = {}) {
    return {
      client: {
        adminRoleDefinition: {
          findUnique: jest.fn().mockResolvedValue(options.role === undefined ? makeRole('role-admin', ['user.read']) : options.role),
        },
        adminUser: {
          create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ id: data.id, ...data, role: { key: 'ADMIN', name: 'Admin' } })),
          findUnique: jest.fn().mockResolvedValue(options.targetAdminUser === undefined ? { isActive: false, role: { permissions: ['user.read'] } } : options.targetAdminUser),
          update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'target-1', ...data })),
        },
        auditLog: { create: jest.fn().mockResolvedValue({}) },
      },
    } as unknown as PrismaService
  }

  function makeAudit(): AuditService {
    return { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService
  }

  describe('create', () => {
    it('refuses to let an ADMIN grant a role with more permissions than their own (privilege escalation)', async () => {
      const prisma = makePrisma({ role: makeRole('role-super', ['user.read', 'admin.role.manage', 'admin.permission.manage']) })
      const controller = new AdminUsersController(prisma, makeAudit())
      const caller = makeCaller(['admin.user.manage', 'user.read'])

      await expect(
        controller.create({ id: 'new-admin', email: 'new@example.com', fullName: 'New Admin', roleId: 'role-super' }, caller),
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(prisma.client.adminUser.create).not.toHaveBeenCalled()
    })

    it('allows an ADMIN to grant a role that is a strict subset of their own permissions', async () => {
      const prisma = makePrisma({ role: makeRole('role-support', ['user.read']) })
      const controller = new AdminUsersController(prisma, makeAudit())
      const caller = makeCaller(['admin.user.manage', 'user.read', 'report.read'])

      await controller.create({ id: 'new-admin', email: 'new@example.com', fullName: 'New Admin', roleId: 'role-support' }, caller)

      expect(prisma.client.adminUser.create).toHaveBeenCalled()
    })

    it('allows a SUPER_ADMIN (equal permission set) to grant SUPER_ADMIN', async () => {
      const superPermissions = ['user.read', 'admin.role.manage', 'admin.permission.manage', 'admin.user.manage']
      const prisma = makePrisma({ role: makeRole('role-super', superPermissions) })
      const controller = new AdminUsersController(prisma, makeAudit())
      const caller = makeCaller(superPermissions)

      await controller.create({ id: 'new-admin', email: 'new@example.com', fullName: 'New Admin', roleId: 'role-super' }, caller)

      expect(prisma.client.adminUser.create).toHaveBeenCalled()
    })

    it('reports role-not-found before evaluating the grant ceiling', async () => {
      const prisma = makePrisma({ role: null })
      const controller = new AdminUsersController(prisma, makeAudit())
      const caller = makeCaller(['admin.user.manage'])

      await expect(
        controller.create({ id: 'new-admin', email: 'new@example.com', fullName: 'New Admin', roleId: 'missing' }, caller),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('reactivate', () => {
    it('refuses to let an ADMIN reactivate an account holding a more privileged role than their own', async () => {
      const prisma = makePrisma({ targetAdminUser: { isActive: false, role: { permissions: ['user.read', 'admin.role.manage'] } } })
      const controller = new AdminUsersController(prisma, makeAudit())
      const caller = makeCaller(['admin.user.manage', 'user.read'])

      await expect(controller.reactivate('target-1', caller)).rejects.toBeInstanceOf(ForbiddenException)
      expect(prisma.client.adminUser.update).not.toHaveBeenCalled()
    })

    it('allows reactivating an account whose role is a subset of the caller\'s own', async () => {
      const prisma = makePrisma({ targetAdminUser: { isActive: false, role: { permissions: ['user.read'] } } })
      const controller = new AdminUsersController(prisma, makeAudit())
      const caller = makeCaller(['admin.user.manage', 'user.read', 'report.read'])

      await controller.reactivate('target-1', caller)

      expect(prisma.client.adminUser.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: true } }))
    })

    it('reports not-found for a nonexistent admin user', async () => {
      const prisma = makePrisma({ targetAdminUser: null })
      const controller = new AdminUsersController(prisma, makeAudit())
      const caller = makeCaller(['admin.user.manage'])

      await expect(controller.reactivate('missing', caller)).rejects.toBeInstanceOf(NotFoundException)
    })
  })
})
