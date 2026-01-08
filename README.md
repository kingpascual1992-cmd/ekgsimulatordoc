# 12-Lead EKG Simulator

An interactive educational tool for learning to recognize cardiac pathologies on 12-lead EKGs.

## Features

- **25 Cardiac Pathologies** including:
  - Normal Sinus Rhythm, Bradycardia, Tachycardia
  - Atrial Fibrillation, Atrial Flutter, SVT
  - Ventricular Tachycardia, Ventricular Fibrillation
  - 1st, 2nd (Type I & II), and 3rd Degree Heart Blocks
  - Right and Left Bundle Branch Blocks
  - Anterior, Inferior, Lateral, and Posterior STEMI
  - Hyperkalemia, Hypokalemia
  - Pulmonary Embolism, Pericarditis
  - WPW Syndrome, Long QT Syndrome

- **Realistic 12-Lead Display** with standard layout
- **Dynamic Intervals** (PR, QRS, QT, QTc) that adjust with heart rate
- **Adjustable Heart Rate** for applicable rhythms
- **Clinical Findings** panel for each pathology
- **Lead II Rhythm Strip** at bottom

## Getting Started

### Prerequisites
- Node.js 18+ installed

### Installation

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
```

## Disclaimer

**Educational simulation only** - not for clinical diagnosis. Always correlate with clinical findings and use proper diagnostic equipment for patient care.

## License

MIT License - free for educational and personal use.
