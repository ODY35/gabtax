import React, { useState, useEffect, useRef, useCallback } from 'react';
import { calculateTaxes } from './taxCalculations';

export default function AIButton({ logo, t, user = null, data = [], lang, adminSettings = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceType, setVoiceType] = useState('female'); // female, male, gentle, strong
  const [voices, setVoices] = useState([]);

  // Resize Logic
  const [size, setSize] = useState({ width: 300, height: 400 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 300, height: 400 });

  // Dragging Logic
  const [position, setPosition] = useState({ right: 30, bottom: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ right: 30, bottom: 30 });
  const hasDragged = useRef(false);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...position };
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation(); // Prevent dragging the whole window
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
  };

  // Touch Logic for Mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    startPos.current = { ...position };
  };

  const handleResizeTouchStart = (e) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setIsResizing(true);
    resizeStart.current = { x: touch.clientX, y: touch.clientY };
    startSize.current = { ...size };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = dragStart.current.x - e.clientX;
      const dy = dragStart.current.y - e.clientY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDragged.current = true;
      setPosition({
        right: startPos.current.right + dx,
        bottom: startPos.current.bottom + dy
      });
    };

    const handleResizeMove = (e) => {
      if (!isResizing) return;
      // Calculate delta (Anchored bottom-right, so dragging up/left increases size)
      const dx = resizeStart.current.x - e.clientX;
      const dy = resizeStart.current.y - e.clientY;
      
      setSize({
        width: Math.max(250, startSize.current.width + dx),
        height: Math.max(300, startSize.current.height + dy)
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    const handleTouchMove = (e) => {
      if (!isDragging && !isResizing) return;
      const touch = e.touches[0];

      if (isDragging) {
        const dx = dragStart.current.x - touch.clientX;
        const dy = dragStart.current.y - touch.clientY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDragged.current = true;
        setPosition({
          right: startPos.current.right + dx,
          bottom: startPos.current.bottom + dy
        });
      }

      if (isResizing) {
        const dx = resizeStart.current.x - touch.clientX;
        const dy = resizeStart.current.y - touch.clientY;
        setSize({
          width: Math.max(250, startSize.current.width + dx),
          height: Math.max(300, startSize.current.height + dy)
        });
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const speak = useCallback((text) => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'fr-FR';

    // Voice Personality Logic
    let selectedVoice = voices.find(v => v.lang.startsWith(utterance.lang)); // Default

    if (voiceType === 'male') {
       selectedVoice = voices.find(v => v.lang.startsWith(utterance.lang) && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel'))) || selectedVoice;
    } else {
       selectedVoice = voices.find(v => v.lang.startsWith(utterance.lang) && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US'))) || selectedVoice;
    }
    
    if (selectedVoice) utterance.voice = selectedVoice;

    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, lang, voices, voiceType]);

  // Voice & Notification Logic
  useEffect(() => {
    // Load Voices
    const loadVoices = () => {
      const availVoices = window.speechSynthesis.getVoices();
      setVoices(availVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Request Notification Permission
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // Load Chat History (Memorization)
    const savedHistory = localStorage.getItem('gtax_chat_history');
    let hasHistory = false;
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (parsed.length > 0) {
          setMessages(parsed);
          hasHistory = true;
        }
      } catch (e) { console.error("Failed to load chat history", e); }
    }

    if (!hasHistory && user?.name) {
      const greeting = lang === 'fr' 
        ? `Bonjour ${user.name} ! Je suis l'IA Gtax. Comment puis-je vous aider aujourd'hui ?`
        : `Hello ${user.name}! I am Gtax AI. How can I help you today?`;
      setMessages([{ id: Date.now(), text: greeting, sender: 'bot' }]);
    } else if (!hasHistory) {
      const greeting = t.aiGreeting;
      setMessages([{ id: Date.now(), text: greeting, sender: 'bot' }]);
    }
  }, [lang, user, t.aiGreeting]);

  // Save Chat History (Memorization)
  useEffect(() => {
    localStorage.setItem('gtax_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Real-time Tax Notification Check
  useEffect(() => {
    if (!data || data.length === 0) return;

    const checkTaxDeadline = () => {
      const totalTax = data.reduce((acc, curr) => acc + curr.totalTax, 0);
      // Simulation: If taxes > 0, remind user
      if (totalTax > 0) {
        const msg = t.payTaxNotification;
        
        // If app is in background/closed (tab hidden), send system notification
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
           new Notification("Gtax Reminder", { body: msg, icon: logo });
        } 
        // If app is open and voice enabled, speak it politely
        else if (!document.hidden && voiceEnabled) {
           speak(msg);
        }
      }
    };

    const interval = setInterval(checkTaxDeadline, 60000 * 5); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [data, voiceEnabled, t, logo, speak]);

  // Sound Notification Effect
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender === 'bot') {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          // Gentle "pop" sound
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
          
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      } catch (e) {
        console.error("Audio play failed", e);
      }
    }
  }, [messages]);

  const handleClick = () => {
    if (!hasDragged.current) toggleChat();
  };

  const toggleChat = () => {
    if (!isOpen && messages.length === 0) {
      setMessages([{ id: 1, text: t.aiGreeting, sender: 'bot' }]);
    }
    setIsOpen(!isOpen);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Reconnaissance vocale non supportée par ce navigateur.");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-US' : 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto-send after listening
      setTimeout(() => handleSend(null, transcript), 500);
    };
    
    recognition.start();
  };

  const generateResponse = (question) => {
    const lowerQ = question.toLowerCase();
    const isFr = lang === 'fr';

    // 0. CHECK FOR LOGIN
    if (!user) {
      if (lowerQ.includes('revenu') || lowerQ.includes('tax') || lowerQ.includes('impôt') || lowerQ.includes('chiffre') || lowerQ.includes('revenue') || lowerQ.includes('sales')) {
        return isFr 
          ? "Pour répondre à cette question, j'ai besoin que vous soyez connecté. Veuillez vous connecter ou créer un compte."
          : "To answer this question, I need you to be logged in. Please login or register.";
      }
    }
    
    // 1. SECURITY & RESTRICTIONS (High Priority)
    // Block access to admin info, backend, code modification, or sensitive data.
    const securityKeywords = [
      'admin', 'backend', 'root', 'database', 'base de données', 
      'pass', 'mot de passe', 'key', 'token', 'secret',
      'code', 'source', 'react', 'javascript', 'deploy',
      'modify', 'modifier', 'change', 'changer', 'delete', 'supprimer',
      'users', 'utilisateurs', 'config', 'setting', 'paramètre'
    ];

    if (securityKeywords.some(keyword => lowerQ.includes(keyword))) {
      return isFr
        ? "🔒 SÉCURITÉ : Accès refusé. Je suis une IA d'assistance fiscale uniquement. Je ne peux pas :\n- Accéder aux données administrateur ou backend.\n- Modifier l'application ou son code source.\n- Divulguer des informations sur d'autres utilisateurs.\nVeuillez poser des questions sur vos taxes ou la législation."
        : "🔒 SECURITY: Access denied. I am a tax assistance AI only. I cannot:\n- Access admin or backend data.\n- Modify the application or source code.\n- Disclose info about other users.\nPlease ask questions about your taxes or legislation.";
    }

    // 2. DEFINITIONS & APP INFO (Smart Chat)
    if (lowerQ.includes('def') || lowerQ.includes('what is') || lowerQ.includes('qu\'est') || lowerQ.includes('c\'est quoi') || lowerQ.includes('signifie') || lowerQ.includes('mean')) {
        if (lowerQ.includes('tva') || lowerQ.includes('vat')) return isFr ? "La TVA (Taxe sur la Valeur Ajoutée) est un impôt indirect sur la consommation. Taux standard : 18%." : "VAT (Value Added Tax) is an indirect tax on consumption. Standard rate: 18%.";
        if (lowerQ.includes('is') || lowerQ.includes('corporate')) return isFr ? "L'IS (Impôt sur les Sociétés) est un impôt sur le bénéfice des entreprises. Taux : 30%." : "IS (Corporate Tax) is a tax on company profits. Rate: 30%.";
        if (lowerQ.includes('irpp') || lowerQ.includes('income')) return isFr ? "L'IRPP est l'Impôt sur le Revenu des Personnes Physiques. Il concerne les revenus des particuliers." : "IRPP is Personal Income Tax. It applies to individual income.";
        if (lowerQ.includes('patente') || lowerQ.includes('license')) return isFr ? "La Patente est une contribution locale due par toute personne exerçant une activité commerciale." : "The Business License (Patente) is a local tax for commercial activities.";
        if (lowerQ.includes('ndi')) return isFr ? "Le NDI est votre Numéro d'Identification Fiscale unique." : "NDI is your unique Tax Identification Number.";
        if (lowerQ.includes('dashboard') || lowerQ.includes('tableau')) return isFr ? "Le tableau de bord affiche vos revenus mensuels et les taxes estimées." : "The dashboard displays your monthly revenue and estimated taxes.";
    }

    // 3. APP USAGE (How it works)
    if (lowerQ.includes('comment') || lowerQ.includes('how') || lowerQ.includes('guide') || lowerQ.includes('work') || lowerQ.includes('marche') || lowerQ.includes('fonctionne')) {
        if (lowerQ.includes('pay') || lowerQ.includes('paiement')) return isFr ? "Cliquez sur 'Effectuer un Paiement' dans le tableau de bord. Vous pouvez utiliser Mobile Money ou Virement." : "Click 'Make Payment' on the dashboard. You can use Mobile Money or Bank Transfer.";
        if (lowerQ.includes('add') || lowerQ.includes('ajout') || lowerQ.includes('declar')) return isFr ? "Utilisez la section 'Saisie du Chiffre d'Affaires' en haut, sélectionnez le mois et le montant, puis cliquez sur 'Calculer'." : "Use the 'Revenue Entry' section at the top, select month and amount, then click 'Calculate'.";
        if (lowerQ.includes('export') || lowerQ.includes('telecharger') || lowerQ.includes('download')) return isFr ? "Utilisez les boutons 'Télécharger Excel' ou 'PDF' en bas du tableau de bord." : "Use the 'Download Excel' or 'PDF' buttons at the bottom of the dashboard.";
        
        return isFr 
            ? "Gtax est simple : 1. Entrez vos revenus. 2. L'IA calcule vos taxes. 3. Payez via l'application. Demandez-moi 'Comment payer ?' pour plus de détails."
            : "Gtax is simple: 1. Enter revenue. 2. AI calculates taxes. 3. Pay via the app. Ask me 'How to pay?' for details.";
    }

    // 4. REAL-TIME INFO / INTERNET CONNECTIVITY (Simulated)
    // Simulating connection to external tax systems/news.
    if (lowerQ.includes('news') || lowerQ.includes('actualité') || lowerQ.includes('loi') || lowerQ.includes('law') || lowerQ.includes('update') || lowerQ.includes('jour')) {
      return isFr
        ? "🌐 [SYSTÈME CONNECTÉ] Recherche en temps réel...\nDernière mise à jour (Loi de Finances 2024) :\n- Les taux de TVA restent stables à 18%.\n- Nouvelles incitations pour le secteur numérique."
        : "🌐 [SYSTEM CONNECTED] Real-time search...\nLatest update (Finance Law 2024):\n- VAT rates stable at 18%.\n- New incentives for the digital sector.";
    }

    // --- New Monthly Query Logic ---
    const monthMap = {
      'janvier': 0, 'january': 0, 'jan': 0,
      'février': 1, 'fevrier': 1, 'february': 1, 'feb': 1,
      'mars': 2, 'march': 2, 'mar': 2,
      'avril': 3, 'april': 3, 'apr': 3,
      'mai': 4, 'may': 4,
      'juin': 5, 'june': 5, 'jun': 5,
      'juillet': 6, 'july': 6, 'jul': 6,
      'août': 7, 'aout': 7, 'august': 7, 'aug': 7,
      'septembre': 8, 'september': 8, 'sep': 8,
      'octobre': 9, 'october': 9, 'oct': 9,
      'novembre': 10, 'november': 10, 'nov': 10,
      'décembre': 11, 'decembre': 11, 'december': 11, 'dec': 11
    };
    const monthNames = Object.keys(monthMap);
    const foundMonth = monthNames.find(m => lowerQ.includes(m));

    if (foundMonth) {
      if (!data || data.length === 0) return isFr ? "Je n'ai pas de données à analyser. Veuillez d'abord entrer des informations sur vos revenus." : "I have no data to analyze. Please enter your revenue information first.";

      const monthIndex = monthMap[foundMonth];
      const monthData = data.find(d => d.monthIndex === monthIndex);
      const monthName = t.months[monthIndex];

      if (monthData) {
        return isFr 
          ? `Pour ${monthName}, votre chiffre d'affaires était de ${monthData.revenue.toLocaleString()} FCFA. Les taxes estimées sont de ${monthData.totalTax.toLocaleString()} FCFA.`
          : `For ${monthName}, your revenue was ${monthData.revenue.toLocaleString()} FCFA. Estimated taxes are ${monthData.totalTax.toLocaleString()} FCFA.`;
      } else {
        return isFr 
          ? `Je n'ai pas de données pour le mois de ${monthName}. Veuillez entrer un chiffre d'affaires pour ce mois.`
          : `I have no data for ${monthName}. Please enter revenue for this month.`;
      }
    }

    // 3. GENERAL MONTHLY LISTING (Global "Mensuel" query)
    if (lowerQ.includes('mensuel') || lowerQ.includes('monthly') || lowerQ.includes('mois') || lowerQ.includes('month')) {
      // Revenue
      if (lowerQ.includes('revenu') || lowerQ.includes('chiffre') || lowerQ.includes('revenue') || lowerQ.includes('sales')) {
        const activeMonths = data.filter(d => d.revenue > 0);
        if (activeMonths.length === 0) return isFr ? "Je ne vois aucun revenu enregistré pour les mois de cette année." : "I see no recorded revenue for this year.";
        
        const details = activeMonths.map(d => `${t.months[d.monthIndex]}: ${d.revenue.toLocaleString()} FCFA`).join('\n');
        return isFr ? `Voici le détail de vos revenus mensuels :\n${details}` : `Here is your monthly revenue breakdown:\n${details}`;
      }
      
      // Taxes / Payments
      if (lowerQ.includes('tax') || lowerQ.includes('impot') || lowerQ.includes('pay') || lowerQ.includes('paiement')) {
        const activeMonths = data.filter(d => d.totalTax > 0);
        if (activeMonths.length === 0) return isFr ? "Aucune taxe estimée pour les mois enregistrés." : "No estimated taxes for recorded months.";

        const details = activeMonths.map(d => `${t.months[d.monthIndex]}: ${d.totalTax.toLocaleString()} FCFA`).join('\n');
        return isFr ? `Voici l'estimation de vos paiements mensuels :\n${details}` : `Here is your estimated monthly payments:\n${details}`;
      }
    }
    // --- End of New Logic ---

    // Closing / Politeness
    if (lowerQ.includes('merci') || lowerQ.includes('thanks') || lowerQ.includes('c\'est tout') || lowerQ.includes('non') || lowerQ.includes('au revoir') || lowerQ.includes('bye')) {
      return isFr ? "Merci à vous. Je suis à votre disposition si vous avez besoin d'autres informations." : "Thank you. I am at your disposal if you need further information.";
    }

    // Data queries: Revenue
    if (lowerQ.includes('revenu') || lowerQ.includes('chiffre') || lowerQ.includes('revenue') || lowerQ.includes('sales')) {
      const total = data.reduce((acc, curr) => acc + curr.revenue, 0);
      return isFr 
        ? `Votre chiffre d'affaires annuel enregistré est de ${total.toLocaleString()} FCFA.`
        : `Your recorded annual revenue is ${total.toLocaleString()} FCFA.`;
    }

    // Rates / Percentages (Nouveau : Répond aux questions sur les taux)
    if (lowerQ.includes('pourcentage') || lowerQ.includes('taux') || lowerQ.includes('rate') || lowerQ.includes('percent')) {
      return isFr 
        ? "Les taux fiscaux appliqués sont :\n• TVA : 18%\n• IS (Impôt Sociétés) : 30%\n• Patente : 2.5%\nCes taux s'appliquent à votre chiffre d'affaires déclaré."
        : "Applied tax rates are:\n• VAT: 18%\n• Corporate Tax (IS): 30%\n• Business License: 2.5%\nThese rates apply to your declared revenue.";
    }

    // Data queries: Taxes & Details (Amélioré : Gère les détails TVA/IS/Patente)
    if (lowerQ.includes('tax') || lowerQ.includes('impot') || lowerQ.includes('impôt') || lowerQ.includes('pay') || lowerQ.includes('paiement') || lowerQ.includes('tva') || lowerQ.includes('is') || lowerQ.includes('patente') || lowerQ.includes('verifie') || lowerQ.includes('vérifie')) {
      
      // Payment Info
      if (lowerQ.includes('banque') || lowerQ.includes('bank') || lowerQ.includes('numero') || lowerQ.includes('number') || ((lowerQ.includes('pay') || lowerQ.includes('paiement')) && !lowerQ.includes('impot') && !lowerQ.includes('tax'))) {
        return `${t.paymentInfo}:\n` + 
               (isFr ? `Opérateur: ${adminSettings.operator}\nCompte: ${adminSettings.bankAccount}\nNuméros: ${adminSettings.phoneNumbers}\n\nUn administrateur sera notifié après votre paiement pour validation.`
                     : `Operator: ${adminSettings.operator}\nAccount: ${adminSettings.bankAccount}\nNumbers: ${adminSettings.phoneNumbers}\n\nAn admin will be notified after your payment for validation.`);
      }

      // Detailed Breakdown (TVA, IS, Patente, IRPP, Electricité, Accises)
      if (lowerQ.includes('detail') || lowerQ.includes('détail') || lowerQ.includes('tva') || lowerQ.includes('is') || lowerQ.includes('patente') || lowerQ.includes('irpp') || lowerQ.includes('electricité') || lowerQ.includes('accise') || lowerQ.includes('verifie') || lowerQ.includes('vérifie')) {
        const isIndividual = user.role === 'user';
        let totalTva = 0;
        let totalIs = 0;
        let totalIrpp = 0;
        let totalPatente = 0;
        let totalElectricityTax = 0;
        let totalExciseDuty = 0;

        // Calculate total taxes by iterating through monthly data, applying appropriate options
        data.forEach(monthData => {
          // For AI chat, we'll use a simplified assumption that monthly revenue is 'general'
          // A more advanced AI would infer revenueType (electricity, excise) from the conversation
          const calculatedMonthTaxes = calculateTaxes(monthData.revenue, { isIndividual: isIndividual, totalAnnualRevenue: data.reduce((acc, curr) => acc + curr.revenue, 0) });
          totalTva += calculatedMonthTaxes.tva;
          totalIs += calculatedMonthTaxes.is;
          totalIrpp += calculatedMonthTaxes.irpp;
          totalPatente += calculatedMonthTaxes.patente;
          totalElectricityTax += calculatedMonthTaxes.electricityTax;
          totalExciseDuty += calculatedMonthTaxes.exciseDuty;
        });

        const totalTax = totalTva + totalIs + totalIrpp + totalPatente + totalElectricityTax + totalExciseDuty;
        const explanation = isFr ? `\n\nCes montants sont des estimations basées sur le chiffre d'affaires déclaré.` : `\n\nThese amounts are estimates based on declared revenue.`;

        let response = (isFr ? `Vérification en temps réel :\n` : `Real-time verification:\n`) +
                       `• ${isFr ? 'TVA' : 'VAT'} : ${totalTva.toLocaleString()} FCFA\n`;
        
        if (isIndividual) {
          response += `• IRPP : ${totalIrpp.toLocaleString()} FCFA\n`;
        } else {
          response += `• IS (incl. IMF) : ${totalIs.toLocaleString()} FCFA\n`;
        }
        response += `• Patente : ${totalPatente.toLocaleString()} FCFA\n`;
        if (totalElectricityTax > 0) {
          response += `• ${isFr ? 'Taxe Électricité' : 'Electricity Tax'} : ${totalElectricityTax.toLocaleString()} FCFA\n`;
        }
        if (totalExciseDuty > 0) {
          response += `• ${isFr ? 'Droits d\'Accises' : 'Excise Duties'} : ${totalExciseDuty.toLocaleString()} FCFA\n`;
        }
        response += `-------------------\n` +
                    (isFr ? `Total Estimé : ` : `Total Estimated : `) + `${totalTax.toLocaleString()} FCFA` + explanation;
        return response;
      }

      const totalTax = data.reduce((acc, curr) => acc + curr.totalTax, 0);
      return isFr 
        ? `Le montant total estimé de vos taxes est de ${totalTax.toLocaleString()} FCFA. Demandez 'détails taxes' pour voir la répartition.`
        : `Your total estimated tax amount is ${totalTax.toLocaleString()} FCFA. Ask for 'tax details' to see the breakdown.`;
    }

    if (lowerQ.includes('bonjour') || lowerQ.includes('hello') || lowerQ.includes('hi')) {
      return isFr 
        ? `Bonjour ${user?.name || 'Utilisateur'} ! Je suis là pour vous aider avec vos données fiscales.`
        : `Hello ${user?.name || 'User'}! I am here to help you with your tax data.`;
    }

    if (lowerQ.includes('norme') || lowerQ.includes('loi') || lowerQ.includes('regle') || lowerQ.includes('pays')) {
      return isFr 
        ? "J'adapte les taxes et normes selon votre localisation (Gabon, Ghana, France...) via nos algorithmes AI."
        : "I adapt taxes and standards based on your location (Gabon, Ghana, France...) via our AI algorithms.";
    }

    return isFr ? "Je peux répondre à des questions sur vos taxes, définir des termes, ou vous aider à utiliser l'application." : "I can answer questions about your taxes, define terms, or help you use the app.";
  };

  const handleSend = (e, manualInput = null) => {
    if (e) e.preventDefault();
    const textToSend = manualInput || input;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), text: textToSend, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Generate response based on user data
    setTimeout(() => {
      const responseText = generateResponse(textToSend);
      const botMsg = { id: Date.now() + 1, text: responseText, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
      speak(responseText); // Speak response
    }, 1000);
  };

  const handleReset = () => {
    setMessages([{ id: Date.now(), text: t.aiGreeting, sender: 'bot' }]);
  };

  return (
    <>
      {isOpen && (
        <div className="chat-backdrop" onClick={toggleChat}></div>
      )}
      {isOpen && (
        <div className="chat-window" style={{ right: position.right, bottom: position.bottom + 70, width: size.width, height: size.height }}>
          {/* Resize Handle (Top-Left) */}
          <div 
            onMouseDown={handleResizeMouseDown}
            onTouchStart={handleResizeTouchStart}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '20px', height: '20px',
              cursor: 'nwse-resize',
              zIndex: 20,
              borderTop: '3px solid var(--primary-glow)',
              borderLeft: '3px solid var(--primary-glow)',
              borderTopLeftRadius: '12px'
            }}
            title="Redimensionner"
          />
          <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{flex: 1}}>{t.chatTitle}</span>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button 
                onClick={handleReset}
                title={t.resetChat}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginRight: '10px' }}
              >
                🔄
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.5rem', lineHeight: '1rem', padding: '0 5px' }}
              >
                −
              </button>
            </div>
          </div>
          
          {/* Voice Settings Panel */}
          <div style={{ padding: '5px 10px', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '5px', alignItems: 'center', fontSize: '0.8rem' }}>
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
              title={voiceEnabled ? t.voiceOn : t.voiceOff}
            >
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
            {voiceEnabled && (
              <select 
                value={voiceType} 
                onChange={(e) => setVoiceType(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', fontSize: '0.8rem' }}
              >
                <option value="female">👩 {t.voiceFemale}</option>
                <option value="male">👨 {t.voiceMale}</option>
              </select>
            )}
          </div>

          <div className="chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.sender}`}>{m.text}</div>
            ))}
          </div>
          <form className="chat-input-area" onSubmit={handleSend}>
            <button type="button" onClick={startListening} style={{background:'none', border:'none', cursor:'pointer', fontSize: '1.2rem', marginRight: '5px'}} title="Parler">
              {isListening ? '🔴' : '🎙️'}
            </button>
            <input 
              type="text" 
              placeholder={t.chatPlaceholder} 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
            />
            <button type="submit" style={{background:'none', border:'none', cursor:'pointer'}}>➤</button>
          </form>
        </div>
      )}
      <div 
        className="ai-button-wrapper" 
        onMouseDown={handleMouseDown} 
        onTouchStart={handleTouchStart}
        onClick={handleClick} 
        title={t.chatTitle}
        style={{ right: position.right, bottom: position.bottom, cursor: isDragging ? 'grabbing' : 'pointer' }}
      >
        <div className="ai-glow"></div>
        <div className="ai-content">
          <img src={logo} alt="AI" className="ai-icon" />
        </div>
      </div>
    </>
  );
}