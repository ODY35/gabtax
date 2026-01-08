import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import HomePage from './pages/HomePage';
import AIButton from './AIButton';
import GlobalRegistration from './GlobalRegistration';
import { generateSimulatedRevenueData } from './taxCalculations';
import { translations } from './translations';
import { supabase } from './supabaseClient';
import './GabonTheme.css';
import { generateAllUsersData } from './userData';

import logo from './logo.png';

function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('fr');
  const [theme, setTheme] = useState('dark');
  const [showRegistration, setShowRegistration] = useState(false);
  const [allUsersData, setAllUsersData] = useState(generateAllUsersData());
  const [isLoading, setIsLoading] = useState(false);
  const t = translations[lang];

  const [adminSettings, setAdminSettings] = useState({
    bankAccount: 'BG 1234 5678 9000',
    phoneNumbers: '074 00 00 00 / 066 00 00 00',
    operator: 'Airtel Gabon'
  });

  const handleLogin = async (userData) => {
    setUser(userData);
    if (userData.role === 'admin') {
      setIsLoading(true);
      const { data: supabaseData, error } = await supabase
        .from('users')
        .select('*');

      if (!error && supabaseData && supabaseData.length > 0) {
        const formattedData = supabaseData.map(u => ({
          registration: u,
          revenueData: generateSimulatedRevenueData()
        }));
        setAllUsersData(formattedData);
      }
      setIsLoading(false);
    }
  };

  const handleTestMode = () => {
    setUser({ id: 'SIMULATION', role: 'test', name: t.businessTest });
  };

  // Update test user name when language changes
  useEffect(() => {
    if (user && user.role === 'test') {
      setUser(prev => ({ ...prev, name: t.businessTest }));
    }
  }, [lang, t.businessTest]);

  const handleLogout = () => {
    setUser(null);
  };

  const toggleLang = () => {
    setLang(prev => prev === 'fr' ? 'en' : 'fr');
  };

  const toggleTheme = () => {
    const themes = ['dark', 'forest', 'ocean', 'white'];
    const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(nextTheme);
  };

  return (
    <div className="app-root" data-theme={theme}>
      <div className="background-map"></div>
      
      {!user ? (
        showRegistration ? (
          <GlobalRegistration onBack={() => setShowRegistration(false)} t={t} />
        ) : (
          <Login 
            onLogin={handleLogin} 
            onTestMode={handleTestMode} 
            onRegister={() => setShowRegistration(true)}
            t={t} 
            logo={logo}
            lang={lang}
            theme={theme}
            onToggleLang={toggleLang}
            onToggleTheme={toggleTheme}
          />
        )
      ) : (
        <>
          <HomePage
            user={user}
            t={t}
            lang={lang}
            theme={theme}
            onLogout={handleLogout}
            onToggleLang={toggleLang}
            onToggleTheme={toggleTheme}
            logo={logo}
            adminSettings={adminSettings}
            setAdminSettings={setAdminSettings}
            allUsersData={allUsersData}
            setAllUsersData={setAllUsersData}
            isLoading={isLoading}
          />
          <AIButton logo={logo} t={t} user={user} data={[]} lang={lang} adminSettings={adminSettings} />
        </>
      )}
    </div>
  );
}

export default App;