/**
 * Generates clear, high-resolution study note images as Data URLs using HTML Canvas.
 * This guarantees reliable test images for desktop testing and one-tap demos without external network dependencies.
 */

export interface SampleNote {
  id: string;
  titleKey: 'sample1Title' | 'sample2Title' | 'sample3Title' | 'sample4Title';
  category: string;
  defaultLang: 'en' | 'es';
  generator: () => string;
}

function createNoteCanvas(
  title: string,
  subtitle: string,
  sections: Array<{ heading: string; lines: string[]; isCodeOrMath?: boolean }>,
  theme: { bg: string; line: string; ink: string; accent: string; paperLines?: boolean }
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - realistic paper texture
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Optional notebook ruled lines
  if (theme.paperLines) {
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1.2;
    for (let y = 140; y < canvas.height - 40; y += 38) {
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(canvas.width - 60, y);
      ctx.stroke();
    }

    // Left margin line (red/pink binder margin)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, 0);
    ctx.lineTo(140, canvas.height);
    ctx.stroke();
  }

  // Header Title
  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(title, 160, 90);

  // Subtitle / Date
  ctx.fillStyle = '#64748b';
  ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(subtitle, 160, 125);

  let currentY = 180;

  sections.forEach((sec) => {
    // Section header
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(sec.heading, 160, currentY);
    currentY += 34;

    // Underline
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(160, currentY - 26);
    ctx.lineTo(160 + ctx.measureText(sec.heading).width, currentY - 26);
    ctx.stroke();

    // Section lines
    ctx.fillStyle = theme.ink;
    ctx.font = sec.isCodeOrMath
      ? '500 20px "Courier New", Courier, monospace'
      : '400 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    sec.lines.forEach((line) => {
      ctx.fillText(line, 160, currentY);
      currentY += 36;
    });

    currentY += 24;
  });

  // Footer stamp
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'italic 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('StudySnap Notebook • Verified Student Notes', 160, canvas.height - 40);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const sampleNotesList: SampleNote[] = [
  {
    id: 'bio-respiration',
    titleKey: 'sample1Title',
    category: 'Biology / Science',
    defaultLang: 'en',
    generator: () =>
      createNoteCanvas(
        'Biology 101: Cellular Respiration',
        'Unit 4: Bioenergetics & ATP Yield • Professor Vance',
        [
          {
            heading: '1. Overall Equation',
            lines: [
              'C6H12O6 + 6 O2  ->  6 CO2 + 6 H2O + ~36-38 ATP',
              '• Reactants: Glucose and Oxygen',
              '• Byproducts: Carbon dioxide (waste gas) + Water',
              '• Main Goal: Phosphorylate ADP into usable cellular ATP energy',
            ],
            isCodeOrMath: true,
          },
          {
            heading: '2. Four Key Stages',
            lines: [
              'A) Glycolysis (Cytosol, Anaerobic)',
              '   - Splits 1 Glucose (6C) into 2 Pyruvate (3C)',
              '   - Net yield: +2 ATP, +2 NADH (no oxygen required!)',
              'B) Pyruvate Oxidation (Mitochondrial Matrix)',
              '   - Converts Pyruvate -> Acetyl-CoA + 1 CO2 + 1 NADH per turn',
              'C) Krebs / Citric Acid Cycle (Matrix)',
              '   - 2 turns per original glucose molecule',
              '   - Yields: 2 ATP, 6 NADH, 2 FADH2, 4 CO2 released',
              'D) Oxidative Phosphorylation & ETC (Inner Cristae)',
              '   - Electron Transport Chain pumps H+ creating proton gradient',
              '   - ATP Synthase uses chemiosmosis to produce ~28-32 ATP',
              '   - Oxygen is the FINAL electron acceptor, forming H2O!',
            ],
          },
          {
            heading: '3. Exam Highlights & Common Traps',
            lines: [
              '• Glycolysis happens outside mitochondria (cytoplasm).',
              '• Cyanide blocks complex IV in ETC, stopping ATP synthesis completely.',
              '• Without O2, cells undergo fermentation (lactic acid or ethanol).',
            ],
          },
        ],
        {
          bg: '#fcfbf7',
          line: '#e2e8f0',
          ink: '#1e293b',
          accent: '#0369a1',
          paperLines: true,
        }
      ),
  },
  {
    id: 'history-revolution',
    titleKey: 'sample2Title',
    category: 'World History',
    defaultLang: 'en',
    generator: () =>
      createNoteCanvas(
        'World History: The Industrial Revolution',
        'Chapter 9: 1760 – 1840 • Britain to Global Modernization',
        [
          {
            heading: '1. Why Britain First? (Crucial Factors)',
            lines: [
              '• Abundant natural resources: Coal & Iron ore close to surface',
              '• Commercial wealth from colonial maritime trade & empire',
              '• Agricultural Revolution freed labor force from farming',
              '• Stable political climate & legal protection of patent property rights',
              '• Extensive navigable river networks and canal systems',
            ],
          },
          {
            heading: '2. Groundbreaking Inventions',
            lines: [
              '• Spinning Jenny (James Hargreaves, 1764) - boosted textile yarn output',
              '• Improved Steam Engine (James Watt, 1769) - power anywhere, not just rivers',
              '• Power Loom (Edmund Cartwright, 1785) - mechanized weaving factories',
              '• Locomotives (George Stephenson, 1814) - revolutionized inland shipping',
            ],
          },
          {
            heading: '3. Social & Economic Impacts',
            lines: [
              '• Rapid Urbanization: Boomtowns (Manchester, Leeds) lacking clean water',
              '• Rise of two distinct classes: Bourgeoisie (owners) vs Proletariat (workers)',
              '• Harsh working conditions: 12-16 hour workdays, child labor in mines',
              '• Emergence of labor unions, Factory Acts (1833), and socialist theory',
            ],
          },
        ],
        {
          bg: '#fafaf9',
          line: '#e7e5e4',
          ink: '#292524',
          accent: '#b45309',
          paperLines: true,
        }
      ),
  },
  {
    id: 'calc-derivatives',
    titleKey: 'sample3Title',
    category: 'Mathematics / Calculus',
    defaultLang: 'en',
    generator: () =>
      createNoteCanvas(
        'Calculus I: Differentiation Formulas & Rules',
        'Lecture Notes • Rates of Change and Tangent Lines',
        [
          {
            heading: '1. Definition of Derivative',
            lines: [
              "f'(x) = lim (h -> 0) [f(x + h) - f(x)] / h",
              'Represents the instantaneous rate of change & tangent slope at x.',
            ],
            isCodeOrMath: true,
          },
          {
            heading: '2. Fundamental Rules',
            lines: [
              'Power Rule:       d/dx [x^n] = n * x^(n - 1)',
              'Constant Rule:    d/dx [c] = 0',
              'Constant Multiple:d/dx [c * f(x)] = c * f\'(x)',
              'Sum / Difference: d/dx [f(x) ± g(x)] = f\'(x) ± g\'(x)',
              'Product Rule:     d/dx [u * v] = u\' * v + u * v\'',
              'Quotient Rule:    d/dx [u / v] = (u\' * v - u * v\') / (v^2)',
              'Chain Rule:       d/dx [f(g(x))] = f\'(g(x)) * g\'(x)',
            ],
            isCodeOrMath: true,
          },
          {
            heading: '3. Trigonometric & Exponential Derivatives',
            lines: [
              'd/dx [sin(x)] = cos(x)          d/dx [cos(x)] = -sin(x)',
              'd/dx [tan(x)] = sec^2(x)        d/dx [e^x]    = e^x',
              'd/dx [ln(x)]  = 1 / x           d/dx [a^x]    = a^x * ln(a)',
            ],
            isCodeOrMath: true,
          },
        ],
        {
          bg: '#f8fafc',
          line: '#e2e8f0',
          ink: '#0f172a',
          accent: '#4338ca',
          paperLines: true,
        }
      ),
  },
  {
    id: 'spanish-grammar',
    titleKey: 'sample4Title',
    category: 'Español / Gramática',
    defaultLang: 'es',
    generator: () =>
      createNoteCanvas(
        'Gramática Española: Pretérito vs Imperfecto',
        'Nivel Intermedio B1-B2 • Apuntes de Sintaxis y Uso',
        [
          {
            heading: '1. El Pretérito Indefinido (Acciones Concretas)',
            lines: [
              '• Se usa para acciones completadas en un momento específico en el pasado.',
              '• Palabras clave: ayer, anoche, la semana pasada, el año pasado, de repente.',
              '• Ejemplo: "Ayer fui al mercado y compré frutas frescas."',
              '• Verbos irregulares comunes: tener (tuve), estar (estuve), hacer (hice).',
            ],
          },
          {
            heading: '2. El Pretérito Imperfecto (Descripciones y Hábitos)',
            lines: [
              '• Se usa para hábitos, acciones continuas o estados en el pasado.',
              '• Descripciones físicas, clima, edad, hora y estados emocionales.',
              '• Palabras clave: siempre, a menudo, todos los días, mientras, de niño.',
              '• Ejemplo: "Cuando era niño, siempre jugaba en el parque con mis amigos."',
              '• Solo tres verbos irregulares: ser (era), ir (iba), ver (veía).',
            ],
          },
          {
            heading: '3. Caso de Contraste (Interrupción)',
            lines: [
              '• Imperfecto = La acción que estaba en progreso (fondo).',
              '• Pretérito = La acción puntual que interrumpió el progreso.',
              '• Ejemplo: "Estudiaba (imperfecto) cuando sonó (pretérito) el teléfono."',
            ],
          },
        ],
        {
          bg: '#fffbeb',
          line: '#fef3c7',
          ink: '#451a03',
          accent: '#b91c1c',
          paperLines: true,
        }
      ),
  },
];
