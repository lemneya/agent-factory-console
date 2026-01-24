/**
 * Forge Feature Inventory
 *
 * The 80% of common features that all apps need but get built repeatedly.
 * Agents can pull from this inventory instead of generating from scratch.
 */

export interface FeatureTemplate {
  id: string;
  name: string;
  category: FeatureCategory;
  description: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedMinutes: number;
  dependencies: string[]; // Other feature IDs this depends on
  files: TemplateFile[];
  requiredEnvVars?: string[];
  packages?: string[];
}

export interface TemplateFile {
  path: string; // e.g., "src/components/auth/LoginForm.tsx"
  type: 'component' | 'api' | 'hook' | 'lib' | 'schema' | 'config';
  template: string; // Template string with {{placeholders}}
}

export type FeatureCategory =
  | 'auth'           // Authentication & authorization
  | 'users'          // User management
  | 'crud'           // CRUD operations
  | 'forms'          // Form handling
  | 'tables'         // Data tables
  | 'uploads'        // File uploads
  | 'payments'       // Payment processing
  | 'notifications'  // Email, push, in-app
  | 'search'         // Search & filtering
  | 'dashboard'      // Analytics & metrics
  | 'realtime'       // WebSocket/SSE
  | 'api'            // API patterns
  | 'ui';            // Common UI components

/**
 * THE 80% INVENTORY
 * Common features organized by category with reuse priority
 */
