import React, { useState, useEffect } from 'react';
import { calculateTaxes, generateSimulatedRevenueData } from './taxCalculations';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function TableauDeBord({ user, initialData, isReadOnly, t, lang, logo, adminSettings, setAdminSettings, allUsersData, setAllUsersData, onHelp, isLoading, onShowDeclarationPage, onShowPaiementPage, onShowAnalyseFiscalePage }) {
  const [revenueData, setRevenueData] = useState(initialData || []);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState('');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [view, setView] = useState('monthly');
  const [exportProvince, setExportProvince] = useState('all');
  const [exportPaymentStatus, setExportPaymentStatus] = useState('all');
  const [generatedPartnerCode, setGeneratedPartnerCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState('general');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [transactionCounter, setTransactionCounter] = useState(0);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [deploymentState, setDeploymentState] = useState('idle'); // idle, building, built, deploying, live
  const [currentSection, setCurrentSection] = useState(0);

  // Paramètres fictifs pour le mode test (générés une seule fois)
  const [testSettings] = useState({
    operator: 'Simulation Operator',
    bankAccount: `TEST-BK-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    phoneNumbers: `000-${Math.floor(100 + Math.random() * 900)}-000 (TEST)`
  });

  const displaySettings = user.role === 'test' ? testSettings : adminSettings;

  /*
  // DEBUG: Temporarily disabled
  useEffect(() => {
    if (user && allUsersData.length > 0) {
      const currentUser = allUsersData.find(u => u.registration.id === user.id);
      setCurrentUserData(currentUser);
    }
  }, [user, allUsersData]);

  // Simulation des notifications légales (Email & SMS)
  useEffect(() => {
    if (user.role !== 'admin' && currentUserData) {
      // Sécurité : En production, les logs ne doivent pas exposer de données utilisateur.
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SECURE LOG] Notification simulée pour ${user.id}`);
      }

      // Notification Vocale IA (Support Multilingue)
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const message = currentUserData.registration.paymentStatus === 'overdue' 
            ? (t.overduePaymentNotification || "Attention, vous avez un retard de paiement. Veuillez régulariser votre situation.")
            : t.payTaxNotification;
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
          window.speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error("Speech synthesis failed. This can happen on some mobile devices.", error);
      }
    }
  }, [user, t, lang, currentUserData]);
  */

  useEffect(() => {
    // Placeholder for sound effect
  }, [view]);

  const generatePartnerCode = () => {
    const code = `PARTNER-${Math.floor(10000 + Math.random() * 90000)}`;
    setGeneratedPartnerCode(code);
  };

  const getIndustryIcon = (type) => {
    switch (type) {
      case 'tech': return '💻';
      case 'retail': return '🛍️';
      case 'consulting': return '💼';
      default: return '🏢';
    }
  };

  const filteredUsers = allUsersData.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const companyName = u.registration.companyName.toLowerCase();
    const userId = u.registration.id.toLowerCase();
    return companyName.includes(term) || userId.includes(term);
  });

  const handleValidateSettings = () => {
    alert(t.settingsSaved);
    // Ici, vous pourriez ajouter une logique pour sauvegarder dans une vraie BDD
  };

  const handleAddRevenue = (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    const taxes = calculateTaxes(currentMonthRevenue, { isIndividual: user.role === 'user' });
    const newData = {
      id: Date.now(),
      monthIndex: parseInt(selectedMonthIndex),
      ...taxes
    };

    // Mise à jour ou ajout
    const existingIndex = revenueData.findIndex(d => d.monthIndex === newData.monthIndex);
    if (existingIndex >= 0) {
      const updated = [...revenueData];
      updated[existingIndex] = newData;
      setRevenueData(updated);
    } else {
      setRevenueData([...revenueData, newData]);
    }
    setCurrentMonthRevenue('');
  };

  const handlePrefill = () => {
    const newData = generateSimulatedRevenueData(selectedIndustry, user.role === 'user');
    setRevenueData(newData);
  };

  const handleClearData = () => {
    if (window.confirm(t.confirmClear)) {
      setRevenueData([]);
    }
  };

  const handleToggleUserStatus = () => {
    if (!selectedUserDetail) return;
    setShowConfirmModal(true);
  };

  const confirmUserStatusChange = () => {
    if (!selectedUserDetail) return;
    const isCurrentlyActive = selectedUserDetail.registration.isActive !== false;
    
    const updatedUsers = allUsersData.map(u => {
      if (u.registration.id === selectedUserDetail.registration.id) {
        return {
          ...u,
          registration: {
            ...u.registration,
            isActive: !isCurrentlyActive
          }
        };
      }
      return u;
    });
    setAllUsersData(updatedUsers);
    setSelectedUserDetail(updatedUsers.find(u => u.registration.id === selectedUserDetail.registration.id));
    setShowConfirmModal(false);
  };

  const handlePayment = () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      alert(t.enterAmount);
      return;
    }
    
    const newTransaction = {
      id: `TXN-${Date.now()}-${transactionCounter}`,
      timestamp: new Date(),
      amount: paymentAmount,
      method: paymentMethod,
      status: user.role === 'test' ? 'Simulation' : 'Success'
    };

    if (user.role === 'test') {
      // Mode Test : Simulation uniquement
      alert(`SIMULATION: Paiement de ${paymentAmount} FCFA vers ${displaySettings.bankAccount}. Aucun transfert réel.`);
    } else {
      // Mode Basic et Partner : Transfert autorisé pour valider le fonctionnement
      // Utilise les numéros définis par l'admin (displaySettings = adminSettings)
      console.log(`[Payment] Transfert validé pour ${user.name} (${user.role}) vers ${displaySettings.bankAccount}`);
      alert(t.paymentSuccess);
    }
    setTransactions([newTransaction, ...transactions]);
    setTransactionCounter(transactionCounter + 1);
    setPaymentAmount('');
    setShowPaymentModal(false);
  };

  const handleBuildAPK = () => {
    setDeploymentState('building');
    setTimeout(() => {
      setDeploymentState('built');
      alert("Pour mettre à jour l'APK (Procédure Obligatoire) :\n\n" +
            "1. 📦 Terminal : npm run build\n" +
            "2. 🔄 Terminal : npx cap sync\n" +
            "3. 🛠️ Android Studio : Build > Build APK(s)\n\n" +
            "🎨 LOGO APK (Icône) : Utilisez l'outil 'Image Asset Studio' dans Android Studio pour générer le logo. (Clic droit sur 'res' > New > Image Asset).\n" +
            "🖼️ LOGO INTERNE : Utilise 'src/logo.png' (automatique).\n\n" +
            "📂 Localisation de l'APK : android/app/build/outputs/apk/debug/app-debug.apk\n\n" +
            "⚠️ IMPORTANT : Si vous ne faites pas 'npm run build' avant, l'APK contiendra l'ancien code !");
    }, 3000);
  };

  const handleDeployPlayStore = () => {
    setDeploymentState('deploying');
    setTimeout(() => {
      setDeploymentState('live');
      alert("Application Gtax déployée sur le Google Play Store (Production Track) !");
    }, 4000);
  };

  const annualTotal = revenueData.reduce((acc, curr) => acc + curr.revenue, 0);
  const annualTaxes = calculateTaxes(annualTotal, { isIndividual: user.role === 'user', totalAnnualRevenue: annualTotal });

  const downloadData = (format, statusFilter = null) => {
    let dataToExport = filteredUsers;

    if (exportProvince !== 'all') {
      dataToExport = dataToExport.filter(u => u.registration.province === exportProvince);
    }

    // Allow overriding the status filter for specific buttons
    const currentStatusFilter = statusFilter || exportPaymentStatus;
    if (currentStatusFilter !== 'all') {
      dataToExport = dataToExport.filter(u => u.registration.paymentStatus === currentStatusFilter);
    }
    
    const doc = new jsPDF();
    const tableColumn = ["ID", (t.companyName || "Company Name"), (t.phoneNumber || "Phone Number"), (t.address || "Address"), (t.paymentStatus || "Payment Status"), (t.lastPayment || "Last Payment")];
    const tableRows = [];

    dataToExport.forEach(user => {
      const userData = [
        user.registration.id,
        user.registration.companyName,
        user.registration.phoneNumber,
        `${user.registration.rue}, ${user.registration.commune}, ${user.registration.province}`,
        user.registration.paymentStatus,
        user.registration.lastPaymentDate,
      ];
      tableRows.push(userData);
    });

    if (format === 'pdf') {
        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.text(`${(t.overduePaymentsReport || "Overdue Payments Report")} - ${new Date().toLocaleDateString()}`, 14, 15);
        doc.save(`gtax_overdue_report_${exportProvince}.pdf`);
        return;
    }
    
    if (format === 'xlsx') {
        const ws = XLSX.utils.aoa_to_sheet([tableColumn, ...tableRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Users");
        XLSX.writeFile(wb, `gtax_export_${exportProvince}_${currentStatusFilter}.xlsx`);
        return;
    }
    
    // Fallback for original CSV for non-admin or other cases
    let content;
    let filename = `gtax_export.${format}`;

    if (user.role === 'admin') {
      const headers = "ID,Pays,Province,Commune,Quartier,Rue,Nom Entreprise,Email,Chiffre d'Affaires Annuel,Taxes Totales, Payment Status\n";
      content = headers + dataToExport.map(u => {
        const annualRevenue = u.revenueData.reduce((acc, month) => acc + month.revenue, 0);
        const annualTaxes = u.revenueData.reduce((acc, month) => acc + month.totalTax, 0);
        return [
          `"${u.registration.id}"`,
          `"${u.registration.country}"`,
          `"${u.registration.province}"`,
          `"${u.registration.commune}"`,
          `"${u.registration.quartier}"`,
          `"${u.registration.rue}"`,
          `"${u.registration.companyName}"`,
          u.registration.email,
          annualRevenue.toFixed(0),
          annualTaxes.toFixed(0),
          u.registration.paymentStatus
        ].join(',');
      }).join('\n');
      filename = `gtax_export_province_${exportProvince}.csv`;
    } else {
      // Logique existante pour l'utilisateur standard
      content = revenueData.map(d => `${t.months[d.monthIndex]}: Rev=${d.revenue}, Tax=${d.totalTax}`).join('\n');
    }
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }


    const userSections = [
    <section key="input" className="input-section glass-panel">
      <h3>{t.inputTitle}</h3>
      <form onSubmit={handleAddRevenue}>
        <select
          value={selectedMonthIndex}
          onChange={(e) => setSelectedMonthIndex(e.target.value)}
          className="input-field"
        >
          {t.months.map((m, index) => (
            <option key={index} value={index}>{m}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder={t.amountPlaceholder}
          value={currentMonthRevenue}
          onChange={(e) => setCurrentMonthRevenue(e.target.value)}
          className="input-field"
        />
        <button type="submit" className="action-btn">{t.calcBtn}</button>
      <button type="button" className="action-btn" onClick={onShowDeclarationPage} style={{marginTop: '10px', backgroundColor: 'var(--accent-color)'}}>
        📑 {t.fiscalDeclaration || 'Déclaration Fiscale'}
      </button>
      <button type="button" className="action-btn" onClick={onShowPaiementPage} style={{marginTop: '10px', backgroundColor: 'var(--accent-color)'}}>
        💳 {t.paymentAndTracking || 'Paiement et Suivi'}
      </button>
      <button type="button" className="action-btn" onClick={onShowAnalyseFiscalePage} style={{marginTop: '10px', backgroundColor: 'var(--accent-color)'}}>
        📈 Analyse Fiscale
      </button>
      </form>
      
      {user.role === 'test' && (
        <div style={{marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem'}}>
          <p style={{fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem'}}>
            ℹ️ {t.simulationInfo}
          </p>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
            <span style={{fontSize: '1.5rem'}}>{getIndustryIcon(selectedIndustry)}</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="input-field"
              style={{margin: 0}}
            >
              <option value="general">{t.industryGeneral}</option>
              <option value="tech">{t.industryTech}</option>
              <option value="retail">{t.industryRetail}</option>
              <option value="consulting">{t.industryConsulting}</option>
            </select>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button
              type="button"
              className="test-btn"
              onClick={handlePrefill}
              style={{borderColor: 'var(--primary-glow)', color: 'var(--primary-glow)'}}
            >
              🎲 {t.prefillData}
            </button>
            <button
              type="button"
              className="test-btn"
              onClick={handleClearData}
              style={{borderColor: '#ff4757', color: '#ff4757'}}
            >
              🗑️ {t.clearData}
            </button>
          </div>
        </div>
      )}
    </section>,
    <section key="payment" className="payment-info glass-panel">
      <h3>{t.paymentInfo}</h3>
      <p><strong>{t.payTo}</strong> {displaySettings.operator}</p>
      <p><strong>{t.bankAccount}:</strong> {displaySettings.bankAccount}</p>
      <p><strong>{t.phoneNumbers}:</strong> {displaySettings.phoneNumbers}</p>
      <button className="action-btn" onClick={() => setShowPaymentModal(true)} style={{marginTop: '1rem'}}>
        💳 {t.makePayment}
      </button>
    </section>,
    <section key="history" className="glass-panel">
      <h3>{t.transactionHistory}</h3>
      {transactions.length === 0 ? (
        <p style={{opacity: 0.7}}>{t.noTransactions}</p>
      ) : (
        <div className="transaction-list">
          <div className="transaction-header" style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '5px'}}>
            <span style={{flex: 1.5}}>{t.date}</span>
            <span style={{flex: 1}}>{t.amount}</span>
            <span style={{flex: 1}}>{t.method}</span>
            <span style={{flex: 1, textAlign: 'right'}}>{t.status}</span>
            <span style={{flex: 1, textAlign: 'right'}}>ID</span>
          </div>
          {transactions.map(tx => (
            <div key={tx.id} className="transaction-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem'}}>
              <span style={{flex: 1.5}}>{tx.timestamp.toLocaleString()}</span>
              <span style={{flex: 1}}>{Number(tx.amount).toLocaleString()} FCFA</span>
              <span style={{flex: 1}}>{tx.method === 'mobile_money' ? t.mobileMoney.split('(')[0] : t.bankTransfer}</span>
              <span style={{flex: 1, textAlign: 'right', color: tx.status === 'Success' ? '#2ecc71' : '#f1c40f'}}>{tx.status}</span>
              <span style={{flex: 1, textAlign: 'right', fontFamily: 'monospace', fontSize: '0.8em'}}>{tx.id}</span>
            </div>
          ))}
        </div>
      )}
    </section>,
    <section key="download" className="glass-panel">
      <button className="action-btn" onClick={() => downloadData('pdf')}>{t.downloadPdfOnly}</button>
    </section>,
    <section key="stats" className="stats-section glass-panel">
      <div className="stats-nav">
        <button className={view === 'monthly' ? 'active' : ''} onClick={() => setView('monthly')}>{t.monthly}</button>
        <button className={view === 'annual' ? 'active' : ''} onClick={() => setView('annual')}>{t.annual}</button>
      </div>
      <div className="stats-display">
        {view === 'monthly' ? (
          <div className="data-grid">
            {revenueData.map(data => (
              <div key={data.id} className="data-card">
                <h4>{t.months[data.monthIndex]}</h4>
                <p className="revenue">{data.revenue.toLocaleString()} FCFA</p>
                <div className="tax-details">
                  <span>TVA: {data.tva.toLocaleString()}</span>
                  <span>IS: {data.is.toLocaleString()}</span>
                  <span>Patente: {data.patente.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {revenueData.length === 0 && <p>{t.noData}</p>}
          </div>
        ) : (
          <div className="annual-summary">
            <div className="summary-card hero-glow">
              <h3>{t.annualTurnover}</h3>
              <p className="big-number">{annualTotal.toLocaleString()} FCFA</p>
            </div>
            <div className="summary-card">
              <h3>{t.totalTaxes}</h3>
              <p className="big-number tax-color">{annualTaxes.totalTax.toLocaleString()} FCFA</p>
            </div>
          </div>
        )}
      </div>
    </section>
  ];

  const adminSections = [
    <section key="admin" className="admin-section glass-panel">
      <h3>{t.adminSettings}</h3>
      <div style={{display:'flex', flexDirection:'column', gap:'10px', background:'transparent', border:'none'}}>
        <label>{t.telephony}</label>
        <select
          className="input-field"
          value={adminSettings.operator}
          onChange={(e) => setAdminSettings({...adminSettings, operator: e.target.value})}
        >
          <option value="Airtel Gabon">Airtel Gabon</option>
          <option value="Moov Africa Gabon">Moov Africa Gabon</option>
        </select>
        <label>{t.bankAccount}</label>
        <input
          className="input-field"
          value={adminSettings.bankAccount}
          onChange={(e) => setAdminSettings({...adminSettings, bankAccount: e.target.value})}
        />
        <label>{t.phoneNumbers}</label>
        <input
          className="input-field"
          value={adminSettings.phoneNumbers}
          onChange={(e) => setAdminSettings({...adminSettings, phoneNumbers: e.target.value})}
        />
      </div>
      <h3>{t.userList}</h3>
      <input
        type="text"
        placeholder={t.searchUserPlaceholder}
        className="input-field"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '1rem' }}
      />
      <div className="user-list-container" style={{maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid var(--glass-border)', borderRadius: '5px'}}>
        {filteredUsers.map(u => (
          <div key={u.registration.id} className="user-list-item" onClick={() => setSelectedUserDetail(u)} style={{display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer'}}>
            <span style={{flex: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}}>
              {u.registration.companyName}
              {u.registration.isActive === false && <span style={{color: '#ff4757', marginLeft: '5px', fontSize: '0.8em'}}>({t.accountDeactivated})</span>}
            </span>
            <span style={{flex: 1, textAlign: 'center', opacity: 0.8}}>{u.registration.id}</span>
            <span style={{flex: 1, textAlign: 'right'}}>{u.registration.province}</span>
          </div>
        ))}
        {filteredUsers.length === 0 && <p style={{textAlign: 'center', padding: '10px'}}>{t.noResults}</p>}
      </div>
      {selectedUserDetail && (
      <div className="user-detail-view" style={{marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px'}}>
        <button onClick={() => setSelectedUserDetail(null)} className="back-btn" style={{marginBottom: '1rem', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2em'}}>
          {t.backToList}
        </button>
        <h2>{t.userDetailView}</h2>
        <div className="user-details" style={{marginBottom: '20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <p><strong>ID:</strong> {selectedUserDetail.registration.id}</p>
              <p><strong>{t.myCompany}:</strong> {selectedUserDetail.registration.companyName}</p>
              <p><strong>Email:</strong> {selectedUserDetail.registration.email}</p>
              <p><strong>Phone:</strong> {selectedUserDetail.registration.phoneNumber}</p>
              <p><strong>Adresse:</strong> {`${selectedUserDetail.registration.rue}, ${selectedUserDetail.registration.quartier}, ${selectedUserDetail.registration.commune}, ${selectedUserDetail.registration.province}, ${selectedUserDetail.registration.country}`}</p>
              <p><strong>Status:</strong> <span style={{color: selectedUserDetail.registration.isActive !== false ? '#2ecc71' : '#ff4757'}}>{selectedUserDetail.registration.isActive !== false ? 'Actif' : t.accountDeactivated}</span></p>
              <p><strong>Payment Status:</strong> {selectedUserDetail.registration.paymentStatus}</p>
              <p><strong>Last Payment:</strong> {selectedUserDetail.registration.lastPaymentDate}</p>
            </div>
            <button
              className="action-btn"
              onClick={handleToggleUserStatus}
              style={{
                width: 'auto',
                backgroundColor: selectedUserDetail.registration.isActive !== false ? '#ff4757' : '#2ecc71',
                backgroundImage: 'none'
              }}
            >
              {selectedUserDetail.registration.isActive !== false ? t.deactivateAccount : t.activateAccount}
            </button>
          </div>
        </div>
      </div>
      )}
      {!selectedUserDetail && (
        <>
          <h3>{t.dataExport}</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'10px', marginBottom: '20px'}}>
            <div style={{display:'flex', gap:'10px', alignItems: 'center'}}>
              <label>{t.filterByRegion}</label>
              <select
                className="input-field"
                value={exportProvince}
                onChange={(e) => setExportProvince(e.target.value)}
              >
                {['all', ...new Set(allUsersData.map(u => u.registration.province))].map(province => (
                  <option key={province} value={province}>{province === 'all' ? t.allRegions : province}</option>
                ))}
              </select>
            </div>
            <div style={{display:'flex', gap:'10px', alignItems: 'center'}}>
              <label>{t.filterByStatus || "Filter by Status"}</label>
              <select
                className="input-field"
                value={exportPaymentStatus}
                onChange={(e) => setExportPaymentStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="due">Due</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <button className="action-btn" onClick={() => downloadData('xlsx')}>{t.downloadExcel}</button>
            <button className="action-btn" onClick={() => downloadData('pdf', 'overdue')} >{t.downloadOverduePDF || "Download Overdue PDF"}</button>
            <button className="action-btn" style={{marginTop: '10px', backgroundColor: 'var(--primary-glow)'}} onClick={handleValidateSettings}>{t.validateSettings}</button>
          </div>
        </>
      )}
    </section>,
    <section key="deploy" className="glass-panel">
      <h3>🚀 {t.appDeployment}</h3>
      <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
        <div style={{padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span>{t.deploymentStatus}:</span>
          <strong style={{
            color: deploymentState === 'live' ? '#2ecc71' :
                   deploymentState === 'building' || deploymentState === 'deploying' ? '#f1c40f' : 'inherit'
          }}>
            {deploymentState === 'idle' && t.statusIdle}
            {deploymentState === 'building' && t.statusBuilding}
            {deploymentState === 'built' && t.statusBuilt}
            {deploymentState === 'deploying' && t.statusDeploying}
            {deploymentState === 'live' && t.statusLive}
          </strong>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="action-btn" onClick={handleBuildAPK} disabled={deploymentState !== 'idle' && deploymentState !== 'live'}>
            🛠️ {t.buildApk}
          </button>
          <button className="action-btn" onClick={handleDeployPlayStore} disabled={deploymentState !== 'built'} style={{opacity: deploymentState !== 'built' ? 0.5 : 1}}>
            🚀 {t.deployPlayStore}
          </button>
        </div>
        <p style={{fontSize: '0.8rem', opacity: 0.7, marginTop: '5px'}}>
          {t.androidStudioSaveTip}
        </p>
      </div>
    </section>,
    <section key="partner" className="glass-panel">
      <h3>{t.partner}</h3>
      <button className="action-btn" onClick={generatePartnerCode}>{t.generatePartnerCode}</button>
      {generatedPartnerCode && <p style={{marginTop:'10px'}}>Code généré : <strong style={{color:'var(--primary-glow)', fontSize:'1.2em'}}>{generatedPartnerCode}</strong></p>}
    </section>,
    <section key="db" className="glass-panel">
      <h3>{t.adminRestricted}</h3>
      <p style={{fontSize: '0.9rem', opacity: 0.7, margin: '0 0 1rem 0'}}>
        {t.manageData}
      </p>
      <button
        className="action-btn"
        onClick={() => window.open('https://app.supabase.com/', '_blank')}
        style={{background: 'linear-gradient(45deg, #39b54a, #006837)'}}
      >
        {t.openSupabase}
      </button>
    </section>
  ];
  const sections = user.role === 'admin' ? adminSections : userSections;

  const nextSection = () => {
    setCurrentSection((prevSection) => (prevSection + 1) % sections.length);
  };

  const prevSection = () => {
    setCurrentSection((prevSection) => (prevSection - 1 + sections.length) % sections.length);
  };

  // DEBUG: Simplified return for testing
  /*
  return (
    <div className="dashboard-container">
      <h1>Tableau de Bord de Test</h1>
      <p>Utilisateur: {user.name} ({user.id})</p>
    </div>
  );
  */

  // Original return
  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel">
        <div className="company-info">
          <img src={logo} alt="Company Logo" className="company-logo-small" />
          <div>
            <h2>{user.role === 'test' ? t.companyZero : t.myCompany}</h2>
            <span className="badge">
              {user.role === 'admin' ? 'ADMIN' :
               user.role === 'partner' ? 'PARTNER' :
               user.role === 'test' ? 'TEST' :
               'BASIC'}
            </span>
          </div>
        </div>
        <div className="user-profile">
          ID: {user.id}
        </div>
        <button className="help-btn" onClick={onHelp}>
          {t.help}
        </button>
      </header>

      {/* Overdue Payment Notification */}
      {user.role !== 'admin' && currentUserData?.registration?.paymentStatus === 'overdue' && (
        <div className="glass-panel" style={{borderLeft: '4px solid #ff4757', padding: '1rem', marginTop: '0', backgroundColor: 'rgba(255, 71, 87, 0.1)'}}>
          <p style={{margin:0, fontSize:'0.9rem', color: '#ff4757', fontWeight: 'bold'}}>
            {t.overduePaymentWarning || "📢 ATTENTION: Vous avez un paiement en retard. Veuillez contacter le support ou régulariser votre situation."}
          </p>
        </div>
      )}

      {/* Notification Légale & Confidentialité *}
      {user.role !== 'admin' && (
        <div className="glass-panel" style={{borderLeft: '4px solid var(--primary-glow)', padding: '1rem', marginTop: '0'}}>

        <p style={{margin:0, fontSize:'0.9rem'}}>🔒 <strong>{t.personalDataOnly}</strong> <br/> 📢 {t.paymentReminder} <br/> 🛡️ {t.adminRestricted}</p>
      </div>
    )}

    <main className="dashboard-content">
        <div className="navigation-buttons">
            <button onClick={prevSection} className="action-btn">{"<"}</button>
            <button onClick={nextSection} className="action-btn">{">"}</button>
        </div>
        <div className="sections-container">
            {sections[currentSection]}
        </div>
    </main>

    {/* Confirmation Modal *}
    {showConfirmModal && selectedUserDetail && (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div className="glass-panel" style={{maxWidth: '400px', textAlign: 'center', border: '1px solid var(--primary-glow)'}}>
          <h3>Confirmation</h3>
          <p style={{marginBottom: '20px'}}>
            {selectedUserDetail.registration.isActive !== false
              ? t.confirmDeactivate
              : t.confirmActivate}
          </p>
          <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
            <button
              className="test-btn"
              onClick={() => setShowConfirmModal(false)}
              style={{width: 'auto', padding: '10px 20px', margin: 0}}
            >
              {t.cancel}
            </button>
            <button
              className="action-btn"
              onClick={confirmUserStatusChange}
              style={{
                width: 'auto', padding: '10px 20px', margin: 0,
                backgroundColor: selectedUserDetail.registration.isActive !== false ? '#ff4757' : '#2ecc71',
                backgroundImage: 'none',
                color: '#fff'
              }}
            >
              {t.confirm}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Payment Modal *}
    {showPaymentModal && (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div className="glass-panel" style={{maxWidth: '400px', width: '90%', border: '1px solid var(--primary-glow)'}}>
          <h3>{t.makePayment}</h3>

          <label style={{display:'block', marginBottom:'5px', opacity: 0.7}}>{t.paymentMethod}</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="input-field"
          >
            <option value="mobile_money">{t.mobileMoney}</option>
            <option value="bank_transfer">{t.bankTransfer}</option>
          </select>

          <label style={{display:'block', marginBottom:'5px', opacity: 0.7}}>{t.amountToPay}</label>
          <input
            type="number"
            placeholder="0"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="input-field"
          />

          <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
            <button className="test-btn" onClick={() => setShowPaymentModal(false)}>
              {t.cancel}
            </button>
            <button className="action-btn" onClick={handlePayment}>
              {t.initiatePayment}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );

}
