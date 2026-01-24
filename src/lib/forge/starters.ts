/**
 * Forge Clonable Starters
 *
 * Full app templates that are 90-100% complete.
 * Clone and customize instead of building from scratch.
 *
 * Time savings: Hours → Minutes
 */

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  category: StarterCategory;
  repoUrl: string; // GitHub URL to clone
  stars?: number; // GitHub stars (popularity indicator)
  lastUpdated?: string;
  techStack: {
    framework: string;
    database?: string;
    auth?: string;
    styling: string;
    payments?: string;
  };
  features: string[]; // What's included out of the box
  customizationPoints: CustomizationPoint[]; // What typically needs changing
  estimatedCustomizationMinutes: number; // Time to customize, not build
  envVarsRequired: string[];
  previewUrl?: string;
}

export interface CustomizationPoint {
  area: string;
  description: string;
  files: string[];
  effort: 'trivial' | 'easy' | 'moderate';
}

export type StarterCategory =
  | 'saas'           // SaaS boilerplates
  | 'ecommerce'      // Online stores
  | 'dashboard'      // Admin panels
  | 'blog'           // Content/blog platforms
  | 'landing'        // Marketing/landing pages
  | 'api'            // API-only backends
  | 'mobile'         // Mobile app backends
  | 'ai'             // AI/ML apps
  | 'marketplace'    // Multi-vendor platforms
  | 'community'      // Forums, social apps
  | 'portfolio'      // Personal/professional portfolios
  | 'agency'         // Agency/business websites
  | 'docs'           // Documentation sites
  | 'local';         // Local business (restaurants, services)

/**
 * CLONABLE STARTERS INVENTORY
 *
 * These are production-ready templates that can be cloned
 * and customized in minutes instead of hours/days.
 */