export const FEATURE_INVENTORY: Record<FeatureCategory, FeatureTemplate[]> = {
  // ============================================
  // AUTHENTICATION (Most apps need this)
  // ============================================
  auth: [
    {
      id: 'auth-nextauth-github',
      name: 'NextAuth with GitHub OAuth',
      category: 'auth',
      description: 'Complete GitHub OAuth setup with session management',
      complexity: 'moderate',
      estimatedMinutes: 10,
      dependencies: [],
      requiredEnvVars: ['GITHUB_ID', 'GITHUB_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
      packages: ['next-auth', '@auth/prisma-adapter'],
      files: [
        {
          path: 'src/lib/auth.ts',
          type: 'lib',
          template: `import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
});`
        },
        {
          path: 'src/app/api/auth/[...nextauth]/route.ts',
          type: 'api',
          template: `import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;`
        },
        {
          path: 'src/middleware.ts',
          type: 'config',
          template: `import { auth } from "@/lib/auth";

export default auth((req) => {
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard");
  if (isProtected && !req.auth) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};`
        }
      ]
    },
    {
      id: 'auth-credentials',
      name: 'Email/Password Authentication',
      category: 'auth',
      description: 'Traditional email/password auth with bcrypt',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: ['users-model'],
      requiredEnvVars: ['NEXTAUTH_SECRET'],
      packages: ['next-auth', 'bcryptjs', '@types/bcryptjs'],
      files: []
    },
    {
      id: 'auth-protected-route',
      name: 'Protected Route Helper',
      category: 'auth',
      description: 'Server-side auth check with ownership validation',
      complexity: 'simple',
      estimatedMinutes: 5,
      dependencies: ['auth-nextauth-github'],
      files: [
        {
          path: 'src/lib/auth-helpers.ts',
          type: 'lib',
          template: `import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";

type AuthResult = { userId: string };
type AuthError = { error: NextResponse };

export async function requireAuth(): Promise<AuthResult | AuthError> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId: session.user.id };
}

export async function require{{Model}}Ownership(
  id: string,
  userId: string
): Promise<{ success: true } | AuthError> {
  const record = await prisma.{{model}}.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!record || record.userId !== userId) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { success: true };
}`
        }
      ]
    }
  ],

  // ============================================
  // USER MANAGEMENT
  // ============================================
  users: [
    {
      id: 'users-model',
      name: 'User Prisma Model',
      category: 'users',
      description: 'Standard user model with profile fields',
      complexity: 'simple',
      estimatedMinutes: 5,
      dependencies: [],
      files: [
        {
          path: 'prisma/schema.prisma',
          type: 'schema',
          template: `model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  // Add relations here: posts Post[], projects Project[], etc.
}`
        }
      ]
    },
    {
      id: 'users-profile-page',
      name: 'User Profile Page',
      category: 'users',
      description: 'Profile view and edit page with avatar',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: ['users-model', 'auth-nextauth-github'],
      files: []
    },
    {
      id: 'users-settings-page',
      name: 'User Settings Page',
      category: 'users',
      description: 'Settings page with preferences and account deletion',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: ['users-model'],
      files: []
    }
  ],

  // ============================================
  // CRUD OPERATIONS (Every app needs these)
  // ============================================
  crud: [
    {
      id: 'crud-api-template',
      name: 'CRUD API Route Template',
      category: 'crud',
      description: 'Complete REST API with list, create, update, delete',
      complexity: 'moderate',
      estimatedMinutes: 10,
      dependencies: ['auth-protected-route'],
      files: [
        {
          path: 'src/app/api/{{models}}/route.ts',
          type: 'api',
          template: `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/{{models}} - List all
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const items = await prisma.{{model}}.findMany({
    where: { userId: authResult.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

// POST /api/{{models}} - Create new
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const body = await request.json();
  const item = await prisma.{{model}}.create({
    data: { ...body, userId: authResult.userId },
  });

  return NextResponse.json(item, { status: 201 });
}`
        },
        {
          path: 'src/app/api/{{models}}/[id]/route.ts',
          type: 'api',
          template: `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, require{{Model}}Ownership } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/{{models}}/[id]
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const ownership = await require{{Model}}Ownership(id, authResult.userId);
  if ("error" in ownership) return ownership.error;

  const item = await prisma.{{model}}.findUnique({ where: { id } });
  return NextResponse.json(item);
}

// PUT /api/{{models}}/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const ownership = await require{{Model}}Ownership(id, authResult.userId);
  if ("error" in ownership) return ownership.error;

  const body = await request.json();
  const item = await prisma.{{model}}.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(item);
}

// DELETE /api/{{models}}/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const ownership = await require{{Model}}Ownership(id, authResult.userId);
  if ("error" in ownership) return ownership.error;

  await prisma.{{model}}.delete({ where: { id } });
  return NextResponse.json({ success: true });
}`
        }
      ]
    },
    {
      id: 'crud-list-component',
      name: 'CRUD List Component',
      category: 'crud',
      description: 'List view with search, pagination, and actions',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: [],
      files: []
    }
  ],

  // ============================================
  // FORMS (Every app needs form handling)
  // ============================================
  forms: [
    {
      id: 'form-validation-hook',
      name: 'Form Validation Hook',
      category: 'forms',
      description: 'useForm hook with validation and error handling',
      complexity: 'moderate',
      estimatedMinutes: 10,
      dependencies: [],
      packages: ['zod'],
      files: [
        {
          path: 'src/hooks/useForm.ts',
          type: 'hook',
          template: `import { useState, useCallback } from "react";
import { z } from "zod";

interface UseFormOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
}

export function useForm<T>({ schema, initialValues, onSubmit }: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(result.data);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, schema, onSubmit]);

  return { values, errors, isSubmitting, setValue, handleSubmit, setValues };
}`
        }
      ]
    },
    {
      id: 'form-input-components',
      name: 'Form Input Components',
      category: 'forms',
      description: 'TextInput, Select, Checkbox, TextArea with labels and errors',
      complexity: 'simple',
      estimatedMinutes: 10,
      dependencies: [],
      files: []
    },
    {
      id: 'form-modal-template',
      name: 'Modal Form Template',
      category: 'forms',
      description: 'Reusable modal with form, validation, and actions',
      complexity: 'moderate',
      estimatedMinutes: 10,
      dependencies: ['form-validation-hook'],
      files: []
    }
  ],

  // ============================================
  // DATA TABLES
  // ============================================
  tables: [
    {
      id: 'table-data-table',
      name: 'DataTable Component',
      category: 'tables',
      description: 'Sortable, filterable table with pagination',
      complexity: 'complex',
      estimatedMinutes: 25,
      dependencies: [],
      files: [
        {
          path: 'src/components/ui/DataTable.tsx',
          type: 'component',
          template: `"use client";
import { useState, useMemo } from "react";

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  pageSize = 10,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter) return data;
    return data.filter(row =>
      Object.values(row).some(v =>
        String(v).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [data, filter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey], bVal = b[sortKey];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="px-3 py-2 border rounded-lg w-64"
      />
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50 dark:bg-gray-800">
            {columns.map(col => (
              <th
                key={String(col.key)}
                onClick={() => {
                  if (col.sortable) {
                    if (sortKey === col.key) {
                      setSortDir(d => d === "asc" ? "desc" : "asc");
                    } else {
                      setSortKey(col.key);
                      setSortDir("asc");
                    }
                  }
                }}
                className={\`px-4 py-3 text-left text-sm font-medium \${col.sortable ? "cursor-pointer hover:bg-gray-100" : ""}\`}
              >
                {col.header}
                {sortKey === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.map(row => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              {columns.map(col => (
                <td key={String(col.key)} className="px-4 py-3 text-sm">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}`
        }
      ]
    }
  ],

  // ============================================
  // FILE UPLOADS
  // ============================================
  uploads: [
    {
      id: 'upload-image',
      name: 'Image Upload Component',
      category: 'uploads',
      description: 'Drag-drop image upload with preview and S3/Cloudinary',
      complexity: 'moderate',
      estimatedMinutes: 20,
      dependencies: [],
      files: []
    },
    {
      id: 'upload-file-api',
      name: 'File Upload API Route',
      category: 'uploads',
      description: 'Multipart file upload endpoint',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: [],
      files: []
    }
  ],

  // ============================================
  // PAYMENTS
  // ============================================
  payments: [
    {
      id: 'payments-stripe-checkout',
      name: 'Stripe Checkout',
      category: 'payments',
      description: 'One-time payment with Stripe Checkout',
      complexity: 'moderate',
      estimatedMinutes: 20,
      dependencies: [],
      requiredEnvVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
      packages: ['stripe'],
      files: [
        {
          path: 'src/lib/stripe.ts',
          type: 'lib',
          template: `import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});`
        },
        {
          path: 'src/app/api/checkout/route.ts',
          type: 'api',
          template: `import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { priceId } = await request.json();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: \`\${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}\`,
    cancel_url: \`\${process.env.NEXTAUTH_URL}/cancel\`,
    metadata: { userId: authResult.userId },
  });

  return NextResponse.json({ url: session.url });
}`
        }
      ]
    },
    {
      id: 'payments-stripe-subscription',
      name: 'Stripe Subscriptions',
      category: 'payments',
      description: 'Recurring subscriptions with customer portal',
      complexity: 'complex',
      estimatedMinutes: 30,
      dependencies: ['payments-stripe-checkout'],
      files: []
    },
    {
      id: 'payments-stripe-webhook',
      name: 'Stripe Webhook Handler',
      category: 'payments',
      description: 'Webhook endpoint for payment events',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: ['payments-stripe-checkout'],
      files: []
    }
  ],

  // ============================================
  // NOTIFICATIONS
  // ============================================
  notifications: [
    {
      id: 'notifications-toast',
      name: 'Toast Notification System',
      category: 'notifications',
      description: 'Context-based toast provider with success/error/info',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: [],
      files: [
        {
          path: 'src/components/ui/Toast.tsx',
          type: 'component',
          template: `"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const value = {
    toast: addToast,
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
  };

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div
            key={t.id}
            className={\`\${colors[t.type]} text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in\`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};`
        }
      ]
    },
    {
      id: 'notifications-email-resend',
      name: 'Email with Resend',
      category: 'notifications',
      description: 'Transactional email sending with Resend',
      complexity: 'simple',
      estimatedMinutes: 10,
      dependencies: [],
      requiredEnvVars: ['RESEND_API_KEY'],
      packages: ['resend'],
      files: []
    }
  ],

  // ============================================
  // SEARCH & FILTERING
  // ============================================
  search: [
    {
      id: 'search-basic',
      name: 'Basic Search Component',
      category: 'search',
      description: 'Search input with debounce and loading state',
      complexity: 'simple',
      estimatedMinutes: 10,
      dependencies: [],
      files: [
        {
          path: 'src/hooks/useDebounce.ts',
          type: 'hook',
          template: `import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}`
        }
      ]
    },
    {
      id: 'search-faceted-filters',
      name: 'Faceted Filter Panel',
      category: 'search',
      description: 'Multi-select filters with counts',
      complexity: 'moderate',
      estimatedMinutes: 20,
      dependencies: [],
      files: []
    }
  ],

  // ============================================
  // DASHBOARD & ANALYTICS
  // ============================================
  dashboard: [
    {
      id: 'dashboard-stats-cards',
      name: 'Stats Cards Grid',
      category: 'dashboard',
      description: 'KPI cards with icons, values, and change indicators',
      complexity: 'simple',
      estimatedMinutes: 10,
      dependencies: [],
      files: [
        {
          path: 'src/components/dashboard/StatsCard.tsx',
          type: 'component',
          template: `interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  const isPositive = change && change > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <p className={\`text-sm mt-1 \${isPositive ? "text-green-600" : "text-red-600"}\`}>
              {isPositive ? "↑" : "↓"} {Math.abs(change)}%
            </p>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}`
        }
      ]
    },
    {
      id: 'dashboard-charts',
      name: 'Chart Components',
      category: 'dashboard',
      description: 'Line, bar, and pie charts with Recharts',
      complexity: 'moderate',
      estimatedMinutes: 20,
      dependencies: [],
      packages: ['recharts'],
      files: []
    }
  ],

  // ============================================
  // REAL-TIME
  // ============================================
  realtime: [
    {
      id: 'realtime-sse-hook',
      name: 'SSE Connection Hook',
      category: 'realtime',
      description: 'Server-Sent Events hook with reconnection',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: [],
      files: [
        {
          path: 'src/hooks/useSSE.ts',
          type: 'hook',
          template: `import { useEffect, useRef, useState, useCallback } from "react";

interface UseSSEOptions {
  url: string;
  onMessage: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  reconnectDelay?: number;
}

export function useSSE({ url, onMessage, onError, reconnectDelay = 3000 }: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setIsConnected(true);
    es.onmessage = onMessage;
    es.onerror = (e) => {
      setIsConnected(false);
      onError?.(e);
      es.close();
      eventSourceRef.current = null;
      reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
    };
  }, [url, onMessage, onError, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { isConnected, disconnect, reconnect: connect };
}`
        }
      ]
    },
    {
      id: 'realtime-sse-endpoint',
      name: 'SSE API Endpoint',
      category: 'realtime',
      description: 'Server-Sent Events streaming endpoint',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: [],
      files: [
        {
          path: 'src/app/api/stream/route.ts',
          type: 'api',
          template: `export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(\`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`));
      };

      send("connected", { timestamp: Date.now() });

      // Example: send updates every 5 seconds
      const interval = setInterval(() => {
        send("ping", { timestamp: Date.now() });
      }, 5000);

      // Clean up when client disconnects
      // Note: Handle actual cleanup in your implementation
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}`
        }
      ]
    }
  ],

  // ============================================
  // API PATTERNS
  // ============================================
  api: [
    {
      id: 'api-error-handling',
      name: 'API Error Handler',
      category: 'api',
      description: 'Consistent error response formatting',
      complexity: 'simple',
      estimatedMinutes: 5,
      dependencies: [],
      files: [
        {
          path: 'src/lib/api-utils.ts',
          type: 'lib',
          template: `import { NextResponse } from "next/server";

export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export async function withErrorHandler<T>(
  fn: () => Promise<T>
): Promise<NextResponse> {
  try {
    const result = await fn();
    return apiSuccess(result);
  } catch (error) {
    console.error("API Error:", error);
    if (error instanceof Error) {
      return apiError(error.message);
    }
    return apiError("Internal server error");
  }
}`
        }
      ]
    },
    {
      id: 'api-pagination',
      name: 'Pagination Helper',
      category: 'api',
      description: 'Cursor and offset pagination utilities',
      complexity: 'simple',
      estimatedMinutes: 10,
      dependencies: [],
      files: [
        {
          path: 'src/lib/pagination.ts',
          type: 'lib',
          template: `import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(request: NextRequest, defaultLimit = 20): PaginationParams {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit))));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}`
        }
      ]
    }
  ],

  // ============================================
  // UI COMPONENTS
  // ============================================
  ui: [
    {
      id: 'ui-loading-states',
      name: 'Loading State Components',
      category: 'ui',
      description: 'Skeleton loaders, spinners, and progress bars',
      complexity: 'simple',
      estimatedMinutes: 10,
      dependencies: [],
      files: [
        {
          path: 'src/components/ui/Loading.tsx',
          type: 'component',
          template: `export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className={\`\${sizes[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600\`} />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={\`animate-pulse bg-gray-200 dark:bg-gray-700 rounded \${className}\`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}`
        }
      ]
    },
    {
      id: 'ui-empty-states',
      name: 'Empty State Components',
      category: 'ui',
      description: 'Empty state placeholders with icons and CTAs',
      complexity: 'simple',
      estimatedMinutes: 5,
      dependencies: [],
      files: [
        {
          path: 'src/components/ui/EmptyState.tsx',
          type: 'component',
          template: `interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-gray-400 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}`
        }
      ]
    },
    {
      id: 'ui-modal',
      name: 'Modal Component',
      category: 'ui',
      description: 'Accessible modal with backdrop and focus trap',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: [],
      files: []
    },
    {
      id: 'ui-dropdown',
      name: 'Dropdown Menu',
      category: 'ui',
      description: 'Accessible dropdown with keyboard navigation',
      complexity: 'moderate',
      estimatedMinutes: 15,
      dependencies: [],
      files: []
    },
    {
      id: 'ui-breadcrumbs',
      name: 'Breadcrumb Navigation',
      category: 'ui',
      description: 'Breadcrumb component with auto-generation from path',
      complexity: 'simple',
      estimatedMinutes: 10,
      dependencies: [],
      files: []
    }
  ]
};

