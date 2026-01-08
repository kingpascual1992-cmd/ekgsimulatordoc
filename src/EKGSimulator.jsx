import React, { useState, useEffect, useRef } from 'react';

const EKGPrintout = () => {
  const [pathology, setPathology] = useState('normal');
  const [heartRate, setHeartRate] = useState(75);
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
      findings: ['Sawtooth flutter waves (F waves) best seen in II, III, aVF', 'Atrial rate ~300 bpm', 'Regular or regularly irregular ventricular response', 'Usually 2:1 conduction (ventricular rate ~150)', 'No isoelectric baseline between F waves'],
    },
    svt: {
      name: 'SVT (AVNRT)',
      findings: ['Regular narrow complex tachycardia', 'Rate typically 150-250 bpm', 'P waves absent, buried in QRS, or retrograde after QRS', 'Abrupt onset and termination', 'May see pseudo-R\' in V1 or pseudo-S in inferior leads'],
    },
    vtach: {
      name: 'Ventricular Tachycardia',
      findings: ['Wide QRS complex >120ms', 'Regular rhythm, rate 100-250 bpm', 'AV dissociation (P waves march through)', 'Fusion and capture beats', 'Concordance in precordial leads', 'Northwest axis possible'],
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
      findings: ['Complete AV dissociation', 'P waves "march through" QRS complexes', 'Regular P-P and R-R intervals but unrelated', 'Escape rhythm: junctional (narrow, 40-60) or ventricular (wide, 20-40)', 'Atrial rate > ventricular rate'],
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
      findings: ['Peaked, narrow T waves (earliest sign, K+ >5.5)', 'Prolonged PR interval', 'Flattened or absent P waves', 'Widened QRS', 'Sine wave pattern (severe, K+ >8)', 'Can progress to VFib/asystole'],
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
  };

  const getEffectiveHR = () => {
    switch (pathology) {
      case 'sinus_brady': return Math.min(heartRate, 59);
      case 'sinus_tachy': return Math.max(heartRate, 101);
      case 'aflutter': return 150;
      case 'svt': return 180;
      case 'vtach': return 160;
      case 'third_degree': return 35;
      case 'pe': return Math.max(heartRate, 100); // Sinus tachycardia is most common finding
      default: return heartRate;
    }
  };

  const getIntervals = (pathology, hr) => {
    // Base PR varies with heart rate (shorter at higher rates)
    // Normal PR ranges from ~120ms at high HR to ~200ms at low HR
    let basePR = Math.round(200 - (hr - 50) * 0.5);
    basePR = Math.max(120, Math.min(200, basePR));
    
    let pr = basePR;
    let qrs = 88;
    // QT varies with heart rate (Bazett relationship) - base QT at 60bpm
    let baseQT = 400;
    let qt = Math.round(baseQT * Math.sqrt(60 / hr));
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
        qrs = 120;
        break;
      case 'third_degree':
        pr = null; // No consistent PR in complete block
        qrs = 140;
        qt = Math.round(480 * Math.sqrt(60 / hr));
        axis = -30;
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
        pr = Math.max(80, Math.min(120, pr));
        qrs = 130;
        break;
      case 'hyperkalemia':
        pr = basePR + 40;
        qrs = 140;
        break;
      case 'hypokalemia':
        qt = Math.round(480 * Math.sqrt(60 / hr));
        break;
      case 'long_qt':
        qt = Math.round(520 * Math.sqrt(60 / hr));
        break;
      case 'vtach':
        pr = null;
        qrs = 160;
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

  const generateWaveform = (lead, time, pathology, hr) => {
    const cycleLength = 60 / hr;
    const t = time % cycleLength;
    const normalizedT = t / cycleLength;

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

    const gaussian = (x, mean, sigma, amplitude) => 
      amplitude * Math.exp(-Math.pow(x - mean, 2) / (2 * sigma * sigma));

    const generateNormalComplex = (t, amp, prInterval = 0.16, qrsWidth = 0.08) => {
      let v = 0;
      v += gaussian(t, 0.1, 0.025, 0.15 * amp.p);
      v -= gaussian(t, 0.1 + prInterval, 0.008, 0.1 * Math.abs(amp.qrs));
      v += gaussian(t, 0.1 + prInterval + 0.02, 0.012, 1.0 * amp.qrs);
      v -= gaussian(t, 0.1 + prInterval + 0.04, 0.01, 0.25 * Math.abs(amp.qrs));
      v += gaussian(t, 0.1 + prInterval + qrsWidth + 0.16, 0.05, 0.3 * amp.t);
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

      case 'vtach':
        // Wide QRS monomorphic VT
        value -= gaussian(normalizedT, 0.15, 0.02, 0.2 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.2, 0.035, 1.2 * amp.qrs);
        value -= gaussian(normalizedT, 0.28, 0.025, 0.4 * Math.abs(amp.qrs));
        // T wave with appropriate discordance (opposite to QRS)
        const vtDiscordance = amp.qrs > 0 ? -0.35 : 0.35;
        value += gaussian(normalizedT, 0.45, 0.06, vtDiscordance);
        break;

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
          value = generateNormalComplex(normalizedT, amp, 0.2, 0.1);
        } else {
          value = gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        }
        break;
      }

      case 'third_degree': {
        // Atrial rate ~80 bpm, ventricular escape ~35 bpm
        const pPhase = (time * 1.33) % 1;
        const ventPhase = (time * 0.58) % 1;
        // P waves at regular atrial rate
        value = gaussian(pPhase, 0.1, 0.025, 0.15 * amp.p);
        // Wide QRS escape rhythm (ventricular origin)
        value -= gaussian(ventPhase, 0.2, 0.02, 0.15 * Math.abs(amp.qrs));
        value += gaussian(ventPhase, 0.25, 0.04, 1.0 * amp.qrs);
        value -= gaussian(ventPhase, 0.32, 0.025, 0.3 * Math.abs(amp.qrs));
        // T wave with appropriate discordance (opposite to QRS)
        const tDiscordance = amp.qrs > 0 ? -0.3 : 0.3;
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

      case 'anterior_stemi':
        value = generateNormalComplex(normalizedT, amp);
        if (['V1', 'V2', 'V3', 'V4'].includes(lead)) value += 0.25 * gaussian(normalizedT, 0.35, 0.15, 1);
        if (['II', 'III', 'aVF'].includes(lead)) value -= 0.1 * gaussian(normalizedT, 0.35, 0.15, 1);
        break;

      case 'inferior_stemi':
        value = generateNormalComplex(normalizedT, amp);
        if (['II', 'III', 'aVF'].includes(lead)) value += 0.25 * gaussian(normalizedT, 0.35, 0.15, 1);
        if (['I', 'aVL'].includes(lead)) value -= 0.15 * gaussian(normalizedT, 0.35, 0.15, 1);
        break;

      case 'lateral_stemi':
        value = generateNormalComplex(normalizedT, amp);
        if (['I', 'aVL', 'V5', 'V6'].includes(lead)) value += 0.2 * gaussian(normalizedT, 0.35, 0.15, 1);
        if (['II', 'III', 'aVF'].includes(lead)) value -= 0.1 * gaussian(normalizedT, 0.35, 0.15, 1);
        break;

      case 'posterior_stemi':
        value = generateNormalComplex(normalizedT, amp);
        if (['V1', 'V2', 'V3'].includes(lead)) {
          value -= 0.2 * gaussian(normalizedT, 0.35, 0.15, 1);
          value += gaussian(normalizedT, 0.28, 0.015, 0.4);
        }
        break;

      case 'hyperkalemia':
        value += gaussian(normalizedT, 0.1, 0.03, 0.05 * amp.p); // Flattened P
        value -= gaussian(normalizedT, 0.26, 0.02, 0.1 * Math.abs(amp.qrs)); // Widened QRS
        value += gaussian(normalizedT, 0.3, 0.035, 1.0 * amp.qrs);
        value -= gaussian(normalizedT, 0.38, 0.025, 0.3 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.5, 0.025, 0.9 * amp.t); // Tall, narrow peaked T
        break;

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

      case 'long_qt':
        value += gaussian(normalizedT, 0.1, 0.025, 0.15 * amp.p);
        value -= gaussian(normalizedT, 0.26, 0.008, 0.1 * Math.abs(amp.qrs));
        value += gaussian(normalizedT, 0.28, 0.012, 1.0 * amp.qrs);
        value -= gaussian(normalizedT, 0.3, 0.01, 0.25 * Math.abs(amp.qrs));
        // Prolonged QT with broad, bifid T wave
        value += gaussian(normalizedT, 0.52, 0.06, 0.25 * amp.t);
        value += gaussian(normalizedT, 0.62, 0.05, 0.3 * amp.t);
        break;

      default:
        value = generateNormalComplex(normalizedT, amp);
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

    // Draw each lead
    leads.forEach((row, rowIndex) => {
      row.forEach((lead, colIndex) => {
        const startX = colIndex * colWidth;
        const startY = gridStartY + rowIndex * rowHeight;
        const centerY = startY + rowHeight / 2;

        // Lead label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(lead, startX + 5, startY + 15);

        // Draw waveform
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const pixelsPerSecond = (colWidth - 25) / duration;
        for (let px = 0; px < colWidth - 25; px++) {
          const t = px / pixelsPerSecond;
          const value = generateWaveform(lead, t, pathology, effectiveHR);
          const x = startX + 20 + px;
          const y = centerY - value * 40;
          if (px === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    });

    // Rhythm strip (Lead II) at bottom
    const rhythmY = height - 90;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('II', 5, rhythmY + 15);

    // Long rhythm strip
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const rhythmDuration = 10;
    const rhythmPixelsPerSecond = (width - 25) / rhythmDuration;
    for (let px = 0; px < width - 25; px++) {
      const t = px / rhythmPixelsPerSecond;
      const value = generateWaveform('II', t, pathology, effectiveHR);
      const x = 20 + px;
      const y = rhythmY + 40 - value * 40;
      if (px === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Footer info
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.fillText('25mm/s  |  10mm/mV  |  Educational Simulation Only', 10, height - 8);

  }, [pathology, heartRate]);

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
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Heart Rate: {heartRate} bpm</label>
              <input
                type="range"
                min="30"
                max="200"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full"
                disabled={['aflutter', 'svt', 'vtach', 'vfib', 'third_degree', 'asystole', 'pe'].includes(pathology)}
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
