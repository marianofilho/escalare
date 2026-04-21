// tests/setup.ts
import { vi } from "vitest"

// Evita que o Prisma tente conectar ao banco nos unit tests
vi.mock("@/lib/prisma", () => ({
  prisma: {},
}))