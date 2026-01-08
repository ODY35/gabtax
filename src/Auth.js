import React, { useState } from 'react';

export default function Auth({ onLogin, onTestMode, onRegister, t, logo }) {
  const [idCode, setIdCode] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const code = idCode.trim().toUpperCase();
    
    // WARNING: This is a placeholder for demonstration purposes only.
    // In a production application, this client-side check is a CRITICAL SECURITY VULNERABILITY.
    // Real authentication MUST involve a secure backend (e.g., Supabase, OAuth) to verify credentials
    // and assign roles. Do NOT deploy this logic to production as is.
    
    if (code.startsWith("ADMIN")) {
      onLogin({ id: code, role: 'admin', name: 'Administrateur' });
    } else if (code.startsWith("PARTNER")) {
      onLogin({ id: code, role: 'partner', name: 'Partenaire' });
    } else if (code.startsWith("NDI")) {
      onLogin({ id: code, role: 'user', name: 'Utilisateur Standard' });
    } else {
      alert("Code non valide. Veuillez vous enregistrer pour obtenir un code NDI.");
    }
  };

  return (
    <div className="auth-container glass-panel">
      <img src={logo} alt="Gtax Logo" className="auth-logo" />
      <h1 className="hero-title">GTAX</h1>
      <p className="hero-subtitle">{t.subtitle}</p>
      
      <form onSubmit={handleLogin} className="auth-form">
        <input 
          type="text" 
          placeholder={t.enterCode} 
          value={idCode}
          onChange={(e) => setIdCode(e.target.value)}
          className="input-field"
          required
        />

        <button type="submit" className="action-btn glow-effect">
          {t.login}
        </button>
      </form>

      <div className="test-mode-section">
        <div className="divider">{t.or}</div>
        <button onClick={onRegister} className="test-btn" style={{marginBottom: '10px'}}>
          {t.register}
        </button>
        <button onClick={onTestMode} className="test-btn">
          {t.testMode}
        </button>
      </div>
    </div>
  );
}