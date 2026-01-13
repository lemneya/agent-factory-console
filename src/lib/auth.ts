import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { syncUserRepositories } from "./github/sync";

// Demo users for DEV-only auth bypass
const DEMO_USERS = {
  "gatekeeper@agentfactory.dev": {
    id: "demo-gatekeeper",
    name: "Gatekeeper (Demo)",
    email: "gatekeeper@agentfactory.dev",
    image: null,
  },
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
    // DEV-only credentials provider for demo mode
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            id: "credentials",
            name: "Demo Mode",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;

              const demoUser =
                DEMO_USERS[credentials.email as keyof typeof DEMO_USERS];
              if (demoUser) {
                // Ensure demo user exists in database
                const user = await prisma.user.upsert({
                  where: { email: demoUser.email },
                  update: {},
                  create: {
                    id: demoUser.id,
                    name: demoUser.name,
                    email: demoUser.email,
                    image: demoUser.image,
                  },
                });
                return {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  image: user.image,
                };
              }
              return null;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        // For JWT sessions (credentials), use token.sub
        // For database sessions (GitHub), use user.id
        session.user.id = user?.id || token?.sub || "";

        // Mark demo sessions
        if (session.user.email?.endsWith("@agentfactory.dev")) {
          (session.user as { isDemo?: boolean }).isDemo = true;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async signIn({ user, account }) {
      // Store the GitHub access token for API calls
      if (account?.provider === "github" && account.access_token) {
        await prisma.account.update({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          data: {
            access_token: account.access_token,
          },
        });

        // Sync user's repositories after successful login
        try {
          await syncUserRepositories(user.id, account.access_token);
        } catch (error) {
          console.error("Failed to sync repositories on sign in:", error);
          // Don't block sign in if sync fails
        }
      }
      return true;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    // Use JWT for credentials provider, database for GitHub
    strategy: process.env.NODE_ENV === "development" ? "jwt" : "database",
  },
  debug: process.env.NODE_ENV === "development",
};

// Helper to get GitHub access token for a user
export async function getGitHubAccessToken(
  userId: string
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "github",
    },
    select: {
      access_token: true,
    },
  });

  return account?.access_token ?? null;
}

// Helper to check if user is in demo mode
export function isDemoUser(email: string | null | undefined): boolean {
  return email?.endsWith("@agentfactory.dev") ?? false;
}
