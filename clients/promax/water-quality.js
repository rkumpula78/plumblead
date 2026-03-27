// ============================================
// PlumbLead — Water Quality Intelligence Module
// ============================================

// Language support — reads from global currentLang (set by quote tool)
const WATER_I18N = {
  en: {
    freeReport: 'Free Water Quality Report',
    yourHardness: 'Your Water Hardness',
    soft: 'Soft', hard: 'Hard', veryHard: 'Very Hard',
    hardnessPpm: 'Hardness (ppm)', tdsPpm: 'TDS (ppm)', phLevel: 'pH Level',
    costTitle: '💸 What Hard Water Is Costing You',
    costYear: '/year',
    costOver5: "That's up to",
    costOver5b: 'over 5 years',
    costOver5c: 'in damage, wasted soap, and early appliance replacement.',
    whDamage: 'Water heater damage', appliances: 'Appliances', extraSoap: 'Extra soap', plumbingRepairs: 'Plumbing repairs',
    didYouKnow: '💡 Did You Know?',
    recommend: '✅ What We Recommend',
    wantPrecise: 'Want a precise recommendation based on your home?',
    freeOnsite: '✓ Free on-site water test included with any service call',
    // PNW specific
    greatNews: '✅ Great News: Your Water Is Naturally Soft',
    noSoftener: 'hardness — no water softener needed!',
    whatToKnow: '⚠️ What You Should Know',
    riskLevel: 'Risk level',
    chlorineMgL: 'Chlorine (mg/L)',
    leadRisk: 'Lead Risk',
    pfasTitle: '🧪 About PFAS ("Forever Chemicals")',
    pfasNote: 'The EPA set new limits of just 4 parts per trillion for PFOA/PFOS in 2024. A home RO system removes 90-99% of all PFAS.',
    wantPersonalized: 'Want personalized recommendations for your home?',
    // Hardness levels
    slightlyHard: 'Slightly Hard', moderatelyHard: 'Moderately Hard',
    // AZ product names
    waterSoftenerProduct: 'Water Softener',
    roProduct: 'Reverse Osmosis (Drinking Water)',
    whCarbonProduct: 'Whole House Carbon Filter',
    // AZ recommendation reasons
    azSoftenerReason: 'Your water averages {0} GPG hardness — that\'s "{1}." A softener will protect your plumbing, extend appliance life, and save you money.',
    azRoChloramine: '{0} uses chloramine disinfection, which many people find affects taste. An RO system gives you pure drinking water at the tap.',
    azRoTds: 'With TDS at {0} ppm, an RO system will significantly improve your drinking water quality.',
    azCarbonReason: 'Chloramine doesn\'t evaporate like chlorine — it stays in your water through showers, laundry, and cooking. A carbon filter removes it at the point of entry.',
    azSoftenerPriceHigh: '$2,800 – $4,500 installed',
    azSoftenerPriceLow: '$1,800 – $3,500 installed',
    azRoPrice: '$300 – $800 installed',
    azCarbonPrice: '$800 – $2,000 installed',
    // AZ facts
    azFactHarder: '{0} water is {1}× harder than what\'s considered "soft" water.',
    azFactHeater: 'Hard water can reduce your water heater\'s lifespan by 30-50%. In {0}, that means replacing it every 6-8 years instead of 12-15.',
    azFactSoap: 'You\'re using up to {0}% more soap and detergent than homes with soft water.',
    azFactChloramine: '{0} uses chloramine (chlorine + ammonia) to disinfect water. Unlike chlorine, it doesn\'t evaporate — a standard Brita filter won\'t remove it.',
    azFactTds: 'Your water has approximately {0} ppm of total dissolved solids — about {1}% above the EPA\'s recommended aesthetic limit of 500 ppm.',
    // WA concerns
    chlorineTasteOdor: 'Chlorine taste/odor',
    leadOldPlumbing: 'Lead from old plumbing',
    pfasAwareness: 'PFAS awareness',
    chloramineHarder: 'Chloramine (harder to filter than chlorine)',
    // WA product names
    underSinkRo: 'Under-Sink Reverse Osmosis',
    leadFiltration: 'Lead Filtration',
    // WA recommendation reasons
    waRoReason: 'RO removes 90-99% of PFAS, lead, microplastics, and dissolved solids from your drinking water. Even though {0}\'s source water tests well, your home\'s pipes are the last mile — and that\'s where contaminants enter.',
    waCarbonReason: '{0} water has about {1} mg/L chlorine. A whole-house carbon filter removes it from every tap — showers, kitchen, laundry. Notice the difference in your first shower.',
    waLeadReason: '{0}. Homes built before 1986 often have lead solder in copper pipe joints. A certified lead filter ($200-500) or RO system protects your family at the tap.',
    waRoPrice: '$400 – $900 installed',
    waCarbonPrice: '$1,200 – $2,500 installed',
    waLeadPrice: '$200 – $500 installed (or included with RO)',
    // WA facts
    waFactSoft: '{0} water is naturally very soft ({1} GPG) — you do NOT need a water softener here.',
    waFactDisinfectChlorine: '{0} uses chlorine to disinfect water. Chlorine is effectively removed by standard activated carbon filters.',
    waFactDisinfectChloramine: '{0} uses chloramine to disinfect water. Chloramine is harder to remove than chlorine — standard carbon filters are less effective. Catalytic carbon or RO is recommended.',
    waFactLead: '{0}. These homes likely have lead solder in their plumbing. The EPA\'s action level for lead is 15 ppb — even low levels are concerning for children.',
    waFactPfas: 'The EPA finalized new PFAS limits in 2024: just 4 parts per trillion for PFOA and PFOS. Water systems must comply by 2029. A home RO system exceeds these standards today.',
    waFactIndustrial: '{0} has industrial history nearby. While municipal water is treated, groundwater contamination in the area means point-of-use filtration provides an extra layer of protection.'
  },
  es: {
    freeReport: 'Informe Gratuito de Calidad del Agua',
    yourHardness: 'Dureza de Su Agua',
    soft: 'Suave', hard: 'Dura', veryHard: 'Muy Dura',
    hardnessPpm: 'Dureza (ppm)', tdsPpm: 'SDT (ppm)', phLevel: 'Nivel de pH',
    costTitle: '💸 Lo Que Le Cuesta el Agua Dura',
    costYear: '/año',
    costOver5: 'Eso es hasta',
    costOver5b: 'en 5 años',
    costOver5c: 'en daños, jabón desperdiciado y reemplazo prematuro de electrodomésticos.',
    whDamage: 'Daño al calentador', appliances: 'Electrodomésticos', extraSoap: 'Jabón extra', plumbingRepairs: 'Reparaciones de plomería',
    didYouKnow: '💡 ¿Sabía Usted?',
    recommend: '✅ Lo Que Recomendamos',
    wantPrecise: '¿Quiere una recomendación precisa para su hogar?',
    freeOnsite: '✓ Prueba de agua gratuita en el sitio incluida con cualquier llamada de servicio',
    // PNW specific
    greatNews: '✅ Buenas Noticias: Su Agua Es Naturalmente Suave',
    noSoftener: 'de dureza — ¡no necesita ablandador de agua!',
    whatToKnow: '⚠️ Lo Que Debe Saber',
    riskLevel: 'Nivel de riesgo',
    chlorineMgL: 'Cloro (mg/L)',
    leadRisk: 'Riesgo de Plomo',
    pfasTitle: '🧪 Sobre los PFAS ("Químicos Eternos")',
    pfasNote: 'La EPA estableció nuevos límites de solo 4 partes por trillón para PFOA/PFOS en 2024. Un sistema de ósmosis inversa elimina el 90-99% de todos los PFAS.',
    wantPersonalized: '¿Quiere recomendaciones personalizadas para su hogar?',
    slightlyHard: 'Ligeramente Dura', moderatelyHard: 'Moderadamente Dura',
    // AZ product names
    waterSoftenerProduct: 'Ablandador de Agua',
    roProduct: 'Ósmosis Inversa (Agua Potable)',
    whCarbonProduct: 'Filtro de Carbón para Toda la Casa',
    // AZ recommendation reasons
    azSoftenerReason: 'Su agua tiene un promedio de {0} GPG de dureza — eso es "{1}." Un ablandador protegerá su plomería, extenderá la vida de sus electrodomésticos y le ahorrará dinero.',
    azRoChloramine: '{0} usa desinfección con cloramina, que muchas personas notan que afecta el sabor. Un sistema de ósmosis inversa le da agua pura directamente del grifo.',
    azRoTds: 'Con SDT de {0} ppm, un sistema de ósmosis inversa mejorará significativamente la calidad de su agua potable.',
    azCarbonReason: 'La cloramina no se evapora como el cloro — permanece en el agua en la ducha, la lavandería y la cocina. Un filtro de carbón la elimina en el punto de entrada.',
    azSoftenerPriceHigh: '$2,800 – $4,500 instalado',
    azSoftenerPriceLow: '$1,800 – $3,500 instalado',
    azRoPrice: '$300 – $800 instalado',
    azCarbonPrice: '$800 – $2,000 instalado',
    // AZ facts
    azFactHarder: 'El agua de {0} es {1}× más dura que lo que se considera agua "suave".',
    azFactHeater: 'El agua dura puede reducir la vida útil de su calentador en un 30-50%. En {0}, eso significa reemplazarlo cada 6-8 años en lugar de 12-15.',
    azFactSoap: 'Está usando hasta un {0}% más de jabón y detergente que hogares con agua suave.',
    azFactChloramine: '{0} usa cloramina (cloro + amoniaco) para desinfectar el agua. A diferencia del cloro, no se evapora — un filtro Brita estándar no la eliminará.',
    azFactTds: 'Su agua tiene aproximadamente {0} ppm de sólidos disueltos totales — alrededor de {1}% por encima del límite estético recomendado por la EPA de 500 ppm.',
    // WA concerns
    chlorineTasteOdor: 'Sabor/olor a cloro',
    leadOldPlumbing: 'Plomo de plomería antigua',
    pfasAwareness: 'Conciencia sobre PFAS',
    chloramineHarder: 'Cloramina (más difícil de filtrar que el cloro)',
    // WA product names
    underSinkRo: 'Ósmosis Inversa Bajo el Fregadero',
    leadFiltration: 'Filtración de Plomo',
    // WA recommendation reasons
    waRoReason: 'La ósmosis inversa elimina el 90-99% de PFAS, plomo, microplásticos y sólidos disueltos de su agua potable. Aunque el agua de origen de {0} está bien analizada, las tuberías de su hogar son el último tramo — y ahí es donde entran los contaminantes.',
    waCarbonReason: 'El agua de {0} tiene aproximadamente {1} mg/L de cloro. Un filtro de carbón para toda la casa lo elimina de cada grifo — duchas, cocina, lavandería. Notará la diferencia en su primera ducha.',
    waLeadReason: '{0}. Los hogares construidos antes de 1986 a menudo tienen soldadura de plomo en las juntas de tubería de cobre. Un filtro certificado de plomo ($200-500) o un sistema de ósmosis inversa protege a su familia en el grifo.',
    waRoPrice: '$400 – $900 instalado',
    waCarbonPrice: '$1,200 – $2,500 instalado',
    waLeadPrice: '$200 – $500 instalado (o incluido con ósmosis inversa)',
    // WA facts
    waFactSoft: 'El agua de {0} es naturalmente muy suave ({1} GPG) — NO necesita un ablandador de agua aquí.',
    waFactDisinfectChlorine: '{0} usa cloro para desinfectar el agua. El cloro se elimina eficazmente con filtros de carbón activado estándar.',
    waFactDisinfectChloramine: '{0} usa cloramina para desinfectar el agua. La cloramina es más difícil de eliminar que el cloro — los filtros de carbón estándar son menos efectivos. Se recomienda carbón catalítico u ósmosis inversa.',
    waFactLead: '{0}. Estos hogares probablemente tienen soldadura de plomo en su plomería. El nivel de acción de la EPA para el plomo es 15 ppb — incluso niveles bajos son preocupantes para los niños.',
    waFactPfas: 'La EPA finalizó nuevos límites de PFAS en 2024: solo 4 partes por trillón para PFOA y PFOS. Los sistemas de agua deben cumplir para 2029. Un sistema de ósmosis inversa en el hogar supera estos estándares hoy.',
    waFactIndustrial: '{0} tiene historia industrial cercana. Aunque el agua municipal está tratada, la contaminación de aguas subterráneas en el área significa que la filtración en punto de uso proporciona una capa extra de protección.'
  }
};