export const STARTER_TEMPLATES: StarterTemplate[] = [
  // ============================================
  // SAAS STARTERS
  // ============================================
  {
    id: 'next-saas-starter',
    name: 'Next.js SaaS Starter',
    description: 'Complete SaaS template with auth, billing, teams, and dashboard',
    category: 'saas',
    repoUrl: 'https://github.com/leerob/next-saas-starter',
    stars: 5000,
    techStack: {
      framework: 'Next.js 14',
      database: 'Postgres + Drizzle',
      auth: 'NextAuth.js',
      styling: 'Tailwind CSS',
      payments: 'Stripe',
    },
    features: [
      'User authentication (email/password + OAuth)',
      'Stripe subscriptions & billing portal',
      'Team management with invites',
      'Admin dashboard',
      'User settings page',
      'Dark mode support',
      'Email templates (React Email)',
      'Rate limiting',
    ],
    customizationPoints: [
      {
        area: 'Branding',
        description: 'Logo, colors, company name',
        files: ['app/layout.tsx', 'tailwind.config.ts', 'public/'],
        effort: 'trivial',
      },
      {
        area: 'Pricing plans',
        description: 'Update Stripe products and pricing tiers',
        files: ['lib/stripe.ts', 'app/pricing/page.tsx'],
        effort: 'easy',
      },
      {
        area: 'Core features',
        description: 'Add your app-specific features',
        files: ['app/dashboard/**', 'lib/db/schema.ts'],
        effort: 'moderate',
      },
    ],
    estimatedCustomizationMinutes: 30,
    envVarsRequired: [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ],
    previewUrl: 'https://next-saas-starter.vercel.app',
  },
  {
    id: 'supastarter',
    name: 'Supastarter',
    description: 'Production-ready SaaS with Supabase, i18n, and AI features',
    category: 'saas',
    repoUrl: 'https://github.com/supastarter/supastarter',
    techStack: {
      framework: 'Next.js 14',
      database: 'Supabase (Postgres)',
      auth: 'Supabase Auth',
      styling: 'Tailwind + shadcn/ui',
      payments: 'Stripe + LemonSqueezy',
    },
    features: [
      'Multi-tenancy (teams/orgs)',
      'Internationalization (i18n)',
      'AI integration ready',
      'Email with Resend',
      'Blog with MDX',
      'Analytics dashboard',
      'File uploads',
      'API rate limiting',
    ],
    customizationPoints: [
      {
        area: 'Branding',
        description: 'Logo, theme, copy',
        files: ['config/site.ts', 'tailwind.config.ts'],
        effort: 'trivial',
      },
      {
        area: 'Features',
        description: 'Add domain-specific features',
        files: ['app/(app)/**', 'lib/api/**'],
        effort: 'moderate',
      },
    ],
    estimatedCustomizationMinutes: 45,
    envVarsRequired: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
    ],
  },
  {
    id: 'taxonomy',
    name: 'Taxonomy',
    description: 'Open source app built with Next.js 13 and everything new',
    category: 'saas',
    repoUrl: 'https://github.com/shadcn-ui/taxonomy',
    stars: 17000,
    techStack: {
      framework: 'Next.js 13+',
      database: 'Prisma + PlanetScale',
      auth: 'NextAuth.js',
      styling: 'Tailwind + shadcn/ui',
      payments: 'Stripe',
    },
    features: [
      'Authentication with NextAuth.js',
      'ORM with Prisma',
      'Database on PlanetScale',
      'UI components with shadcn/ui',
      'Documentation with Contentlayer',
      'Subscriptions with Stripe',
    ],
    customizationPoints: [
      {
        area: 'Content',
        description: 'Replace docs and marketing content',
        files: ['content/**', 'app/(marketing)/**'],
        effort: 'easy',
      },
      {
        area: 'App features',
        description: 'Build your core product',
        files: ['app/(dashboard)/**', 'prisma/schema.prisma'],
        effort: 'moderate',
      },
    ],
    estimatedCustomizationMinutes: 40,
    envVarsRequired: [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'GITHUB_CLIENT_ID',
      'STRIPE_SECRET_KEY',
    ],
  },

  // ============================================
  // E-COMMERCE
  // ============================================
  {
    id: 'nextjs-commerce',
    name: 'Next.js Commerce',
    description: 'Vercel\'s official e-commerce template with Shopify',
    category: 'ecommerce',
    repoUrl: 'https://github.com/vercel/commerce',
    stars: 10000,
    techStack: {
      framework: 'Next.js 14',
      database: 'Shopify (headless)',
      auth: 'Shopify Customer API',
      styling: 'Tailwind CSS',
      payments: 'Shopify Checkout',
    },
    features: [
      'Product catalog with search',
      'Shopping cart',
      'Checkout flow',
      'Customer accounts',
      'Product recommendations',
      'SEO optimized',
      'Edge runtime ready',
    ],
    customizationPoints: [
      {
        area: 'Branding',
        description: 'Logo, colors, fonts',
        files: ['app/layout.tsx', 'tailwind.config.ts'],
        effort: 'trivial',
      },
      {
        area: 'Products',
        description: 'Add products via Shopify admin',
        files: [],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 20,
    envVarsRequired: [
      'SHOPIFY_STORE_DOMAIN',
      'SHOPIFY_STOREFRONT_ACCESS_TOKEN',
    ],
    previewUrl: 'https://demo.vercel.store',
  },
  {
    id: 'medusa-nextjs',
    name: 'Medusa + Next.js Storefront',
    description: 'Open source Shopify alternative with full customization',
    category: 'ecommerce',
    repoUrl: 'https://github.com/medusajs/nextjs-starter-medusa',
    techStack: {
      framework: 'Next.js 14',
      database: 'Medusa (Postgres)',
      auth: 'Medusa Auth',
      styling: 'Tailwind CSS',
      payments: 'Stripe, PayPal',
    },
    features: [
      'Full e-commerce backend',
      'Product management',
      'Order management',
      'Customer management',
      'Discount codes',
      'Multi-currency',
      'Tax calculation',
      'Shipping providers',
    ],
    customizationPoints: [
      {
        area: 'Storefront design',
        description: 'Customize the store UI',
        files: ['src/modules/**', 'src/app/**'],
        effort: 'moderate',
      },
      {
        area: 'Backend extensions',
        description: 'Add custom API routes to Medusa',
        files: ['medusa/src/api/**'],
        effort: 'moderate',
      },
    ],
    estimatedCustomizationMinutes: 60,
    envVarsRequired: [
      'NEXT_PUBLIC_MEDUSA_BACKEND_URL',
      'NEXT_PUBLIC_BASE_URL',
    ],
  },

  // ============================================
  // ADMIN DASHBOARDS
  // ============================================
  {
    id: 'shadcn-admin',
    name: 'Shadcn Admin Dashboard',
    description: 'Beautiful admin dashboard with shadcn/ui components',
    category: 'dashboard',
    repoUrl: 'https://github.com/satnaing/shadcn-admin',
    stars: 2000,
    techStack: {
      framework: 'Next.js 14',
      database: 'Any (bring your own)',
      auth: 'Custom (pluggable)',
      styling: 'Tailwind + shadcn/ui',
    },
    features: [
      'Responsive sidebar layout',
      'Data tables with sorting/filtering',
      'Charts and analytics',
      'User management UI',
      'Settings pages',
      'Dark/light mode',
      'Form components',
    ],
    customizationPoints: [
      {
        area: 'Data source',
        description: 'Connect to your API/database',
        files: ['lib/api/**', 'hooks/**'],
        effort: 'moderate',
      },
      {
        area: 'Pages',
        description: 'Add/modify dashboard pages',
        files: ['app/(dashboard)/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 45,
    envVarsRequired: [],
  },
  {
    id: 'tremor-dashboard',
    name: 'Tremor Dashboard',
    description: 'Analytics dashboard with Tremor React components',
    category: 'dashboard',
    repoUrl: 'https://github.com/tremorlabs/tremor-nextjs-dashboard',
    techStack: {
      framework: 'Next.js 14',
      database: 'Any',
      auth: 'Any',
      styling: 'Tailwind + Tremor',
    },
    features: [
      'KPI cards',
      'Charts (line, bar, area, donut)',
      'Data tables',
      'Filter controls',
      'Date range picker',
      'Responsive grid layouts',
    ],
    customizationPoints: [
      {
        area: 'Data',
        description: 'Connect to analytics data source',
        files: ['lib/data.ts', 'app/api/**'],
        effort: 'moderate',
      },
      {
        area: 'Metrics',
        description: 'Define your KPIs and charts',
        files: ['app/page.tsx', 'components/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 30,
    envVarsRequired: [],
  },

  // ============================================
  // BLOGS & CONTENT
  // ============================================
  {
    id: 'nextra',
    name: 'Nextra',
    description: 'Next.js static site generator for docs and blogs',
    category: 'blog',
    repoUrl: 'https://github.com/shuding/nextra',
    stars: 10000,
    techStack: {
      framework: 'Next.js 14',
      database: 'None (static)',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'MDX support',
      'Full-text search',
      'Syntax highlighting',
      'Dark mode',
      'i18n support',
      'Table of contents',
      'SEO optimized',
    ],
    customizationPoints: [
      {
        area: 'Theme',
        description: 'Customize colors and layout',
        files: ['theme.config.tsx', 'tailwind.config.js'],
        effort: 'trivial',
      },
      {
        area: 'Content',
        description: 'Add your documentation/blog posts',
        files: ['pages/**/*.mdx'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 15,
    envVarsRequired: [],
    previewUrl: 'https://nextra.site',
  },
  {
    id: 'contentlayer-blog',
    name: 'Contentlayer Blog',
    description: 'Modern blog with MDX, Contentlayer, and Next.js',
    category: 'blog',
    repoUrl: 'https://github.com/contentlayerdev/next-contentlayer-example',
    techStack: {
      framework: 'Next.js 14',
      database: 'None (static)',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'MDX blog posts',
      'Automatic OG images',
      'RSS feed',
      'Sitemap',
      'Reading time',
      'Tags/categories',
    ],
    customizationPoints: [
      {
        area: 'Posts',
        description: 'Write your blog posts in MDX',
        files: ['content/**'],
        effort: 'trivial',
      },
      {
        area: 'Design',
        description: 'Customize the blog layout',
        files: ['app/**', 'components/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 20,
    envVarsRequired: [],
  },

  // ============================================
  // LANDING PAGES
  // ============================================
  {
    id: 'next-landing',
    name: 'Next.js Landing Page',
    description: 'High-converting landing page template',
    category: 'landing',
    repoUrl: 'https://github.com/cruip/open-react-template',
    techStack: {
      framework: 'Next.js 14',
      database: 'None',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'Hero section',
      'Features grid',
      'Pricing table',
      'Testimonials',
      'FAQ accordion',
      'CTA sections',
      'Newsletter signup',
      'Animations',
    ],
    customizationPoints: [
      {
        area: 'Copy',
        description: 'Update text and images',
        files: ['app/page.tsx', 'public/**'],
        effort: 'trivial',
      },
      {
        area: 'Sections',
        description: 'Add/remove landing sections',
        files: ['components/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 15,
    envVarsRequired: [],
  },
  {
    id: 'tailwind-landing',
    name: 'Tailwind UI Landing',
    description: 'Premium landing page components (free tier)',
    category: 'landing',
    repoUrl: 'https://github.com/tailwindlabs/tailwindcss.com',
    techStack: {
      framework: 'Next.js',
      database: 'None',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'Marketing components',
      'Hero variants',
      'Feature sections',
      'Pricing tables',
      'Team sections',
      'Footer layouts',
    ],
    customizationPoints: [
      {
        area: 'Content',
        description: 'Replace placeholder content',
        files: ['src/pages/**'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 20,
    envVarsRequired: [],
  },

  // ============================================
  // AI APPS
  // ============================================
  {
    id: 'chatbot-ui',
    name: 'Chatbot UI',
    description: 'Open source ChatGPT clone with multiple providers',
    category: 'ai',
    repoUrl: 'https://github.com/mckaywrigley/chatbot-ui',
    stars: 25000,
    techStack: {
      framework: 'Next.js 14',
      database: 'Supabase',
      auth: 'Supabase Auth',
      styling: 'Tailwind CSS',
    },
    features: [
      'Multi-model support (GPT-4, Claude, etc.)',
      'Conversation history',
      'Prompt templates',
      'File uploads',
      'Code highlighting',
      'Streaming responses',
      'Local storage fallback',
    ],
    customizationPoints: [
      {
        area: 'Branding',
        description: 'Logo and app name',
        files: ['components/ui/**', 'app/layout.tsx'],
        effort: 'trivial',
      },
      {
        area: 'Models',
        description: 'Configure available AI models',
        files: ['lib/models/**', 'types/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 25,
    envVarsRequired: [
      'OPENAI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ],
  },
  {
    id: 'ai-chatbot',
    name: 'Vercel AI Chatbot',
    description: 'Full-featured AI chatbot with Vercel AI SDK',
    category: 'ai',
    repoUrl: 'https://github.com/vercel/ai-chatbot',
    stars: 5000,
    techStack: {
      framework: 'Next.js 14',
      database: 'Vercel KV',
      auth: 'NextAuth.js',
      styling: 'Tailwind + shadcn/ui',
    },
    features: [
      'Streaming chat UI',
      'Multiple AI providers',
      'Chat history persistence',
      'Share conversations',
      'Rate limiting',
      'Edge runtime',
    ],
    customizationPoints: [
      {
        area: 'Providers',
        description: 'Switch AI providers',
        files: ['app/api/chat/route.ts'],
        effort: 'easy',
      },
      {
        area: 'UI',
        description: 'Customize chat interface',
        files: ['components/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 20,
    envVarsRequired: [
      'OPENAI_API_KEY',
      'AUTH_SECRET',
      'KV_URL',
    ],
    previewUrl: 'https://chat.vercel.ai',
  },

  // ============================================
  // MARKETPLACES
  // ============================================
  {
    id: 'saleor',
    name: 'Saleor Storefront',
    description: 'Enterprise-grade marketplace platform',
    category: 'marketplace',
    repoUrl: 'https://github.com/saleor/storefront',
    techStack: {
      framework: 'Next.js 14',
      database: 'Saleor GraphQL',
      auth: 'Saleor Auth',
      styling: 'Tailwind CSS',
    },
    features: [
      'Multi-vendor support',
      'Product management',
      'Order management',
      'Customer management',
      'Checkout customization',
      'Webhooks',
      'GraphQL API',
    ],
    customizationPoints: [
      {
        area: 'Storefront',
        description: 'Customize store design',
        files: ['src/app/**', 'src/components/**'],
        effort: 'moderate',
      },
    ],
    estimatedCustomizationMinutes: 90,
    envVarsRequired: [
      'NEXT_PUBLIC_SALEOR_API_URL',
    ],
  },

  // ============================================
  // COMMUNITY / SOCIAL
  // ============================================
  {
    id: 'discourse-nextjs',
    name: 'Forum Starter',
    description: 'Community forum with discussions and categories',
    category: 'community',
    repoUrl: 'https://github.com/novuhq/novu',
    techStack: {
      framework: 'Next.js 14',
      database: 'Postgres',
      auth: 'NextAuth.js',
      styling: 'Tailwind CSS',
    },
    features: [
      'Discussion threads',
      'Categories/tags',
      'User profiles',
      'Notifications',
      'Search',
      'Moderation tools',
    ],
    customizationPoints: [
      {
        area: 'Categories',
        description: 'Define forum categories',
        files: ['lib/db/schema.ts', 'app/categories/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 45,
    envVarsRequired: [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
    ],
  },

  // ============================================
  // PORTFOLIO WEBSITES
  // ============================================
  {
    id: 'developer-portfolio',
    name: 'Developer Portfolio',
    description: 'Modern developer portfolio with projects showcase',
    category: 'portfolio',
    repoUrl: 'https://github.com/craftzdog/craftzdog-homepage',
    stars: 3500,
    techStack: {
      framework: 'Next.js 14',
      database: 'None',
      auth: 'None',
      styling: 'Chakra UI',
    },
    features: [
      'Animated hero section',
      'Projects gallery with filters',
      'Skills/tech stack display',
      '3D elements (Three.js)',
      'Blog integration',
      'Contact form',
      'Dark/light mode',
      'Responsive design',
    ],
    customizationPoints: [
      {
        area: 'Content',
        description: 'Bio, projects, skills',
        files: ['pages/index.tsx', 'pages/works/**'],
        effort: 'trivial',
      },
      {
        area: 'Styling',
        description: 'Colors and theme',
        files: ['lib/theme.ts', 'components/**'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 20,
    envVarsRequired: [],
    previewUrl: 'https://www.craftz.dog',
  },
  {
    id: 'designer-portfolio',
    name: 'Designer Portfolio',
    description: 'Minimal portfolio for designers and creatives',
    category: 'portfolio',
    repoUrl: 'https://github.com/leerob/leerob.io',
    stars: 7000,
    techStack: {
      framework: 'Next.js 14',
      database: 'None',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'Clean minimal design',
      'Project case studies',
      'Blog with MDX',
      'Spotify now playing',
      'View counter',
      'Guestbook',
      'RSS feed',
      'SEO optimized',
    ],
    customizationPoints: [
      {
        area: 'Content',
        description: 'About, projects, blog posts',
        files: ['app/**', 'content/**'],
        effort: 'trivial',
      },
      {
        area: 'Branding',
        description: 'Colors, fonts, images',
        files: ['tailwind.config.ts', 'public/**'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 15,
    envVarsRequired: [],
    previewUrl: 'https://leerob.io',
  },
  {
    id: 'photographer-portfolio',
    name: 'Photography Portfolio',
    description: 'Image-focused portfolio with gallery layouts',
    category: 'portfolio',
    repoUrl: 'https://github.com/vercel/next.js/tree/canary/examples/image-gallery',
    techStack: {
      framework: 'Next.js 14',
      database: 'None',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'Masonry image grid',
      'Lightbox viewer',
      'Image optimization',
      'Lazy loading',
      'Categories/albums',
      'EXIF data display',
      'Print ordering (optional)',
    ],
    customizationPoints: [
      {
        area: 'Images',
        description: 'Add your photography',
        files: ['public/images/**', 'data/photos.ts'],
        effort: 'trivial',
      },
      {
        area: 'Layout',
        description: 'Gallery grid style',
        files: ['components/Gallery.tsx'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 15,
    envVarsRequired: [],
  },

  // ============================================
  // AGENCY / BUSINESS WEBSITES
  // ============================================
  {
    id: 'agency-starter',
    name: 'Agency Website',
    description: 'Professional agency/studio website with case studies',
    category: 'agency',
    repoUrl: 'https://github.com/wevm/vocs',
    stars: 1500,
    techStack: {
      framework: 'Next.js 14',
      database: 'None',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'Services showcase',
      'Case studies/portfolio',
      'Team members grid',
      'Client logos',
      'Testimonials carousel',
      'Contact form with validation',
      'Blog/insights section',
      'Animated transitions',
    ],
    customizationPoints: [
      {
        area: 'Branding',
        description: 'Logo, colors, fonts',
        files: ['tailwind.config.ts', 'public/**'],
        effort: 'trivial',
      },
      {
        area: 'Content',
        description: 'Services, case studies, team',
        files: ['data/**', 'app/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 25,
    envVarsRequired: [],
  },
  {
    id: 'startup-website',
    name: 'Startup Website',
    description: 'Modern startup website with product focus',
    category: 'agency',
    repoUrl: 'https://github.com/shadcn-ui/ui',
    stars: 50000,
    techStack: {
      framework: 'Next.js 14',
      database: 'None',
      auth: 'None',
      styling: 'Tailwind + shadcn/ui',
    },
    features: [
      'Product hero with demo',
      'Features grid',
      'Pricing comparison',
      'Integration logos',
      'Changelog/updates',
      'Careers page',
      'Press kit',
      'Legal pages (privacy, terms)',
    ],
    customizationPoints: [
      {
        area: 'Product info',
        description: 'Hero, features, pricing',
        files: ['app/(marketing)/**'],
        effort: 'easy',
      },
      {
        area: 'Branding',
        description: 'Theme and assets',
        files: ['tailwind.config.ts', 'components/ui/**'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 30,
    envVarsRequired: [],
  },
  {
    id: 'consulting-website',
    name: 'Consulting Website',
    description: 'Professional consulting/services firm website',
    category: 'agency',
    repoUrl: 'https://github.com/tailwindlabs/spotlight',
    techStack: {
      framework: 'Next.js 14',
      database: 'None',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'Professional hero',
      'Services breakdown',
      'Industry expertise',
      'Thought leadership blog',
      'Team bios',
      'Client success stories',
      'Contact/consultation form',
      'Newsletter signup',
    ],
    customizationPoints: [
      {
        area: 'Services',
        description: 'Define your offerings',
        files: ['data/services.ts', 'app/services/**'],
        effort: 'easy',
      },
      {
        area: 'Content',
        description: 'Team, clients, blog',
        files: ['content/**', 'data/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 25,
    envVarsRequired: [],
  },

  // ============================================
  // DOCUMENTATION SITES
  // ============================================
  {
    id: 'docusaurus',
    name: 'Docusaurus',
    description: 'Facebook\'s documentation framework',
    category: 'docs',
    repoUrl: 'https://github.com/facebook/docusaurus',
    stars: 50000,
    techStack: {
      framework: 'React (Docusaurus)',
      database: 'None',
      auth: 'None',
      styling: 'CSS Modules + Infima',
    },
    features: [
      'Versioned docs',
      'Markdown/MDX support',
      'Full-text search (Algolia)',
      'i18n support',
      'Plugin ecosystem',
      'Blog integration',
      'API reference generator',
      'Dark mode',
    ],
    customizationPoints: [
      {
        area: 'Theme',
        description: 'Colors and branding',
        files: ['docusaurus.config.js', 'src/css/**'],
        effort: 'trivial',
      },
      {
        area: 'Content',
        description: 'Documentation pages',
        files: ['docs/**'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 20,
    envVarsRequired: [],
    previewUrl: 'https://docusaurus.io',
  },
  {
    id: 'mintlify',
    name: 'Mintlify Docs',
    description: 'Beautiful API documentation like Stripe',
    category: 'docs',
    repoUrl: 'https://github.com/mintlify/starter',
    stars: 500,
    techStack: {
      framework: 'Mintlify',
      database: 'None',
      auth: 'None',
      styling: 'Tailwind-like',
    },
    features: [
      'API reference with playground',
      'OpenAPI/Swagger import',
      'Code samples in multiple languages',
      'Interactive examples',
      'Changelog',
      'Custom components',
      'Analytics built-in',
      'SEO optimized',
    ],
    customizationPoints: [
      {
        area: 'Config',
        description: 'Branding and navigation',
        files: ['mint.json'],
        effort: 'trivial',
      },
      {
        area: 'Content',
        description: 'Documentation MDX files',
        files: ['**/*.mdx'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 15,
    envVarsRequired: [],
    previewUrl: 'https://mintlify.com/docs',
  },
  {
    id: 'gitbook-nextjs',
    name: 'GitBook-style Docs',
    description: 'Clean documentation with sidebar navigation',
    category: 'docs',
    repoUrl: 'https://github.com/shuding/nextra-docs-template',
    stars: 1000,
    techStack: {
      framework: 'Next.js + Nextra',
      database: 'None',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'Sidebar navigation',
      'Full-text search',
      'MDX components',
      'Code highlighting',
      'Table of contents',
      'Edit on GitHub links',
      'Last updated timestamps',
      'Dark mode',
    ],
    customizationPoints: [
      {
        area: 'Theme',
        description: 'Colors and logo',
        files: ['theme.config.tsx'],
        effort: 'trivial',
      },
      {
        area: 'Docs',
        description: 'Documentation content',
        files: ['pages/**/*.mdx'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 10,
    envVarsRequired: [],
  },

  // ============================================
  // LOCAL BUSINESS WEBSITES
  // ============================================
  {
    id: 'restaurant-website',
    name: 'Restaurant Website',
    description: 'Restaurant/cafe website with menu and reservations',
    category: 'local',
    repoUrl: 'https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript',
    techStack: {
      framework: 'Next.js 14',
      database: 'None (or Supabase)',
      auth: 'None',
      styling: 'Tailwind CSS',
    },
    features: [
      'Hero with ambiance images',
      'Menu with categories',
      'Online ordering (optional)',
      'Table reservations',
      'Location/hours info',
      'Photo gallery',
      'Reviews integration',
      'Contact form',
    ],
    customizationPoints: [
      {
        area: 'Menu',
        description: 'Add menu items and prices',
        files: ['data/menu.ts', 'app/menu/**'],
        effort: 'easy',
      },
      {
        area: 'Branding',
        description: 'Photos, colors, info',
        files: ['public/**', 'data/restaurant.ts'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 25,
    envVarsRequired: [],
  },
  {
    id: 'salon-website',
    name: 'Salon/Spa Website',
    description: 'Beauty salon or spa with booking system',
    category: 'local',
    repoUrl: 'https://github.com/calcom/cal.com',
    stars: 25000,
    techStack: {
      framework: 'Next.js 14',
      database: 'Postgres',
      auth: 'NextAuth.js',
      styling: 'Tailwind CSS',
    },
    features: [
      'Service menu with pricing',
      'Online booking calendar',
      'Staff profiles',
      'Before/after gallery',
      'Gift cards',
      'Loyalty program',
      'Reviews/testimonials',
      'Google Maps integration',
    ],
    customizationPoints: [
      {
        area: 'Services',
        description: 'Define services and pricing',
        files: ['data/services.ts', 'prisma/schema.prisma'],
        effort: 'easy',
      },
      {
        area: 'Branding',
        description: 'Photos, theme, info',
        files: ['public/**', 'tailwind.config.ts'],
        effort: 'trivial',
      },
    ],
    estimatedCustomizationMinutes: 35,
    envVarsRequired: [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
    ],
  },
  {
    id: 'gym-fitness',
    name: 'Gym/Fitness Website',
    description: 'Fitness center with class scheduling',
    category: 'local',
    repoUrl: 'https://github.com/vercel/nextjs-subscription-payments',
    stars: 5000,
    techStack: {
      framework: 'Next.js 14',
      database: 'Supabase',
      auth: 'Supabase Auth',
      styling: 'Tailwind CSS',
      payments: 'Stripe',
    },
    features: [
      'Membership plans',
      'Class schedule calendar',
      'Trainer profiles',
      'Online membership signup',
      'Facility gallery',
      'Workout programs',
      'Member portal',
      'Mobile-friendly schedule',
    ],
    customizationPoints: [
      {
        area: 'Plans',
        description: 'Membership tiers and pricing',
        files: ['data/plans.ts', 'stripe-config.ts'],
        effort: 'easy',
      },
      {
        area: 'Classes',
        description: 'Schedule and trainers',
        files: ['data/classes.ts', 'app/schedule/**'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 40,
    envVarsRequired: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
    ],
  },
  {
    id: 'real-estate',
    name: 'Real Estate Website',
    description: 'Property listings with search and filters',
    category: 'local',
    repoUrl: 'https://github.com/vercel/next.js/tree/canary/examples/with-algolia',
    techStack: {
      framework: 'Next.js 14',
      database: 'Supabase or Sanity',
      auth: 'Optional',
      styling: 'Tailwind CSS',
    },
    features: [
      'Property listings grid',
      'Advanced search/filters',
      'Map integration',
      'Virtual tours',
      'Agent profiles',
      'Mortgage calculator',
      'Favorites/saved searches',
      'Contact forms per listing',
    ],
    customizationPoints: [
      {
        area: 'Listings',
        description: 'Property data structure',
        files: ['data/properties.ts', 'lib/schema.ts'],
        effort: 'moderate',
      },
      {
        area: 'Search',
        description: 'Filter options',
        files: ['components/Search.tsx'],
        effort: 'easy',
      },
    ],
    estimatedCustomizationMinutes: 45,
    envVarsRequired: [
      'NEXT_PUBLIC_MAPBOX_TOKEN',
    ],
  },
];

/**
 * Match starter templates based on spec keywords
 */
export function matchStartersFromSpec(spec: string): StarterTemplate[] {
  const specLower = spec.toLowerCase();
  const matched: StarterTemplate[] = [];

  // Keyword to category mapping
  const categoryKeywords: Record<StarterCategory, string[]> = {
    saas: ['saas', 'subscription', 'billing', 'teams', 'multi-tenant', 'b2b'],
    ecommerce: ['ecommerce', 'e-commerce', 'store', 'shop', 'products', 'cart', 'checkout', 'shopify'],
    dashboard: ['dashboard', 'admin', 'analytics', 'metrics', 'backoffice', 'internal tool'],
    blog: ['blog', 'content', 'articles', 'posts'],
    landing: ['landing', 'marketing', 'launch', 'waitlist', 'coming soon'],
    api: ['api only', 'backend', 'headless', 'rest api', 'graphql'],
    mobile: ['mobile app', 'react native', 'expo', 'ios', 'android'],
    ai: ['ai', 'chatbot', 'gpt', 'llm', 'chat', 'assistant', 'copilot', 'claude', 'openai'],
    marketplace: ['marketplace', 'multi-vendor', 'platform', 'sellers'],
    community: ['forum', 'community', 'discussions', 'social', 'members'],
    portfolio: ['portfolio', 'personal site', 'developer site', 'designer', 'photographer', 'resume', 'cv'],
    agency: ['agency', 'studio', 'consulting', 'firm', 'startup', 'company website', 'business website', 'corporate'],
    docs: ['documentation', 'docs', 'api docs', 'wiki', 'knowledge base', 'help center', 'reference'],
    local: ['restaurant', 'cafe', 'salon', 'spa', 'gym', 'fitness', 'real estate', 'property', 'local business', 'booking', 'reservations'],
  };

  // Find matching categories
  const matchedCategories = new Set<StarterCategory>();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => specLower.includes(kw))) {
      matchedCategories.add(category as StarterCategory);
    }
  }

  // Get templates for matched categories
  for (const template of STARTER_TEMPLATES) {
    if (matchedCategories.has(template.category)) {
      matched.push(template);
    }
  }

  // Sort by stars (popularity) and customization time
  return matched.sort((a, b) => {
    // Prefer higher stars
    const starsDiff = (b.stars || 0) - (a.stars || 0);
    if (starsDiff !== 0) return starsDiff;
    // Then prefer lower customization time
    return a.estimatedCustomizationMinutes - b.estimatedCustomizationMinutes;
  });
}

/**
 * Get best starter recommendation for a spec
 */
export function getBestStarter(spec: string): StarterTemplate | null {
  const matches = matchStartersFromSpec(spec);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Get all starters for a category
 */
export function getStartersByCategory(category: StarterCategory): StarterTemplate[] {
  return STARTER_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get starter by ID
 */
export function getStarterById(id: string): StarterTemplate | undefined {
  return STARTER_TEMPLATES.find(t => t.id === id);
}

/**
 * Calculate time savings from using a starter vs building from scratch
 */
export function calculateTimeSavings(
  starterMinutes: number,
  buildFromScratchMinutes: number = 480 // Default 8 hours
): { savedMinutes: number; savedPercent: number } {
  const savedMinutes = buildFromScratchMinutes - starterMinutes;
  const savedPercent = Math.round((savedMinutes / buildFromScratchMinutes) * 100);
  return { savedMinutes, savedPercent };
}
