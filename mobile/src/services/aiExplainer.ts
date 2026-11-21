/**
 * Automotive Technical Knowledge Engine (Mobile Edition)
 * Automatically generates professional, non-generic real-world explanations
 * for every automotive spare part, mechanical labor, oil, machining, or service task.
 * Helps vehicle owners clearly understand what the part/service actually does in real life.
 */

export const AUTOMOTIVE_DICTIONARY: Record<string, string> = {
  // Engine Oils & Lubricants
  'motul 15w50':
    'High-viscosity ester synthetic 4T lubricant: Forms an ultra-tough hydrodynamic film over pistons and transmission gears under high thermal stress, preventing oil breakdown and cylinder scoring.',
  'motul 10w40':
    'Premium multi-grade synthetic 4T lubricant: Delivers rapid oil pressure buildup during cold starts and high-temperature thermal shear resistance for smooth clutch and gear shifting.',
  'motul':
    'Premium 4T engine lubricant: Absorbs extreme combustion heat, cleans carbon varnish from internal galleries, and cushions high-RPM gear teeth to prevent metal-on-metal wear.',
  'engine oil':
    'Vital engine lubricant: Forms a protective hydrodynamic film between moving pistons, rings, and crankshaft bearings; absorbs combustion heat and prevents engine seizure.',
  'synthetic oil':
    '100% synthetic thermal-stable lubricant: Resists molecular shear degradation at high operating temperatures, ensuring constant oil pressure and extended component life.',
  'semi-synthetic':
    'Blended synthetic-mineral engine oil: Delivers balanced high-temperature piston crown protection and wet-clutch anti-slipping friction stabilization.',
  '4t oil':
    'Four-stroke integrated powertrain lubricant: Engineered to protect high-heat engine cylinders, multi-plate wet clutch friction, and high-torque transmission gears simultaneously.',
  'oil flush':
    'Chemical detergent purge: Dissolves baked sludge, lacquer, and carbon deposits from oil passages before fresh oil fill to maximize new lubricant efficiency.',

  // Filtration
  'oil filter':
    'High-efficiency filtration element: Continuously intercepts microscopic metallic shavings, combustion soot, and abrasive debris to ensure pure oil circulation to crankshaft journals.',
  'air filter':
    'Intake particulate barrier: Traps airborne sand, road dust, and abrasive grit before they enter intake valves, preventing catastrophic cylinder wall scoring and maintaining optimal air-fuel ratio.',
  'fuel filter':
    'Micro-pore fuel purifier: Removes water moisture, rust, and particulate dirt from gasoline before reaching injectors or carburetor jets to prevent fuel starvation and misfires.',
  'strainer':
    'Engine sump oil pickup strainer: Mesh screen that traps coarse carbon chips and sealant debris, preventing oil pump cavitation and oil starvation.',

  // Top End, Cylinder & Pistons
  'cylinder block':
    'Combustion pressure cylinder: High-precision alloy sleeve where fuel burns; honed with plateau cross-hatch to retain lubricating oil while withstanding 1,000+ PSI combustion pressure.',
  'piston kit':
    'Core power generator: Cast/forged alloy piston with compression and oil scraper rings; transfers explosive combustion force into mechanical crankshaft rotation.',
  'piston ring':
    'Precision compression & scraper rings: Upper ring seals explosive combustion gas in the cylinder chamber; lower scraper ring wipes excess oil to prevent exhaust blue smoke and oil burning.',
  'piston':
    'Thermal alloy piston: Receives downward combustion thrust; engineered with expansion clearances and low-friction skirt coating to maximize compression without cylinder scuffing.',
  'cylinder':
    'Engine cylinder barrel: Precision-bored combustion chamber that guides piston movement and transfers intense combustion heat into the cooling jackets.',

  // Valve Train & Camshaft
  'intake valve':
    'Combustion breathing valve: Opens precisely to draw fresh air-fuel mixture into the cylinder; seals airtight against the cylinder head during ignition stroke.',
  'exhaust valve':
    'Thermal exhaust gate: High-temperature stellite-faced poppet valve that releases 800°C burnt exhaust gases into the header pipe without warping or burning.',
  'valve set':
    'Matched intake & exhaust poppet valves: Ensures hermetic combustion chamber sealing, restoring compression, crisp throttle pickup, and stable idle RPM.',
  'valve guide':
    'Phosphor bronze guide sleeve: Directs valve stem motion in perfect alignment with valve seats; transfers valve heat away into the cylinder head casting.',
  'valve stem seal':
    'Viton high-temperature oil barrier: Fits over valve guides to prevent pressurized cylinder head oil from seeping into combustion chambers, eliminating smoke on acceleration.',
  'camshaft':
    'Precision timing shaft: Specially profiled lobes mechanically open and close intake and exhaust valves at exact crankshaft degree intervals to control engine breathing.',
  'rocker arm':
    'Hardened lever assembly: Transfers camshaft lobe lift directly to valve stems; features precision tappet clearance screws to maintain correct valve lash.',
  'tappet':
    'Valve lash adjusters: Calibrated to precise thousandths of a millimeter clearance to accommodate thermal metal expansion and ensure valves close 100% airtight.',

  // Timing & Drivetrain
  'timing chain':
    'Synchronous engine timing chain: Links crankshaft to overhead camshaft with zero slip, ensuring valves open and close at exact microsecond combustion intervals.',
  'cam chain':
    'High-tensile cam timing chain: Keeps camshaft and crankshaft in perfect mechanical synchronization, preventing disastrous valve-to-piston collisions.',
  'chain tensioner':
    'Automatic hydraulic/mechanical tensioner: Applies constant calibrated pressure against the timing chain guide to eliminate chain slack, slapping noise, and timing jump.',
  'timing guide':
    'Wear-resistant composite runner pad: Dampens high-frequency timing chain vibration and guides chain travel smoothly along the engine block.',
  'drive chain':
    'O-ring/X-ring primary drive chain: High-tensile steel rollers that transfer engine power from gearbox countershaft directly to the rear wheel with minimal power loss.',
  'sprocket':
    'Hardened steel drive sprockets: Front countershaft and rear wheel gear set; engineered pitch teeth ensure positive roller engagement without chain slipping or jerking.',
  'chain sprocket':
    'Complete final drive kit (chain & dual sprockets): Eliminates driveline slack, transmission snatching, and noisy power transfer under heavy acceleration.',

  // Gaskets, Seals & O-Rings
  'head gasket':
    'Multi-layer steel (MLS) head gasket: Seals high-pressure 1,000+ PSI combustion gases, pressurized oil passages, and coolant jackets between cylinder and cylinder head.',
  'base gasket':
    'Crankcase-to-cylinder interface gasket: Prevents pressurized crankcase oil mist and blow-by gases from leaking externally around the cylinder base.',
  'gasket kit':
    'Complete engine rebuild seal pack: Heat-resistant composite gaskets for head, base, clutch cover, and magneto cover to guarantee 100% leak-proof engine sealing.',
  'oil seal':
    'High-pressure viton oil seal: Spring-loaded elastomer lip that keeps pressurized engine oil contained around rotating shafts (crankshaft, countershaft, kick shaft).',

  // Machining & Precision Lathe Operations
  'lathe':
    'High-precision machine shop reconditioning: True-facing cylinder head to 0.02mm flatness, cutting 3-angle valve seats, and reaming bronze guides for hermetic combustion sealing.',
  'machining':
    'Computerized machine shop reconditioning: Precision cylinder bore honing, deck skimming, and valve seat concentricity cutting to restore factory tolerances.',
  'head facing':
    'Deck surface skimming: Removes micro-warpage from the cylinder head surface to ensure the head gasket clamps with uniform pressure, preventing blown gaskets.',
  'valve seating':
    '3-angle valve seat cutting & lapping: Precision-cuts seat angles in the combustion chamber to ensure 100% airtight valve sealing and maximum compression retention.',
  'bore':
    'Cylinder reboring & diamond cross-hatch honing: Enlarges worn cylinder walls to true cylindrical roundness and applies 45° cross-hatch for optimal piston ring oil retention.',
  'honing':
    'Plateau cylinder honing: Imparts micro-grooves that retain lubricating oil on cylinder walls, preventing ring scuffing during the initial engine run-in period.',

  // Brakes & Braking System
  'brake pad':
    'High-friction sintered/ceramic brake pads: Clamps hard against the brake rotor to convert kinetic vehicle energy into heat, delivering confident, fade-free stopping power.',
  'brake shoe':
    'Heavy-duty drum friction shoes: Expands outward against the wheel drum with high thermal resilience, ensuring reliable rear braking and hill-hold security.',
  'brake disc':
    'Drilled stainless steel rotor: Precision friction surface clamped by brake pads; cross-drilled holes dissipate heat and channel away water during wet braking.',
  'brake rotor':
    'High-grade ventilated brake rotor: True-spun to 0.01mm tolerance to eliminate brake lever pulsation, squealing, and steering judder during high-speed emergency stops.',
  'brake caliper':
    'Hydraulic clamping caliper: Houses hydraulic pistons that press brake pads firmly against the rotor upon master cylinder fluid pressure activation.',
  'caliper pin':
    'Stainless floating guide pins: Enables smooth floating movement of brake calipers across rotors; lubricated with synthetic silicone grease to prevent uneven pad taper wear.',
  'brake fluid':
    'DOT 4 high-boiling synthetic hydraulic fluid: Incompressible fluid that instantly transmits hand/foot lever pressure to calipers; resists vapor lock boiling up to 260°C.',
  'master cylinder':
    'Hydraulic pressure generator: Converts lever squeeze into high-pressure hydraulic fluid force; internal seals prevent pressure fade under heavy braking.',

  // Clutch & Transmission
  'clutch plate':
    'High-friction composite clutch plates: Alternates with steel plates in the clutch basket to engage and disengage engine power smoothly without clutch slippage under torque load.',
  'clutch friction':
    'Heat-resistant friction plates: Provides direct mechanical coupling between crankshaft and gearbox; prevents engine revving without vehicle acceleration.',
  'pressure plate':
    'Clutch diaphragm/pressure plate: Applies even spring clamp force across clutch disc pack, ensuring 100% torque transmission to the transmission input shaft.',
  'clutch cable':
    'Teflon-lined low-friction clutch cable: Delivers effortless lever action and precise clutch modulation without binding, snapping, or progressive lever stiffness.',

  // Suspension & Steering
  'fork oil':
    'Hydraulic suspension damping fluid: Controls fork compression and rebound speeds as the front wheel hits potholes, eliminating bouncy handling and bottoming out.',
  'fork seal':
    'Dual-lip fork oil & dust seal set: Retains pressurized damping fluid inside fork stanchions while scraping off road grit, preventing oil weeping onto front brake rotors.',
  'suspension':
    'Front & rear damping shock absorbers: Absorbs road undulations and maintains tire contact with the tarmac for cornering stability, traction, and rider comfort.',
  'shock absorber':
    'Nitrogen gas-charged hydraulic damper: Dampens chassis oscillation over uneven road surfaces; prevents chassis wallow and bottoming-out on road bumps.',
  'cone set':
    'Steering head taper roller bearing kit: Supports the triple clamp on the chassis frame; calibrated to zero-play preload for razor-sharp steering and zero handlebar wobble.',
  'steering bearing':
    'Precision steering stem race & balls: Provides smooth, low-effort steering navigation; eliminates front-end clunking over speed bumps and handlebar heaviness.',

  // Fuel System & Diagnostics
  'carburetor':
    'Fuel-air atomization mixer: Precision jets atomize liquid fuel into incoming air stream; ultrasonic cleaning clears gummed jets to restore smooth idling and brisk acceleration.',
  'throttle body':
    'Electronic fuel injection air metering valve: Regulates airflow into the intake manifold; ultrasonic decarb cleans sticky butterfly valves and TPS sensors for crisp throttle response.',
  'fuel injector':
    'High-pressure solenoid fuel injector: Sprays a micro-atomized fuel mist directly into intake port at 40+ PSI; cleaned in ultrasonic bath to restore perfect spray cone pattern.',
  'spark plug':
    'High-voltage ignition electrode: Ignites compressed air-fuel mixture with a 25,000-volt spark; iridium tip ensures instant cold starts, complete fuel burn, and zero misfires.',
  'fuel pump':
    'Submersible electric fuel pump: Delivers steady 3.5 bar fuel pressure from fuel tank to injector rail; prevents fuel starvation under full-throttle demand.',
  'obd':
    'Computerized OBD-II electronic diagnostic scan: Communicates with engine ECU to read live sensor parameters, clear error codes (DTC), and verify fuel trim calibration.',

  // Electrical, Battery & Charging
  'battery':
    'High-amperage VRLA/AGM power storage: Supplies 100+ cold cranking amps (CCA) to turn the starter motor effortlessly; powers electronic ignition, ECU, and digital instrument cluster.',
  'starter motor':
    'High-torque DC starter motor: Engages engine flywheel ring gear through starter bendix to crank the engine to starting RPM smoothly with one push of the starter button.',
  'relay':
    'Heavy-duty electromagnetic switch: Handles high-amperage current for starter motor, headlamps, and horn without overloading handlebar switch contacts.',
  'stator':
    'Magneto AC generator coil: Generates 3-phase alternating current from engine rotation to keep the 12V battery fully charged and power vehicle lighting.',
  'wiring':
    'Electrical wiring harness: Conducts power and digital signals across sensors, switches, and ECU; inspected for insulation wear, terminal corrosion, and short-circuit protection.',

  // Wheels, Tires & Bearings
  'wheel bearing':
    'Deep-groove high-speed ball bearing: Supports vehicle weight on axles with virtually zero friction; sealed against water and dust to prevent wheel wobble and rumble noise.',
  'tire':
    'High-traction rubber tyre: Provides critical adhesion contact patch with the road surface, channels away water in rain, and guarantees short emergency braking distance.',
  'tyre':
    'High-traction rubber tyre: Engineered tread compound ensures maximum cornering grip, wet-weather water dispersion, and high-speed directional stability.',
  'tube':
    'Heavy-duty butyl rubber inner tube: Retains pneumatic air pressure reliably inside spoke wheels; resists pinch flats and road punctures.',

  // Cooling & Exhaust
  'coolant':
    'Long-life ethylene glycol heat-transfer fluid: Circulates through engine water jackets to absorb combustion heat and transfer it to radiator fins; prevents boil-over and freezing.',
  'radiator':
    'Aluminum heat-exchanger core: Dissipates engine coolant heat into ambient airflow; flushed to clear internal mineral scale and fin blockage for cool engine operation.',
  'exhaust':
    'Stainless steel exhaust header & silencer: Channels hot exhaust gases away from the engine, suppresses exhaust noise with acoustic baffling, and maintains back-pressure.',

  // Labor & Professional Mechanical Operations
  'engine teardown':
    'Certified master technician labor: Complete bench disassembly, chemical carbon degreasing, micrometric tolerance inspection, precision reassembly, and torque torquing to OEM specs.',
  'overhaul':
    'Complete powertrain mechanical overhaul: Teardown, dimensional wear inspection, component replacement, valve lash setup, timing synchronization, and dynamic road testing.',
  'rebuild':
    'Precision engine rebuild labor: Bench assembly of new cylinder, piston, valves, and seals; torque-wrench tightening, fluid priming, run-in calibration, and dyno road test.',
  'labour':
    'Professional workshop mechanical labor: Skilled component removal, precision installation, fastener torquing to manufacturer specifications, and safety road validation.',
  'labor':
    'Certified mechanic execution: Disassembly, inspection, precision replacement of parts, safety torque checks, and multi-point road validation.',
  'service':
    'Comprehensive 32-point periodic service: Engine oil change, filter replacement, spark plug check, brake cleaning, chain slack adjustment, fastener torquing, and road safety check.',
  'general service':
    'Complete workshop maintenance: Comprehensive multi-point vehicle inspection, brake shoe cleaning, chain cleaning & lubing, cable lubrication, and dynamic road testing.',
  'wash':
    'Detailing & wash: High-pressure foam degreasing, road mud removal, chain cleaning, and protective silicone shine application.',
  'decarb':
    'Combustion chamber decarbonization: Chemical cleaning of baked carbon deposits from piston crowns, valve faces, and exhaust ports to eliminate pre-ignition knocking.',
};

