/**
 * Automotive Technical Knowledge & Gemini AI Explainer Engine
 * Automatically generates professional SOW (Scope of Work) technical breakdowns
 * for any automotive spare part, mechanical work, machining, or service task.
 */

interface ExplainOptions {
  vehicleModel?: string;
  serviceCategory?: string;
}

// Built-in high-precision automotive technical dictionary
const AUTOMOTIVE_DICTIONARY: Record<string, string> = {
  // Engine Top End & Rebuild
  cylinder: 'Top End Core: OEM cylinder block, piston, rings, pin & circlips assembly',
  piston: 'Top End Core: Precision-matched forged/cast piston with compression & oil scraper rings',
  valve: 'Top End Core: Intake & exhaust valves, viton stem seals & bronze guide set',
  camshaft: 'Top End Core: Performance camshaft & roller rocker arm pair replacement',
  rocker: 'Top End Core: Hardened rocker arm & tappet adjuster screw set',
  timing: 'Top End Core: Cam timing chain, guide runner, tensioner pad & auto-tensioner',
  chain: 'Drivetrain: O-ring/X-ring drive chain, hardened front countershaft & rear alloy sprocket replacement',
  sprocket: 'Drivetrain: Front countershaft sprocket & high-tensile rear drive sprocket set',
  gasket: 'Consumables: Cylinder head, base gasket, O-rings & high-temp engine sealant',
  seal: 'Consumables: High-temperature viton oil seals, rubber grommets & manifold O-rings',
  oil: 'Consumables: Premium fully synthetic 4T engine oil, drain plug washer & flush',
  filter: 'Consumables: High-flow oil filter element, O-ring seal & magnetic sump plug cleaning',
  spark: 'Ignition: Laser iridium / nickel spark plug with calibrated electrode gap',
  plug: 'Ignition: Laser iridium / nickel spark plug with calibrated electrode gap',

  // Machining & Labour
  lathe: 'Machining: Precision cylinder head facing, valve seat angle cutting & guide reaming',
  machining: 'Machining: CNC cylinder bore honing, valve guide pressing & deck surface skimming',
  bore: 'Machining: Precision cylinder reboring to next oversize with plateau cross-hatch honing',
  facing: 'Machining: Precision head facing to restore true flatness and optimal combustion sealing',
  labour: 'Labour: Engine top end teardown, decarb, precision assembly, valve lash setup & road test',
  labor: 'Labour: Engine teardown, chemical decarb, precision assembly, torque checks & road test',
  mechanic: 'Labour: Certified technician bench teardown, precision fitment, valve lash & test run',

  // Brakes & Safety
  brake: 'Braking System: Sintered brake pads, rotor caliper pin greasing & disc skim facing',
  pad: 'Braking System: High-friction semi-metallic / ceramic brake pads & anti-rattle shims',
  disc: 'Braking System: Stainless steel drilled brake rotor skim facing & caliper overhaul',
  caliper: 'Braking System: Hydraulic caliper piston rebuild, dual square seals & bleed port service',
  fluid: 'Hydraulics: DOT 4 high-temperature synthetic brake fluid complete line flush & bleed',

  // Clutch & Transmission
  clutch: 'Transmission Core: Heavy-duty friction plates, steel drive plates & damper springs kit',
  pressure: 'Transmission: Hardened pressure plate, clutch lifter bearing & release rod assembly',
  gear: 'Gearbox: Shift fork alignment, dog-engagement gear inspection & selector drum timing',
  cable: 'Controls: Teflon-lined inner clutch cable with weather-sealed rubber boot',

  // Suspension & Steering
  fork: 'Suspension: High-viscosity fork oil, dual-lip oil seals, dust wipers & damping rod flush',
  suspension: 'Suspension: Damping rate tuning, preload adjustment & linkage bearing repacking',
  shock: 'Suspension: Nitrogen gas-charged rear monoshock inspection & rebound tuning',
  cone: 'Steering: Tapered roller cone set bearings, races & race-face greasing with zero-play torque',
  handle: 'Controls: Handlebar clamp alignment, switchgear inspection & throttle tube lube',

  // Electrical & Diagnostics
  battery: 'Electrical: High-capacity VRLA/MF AGM battery with terminal corrosion barrier',
  wiring: 'Electrical: Complete wiring harness continuity test, waterproof relay & fuse inspection',
  efi: 'Diagnostics: Full OBD-II EFI scan, DTC error clearing, throttle body sensor calibration',
  scan: 'Diagnostics: Full computerized OBD-II scan, real-time sensor parameters & fault code reset',
  throttle: 'Fuel System: Ultrasonic throttle body cleaning, stepper motor calibration, idle air reset',
  injector: 'Fuel System: High-pressure fuel injector ultrasonic sonic bath & spray pattern flow test',
  carburetor: 'Fuel System: Complete carburetor jet decarb, float height calibration & sync',

  // Bearings, Wheels & Chassis
  bearing: 'Chassis & Wheels: Deep-groove high-speed ball bearings, dust seals & high-temp lithium grease',
  wheel: 'Chassis: Wheel rim truing, spoke tension balancing, hub bearing inspection & seal replacement',
  tire: 'Wheels & Traction: High-traction tubeless tyre fitment, dynamic wheel balancing & rim bead seating',
  tyre: 'Wheels & Traction: High-traction tubeless tyre fitment, dynamic wheel balancing & rim bead seating',
  tube: 'Wheels & Traction: Heavy-duty butyl rubber inner tube & rim band protector replacement',
  swingarm: 'Suspension & Chassis: Swingarm needle roller bearing/bushing repacking, pivot shaft torque',
  bush: 'Suspension & Chassis: Heavy-duty polyurethane / bronze pivot bushing fitment & alignment',
  bushing: 'Suspension & Chassis: Precision swingarm / suspension linkage bushing set replacement',

  // Controls & Lever
  lever: 'Controls: Ergonomic forged clutch/brake lever replacement, pivot pin cleaning & dry-lube',
  mirror: 'Body & Safety: Vibration-dampened convex rearview mirror assembly & thread lock mount',
  handlebar: 'Controls: High-tensile handlebar alignment, triple-tree clamping & bar-end vibration damping',
  accelerator: 'Controls: Dual push-pull throttle cable set with low-friction liner & cable lube',

  // Cooling & Exhaust
  radiator: 'Cooling: Radiator core fin straightening, high-pressure backflush & pressure cap seal check',
  hose: 'Cooling: Reinforced high-temperature silicone coolant hose set & stainless worm clamp kit',
  exhaust: 'Exhaust: Stainless steel header pipe decarb, exhaust manifold copper crush gasket & seal',
  silencer: 'Exhaust: Glasswool baffle repacking, exhaust collar clamp & heat shield fitment',

  // Routine & Maintenance
  service: 'Routine Maintenance: Comprehensive 32-point inspection, lube points, fastener torquing & wash',
  general: 'General Maintenance: Comprehensive multi-point check, fluid top-ups, chain adjustment & wash',
  coolant: 'Cooling: Long-life ethylene glycol anti-freeze drain, radiator core backflush & bleed',
  hardware: 'Consumables: Ultrasonic cleaning degreasers, threadlocker, copper washers & buffer hardware',
  degreaser: 'Consumables: Industrial chemical degreasers, carbon solvent & ultrasonic tank wash',
  wash: 'Detailing: High-pressure foam wash, degreasing treatment & protective silicone polish',
};

