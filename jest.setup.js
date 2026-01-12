// Jest setup file
// Add any global test setup here

import '@testing-library/jest-dom';

// Polyfill for Web Crypto API
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto.subtle for Jest
const crypto = require('crypto');
global.crypto = {
  subtle: {
    digest: async (algorithm, data) => {
      const hash = crypto.createHash('sha256');
      hash.update(Buffer.from(data));
      return hash.digest();
    },
  },
  getRandomValues: (arr) => crypto.randomBytes(arr.length),
};

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock octokit to avoid ESM issues
jest.mock('octokit', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        listForAuthenticatedUser: jest.fn(),
        get: jest.fn(),
      },
      issues: {
        listForRepo: jest.fn(),
      },
      pulls: {
        list: jest.fn(),
      },
    },
    paginate: {
      iterator: jest.fn(),
    },
  })),
}));

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
