import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin, onTestMode, onRegister, t, logo, onToggleLang, onToggleTheme, lang, theme }) => {
  const [accessCode, setAccessCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the data back to App.js, using accessCode as name
    onLogin({ name: accessCode || 'User', role: 'admin' });
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark': return '☾';
      case 'white': return '☀';
      case 'forest': return '🌲';
      case 'ocean': return '🌊';
      default: return '◑';
    }
  };

  return (
    <div className="login-container">
      <div className="top-left-controls">
        <button type="button" className="control-btn lang-btn" onClick={onToggleLang}>
          <span style={{ opacity: lang === 'en' ? 1 : 0.4 }}>ENG</span>
          <span className="lang-sep">/</span>
          <span style={{ opacity: lang === 'fr' ? 1 : 0.4 }}>FR</span>
        </button>
        <button type="button" className="control-btn theme-btn" onClick={onToggleTheme}>
          {getThemeIcon()}
        </button>
      </div>
      
      <div className="login-card">
        <div className="logo-wrapper">
          <img src={logo} alt="GTax Logo" className="app-logo" />
        </div>
        <h1 className="app-name">GTAX</h1>
        <p className="app-tagline">{t.subtitle}</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="text" 
              placeholder={t.enterCode} 
              className="login-input" 
              value={accessCode} 
              onChange={(e) => setAccessCode(e.target.value)}
              autoFocus
            />
          </div>
          
          <button type="submit" className="login-submit-btn">{t.login}</button>
          
          <div className="separator">
            <span>{t.or}</span>
          </div>

          <div className="secondary-actions">
            <button type="button" className="secondary-btn" onClick={onRegister}>
              {t.register}
            </button>
            <button type="button" className="secondary-btn" onClick={onTestMode}>
              {t.testMode}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
