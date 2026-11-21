/**
 * Official Authorised Signatory Digital Signature Engine
 * Generates an authentic cursive handwritten signature for "Samael Morningstar"
 * styled after genuine master-calligrapher signatures with sweeping ascenders,
 * fluid baseline cursive loops, and dynamic underline flourish.
 */

// Elegant calligraphic SVG vector signature for Samael Morningstar
export const SAMAEL_SIGNATURE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 160" width="500" height="160">
  <defs>
    <filter id="ink-bleed" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="0.4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <g fill="none" stroke="#0F172A" stroke-linecap="round" stroke-linejoin="round" filter="url(#ink-bleed)">
    <!-- Capital 'S' - Sweeping tall ascender loop, deep downward stroke, and graceful return loop -->
    <path d="M 58 68 C 50 42, 65 14, 88 16 C 104 18, 110 36, 96 56 C 76 84, 46 104, 52 118 C 58 130, 80 126, 98 114" stroke-width="3.2" />
    <path d="M 98 114 C 104 110, 110 102, 116 88" stroke-width="2.6" />
    
    <!-- 'a' -->
    <path d="M 116 88 C 112 80, 122 74, 128 82 C 134 90, 132 104, 124 105 C 117 106, 116 94, 124 86 C 128 82, 134 84, 136 94 L 138 104 C 139 107, 142 108, 146 102" stroke-width="2.4" />
    
    <!-- 'm' -->
    <path d="M 146 102 C 150 90, 154 82, 158 82 C 163 82, 164 96, 166 104 C 170 91, 175 82, 180 82 C 185 82, 187 95, 188 104 C 190 106, 194 107, 198 98" stroke-width="2.4" />
    
    <!-- 'a' -->
    <path d="M 198 98 C 195 86, 204 80, 209 85 C 214 90, 212 103, 205 104 C 200 105, 199 94, 205 87 C 209 82, 213 85, 215 95 L 216 104 C 218 107, 221 108, 225 99" stroke-width="2.4" />
    
    <!-- 'e' -->
    <path d="M 225 99 C 227 92, 230 84, 236 84 C 242 84, 241 93, 235 97 C 227 102, 230 107, 237 105 C 242 104, 245 101, 248 95" stroke-width="2.4" />
    
    <!-- 'l' - Tall fluid cursive loop -->
    <path d="M 248 95 C 255 78, 266 40, 271 28 C 275 20, 279 24, 276 36 C 271 58, 260 92, 263 103 C 265 108, 271 107, 278 98" stroke-width="2.8" />

    <!-- Connecting air-stroke to Capital 'M' -->
    <!-- Capital 'M' - Majestic sweeping initial flourish, sharp peaks, deep valley -->
    <path d="M 288 78 C 295 56, 305 32, 312 22 C 316 16, 321 21, 319 32 C 314 55, 304 90, 307 104 C 310 110, 315 105, 322 86 C 328 68, 335 48, 342 45 C 347 43, 349 52, 347 64 C 343 82, 338 98, 342 104 C 345 108, 350 102, 356 86 C 361 72, 368 56, 374 54 C 379 52, 381 60, 378 74 C 374 91, 371 102, 376 105 C 380 106, 386 100, 391 92" stroke-width="3.0" />

    <!-- 'o' & 'r' -->
    <path d="M 391 92 C 389 84, 394 79, 399 82 C 404 85, 404 95, 399 101 C 395 104, 393 96, 398 90 C 402 85, 408 84, 412 88 C 416 92, 417 99, 419 104" stroke-width="2.3" />

    <!-- 'n' -->
    <path d="M 419 104 C 423 93, 427 84, 431 84 C 435 84, 436 94, 438 104 C 441 106, 444 105, 448 97" stroke-width="2.3" />

    <!-- 'i', 'n', 'g' -->
    <path d="M 448 97 L 452 104 C 455 93, 459 86, 462 86 C 466 86, 467 95, 468 104 C 471 94, 477 86, 482 89 C 486 92, 485 101, 480 107 C 474 114, 471 126, 473 134 C 475 139, 480 138, 484 130" stroke-width="2.3" />
    <!-- dot for 'i' -->
    <circle cx="451" cy="74" r="1.6" fill="#0F172A" />

    <!-- 'star' condensed signature tail flourish -->
    <path d="M 484 100 C 487 90, 492 84, 496 86 C 499 88, 498 98, 495 103 C 492 108, 497 108, 502 98 L 505 88 L 507 103 C 509 106, 513 103, 518 94" stroke-width="2.4" />
    <path d="M 491 93 L 509 91" stroke-width="1.8" /> <!-- t-cross -->

    <!-- Dynamic calligraphic underline flourish with terminal taper and accent dot (matching reference image) -->
    <path d="M 52 136 C 110 138, 220 142, 330 137 C 390 134, 450 128, 505 118" stroke-width="3.0" />
    <path d="M 505 118 C 516 116, 524 113, 528 109" stroke-width="1.8" />
    <circle cx="536" cy="107" r="2.8" fill="#0F172A" />
  </g>
