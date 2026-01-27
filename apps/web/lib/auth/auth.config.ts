import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

// Lightweight auth config for Edge middleware
// Does NOT include Prisma adapter or bcrypt (those are in auth.ts)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Credentials provider placeholder - actual validation is in auth.ts
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      // This authorize function won't be called in middleware
      // The real one is in auth.ts
      authorize: () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnAuth = ['/login', '/register', '/forgot-password'].some(
        (route) =>
          nextUrl.pathname === route || nextUrl.pathname.startsWith(route + '/')
      );

      if (isOnAdmin) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL('/admin/dashboard', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as 'FREE' | 'STARTER' | 'PRO';
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
};