function _wt(key) {
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
  return (WATER_I18N[lang] && WATER_I18N[lang][key]) || WATER_I18N.en[key] || key;
}

// Format helper: _wtf('key', val1, val2) replaces {0}, {1}, etc.
function _wtf(key, ...args) {
  let s = _wt(key);
  args.forEach((v, i) => { s = s.replace(new RegExp('\\{' + i + '\\}', 'g'), v); });
  return s;
}

const AZ_WATER_DATA = {
  // Zip code → city mapping for Phoenix metro
  zipToCity: {
    // Phoenix
    '85001':'phoenix','85003':'phoenix','85004':'phoenix','85006':'phoenix','85007':'phoenix',
    '85008':'phoenix','85009':'phoenix','85012':'phoenix','85013':'phoenix','85014':'phoenix',
    '85015':'phoenix','85016':'phoenix','85017':'phoenix','85018':'phoenix','85019':'phoenix',
    '85020':'phoenix','85021':'phoenix','85022':'phoenix','85023':'phoenix','85024':'phoenix',
    '85027':'phoenix','85028':'phoenix','85029':'phoenix','85031':'phoenix','85032':'phoenix',
    '85033':'phoenix','85034':'phoenix','85035':'phoenix','85037':'phoenix','85040':'phoenix',
    '85041':'phoenix','85042':'phoenix','85043':'phoenix','85044':'phoenix','85045':'phoenix',
    '85048':'phoenix','85050':'phoenix','85051':'phoenix','85053':'phoenix','85054':'phoenix',
    '85083':'phoenix','85085':'phoenix','85086':'phoenix','85087':'phoenix',
    // Scottsdale
    '85250':'scottsdale','85251':'scottsdale','85252':'scottsdale','85253':'scottsdale',
    '85254':'scottsdale','85255':'scottsdale','85256':'scottsdale','85257':'scottsdale',
    '85258':'scottsdale','85259':'scottsdale','85260':'scottsdale','85261':'scottsdale',
    '85262':'scottsdale','85266':'scottsdale',
    // Mesa
    '85201':'mesa','85202':'mesa','85203':'mesa','85204':'mesa','85205':'mesa','85206':'mesa',
    '85207':'mesa','85208':'mesa','85209':'mesa','85210':'mesa','85212':'mesa','85213':'mesa','85215':'mesa',
    // Chandler
    '85224':'chandler','85225':'chandler','85226':'chandler','85248':'chandler','85249':'chandler','85286':'chandler',
    // Gilbert
    '85233':'gilbert','85234':'gilbert','85295':'gilbert','85296':'gilbert','85297':'gilbert','85298':'gilbert',
    // Tempe
    '85281':'tempe','85282':'tempe','85283':'tempe','85284':'tempe',
    // Goodyear
    '85338':'goodyear','85395':'goodyear','85396':'goodyear',
    // Peoria
    '85345':'peoria','85381':'peoria','85382':'peoria','85383':'peoria',
    // Glendale
    '85301':'glendale','85302':'glendale','85303':'glendale','85304':'glendale','85305':'glendale',
    '85306':'glendale','85307':'glendale','85308':'glendale','85310':'glendale',
    // Surprise
    '85374':'surprise','85378':'surprise','85379':'surprise','85387':'surprise','85388':'surprise',
    // Buckeye
    '85326':'buckeye',
    // Avondale
    '85323':'avondale','85392':'avondale'
  },

  cities: {
    phoenix:    { name: 'Phoenix',    hardness: { low: 12, high: 17, avg: 15 }, tds: 550, ph: 7.9, disinfection: 'chloramine' },
    scottsdale: { name: 'Scottsdale', hardness: { low: 12, high: 20, avg: 16 }, tds: 625, ph: 8.0, disinfection: 'chloramine' },
    mesa:       { name: 'Mesa',       hardness: { low: 12, high: 22, avg: 17 }, tds: 650, ph: 7.9, disinfection: 'chloramine' },
    chandler:   { name: 'Chandler',   hardness: { low: 5,  high: 20, avg: 13 }, tds: 525, ph: 7.8, disinfection: 'chloramine' },
    gilbert:    { name: 'Gilbert',    hardness: { low: 10, high: 16, avg: 13 }, tds: 550, ph: 7.8, disinfection: 'chloramine' },
    tempe:      { name: 'Tempe',      hardness: { low: 8,  high: 23, avg: 16 }, tds: 575, ph: 7.9, disinfection: 'chloramine' },
    goodyear:   { name: 'Goodyear',   hardness: { low: 10, high: 38, avg: 24 }, tds: 800, ph: 7.8, disinfection: 'chlorine' },
    peoria:     { name: 'Peoria',     hardness: { low: 10, high: 22, avg: 16 }, tds: 600, ph: 7.8, disinfection: 'chloramine' },
    glendale:   { name: 'Glendale',   hardness: { low: 10, high: 20, avg: 15 }, tds: 575, ph: 7.8, disinfection: 'chloramine' },
    surprise:   { name: 'Surprise',   hardness: { low: 12, high: 25, avg: 18 }, tds: 675, ph: 7.8, disinfection: 'chlorine' },
    buckeye:    { name: 'Buckeye',    hardness: { low: 15, high: 35, avg: 25 }, tds: 850, ph: 7.7, disinfection: 'chlorine' },
    avondale:   { name: 'Avondale',   hardness: { low: 12, high: 30, avg: 20 }, tds: 700, ph: 7.8, disinfection: 'chlorine' }
  },

  // Hardness classification
  getHardnessLevel(gpg) {
    if (gpg <= 3.5)  return { level: _wt('soft'), color: '#10b981', emoji: '💧', severity: 0 };
    if (gpg <= 7.0)  return { level: _wt('slightlyHard'), color: '#84cc16', emoji: '💧', severity: 1 };
    if (gpg <= 10.5) return { level: _wt('moderatelyHard'), color: '#eab308', emoji: '⚠️', severity: 2 };
    if (gpg <= 14.6) return { level: _wt('hard'), color: '#f97316', emoji: '🔶', severity: 3 };
    return { level: _wt('veryHard'), color: '#ef4444', emoji: '🚨', severity: 4 };
  },

  // Softener sizing
  sizeSoftener(people, hardnessGPG) {
    const dailyGallons = 75;
    const regenDays = 7;
    const grainCapacity = people * dailyGallons * hardnessGPG * regenDays;

    const sizes = [
      { grains: 24000, label: '24K', people: '1-2', installLow: 1500, installHigh: 2500 },
      { grains: 32000, label: '32K', people: '2-3', installLow: 1800, installHigh: 2800 },
      { grains: 48000, label: '48K', people: '3-4', installLow: 2200, installHigh: 3500 },
      { grains: 64000, label: '64K', people: '4-6', installLow: 2800, installHigh: 4000 },
      { grains: 80000, label: '80K', people: '6+',  installLow: 3200, installHigh: 4500 }
    ];

    // Find the right size (first one that exceeds needed capacity)
    const recommended = sizes.find(s => s.grains >= grainCapacity) || sizes[sizes.length - 1];

    return {
      needed: grainCapacity,
      recommended,
      allOptions: sizes
    };
  },

  // Annual cost of hard water
  estimateAnnualCost(hardnessGPG) {
    // Scale factor based on hardness (baseline at 15 GPG = 1.0x)
    const factor = Math.min(hardnessGPG / 15, 2.5);
    return {
      low: Math.round(700 * factor),
      high: Math.round(2000 * factor),
      avg: Math.round(1350 * factor),
      breakdown: {
        waterHeater: Math.round(350 * factor),
        appliances: Math.round(200 * factor),
        soapDetergent: Math.round(175 * factor),
        plumbingRepairs: Math.round(250 * factor),
        cleaningProducts: Math.round(100 * factor)
      }
    };
  },

  // Get full water report for a zip code
  getReport(zipCode) {
    const cityKey = this.zipToCity[zipCode];
    if (!cityKey) return null;

    const city = this.cities[cityKey];
    const hardnessInfo = this.getHardnessLevel(city.hardness.avg);
    const annualCost = this.estimateAnnualCost(city.hardness.avg);

    return {
      city: city.name,
      zipCode,
      hardness: {
        ...city.hardness,
        ...hardnessInfo,
        ppm: Math.round(city.hardness.avg * 17.1)
      },
      tds: city.tds,
      ph: city.ph,
      disinfection: city.disinfection,
      annualCost,
      recommendation: this.getRecommendation(city),
      facts: this.getFacts(city)
    };
  },

  // Generate recommendation based on water quality
  getRecommendation(city) {
    const recs = [];

    // Softener recommendation
    if (city.hardness.avg > 7) {
      recs.push({
        priority: 'high',
        product: _wt('waterSoftenerProduct'),
        reason: _wtf('azSoftenerReason', city.hardness.avg, this.getHardnessLevel(city.hardness.avg).level),
        priceRange: city.hardness.avg > 20
          ? _wt('azSoftenerPriceHigh')
          : _wt('azSoftenerPriceLow')
      });
    }

    // RO recommendation (always for AZ due to TDS + taste)
    if (city.tds > 400 || city.disinfection === 'chloramine') {
      recs.push({
        priority: city.tds > 600 ? 'high' : 'medium',
        product: _wt('roProduct'),
        reason: city.disinfection === 'chloramine'
          ? _wtf('azRoChloramine', city.name)
          : _wtf('azRoTds', city.tds),
        priceRange: _wt('azRoPrice')
      });
    }

    // Whole house carbon (if chloramine)
    if (city.disinfection === 'chloramine') {
      recs.push({
        priority: 'medium',
        product: _wt('whCarbonProduct'),
        reason: _wt('azCarbonReason'),
        priceRange: _wt('azCarbonPrice')
      });
    }

    return recs;
  },

  // Fun facts for engagement
  getFacts(city) {
    const facts = [];
    const h = city.hardness.avg;

    if (h >= 15) {
      facts.push(_wtf('azFactHarder', city.name, Math.round(h/3.5)));
    }
    if (h >= 12) {
      facts.push(_wtf('azFactHeater', city.name));
    }
    facts.push(_wtf('azFactSoap', Math.round(50 + (h/15) * 25)));

    if (city.disinfection === 'chloramine') {
      facts.push(_wtf('azFactChloramine', city.name));
    }

    if (city.tds > 500) {
      facts.push(_wtf('azFactTds', city.tds, Math.round(city.tds/500 * 100)));
    }

    return facts;
  }
};

