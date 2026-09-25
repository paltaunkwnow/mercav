"use client";

import { useState, Suspense, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Loader2, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { authCardClass, authFieldClass, authLabelClass, authLabelClassSpaced } from '@/components/auth/fieldStyles';
import { useCookieConsent } from '@/components/legal/CookieConsentProvider';
import { safeCallbackPath } from '@/lib/security/safe-url';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackPath(searchParams.get('callbackUrl'));
  const registered = searchParams.get('registered');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { executeRecaptcha } = useGoogleReCaptcha();
  const { thirdPartyAllowed, openCookieSettings } = useCookieConsent();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !thirdPartyAllowed) {
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
  }, [executeRecaptcha, email, password, twoFactorCode, show2FA, callbackUrl, router, thirdPartyAllowed, openCookieSettings]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 pt-20 relative overflow-hidden section-transition">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[15%] w-[500px] h-[500px] bg-gold/[0.03] blur-[180px] rounded-full" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-gold/[0.02] blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gold/3 via-transparent to-transparent" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className={authCardClass}>
          {/* Shimmer accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          
          <div className="text-center mb-8">
            <Link href="/" className="mb-6 inline-flex justify-center group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary">
              <img
                src="/images/logo.png"
                alt="Mercav"
                className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105"
                width={56}
                height={56}
              />
            </Link>
            <h1 className="font-display text-2xl font-bold text-white light:text-[#1a1714] mb-2">Bienvenido de nuevo</h1>
            <p className="text-sm text-gray-400 light:text-gray-600">Inicia sesión en tu cuenta de Mercav</p>
          </div>

          {registered && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-4 rounded-xl mb-6 flex items-center gap-3 backdrop-blur-sm"
            >
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              ¡Cuenta creada exitosamente! Ya puedes iniciar sesión.
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-6 backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!show2FA ? (
              <>
                <div>
                  <label className={authLabelClassSpaced}>Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition-colors duration-300 group-focus-within:text-gold" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={authFieldClass}
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className={authLabelClass}>Contraseña</label>
                    <button 
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-gold/80 hover:text-gold transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors duration-300" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={authFieldClass}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="bg-gold/5 border border-gold/20 p-4 rounded-2xl flex items-start gap-3 mb-2 backdrop-blur-sm">
                  <ShieldCheck className="h-5 w-5 text-gold mt-0.5" />
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Tu cuenta está protegida. Introduce el código de 6 dígitos de tu aplicación de autenticación.
                  </p>
                </div>
                <div>
                  <label className={authLabelClassSpaced}>Código de verificación</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition-colors duration-300 group-focus-within:text-gold" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      className={`${authFieldClass} text-center font-mono text-xl tracking-[0.5em]`}
                      placeholder="000000"
                    />
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShow2FA(false)}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  ← Volver al login normal
                </button>
              </motion.div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 bg-gold text-black hover:bg-gold-light rounded-xl font-semibold mt-2 transition-all hover:shadow-lg hover:shadow-gold/20 hover:scale-[1.02] active:scale-[0.98]">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  {show2FA ? "Verificar y Entrar" : "Iniciar Sesión"} <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center gap-3">
            <span className="flex-1 border-b border-border"></span>
            <span className="text-xs uppercase tracking-wider text-[var(--text-tertiary)]">o continuar con</span>
            <span className="flex-1 border-b border-border"></span>
          </div>

          <Button
            type="button"
            onClick={() => {
              if (!thirdPartyAllowed) {
                setError('Para continuar con Google debes aceptar cookies de terceros.');
                openCookieSettings();
                return;
              }
              void signIn('google', { callbackUrl });
            }}
            variant="outline"
            className="mt-6 h-12 w-full rounded-xl border-border bg-bg-tertiary font-medium text-[var(--text-primary)] transition-all duration-300 hover:border-gold/35 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </Button>

          <p className="mt-8 text-center text-sm text-gray-400">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-gold font-semibold hover:text-gold-light transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md ${authCardClass}`}
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold border border-gold/20">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Recuperar Acceso</h3>
                  <p className="text-xs text-gray-500">Protocolo de seguridad Mercav</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-[#141416]/60 p-6 light:border-black/10 light:bg-[#e8e6e0]/50">
                   <p className="mb-6 text-sm leading-relaxed text-gray-300 light:text-gray-700">
                    Si has olvidado tu contraseña, contacta con <strong className="text-white light:text-[#1a1714]">Soporte Técnico</strong> enviando un correo a:
                   </p>
                   <p className="text-lg font-bold text-gold text-center mb-6">soporte@mercav.lat</p>
                   <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Debes proporcionar:</p>
                   <ul className="text-xs text-gray-400 space-y-2 list-disc ml-4 font-medium">
                      <li>Nombre de Usuario completo.</li>
                      <li>Correo electrónico vinculado.</li>
                      <li>Fecha estimada de creación de la cuenta.</li>
                      <li>Cualquier otro correo que hayas usado.</li>
                   </ul>
                </div>

                <div className="flex items-start gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl backdrop-blur-sm">
                   <ShieldCheck className="text-red-500 h-5 w-5 mt-0.5 flex-shrink-0" />
                   <div className="space-y-2">
                     <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed tracking-wider">
                      Nota: Para validar tu identidad, se te podrá requerir una <strong>prueba de rostro</strong> y/o una fotografía de tu documento de identidad (<strong>ID/DNI/CI</strong>).
                     </p>
                     <p className="text-xs leading-relaxed text-gray-400">
                  En procesos de recuperación de cuenta, validación de perfil o resolución de disputas, Mercav podrá solicitar identificaciones oficiales legales y pruebas biométricas (fotografías de rostro). Estas imágenes son de uso <strong>temporal y exclusivo</strong> para validación técnica de soporte. Mercav garantiza que no se almacenarán estos documentos de forma permanente, procediendo a su eliminación definitiva del sistema en un plazo máximo de <strong>3 meses</strong> tras la resolución definitiva del caso.
                </p>
                   </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="mt-8 h-12 w-full rounded-xl border border-white/10 bg-[#141416] font-semibold text-white transition-all duration-300 hover:border-gold/30 hover:bg-[#1a1a1e] light:border-black/10 light:bg-[#e8e6e0] light:text-[#1a1714] light:hover:border-gold/40"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Cargando...</span>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
// creado por pato dev y askforvini
