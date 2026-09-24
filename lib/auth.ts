import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function verifyRecaptchaToken(token?: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  
  // Skip reCAPTCHA verification if secret is not configured
  const isDev = process.env.NODE_ENV !== "production";
  if (!secret) {
    if (isDev) return { success: true, score: 1 };
    return { success: false, score: 0 };
  }

  if (!token || token === "skip") {
    return { success: false, score: 0 };
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const data = await res.json();

    return { 
      success: !!data.success, 
      score: data.score ?? 0.5, // Default to 0.5 if no score (some v3 configs)
      data 
    };
  } catch (err) {
    console.error("RECAPTCHA ERROR:", err);
    return { success: false, error: String(err) };
  }
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "pending",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "pending",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        recaptchaToken: { label: "reCAPTCHA Token", type: "text" },
        twoFactorCode: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Faltan credenciales");
        }

        // Verify reCAPTCHA token (v3)
        const verify = await verifyRecaptchaToken((credentials as any).recaptchaToken);
        if (!verify.success) {
          throw new Error("reCAPTCHA verification failed");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        if (!user || !user.password) {
          throw new Error("Usuario no encontrado");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Contraseña incorrecta");
        }

        // 2FA Verification
        if (user.twoFactorEnabled) {
          const token = credentials.twoFactorCode;
          
          if (!token || token === "undefined") {
            throw new Error("2FA_REQUIRED");
          }
          
          const { verify } = await import("otplib");

          if (!user.twoFactorSecret) {
            throw new Error("Error de configuración de seguridad");
          }

          const result = await verify({
            token: token,
            secret: user.twoFactorSecret
          });
          const isTokenValid = result && typeof result === 'object' ? result.valid : result;

          console.log(`2FA FINAL VALIDATION: ${isTokenValid ? '✅ VALID' : '❌ INVALID'}`);
          
          if (!isTokenValid) {
            throw new Error("2FA_INVALID");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          twoFactorEnabled: user.twoFactorEnabled
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() }
        });
        
        if (!dbUser) {
          const baseUsername = user.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
          const randomSuffix = Math.floor(Math.random() * 10000).toString();
          
          dbUser = await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              name: user.name || "Usuario",
              username: `${baseUsername}${randomSuffix}`,
              avatar: user.image,
              isVerified: true,
            }
          });
        }
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.username = (user as any).username;
      }
      
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isSanctioned: true }
        });
        token.isSanctioned = dbUser?.isSanctioned || false;

        const dbRoles = await prisma.userRole.findMany({
          where: { userId: token.id as string },
          select: { role: true }
        });
        token.roles = dbRoles.map(r => r.role);
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).roles = token.roles as string[];
        (session.user as any).isSanctioned = token.isSanctioned as boolean;
      }
      return session;
    }
  }
};

