import React, { useState } from 'react';
import type { OperatorSession } from '../types/admin';
import { Eye, EyeOff, LockKeyhole, Shield, UserPlus, LogIn } from 'lucide-react';

interface AuthGateProps {
  onAuthenticated: (session: OperatorSession) => void;
}

interface LocalAccount {
  name: string;
  passwordHash: string;
}

const hashPassword = async (password: string) => {
  const encodedPassword = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', encodedPassword);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Enter an operator name to continue.');
      return;
    }
    if (!password) {
      setError('Enter a password to continue.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (mode === 'register') {
      const account: LocalAccount = { name: name.trim(), passwordHash: await hashPassword(password) };
      localStorage.setItem('omnitrix-account', JSON.stringify(account));
      window.alert('Account created successfully. Please sign in to continue.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setError('');
      return;
    }

    const savedAccount = localStorage.getItem('omnitrix-account');
    if (!savedAccount) {
      window.alert('No account found. Please register first.');
      setMode('register');
      setPassword('');
      setError('');
      return;
    }

    try {
      const account = JSON.parse(savedAccount) as LocalAccount;
      const passwordHash = await hashPassword(password);
      if (account.name.toLowerCase() !== name.trim().toLowerCase() || account.passwordHash !== passwordHash) {
        window.alert('Incorrect operator name or password.');
        setPassword('');
        setError('Incorrect operator name or password.');
        return;
      }
    } catch {
      window.alert('Unable to verify your account. Please register again.');
      setMode('register');
      setPassword('');
      setError('');
      return;
    }

    window.alert('Sign in successful. Welcome to the OMNITRIX console.');
    onAuthenticated({ name: name.trim(), role: 'Safety Officer', authenticatedAt: new Date().toISOString() });
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand"><span className="brand-badge"><Shield size={22} /></span><span><strong>OMNITRIX</strong><small>Admin safety console</small></span></div>
        <div className="auth-heading"><span className="section-kicker">Protected operator access</span><h1>{mode === 'login' ? 'Sign in to review cases' : 'Register an operator'}</h1><p>Admin and Safety Officer access only. Complaint data remains separate from session handling.</p></div>
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}><LogIn size={15} /> Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}><UserPlus size={15} /> Register</button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Operator name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Siddharth" autoComplete={mode === 'login' ? 'username' : 'name'} /></label>
          <label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {mode === 'register' && <label>Confirm password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" autoComplete="new-password" /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>}
          <label>Role<span className="auth-fixed-role">Safety Officer</span></label>
          {error && <p className="auth-error">{error}</p>}
          <button className="btn-primary auth-submit" type="submit">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <div className="auth-footnote"><LockKeyhole size={14} /> Passwords are required for this local frontend demo and are not stored in the session.</div>
      </section>
    </main>
  );
};
