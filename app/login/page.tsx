"use client";

import { useState, Suspense, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { AuthShell } from '@/components/auth/AuthShell';
import { BodyPortal } from '@/components/auth/BodyPortal';
import { AuthDivider, AuthField, FormAlert, GoogleIcon, PasswordField, SubmitButton } from '@/components/auth/AuthFields';
import { useCookieConsent } from '@/components/legal/CookieConsentProvider';
import { safeCallbackPath } from '@/lib/security/safe-url';
import { RECAPTCHA_SITE_KEY } from '@/lib/recaptcha';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackPath(searchParams?.get('callbackUrl') ?? null);
  const registered = searchParams?.get('registered');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const reduce = useReducedMotion();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { thirdPartyAllowed, openCookieSettings, hasDecided } = useCookieConsent();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const thirdPartyBlocked = Boolean(RECAPTCHA_SITE_KEY && hasDecided && !thirdPartyAllowed);
    if (thirdPartyBlocked) {
      setError('Para iniciar sesión con correo debes aceptar cookies de terceros (Google reCAPTCHA).');
      openCookieSettings();
      setLoading(false);
      return;
    }

    if (!executeRecaptcha) {
      setError('ReCAPTCHA no disponible. Intenta refrescar.');
      setLoading(false);
      return;
    }

    try {
      let token: string;
      try {
        token = await executeRecaptcha('login');
      } catch {
        setError('Activa cookies de terceros para usar reCAPTCHA o elige otro método.');
        openCookieSettings();
        setLoading(false);
        return;
      }
      
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        recaptchaToken: token,
        twoFactorCode: show2FA ? twoFactorCode : undefined,
      });

      if (res?.error) {
        // NextAuth sometimes prepends the error or uses a generic one
        if (res.error === '2FA_REQUIRED' || res.error.includes('2FA_REQUIRED')) {
          setShow2FA(true);
          setLoading(false);
          setError(''); // Clear any previous errors
        } else if (res.error === '2FA_INVALID' || res.error.includes('2FA_INVALID')) {
          setError('Código 2FA incorrecto. Verifica tu aplicación.');
          setLoading(false);
        } else if (res.error.includes('reCAPTCHA')) {
          setError('Error de verificación (reCAPTCHA).');
          setLoading(false);
        } else {
          setError('Credenciales inválidas. Revisa tu email y contraseña.');
          setLoading(false);
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intenta de nuevo.');
      setLoading(false);
    }
  }, [executeRecaptcha, email, password, twoFactorCode, show2FA, callbackUrl, router, thirdPartyAllowed, hasDecided, openCookieSettings]);

  return (
    <AuthShell
      kicker="Iniciar sesión"
      title="Bienvenido de nuevo"
      lead="Entrá a tu cuenta de Mercav para seguir con tus publicaciones, pedidos y mensajes."
      panelTitle="Todo Mercav, con el mismo perfil."
      panelLead="Iniciá sesión una vez y usá cada módulo con tus datos, tus pagos y tu historial."
    >
      <div className="space-y-4" aria-live="polite">
        {registered && !show2FA && <FormAlert tone="success">Cuenta creada. Ya podés iniciar sesión.</FormAlert>}
        {error && <FormAlert id="login-error">{error}</FormAlert>}
      </div>

      <form onSubmit={handleSubmit} className={registered || error ? "mt-6 space-y-5" : "space-y-5"}>
        {!show2FA ? (
          <>
            <AuthField
              id="login-email"
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              aria-describedby={error ? "login-error" : undefined}
            />

            <PasswordField
              id="login-password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? "login-error" : undefined}
              labelAction={
                <button type="button" onClick={() => setShowForgotModal(true)} className="mv-link text-sm font-medium">
                  ¿Olvidaste tu contraseña?
                </button>
              }
            />
          </>
        ) : (
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-5"
          >
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
              <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                Tu cuenta tiene verificación en dos pasos. Ingresá el código de 6 dígitos de tu app de autenticación.
              </p>
            </div>
            <AuthField
              id="login-2fa"
              label="Código de verificación"
              type="text"
              name="twoFactorCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              required
              maxLength={6}
              autoFocus
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              className="mv-data text-center text-xl tracking-[0.5em]"
              placeholder="000000"
              aria-describedby={error ? "login-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShow2FA(false)}
              className="mv-focus inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a email y contraseña
            </button>
          </motion.div>
        )}

        <SubmitButton loading={loading} loadingLabel={show2FA ? "Verificando…" : "Ingresando…"}>
          {show2FA ? "Verificar e ingresar" : "Iniciar sesión"} <ArrowRight className="h-4 w-4" aria-hidden />
        </SubmitButton>
      </form>

      <AuthDivider label="o continuá con" />

      <button
        type="button"
        onClick={() => {
          if (!thirdPartyAllowed) {
            setError('Para continuar con Google debes aceptar cookies de terceros.');
            openCookieSettings();
            return;
          }
          void signIn('google', { callbackUrl });
        }}
        className="mv-btn mv-btn-secondary mv-btn-lg w-full"
      >
        <GoogleIcon />
        Continuar con Google
      </button>

      <p className="mt-8 text-sm text-[var(--text-secondary)]">
        ¿Todavía no tenés cuenta?{' '}
        <Link href="/register" className="mv-link">
          Creala gratis
        </Link>
      </p>

      {/* Forgot password dialog */}
      <BodyPortal>
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/50"
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-title"
              aria-describedby="forgot-desc"
              onKeyDown={(e) => e.key === 'Escape' && setShowForgotModal(false)}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="mv-menu relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
                  <Mail className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 id="forgot-title" className="mv-h3">Recuperar el acceso</h2>
                  <p id="forgot-desc" className="mt-1 text-sm text-[var(--text-secondary)]">
                    La recuperación se hace con el equipo de soporte para proteger tu cuenta.
                  </p>
                </div>
              </div>

              <div className="mv-panel mt-6 p-5">
                <p className="text-sm text-[var(--text-secondary)]">Escribinos a</p>
                <a href="mailto:soporte@mercav.lat" className="mv-link mt-1 inline-block text-lg">
                  soporte@mercav.lat
                </a>
                <p className="mt-5 text-sm font-medium text-[var(--text-primary)]">Incluí en el correo:</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[var(--text-secondary)] marker:text-gold">
                  <li>Nombre de usuario completo.</li>
                  <li>Correo electrónico vinculado.</li>
                  <li>Fecha estimada de creación de la cuenta.</li>
                  <li>Cualquier otro correo que hayas usado.</li>
                </ul>
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--mv-hairline)] p-5">
                <p className="text-sm font-medium text-[var(--text-primary)]">Validación de identidad</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Para validar que sos vos, podemos pedirte una <strong className="font-semibold text-[var(--text-primary)]">prueba de rostro</strong> y/o
                  una foto de tu documento (<span className="mv-data">ID/DNI/CI</span>).
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-tertiary)]">
                  En recuperación de cuenta, validación de perfil o resolución de disputas, Mercav puede solicitar identificaciones oficiales y
                  fotografías de rostro. Se usan de forma temporal y exclusiva para la validación de soporte, no se almacenan de forma
                  permanente y se eliminan en un plazo máximo de 3 meses tras la resolución del caso.
                </p>
              </div>

              <button
                type="button"
                autoFocus
                onClick={() => setShowForgotModal(false)}
                className="mv-btn mv-btn-secondary mt-6 w-full"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </BodyPortal>
    </AuthShell>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[100svh] items-center justify-center bg-bg-primary" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-gold" aria-hidden />
        <span className="sr-only">Cargando</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
// creado por pato dev y askforvini