/**
 * Get all features for a category
 */
export function getFeaturesForCategory(category: FeatureCategory): FeatureTemplate[] {
  return FEATURE_INVENTORY[category] || [];
}

/**
 * Get a specific feature by ID
 */
export function getFeatureById(id: string): FeatureTemplate | undefined {
  for (const features of Object.values(FEATURE_INVENTORY)) {
    const feature = features.find(f => f.id === id);
    if (feature) return feature;
  }
  return undefined;
}

/**
 * Get all features that match keywords in a spec
 */
export function matchFeaturesFromSpec(spec: string): FeatureTemplate[] {
  const matched: FeatureTemplate[] = [];
  const specLower = spec.toLowerCase();

  // Keyword mappings
  const keywordMap: Record<string, string[]> = {
    'auth': ['login', 'auth', 'sign in', 'sign up', 'register', 'password', 'oauth', 'github'],
    'users': ['user', 'profile', 'account', 'settings'],
    'crud': ['list', 'create', 'edit', 'delete', 'manage', 'crud'],
    'payments': ['stripe', 'payment', 'billing', 'subscription', 'checkout', 'buy', 'purchase'],
    'uploads': ['upload', 'file', 'image', 'avatar', 'attachment'],
    'notifications': ['notification', 'email', 'alert', 'toast', 'message'],
    'search': ['search', 'filter', 'find', 'query'],
    'dashboard': ['dashboard', 'analytics', 'metrics', 'chart', 'report', 'stats'],
    'realtime': ['realtime', 'real-time', 'live', 'websocket', 'sse', 'streaming'],
    'tables': ['table', 'grid', 'list view', 'data grid', 'pagination'],
  };

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => specLower.includes(kw))) {
      matched.push(...FEATURE_INVENTORY[category as FeatureCategory]);
    }
  }

  // Always include common features
  matched.push(...FEATURE_INVENTORY.api);
  matched.push(...FEATURE_INVENTORY.ui.filter(f =>
    f.id === 'ui-loading-states' || f.id === 'ui-empty-states'
  ));

  // Deduplicate
  return [...new Map(matched.map(f => [f.id, f])).values()];
}

/**
 * Get total estimated time for a set of features
 */
export function getEstimatedTime(featureIds: string[]): number {
  return featureIds.reduce((total, id) => {
    const feature = getFeatureById(id);
    return total + (feature?.estimatedMinutes || 0);
  }, 0);
}

/**
 * Get all required packages for features
 */
export function getRequiredPackages(featureIds: string[]): string[] {
  const packages = new Set<string>();
  for (const id of featureIds) {
    const feature = getFeatureById(id);
    feature?.packages?.forEach(pkg => packages.add(pkg));
  }
  return [...packages];
}

/**
 * Get all required env vars for features
 */
export function getRequiredEnvVars(featureIds: string[]): string[] {
  const envVars = new Set<string>();
  for (const id of featureIds) {
    const feature = getFeatureById(id);
    feature?.requiredEnvVars?.forEach(v => envVars.add(v));
  }
  return [...envVars];
}