/**
 * Intelligent local automotive semantic matcher.
 * Matches keywords and automotive context to return an exact, high-end technical SOW breakdown.
 */
export function getAutomotiveTechnicalExplanation(
  itemName: string,
  options?: ExplainOptions
): string {
  const clean = (itemName || '').toLowerCase().trim();
  if (!clean) return 'Certified workshop execution & precision automotive servicing';

  // Check dictionary keys
  for (const [keyword, explanation] of Object.entries(AUTOMOTIVE_DICTIONARY)) {
    if (clean.includes(keyword)) {
      return explanation;
    }
  }

  // Dynamic context generation
  if (clean.includes('clean') || clean.includes('wash') || clean.includes('flush')) {
    return 'Chemical decarb, ultrasonic solvent tank bath & high-pressure fluid flush';
  }

  if (clean.includes('check') || clean.includes('inspect') || clean.includes('tune')) {
    return 'Precision multi-point diagnostic inspection, tolerance check & calibrated bench setup';
  }

  if (clean.includes('overhaul') || clean.includes('rebuild')) {
    return 'Complete mechanical teardown, component wear inspection, tolerance rebuild & road test';
  }

  return 'OEM replacement part, precision workshop fitment & calibrated torque inspection';
}

/**
 * Calls Gemini AI if GEMINI_API_KEY is available in environment;
 * otherwise gracefully falls back to the automotive knowledge engine.
 */