</svg>`;

// Convert SVG to clean Base64 Data URL for universal embedding in web, mobile, and jsPDF
export function getSignatureSvgDataUrl(): string {
  if (typeof btoa !== 'undefined') {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(SAMAEL_SIGNATURE_SVG)))}`;
  }
  return `data:image/svg+xml;base64,${Buffer.from(SAMAEL_SIGNATURE_SVG).toString('base64')}`;
}

/**
 * Draws the authentic cursive signature into a jsPDF document instance
 * using vector strokes matching the reference calligraphy.
 */
export function drawSamaelCursiveSignature(
  doc: any,
  x: number,
  y: number,
  scale: number = 0.28
): void {
  // Save previous styles
  doc.saveGraphicsState && doc.saveGraphicsState();

  // Dark slate ink tone (#0F172A)
  doc.setDrawColor(15, 23, 42);
  doc.setFillColor(15, 23, 42);

  // Helper coordinate transformer
  const tx = (px: number) => x + px * scale;
  const ty = (py: number) => y + py * scale;

  // 1. Capital 'S' - Sweeping tall ascender loop, deep downward stroke, and graceful return loop
  doc.setLineWidth(0.85);
  doc.lines(
    [
      [-2.2, -6.5],
      [4.2, -7.0],
      [6.0, 5.5],
      [-5.5, 7.8],
      [-8.2, 7.8],
      [1.6, 3.8],
      [7.8, -1.1],
      [5.0, -3.4],
    ],
    tx(58),
    ty(68)
  );

  // 2. 'amael' - Fluid interconnected cursive letters
  doc.setLineWidth(0.65);
  doc.lines(
    [
      [3.2, -1.8],
      [2.2, 3.4],
      [-2.4, 3.8],
      [-1.8, -3.2],
      [3.2, -2.4],
      [1.2, 5.0],
      [2.4, -0.6], // 'a'
      [1.2, -3.4],
      [1.8, 3.4],
      [1.2, -3.4],
      [1.8, 3.4],
      [2.4, -0.6], // 'm'
      [1.2, -3.4],
      [2.4, 3.4],
      [-2.4, 3.4],
      [-1.2, -3.2],
      [3.4, -2.4],
      [1.2, 5.0], // 'a'
      [2.8, -2.2],
      [-2.4, 2.2],
      [3.4, 2.0], // 'e'
      [3.0, -5.2],
      [3.2, -10.5],
      [1.8, 3.4],
      [-1.4, 9.8],
      [-1.8, 9.5],
      [3.8, 0.4], // 'l'
    ],
    tx(116),
    ty(88)
  );

  // 3. Capital 'M' - Expressive peaks and fluid valleys
  doc.setLineWidth(0.8);
  doc.lines(
    [
      [2.2, -6.2],
      [3.2, -6.8],
      [2.0, 3.4],
      [-1.4, 9.8],
      [-1.0, 9.8],
      [4.2, -5.2],
      [3.8, -5.5],
      [1.8, 3.4],
      [-1.4, 9.8],
      [4.2, -5.2],
      [3.8, -5.5],
      [1.8, 3.4],
      [-1.4, 9.8],
      [3.8, 0.4],
    ],
    tx(300),
    ty(78)
  );

  // 4. 'orningstar' fluid cursive script
  doc.setLineWidth(0.6);
  doc.lines(
    [
      [1.4, -2.4],
      [1.8, 2.4],
      [-1.8, 2.4],
      [1.8, -2.4],
      [2.8, 1.4], // 'o'
      [1.2, 3.2],
      [1.8, -3.2],
      [1.4, 3.2], // 'r'
      [1.4, -3.2],
      [1.4, 3.2],
      [1.4, -3.2],
      [1.4, 3.2], // 'n'
      [1.2, -3.2],
      [1.2, 3.2], // 'i'
      [1.4, -3.2],
      [1.4, 3.2], // 'n'
      [1.8, -2.4],
      [-1.8, 2.4],
      [0.0, 6.2],
      [-2.4, 3.2],
      [4.2, -2.4], // 'g'
      [2.8, -4.2],
      [-1.8, 2.4],
      [3.2, 1.8], // 's'
      [0.0, -5.2],
      [0.0, 5.2], // 't'
      [2.2, -2.4],
      [-1.8, 2.4],
      [2.4, 0.0], // 'a'
      [1.4, -2.4],
      [1.8, 2.4], // 'r'
    ],
    tx(390),
    ty(92)
  );

  // Cross 't' and dot 'i'
  doc.setLineWidth(0.45);
  doc.line(tx(491), ty(93), tx(509), ty(91));
  doc.circle(tx(451), ty(74), 0.45, 'F');

  // 5. Dynamic calligraphic underline flourish with terminal taper and accent dot
  doc.setLineWidth(0.85);
  doc.lines(
    [
      [16.0, 0.6],
      [32.0, 1.2],
      [32.0, -1.4],
      [18.0, -2.8],
      [16.0, -2.4],
      [6.0, -1.2],
    ],
    tx(52),
    ty(136)
  );

  // Terminal accent dot
  doc.circle(tx(536), ty(107), 0.75, 'F');

  // Restore graphics state
  doc.restoreGraphicsState && doc.restoreGraphicsState();
}
