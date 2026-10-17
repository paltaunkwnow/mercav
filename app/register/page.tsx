"use client";

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { safeCallbackPath } from '@/lib/security/safe-url';
import { REAL_DATA_NOTICE_CUSTOMER } from '@/lib/business/loyalty/notice';
import Link from 'next/link';
import { ArrowRight } from '@/components/icons';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField, FormAlert, PasswordField, SubmitButton } from '@/components/auth/AuthFields';
import { getRecaptchaToken } from '@/lib/recaptcha-client';
import { RecaptchaNotice } from '@/components/legal/RecaptchaNotice';

export default function Register() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { executeRecaptcha } = useGoogleReCaptcha();
  // Vuelta después de crear la cuenta (por ejemplo, a la tarjeta de fidelización para guardarla).
  const rawCallback = searchParams?.get('callbackUrl') ?? null;
  const callbackUrl = rawCallback ? safeCallbackPath(rawCallback) : null;
  const fromCard = !!callbackUrl?.startsWith('/c/');
  const loginHref = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const recaptchaToken = await getRecaptchaToken('register', executeRecaptcha);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recaptchaToken: recaptchaToken || undefined,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al registrar');
      
      const loginToken = await getRecaptchaToken('login', executeRecaptcha);
      const signedIn = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        recaptchaToken: loginToken || undefined,
        redirect: false,
      });
      if (signedIn?.error) throw new Error('La cuenta fue creada, pero no pudimos iniciar sesión. Probá desde el acceso.');
      router.replace(callbackUrl || '/inicio');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [formData, router, callbackUrl, executeRecaptcha]);

  const passwordStrength = formData.password.length === 0 ? 0 : formData.password.length < 6 ? 1 : formData.password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Débil', 'Aceptable', 'Fuerte'];
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];

  return (
    <AuthShell
      kicker="Crear cuenta"
      title="Empezá con Mercav"
      lead="Creá tu cuenta gratis. Con el mismo perfil publicás, contratás, cobrás y vigilás tu exposición."
      panelTitle="Una cuenta abre los siete módulos."
      panelLead="Tu perfil, tus pagos y tus mensajes viajan con vos entre Ads, Services, Jobs, Business, Tools, Pwn y Kosher."
    >
      {error && (
        <div className="mb-6">
          <FormAlert id="register-error">{error}</FormAlert>
        </div>
      )}

      {fromCard && (
        <div className="mb-6">
          <FormAlert tone="success">{REAL_DATA_NOTICE_CUSTOMER}</FormAlert>
        </div>
      )}

      {/* method="post": si el JavaScript no carga, los datos no viajan en la URL. */}
      <form method="post" onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          id="register-name"
          label={fromCard ? 'Nombre y apellido (como en tu documento)' : 'Nombre completo'}
          type="text"
          name="name"
          autoComplete="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Juan Pérez"
        />

        <AuthField
          id="register-email"
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="tu@empresa.com"
        />

        <PasswordField
          id="register-password"
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          aria-describedby={error ? "register-error" : undefined}
          hint={
            formData.password.length > 0 ? (
              <span className="flex items-center gap-3">
                <span className="flex flex-1 gap-1" aria-hidden>
                  {[1, 2, 3].map((level) => (
                    <span
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-[var(--mv-panel-hover)]'}`}
                    />
                  ))}
                </span>
                <span className={`font-medium ${passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-yellow-500' : 'text-green-400'}`}>
                  Seguridad: {strengthLabels[passwordStrength]}
                </span>
              </span>
            ) : (
              'Mínimo 6 caracteres. Con 10 o más es más segura.'
            )
          }
        />

        <div className="pt-1">
          <SubmitButton loading={loading} loadingLabel="Creando cuenta…">
            Crear cuenta <ArrowRight className="h-4 w-4" aria-hidden />
          </SubmitButton>
        </div>

        <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
          Al crear tu cuenta aceptás los{' '}
          <Link href="/terminos" className="mv-link font-medium">Términos</Link>, la{' '}
          <Link href="/privacidad" className="mv-link font-medium">Política de privacidad</Link> y la{' '}
          <Link href="/cookies" className="mv-link font-medium">Política de cookies</Link>.
        </p>
        <RecaptchaNotice />
      </form>

      <p className="mt-8 text-sm text-[var(--text-secondary)]">
        ¿Ya tenés cuenta?{' '}
        <Link href={loginHref} className="mv-link">
          Iniciá sesión
        </Link>
      </p>
    </AuthShell>
  );
}
// creado por pato dev y askforvini
