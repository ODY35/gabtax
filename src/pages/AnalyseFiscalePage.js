import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { calculateTaxes, TAX_RATES } from '../taxCalculations'; // Assuming taxCalculations is in parent directory

function AnalyseFiscalePage({ onBack, t, user, annualTotal, annualTaxes }) {
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentCounter, setDocumentCounter] = useState(0);

  // Calculate potential IMF if not passed directly, or re-verify here
  const isIndividual = user?.role === 'user';
  const calculatedTaxesForIMF = calculateTaxes(annualTotal, { isIndividual: isIndividual, totalAnnualRevenue: annualTotal });
  const imfApplicable = !isIndividual && annualTotal > 0;
  const isIMFHigher = imfApplicable && calculatedTaxesForIMF.imf > calculatedTaxesForIMF.is;

  const handleGenerateDSF = () => {
    const doc = new jsPDF();
    doc.text(`${t.dsfTitle || 'Déclaration Statistique et Fiscale (DSF)'} - ${fiscalYear}`, 14, 20);
    doc.text(`${t.company || 'Entreprise'} : ${user?.name || 'N/A'}`, 14, 30);
    doc.text(`${t.fiscalYear || 'Exercice Fiscal'} : ${fiscalYear}`, 14, 40);
    doc.text(`${t.annualTurnover || 'Chiffre d\'affaires Annuel'} : ${annualTotal.toLocaleString()} FCFA`, 14, 50);
    doc.text(`${t.totalTaxes || 'Total des Impôts'} : ${annualTaxes?.totalTax?.toLocaleString() || 'N/A'} FCFA`, 14, 60);
    
    doc.setFontSize(10);
    doc.text(`${t.ohadaTablesPlaceholder || 'Contenu des tableaux OHADA révisés... (Simulation)'}`, 14, 80);
    doc.text(`${t.thisIsASimulation || 'Ceci est une simulation. La génération réelle de la DSF nécessite des données comptables complètes.'}`, 14, 100);
    doc.save(`DSF_${fiscalYear}_${user?.id}.pdf`);
    alert(`${t.dsfGenerated || 'DSF générée'} : DSF_${fiscalYear}_${user?.id}.pdf`);
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      id: `DOC-${Date.now()}-${documentCounter}`,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toLocaleString(),
      type: file.type
    }));
    setUploadedDocuments(prev => [...prev, ...newDocs]);
    setDocumentCounter(prev => prev + files.length);
    alert(`${files.length} ${t.documentsUploaded || 'document(s) téléchargé(s) (simulé).'}`);
  };

  return (
    <div className="page-container">
      <button onClick={onBack} className="back-btn">{t.back || 'Retour'}</button>
      <h2>{t.fiscalAnalysisAndCompliance || 'Analyse Fiscale et Conformité Documentaire'}</h2>
      <p>{t.fiscalAnalysisDescription || 'Ce module vous aide à générer vos déclarations statutaires, archiver vos documents et vérifier votre conformité fiscale.'}</p>

      <section className="glass-panel" style={{marginBottom: '20px'}}>
        <h3>{t.dsfGeneration || 'Génération de la DSF'}</h3>
        <p>{t.dsfInfo || 'Produisez automatiquement votre Déclaration Statistique et Fiscale (tableaux OHADA révisés).'}</p>
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <label className="input-label">{t.fiscalYear || 'Exercice Fiscal'} :</label>
          <input 
            type="number" 
            min="2000" 
            max="2099" 
            step="1" 
            value={fiscalYear} 
            onChange={(e) => setFiscalYear(e.target.value)} 
            className="input-field" 
          />
          <button onClick={handleGenerateDSF} className="action-btn">
            {t.generateDSF || 'Générer la DSF (PDF)'}
          </button>
        </div>
      </section>

      {!isIndividual && ( // IMF is generally for non-individual entities
        <section className="glass-panel" style={{marginBottom: '20px'}}>
          <h3>{t.auditTrailAndArchiving || 'Piste d\'Audit Fiable et Archivage Numérique'}</h3>
          <p>{t.auditTrailInfo || 'Archivez numériquement vos factures et pièces justificatives pour une piste d\'audit certifiée.'}</p>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <label className="input-label">{t.uploadDocuments || 'Télécharger des Documents'} :</label>
            <input type="file" multiple onChange={handleDocumentUpload} className="input-field" />
            {uploadedDocuments.length > 0 && (
              <div className="document-list" style={{marginTop: '10px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '5px'}}>
                <div className="document-header" style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', padding: '5px', borderBottom: '1px solid var(--glass-border)'}}>
                  <span style={{flex: 2}}>{t.fileName || 'Nom du Fichier'}</span>
                  <span style={{flex: 1}}>{t.size || 'Taille'}</span>
                  <span style={{flex: 1}}>{t.uploadedOn || 'Téléchargé le'}</span>
                </div>
                {uploadedDocuments.map(doc => (
                  <div key={doc.id} className="document-item" style={{display: 'flex', justifyContent: 'space-between', padding: '5px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8em'}}>
                    <span style={{flex: 2}} title={doc.name}>{doc.name}</span>
                    <span style={{flex: 1}}>{(doc.size / 1024).toFixed(1)} KB</span>
                    <span style={{flex: 1}}>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {!isIndividual && ( // IMF is generally for non-individual entities
        <section className="glass-panel">
          <h3>{t.imfVerification || 'Vérification du Minimum Fiscal (IMF)'}</h3>
          <p>{t.imfInfo || 'Vérifiez automatiquement l\'Impôt Minimum Forfaitaire (IMF) par rapport à votre chiffre d\'affaires.'}</p>
          <div style={{marginTop: '15px'}}>
            <p><strong>{t.yourAnnualTurnover || 'Votre Chiffre d\'affaires Annuel'} :</strong> {annualTotal?.toLocaleString() || 'N/A'} FCFA</p>
            <p><strong>{t.calculatedIMF || 'IMF Calculé'} ({ (TAX_RATES.IMF_RATE * 100) || 'N/A'}% du CA) :</strong> {calculatedTaxesForIMF.imf?.toLocaleString() || 'N/A'} FCFA</p>
            <p><strong>{t.calculatedIS || 'IS Calculé (avant IMF)'} :</strong> {calculatedTaxesForIMF.is_before_imf?.toLocaleString() || 'N/A'} FCFA</p> 
            {/* Note: `is_before_imf` is not currently returned by calculateTaxes. 
                       To display this, calculateTaxes would need to return the IS *before* the Math.max(IS, IMF)
                       For now, we just indicate if IMF was applied. */}

            {imfApplicable && (
              <p style={{fontWeight: 'bold', color: isIMFHigher ? '#ff4757' : '#2ecc71'}}>
                {isIMFHigher
                  ? `🚨 ${t.imfApplied || 'L\'IMF est appliqué car il est supérieur à l\'IS calculé.'}`
                  : `✅ ${t.isApplied || 'L\'IS calculé est appliqué (supérieur à l\'IMF).'}`}
              </p>
            )}
            {!imfApplicable && annualTotal > 0 && (
              <p>{t.imfNotApplicable || 'L\'IMF n\'est pas applicable ou votre chiffre d\'affaires est insuffisant.'}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default AnalyseFiscalePage;