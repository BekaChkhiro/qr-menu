import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { loginSchema } from '@/lib/validations/auth';
import type { Plan } from '@prisma/client';
import type { Adapter } from 'next-auth/adapters';
import { authConfig } from './auth.config';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan: Plan;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      timezone?: string | null;
      dateFormat?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    plan: Plan;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    timezone?: string | null;
    dateFormat?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);

        if (!validated.success) {
          return null;
        }

        const { email, password } = validated.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          timezone: user.timezone,
          dateFormat: user.dateFormat,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.firstName = user.firstName ?? null;
        token.lastName = user.lastName ?? null;
        token.phone = user.phone ?? null;
        token.timezone = user.timezone ?? null;
        token.dateFormat = user.dateFormat ?? null;
        token.picture = user.image ?? null;
        token.name = user.name ?? null;
      }

      // Handle session updates triggered via useSession().update({...})
      if (trigger === 'update' && session) {
        if (session.plan !== undefined) token.plan = session.plan as Plan;
        if (session.firstName !== undefined) token.firstName = session.firstName;
        if (session.lastName !== undefined) token.lastName = session.lastName;
        if (session.phone !== undefined) token.phone = session.phone;
        if (session.timezone !== undefined) token.timezone = session.timezone;
        if (session.dateFormat !== undefined) token.dateFormat = session.dateFormat;
        if (session.image !== undefined) token.picture = session.image;
        if (session.name !== undefined) token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as Plan;
        session.user.firstName = (token.firstName as string | null | undefined) ?? null;
        session.user.lastName = (token.lastName as string | null | undefined) ?? null;
        session.user.phone = (token.phone as string | null | undefined) ?? null;
        session.user.timezone = (token.timezone as string | null | undefined) ?? null;
        session.user.dateFormat = (token.dateFormat as string | null | undefined) ?? null;
        // `token.picture` is the NextAuth-standard field for avatar url
        session.user.image = (token.picture as string | null | undefined) ?? session.user.image ?? null;
        session.user.name = (token.name as string | null | undefined) ?? session.user.name ?? null;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth providers, ensure user has plan set
      if (account?.provider !== 'credentials' && user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { plan: true },
        });
        if (dbUser) {
          user.plan = dbUser.plan;
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // New OAuth users are created with FREE plan by default (from Prisma schema)
      console.log(`New user created: ${user.email}`);
    },
  },
});
