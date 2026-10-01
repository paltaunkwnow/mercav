"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField, FormAlert, PasswordField, SubmitButton } from '@/components/auth/AuthFields';
import { useCookieConsent } from '@/components/legal/CookieConsentProvider';

export default function Register() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { thirdPartyAllowed, openCookieSettings } = useCookieConsent();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Debounce real: antes el clearTimeout devuelto por el onChange se ignoraba, así que cada
  // tecla disparaba un chequeo y una respuesta vieja podía pisar la del nombre actual.
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestUsername = useRef('');
  useEffect(() => () => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
  }, []);

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (latestUsername.current === username) setUsernameAvailable(data.available ?? null);
    } catch {
      if (latestUsername.current === username) setUsernameAvailable(null);
    } finally {
      if (latestUsername.current === username) setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setFormData({...formData, username: cleaned});
    latestUsername.current = cleaned;
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    setCheckingUsername(false);
    if (cleaned.length >= 3) {
      setUsernameAvailable(null);
      usernameTimer.current = setTimeout(() => checkUsername(cleaned), 500);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !thirdPartyAllowed) {
      setError('Para registrarte debes aceptar cookies de terceros (Google reCAPTCHA).');
      openCookieSettings();
      setLoading(false);
      return;
    }

    if (!executeRecaptcha) {
      setError('ReCAPTCHA no disponible. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      let token: string;
      try {
        token = await executeRecaptcha('register');
      } catch {
        setError('Activa cookies de terceros para completar el registro.');
        openCookieSettings();
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recaptchaToken: token,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al registrar');
      
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [executeRecaptcha, formData, router, thirdPartyAllowed, openCookieSettings]);

  const passwordStrength = formData.password.length === 0 ? 0 : formData.password.length < 6 ? 1 : formData.password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Débil', 'Aceptable', 'Fuerte'];
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];

  const usernameHint = checkingUsername ? (
    <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Comprobando disponibilidad…</span>
  ) : usernameAvailable === true ? (
    <span className="inline-flex items-center gap-1.5 text-green-400"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Disponible</span>
  ) : usernameAvailable === false ? (
    <span className="inline-flex items-center gap-1.5 text-red-400"><XCircle className="h-3.5 w-3.5" aria-hidden /> Ese usuario ya está en uso</span>
  ) : (
    'Minúsculas, números, punto y guion bajo. Mínimo 3 caracteres.'
  );

  return (
    <AuthShell
      kicker="Crear cuenta"
      title="Empezá con Mercav"
      lead="Creá tu cuenta gratis. Con el mismo perfil publicás, contratás, cobrás y vigilás tu exposición."
      panelTitle="Una cuenta abre los siete módulos."
      panelLead="Tu perfil, tus pagos y tus mensajes viajan con vos entre Ads, Services, Jobs, POS, Tools, Pwn y Kosher."
    >
      {error && (
        <div className="mb-6">
          <FormAlert id="register-error">{error}</FormAlert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          id="register-name"
          label="Nombre completo"
          type="text"
          name="name"
          autoComplete="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Juan Pérez"
        />

        <AuthField
          id="register-username"
          label="Nombre de usuario"
          type="text"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={3}
          value={formData.username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          placeholder="juanperez"
          aria-invalid={usernameAvailable === false || undefined}
          hint={<span aria-live="polite">{usernameHint}</span>}
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
          <SubmitButton loading={loading} loadingLabel="Creando cuenta…" disabled={usernameAvailable === false}>
            Crear cuenta <ArrowRight className="h-4 w-4" aria-hidden />
          </SubmitButton>
        </div>

        <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
          Al crear tu cuenta aceptás los{' '}
          <Link href="/terminos" className="mv-link font-medium">Términos</Link>, la{' '}
          <Link href="/privacidad" className="mv-link font-medium">Política de privacidad</Link> y la{' '}
          <Link href="/cookies" className="mv-link font-medium">Política de cookies</Link>.
        </p>
      </form>

      <p className="mt-8 text-sm text-[var(--text-secondary)]">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="mv-link">
          Iniciá sesión
        </Link>
      </p>
    </AuthShell>
  );
}
// creado por pato dev y askforvini
