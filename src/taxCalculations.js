export const TAX_RATES = {
  TVA_STANDARD: 0.18,       // 18% (Régime général)
  TVA_REDUCED: 0.10,        // 10% (Taux réduit, ex: produits de première nécessité, services hôteliers)
  TVA_SUPER_REDUCED: 0.05,  // 5% (Taux super réduit, ex: certains médicaments)
  TVA_ZERO: 0.00,           // 0% (Exportations, certaines opérations spécifiques)
  ELECTRICITY_TAX: 0.09,    // Nouveau taux de 9% sur les factures d'électricité (mesure 2026)
  IS: 0.30,                 // Impôt sur les Sociétés (30% en régime général)
  IRPP_GENERAL_RATE: 0.10,  // Placeholder for IRPP (Impôt sur le Revenu des Personnes Physiques).
                            // Actual IRPP is progressive, this is a simplified placeholder.
  PATENTE: 0.025,           // Contribution des patentes (ex: 2.5% du CA ou selon barème)
  IMF_RATE: 0.01,           // Impôt Minimum Forfaitaire (1% du Chiffre d'Affaires HT)
  EXCISE_DUTY_RATES: {      // Droits d'accises pour produits spécifiques
    TOBACCO: 0.45,          // Exemple: 45%
    ALCOHOL: 0.30,          // Exemple: 30%
    LUXURY_GOODS: 0.20      // Exemple: 20%
  }
};

export const TAX_DUE_DATES_BY_COUNTRY = {
  'Gabon': {
    monthly: 20, // Taxes due by the 20th of the following month
    quarterly_is_acomptes: [ // Acomptes provisionnels IS, dates indicatives
      'March 31', 'June 30', 'September 30', 'December 31'
    ],
    dsf_annual: 'April 30' // Déclaration Statistique et Fiscale (DSF)
  },
  'Ghana': {
    monthly: 25, // Example for Ghana
  },
  'France': {
    monthly: 15, // Example for France
  }
  // Add other countries as needed
};

// IMPORTANT: In a production application, tax rates should ideally be fetched from a backend
// or a secure configuration service, as they are subject to change and may vary by region or year.
// Hardcoding them directly in the client-side code is generally not recommended for dynamic tax systems.

/**
 * Calculates various taxes based on revenue and specific parameters.
 * @param {number} revenue - The base revenue amount.
 * @param {object} options - Configuration options for tax calculation.
 * @param {string} [options.tvaCategory='standard'] - 'standard', 'reduced', 'super_reduced', 'zero'.
 * @param {string} [options.revenueType='general'] - 'general', 'electricity', 'tobacco', 'alcohol', 'luxury_goods'.
 * @param {boolean} [options.isIndividual=false] - True if calculating for an individual (IRPP applicable).
 * @param {number} [options.totalAnnualRevenue=0] - Required for IMF calculation, total annual revenue before current calculation.
 * @returns {object} An object containing calculated tax amounts.
 */
export const calculateTaxes = (revenue, options = {}) => {
  const rev = parseFloat(revenue) || 0;
  const { tvaCategory = 'standard', revenueType = 'general', isIndividual = false, totalAnnualRevenue = rev } = options;

  let tvaRate = 0;
  switch (tvaCategory) {
    case 'standard':
      tvaRate = TAX_RATES.TVA_STANDARD;
      break;
    case 'reduced':
      tvaRate = TAX_RATES.TVA_REDUCED;
      break;
    case 'super_reduced':
      tvaRate = TAX_RATES.TVA_SUPER_REDUCED;
      break;
    case 'zero':
    default:
      tvaRate = TAX_RATES.TVA_ZERO;
      break;
  }

  let tva = rev * tvaRate;
  let isTax = 0;
  let irpp = 0;
  let patente = rev * TAX_RATES.PATENTE; // Simplified, patente can be fixed or revenue-based
  let electricityTax = 0;
  let exciseDuty = 0;
  let imf = 0; // Impôt Minimum Forfaitaire

  if (revenueType === 'electricity') {
    electricityTax = rev * TAX_RATES.ELECTRICITY_TAX;
    tva = 0; // TVA usually not applied on electricity bill when specific electricity tax exists
    patente = 0; // Patente not usually applied on specific electricity bill
  } else if (TAX_RATES.EXCISE_DUTY_RATES[revenueType.toUpperCase()]) {
    // For products subject to excise duties
    exciseDuty = rev * TAX_RATES.EXCISE_DUTY_RATES[revenueType.toUpperCase()];
    // TVA and other taxes might apply on top of excise or on the base value before excise,
    // depending on specific regulations. Simplified for now.
  }

  if (!isIndividual) {
    // Corporate taxes (IS)
    isTax = rev * TAX_RATES.IS;
    
    // Calculate Impôt Minimum Forfaitaire (IMF)
    // IMF is generally 1% of total annual turnover, but only payable if it's higher than the calculated IS.
    // This simplified version compares with the current revenue's IS.
    // In a real scenario, this would apply to the total annual IS.
    imf = totalAnnualRevenue * TAX_RATES.IMF_RATE;

    // The IS payable is the higher of the calculated IS or the IMF
    isTax = Math.max(isTax, imf); 

  } else {
    // Individual taxes (IRPP) - Simplified flat rate for demonstration
    irpp = rev * TAX_RATES.IRPP_GENERAL_RATE;
    isTax = 0; // IS is not for individuals
    patente = 0; // Patente usually for businesses
    tva = 0; // Individuals generally don't collect TVA on personal revenue
  }

  const totalTax = tva + isTax + irpp + patente + electricityTax + exciseDuty;

  return {
    revenue: rev,
    tva: tva,
    is: isTax, // This IS now potentially includes IMF
    irpp: irpp,
    patente: patente,
    electricityTax: electricityTax,
    exciseDuty: exciseDuty,
    imf: imf,
    totalTax: totalTax
  };
};

