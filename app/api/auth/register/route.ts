import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre es demasiado largo"),
  // Normalizar el email: el login (lib/auth.ts) busca por email en minúsculas.
  email: z.string().trim().toLowerCase().email("Email inválido").max(254),
  // bcrypt solo usa los primeros 72 bytes
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72, "La contraseña es demasiado larga"),
  username: z
    .string()
    .trim()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(30, "El nombre de usuario es demasiado largo")
    .regex(/^[a-zA-Z0-9_.-]+$/, "El nombre de usuario solo puede tener letras, números, punto, guion y guion bajo"),
  recaptchaToken: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error.issues[0]?.message ?? "Datos inválidos"
      }, { status: 400 });
    }
    
    const { email, password, name, username, recaptchaToken } = result.data;

    if (recaptchaToken) {
      const recaptchaRes = await verifyRecaptchaToken(recaptchaToken);
      if (!recaptchaRes.success) {
        return NextResponse.json({
          success: false,
          error: "Verificación de seguridad (reCAPTCHA) inválida. Por favor recarga e intenta de nuevo."
        }, { status: 400 });
      }
    }
    
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ success: false, error: "El email ya está en uso" }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: "El nombre de usuario no está disponible" }, { status: 409 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        username,
        password: hashedPassword,
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