// ============================================
// Water Quality Report UI Component
// ============================================

function generateWaterReportHTML(zipCode) {
  const report = AZ_WATER_DATA.getReport(zipCode);
  if (!report) return null;

  const costSaved5yr = report.annualCost.avg * 5;
  const recs = report.recommendation;

  return `
    <div class="water-report" style="background: white; border-radius: 16px; padding: 28px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); margin: 20px 0;">

      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">${_wt('freeReport')}</div>
        <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px;">${report.city}, AZ — ${zipCode}</div>
      </div>

      <!-- Hardness Gauge -->
      <div style="text-align: center; margin: 24px 0;">
        <div style="font-size: 14px; color: #64748b;">${_wt('yourHardness')}</div>
        <div style="font-size: 48px; font-weight: 800; color: ${report.hardness.color};">
          ${report.hardness.avg} GPG
        </div>
        <div style="display: inline-block; padding: 4px 16px; background: ${report.hardness.color}15; color: ${report.hardness.color}; border-radius: 20px; font-size: 14px; font-weight: 600;">
          ${report.hardness.emoji} ${report.hardness.level}
        </div>
        <div style="margin-top: 12px;">
          <div style="background: #f1f5f9; border-radius: 8px; height: 12px; position: relative; max-width: 300px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #10b981, #84cc16, #eab308, #f97316, #ef4444); border-radius: 8px; height: 12px; width: 100%;"></div>
            <div style="position: absolute; top: -4px; left: ${Math.min((report.hardness.avg / 30) * 100, 95)}%; width: 20px; height: 20px; background: white; border: 3px solid ${report.hardness.color}; border-radius: 50%; transform: translateX(-50%);"></div>
          </div>
          <div style="display: flex; justify-content: space-between; max-width: 300px; margin: 4px auto 0; font-size: 10px; color: #94a3b8;">
            <span>${_wt('soft')}</span><span>${_wt('hard')}</span><span>${_wt('veryHard')}</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0;">
        <div style="text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${report.hardness.ppm}</div>
          <div style="font-size: 11px; color: #64748b;">${_wt('hardnessPpm')}</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${report.tds}</div>
          <div style="font-size: 11px; color: #64748b;">${_wt('tdsPpm')}</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${report.ph}</div>
          <div style="font-size: 11px; color: #64748b;">${_wt('phLevel')}</div>
        </div>
      </div>

      <!-- Cost of Hard Water -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="font-size: 15px; font-weight: 700; color: #991b1b; margin-bottom: 8px;">${_wt('costTitle')}</div>
        <div style="font-size: 32px; font-weight: 800; color: #ef4444;">$${report.annualCost.low.toLocaleString()} – $${report.annualCost.high.toLocaleString()}${_wt('costYear')}</div>
        <div style="font-size: 13px; color: #991b1b; margin-top: 4px;">${_wt('costOver5')} <strong>$${costSaved5yr.toLocaleString()} ${_wt('costOver5b')}</strong> ${_wt('costOver5c')}</div>
        <div style="margin-top: 12px; font-size: 12px; color: #64748b;">
          ${_wt('whDamage')}: ~$${report.annualCost.breakdown.waterHeater}/yr •
          ${_wt('appliances')}: ~$${report.annualCost.breakdown.appliances}/yr •
          ${_wt('extraSoap')}: ~$${report.annualCost.breakdown.soapDetergent}/yr •
          ${_wt('plumbingRepairs')}: ~$${report.annualCost.breakdown.plumbingRepairs}/yr
        </div>
      </div>

      <!-- Did You Know -->
      <div style="margin: 20px 0;">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">${_wt('didYouKnow')}</div>
        ${report.facts.map(f => `
          <div style="display: flex; gap: 8px; margin-bottom: 8px; font-size: 14px; color: #334155; line-height: 1.5;">
            <span style="color: #0ea5e9; flex-shrink: 0;">•</span>
            <span>${f}</span>
          </div>
        `).join('')}
      </div>

      <!-- Recommendations -->
      <div style="margin: 20px 0;">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">${_wt('recommend')}</div>
        ${recs.map(r => `
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 10px; ${r.priority === 'high' ? 'border-left: 4px solid #0ea5e9;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${r.product}</div>
              <div style="font-size: 13px; font-weight: 600; color: #0ea5e9;">${r.priceRange}</div>
            </div>
            <div style="font-size: 13px; color: #64748b; margin-top: 6px; line-height: 1.5;">${r.reason}</div>
          </div>
        `).join('')}
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-top: 24px;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">${_wt('wantPrecise')}</div>
        <div style="font-size: 13px; color: #10b981; font-weight: 600;">${_wt('freeOnsite')}</div>
      </div>
    </div>
  `;
}

// ============================================
// Washington State / Seattle Metro Data
// ============================================

const WA_WATER_DATA = {
  zipToCity: {
    // Seattle
    '98101':'seattle','98102':'seattle','98103':'seattle','98104':'seattle','98105':'seattle',
    '98106':'seattle','98107':'seattle','98108':'seattle','98109':'seattle','98112':'seattle',
    '98115':'seattle','98116':'seattle','98117':'seattle','98118':'seattle','98119':'seattle',
    '98121':'seattle','98122':'seattle','98125':'seattle','98126':'seattle','98133':'seattle',
    '98134':'seattle','98136':'seattle','98144':'seattle','98146':'seattle','98155':'seattle',
    '98168':'seattle','98177':'seattle','98178':'seattle','98188':'seattle','98198':'seattle','98199':'seattle',
    // Bellevue
    '98004':'bellevue','98005':'bellevue','98006':'bellevue','98007':'bellevue','98008':'bellevue',
    // Tacoma
    '98401':'tacoma','98402':'tacoma','98403':'tacoma','98404':'tacoma','98405':'tacoma',
    '98406':'tacoma','98407':'tacoma','98408':'tacoma','98409':'tacoma','98416':'tacoma',
    '98418':'tacoma','98421':'tacoma','98422':'tacoma','98444':'tacoma','98445':'tacoma',
    '98465':'tacoma','98466':'tacoma','98467':'tacoma',
    // Renton
    '98055':'renton','98056':'renton','98057':'renton','98058':'renton','98059':'renton',
    // Kirkland
    '98033':'kirkland','98034':'kirkland',
    // Redmond
    '98052':'redmond','98053':'redmond',
    // Kent
    '98030':'kent','98031':'kent','98032':'kent','98042':'kent',
    // Everett
    '98201':'everett','98203':'everett','98204':'everett','98208':'everett'
  },

  cities: {
    seattle:   { name: 'Seattle',   hardness: { low: 0.5, high: 2.0, avg: 1.3 }, tds: 40,  ph: 8.0, chlorine: 0.8, disinfection: 'chlorine',   pfas: 'Not detected in main sources. One emergency well above EPA MCL.', leadRisk: 'high', housingAge: '35%+ built before 1960' },
    bellevue:  { name: 'Bellevue',  hardness: { low: 1.0, high: 4.0, avg: 2.5 }, tds: 55,  ph: 7.8, chlorine: 0.7, disinfection: 'chloramine', pfas: 'Testing ongoing', leadRisk: 'moderate', housingAge: 'Mixed — some older neighborhoods' },
    tacoma:    { name: 'Tacoma',    hardness: { low: 1.0, high: 3.0, avg: 1.8 }, tds: 45,  ph: 7.7, chlorine: 0.9, disinfection: 'chlorine',   pfas: 'Industrial history — elevated awareness', leadRisk: 'high', housingAge: 'Significant pre-1960 stock' },
    renton:    { name: 'Renton',    hardness: { low: 1.0, high: 3.5, avg: 2.0 }, tds: 50,  ph: 7.8, chlorine: 0.7, disinfection: 'chlorine',   pfas: 'Boeing industrial area — elevated risk', leadRisk: 'moderate', housingAge: 'Mixed' },
    kirkland:  { name: 'Kirkland',  hardness: { low: 1.0, high: 3.0, avg: 2.0 }, tds: 45,  ph: 7.8, chlorine: 0.6, disinfection: 'chloramine', pfas: 'Testing ongoing', leadRisk: 'low-moderate', housingAge: 'Mostly newer' },
    redmond:   { name: 'Redmond',   hardness: { low: 0.5, high: 2.5, avg: 1.5 }, tds: 40,  ph: 7.9, chlorine: 0.6, disinfection: 'chloramine', pfas: 'Low risk', leadRisk: 'low', housingAge: 'Mostly post-1990' },
    kent:      { name: 'Kent',      hardness: { low: 2.0, high: 6.0, avg: 4.0 }, tds: 100, ph: 7.6, chlorine: 0.7, disinfection: 'chlorine',   pfas: 'Industrial valley — higher risk', leadRisk: 'moderate', housingAge: 'Mixed industrial/residential' },
    everett:   { name: 'Everett',   hardness: { low: 0.3, high: 1.5, avg: 0.7 }, tds: 30,  ph: 8.0, chlorine: 0.8, disinfection: 'chlorine',   pfas: 'Paine Field/Boeing PFAS documented in groundwater', leadRisk: 'moderate', housingAge: 'Older industrial city' }
  },

  getReport(zipCode) {
    const cityKey = this.zipToCity[zipCode];
    if (!cityKey) return null;

    const city = this.cities[cityKey];
    return {
      city: city.name,
      zipCode,
      region: 'pnw',
      hardness: { ...city.hardness, level: 'Soft', color: '#10b981', emoji: '💧' },
      tds: city.tds,
      ph: city.ph,
      chlorine: city.chlorine,
      disinfection: city.disinfection,
      pfas: city.pfas,
      leadRisk: city.leadRisk,
      housingAge: city.housingAge,
      // PNW: no softener needed, focus on filtration
      primaryConcerns: this.getConcerns(city),
      recommendation: this.getRecommendation(city),
      facts: this.getFacts(city),
      annualFilterCost: { low: 60, high: 250 }
    };
  },

  getConcerns(city) {
    const concerns = [];
    concerns.push({ issue: _wt('chlorineTasteOdor'), severity: city.chlorine > 0.5 ? 'moderate' : 'low', icon: '🚰' });
    if (city.leadRisk === 'high') concerns.push({ issue: _wt('leadOldPlumbing'), severity: 'high', icon: '⚠️' });
    if (city.pfas.toLowerCase().includes('industrial') || city.pfas.toLowerCase().includes('boeing') || city.pfas.toLowerCase().includes('above'))
      concerns.push({ issue: _wt('pfasAwareness'), severity: 'moderate', icon: '🧪' });
    if (city.disinfection === 'chloramine')
      concerns.push({ issue: _wt('chloramineHarder'), severity: 'moderate', icon: '⚗️' });
    return concerns;
  },

  getRecommendation(city) {
    const recs = [];

    // Always recommend RO for PNW (PFAS + lead peace of mind)
    recs.push({
      priority: 'high',
      product: _wt('underSinkRo'),
      reason: _wtf('waRoReason', city.name),
      priceRange: _wt('waRoPrice')
    });

    // Whole house carbon for chlorine taste
    if (city.chlorine >= 0.5) {
      recs.push({
        priority: 'high',
        product: _wt('whCarbonProduct'),
        reason: _wtf('waCarbonReason', city.name, city.chlorine),
        priceRange: _wt('waCarbonPrice')
      });
    }

    // Lead filter for old homes
    if (city.leadRisk === 'high' || city.leadRisk === 'moderate') {
      recs.push({
        priority: city.leadRisk === 'high' ? 'high' : 'medium',
        product: _wt('leadFiltration'),
        reason: _wtf('waLeadReason', city.housingAge),
        priceRange: _wt('waLeadPrice')
      });
    }

    return recs;
  },

  getFacts(city) {
    const facts = [];
    facts.push(_wtf('waFactSoft', city.name, city.hardness.avg));
    facts.push(city.disinfection === 'chloramine'
      ? _wtf('waFactDisinfectChloramine', city.name)
      : _wtf('waFactDisinfectChlorine', city.name));

    if (city.leadRisk === 'high') {
      facts.push(_wtf('waFactLead', city.housingAge));
    }

    facts.push(_wt('waFactPfas'));

    if (city.pfas.toLowerCase().includes('boeing') || city.pfas.toLowerCase().includes('industrial')) {
      facts.push(_wtf('waFactIndustrial', city.name));
    }

    return facts;
  }
};

// ============================================
// Universal Report Generator (Routes AZ vs WA)
// ============================================

function generateWaterReportForZip(zipCode) {
  // Try Arizona first
  let report = AZ_WATER_DATA.getReport(zipCode);
  if (report) {
    report.region = 'arizona';
    return report;
  }

  // Try Washington
  report = WA_WATER_DATA.getReport(zipCode);
  if (report) {
    report.region = 'pnw';
    return report;
  }

  return null;
}

// Override the original generateWaterReportHTML to handle both regions
const _originalGenerateReport = generateWaterReportHTML;
generateWaterReportHTML = function(zipCode) {
  // Try AZ first (original function)
  const azReport = AZ_WATER_DATA.getReport(zipCode);
  if (azReport) return _originalGenerateReport(zipCode);

  // Try WA — generate PNW-specific report
  const report = WA_WATER_DATA.getReport(zipCode);
  if (!report) return null;

  return `
    <div class="water-report" style="background: white; border-radius: 16px; padding: 28px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); margin: 20px 0;">

      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">${_wt('freeReport')}</div>
        <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px;">${report.city}, WA — ${zipCode}</div>
      </div>

      <!-- Good news: soft water -->
      <div style="text-align: center; background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 14px; color: #16a34a; font-weight: 600;">${_wt('greatNews')}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${report.hardness.avg} GPG ${_wt('noSoftener')}</div>
      </div>

      <!-- But here's what to watch for -->
      <div style="margin: 20px 0;">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">${_wt('whatToKnow')}</div>
        ${report.primaryConcerns.map(c => `
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px; padding: 10px; background: ${c.severity === 'high' ? '#fef2f2' : '#fefce8'}; border-radius: 8px;">
            <span style="font-size: 20px;">${c.icon}</span>
            <div>
              <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${c.issue}</div>
              <div style="font-size: 12px; color: #64748b;">${_wt('riskLevel')}: ${c.severity}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Quick Stats -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0;">
        <div style="text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${report.chlorine}</div>
          <div style="font-size: 11px; color: #64748b;">${_wt('chlorineMgL')}</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 700; color: #0f172a;">${report.tds}</div>
          <div style="font-size: 11px; color: #64748b;">${_wt('tdsPpm')}</div>
        </div>
        <div style="text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 20px; font-weight: 700; color: ${report.leadRisk === 'high' ? '#ef4444' : '#0f172a'};">${report.leadRisk}</div>
          <div style="font-size: 11px; color: #64748b;">${_wt('leadRisk')}</div>
        </div>
      </div>

      <!-- PFAS callout -->
      <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 14px; font-weight: 700; color: #854d0e; margin-bottom: 4px;">${_wt('pfasTitle')}</div>
        <div style="font-size: 13px; color: #713f12; line-height: 1.5;">${report.pfas}</div>
        <div style="font-size: 12px; color: #92400e; margin-top: 8px;">${_wt('pfasNote')}</div>
      </div>

      <!-- Did You Know -->
      <div style="margin: 20px 0;">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">${_wt('didYouKnow')}</div>
        ${report.facts.map(f => `
          <div style="display: flex; gap: 8px; margin-bottom: 8px; font-size: 14px; color: #334155; line-height: 1.5;">
            <span style="color: #0ea5e9; flex-shrink: 0;">•</span>
            <span>${f}</span>
          </div>
        `).join('')}
      </div>

      <!-- Recommendations -->
      <div style="margin: 20px 0;">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">${_wt('recommend')}</div>
        ${report.recommendation.map(r => `
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 10px; ${r.priority === 'high' ? 'border-left: 4px solid #0ea5e9;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${r.product}</div>
              <div style="font-size: 13px; font-weight: 600; color: #0ea5e9;">${r.priceRange}</div>
            </div>
            <div style="font-size: 13px; color: #64748b; margin-top: 6px; line-height: 1.5;">${r.reason}</div>
          </div>
        `).join('')}
      </div>

      <!-- Water Treatment Add-On Section -->
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%); border-radius: 12px; padding: 24px; margin: 20px 0; color: white;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 16px; font-weight: 800;">💧 Protect Your Family's Water</div>
          <div style="font-size: 13px; opacity: 0.85; margin-top: 4px;">ProMax installs professional water treatment systems — add one to any service call</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
          ${report.recommendation.map(r => \`
            <div style="background: rgba(255,255,255,0.12); border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 15px; font-weight: 700;">\${r.product}</div>
              <div style="font-size: 20px; font-weight: 800; margin: 8px 0; color: #10b981;">\${r.priceRange}</div>
              <div style="font-size: 11px; opacity: 0.8;">\${r.priority === 'high' ? '⭐ Recommended for your area' : 'Optional upgrade'}</div>
            </div>
          \`).join('')}
        </div>
        <div style="text-align: center; margin-top: 16px;">
          <div style="font-size: 13px; opacity: 0.85; margin-bottom: 8px;">✓ Free on-site water test &nbsp;•&nbsp; ✓ Same-day install available &nbsp;•&nbsp; ✓ Licensed & insured</div>
          <a href="tel:+14254951961" style="display: inline-block; padding: 12px 32px; background: #e63946; color: white; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; margin-top: 4px;">Call (425) 495-1961 →</a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">${_wt('wantPersonalized')}</div>
        <div style="font-size: 13px; color: #10b981; font-weight: 600;">${_wt('freeOnsite')}</div>
      </div>
    </div>
  `;
};

// ============================================
// Softener Sizing Calculator (for plumber dashboard)
// ============================================

function sizeSoftenerForHome(zipCode, numPeople, numBathrooms) {
  const report = AZ_WATER_DATA.getReport(zipCode);
  if (!report) return null;

  const hardness = report.hardness.avg;
  const sizing = AZ_WATER_DATA.sizeSoftener(numPeople, hardness);

  // Adjust based on bathrooms (flow rate consideration)
  let flowNeeded = numBathrooms * 2.5; // ~2.5 GPM per bathroom
  const rec = sizing.recommended;

  return {
    waterQuality: report,
    sizing: {
      grainCapacityNeeded: sizing.needed,
      recommended: rec,
      hardnessGPG: hardness,
      people: numPeople,
      bathrooms: numBathrooms,
      dailyUsage: numPeople * 75,
      annualSaltBags: Math.round((sizing.needed / rec.grains) * 52 * 0.5), // ~0.5 bags per regen
      annualSaltCost: Math.round((sizing.needed / rec.grains) * 52 * 0.5 * 7), // ~$7/bag
    },
    pricing: {
      equipmentCost: rec.installLow * 0.35, // roughly 35% equipment, 65% labor/markup
      installRange: `$${rec.installLow.toLocaleString()} – $${rec.installHigh.toLocaleString()}`,
      estimatedMargin: `$${Math.round(rec.installLow * 0.55).toLocaleString()} – $${Math.round(rec.installHigh * 0.6).toLocaleString()}`,
      marginPercent: '55-60%'
    },
    roi: {
      annualSavingsForHomeowner: report.annualCost.avg,
      paybackMonths: Math.round((rec.installLow + rec.installHigh) / 2 / (report.annualCost.avg / 12)),
      fiveYearSavings: report.annualCost.avg * 5 - ((rec.installLow + rec.installHigh) / 2)
    },
    salesTalkingPoints: [
      `Your water in ${report.city} is ${report.hardness.level.toLowerCase()} at ${hardness} GPG — that's costing you roughly $${report.annualCost.avg.toLocaleString()}/year in damage and waste.`,
      `A ${rec.label} grain softener is the right size for ${numPeople} people and ${numBathrooms} bathrooms.`,
      `The system pays for itself in about ${Math.round((rec.installLow + rec.installHigh) / 2 / (report.annualCost.avg / 12))} months through savings on appliance life, soap, and plumbing repairs.`,
      `Over 5 years, you'll save approximately $${(report.annualCost.avg * 5).toLocaleString()} — minus the one-time install cost, that's $${Math.round(report.annualCost.avg * 5 - ((rec.installLow + rec.installHigh) / 2)).toLocaleString()} net savings.`,
      report.disinfection === 'chloramine'
        ? `I'd also recommend adding an RO system for drinking water — ${report.city} uses chloramine, which a standard filter can't remove.`
        : `For the best drinking water, pair this with an under-sink RO system — removes 95%+ of dissolved solids.`
    ]
  };
}
