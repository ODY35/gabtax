import React from 'react';
import './HelpPage.css';

export default function HelpPage({ t, onBack }) {
  return (
    <div className="help-page-container">
      <button className="back-btn" onClick={onBack}>
        {t.backToList}
      </button>
      <h1>{t.helpTitle}</h1>
      <div className="help-section">
        <h2>{t.gettingStarted}</h2>
        <p>{t.gettingStartedText}</p>
      </div>
      <div className="help-section">
        <h2>{t.understandingTheDashboard}</h2>
        <p>{t.understandingTheDashboardText}</p>
      </div>
      <div className="help-section">
        <h2>{t.managingUsers}</h2>
        <p>{t.managingUsersText}</p>
      </div>
      <div className="help-section">
        <h2>{t.dataExport}</h2>
        <p>{t.dataExportText}</p>
      </div>
      <div className="help-section">
        <h2>{t.contactSupport}</h2>
        <p>{t.contactSupportText}</p>
      </div>
    </div>
  );
}
