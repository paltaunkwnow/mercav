// Tipos de la sesión/JWT según lo que realmente ponen los callbacks de lib/auth.ts.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username?: string;
      roles?: string[];
      isSanctioned?: boolean;
    };
  }

  interface User {
    username?: string;
    twoFactorEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    roles?: string[];
    isSanctioned?: boolean;
  }
}

export {};
// creado por pato dev y askforvini