/**
 * Generates simulated revenue data with more realistic tax breakdowns.
 * @param {string} industry - The industry type ('general', 'tech', 'retail', 'consulting').
 * @param {boolean} isIndividual - If true, simulate for an individual.
 * @returns {Array<object>} An array of simulated monthly revenue data with tax calculations.
 */
export const generateSimulatedRevenueData = (industry = 'general', isIndividual = false) => {
  const data = [];
  let minRevenue = 1000000;
  let maxRevenue = 5000000;

  if (industry === 'tech') {
    minRevenue = 5000000;
    maxRevenue = 15000000;
  } else if (industry === 'retail') {
    minRevenue = 2000000;
    maxRevenue = 8000000;
  } else if (industry === 'consulting') {
    minRevenue = 500000;
    maxRevenue = 3000000;
  }
  
  for (let i = 0; i < 12; i++) {
    const revenue = minRevenue + Math.random() * (maxRevenue - minRevenue);
    // Simulate some electricity bills
    const electricityBill = Math.floor(revenue * (0.01 + Math.random() * 0.005)); // 1-1.5% of revenue as electricity
    
    // Simulate some excise duty items (e.g., if a retail industry sells alcohol)
    let exciseRevenue = 0;
    let revenueType = 'general';
    if (industry === 'retail' && Math.random() > 0.7) { // 30% chance of having alcohol sales
      exciseRevenue = revenue * (0.05 + Math.random() * 0.05); // 5-10% of revenue from excisable goods
      revenueType = 'alcohol';
    }

    const generalRevenue = Math.floor(revenue - electricityBill - exciseRevenue);

    const calculatedGeneralTaxes = calculateTaxes(generalRevenue, { isIndividual: isIndividual, revenueType: 'general' });
    const calculatedElectricityTaxes = calculateTaxes(electricityBill, { revenueType: 'electricity' });
    const calculatedExciseTaxes = calculateTaxes(exciseRevenue, { revenueType: revenueType });

    // Sum up taxes from different revenue types for the month
    const combinedTaxes = {
      tva: calculatedGeneralTaxes.tva + calculatedExciseTaxes.tva,
      is: calculatedGeneralTaxes.is + calculatedExciseTaxes.is, // Assuming IS applies to all company revenue
      irpp: calculatedGeneralTaxes.irpp,
      patente: calculatedGeneralTaxes.patente,
      electricityTax: calculatedElectricityTaxes.electricityTax,
      exciseDuty: calculatedExciseTaxes.exciseDuty,
      imf: calculatedGeneralTaxes.imf, // IMF is based on total revenue, not just general
      totalTax: calculatedGeneralTaxes.totalTax + calculatedElectricityTaxes.totalTax + calculatedExciseTaxes.totalTax
    };

    data.push({
      id: i,
      monthIndex: i,
      revenue: generalRevenue + electricityBill + exciseRevenue, // Total revenue for the month
      ...combinedTaxes
    });
  }
  return data;
};