export async function generateAiExplanations(
  items: string[],
  options?: ExplainOptions
): Promise<Record<string, string>> {
  const apiKey = process.env.GEMINI_API_KEY;
  const results: Record<string, string> = {};

  // Try Gemini AI if API key is configured
  if (apiKey && items.length > 0) {
    try {
      const prompt = `You are a master motorcycle and automobile master technician writing a high-end Scope of Work (SOW) bill.
For each automotive service or spare part listed below, provide an exact 1-line professional technical explanation describing what that work or spare part does (in the style of: "<Category>: <exact mechanical processes, components, or specifications>").

Vehicle context: ${options?.vehicleModel || 'Motorcycle / Automobile'}
Service Type: ${options?.serviceCategory || 'Engine Rebuild & General Servicing'}

Items:
${items.map((it, idx) => `${idx + 1}. ${it}`).join('\n')}

Format your response strictly as valid JSON mapping item names to their 1-line explanation:
{
  "ITEM_NAME": "Category: Explanation"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            const cleanJson = text.replace(/```(?:json)?/gi, '').trim();
            const parsed = JSON.parse(cleanJson);
            for (const item of items) {
              const matchedKey = Object.keys(parsed).find(
                (k) => k.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(k.toLowerCase())
              );
              if (matchedKey && parsed[matchedKey]) {
                results[item] = parsed[matchedKey];
              }
            }
          } catch (jsonErr) {
            console.warn('Failed to parse Gemini explanation JSON:', jsonErr);
          }
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local automotive engine:', err);
    }
  }

  // Fill in any missing items using local automotive technical dictionary
  for (const item of items) {
    if (!results[item]) {
      results[item] = getAutomotiveTechnicalExplanation(item, options);
    }
  }

  return results;
}

export interface DraftedBillItem {
  description: string;
  details: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DraftedBillResult {
  vehicleModel?: string;
  serviceType?: string;
  items: DraftedBillItem[];
}

/**
 * Automatically creates an entire SOW bill with items, rates, and technical explanations
 * from a mechanic's prompt, rough job card notes, or service description using Gemini AI.
 */
export async function draftBillFromPrompt(
  prompt: string,
  context?: { vehicleModel?: string; serviceType?: string }
): Promise<DraftedBillResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const cleanPrompt = (prompt || '').trim();

