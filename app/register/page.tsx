"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, AtSign, Loader2, ArrowRight, CheckCircle2, Eye, EyeOff, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export default function Register() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/auth/check-username?username=${username}`);
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setFormData({...formData, username: cleaned});
    if (cleaned.length >= 3) {
      const timeout = setTimeout(() => checkUsername(cleaned), 500);
      return () => clearTimeout(timeout);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
      const token = await executeRecaptcha('register');
      
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
  }, [executeRecaptcha, formData, router]);

  const passwordStrength = formData.password.length === 0 ? 0 : formData.password.length < 6 ? 1 : formData.password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Débil', 'Aceptable', 'Fuerte'];
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 py-24 relative overflow-hidden section-transition">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-gold/[0.03] blur-[180px] rounded-full" />
        <div className="absolute bottom-[15%] right-[15%] w-[400px] h-[400px] bg-gold/[0.02] blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-gold/3 via-transparent to-transparent" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-bg-secondary/70 backdrop-blur-2xl border border-white/[0.08] p-8 md:p-10 rounded-3xl shadow-2xl shadow-black/40 glassmorphism relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6 group">
              <span className="font-display font-black text-3xl gradient-text-gold">MERCAV</span>
            </Link>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Crear Cuenta</h1>
            <p className="text-gray-400 text-sm">Únete al ecosistema Mercav</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-xl mb-6 backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre Completo</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors duration-300" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-bg-tertiary/50 border border-white/[0.08] rounded-xl h-12 pl-11 pr-4 text-white focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all duration-300 placeholder:text-gray-600 backdrop-blur-sm"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de Usuario</label>
              <div className="relative group">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors duration-300" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="w-full bg-bg-tertiary/50 border border-white/[0.08] rounded-xl h-12 pl-11 pr-11 text-white focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all duration-300 placeholder:text-gray-600 backdrop-blur-sm"
                  placeholder="juanperez"
                  minLength={3}
                />
                {checkingUsername && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs">No disponible</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors duration-300" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-bg-tertiary/50 border border-white/[0.08] rounded-xl h-12 pl-11 pr-4 text-white focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all duration-300 placeholder:text-gray-600 backdrop-blur-sm"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors duration-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-bg-tertiary/50 border border-white/[0.08] rounded-xl h-12 pl-11 pr-11 text-white focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all duration-300 placeholder:text-gray-600 backdrop-blur-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.password.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div key={level} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-bg-tertiary'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading || usernameAvailable === false} className="w-full h-12 bg-gold text-black hover:bg-gold-light rounded-xl font-semibold mt-4 transition-all hover:shadow-lg hover:shadow-gold/20 hover:scale-[1.02] active:scale-[0.98]">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <span className="flex items-center gap-2">Crear Cuenta <ArrowRight className="h-4 w-4" /></span>
              )}
            </Button>
          </form>

          {/* Security badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
            <Shield className="h-3.5 w-3.5 text-gold/40" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Protegido por encriptación SSL</span>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-gray-500">
              Al registrarte, aceptas nuestros{' '}
              <Link href="/terminos" className="text-gold/70 hover:text-gold transition-colors">Términos de Servicio</Link>
              {' '}y{' '}
              <Link href="/privacidad" className="text-gold/70 hover:text-gold transition-colors">Política de Privacidad</Link>
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-gold font-semibold hover:text-gold-light transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
