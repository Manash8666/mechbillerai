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
          const parsed = JSON.parse(text);
          for (const item of items) {
            // Find matched key
            const matchedKey = Object.keys(parsed).find(
              (k) => k.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(k.toLowerCase())
            );
            if (matchedKey && parsed[matchedKey]) {
              results[item] = parsed[matchedKey];
            }
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
