import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function GlobalRegistration({ onBack, t }) {
  const [formData, setFormData] = useState({
    country: '',
    province: '',
    commune: '',
    quartier: '',
    rue: '',
    geoLoc: '',
    companyName: '',
    email: ''
  });
  const [ndiCode, setNdiCode] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    // Génération du code NDI traçable (Nom-Pays-Hash-Time)
    // Permet d'identifier l'utilisateur en cas de divulgation non autorisée
    const userHash = btoa(formData.email + formData.companyName).substr(0, 8).toUpperCase();
    const countryCode = formData.country.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const code = `NDI-${countryCode}-${userHash}-${timestamp}`;
    
    setNdiCode(code);

    // Sauvegarde dans Supabase (Backend)
    try {
      const { error } = await supabase
        .from('users')
        .insert([{ ...formData, ndi_code: code, created_at: new Date() }]);
      
      if (error) throw error;
      console.log("Données sauvegardées dans Supabase");
    } catch (error) {
      console.log("Mode hors ligne ou erreur backend:", error.message);
    }

    // Simulation: Notification Admin pour validation
    console.log("Admin notifié: Nouveau paiement/enregistrement à valider pour", formData);
    
    // Simulation: Intégration AI pour normes locales
    console.log(`Chargement des normes fiscales et adaptation AI pour: ${formData.country}, ${formData.city}`);
  };

  return (
    <div className="global-registration-container glass-panel" style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', maxWidth: '500px', margin: '40px auto', background: 'rgba(255,255,255,0.9)' }}>
      <button onClick={onBack} style={{ marginBottom: '15px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2em' }}>⬅ {t.back}</button>
      <h2>{t.registerEntrepreneur}</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <select name="country" onChange={handleChange} required style={{ padding: '8px' }}>
          <option value="">{t.selectCountry}</option>
          <option value="Gabon">Gabon</option>
          <option value="Ghana">Ghana</option>
          <option value="France">France</option>
          <option value="Autre">{t.otherInternational}</option>
        </select>
        <input name="province" placeholder={t.provinceRegion} onChange={handleChange} required style={{ padding: '8px' }} />
        <input name="commune" placeholder={t.communeCity} onChange={handleChange} required style={{ padding: '8px' }} />
        <input name="quartier" placeholder={t.quartier} onChange={handleChange} required style={{ padding: '8px' }} />
        <input name="rue" placeholder={t.street} onChange={handleChange} required style={{ padding: '8px' }} />
        <input name="geoLoc" placeholder={t.geoLoc} onChange={handleChange} required style={{ padding: '8px' }} />
        <input name="companyName" placeholder={t.companyName} onChange={handleChange} required style={{ padding: '8px' }} />
        <input name="email" type="email" placeholder={t.emailResp} onChange={handleChange} required style={{ padding: '8px' }} />
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {t.validateAndGenerate}
        </button>
      </form>

      {ndiCode && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', border: '1px solid #bce0fd', borderRadius: '4px' }}>
          <h3 style={{ color: '#0056b3' }}>{t.registrationSuccess}</h3>
          <p>{t.yourNdiCode} <strong>{ndiCode}</strong></p>
          <p style={{ color: '#dc3545', fontSize: '0.9em' }}>
            <strong>{t.ndiWarning}</strong> ({formData.email})
          </p>
          <button onClick={() => alert(t.downloading)} style={{ marginTop: '10px', textDecoration: 'underline', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}>
            {t.downloadApk}
          </button>
        </div>
      )}
    </div>
  );
}