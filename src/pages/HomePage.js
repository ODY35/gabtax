import React, { useState } from 'react';
import TableauDeBord from '../TableauDeBord';
import DeclarationFiscalePage from './DeclarationFiscalePage';
import PaiementPage from './PaiementPage';
import AnalyseFiscalePage from './AnalyseFiscalePage';
import HelpPage from './HelpPage';
import './HomePage.css';

const HomePage = ({ user, t, lang, onLogout, onToggleLang, onToggleTheme, theme, logo, adminSettings, setAdminSettings, allUsersData, setAllUsersData, isLoading, installPrompt }) => {
  const [activeView, setActiveView] = useState('home'); // 'home', 'dashboard', 'declaration', 'paiement', 'analyse', 'help'

  const renderContent = () => {
    const props = {
        user,
        t,
        lang,
        logo,
        adminSettings,
        setAdminSettings,
        allUsersData,
        setAllUsersData,
        isLoading,
        onHelp: () => setActiveView('help'),
        onBack: () => setActiveView('home'),
        initialData: [],
        isReadOnly: false,
        onShowDeclarationPage: () => setActiveView('declaration'),
        onShowPaiementPage: () => setActiveView('paiement'),
        onShowAnalyseFiscalePage: () => setActiveView('analyse'),
        installPrompt,
    };
    switch (activeView) {
      case 'dashboard':
        return <TableauDeBord {...props} />;
      case 'declaration':
        return <DeclarationFiscalePage {...props} />;
      case 'paiement':
        return <PaiementPage {...props} />;
      case 'analyse':
        return <AnalyseFiscalePage {...props} />;
      case 'help':
        return <HelpPage {...props} />;
      case 'home':
      default:
        return renderHomeMenu();
    }
  };

  const renderHomeMenu = () => (
    <div className="home-menu">
        <div className="welcome-header">
            <img src={logo} alt="Logo" className="home-logo"/>
            <h1>{t.welcome}, {user.name || 'Utilisateur'}</h1>
            <p>{t.mainMenuMessage || "Choisissez une option pour commencer"}</p>
        </div>
        <div className="home-grid">
            <button className="grid-item" onClick={() => setActiveView('dashboard')}>
                <span>📊</span>
                <p>{t.dashboard || 'Tableau de Bord'}</p>
            </button>
            <button className="grid-item" onClick={() => setActiveView('declaration')}>
                <span>📑</span>
                <p>{t.fiscalDeclaration || 'Déclaration Fiscale'}</p>
            </button>
            <button className="grid-item" onClick={() => setActiveView('paiement')}>
                <span>💳</span>
                <p>{t.paymentAndTracking || 'Paiement et Suivi'}</p>
            </button>
            <button className="grid-item" onClick={() => setActiveView('analyse')}>
                <span>📈</span>
                <p>{t.fiscalAnalysis || 'Analyse Fiscale'}</p>
            </button>
        </div>
    </div>
  );

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
      });
    }
  };

  return (
    <div className="mobile-home-page">
      <header className="home-header">
        <div className="header-left">
          {activeView !== 'home' && (
            <button className="back-btn" onClick={() => setActiveView('home')}>
              &larr; {t.back || 'Retour'}
            </button>
          )}
        </div>
        <div className="header-title">GABTAX</div>
        <div className="header-right">
            {installPrompt && (
              <button className="header-btn" onClick={handleInstallClick}>
                📥
              </button>
            )}
            <button className="header-btn" onClick={onToggleLang}>{lang === 'fr' ? 'EN' : 'FR'}</button>
            <button className="header-btn" onClick={onToggleTheme}>🎨</button>
            <button className="header-btn" onClick={onLogout}>🚪</button>
        </div>
      </header>
      <main className="home-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default HomePage;