  if (apiKey && cleanPrompt) {
    try {
      const aiPrompt = `You are a master motorcycle and automobile workshop billing specialist.
Given the mechanic's service notes or job prompt:
"${cleanPrompt}"

Vehicle Model Context: ${context?.vehicleModel || 'Motorcycle / Automobile'}
Service Type Context: ${context?.serviceType || 'Engine Rebuild / Major Service'}

Create a complete itemized Scope of Work (SOW) bill.
For EVERY single work item or spare part:
1. "description": Component or service name in clean UPPERCASE (e.g. "CYLINDER BLOCK & PISTON KIT (OEM)")
2. "details": 1-line professional technical explanation describing what that work or spare part does (e.g. "Top End Core: OEM cylinder block, piston, rings, pin & circlips assembly")
3. "quantity": integer (usually 1, 2, or standard quantity)
4. "unitPrice": realistic market price in Indian Rupees (INR)
5. "total": quantity * unitPrice

Return strictly a JSON object formatted as:
{
  "vehicleModel": "${context?.vehicleModel || 'Motorcycle'}",
  "serviceType": "Scope of Work Service",
  "items": [
    {
      "description": "ITEM NAME",
      "details": "Technical breakdown of work/spare",
      "quantity": 1,
      "unitPrice": 4500,
      "total": 4500
    }
  ]
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: aiPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            const cleanJson = text.replace(/```(?:json)?/gi, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed.items) && parsed.items.length > 0) {
              return {
                vehicleModel: parsed.vehicleModel || context?.vehicleModel || 'Vehicle Service',
                serviceType: parsed.serviceType || context?.serviceType || 'Half Engine Rebuild',
                items: parsed.items.map((it: any) => ({
                  description: String(it.description || 'Service Work').toUpperCase(),
                  details: it.details || getAutomotiveTechnicalExplanation(it.description),
                  quantity: Number(it.quantity) || 1,
                  unitPrice: Number(it.unitPrice) || 0,
                  total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
                })),
              };
            }
          } catch (jsonErr) {
            console.warn('Failed to parse Gemini draft JSON output:', jsonErr);
          }
        }
      }
    } catch (err) {
      console.warn('Gemini draftBillFromPrompt failed, using intelligent template engine:', err);
    }
  }

  // Intelligent fallback: parse user lines or match engine rebuild template
  const lower = cleanPrompt.toLowerCase();

  // If user provided bullet points or line-by-line items
  const lines = cleanPrompt
    .split(/\n|,|;/)
    .map((l) => l.replace(/^[\d\s.\-*•]+/, '').trim())
    .filter((l) => l.length > 2);

  if (lines.length >= 2) {
    const items: DraftedBillItem[] = lines.map((line) => {
      // Check if price is at the end (e.g. "Cylinder block 4500" or "Lathe work Rs 1200")
      const priceMatch = line.match(/(?:rs\.?|inr|₹)?\s*(\d{2,6})\s*$/i);
      const unitPrice = priceMatch ? Number(priceMatch[1]) : 850;
      const cleanDesc = line.replace(/(?:rs\.?|inr|₹)?\s*\d{2,6}\s*$/i, '').trim() || line;
      return {
        description: cleanDesc.toUpperCase(),
        details: getAutomotiveTechnicalExplanation(cleanDesc),
        quantity: 1,
        unitPrice,
        total: unitPrice,
      };
    });

    return {
      vehicleModel: context?.vehicleModel || 'Royal Enfield Himalayan 411',
      serviceType: context?.serviceType || 'Half Engine Rebuild',
      items,
    };
  }

  // Engine Rebuild standard high-end SOW package
  if (lower.includes('engine') || lower.includes('rebuild') || lower.includes('himalayan') || lower.includes('overhaul') || lower.includes('bore') || lower.includes('piston')) {
    return {
      vehicleModel: context?.vehicleModel || 'Royal Enfield Himalayan 411',
      serviceType: 'Half Engine Rebuild & Top End Blueprinting',
      items: [
        {
          description: 'CYLINDER BLOCK & PISTON KIT (OEM)',
          details: 'Top End Core: OEM cylinder block, piston, rings, pin & circlips assembly',
          quantity: 1,
          unitPrice: 5850,
          total: 5850,
        },
        {
          description: 'LATHE / HEAD FACING / VALVE GUIDE & SEATING',
          details: 'Machining: Precision cylinder head facing, valve seat angle cutting & guide reaming',
          quantity: 1,
          unitPrice: 1450,
          total: 1450,
        },
        {
          description: 'INTAKE & EXHAUST VALVE SET (OEM)',
          details: 'Top End Core: Intake & exhaust valves, viton stem seals & bronze guide set',
          quantity: 1,
          unitPrice: 950,
          total: 950,
        },
        {
          description: 'ENGINE GASKET & SEAL KIT (FULL TOP END)',
          details: 'Consumables: Cylinder head, base gasket, O-rings & high-temp engine sealant',
          quantity: 1,
          unitPrice: 780,
          total: 780,
        },
        {
          description: 'MOTUL 3100 15W50 SEMI-SYNTHETIC ENGINE OIL (2L)',
          details: 'Consumables: Premium 4T engine oil, drain plug washer & chemical engine flush',
          quantity: 2,
          unitPrice: 550,
          total: 1100,
        },
        {
          description: 'ENGINE OIL FILTER ELEMENT',
          details: 'Consumables: High-flow oil filter element, O-ring seal & sump plug cleaning',
          quantity: 1,
          unitPrice: 180,
          total: 180,
        },
        {
          description: 'ENGINE TEARDOWN, CLEANING, DECARB & REBUILD LABOUR',
          details: 'Labour: Certified technician bench teardown, precision fitment, valve lash & test run',
          quantity: 1,
          unitPrice: 2800,
          total: 2800,
        },
        {
          description: 'POST-REBUILD TUNING & ROAD TESTING DINO RUN',
          details: 'Diagnostics: Full OBD-II scan, thermal cycle monitoring & road test validation',
          quantity: 1,
          unitPrice: 450,
          total: 450,
        },
      ],
    };
  }

  // Routine Service & Maintenance package
  return {
    vehicleModel: context?.vehicleModel || 'Motorcycle / Scooter',
    serviceType: 'Comprehensive Periodic Maintenance',
    items: [
      {
        description: 'PREMIUM FULLY SYNTHETIC 4T ENGINE OIL',
        details: 'Consumables: Premium fully synthetic 4T engine oil, drain plug washer & flush',
        quantity: 1,
        unitPrice: 850,
        total: 850,
      },
      {
        description: 'HIGH-FLOW OIL FILTER ELEMENT',
        details: 'Consumables: High-flow oil filter element, O-ring seal & magnetic sump plug cleaning',
        quantity: 1,
        unitPrice: 160,
        total: 160,
      },
      {
        description: 'CERAMIC FRONT & REAR BRAKE PADS OVERHAUL',
        details: 'Braking System: Sintered brake pads, rotor caliper pin greasing & disc skim facing',
        quantity: 1,
        unitPrice: 750,
        total: 750,
      },
      {
        description: 'LASER IRIDIUM SPARK PLUG',
        details: 'Ignition: Laser iridium / nickel spark plug with calibrated electrode gap',
        quantity: 1,
        unitPrice: 320,
        total: 320,
      },
      {
        description: '32-POINT GENERAL INSPECTION, LUBRICATION & LABOUR',
        details: 'Labour: Complete 32-point inspection, chain slack adjustment, fastener torquing & wash',
        quantity: 1,
        unitPrice: 950,
        total: 950,
      },
    ],
  };
}
