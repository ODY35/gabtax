import React, { useState } from 'react';

function DeclarationFiscalePage({ onBack, t }) {
  const [declarationType, setDeclarationType] = useState('DGI'); // DGI, CNSS, GNAS
  const [periodType, setPeriodType] = useState('monthly'); // monthly, quarterly, annual
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [file, setFile] = useState(null);
  const [declarations, setDeclarations] = useState([]); // Simulate history of declarations

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmitDeclaration = (e) => {
    e.preventDefault();
    if (!selectedPeriod) {
      alert("Veuillez sélectionner une période pour la déclaration.");
      return;
    }

    const newDeclaration = {
      id: Date.now(),
      type: declarationType,
      period: selectedPeriod,
      status: 'Pending', // Simulated status: Pending, Submitted, Validated, Rejected
      submittedAt: new Date().toLocaleString(),
      fileName: file ? file.name : 'N/A'
    };
    
    setDeclarations(prev => [...prev, newDeclaration]);
    alert(`Déclaration ${declarationType} pour la période ${selectedPeriod} soumise avec succès (simulé) !`);
    
    // Simulate DGI/SIGFIP/CNSS/GNAS interaction
    console.log(`Simulating submission to ${declarationType} for period ${selectedPeriod}...`);
    if (declarationType === 'DGI') {
      console.log("Intégration directe vers le portail de la Direction Générale des Impôts...");
    } else if (declarationType === 'CNSS' || declarationType === 'GNAS') {
      console.log("Génération des bordereaux de cotisations sociales...");
    }
    
    // Reset form
    setFile(null);
    setSelectedPeriod('');
  };

  return (
    <div className="page-container">
      <button onClick={onBack} className="back-btn">{t.back || 'Retour'}</button>
      <h2>{t.fiscalDeclaration || 'Déclaration Fiscale'}</h2>
      <p>{t.fiscalDeclarationDescription || 'Ce module gérera la télétransmission directe des déclarations vers le portail de la Direction Générale des Impôts (DGI), ainsi que les déclarations CNSS et GNAS.'}</p>

      <section className="glass-panel" style={{marginBottom: '20px'}}>
        <h3>{t.newDeclaration || 'Nouvelle Déclaration'}</h3>
        <form onSubmit={handleSubmitDeclaration} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div>
            <label className="input-label">{t.declarationType || 'Type de Déclaration'} :</label>
            <select className="input-field" value={declarationType} onChange={(e) => setDeclarationType(e.target.value)}>
              <option value="DGI">{t.declarationDGI || 'DGI (Impôts)'}</option>
              <option value="CNSS">{t.declarationCNSS || 'CNSS (Cotisations Sociales)'}</option>
              <option value="GNAS">{t.declarationGNAS || 'GNAS (Assurance Maladie)'}</option>
            </select>
          </div>

          <div>
            <label className="input-label">{t.periodType || 'Type de Période'} :</label>
            <select className="input-field" value={periodType} onChange={(e) => setPeriodType(e.target.value)}>
              <option value="monthly">{t.monthly || 'Mensuelle'}</option>
              <option value="quarterly">{t.quarterly || 'Trimestrielle'}</option>
              <option value="annual">{t.annual || 'Annuelle'}</option>
            </select>
          </div>

          <div>
            <label className="input-label">{t.selectPeriod || 'Sélectionner la Période'} :</label>
            <input 
              type={periodType === 'annual' ? 'number' : 'month'} // month for monthly/quarterly, number for year
              min={periodType === 'annual' ? "2000" : undefined}
              max={periodType === 'annual' ? "2099" : undefined}
              step={periodType === 'annual' ? "1" : undefined}
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)} 
              className="input-field" 
              required 
            />
          </div>

          <div>
            <label className="input-label">{t.supportingDocument || 'Pièce Justificative (PDF, Excel)'} :</label>
            <input type="file" accept=".pdf,.xls,.xlsx" onChange={handleFileChange} className="input-field" />
            {file && <p style={{fontSize: '0.9em', opacity: 0.8}}>Fichier sélectionné : {file.name}</p>}
          </div>

          <button type="submit" className="action-btn">{t.submitDeclaration || 'Soumettre la Déclaration'}</button>
        </form>
      </section>

      <section className="glass-panel">
        <h3>{t.declarationHistory || 'Historique des Déclarations'}</h3>
        {declarations.length === 0 ? (
          <p>{t.noDeclarationsYet || 'Aucune déclaration soumise pour le moment.'}</p>
        ) : (
          <div className="declaration-list">
            <div className="declaration-header" style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid var(--glass-border)', paddingBottom: '5px', marginBottom: '10px'}}>
                <span style={{flex: 1}}>{t.type || 'Type'}</span>
                <span style={{flex: 1}}>{t.period || 'Période'}</span>
                <span style={{flex: 1}}>{t.file || 'Fichier'}</span>
                <span style={{flex: 1}}>{t.status || 'Statut'}</span>
                <span style={{flex: 1}}>{t.submittedAt || 'Soumis le'}</span>
            </div>
            {declarations.map(decl => (
              <div key={decl.id} className="declaration-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9em'}}>
                <span style={{flex: 1}}>{decl.type}</span>
                <span style={{flex: 1}}>{decl.period}</span>
                <span style={{flex: 1}}>{decl.fileName}</span>
                <span style={{flex: 1, color: decl.status === 'Submitted' ? '#f1c40f' : decl.status === 'Validated' ? '#2ecc71' : '#e74c3c'}}>{decl.status}</span>
                <span style={{flex: 1}}>{decl.submittedAt}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default DeclarationFiscalePage;