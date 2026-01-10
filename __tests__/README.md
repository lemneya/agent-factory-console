# Unit Tests

This directory contains unit tests for the Agent Factory Console application.

## Structure

```
__tests__/
├── components/        # React component tests
│   ├── ui/           # UI component tests
│   └── ...
├── lib/              # Library/utility tests
│   ├── db/           # Database query tests
│   └── github/       # GitHub client tests
├── api/              # API route tests
└── utils/            # Test utilities and mocks
```

## Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- __tests__/components/Button.test.tsx
```

## Writing Tests

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### API Route Tests

```typescript
import { GET } from '@/app/api/projects/route'
import { NextRequest } from 'next/server'

describe('GET /api/projects', () => {
  it('returns projects for authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/projects')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

### Database Query Tests

```typescript
import { getProjectsByUser } from '@/lib/db/projects'
import { prisma } from '@/lib/db/client'

jest.mock('@/lib/db/client')

describe('getProjectsByUser', () => {
  it('returns user projects ordered by lastUpdated', async () => {
    const mockProjects = [{ id: '1', name: 'Test' }]
    ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

    const result = await getProjectsByUser('user-123')
    expect(result).toEqual(mockProjects)
  })
})
```

## Mocking

### Prisma Client

```typescript
// __tests__/utils/prisma-mock.ts
import { PrismaClient } from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'

export type MockPrismaClient = DeepMockProxy<PrismaClient>

export const createMockPrismaClient = (): MockPrismaClient => {
  return mockDeep<PrismaClient>()
}
```

### NextAuth Session

```typescript
// Already mocked in jest.setup.js
// To override for specific tests:
import { useSession } from 'next-auth/react'

jest.mock('next-auth/react')

beforeEach(() => {
  (useSession as jest.Mock).mockReturnValue({
    data: {
      user: { id: 'user-123', email: 'test@example.com' },
      accessToken: 'mock-token'
    },
    status: 'authenticated'
  })
})
```

## Coverage Requirements

Minimum coverage thresholds (configured in jest.config.js):
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Test Categories

### Smoke Tests
Basic functionality tests that verify core features work:
- Component renders without crashing
- API returns expected status codes
- Database queries execute without errors

### Integration Tests
Tests that verify multiple units work together:
- API route with database queries
- Component with data fetching
- Authentication flow

### Edge Case Tests
Tests for boundary conditions and error handling:
- Empty data states
- Invalid inputs
- Network failures
- Unauthorized access
