import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole, Department } from "@/types";

// ── Validation schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  username: z.string().min(3, "Username tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

// ── NextAuth configuration ───────────────────────────────────────────────────
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.nim = (user as { nim: string }).nim;
        token.role = (user as { role: UserRole }).role;
        token.department = (user as { department: Department }).department;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.nim = token.nim as string;
        session.user.role = token.role as UserRole;
        session.user.department = token.department as Department;
      }
      return session;
    },
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;

        try {
          const { createClient } = await import("@supabase/supabase-js");

          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          );

          const { data, error } = await supabase
            .from("users")
            .select("id, name, nim, username, email, role, department, password_hash, is_active")
            .eq("username", username)
            .single();

          if (error || !data || !data.is_active) return null;

          const passwordMatch = await bcrypt.compare(password, data.password_hash);
          if (!passwordMatch) return null;

          return {
            id: data.id,
            name: data.name,
            nim: data.nim,
            email: data.email ?? `${data.nim}@mto-hub.id`,
            role: data.role as UserRole,
            department: data.department as Department,
          };
        } catch (err) {
          console.error("Auth error:", err);
          return null;
        }
      },
    }),
  ],
});
