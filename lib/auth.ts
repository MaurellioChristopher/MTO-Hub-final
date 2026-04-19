import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole, Department } from "@/types";
import { createClient } from "@supabase/supabase-js";

// ── Validation schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  username: z.string().min(3, "Username tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

// ── NextAuth configuration ───────────────────────────────────────────────────
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.nim = (user as { nim: string }).nim;
        token.role = (user as { role: UserRole }).role;
        token.department = (user as { department: Department }).department;
        token.bio = (user as { bio: string }).bio;
        token.image = (user as { avatar_url?: string }).avatar_url;
      }

      if (trigger === "update" && session) {
        if (session.image) token.image = session.image;
        if (session.bio) token.bio = session.bio;
        if (session.name) token.name = session.name;
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.nim = token.nim as string;
        session.user.role = token.role as UserRole;
        session.user.department = token.department as Department;
        session.user.bio = token.bio as string;
        session.user.image = token.image as string;
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
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

          if (!supabaseUrl || !supabaseKey) {
            console.error("[AUTH] Missing Supabase environment variables!");
            return null;
          }

          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });

          const { data, error } = await supabase
            .from("users")
            .select("id, name, nim, username, email, role, department, password_hash, is_active, bio, avatar_url")
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
            bio: data.bio,
            avatar_url: data.avatar_url,
          };
        } catch (err) {
          console.error("Auth error:", err);
          return null;
        }
      },
    }),
  ],
});
