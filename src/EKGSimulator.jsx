import React, { useState, useEffect, useRef } from 'react';

const EKGPrintout = () => {
  const [pathology, setPathology] = useState('normal');
  const [heartRate, setHeartRate] = useState(75);
  const [artifactLevel, setArtifactLevel] = useState(9); // Default 9%
  const [rrVariability, setRrVariability] = useState(5); // Default 5%
  const [waveIrregularity, setWaveIrregularity] = useState(8); // Default 8%
  const [waveWidth, setWaveWidth] = useState(68); // Default 68%
  const canvasRef = useRef(null);

  const pathologies = {
    normal: {
      name: 'Normal Sinus Rhythm',
      findings: ['Regular rhythm with rate 60-100 bpm', 'Upright P wave in I, II, aVF (inverted in aVR)', 'PR interval 120-200ms', 'Narrow QRS <120ms', 'Each P wave followed by QRS'],
    },
    sinus_brady: {
      name: 'Sinus Bradycardia',
      findings: ['Regular rhythm with rate <60 bpm', 'Normal P wave morphology', 'Normal PR and QRS intervals', 'Common in athletes, sleep, or beta-blocker use'],
    },
    sinus_tachy: {
      name: 'Sinus Tachycardia',
      findings: ['Regular rhythm with rate >100 bpm', 'Normal P waves (may merge with preceding T wave)', 'Normal PR and QRS intervals', 'P wave may be hidden in T wave at high rates'],
    },
    afib: {
      name: 'Atrial Fibrillation',
      findings: ['Irregularly irregular R-R intervals', 'Absent P waves', 'Fibrillatory baseline (chaotic atrial activity)', 'Variable ventricular rate', 'Narrow QRS unless aberrant conduction'],
    },
    aflutter: {
      name: 'Atrial Flutter',
      findings: ['Sawtooth flutter waves (F waves) best seen in II, III, aVF', 'Atrial rate ~300 bpm', 'Variable AV block: 2:1 (150), 3:1 (100), 4:1 (75)', 'Regular or regularly irregular ventricular response', 'No isoelectric baseline between F waves'],
    },
    svt: {
      name: 'SVT (AVNRT)',
      findings: ['Regular narrow complex tachycardia', 'Rate typically 150-250 bpm', 'P waves absent, buried in QRS, or retrograde after QRS', 'Abrupt onset and termination', 'May see pseudo-R\' in V1 or pseudo-S in inferior leads'],
    },
    vtach: {
      name: 'Ventricular Tachycardia',
      findings: ['Wide QRS complex >120ms', 'Regular rhythm', 'Slow VT: 100-150 bpm, Fast VT: >150 bpm', 'AV dissociation (P waves march through)', 'Fusion and capture beats', 'Concordance in precordial leads'],
    },
    vfib: {
      name: 'Ventricular Fibrillation',
      findings: ['Chaotic, irregular waveform', 'No identifiable P waves, QRS, or T waves', 'Varying amplitude and frequency', 'No organized electrical activity', 'Coarse vs fine based on amplitude'],
    },
    asystole: {
      name: 'Asystole',
      findings: ['Flat line - no electrical activity', 'Confirm in multiple leads', 'May see occasional P waves (ventricular standstill)', 'Rule out fine VFib', 'Check lead connections'],
    },
    first_degree: {
      name: '1st Degree AV Block',
      findings: ['PR interval >200ms (>5 small squares)', 'Every P wave conducts to ventricle', 'Regular rhythm', 'Constant PR interval', 'Often benign, may be due to AV nodal disease or drugs'],
    },
    mobitz1: {
      name: '2nd Degree AV Block Type I (Wenckebach)',
      findings: ['Progressive PR prolongation until dropped QRS', 'Grouped beating pattern', 'Shortening R-R intervals before dropped beat', 'PR after pause is shortest', 'Usually AV nodal level - relatively benign'],
    },
    mobitz2: {
      name: '2nd Degree AV Block Type II',
      findings: ['Constant PR interval with intermittent dropped QRS', 'No PR prolongation before dropped beat', 'Often wide QRS (infranodal block)', 'May progress to complete heart block', 'Usually requires pacemaker'],
    },
    third_degree: {
      name: '3rd Degree (Complete) Heart Block',
      findings: ['Complete AV dissociation', 'P waves "march through" QRS complexes', 'Regular P-P and R-R intervals but unrelated', 'Junctional escape (≥40 bpm): narrow QRS, rate 40-60', 'Ventricular escape (<40 bpm): wide QRS, rate 20-40', 'Atrial rate > ventricular rate'],
    },
    rbbb: {
      name: 'Right Bundle Branch Block',
      findings: ['QRS ≥120ms', 'RSR\' pattern in V1-V2 ("rabbit ears" or "M-shaped")', 'Wide slurred S wave in I, aVL, V5-V6', 'ST-T changes opposite to terminal QRS deflection', 'Normal axis'],
    },
    lbbb: {
      name: 'Left Bundle Branch Block',
      findings: ['QRS ≥120ms', 'Broad notched R wave in I, aVL, V5-V6', 'Deep QS or rS in V1-V3', 'Absence of Q waves in lateral leads', 'Appropriate discordance (ST opposite to QRS)', 'Cannot interpret ischemia normally - use Sgarbossa criteria'],
    },
    anterior_stemi: {
      name: 'Anterior STEMI',
      findings: ['ST elevation in V1-V4 (anterior leads)', 'Reciprocal ST depression in II, III, aVF', 'LAD territory - large area at risk', 'May see hyperacute T waves early', 'Q waves develop over hours-days'],
    },
    inferior_stemi: {
      name: 'Inferior STEMI',
      findings: ['ST elevation in II, III, aVF', 'Reciprocal ST depression in I, aVL', 'Usually RCA occlusion (III > II suggests RCA)', 'Check V4R for RV involvement', 'Watch for bradycardia and heart blocks'],
    },
    lateral_stemi: {
      name: 'Lateral STEMI',
      findings: ['ST elevation in I, aVL, V5-V6', 'Reciprocal ST depression in II, III, aVF', 'Circumflex or diagonal branch occlusion', 'High lateral (I, aVL) may be subtle', 'Often accompanies anterior or inferior STEMI'],
    },
    posterior_stemi: {
      name: 'Posterior STEMI',
      findings: ['ST depression in V1-V3 (reciprocal changes)', 'Tall, broad R waves in V1-V3 (Q wave equivalent)', 'Upright T waves in V1-V3', 'ST elevation in V7-V9 (posterior leads)', 'Often occurs with inferior STEMI'],
    },
    hyperkalemia: {
      name: 'Hyperkalemia',
      findings: ['Tall, peaked, narrow "tented" T waves (most dramatic in V2-V3)', 'T wave height may exceed QRS amplitude', 'Mildly widened QRS', 'Flattened P waves', 'Shortened QT interval', 'Can progress to sine wave → VFib/asystole if untreated'],
    },
    hypokalemia: {
      name: 'Hypokalemia',
      findings: ['Flattened T waves', 'ST depression', 'Prominent U waves (follows T wave)', 'Prolonged QU interval', 'T-U fusion at severe levels', 'Increased risk of arrhythmias'],
    },
    pe: {
      name: 'Pulmonary Embolism',
      findings: ['Sinus tachycardia (most common finding)', 'S1Q3T3 pattern (S in I, Q and inverted T in III)', 'Right heart strain: T wave inversions V1-V4', 'Right axis deviation', 'New incomplete or complete RBBB', 'Atrial fibrillation'],
    },
    pericarditis: {
      name: 'Pericarditis',
      findings: ['Diffuse ST elevation with upward concavity', 'PR depression (most specific finding)', 'ST elevation in most leads except aVR and V1', 'PR elevation in aVR', 'No reciprocal ST changes', 'Spodick sign (downsloping TP segment)'],
    },
    wpw: {
      name: 'WPW Syndrome',
      findings: ['Short PR interval <120ms', 'Delta wave (slurred QRS upstroke)', 'Wide QRS >100ms', 'Secondary ST-T changes', 'Pseudo-infarct patterns possible', 'Risk of rapid conduction in AFib'],
    },
    long_qt: {
      name: 'Long QT Syndrome',
      findings: ['Prolonged QTc (>450ms men, >460ms women)', 'Abnormal T wave morphology', 'T wave notching or bifid T waves', 'Risk of Torsades de Pointes', 'May be congenital or acquired (drugs, electrolytes)'],
    },
    tamponade: {
      name: 'Cardiac Tamponade',
      findings: ['Low voltage QRS (<5mm in limb leads, <10mm in precordial)', 'Electrical alternans (alternating QRS amplitude)', 'Sinus tachycardia', 'May see PR depression', 'Beck\'s triad: hypotension, JVD, muffled heart sounds'],
    },
    lgl: {
      name: 'Lown-Ganong-Levine (LGL)',
      findings: ['Short PR interval (<120ms)', 'Normal QRS duration (<120ms)', 'NO delta wave (unlike WPW)', 'Bypass tract connects atria to bundle of His', 'Risk of SVT'],
    },
    early_repol: {
      name: 'Early Repolarization',
      findings: ['J-point elevation (1-4mm)', 'Concave upward ST elevation', 'Notched or slurred J-point ("fishhook")', 'Most prominent in V2-V5', 'Common in young athletes - usually benign', 'Diffuse pattern - not localized to coronary territory'],
    },
    la_ra_reversal: {
      name: 'LA-RA Lead Reversal',
      findings: ['Lead I completely inverted (most obvious clue)', 'aVR and aVL appear switched', 'Lead II and III appear switched', 'Inverted P wave in lead I', 'Precordial leads normal', 'Most common lead reversal error'],
    },
    la_ll_reversal: {
      name: 'LA-LL Lead Reversal',
      findings: ['Lead III nearly flat/isoelectric', 'Lead I and II appear similar', 'aVL and aVF appear switched', 'aVR relatively unchanged', 'Precordial leads normal', 'P wave changes in limb leads'],
    },
    ra_ll_reversal: {
      name: 'RA-LL Lead Reversal',
      findings: ['Lead II nearly flat/isoelectric', 'Lead I and III inverted', 'aVR and aVF appear switched', 'aVL relatively unchanged', 'Precordial leads normal', 'Creates bizarre axis'],
    },
    precordial_reversal: {
      name: 'V1-V2 Precordial Reversal',
      findings: ['Loss of normal R wave progression', 'V1 and V2 appear switched', 'V1 may show larger R wave than expected', 'Limb leads normal', 'Can mimic pathology if not recognized', 'Check electrode placement'],
    },
  };

  const getEffectiveHR = () => {
    switch (pathology) {
      case 'sinus_brady': return Math.min(heartRate, 59); // Bradycardia: <60
      case 'sinus_tachy': return Math.max(heartRate, 101); // Tachycardia: >100
      case 'aflutter': return Math.max(75, Math.min(heartRate, 150)); // 4:1 to 2:1 conduction
      case 'svt': return Math.max(150, Math.min(heartRate, 250)); // Typical SVT range
      case 'vtach': return Math.max(100, Math.min(heartRate, 250)); // Slow to fast VT
      case 'third_degree': return Math.max(20, Math.min(heartRate, 60)); // Ventricular to junctional escape
      case 'pe': return Math.max(100, Math.min(heartRate, 150)); // Sinus tachycardia
      case 'tamponade': return Math.max(100, Math.min(heartRate, 140)); // Reflex tachycardia
      default: return heartRate;
    }
  };

  // Get heart rate range hints for display
  const getHRRangeHint = () => {
    switch (pathology) {
      case 'sinus_brady': return '(≤59 bpm)';
      case 'sinus_tachy': return '(≥101 bpm)';
      case 'aflutter': return '(75-150: 4:1 to 2:1 block)';
      case 'svt': return '(150-250 bpm)';
      case 'vtach': return '(100-250: slow to fast VT)';
      case 'third_degree': return '(20-60: vent to junctional escape)';
      case 'pe': return '(100-150 bpm)';
      case 'tamponade': return '(100-140 bpm)';
      case 'vfib': return '(chaotic - no rate)';
      case 'asystole': return '(no activity)';
      default: return '';
    }
  };

  const getIntervals = (pathology, hr) => {
    // Base PR varies with heart rate (shorter at higher rates)
    // Normal PR ranges from ~120ms at high HR to ~200ms at low HR
    let basePR = Math.round(200 - (hr - 50) * 0.5);
    basePR = Math.max(120, Math.min(200, basePR));
    
    let pr = basePR;
    let qrs = 88;
    // QT varies with heart rate - using physiological relationship
    // QT shortens as HR increases (not perfectly by Bazett, more realistic)
    let qt = Math.round(360 + (60 - Math.min(hr, 120)) * 1.5);
    qt = Math.max(280, Math.min(480, qt));
    let axis = 60; // Normal axis in degrees

    switch (pathology) {
      case 'first_degree':
        pr = basePR + 100; // Add fixed prolongation on top of rate-adjusted base
        break;
      case 'mobitz1':
        pr = basePR + 60; // Average of progressive PR
        break;
      case 'mobitz2':
        pr = basePR + 40;
        qrs = 130; // Wide QRS (infranodal block)
        break;
      case 'third_degree':
        pr = null; // No consistent PR in complete block
        // Junctional escape (40-60) = narrow QRS, Ventricular escape (20-40) = wide QRS
        qrs = hr >= 40 ? 95 : 160;
        axis = hr >= 40 ? 0 : -30; // Junctional has normal axis
        break;
      case 'rbbb':
        qrs = 140;
        axis = 60; // RBBB alone doesn't change axis
        break;
      case 'lbbb':
        qrs = 160;
        axis = -45;
        break;
      case 'wpw':
        pr = Math.round(basePR * 0.6); // Short PR, proportionally reduced
        pr = Math.max(80, Math.min(119, pr)); // Strictly <120ms
        qrs = 130;
        break;
      case 'lgl':
        pr = Math.round(basePR * 0.55); // Very short PR
        pr = Math.max(70, Math.min(100, pr));
        qrs = 88; // Normal QRS (no delta wave)
        break;
      case 'hyperkalemia':
        pr = basePR + 20; // Slightly prolonged PR
        qrs = 110; // Mildly widened (not dramatic)
        break;
      case 'hypokalemia':
        qt = Math.round(qt * 1.25);
        break;
      case 'long_qt':
        qt = Math.round(qt * 1.4);
        break;
      case 'vtach':
        pr = null;
        qrs = 180; // Very wide QRS
        axis = -90;
        break;
      case 'vfib':
      case 'asystole':
        return { pr: null, qrs: null, qt: null, qtc: null, axis: null };
      case 'afib':
        pr = null; // No P waves
        break;
      case 'aflutter':
        pr = null;
        break;
      case 'svt':
        pr = null; // P waves buried/absent
        break;
      case 'pe':
        axis = 110;
        break;
      case 'anterior_stemi':
        axis = 45;
        break;
      case 'inferior_stemi':
        axis = 75;
        break;
      case 'tamponade':
        qrs = 88; // Normal duration - low voltage affects amplitude, not duration
        break;
      case 'early_repol':
        axis = 60;
        break;
      default:
        break;
    }

    // Calculate QTc using Bazett's formula: QTc = QT / sqrt(RR)
    let qtc = null;
    if (qt && hr > 0) {
      const rrSeconds = 60 / hr;
      qtc = Math.round(qt / Math.sqrt(rrSeconds));
    }

    return { pr, qrs, qt, qtc, axis };
  };

  const generateWaveform = (lead, time, pathology, hr, artifactLvl = 0, rrVar = 0, waveIrreg = 0, waveWd = 100) => {
    // Global wave width scaling factor (50-150%)
    const widthScale = waveWd / 100;
    
    // Apply R-R variability (timing shifts between beats) - TRIPLED
    let timeOffset = 0;
    if (rrVar > 0 && !['vfib', 'asystole'].includes(pathology)) {
      // Use multiple sine waves for realistic respiratory sinus arrhythmia
      const varAmount = rrVar / 100 * 0.25;
      timeOffset = varAmount * (
        Math.sin(time * 0.4) * 0.5 +  // Respiratory component (~0.2-0.4 Hz)
        Math.sin(time * 0.7) * 0.3 + 
        Math.sin(time * 1.5) * 0.15 +
        Math.sin(time * 2.9) * 0.05
      );
    }
    const adjustedTime = time + timeOffset;
    
    const cycleLength = 60 / hr;
    const t = adjustedTime % cycleLength;
    const normalizedT = t / cycleLength;
    
    // Calculate which beat we're on for beat-to-beat variation
    const beatNumber = Math.floor(adjustedTime / cycleLength);
    
    // Beat-to-beat amplitude and morphology variation - MASSIVELY INCREASED
    let ampVariation = 1.0;
    let morphVariation = 0;
    let qrsWidthVariation = 1.0;
    let tAmpVariation = 1.0;
    let pAmpVariation = 1.0;
    if (waveIrreg > 0 && !['vfib', 'asystole'].includes(pathology)) {
      const irregFactor = waveIrreg / 100;
      
      // Pseudo-random variation based on beat number (deterministic for consistency)
      const seed1 = Math.sin(beatNumber * 12.9898) * 43758.5453;
      const seed2 = Math.sin(beatNumber * 78.233) * 43758.5453;
      const seed3 = Math.sin(beatNumber * 45.164) * 43758.5453;
      const seed4 = Math.sin(beatNumber * 93.989) * 43758.5453;
      const seed5 = Math.sin(beatNumber * 27.617) * 43758.5453;
      const seed6 = Math.sin(beatNumber * 61.432) * 43758.5453;
      const seed7 = Math.sin(beatNumber * 84.567) * 43758.5453;
      const rand1 = seed1 - Math.floor(seed1);
      const rand2 = seed2 - Math.floor(seed2);
      const rand3 = seed3 - Math.floor(seed3);
      const rand4 = seed4 - Math.floor(seed4);
      const rand5 = seed5 - Math.floor(seed5);
      const rand6 = seed6 - Math.floor(seed6);
      const rand7 = seed7 - Math.floor(seed7);
      
      // QRS amplitude varies ±50% at max irregularity
      ampVariation = 1.0 + (rand1 - 0.5) * 1.0 * irregFactor;
      
      // T wave amplitude varies independently ±40%
      tAmpVariation = 1.0 + (rand3 - 0.5) * 0.8 * irregFactor;
      
      // P wave amplitude varies independently ±30%
      pAmpVariation = 1.0 + (rand6 - 0.5) * 0.6 * irregFactor;
      
      // QRS width varies ±20%
      qrsWidthVariation = 1.0 + (rand4 - 0.5) * 0.4 * irregFactor;
      
      // Global timing shift within the beat - DOUBLED
      morphVariation = (rand2 - 0.5) * 0.12 * irregFactor;
      
      // Occasional dramatic variation (simulates respiratory/movement)
      if (rand5 > 0.80) {
        ampVariation *= (0.5 + rand5 * 0.8);
        tAmpVariation *= (0.6 + rand7 * 0.6);
      }
      
      // Occasional very small beat (simulates PVC-like or early beat appearance)
      if (rand7 > 0.95) {
        ampVariation *= 0.5;
      }
    }

    const leadAmplitudes = {
      'I': { p: 1, qrs: 1, t: 1 },
      'II': { p: 1.2, qrs: 1.5, t: 1.2 },
      'III': { p: 0.8, qrs: 0.8, t: 0.8 },
      'aVR': { p: -0.8, qrs: -1, t: -0.8 },
      'aVL': { p: 0.5, qrs: 0.6, t: 0.5 },
      'aVF': { p: 1, qrs: 1.1, t: 1 },
      'V1': { p: 0.8, qrs: -1.2, t: -0.3 },
      'V2': { p: 0.8, qrs: -0.6, t: 0.6 },
      'V3': { p: 0.8, qrs: 0.4, t: 0.9 },
      'V4': { p: 0.8, qrs: 1.3, t: 1 },
      'V5': { p: 0.8, qrs: 1.2, t: 0.9 },
      'V6': { p: 0.8, qrs: 1.0, t: 0.8 },
    };

    const amp = leadAmplitudes[lead] || { p: 1, qrs: 1, t: 1 };
    let value = 0;

    // Gaussian with timing shift and width scaling (higher widthScale = wider, more rounded waves)
    const gaussian = (x, mean, sigma, amplitude) => 
      amplitude * Math.exp(-Math.pow(x - (mean + morphVariation), 2) / (2 * Math.pow(sigma * widthScale, 2)));

    // Generate normal complex with smooth, realistic waves (not pointy)
    const generateNormalComplex = (t, amp, prInterval = 0.16, qrsWidth = 0.08) => {
      let v = 0;
      // P wave - smooth and rounded
      v += gaussian(t, 0.1, 0.05 * qrsWidthVariation, 0.15 * amp.p * pAmpVariation);
      // QRS - smooth transitions, not sharp spikes
      v -= gaussian(t, 0.1 + prInterval, 0.018 * qrsWidthVariation, 0.1 * Math.abs(amp.qrs));
      v += gaussian(t, 0.1 + prInterval + 0.02, 0.028 * qrsWidthVariation, 1.0 * amp.qrs);
      v -= gaussian(t, 0.1 + prInterval + 0.04, 0.022 * qrsWidthVariation, 0.25 * Math.abs(amp.qrs));
      // T wave - broad and smooth
      v += gaussian(t, 0.1 + prInterval + qrsWidth + 0.16, 0.08, 0.3 * amp.t * tAmpVariation);
      return v;
    };

    switch (pathology) {
      case 'normal':
      case 'sinus_brady':
      case 'sinus_tachy':
        value = generateNormalComplex(normalizedT, amp);
        break;

      case 'afib': {
        const fibrillation = 0.03 * (Math.sin(time * 50) + Math.sin(time * 73) + Math.sin(time * 91)) / 3;
        const irregularity = Math.sin(time * 2.3) * 0.15;
        const adjustedT = (normalizedT + irregularity + 1) % 1;
        value = fibrillation;
        value -= gaussian(adjustedT, 0.2, 0.008, 0.1 * Math.abs(amp.qrs));
        value += gaussian(adjustedT, 0.22, 0.012, 1.0 * amp.qrs);
        value -= gaussian(adjustedT, 0.24, 0.01, 0.25 * Math.abs(amp.qrs));
        value += gaussian(adjustedT, 0.4, 0.05, 0.3 * amp.t);
        break;
      }

      case 'aflutter': {
        // Smooth, rounded flutter waves at ~300 bpm (5 per second)
        // Using sine-based curves for smooth undulating appearance
        const flutterFreq = 5;
        const flutterPhase = time * flutterFreq * Math.PI * 2;
        
        // Create smooth rounded wave - asymmetric sine (slower descent, faster ascent)
        const smoothWave = -Math.sin(flutterPhase) * 0.6 - Math.sin(flutterPhase * 2) * 0.2;
        
        // Flutter waves more prominent in inferior leads (II, III, aVF)
        const flutterAmp = ['II', 'III', 'aVF'].includes(lead) ? 0.18 : 
                          lead === 'aVR' ? -0.12 : 
                          ['V1'].includes(lead) ? 0.14 : 0.08;
        value = flutterAmp * smoothWave;
        
        // Add QRS complex (narrow, as conduction is normal)
        value -= gaussian(normalizedT, 0.2, 0.008, 0.1 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.22, 0.012, 1.0 * amp.qrs);
        value -= gaussian(normalizedT, 0.24, 0.01, 0.25 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.42, 0.04, 0.2 * amp.t);
        break;
      }

      case 'svt':
        value -= gaussian(normalizedT, 0.15, 0.008, 0.1 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.17, 0.012, 1.0 * amp.qrs);
        value -= gaussian(normalizedT, 0.19, 0.01, 0.25 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.3, 0.04, 0.25 * amp.t);
        break;

      case 'vtach': {
        // Wide QRS monomorphic VT - very wide throughout all leads
        // Sigma values increased for much wider complexes
        value -= gaussian(normalizedT, 0.12, 0.03, 0.15 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.18, 0.05, 1.2 * amp.qrs); // Much wider R
        value -= gaussian(normalizedT, 0.28, 0.04, 0.5 * Math.abs(amp.qrs)); // Much wider S
        // T wave with appropriate discordance (opposite to QRS)
        const vtDiscordance = amp.qrs > 0 ? -0.4 : 0.4;
        value += gaussian(normalizedT, 0.48, 0.07, vtDiscordance);
        break;
      }

      case 'vfib':
        value = 0.4 * (Math.sin(time * 15 + Math.sin(time * 7)) + 0.7 * Math.sin(time * 23) + 0.5 * Math.sin(time * 31)) / 2.5;
        break;

      case 'asystole':
        value = 0.01 * Math.sin(time * 3);
        break;

      case 'first_degree':
        value = generateNormalComplex(normalizedT, amp, 0.3, 0.08);
        break;

      case 'mobitz1': {
        const beatInCycle = Math.floor(time / cycleLength) % 4;
        const prIntervals = [0.2, 0.28, 0.36, 999];
        if (beatInCycle < 3) {
          value = generateNormalComplex(normalizedT, amp, prIntervals[beatInCycle], 0.08);
        } else {
          value = gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        }
        break;
      }

      case 'mobitz2': {
        const beatNum = Math.floor(time / cycleLength) % 3;
        if (beatNum < 2) {
          // Wide QRS for infranodal block
          value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p); // P wave
          value -= gaussian(normalizedT, 0.26, 0.01, 0.1 * Math.abs(amp.qrs)); // Q wave
          value += gaussian(normalizedT, 0.28, 0.018, 1.0 * amp.qrs); // Wide R wave
          value -= gaussian(normalizedT, 0.32, 0.015, 0.3 * Math.abs(amp.qrs)); // Wide S wave
          value += gaussian(normalizedT, 0.48, 0.05, 0.3 * amp.t); // T wave
        } else {
          // Dropped QRS - only P wave
          value = gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        }
        break;
      }

      case 'third_degree': {
        // Atrial rate ~80 bpm, ventricular rate based on escape rhythm
        const pPhase = (time * 1.33) % 1; // Atrial rate ~80
        const ventRate = hr / 60;
        const ventPhase = (time * ventRate) % 1;
        
        // P waves at regular atrial rate
        value = gaussian(pPhase, 0.1, 0.025, 0.15 * amp.p);
        
        // Escape rhythm: junctional (narrow, 40-60) or ventricular (wide, 20-40)
        const isJunctional = hr >= 40; // Junctional escape is faster
        const qrsWidth = isJunctional ? 0.012 : 0.04; // Narrow vs wide QRS
        const qrsAmp = isJunctional ? 1.0 : 1.1;
        
        value -= gaussian(ventPhase, 0.2, isJunctional ? 0.008 : 0.02, 0.1 * Math.abs(amp.qrs));
        value += gaussian(ventPhase, 0.25, qrsWidth, qrsAmp * amp.qrs);
        value -= gaussian(ventPhase, 0.32, isJunctional ? 0.01 : 0.025, 0.3 * Math.abs(amp.qrs));
        
        // T wave with appropriate discordance for ventricular escape
        const tDiscordance = (!isJunctional && amp.qrs > 0) ? -0.3 : 0.3;
        value += gaussian(ventPhase, 0.55, 0.07, tDiscordance * Math.abs(amp.t));
        break;
      }

      case 'rbbb':
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        if (lead === 'V1' || lead === 'V2') {
          // RSR' pattern ("rabbit ears")
          value += gaussian(normalizedT, 0.26, 0.01, 0.4);
          value -= gaussian(normalizedT, 0.28, 0.008, 0.2);
          value += gaussian(normalizedT, 0.31, 0.015, 0.6);
        } else if (['I', 'aVL', 'V5', 'V6'].includes(lead)) {
          // Wide slurred S wave in lateral leads
          value += gaussian(normalizedT, 0.26, 0.012, 0.8 * amp.qrs);
          value -= gaussian(normalizedT, 0.3, 0.02, 0.5 * Math.abs(amp.qrs));
        } else {
          value += gaussian(normalizedT, 0.26, 0.012, 1.0 * amp.qrs);
          value -= gaussian(normalizedT, 0.3, 0.015, 0.3 * Math.abs(amp.qrs));
        }
        value += gaussian(normalizedT, 0.5, 0.05, 0.3 * amp.t);
        break;

      case 'lbbb':
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        if (['V1', 'V2', 'V3'].includes(lead)) {
          value -= gaussian(normalizedT, 0.28, 0.04, 1.2);
          value += gaussian(normalizedT, 0.5, 0.05, 0.3);
        } else if (['I', 'aVL', 'V5', 'V6'].includes(lead)) {
          value += gaussian(normalizedT, 0.25, 0.02, 0.6 * amp.qrs);
          value += gaussian(normalizedT, 0.32, 0.02, 0.8 * amp.qrs);
          value -= gaussian(normalizedT, 0.5, 0.05, 0.3);
        } else {
          value += gaussian(normalizedT, 0.28, 0.035, 1.0 * amp.qrs);
        }
        break;

      case 'anterior_stemi': {
        // Generate base complex with flat PR segment
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p); // P wave
        // Flat PR segment (baseline)
        value -= gaussian(normalizedT, 0.26, 0.008, 0.1 * Math.abs(amp.qrs)); // Q wave
        value += gaussian(normalizedT, 0.28, 0.012, 1.0 * amp.qrs); // R wave
        value -= gaussian(normalizedT, 0.30, 0.01, 0.25 * Math.abs(amp.qrs)); // S wave
        
        if (['V1', 'V2', 'V3', 'V4'].includes(lead)) {
          // ST elevation starting at J-point with coved/tombstone morphology
          // Elevation is relative to the flat PR baseline
          value += 0.35 * gaussian(normalizedT, 0.32, 0.04, 1); // J-point elevation
          value += 0.30 * gaussian(normalizedT, 0.38, 0.06, 1); // Coved ST segment
          value += gaussian(normalizedT, 0.48, 0.05, 0.15 * amp.t); // Diminished T wave merging with ST
        } else if (['II', 'III', 'aVF'].includes(lead)) {
          // Reciprocal ST depression
          value -= 0.15 * gaussian(normalizedT, 0.34, 0.08, 1);
          value += gaussian(normalizedT, 0.48, 0.05, 0.25 * amp.t);
        } else {
          value += gaussian(normalizedT, 0.48, 0.05, 0.3 * amp.t); // Normal T wave
        }
        break;
      }

      case 'inferior_stemi': {
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        value -= gaussian(normalizedT, 0.26, 0.008, 0.1 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.28, 0.012, 1.0 * amp.qrs);
        value -= gaussian(normalizedT, 0.30, 0.01, 0.25 * Math.abs(amp.qrs));
        
        if (['II', 'III', 'aVF'].includes(lead)) {
          // ST elevation with coved morphology
          value += 0.35 * gaussian(normalizedT, 0.32, 0.04, 1);
          value += 0.30 * gaussian(normalizedT, 0.38, 0.06, 1);
          value += gaussian(normalizedT, 0.48, 0.05, 0.15 * amp.t);
        } else if (['I', 'aVL'].includes(lead)) {
          // Reciprocal ST depression
          value -= 0.18 * gaussian(normalizedT, 0.34, 0.08, 1);
          value += gaussian(normalizedT, 0.48, 0.05, 0.25 * amp.t);
        } else {
          value += gaussian(normalizedT, 0.48, 0.05, 0.3 * amp.t);
        }
        break;
      }

      case 'lateral_stemi': {
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        value -= gaussian(normalizedT, 0.26, 0.008, 0.1 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.28, 0.012, 1.0 * amp.qrs);
        value -= gaussian(normalizedT, 0.30, 0.01, 0.25 * Math.abs(amp.qrs));
        
        if (['I', 'aVL', 'V5', 'V6'].includes(lead)) {
          // ST elevation
          value += 0.30 * gaussian(normalizedT, 0.32, 0.04, 1);
          value += 0.25 * gaussian(normalizedT, 0.38, 0.06, 1);
          value += gaussian(normalizedT, 0.48, 0.05, 0.15 * amp.t);
        } else if (['II', 'III', 'aVF'].includes(lead)) {
          // Reciprocal depression
          value -= 0.12 * gaussian(normalizedT, 0.34, 0.08, 1);
          value += gaussian(normalizedT, 0.48, 0.05, 0.25 * amp.t);
        } else {
          value += gaussian(normalizedT, 0.48, 0.05, 0.3 * amp.t);
        }
        break;
      }

      case 'posterior_stemi': {
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        value -= gaussian(normalizedT, 0.26, 0.008, 0.1 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.28, 0.012, 1.0 * amp.qrs);
        value -= gaussian(normalizedT, 0.30, 0.01, 0.25 * Math.abs(amp.qrs));
        
        if (['V1', 'V2', 'V3'].includes(lead)) {
          // Reciprocal changes: ST depression + tall R waves
          value += gaussian(normalizedT, 0.28, 0.015, 0.5); // Tall R wave (Q equivalent)
          value -= 0.20 * gaussian(normalizedT, 0.34, 0.08, 1); // ST depression
          value += gaussian(normalizedT, 0.48, 0.05, 0.4 * Math.abs(amp.t)); // Upright T
        } else {
          value += gaussian(normalizedT, 0.48, 0.05, 0.3 * amp.t);
        }
        break;
      }

      case 'hyperkalemia': {
        // Hyperkalemia - Key features:
        // 1. DEEP S waves in V1, V2, V3 (prominent downward deflection)
        // 2. Tall peaked T waves
        // 3. Minimal/absent P waves
        
        if (lead === 'V1') {
          // Deep S wave down
          value += gaussian(normalizedT, 0.28, 0.035, -1.2);
          // Peaked T wave up
          value += gaussian(normalizedT, 0.52, 0.03, 1.4);
        } else if (lead === 'V2') {
          // Deepest S wave
          value += gaussian(normalizedT, 0.28, 0.035, -1.5);
          // Tall peaked T wave
          value += gaussian(normalizedT, 0.52, 0.03, 2.2);
        } else if (lead === 'V3') {
          // Deep S wave
          value += gaussian(normalizedT, 0.28, 0.035, -1.0);
          // Tallest peaked T wave
          value += gaussian(normalizedT, 0.52, 0.03, 2.4);
        } else if (lead === 'aVR') {
          // aVR: inverted
          value += gaussian(normalizedT, 0.28, 0.03, -0.2);
          value += gaussian(normalizedT, 0.52, 0.03, -1.4);
        } else {
          // Limb leads and V4-V6: Small R wave, peaked T wave
          value += gaussian(normalizedT, 0.28, 0.03, 0.25);
          let tHeight = 1.2;
          if (lead === 'II') tHeight = 1.8;
          else if (lead === 'V4') tHeight = 1.8;
          else if (lead === 'V5') tHeight = 1.4;
          else if (lead === 'V6') tHeight = 1.2;
          else if (lead === 'III' || lead === 'aVF') tHeight = 1.4;
          else if (lead === 'I') tHeight = 1.2;
          else if (lead === 'aVL') tHeight = 1.0;
          value += gaussian(normalizedT, 0.52, 0.03, tHeight);
        }
        break;
      }

      case 'hypokalemia':
        value = generateNormalComplex(normalizedT, amp);
        value -= gaussian(normalizedT, 0.45, 0.05, 0.2 * amp.t);
        value += gaussian(normalizedT, 0.6, 0.04, 0.25 * amp.t);
        value -= 0.08 * gaussian(normalizedT, 0.35, 0.1, 1);
        break;

      case 'pe':
        value = generateNormalComplex(normalizedT, amp);
        if (lead === 'I') value -= gaussian(normalizedT, 0.3, 0.015, 0.3);
        if (lead === 'III') { value -= gaussian(normalizedT, 0.26, 0.01, 0.25); value -= gaussian(normalizedT, 0.45, 0.05, 0.2); }
        if (['V1', 'V2', 'V3'].includes(lead)) value -= gaussian(normalizedT, 0.45, 0.05, 0.4);
        break;

      case 'pericarditis':
        // PR depression in most leads, PR elevation in aVR
        if (lead === 'aVR') {
          value += 0.05 * gaussian(normalizedT, 0.15, 0.05, 1); // PR elevation in aVR
        } else {
          value -= 0.05 * gaussian(normalizedT, 0.15, 0.05, 1); // PR depression
        }
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        value -= gaussian(normalizedT, 0.26, 0.008, 0.1 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.28, 0.012, 1.0 * amp.qrs);
        value -= gaussian(normalizedT, 0.3, 0.01, 0.25 * Math.abs(amp.qrs));
        // ST elevation in most leads, depression in aVR and V1
        if (lead === 'aVR') {
          value -= 0.15 * gaussian(normalizedT, 0.35, 0.12, 1);
        } else if (lead === 'V1') {
          value -= 0.05 * gaussian(normalizedT, 0.35, 0.12, 1); // Minimal/no elevation in V1
        } else {
          value += 0.15 * gaussian(normalizedT, 0.35, 0.12, 1);
        }
        value += gaussian(normalizedT, 0.5, 0.05, 0.3 * amp.t);
        break;

      case 'wpw':
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        value += gaussian(normalizedT, 0.2, 0.03, 0.3 * amp.qrs);
        value += gaussian(normalizedT, 0.26, 0.015, 0.8 * amp.qrs);
        value -= gaussian(normalizedT, 0.3, 0.012, 0.2 * Math.abs(amp.qrs));
        value -= gaussian(normalizedT, 0.45, 0.05, 0.2 * amp.t);
        break;

      case 'lgl':
        // Lown-Ganong-Levine: Short PR, normal QRS, NO delta wave
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p); // Normal P wave
        // Short PR - QRS starts earlier (at 0.18 instead of 0.26)
        value -= gaussian(normalizedT, 0.18, 0.008, 0.1 * Math.abs(amp.qrs)); // Q wave
        value += gaussian(normalizedT, 0.20, 0.012, 1.0 * amp.qrs); // R wave - narrow, no delta
        value -= gaussian(normalizedT, 0.22, 0.01, 0.25 * Math.abs(amp.qrs)); // S wave
        value += gaussian(normalizedT, 0.38, 0.05, 0.3 * amp.t); // Normal T wave
        break;

      case 'long_qt':
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        value -= gaussian(normalizedT, 0.26, 0.008, 0.1 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.28, 0.012, 1.0 * amp.qrs);
        value -= gaussian(normalizedT, 0.3, 0.01, 0.25 * Math.abs(amp.qrs));
        // Prolonged QT with broad, bifid T wave
        value += gaussian(normalizedT, 0.52, 0.06, 0.25 * amp.t);
        value += gaussian(normalizedT, 0.62, 0.05, 0.3 * amp.t);
        break;

      case 'tamponade': {
        // Cardiac tamponade: low voltage + electrical alternans
        const beatNumber = Math.floor(time / cycleLength);
        const alternans = beatNumber % 2 === 0 ? 1.0 : 0.6; // Alternating amplitude
        const lowVoltage = 0.5; // Reduced overall amplitude
        
        value += gaussian(normalizedT, 0.1, 0.025, 0.12 * amp.p * lowVoltage); // Low voltage P
        value -= gaussian(normalizedT, 0.26, 0.008, 0.08 * Math.abs(amp.qrs) * lowVoltage * alternans);
        value += gaussian(normalizedT, 0.28, 0.012, 0.8 * amp.qrs * lowVoltage * alternans); // Alternating QRS
        value -= gaussian(normalizedT, 0.30, 0.01, 0.2 * Math.abs(amp.qrs) * lowVoltage * alternans);
        value += gaussian(normalizedT, 0.45, 0.05, 0.2 * amp.t * lowVoltage * alternans);
        break;
      }

      case 'early_repol': {
        // Early repolarization: J-point elevation with fishhook, concave ST
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p); // P wave
        value -= gaussian(normalizedT, 0.26, 0.008, 0.1 * Math.abs(amp.qrs)); // Q wave
        value += gaussian(normalizedT, 0.28, 0.012, 1.0 * amp.qrs); // R wave
        value -= gaussian(normalizedT, 0.30, 0.01, 0.25 * Math.abs(amp.qrs)); // S wave
        
        // J-point notch/elevation (fishhook) - most prominent in V2-V5
        const jPointAmp = ['V2', 'V3', 'V4', 'V5'].includes(lead) ? 0.25 :
                         ['V1', 'V6', 'I', 'II'].includes(lead) ? 0.15 : 0.08;
        value += gaussian(normalizedT, 0.32, 0.015, jPointAmp); // J-point notch
        
        // Concave upward ST elevation
        if (!['aVR', 'V1'].includes(lead)) {
          value += 0.1 * gaussian(normalizedT, 0.36, 0.06, 1); // Mild ST elevation
        }
        
        // Prominent upright T wave
        value += gaussian(normalizedT, 0.48, 0.055, 0.4 * amp.t);
        break;
      }

      case 'la_ra_reversal': {
        // LA-RA (Left Arm - Right Arm) reversal - most common error
        // Lead I inverted, aVR/aVL swapped, II/III swapped
        let reversedAmp = { ...amp };
        if (lead === 'I') {
          reversedAmp = { p: -amp.p, qrs: -amp.qrs, t: -amp.t };
        } else if (lead === 'aVR') {
          reversedAmp = leadAmplitudes['aVL'];
        } else if (lead === 'aVL') {
          reversedAmp = leadAmplitudes['aVR'];
        } else if (lead === 'II') {
          reversedAmp = leadAmplitudes['III'];
        } else if (lead === 'III') {
          reversedAmp = leadAmplitudes['II'];
        }
        value = generateNormalComplex(normalizedT, reversedAmp);
        break;
      }

      case 'la_ll_reversal': {
        // LA-LL (Left Arm - Left Leg) reversal
        // Lead III flat, I and II similar, aVL/aVF swapped
        let reversedAmp = { ...amp };
        if (lead === 'III') {
          reversedAmp = { p: 0.1, qrs: 0.1, t: 0.1 }; // Nearly flat
        } else if (lead === 'II') {
          reversedAmp = leadAmplitudes['I'];
        } else if (lead === 'aVL') {
          reversedAmp = leadAmplitudes['aVF'];
        } else if (lead === 'aVF') {
          reversedAmp = leadAmplitudes['aVL'];
        }
        value = generateNormalComplex(normalizedT, reversedAmp);
        break;
      }

      case 'ra_ll_reversal': {
        // RA-LL (Right Arm - Left Leg) reversal
        // Lead II flat, I and III inverted, aVR/aVF swapped
        let reversedAmp = { ...amp };
        if (lead === 'II') {
          reversedAmp = { p: 0.1, qrs: 0.1, t: 0.1 }; // Nearly flat
        } else if (lead === 'I') {
          reversedAmp = { p: -amp.p, qrs: -amp.qrs, t: -amp.t };
        } else if (lead === 'III') {
          reversedAmp = { p: -amp.p, qrs: -amp.qrs, t: -amp.t };
        } else if (lead === 'aVR') {
          reversedAmp = leadAmplitudes['aVF'];
        } else if (lead === 'aVF') {
          reversedAmp = leadAmplitudes['aVR'];
        }
        value = generateNormalComplex(normalizedT, reversedAmp);
        break;
      }

      case 'precordial_reversal': {
        // V1-V2 precordial lead reversal
        let reversedAmp = { ...amp };
        if (lead === 'V1') {
          reversedAmp = leadAmplitudes['V2'];
        } else if (lead === 'V2') {
          reversedAmp = leadAmplitudes['V1'];
        }
        value = generateNormalComplex(normalizedT, reversedAmp);
        break;
      }

      default:
        value = generateNormalComplex(normalizedT, amp);
    }
    
    // Apply beat-to-beat amplitude variation
    value *= ampVariation;
    
    // Add artifact/noise if enabled
    if (artifactLvl > 0) {
      const artFactor = artifactLvl / 100;
      
      // Baseline wander (respiratory ~0.2-0.4 Hz) - DOUBLED
      const baselineWander = artFactor * 0.5 * (
        Math.sin(time * 0.25) * 0.5 +
        Math.sin(time * 0.4) * 0.3 +
        Math.sin(time * 0.15) * 0.2
      );
      
      // Slow drift (very low frequency baseline shift) - DOUBLED
      const slowDrift = artFactor * 0.3 * Math.sin(time * 0.08);
      
      // Muscle artifact / EMG noise (high frequency tremor) - TRIPLED
      const muscleArtifact = artFactor * 0.35 * (
        Math.sin(time * 47) * 0.25 +
        Math.sin(time * 63) * 0.2 +
        Math.sin(time * 89) * 0.2 +
        Math.sin(time * 37) * 0.15 +
        Math.sin(time * 113) * 0.1 +
        Math.sin(time * 157) * 0.1
      );
      
      // 60Hz interference (power line) - QUADRUPLED
      const powerLine = artFactor * 0.15 * Math.sin(time * 60 * 2 * Math.PI);
      
      // Random high-frequency noise - TRIPLED
      const randomNoise = artFactor * 0.18 * (Math.random() - 0.5);
      
      // Electrode contact noise (scratchy appearance)
      const contactNoise = artFactor * 0.1 * (
        Math.random() * Math.sin(time * 200) +
        Math.random() * Math.sin(time * 350) * 0.5
      );
      
      // Occasional baseline jumps/shifts (electrode movement) - MORE FREQUENT
      const jumpPhase1 = Math.sin(time * 0.5);
      const jumpPhase2 = Math.sin(time * 0.7);
      const baselineJump = artFactor * 0.25 * (
        (jumpPhase1 > 0.92 ? 1 : jumpPhase1 < -0.92 ? -1 : 0) +
        (jumpPhase2 > 0.94 ? 0.7 : jumpPhase2 < -0.94 ? -0.7 : 0)
      );
      
      // Motion artifact spikes (sharp deflections) - MORE FREQUENT & LARGER
      const motionSpike = artFactor * 0.5 * (
        (Math.sin(time * 1.7) > 0.96 ? (Math.random() - 0.5) * 2 : 0) +
        (Math.sin(time * 2.3) > 0.95 ? (Math.random() - 0.5) * 2 : 0) +
        (Math.sin(time * 3.1) > 0.97 ? (Math.random() - 0.5) * 1.5 : 0)
      );
      
      // Intermittent electrode disconnect (brief flatline segments)
      const disconnectPhase = Math.sin(time * 0.3);
      const electrodeDisconnect = (disconnectPhase > 0.98) ? -value * artFactor * 0.8 : 0;
      
      value += baselineWander + slowDrift + muscleArtifact + powerLine + randomNoise + contactNoise + baselineJump + motionSpike + electrodeDisconnect;
    }
    
    return value;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Pink/salmon background like real EKG paper
    ctx.fillStyle = '#fff5f5';
    ctx.fillRect(0, 0, width, height);

    // Header area with white background
    const headerHeight = 50;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, headerHeight);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, headerHeight);
    ctx.lineTo(width, headerHeight);
    ctx.stroke();

    // Get intervals
    const effectiveHR = getEffectiveHR();
    const intervals = getIntervals(pathology, effectiveHR);

    // Draw header text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(pathologies[pathology].name, 10, 18);
    
    ctx.font = '11px Arial';
    const formatInterval = (val, unit = 'ms') => val !== null ? `${val}${unit}` : '---';
    const formatAxis = (val) => val !== null ? `${val}°` : '---';
    
    // Calculate RR interval
    const rrInterval = effectiveHR > 0 ? Math.round(60000 / effectiveHR) : null;
    
    // Two rows of interval data
    ctx.fillText(`HR: ${effectiveHR} bpm`, 10, 35);
    ctx.fillText(`RR: ${formatInterval(rrInterval)}`, 110, 35);
    ctx.fillText(`PR: ${formatInterval(intervals.pr)}`, 210, 35);
    ctx.fillText(`QRS: ${formatInterval(intervals.qrs)}`, 310, 35);
    ctx.fillText(`QT: ${formatInterval(intervals.qt)}`, 410, 35);
    ctx.fillText(`QTc: ${formatInterval(intervals.qtc)}`, 510, 35);
    ctx.fillText(`Axis: ${formatAxis(intervals.axis)}`, 610, 35);

    // Normal ranges reference
    ctx.fillStyle = '#666';
    ctx.font = '9px Arial';
    ctx.fillText('Normal: PR 120-200 | QRS <120 | QTc <450(M)/<460(F) | Axis -30 to +90', 720, 35);

    // Adjust grid area to account for header
    const gridStartY = headerHeight;

    // Draw grid - small squares (1mm)
    ctx.strokeStyle = '#ffcccc';
    ctx.lineWidth = 0.5;
    const smallGrid = 4;
    for (let x = 0; x <= width; x += smallGrid) {
      ctx.beginPath(); ctx.moveTo(x, gridStartY); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = gridStartY; y <= height; y += smallGrid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Large squares (5mm)
    ctx.strokeStyle = '#ff9999';
    ctx.lineWidth = 1;
    const largeGrid = 20;
    for (let x = 0; x <= width; x += largeGrid) {
      ctx.beginPath(); ctx.moveTo(x, gridStartY); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = gridStartY; y <= height; y += largeGrid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Layout: 4 columns, 3 rows + rhythm strip
    const leads = [
      ['I', 'aVR', 'V1', 'V4'],
      ['II', 'aVL', 'V2', 'V5'],
      ['III', 'aVF', 'V3', 'V6']
    ];
    
    const colWidth = width / 4;
    const gridHeight = height - gridStartY;
    const rowHeight = (gridHeight - 100) / 3;
    const duration = 2.5; // seconds per strip

    // Draw each lead - allow vertical bleed between rows but not into header/footer
    const gridBottomY = height - 25; // Allow bleed almost to bottom, footer will draw over
    
    leads.forEach((row, rowIndex) => {
      row.forEach((lead, colIndex) => {
        const startX = colIndex * colWidth;
        const startY = gridStartY + rowIndex * rowHeight;
        const centerY = startY + rowHeight / 2;

        // Lead label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(lead, startX + 5, startY + 15);

        // Draw waveform with clipping only for header - allow vertical bleed between rows
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, gridStartY, width, gridBottomY - gridStartY);
        ctx.clip();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const pixelsPerSecond = (colWidth - 25) / duration;
        for (let px = 0; px < colWidth - 25; px++) {
          const t = px / pixelsPerSecond;
          const value = generateWaveform(lead, t, pathology, effectiveHR, artifactLevel, rrVariability, waveIrregularity, waveWidth);
          const x = startX + 20 + px;
          const y = centerY - value * 40;
          if (px === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      });
    });

    // Rhythm strip (Lead II) at bottom
    const rhythmY = height - 90;
    
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('II', 5, rhythmY + 15);

    // Long rhythm strip - clip only at very bottom for footer text
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, rhythmY - 40, width, 110); // Allow plenty of vertical room
    ctx.clip();
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const rhythmDuration = 10;
    const rhythmPixelsPerSecond = (width - 25) / rhythmDuration;
    for (let px = 0; px < width - 25; px++) {
      const t = px / rhythmPixelsPerSecond;
      const value = generateWaveform('II', t, pathology, effectiveHR, artifactLevel, rrVariability, waveIrregularity, waveWidth);
      const x = 20 + px;
      const y = rhythmY + 40 - value * 40;
      if (px === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Footer info
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.fillText('25mm/s  |  10mm/mV  |  Educational Simulation Only', 10, height - 8);

  }, [pathology, heartRate, artifactLevel, rrVariability, waveIrregularity, waveWidth]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">12-Lead EKG Simulator</h1>
        
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium mb-1">Pathology</label>
              <select
                value={pathology}
                onChange={(e) => setPathology(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white"
              >
                {Object.entries(pathologies).map(([key, { name }]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <div className="w-64">
              <label className="block text-sm font-medium mb-1">
                Heart Rate: {getEffectiveHR()} bpm <span className="text-gray-500 text-xs">{getHRRangeHint()}</span>
              </label>
              <input
                type="range"
                min="20"
                max="250"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full"
                disabled={['vfib', 'asystole'].includes(pathology)}
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">
                Artifact: {artifactLevel}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={artifactLevel}
                onChange={(e) => setArtifactLevel(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">
                R-R Variability: {rrVariability}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={rrVariability}
                onChange={(e) => setRrVariability(Number(e.target.value))}
                className="w-full"
                disabled={['vfib', 'asystole', 'afib'].includes(pathology)}
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">
                Wave Variation: {waveIrregularity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={waveIrregularity}
                onChange={(e) => setWaveIrregularity(Number(e.target.value))}
                className="w-full"
                disabled={['vfib', 'asystole'].includes(pathology)}
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">
                Wave Width: {waveWidth}% <span className="text-gray-500 text-xs">(wider=rounder)</span>
              </label>
              <input
                type="range"
                min="50"
                max="400"
                value={waveWidth}
                onChange={(e) => setWaveWidth(Number(e.target.value))}
                className="w-full"
                disabled={['vfib', 'asystole'].includes(pathology)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-2 overflow-x-auto">
          <canvas
            ref={canvasRef}
            width={1000}
            height={650}
            className="mx-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-4 mt-4">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{pathologies[pathology].name} - Key Characteristics</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {pathologies[pathology].findings.map((finding, index) => (
              <li key={index}>{finding}</li>
            ))}
          </ul>
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-2">Educational simulation only</p>
      </div>
    </div>
  );
};

export default EKGPrintout;