export function getAutomotiveTechnicalExplanation(itemName: string): string {
  const clean = (itemName || '').toLowerCase().trim();
  if (!clean) return 'Certified workshop execution & precision automotive servicing';

  const sortedKeys = Object.keys(AUTOMOTIVE_DICTIONARY).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeys) {
    if (clean.includes(keyword)) {
      return AUTOMOTIVE_DICTIONARY[keyword];
    }
  }

  if (clean.includes('oil') || clean.includes('lubricant') || clean.includes('lube')) {
    return 'Critical powertrain fluid: Reduces metal friction, cushions high-load gears, and dissipates combustion heat to prevent engine seizure.';
  }

  if (clean.includes('filter') || clean.includes('element')) {
    return 'High-efficiency particulate barrier: Traps microscopic contaminants, carbon soot, and dust to ensure pure fluid/air flow and protect internal components.';
  }

  if (clean.includes('brake') || clean.includes('pad') || clean.includes('shoe') || clean.includes('disc') || clean.includes('rotor')) {
    return 'Critical safety system: Delivers controlled friction against the wheel rotor/drum to convert vehicle kinetic energy into safe, fade-free stopping power.';
  }

  if (clean.includes('clutch') || clean.includes('gear') || clean.includes('transmission')) {
    return 'Powertrain coupling: Enables seamless torque transfer from the engine to the transmission without slipping under acceleration or hill climbs.';
  }

  if (clean.includes('chain') || clean.includes('sprocket') || clean.includes('belt')) {
    return 'Final drive mechanism: Transfers rotational torque from engine output shaft directly to the rear wheel with zero slip and smooth throttle response.';
  }

  if (clean.includes('fork') || clean.includes('shock') || clean.includes('suspension')) {
    return 'Hydraulic damping system: Absorbs road undulations and keeps tires firmly planted for cornering grip, stability, and rider comfort.';
  }

  if (clean.includes('battery') || clean.includes('spark') || clean.includes('wire') || clean.includes('electrical')) {
    return 'High-performance ignition & electrical: Delivers dependable electric current for starter cranking, clean fuel combustion, and stable onboard electronics.';
  }

  if (clean.includes('lathe') || clean.includes('machin') || clean.includes('bore') || clean.includes('facing')) {
    return 'Precision machine reconditioning: Restores micrometer-flat mating surfaces and true cylindrical tolerances to guarantee 100% airtight compression.';
  }

  if (clean.includes('clean') || clean.includes('wash') || clean.includes('decarb') || clean.includes('flush')) {
    return 'Chemical decarbonization & solvent wash: Clears baked carbon varnish and grime to restore original fluid flow, smooth idling, and clean combustion.';
  }

  if (clean.includes('check') || clean.includes('inspect') || clean.includes('tune') || clean.includes('diagnos')) {
    return 'Multi-point safety inspection & tuning: Validates mechanical tolerances, sensor parameters, and fastener torques against factory engineering standards.';
  }

  if (clean.includes('overhaul') || clean.includes('rebuild') || clean.includes('teardown') || clean.includes('labour') || clean.includes('labor')) {
    return 'Master mechanic workshop labor: Precision component disassembly, tolerance clearance measurement, OEM-spec torque tightening, and dynamic road testing.';
  }

  return 'OEM-grade replacement part: Precision workshop fitment, calibrated torque tightening, and operational safety verification.';
}
