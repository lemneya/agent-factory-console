/**
 * Unit tests for Prisma client singleton
 */

describe('Prisma Client Singleton', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should export prisma client as default', async () => {
    const { default: prisma } = await import('@/lib/prisma');
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe('object');
  });

  it('should export prisma client as named export', async () => {
    const { prisma } = await import('@/lib/prisma');
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe('object');
  });

  it('should return same instance on multiple imports (singleton pattern)', async () => {
    const { prisma: prisma1 } = await import('@/lib/prisma');
    const { prisma: prisma2 } = await import('@/lib/prisma');
    expect(prisma1).toBe(prisma2);
  });
});
