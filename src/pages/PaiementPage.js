import React, { useState } from 'react';
import jsPDF from 'jspdf'; // For simulated receipt generation

function PaiementPage({ onBack, t, adminSettings }) {
  const [paymentMethod, setPaymentMethod] = useState('mobile_money_airtel'); // mobile_money_airtel, mobile_money_moov, bank_transfer
  const [paymentAmount, setPaymentAmount] = useState('');
  const [transactions, setTransactions] = useState([]); // Simulated transaction history
  const [receipts, setReceipts] = useState([]); // Simulated receipts
  const [transactionCounter, setTransactionCounter] = useState(0);

  const handleInitiatePayment = (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      alert(t.enterValidAmount || "Veuillez entrer un montant valide.");
      return;
    }

    const newTransaction = {
      id: `PAY-${Date.now()}-${transactionCounter}`,
      timestamp: new Date().toLocaleString(),
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      status: 'En attente', // Simulated status
      details: '',
    };

    // Simulate payment gateway interaction
    let paymentDetails = '';
    if (paymentMethod.startsWith('mobile_money')) {
      paymentDetails = `${t.via || 'Via'} ${paymentMethod === 'mobile_money_airtel' ? 'Airtel Money' : 'Moov Money'} ${t.to || 'vers'} ${adminSettings.phoneNumbers}`;
    } else {
      paymentDetails = `${t.bankTransferTo || 'Virement Bancaire vers'} ${adminSettings.bankAccount}`;
    }
    newTransaction.details = paymentDetails;

    setTransactions(prev => [newTransaction, ...prev]);
    setTransactionCounter(prev => prev + 1);
    alert(`${t.paymentInitiated || 'Paiement initié avec succès (simulé) !'} ${paymentDetails}`);

    // Simulate receipt generation after a delay
    setTimeout(() => {
      const newReceipt = {
        id: `REC-${newTransaction.id}`,
        transactionId: newTransaction.id,
        amount: newTransaction.amount,
        date: new Date().toLocaleDateString(),
        details: newTransaction.details,
        file: null // Will be generated on download
      };
      setReceipts(prev => [newReceipt, ...prev]);

      // Update transaction status to 'Completed' (simulated)
      setTransactions(prev => prev.map(tx => 
        tx.id === newTransaction.id ? { ...tx, status: 'Effectué' } : tx
      ));
    }, 3000); // Simulate network delay

    setPaymentAmount('');
  };

  const downloadReceipt = (receipt) => {
    const doc = new jsPDF();
    doc.text(`${t.receipt || 'Quittance de Paiement'}`, 14, 20);
    doc.text(`${t.transactionID || 'ID Transaction'} : ${receipt.transactionId}`, 14, 30);
    doc.text(`${t.date || 'Date'} : ${receipt.date}`, 14, 40);
    doc.text(`${t.amount || 'Montant'} : ${receipt.amount.toLocaleString()} FCFA`, 14, 50);
    doc.text(`${t.method || 'Méthode'} : ${receipt.details}`, 14, 60);
    doc.text(`${t.issuedBy || 'Émise par'} : GTax`, 14, 70);
    doc.save(`quittance_${receipt.transactionId}.pdf`);
    alert(`${t.receiptDownloaded || 'Quittance téléchargée'} : ${receipt.transactionId}.pdf`);
  };

  return (
    <div className="page-container">
      <button onClick={onBack} className="back-btn">{t.back || 'Retour'}</button>
      <h2>{t.paymentAndTracking || 'Paiement et Suivi'}</h2>
      <p>{t.paymentPageDescription || 'Ce module gère vos paiements fiscaux via différentes passerelles et vous permet de télécharger vos quittances.'}</p>

      <section className="glass-panel" style={{marginBottom: '20px'}}>
        <h3>{t.makePayment || 'Effectuer un Paiement'}</h3>
        <form onSubmit={handleInitiatePayment} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div>
            <label className="input-label">{t.paymentMethod || 'Méthode de Paiement'} :</label>
            <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="mobile_money_airtel">Airtel Money</option>
              <option value="mobile_money_moov">Moov Money</option>
              <option value="bank_transfer">{t.bankTransfer || 'Virement Bancaire (SYGMA/SYSTAC)'}</option>
            </select>
          </div>

          <div>
            <label className="input-label">{t.amountToPay || 'Montant à Payer'} :</label>
            <input 
              type="number" 
              placeholder="0" 
              value={paymentAmount} 
              onChange={(e) => setPaymentAmount(e.target.value)} 
              className="input-field" 
              required 
            />
          </div>

          <button type="submit" className="action-btn">{t.initiatePayment || 'Lancer le Paiement'}</button>
        </form>
      </section>

      <section className="glass-panel" style={{marginBottom: '20px'}}>
        <h3>{t.transactionHistory || 'Historique des Transactions'}</h3>
        {transactions.length === 0 ? (
          <p>{t.noTransactionsYet || 'Aucune transaction enregistrée.'}</p>
        ) : (
          <div className="transaction-list">
            <div className="transaction-header" style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid var(--glass-border)', paddingBottom: '5px', marginBottom: '10px'}}>
                <span style={{flex: 1}}>{t.date || 'Date'}</span>
                <span style={{flex: 1}}>{t.amount || 'Montant'}</span>
                <span style={{flex: 1}}>{t.method || 'Méthode'}</span>
                <span style={{flex: 1}}>{t.status || 'Statut'}</span>
            </div>
            {transactions.map(tx => (
              <div key={tx.id} className="transaction-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9em'}}>
                <span style={{flex: 1}}>{tx.timestamp}</span>
                <span style={{flex: 1}}>{tx.amount.toLocaleString()} FCFA</span>
                <span style={{flex: 1}}>{tx.method.includes('mobile_money') ? t.mobileMoneyShort || 'Mobile Money' : t.bankTransferShort || 'Virement'}</span>
                <span style={{flex: 1, color: tx.status === 'Effectué' ? '#2ecc71' : '#f1c40f'}}>{tx.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-panel">
        <h3>{t.receipts || 'Quittances'}</h3>
        {receipts.length === 0 ? (
          <p>{t.noReceiptsYet || 'Aucune quittance disponible.'}</p>
        ) : (
          <div className="receipt-list">
            {receipts.map(rec => (
              <div key={rec.id} className="receipt-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9em'}}>
                <span style={{flex: 2}}>{t.receiptFor || 'Quittance pour'} {rec.amount.toLocaleString()} FCFA ({rec.date})</span>
                <button onClick={() => downloadReceipt(rec)} className="action-btn" style={{padding: '5px 10px', fontSize: '0.8em', backgroundImage: 'none', backgroundColor: '#3498db'}}>
                  📥 {t.download || 'Télécharger'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default PaiementPage;