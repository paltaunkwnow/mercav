import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { verifyRecaptchaToken } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error.issues[0].message
      }, { status: 400 });
    }
    
    const { email, password, name, username } = result.data;
    const recaptchaToken = (body as any).recaptchaToken as string | undefined;

    const verify = await verifyRecaptchaToken(recaptchaToken);
    if (!verify.success || (typeof verify.score === 'number' && verify.score < 0.5)) {
      return NextResponse.json({ success: false, error: "reCAPTCHA verification failed" }, { status: 400 });
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
