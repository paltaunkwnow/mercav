import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verifyRecaptchaToken } from "./recaptcha";

const secureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
// Set AUTH_COOKIE_DOMAIN=.mercav.lat so one session covers mercav.lat, app.mercav.lat and kosher.mercav.lat.
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;

const hasValidGoogleCredentials = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== "pending" &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== "pending"
);

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: cookieDomain
    ? {
        sessionToken: {
          name: `${secureCookies ? "__Secure-" : ""}next-auth.session-token`,
          options: { httpOnly: true, sameSite: "lax", path: "/", secure: secureCookies, domain: cookieDomain },
        },
      }
    : undefined,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(hasValidGoogleCredentials
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
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

        const recaptchaResult = await verifyRecaptchaToken((credentials as any)?.recaptchaToken);
        if (!recaptchaResult.success) {
          console.warn("reCAPTCHA check failed on login for:", credentials.email);
          throw new Error("RECAPTCHA_FAILED");
        }

        let user: any = null;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });
        } catch (dbErr) {
          console.error("LOGIN DB ERROR:", dbErr);
          throw new Error("DB_ERROR");
        }

        // Mismo mensaje para usuario inexistente y contraseña incorrecta: evita enumerar emails
        // (el login ya muestra un texto genérico para cualquier otro error).
        if (!user || !user.password) {
          console.warn(`LOGIN FAILED: User not found for email ${credentials.email.toLowerCase()}`);
          throw new Error("Credenciales inválidas");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.warn(`LOGIN FAILED: Password mismatch for email ${credentials.email.toLowerCase()}`);
          throw new Error("Credenciales inválidas");
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const target = new URL(url);
        const base = new URL(baseUrl);
        if (target.origin === base.origin) return url;
        const suffix = cookieDomain ? `.${cookieDomain.replace(/^\./, "")}` : null;
        const sibling = suffix && target.protocol === base.protocol && `.${target.hostname}`.endsWith(suffix);
        if (sibling) return url;
      } catch {
        /* malformed url falls through to baseUrl */
      }
      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        // Solo vincular/crear cuentas con emails verificados por Google: si no, alguien podría
        // entrar a la cuenta de otro usuario registrando ese email sin verificar.
        if ((profile as { email_verified?: boolean } | undefined)?.email_verified === false) return false;
        
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
        if (dbUser?.twoFactorEnabled) {
          return "/login?error=2FA_REQUIRED";
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

      const tokenId = typeof token.id === "string" ? token.id : "";
      const tokenEmail = typeof token.email === "string" ? token.email.trim().toLowerCase() : "";

      try {
        let dbUser = tokenId
          ? await prisma.user.findUnique({
              where: { id: tokenId },
              select: { id: true, isSanctioned: true },
            })
          : null;
        if (!dbUser && tokenEmail) {
          dbUser = await prisma.user.findUnique({
            where: { email: tokenEmail },
            select: { id: true, isSanctioned: true },
          });
          if (dbUser) token.id = dbUser.id;
        }
        token.isSanctioned = dbUser?.isSanctioned || false;
        if (dbUser) {
          const dbRoles = await prisma.userRole.findMany({
            where: { userId: dbUser.id },
            select: { role: true },
          });
          token.roles = dbRoles.map((r) => r.role);
        } else {
          token.roles = [];
        }
      } catch (err) {
        console.error("[AUTH_JWT_REFRESH_ERROR] Error al refrescar estado del usuario:", err);
        token.isSanctioned = Boolean(token.isSanctioned);
        token.roles = Array.isArray(token.roles) ? token.roles : [];
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
// creado por pato dev y askforvini
