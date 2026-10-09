export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LcNmd4sAAAAAE0Prx-cXQfDUSbJBAQQFj0JH9Rv";

export const RECAPTCHA_SECRET_KEY =
  process.env.RECAPTCHA_SECRET_KEY || "6LcNmd4sAAAAAJn3jVcDHj0bUnsPByJF7fJvbCE0";

export const RECAPTCHA_USE_ENTERPRISE =
  process.env.NEXT_PUBLIC_RECAPTCHA_USE_ENTERPRISE === "false" ? false : true;

export async function verifyRecaptchaToken(
  token?: string
): Promise<{ success: boolean; score: number; error?: string }> {
  if (process.env.DISABLE_RECAPTCHA === "true" || process.env.RECAPTCHA_DISABLED === "true") {
    return { success: true, score: 1 };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY || RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { success: true, score: 1 };
  }

  if (!token || token === "skip") {
    if (process.env.NODE_ENV !== "production") {
      return { success: true, score: 1 };
    }
    return { success: false, score: 0, error: "reCAPTCHA token missing" };
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();
    if (!data.success) {
      console.warn("reCAPTCHA siteverify failure:", data["error-codes"], data);
      return { success: false, score: 0, error: (data["error-codes"] || []).join(", ") };
    }

    return {
      success: true,
      score: typeof data.score === "number" ? data.score : 0.9,
    };
  } catch (err) {
    console.error("reCAPTCHA verification error:", err);
    // Si la llamada saliente a Google falla por red en el servidor, no bloquear usuarios
    return { success: true, score: 0.5, error: String(err) };
  }
}
