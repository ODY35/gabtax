import { generateSimulatedRevenueData, TAX_DUE_DATES_BY_COUNTRY } from './taxCalculations';

// Simulation d'une base de données d'utilisateurs enregistrés
export const generateAllUsersData = () => {
  const locationData = {
    'Gabon': {
      provinces: ['Estuaire', 'Haut-Ogooué', 'Ogooué-Maritime', 'Woleu-Ntem'],
      communes: {
        'Estuaire': ['Libreville', 'Owendo', 'Akanda'],
        'Haut-Ogooué': ['Franceville', 'Moanda'],
        'Ogooué-Maritime': ['Port-Gentil'],
        'Woleu-Ntem': ['Oyem']
      },
      quartiers: ['Louis', 'Mont-Bouët', 'Glass', 'Charbonnages', 'Potos', 'Centre-Ville'],
      rues: ['Boulevard Triomphal', 'Rue de la Mairie', 'Avenue du Colonel Parant', 'Route Nationale 1']
    },
    'Ghana': {
      provinces: ['Greater Accra', 'Ashanti'],
      communes: {
        'Greater Accra': ['Accra', 'Tema'],
        'Ashanti': ['Kumasi', 'Obuasi']
      },
      quartiers: ['Osu', 'East Legon', 'Adum'],
      rues: ['Independence Avenue', 'Ring Road']
    },
    'France': {
      provinces: ['Île-de-France', 'PACA'],
      communes: {
        'Île-de-France': ['Paris', 'Boulogne-Billancourt'],
        'PACA': ['Marseille', 'Nice']
      },
      quartiers: ['Le Marais', 'Vieux-Port'],
      rues: ['Champs-Élysées', 'La Canebière']
    }
  };

  const users = [];
  const countries = Object.keys(locationData);
  const today = new Date();

  for (let i = 0; i < 20; i++) {
    const country = countries[i % countries.length];
    const data = locationData[country];
    const province = data.provinces[i % data.provinces.length];
    const communeList = data.communes[province] || [];
    const commune = communeList[i % communeList.length] || 'Centre';
    const quartier = data.quartiers[i % data.quartiers.length];
    const rue = data.rues[i % data.rues.length];

    // Determine due date for the current month based on country
    const countryTaxInfo = TAX_DUE_DATES_BY_COUNTRY[country] || {};
    const monthlyDueDay = countryTaxInfo.monthly || 20; // Default to 20th if not specified

    const currentMonthDueDate = new Date(today.getFullYear(), today.getMonth(), monthlyDueDay);
    const lastMonthDueDate = new Date(today.getFullYear(), today.getMonth() - 1, monthlyDueDay);

    let paymentStatus;
    let lastPaymentDate;

    // Simulate payment scenarios
    const paymentScenario = Math.random(); // 0-0.3 overdue, 0.3-0.7 due, 0.7-1 paid

    if (paymentScenario < 0.3) {
      // Overdue: last payment was before last month's due date
      paymentStatus = 'overdue';
      lastPaymentDate = new Date(lastMonthDueDate.getTime() - (Math.random() * 10 * 24 * 60 * 60 * 1000)); // Paid up to 10 days before last month's due
    } else if (paymentScenario < 0.7) {
      // Due: No recent payment, or payment pending for current month
      paymentStatus = 'due';
      lastPaymentDate = new Date(lastMonthDueDate.getTime() + (Math.random() * 5 * 24 * 60 * 60 * 1000)); // Last payment sometime after last month's due but before current month
    } else {
      // Paid: Paid recently, on time for current month
      paymentStatus = 'paid';
      lastPaymentDate = new Date(currentMonthDueDate.getTime() - (Math.random() * 5 * 24 * 60 * 60 * 1000)); // Paid up to 5 days before current month's due
    }
    
    users.push({
      registration: {
        id: `NDI-${country.substring(0, 3).toUpperCase()}-${String(i).padStart(5, '0')}`,
        country: country,
        region: province, // Maintien de la compatibilité avec le filtre existant
        province: province,
        commune: commune,
        city: commune,
        quartier: quartier,
        rue: rue,
        companyName: `Entreprise ${i+1} ${country}`,
        email: `partner${i+1}@example.com`,
        phoneNumber: `+241 0${i % 7}${String(i).padStart(2, '0')}0000`,
        isActive: true,
        paymentStatus: paymentStatus,
        lastPaymentDate: lastPaymentDate.toISOString().split('T')[0]
      },
      revenueData: generateSimulatedRevenueData()
    });
  }
  return users;
};
