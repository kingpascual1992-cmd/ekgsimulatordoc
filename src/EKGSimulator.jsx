import React, { useState, useEffect, useRef } from 'react';

// Tooltip component with visible hover effect
const Tooltip = ({ children, text }) => {
  return (
    <div className="tooltip-container">
      {children}
      <div className="tooltip-text">{text}</div>
      <style>{`
        .tooltip-container {
          position: relative;
          display: inline-block;
          width: 100%;
        }
        .tooltip-text {
          visibility: hidden;
          opacity: 0;
          background-color: #1f2937;
          color: #fff;
          text-align: left;
          border-radius: 6px;
          padding: 8px 10px;
          position: absolute;
          z-index: 100;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 5px;
          font-size: 12px;
          line-height: 1.4;
          width: 220px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transition: opacity 0.2s, visibility 0.2s;
        }
        .tooltip-text::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #1f2937 transparent transparent transparent;
        }
        .tooltip-container:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

const EKGPrintout = () => {
  const [pathology, setPathology] = useState('normal');
  const [heartRate, setHeartRate] = useState(75);
  const [artifactLevel, setArtifactLevel] = useState(4); // Default 4%
  const [rrVariability, setRrVariability] = useState(5); // Default 5%
  const [waveIrregularity, setWaveIrregularity] = useState(5); // Default 5%
  const [waveHeight, setWaveHeight] = useState(100); // Default 100%, range 25-300%
  const [waveWidth, setWaveWidth] = useState(100); // Wave visual width (not timing), 50-200%
  
  // Interval controls (as percentages, 100% = normal) - GLOBAL timing
  const [prInterval, setPrInterval] = useState(100); // PR interval: 100% = 160ms normal
  const [qrsWidth, setQrsWidth] = useState(100); // QRS width: 100% = 90ms normal
  const [qtInterval, setQtInterval] = useState(100); // QT interval: 100% = normal for HR
  
  // Individual wave controls (0-300%, 100% = normal)
  const [pWaveAmp, setPWaveAmp] = useState(100);
  const [qWaveAmp, setQWaveAmp] = useState(100);
  const [rWaveAmp, setRWaveAmp] = useState(100);
  const [sWaveAmp, setSWaveAmp] = useState(100);
  const [tWaveAmp, setTWaveAmp] = useState(100);
  
  // ST segment controls (-100 to +100, 0 = isoelectric)
  const [stElevation, setStElevation] = useState(0);
  const [stDepression, setStDepression] = useState(0);
  const [jPointCurve, setJPointCurve] = useState(20); // Default 20% - minimal J-point smoothing for normal
  const [stSlope, setStSlope] = useState(0); // -100 to +100: negative=downsloping, 0=flat, positive=upsloping
  const [stConcavity, setStConcavity] = useState(0); // -100 to +100: controls R wave downslope steepness
  const [tWaveDescent, setTWaveDescent] = useState(0); // -100 to +100: controls T wave downslope steepness
  const [tWaveBiphasic, setTWaveBiphasic] = useState(0); // -100 to +100: controls biphasic T wave (neg=initial inversion, pos=terminal inversion)
  
  // Calculate interval values in ms for display
  const getIntervalValues = () => {
    const rr = Math.round(60000 / heartRate); // RR in ms
    const pr = Math.round(160 * (prInterval / 100)); // PR in ms (normal ~160ms)
    const qrs = Math.round(90 * (qrsWidth / 100)); // QRS in ms (normal ~90ms)
    const baseQT = 400 * Math.pow(rr / 1000, 0.5); // Bazett's baseline QT
    const qt = Math.round(baseQT * (qtInterval / 100)); // Adjusted QT
    const qtc = Math.round(qt / Math.pow(rr / 1000, 0.5)); // QTc using Bazett
    return { rr, pr, qrs, qt, qtc };
  };
  
  // Lead-specific adjustments
  const [selectedLead, setSelectedLead] = useState('All'); // Which lead to adjust
  const [leadOverrides, setLeadOverrides] = useState({}); // Per-lead parameter overrides
  
  const allLeads = ['All', 'I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  
  const canvasRef = useRef(null);
  
  // Get effective value for a parameter - checks lead override first, then global
  const getLeadValue = (lead, param, globalValue) => {
    if (leadOverrides[lead] && leadOverrides[lead][param] !== undefined) {
      return leadOverrides[lead][param];
    }
    return globalValue;
  };
  
  // Set a parameter value - either global or per-lead
  const setParamValue = (param, value, setter) => {
    if (selectedLead === 'All') {
      setter(value);
    } else {
      setLeadOverrides(prev => ({
        ...prev,
        [selectedLead]: {
          ...prev[selectedLead],
          [param]: value
        }
      }));
    }
  };
  
  // Get display value for a parameter (shows lead-specific if selected)
  const getDisplayValue = (param, globalValue) => {
    if (selectedLead === 'All') {
      return globalValue;
    }
    return leadOverrides[selectedLead]?.[param] ?? globalValue;
  };
  
  // Clear overrides for selected lead
  const clearLeadOverrides = () => {
    if (selectedLead !== 'All') {
      setLeadOverrides(prev => {
        const newOverrides = { ...prev };
        delete newOverrides[selectedLead];
        return newOverrides;
      });
    }
  };
  
  // Reset function to restore all defaults
  const resetAllSettings = () => {
    setHeartRate(75);
    setArtifactLevel(4);
    setRrVariability(5);
    setWaveIrregularity(5);
    setPrInterval(100);
    setQrsWidth(100);
    setQtInterval(100);
    setWaveHeight(100);
    setWaveWidth(100);
    setPWaveAmp(100);
    setQWaveAmp(100);
    setRWaveAmp(100);
    setSWaveAmp(100);
    setTWaveAmp(100);
    setStElevation(0);
    setStDepression(0);
    setJPointCurve(20);
    setStSlope(0);
    setStConcavity(0);
    setLeadOverrides({});
    setSelectedLead('All');
  };

  // Pathology-specific default presets (per-lead overrides)
  const pathologyPresets = {
    normal: {
      globals: {
        // Clean baseline NSR defaults
        prInterval: 100,
        qrsWidth: 100,
        qtInterval: 100,
        pWaveAmp: 100,
        qWaveAmp: 100,
        rWaveAmp: 100,
        sWaveAmp: 100,
        tWaveAmp: 100,
        stElevation: 0,
        stDepression: 0,
        jPointCurve: 20,
        stSlope: 0,
        stConcavity: 0,
        tWaveDescent: 0,
        tWaveBiphasic: 0,
        waveHeight: 100,
        waveWidth: 100
      },
      leads: {}
    },
    hyperkalemia: {
      globals: {
        // No global changes - all customization is per-lead
      },
      leads: {
        'I': { pWaveAmp: 157, qWaveAmp: 87, rWaveAmp: 31, sWaveAmp: 160, tWaveAmp: 33, stElevation: 86, stDepression: 24, jPointCurve: 300, stSlope: 8, waveHeight: 100, waveWidth: 200 },
        'aVR': { pWaveAmp: 300, qWaveAmp: 54, rWaveAmp: 0, sWaveAmp: 0, tWaveAmp: 3, stElevation: 70, stDepression: 10, jPointCurve: 281, stSlope: 26, waveHeight: 144, waveWidth: 200 },
        'V1': { pWaveAmp: 87, qWaveAmp: 215, rWaveAmp: 84, sWaveAmp: 61, tWaveAmp: 39, stElevation: 87, stDepression: 72, jPointCurve: 123, stSlope: -45, waveHeight: 126, waveWidth: 139 },
        'V2': { pWaveAmp: 74, qWaveAmp: 110, rWaveAmp: 131, sWaveAmp: 112, tWaveAmp: 65, stElevation: 69, stDepression: 36, jPointCurve: 90, stSlope: -64, waveHeight: 97, waveWidth: 120 },
        'V3': { pWaveAmp: 100, qWaveAmp: 100, rWaveAmp: 100, sWaveAmp: 205, tWaveAmp: 107, stElevation: 46, stDepression: 8, jPointCurve: 0, stSlope: 100, waveHeight: 94, waveWidth: 133 },
        'V4': { pWaveAmp: 58, qWaveAmp: 227, rWaveAmp: 25, sWaveAmp: 22, tWaveAmp: 82, stElevation: 24, stDepression: 100, jPointCurve: 300, stSlope: -29, waveHeight: 120, waveWidth: 173 },
        'V5': { pWaveAmp: 275, qWaveAmp: 239, rWaveAmp: 215, sWaveAmp: 30, tWaveAmp: 141, stElevation: 0, stDepression: 100, jPointCurve: 300, stSlope: -7, waveHeight: 83, waveWidth: 153 },
        'V6': { pWaveAmp: 227, qWaveAmp: 272, rWaveAmp: 181, sWaveAmp: 0, tWaveAmp: 144, stElevation: 51, stDepression: 100, jPointCurve: 266, stSlope: -11, stConcavity: 0, tWaveDescent: 100, waveHeight: 60, waveWidth: 111 },
        'II': { pWaveAmp: 227, qWaveAmp: 217, rWaveAmp: 136, sWaveAmp: 116, tWaveAmp: 24, stElevation: 46, stDepression: 2, jPointCurve: 210, stSlope: 6, waveHeight: 190, waveWidth: 139 },
        'III': { pWaveAmp: 100, qWaveAmp: 100, rWaveAmp: 100, sWaveAmp: 100, tWaveAmp: 39, stElevation: 72, stDepression: 0, jPointCurve: 20, stSlope: 0, waveHeight: 142, waveWidth: 100 },
        'aVL': { pWaveAmp: 169, qWaveAmp: 249, rWaveAmp: 104, sWaveAmp: 23, tWaveAmp: 23, stElevation: 19, stDepression: 10, jPointCurve: 0, stSlope: -41, waveHeight: 184, waveWidth: 200 },
        'aVF': { pWaveAmp: 100, qWaveAmp: 100, rWaveAmp: 100, sWaveAmp: 100, tWaveAmp: 67, stElevation: 87, stDepression: 23, jPointCurve: 186, stSlope: 0, waveHeight: 60, waveWidth: 121 }
      }
    },
    long_qt: {
      globals: {
        qtInterval: 140,    // Prolonged QT - 140% of normal
        sWaveAmp: 74,
        tWaveAmp: 41,
        stConcavity: 0,     // Normal R wave slope
        waveHeight: 57,
        waveWidth: 107
      },
      leads: {}
    },
    sinus_brady: {
      globals: {
        // Same as NSR but HR controlled separately
        prInterval: 100,
        qrsWidth: 100,
        qtInterval: 100,
        pWaveAmp: 100,
        qWaveAmp: 100,
        rWaveAmp: 100,
        sWaveAmp: 100,
        tWaveAmp: 100,
        stElevation: 0,
        stDepression: 0,
        jPointCurve: 20,
        stSlope: 0,
        stConcavity: 0,
        tWaveDescent: 0,
        tWaveBiphasic: 0,
        waveHeight: 100,
        waveWidth: 100
      },
      leads: {}
    },
    sinus_tachy: {
      globals: {
        // Same as NSR but HR controlled separately
        prInterval: 100,
        qrsWidth: 100,
        qtInterval: 100,
        pWaveAmp: 100,
        qWaveAmp: 100,
        rWaveAmp: 100,
        sWaveAmp: 100,
        tWaveAmp: 100,
        stElevation: 0,
        stDepression: 0,
        jPointCurve: 20,
        stSlope: 0,
        stConcavity: 0,
        tWaveDescent: 0,
        tWaveBiphasic: 0,
        waveHeight: 100,
        waveWidth: 100
      },
      leads: {}
    }
  };

  // Apply pathology-specific presets when pathology changes
  const applyPathologyPresets = (newPathology) => {
    const preset = pathologyPresets[newPathology];
    if (preset) {
      // Apply global settings if any
      if (preset.globals) {
        if (preset.globals.heartRate !== undefined) setHeartRate(preset.globals.heartRate);
        if (preset.globals.prInterval !== undefined) setPrInterval(preset.globals.prInterval);
        if (preset.globals.qrsWidth !== undefined) setQrsWidth(preset.globals.qrsWidth);
        if (preset.globals.qtInterval !== undefined) setQtInterval(preset.globals.qtInterval);
        if (preset.globals.pWaveAmp !== undefined) setPWaveAmp(preset.globals.pWaveAmp);
        if (preset.globals.qWaveAmp !== undefined) setQWaveAmp(preset.globals.qWaveAmp);
        if (preset.globals.rWaveAmp !== undefined) setRWaveAmp(preset.globals.rWaveAmp);
        if (preset.globals.sWaveAmp !== undefined) setSWaveAmp(preset.globals.sWaveAmp);
        if (preset.globals.tWaveAmp !== undefined) setTWaveAmp(preset.globals.tWaveAmp);
        if (preset.globals.stElevation !== undefined) setStElevation(preset.globals.stElevation);
        if (preset.globals.stDepression !== undefined) setStDepression(preset.globals.stDepression);
        if (preset.globals.jPointCurve !== undefined) setJPointCurve(preset.globals.jPointCurve);
        if (preset.globals.stSlope !== undefined) setStSlope(preset.globals.stSlope);
        if (preset.globals.stConcavity !== undefined) setStConcavity(preset.globals.stConcavity);
        if (preset.globals.tWaveDescent !== undefined) setTWaveDescent(preset.globals.tWaveDescent);
        if (preset.globals.tWaveBiphasic !== undefined) setTWaveBiphasic(preset.globals.tWaveBiphasic);
        if (preset.globals.waveHeight !== undefined) setWaveHeight(preset.globals.waveHeight);
        if (preset.globals.waveWidth !== undefined) setWaveWidth(preset.globals.waveWidth);
      }
      // Apply per-lead overrides
      if (preset.leads) {
        setLeadOverrides(preset.leads);
      }
    } else {
      // Clear lead overrides for pathologies without presets
      setLeadOverrides({});
      // Reset globals to defaults for pathologies without presets
      setPrInterval(100);
      setQrsWidth(100);
      setQtInterval(100);
      setPWaveAmp(100);
      setQWaveAmp(100);
      setRWaveAmp(100);
      setSWaveAmp(100);
      setTWaveAmp(100);
      setStElevation(0);
      setStDepression(0);
      setJPointCurve(20);
      setStSlope(0);
      setStConcavity(0);
      setTWaveDescent(0);
      setTWaveBiphasic(0);
      setWaveHeight(100);
      setWaveWidth(100);
    }
  };

  // Handler for pathology change
  const handlePathologyChange = (newPathology) => {
    setPathology(newPathology);
    applyPathologyPresets(newPathology);
  };

  const pathologies = {
    normal: {
      name: 'Normal Sinus Rhythm',
      findings: ['Regular rhythm with rate 60-100 bpm', 'Upright P wave in I, II, aVF (inverted in aVR)', 'PR interval 120-200ms', 'Narrow QRS <120ms', 'Each P wave followed by QRS'],
      references: [
        { name: 'LITFL - Normal Sinus Rhythm', url: 'https://litfl.com/normal-sinus-rhythm-ecg-library/' },
      ]
    },
    sinus_brady: {
      name: 'Sinus Bradycardia',
      findings: ['Regular rhythm with rate <60 bpm', 'Normal P wave morphology', 'Normal PR and QRS intervals', 'Common in athletes, sleep, or beta-blocker use'],
      references: [
        { name: 'LITFL - Sinus Bradycardia', url: 'https://litfl.com/sinus-bradycardia-ecg-library/' },
      ]
    },
    sinus_tachy: {
      name: 'Sinus Tachycardia',
      findings: ['Regular rhythm with rate >100 bpm', 'Normal P waves (may merge with preceding T wave)', 'Normal PR and QRS intervals', 'P wave may be hidden in T wave at high rates'],
      references: [
        { name: 'LITFL - Sinus Tachycardia', url: 'https://litfl.com/sinus-tachycardia-ecg-library/' },
      ]
    },
    afib: {
      name: 'Atrial Fibrillation',
      findings: ['Irregularly irregular R-R intervals', 'Absent P waves', 'Fibrillatory baseline (chaotic atrial activity)', 'Variable ventricular rate', 'Narrow QRS unless aberrant conduction'],
      references: [
        { name: 'LITFL - Atrial Fibrillation', url: 'https://litfl.com/atrial-fibrillation-ecg-library/' },
      ]
    },
    aflutter: {
      name: 'Atrial Flutter',
      findings: ['Sawtooth flutter waves (F waves) best seen in II, III, aVF', 'Atrial rate ~300 bpm', 'Variable AV block: 2:1 (150), 3:1 (100), 4:1 (75)', 'Regular or regularly irregular ventricular response', 'No isoelectric baseline between F waves'],
      references: [
        { name: 'LITFL - Atrial Flutter', url: 'https://litfl.com/atrial-flutter-ecg-library/' },
      ]
    },
    svt: {
      name: 'SVT (AVNRT)',
      findings: ['Regular narrow complex tachycardia', 'Rate typically 150-250 bpm', 'P waves absent, buried in QRS, or retrograde after QRS', 'Abrupt onset and termination', 'May see pseudo-R\' in V1 or pseudo-S in inferior leads'],
      references: [
        { name: 'LITFL - AVNRT', url: 'https://litfl.com/av-nodal-reentry-tachycardia-avnrt/' },
      ]
    },
    vtach: {
      name: 'Ventricular Tachycardia',
      findings: ['Wide QRS complex >120ms', 'Regular rhythm', 'Slow VT: 100-150 bpm, Fast VT: >150 bpm', 'AV dissociation (P waves march through)', 'Fusion and capture beats', 'Concordance in precordial leads'],
      references: [
        { name: 'LITFL - Ventricular Tachycardia', url: 'https://litfl.com/ventricular-tachycardia-monomorphic-ecg-library/' },
      ]
    },
    vfib: {
      name: 'Ventricular Fibrillation',
      findings: ['Chaotic, irregular waveform', 'No identifiable P waves, QRS, or T waves', 'Varying amplitude and frequency', 'No organized electrical activity', 'Coarse vs fine based on amplitude'],
      references: [
        { name: 'LITFL - Ventricular Fibrillation', url: 'https://litfl.com/ventricular-fibrillation-vf-ecg-library/' },
      ]
    },
    asystole: {
      name: 'Asystole',
      findings: ['Flat line - no electrical activity', 'Confirm in multiple leads', 'May see occasional P waves (ventricular standstill)', 'Rule out fine VFib', 'Check lead connections'],
      references: [
        { name: 'ACLS - Asystole', url: 'https://acls.com/free-resources/knowledge-base/pea-asystole/asystole' }
      ]
    },
    first_degree: {
      name: '1st Degree AV Block',
      findings: ['PR interval >200ms (>5 small squares)', 'Every P wave conducts to ventricle', 'Regular rhythm', 'Constant PR interval', 'Often benign, may be due to AV nodal disease or drugs'],
      references: [
        { name: 'LITFL - 1st Degree AV Block', url: 'https://litfl.com/first-degree-heart-block-ecg-library/' },
      ]
    },
    mobitz1: {
      name: '2nd Degree AV Block Type I (Wenckebach)',
      findings: ['Progressive PR prolongation until dropped QRS', 'Grouped beating pattern', 'Shortening R-R intervals before dropped beat', 'PR after pause is shortest', 'Usually AV nodal level - relatively benign'],
      references: [
        { name: 'LITFL - Mobitz I', url: 'https://litfl.com/av-block-2nd-degree-mobitz-i-wenckebach-phenomenon/' },
      ]
    },
    mobitz2: {
      name: '2nd Degree AV Block Type II',
      findings: ['Constant PR interval with intermittent dropped QRS', 'No PR prolongation before dropped beat', 'Often wide QRS (infranodal block)', 'May progress to complete heart block', 'Usually requires pacemaker'],
      references: [
        { name: 'LITFL - Mobitz II', url: 'https://litfl.com/av-block-2nd-degree-mobitz-ii-hay-block/' },
      ]
    },
    third_degree: {
      name: '3rd Degree (Complete) Heart Block',
      findings: ['Complete AV dissociation', 'P waves "march through" QRS complexes', 'Regular P-P and R-R intervals but unrelated', 'Junctional escape (≥40 bpm): narrow QRS, rate 40-60', 'Ventricular escape (<40 bpm): wide QRS, rate 20-40', 'Atrial rate > ventricular rate'],
      references: [
        { name: 'LITFL - Complete Heart Block', url: 'https://litfl.com/av-block-3rd-degree-complete-heart-block/' },
      ]
    },
    rbbb: {
      name: 'Right Bundle Branch Block',
      findings: ['QRS ≥120ms', 'RSR\' pattern in V1-V2 ("rabbit ears" or "M-shaped")', 'Wide slurred S wave in I, aVL, V5-V6', 'ST-T changes opposite to terminal QRS deflection', 'Normal axis'],
      references: [
        { name: 'LITFL - RBBB', url: 'https://litfl.com/right-bundle-branch-block-rbbb-ecg-library/' },
      ]
    },
    lbbb: {
      name: 'Left Bundle Branch Block',
      findings: ['QRS ≥120ms', 'Broad notched R wave in I, aVL, V5-V6', 'Deep QS or rS in V1-V3', 'Absence of Q waves in lateral leads', 'Appropriate discordance (ST opposite to QRS)', 'Cannot interpret ischemia normally - use Sgarbossa criteria'],
      references: [
        { name: 'LITFL - LBBB', url: 'https://litfl.com/left-bundle-branch-block-lbbb-ecg-library/' },
      ]
    },
    anterior_stemi: {
      name: 'Anterior STEMI',
      findings: ['ST elevation in V1-V4 (anterior leads)', 'Reciprocal ST depression in II, III, aVF', 'LAD territory - large area at risk', 'May see hyperacute T waves early', 'Q waves develop over hours-days'],
      references: [
        { name: 'LITFL - Anterior STEMI', url: 'https://litfl.com/anterior-myocardial-infarction-ecg-library/' },
      ]
    },
    inferior_stemi: {
      name: 'Inferior STEMI',
      findings: ['ST elevation in II, III, aVF', 'Reciprocal ST depression in I, aVL', 'Usually RCA occlusion (III > II suggests RCA)', 'Check V4R for RV involvement', 'Watch for bradycardia and heart blocks'],
      references: [
        { name: 'LITFL - Inferior STEMI', url: 'https://litfl.com/inferior-stemi-ecg-library/' },
      ]
    },
    lateral_stemi: {
      name: 'Lateral STEMI',
      findings: ['ST elevation in I, aVL, V5-V6', 'Reciprocal ST depression in II, III, aVF', 'Circumflex or diagonal branch occlusion', 'High lateral (I, aVL) may be subtle', 'Often accompanies anterior or inferior STEMI'],
      references: [
        { name: 'LITFL - Lateral STEMI', url: 'https://litfl.com/lateral-stemi-ecg-library/' },
      ]
    },
    posterior_stemi: {
      name: 'Posterior STEMI',
      findings: ['ST depression in V1-V3 (reciprocal changes)', 'Tall, broad R waves in V1-V3 (Q wave equivalent)', 'Upright T waves in V1-V3', 'ST elevation in V7-V9 (posterior leads)', 'Often occurs with inferior STEMI'],
      references: [
        { name: 'LITFL - Posterior STEMI', url: 'https://litfl.com/posterior-myocardial-infarction-ecg-library/' },
      ]
    },
    hyperkalemia: {
      name: 'Hyperkalemia',
      findings: ['Tall, peaked, narrow "tented" T waves (most dramatic in V2-V3)', 'T wave height may exceed QRS amplitude', 'Mildly widened QRS', 'Flattened P waves', 'Shortened QT interval', 'Can progress to sine wave → VFib/asystole if untreated'],
      references: [
        { name: 'LITFL - Hyperkalemia', url: 'https://litfl.com/hyperkalaemia-ecg-library/' },
      ]
    },
    hypokalemia: {
      name: 'Hypokalemia',
      findings: ['Flattened T waves', 'ST depression', 'Prominent U waves (follows T wave)', 'Prolonged QU interval', 'T-U fusion at severe levels', 'Increased risk of arrhythmias'],
      references: [
        { name: 'LITFL - Hypokalemia', url: 'https://litfl.com/hypokalaemia-ecg-library/' },
      ]
    },
    pe: {
      name: 'Pulmonary Embolism',
      findings: ['Sinus tachycardia (most common finding)', 'S1Q3T3 pattern (S in I, Q and inverted T in III)', 'Right heart strain: T wave inversions V1-V4', 'Right axis deviation', 'New incomplete or complete RBBB', 'Atrial fibrillation'],
      references: [
        { name: 'LITFL - Pulmonary Embolism', url: 'https://litfl.com/ecg-changes-in-pulmonary-embolism/' },
      ]
    },
    pericarditis: {
      name: 'Pericarditis',
      findings: ['Diffuse ST elevation with upward concavity', 'PR depression (most specific finding)', 'ST elevation in most leads except aVR and V1', 'PR elevation in aVR', 'No reciprocal ST changes', 'Spodick sign (downsloping TP segment)'],
      references: [
        { name: 'LITFL - Pericarditis', url: 'https://litfl.com/pericarditis-ecg-library/' },
      ]
    },
    wpw: {
      name: 'WPW Syndrome',
      findings: ['Short PR interval <120ms', 'Delta wave (slurred QRS upstroke)', 'Wide QRS >100ms', 'Secondary ST-T changes', 'Pseudo-infarct patterns possible', 'Risk of rapid conduction in AFib'],
      references: [
        { name: 'LITFL - WPW', url: 'https://litfl.com/wolff-parkinson-white-wpw-syndrome-ecg-library/' },
      ]
    },
    long_qt: {
      name: 'Long QT Syndrome',
      findings: ['Prolonged QTc (>450ms men, >460ms women)', 'Abnormal T wave morphology', 'T wave notching or bifid T waves', 'Risk of Torsades de Pointes', 'May be congenital or acquired (drugs, electrolytes)'],
      references: [
        { name: 'LITFL - Long QT', url: 'https://litfl.com/qt-interval-ecg-library/' },
      ]
    },
    tamponade: {
      name: 'Cardiac Tamponade',
      findings: ['Low voltage QRS (<5mm in limb leads, <10mm in precordial)', 'Electrical alternans (alternating QRS amplitude)', 'Sinus tachycardia', 'May see PR depression', 'Beck\'s triad: hypotension, JVD, muffled heart sounds'],
      references: [
        { name: 'LITFL - Pericardial Effusion', url: 'https://litfl.com/ecg-findings-in-massive-pericardial-effusion/' },
      ]
    },
    lgl: {
      name: 'Lown-Ganong-Levine (LGL)',
      findings: ['Short PR interval (<120ms)', 'Normal QRS duration (<120ms)', 'NO delta wave (unlike WPW)', 'Bypass tract connects atria to bundle of His', 'Risk of SVT'],
      references: [
        { name: 'LITFL - LGL Syndrome', url: 'https://litfl.com/lown-ganong-levine-syndrome/' },
        { name: 'Radiopaedia - LGL', url: 'https://radiopaedia.org/articles/lown-ganong-levine-syndrome' }
      ]
    },
    early_repol: {
      name: 'Early Repolarization',
      findings: ['J-point elevation (1-4mm)', 'Concave upward ST elevation', 'Notched or slurred J-point ("fishhook")', 'Most prominent in V2-V5', 'Common in young athletes - usually benign', 'Diffuse pattern - not localized to coronary territory'],
      references: [
        { name: 'LITFL - Early Repolarization', url: 'https://litfl.com/benign-early-repolarisation-ecg-library/' },
      ]
    },
    la_ra_reversal: {
      name: 'LA-RA Lead Reversal',
      findings: ['Lead I completely inverted (most obvious clue)', 'aVR and aVL appear switched', 'Lead II and III appear switched', 'Inverted P wave in lead I', 'Precordial leads normal', 'Most common lead reversal error'],
      references: [
        { name: 'LITFL - Lead Reversal', url: 'https://litfl.com/ecg-lead-reversal/' },
      ]
    },
    la_ll_reversal: {
      name: 'LA-LL Lead Reversal',
      findings: ['Lead III nearly flat/isoelectric', 'Lead I and II appear similar', 'aVL and aVF appear switched', 'aVR relatively unchanged', 'Precordial leads normal', 'P wave changes in limb leads'],
      references: [
        { name: 'LITFL - Lead Reversal', url: 'https://litfl.com/ecg-lead-reversal/' },
      ]
    },
    ra_ll_reversal: {
      name: 'RA-LL Lead Reversal',
      findings: ['Lead II nearly flat/isoelectric', 'Lead I and III inverted', 'aVR and aVF appear switched', 'aVL relatively unchanged', 'Precordial leads normal', 'Creates bizarre axis'],
      references: [
        { name: 'LITFL - Lead Reversal', url: 'https://litfl.com/ecg-lead-reversal/' },
      ]
    },
    precordial_reversal: {
      name: 'V1-V2 Precordial Reversal',
      findings: ['Loss of normal R wave progression', 'V1 and V2 appear switched', 'V1 may show larger R wave than expected', 'Limb leads normal', 'Can mimic pathology if not recognized', 'Check electrode placement'],
      references: [
        { name: 'LITFL - Lead Reversal', url: 'https://litfl.com/ecg-lead-reversal/' },
      ]
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
    // Base intervals from user controls (percentage of normal)
    // PR: 160ms base * prInterval/100
    // QRS: 90ms base * qrsWidth/100
    // QT: varies with HR, modified by qtInterval/100
    
    let basePR = Math.round(160 * (prInterval / 100));
    let baseQRS = Math.round(90 * (qrsWidth / 100));
    
    // QT varies with heart rate - using physiological relationship
    // Base QT at 60 bpm is ~400ms, scales with sqrt(RR)
    const rrSeconds = 60 / hr;
    let baseQT = Math.round(400 * Math.sqrt(rrSeconds) * (qtInterval / 100));
    
    let pr = basePR;
    let qrs = baseQRS;
    let qt = baseQT;
    let axis = 60; // Normal axis in degrees

    // Pathology-specific modifications (additive/multiplicative adjustments)
    switch (pathology) {
      case 'first_degree':
        pr = pr + 80; // Add prolongation
        break;
      case 'mobitz1':
        pr = pr + 40; // Average of progressive PR
        break;
      case 'mobitz2':
        pr = pr + 30;
        qrs = Math.max(qrs, 120); // At least 120ms (infranodal block)
        break;
      case 'third_degree':
        pr = null; // No consistent PR in complete block
        // Junctional escape (40-60) = narrow QRS, Ventricular escape (20-40) = wide QRS
        qrs = hr >= 40 ? qrs : Math.max(qrs, 140);
        axis = hr >= 40 ? 0 : -30;
        break;
      case 'rbbb':
        qrs = Math.max(qrs, 120);
        axis = 60;
        break;
      case 'lbbb':
        qrs = Math.max(qrs, 140);
        axis = -45;
        break;
      case 'wpw':
        pr = Math.round(pr * 0.65); // Short PR
        pr = Math.max(70, Math.min(119, pr));
        qrs = Math.max(qrs, 110);
        break;
      case 'lgl':
        pr = Math.round(pr * 0.55); // Very short PR
        pr = Math.max(70, Math.min(100, pr));
        break;
      case 'hyperkalemia':
        pr = pr + 15;
        qrs = Math.max(qrs, Math.round(qrs * 1.15));
        break;
      case 'hypokalemia':
        qt = Math.round(qt * 1.2);
        break;
      case 'long_qt':
        qt = Math.round(qt * 1.35);
        break;
      case 'vtach':
        pr = null;
        qrs = Math.max(qrs, 160); // Very wide QRS
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
      qtc = Math.round(qt / Math.sqrt(rrSeconds));
    }

    return { pr, qrs, qt, qtc, axis };
  };

  const generateWaveform = (lead, time, pathology, hr, artifactLvl = 0, rrVar = 0, waveIrreg = 0, prInt = 100, qrsWd = 100, qtInt = 100, waveHt = 100, waveWd = 100, pAmp = 100, qAmp = 100, rAmp = 100, sAmp = 100, tAmp = 100, stElev = 0, stDepr = 0, jCurve = 50, stSl = 0, stConc = 0, tDesc = 0, tBi = 0, overrides = {}) => {
    // Check for lead-specific overrides (intervals are global, not per-lead)
    const lo = overrides[lead] || {};
    const effectivePAmp = lo.pWaveAmp ?? pAmp;
    const effectiveQAmp = lo.qWaveAmp ?? qAmp;
    const effectiveRAmp = lo.rWaveAmp ?? rAmp;
    const effectiveSAmp = lo.sWaveAmp ?? sAmp;
    const effectiveTAmp = lo.tWaveAmp ?? tAmp;
    const effectiveStElev = lo.stElevation ?? stElev;
    const effectiveStDepr = lo.stDepression ?? stDepr;
    const effectiveJCurve = lo.jPointCurve ?? jCurve;
    const effectiveWaveHt = lo.waveHeight ?? waveHt;
    const effectiveWaveWd = lo.waveWidth ?? waveWd; // Visual width (per-lead)
    const effectiveStSlope = lo.stSlope ?? stSl;
    const effectiveStConcavity = lo.stConcavity ?? stConc;
    const effectiveTWaveDescent = lo.tWaveDescent ?? tDesc;
    const effectiveTWaveBiphasic = lo.tWaveBiphasic ?? tBi;
    
    // Interval scaling factors (100% = normal) - GLOBAL timing, not per-lead
    const prScale = prInt / 100; // PR interval scale (timing)
    const qrsScale = qrsWd / 100; // QRS duration scale (timing)
    const qtScale = qtInt / 100; // QT interval scale (timing)
    
    // Visual width scale - affects wave appearance (sigma), NOT timing
    // This is per-lead adjustable
    const widthScale = effectiveWaveWd / 100;
    
    // Global wave height scaling factor (25-300%)
    const heightScale = effectiveWaveHt / 100;
    
    // Individual wave scaling factors
    const pScale = effectivePAmp / 100;
    const qScale = effectiveQAmp / 100;
    const rScale = effectiveRAmp / 100;
    const sScale = effectiveSAmp / 100;
    const tScale = effectiveTAmp / 100;
    
    // ST segment shift (elevation positive, depression negative)
    const stShift = (effectiveStElev - effectiveStDepr) / 100;
    
    // J-point curve factor (0 = sharp, 100 = very curved)
    const jCurveFactor = effectiveJCurve / 100;
    
    // ST slope factor (-100 = downsloping, 0 = flat, +100 = upsloping)
    const stSlopeFactor = effectiveStSlope / 100;
    
    // R wave descent factor (-100 = steep/sharp descent, 0 = symmetric, +100 = gradual/slurred descent)
    const rDescentFactor = effectiveStConcavity / 100;
    
    // T wave descent factor (-100 = steep/sharp descent, 0 = symmetric, +100 = gradual/prolonged descent)
    const tDescentFactor = effectiveTWaveDescent / 100;
    
    // T wave biphasic factor (-100 = negative-then-positive, 0 = monophasic, +100 = positive-then-negative/terminal inversion)
    const biphasicFactor = effectiveTWaveBiphasic / 100;
    
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

    // Lead amplitudes with separate R and S wave values for proper R wave progression
    // In precordials: V1 has small R, deep S; progresses to V6 with tall R, small S
    // Note: R uses addition (+), S uses subtraction (-), so positive S = downward deflection
    const leadAmplitudes = {
      'I': { p: 1, r: 1, s: 0.2, t: 1 },
      'II': { p: 1.2, r: 1.5, s: 0.2, t: 1.2 },
      'III': { p: 0.8, r: 0.8, s: 0.3, t: 0.8 },
      'aVR': { p: -0.8, r: 0.1, s: 1.0, t: -0.8 },  // Inverted: tiny r, deep S (positive s = downward), inverted T
      'aVL': { p: 0.5, r: 0.6, s: 0.2, t: 0.5 },
      'aVF': { p: 1, r: 1.1, s: 0.2, t: 1 },
      // Precordial R wave progression: V1→V6 shows increasing R, decreasing S
      // R waves boosted in V1-V4 for visible progression
      'V1': { p: 0.6, r: 0.30, s: 1.2, t: -0.2 },   // R at 200% (0.15*2), deep S, flat/inverted T
      'V2': { p: 0.7, r: 0.56, s: 1.4, t: 0.5 },   // R at 160% (0.35*1.6), large S
      'V3': { p: 0.8, r: 1.12, s: 0.8, t: 0.9 },   // R at 160% (0.7*1.6), transition zone
      'V4': { p: 0.8, r: 1.82, s: 0.4, t: 1.1 },   // R at 140% (1.3*1.4), R dominant
      'V5': { p: 0.8, r: 1.4, s: 0.2, t: 1.0 },    // Tall R, small S
      'V6': { p: 0.8, r: 1.2, s: 0.1, t: 0.9 },    // Tall R, minimal S
    };

    const amp = leadAmplitudes[lead] || { p: 1, r: 1, s: 0.25, t: 1 };
    let value = 0;

    // Gaussian with timing shift and width scaling (higher widthScale = wider, more rounded waves)
    const gaussian = (x, mean, sigma, amplitude) => 
      amplitude * Math.exp(-Math.pow(x - (mean + morphVariation), 2) / (2 * Math.pow(sigma * widthScale, 2)));

    // Asymmetric gaussian for R wave - descent factor controls downslope steepness
    // rDescentFactor: -1 = very steep descent, 0 = symmetric, +1 = very gradual/slurred descent (like WPW delta wave effect)
    const asymmetricGaussian = (x, mean, sigma, amplitude, descentFactor) => {
      const adjustedMean = mean + morphVariation;
      const adjustedSigma = sigma * widthScale;
      const xPos = x - adjustedMean;
      
      // Ascending side (before peak): use base sigma
      // Descending side (after peak): modify sigma based on descent factor
      // descentFactor < 0: smaller sigma = steeper/faster descent
      // descentFactor > 0: larger sigma = gentler/slower descent (slurred)
      const descentMultiplier = 1 + descentFactor * 0.7; // Range: 0.3 to 1.7
      const effectiveSigma = xPos <= 0 ? adjustedSigma : adjustedSigma * descentMultiplier;
      
      return amplitude * Math.exp(-Math.pow(xPos, 2) / (2 * Math.pow(effectiveSigma, 2)));
    };
    
    // Biphasic T wave generator
    // biphasicFactor: -1 = negative-then-positive (initial inversion)
    //                  0 = monophasic (normal)
    //                 +1 = positive-then-negative (terminal inversion, like Wellens)
    const biphasicTWave = (x, position, width, amplitude, tDescentFac, biphasicFac) => {
      // Primary T wave component
      const primaryT = asymmetricGaussian(x, position, width, amplitude, tDescentFac);
      
      // If no biphasic effect, return primary only
      if (Math.abs(biphasicFac) < 0.01) {
        return primaryT;
      }
      
      // Calculate secondary component
      const absEffect = Math.abs(biphasicFac);
      const secondaryAmp = -amplitude * absEffect * 0.7; // Opposite polarity, scaled by factor
      
      // Position offset for secondary component
      // Positive factor: terminal inversion (secondary comes AFTER primary)
      // Negative factor: initial inversion (secondary comes BEFORE primary)
      const offsetDirection = biphasicFac > 0 ? 1 : -1;
      const secondaryOffset = offsetDirection * width * 1.2;
      const secondaryPosition = position + secondaryOffset;
      const secondaryWidth = width * 0.8; // Slightly narrower secondary component
      
      const secondaryT = asymmetricGaussian(x, secondaryPosition, secondaryWidth, secondaryAmp, tDescentFac * 0.5);
      
      // Blend: reduce primary amplitude slightly as biphasic increases
      const primaryReduction = 1 - absEffect * 0.2;
      
      return primaryT * primaryReduction + secondaryT;
    };

    // Generate normal complex with smooth, realistic waves (not pointy)
    // Individual wave scales (pScale, qScale, rScale, sScale, tScale) are applied here
    // Timing is calculated dynamically to match displayed millisecond values
    // Optional overridePrMs and overrideQrsMs for pathology-specific timing
    const generateNormalComplex = (t, amp, overridePrMs = null, overrideQrsMs = null) => {
      // Calculate cycle length in ms for timing conversions
      const cycleLengthMs = 60000 / hr;
      
      // Use override values if provided, otherwise use user control values
      // PR: 160ms base * prInterval/100 (or override)
      // QRS: 90ms base * qrsWidth/100 (or override)
      const prMs = overridePrMs !== null ? overridePrMs : (160 * prScale);
      const qrsMs = overrideQrsMs !== null ? overrideQrsMs : (90 * qrsScale);
      const baseQtMs = 400 * Math.sqrt(60 / hr); // Bazett baseline
      const qtMs = baseQtMs * qtScale;
      
      // Convert to normalized time
      const scaledPrInterval = prMs / cycleLengthMs;
      const scaledQrsWidth = qrsMs / cycleLengthMs;
      const scaledQtInterval = qtMs / cycleLengthMs;
      
      // P wave start position (fixed at ~80ms from cycle start)
      const pStart = 80 / cycleLengthMs;
      
      let v = 0;
      // P wave - smooth and rounded (duration ~80-100ms)
      const pDuration = 80 / cycleLengthMs;
      v += gaussian(t, pStart + pDuration/2, pDuration/3 * qrsWidthVariation, 0.15 * amp.p * pAmpVariation * pScale);
      
      // QRS start position (P start + PR interval)
      const qrsStart = pStart + scaledPrInterval;
      
      // Q wave - small dip at QRS start (small in most leads, uses fraction of R wave)
      const qWidth = 20 / cycleLengthMs * (overrideQrsMs ? 1 : qrsScale);
      v -= gaussian(t, qrsStart + qWidth/2, qWidth/2 * qrsWidthVariation, 0.08 * amp.r * qScale);
      
      // R wave - main upward spike (uses amp.r for proper progression)
      // Using asymmetric gaussian: rDescentFactor controls downslope steepness
      const rPosition = qrsStart + (30 * (overrideQrsMs ? overrideQrsMs/90 : qrsScale)) / cycleLengthMs;
      const rWidth = 30 / cycleLengthMs * (overrideQrsMs ? overrideQrsMs/90 : qrsScale);
      v += asymmetricGaussian(t, rPosition, rWidth/2 * qrsWidthVariation, 1.0 * amp.r * rScale, rDescentFactor);
      
      // S wave - downward dip after R (uses amp.s for proper progression)
      const sPosition = qrsStart + (50 * (overrideQrsMs ? overrideQrsMs/90 : qrsScale)) / cycleLengthMs;
      const sWidth = 25 / cycleLengthMs * (overrideQrsMs ? overrideQrsMs/90 : qrsScale);
      v -= gaussian(t, sPosition, sWidth/2 * qrsWidthVariation, 1.0 * amp.s * sScale);
      
      // J-point (end of QRS)
      const jPoint = qrsStart + scaledQrsWidth;
      
      // ST segment end (J-point + ST segment duration, before T wave)
      const stDuration = (scaledQtInterval - scaledQrsWidth) * 0.4; // ST segment is ~40% of QT-QRS
      const stEnd = jPoint + stDuration;
      
      // J-point curve (smooth takeoff from QRS) - only adds amplitude when ST shift is present
      if (stShift !== 0) {
        const jPointSigma = (20 + jCurveFactor * 40) / cycleLengthMs;
        v += gaussian(t, jPoint, jPointSigma, stShift * 0.5);
      }
      
      // ST segment with slope and concavity control
      if (t > jPoint && t < stEnd) {
        const progress = (t - jPoint) / (stEnd - jPoint);
        let stValue = stShift * 0.4;
        
        // Apply slope (linear component)
        if (stSlopeFactor !== 0) {
          const slopeAdjust = stSlopeFactor * 0.3 * (progress - 0.5);
          stValue += slopeAdjust;
        }
        
        const edgeFactor = Math.sin(progress * Math.PI);
        v += stValue * edgeFactor;
      }
      
      // T wave - positioned at end of QT interval
      // Normal T wave duration ~120-160ms, gaussian sigma should be ~1/4 of that (~35ms)
      // T wave position scales with QT, but width should remain constant
      // Using biphasicTWave: tDescentFactor controls downslope steepness, biphasicFactor controls biphasic morphology
      const tPosition = qrsStart + scaledQtInterval * 0.85; // T wave peak at ~85% of QT
      const tWidth = 35 / cycleLengthMs; // ~35ms sigma for realistic narrow T wave (NOT scaled by qtScale)
      v += biphasicTWave(t, tPosition, tWidth * qrsWidthVariation, 0.3 * amp.t * tAmpVariation * tScale, tDescentFactor, biphasicFactor);
      
      return v;
    };

    switch (pathology) {
      case 'normal':
      case 'sinus_brady':
      case 'sinus_tachy':
        value = generateNormalComplex(normalizedT, amp);
        break;

      case 'afib': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const qrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        // AFib has no P waves, so no PR interval needed
        const qrsStart = 0.15; // Fixed early position for AFib
        const qrsStartNorm = qrsStart;
        const qrsDuration = qrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        const fibrillation = 0.03 * (Math.sin(time * 50) + Math.sin(time * 73) + Math.sin(time * 91)) / 3;
        const irregularity = Math.sin(time * 2.3) * 0.15;
        const adjustedT = (normalizedT + irregularity + 1) % 1;
        value = fibrillation;
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(adjustedT, qrsStartNorm + qWidth/2, qWidth/2, 0.08 * amp.r * qScale);
        
        // R wave - position scales with QRS
        const rPosition = qrsStartNorm + (30 * qrsScale) / cycleLengthMs;
        const rWidth = 30 / cycleLengthMs * qrsScale;
        value += asymmetricGaussian(adjustedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
        
        // S wave
        const sPosition = qrsStartNorm + (50 * qrsScale) / cycleLengthMs;
        const sWidth = 25 / cycleLengthMs * qrsScale;
        value -= gaussian(adjustedT, sPosition, sWidth/2, 1.0 * amp.s * sScale);
        
        // J-point
        const jPoint = qrsStartNorm + qrsDuration;
        if (jCurveFactor > 0) {
          value += gaussian(adjustedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
        }
        
        // T wave - position scales with QT
        const tPosition = qrsStartNorm + qtDuration * 0.85;
        const tWidth = 35 / cycleLengthMs;
        value += biphasicTWave(adjustedT, tPosition, tWidth, 0.3 * amp.t * tScale, tDescentFactor, biphasicFactor);
        break;
      }

      case 'aflutter': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const qrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        // Smooth, rounded flutter waves at ~300 bpm (5 per second)
        const flutterFreq = 5;
        const flutterPhase = time * flutterFreq * Math.PI * 2;
        
        // Create smooth rounded wave - asymmetric sine (slower descent, faster ascent)
        const smoothWave = -Math.sin(flutterPhase) * 0.6 - Math.sin(flutterPhase * 2) * 0.2;
        
        // Flutter waves more prominent in inferior leads (II, III, aVF)
        const flutterAmp = ['II', 'III', 'aVF'].includes(lead) ? 0.18 : 
                          lead === 'aVR' ? -0.12 : 
                          ['V1'].includes(lead) ? 0.14 : 0.08;
        value = flutterAmp * smoothWave * pScale;
        
        // QRS complex with dynamic timing
        const qrsStartNorm = 0.15;
        const qrsDuration = qrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStartNorm + qWidth/2, qWidth/2, 0.08 * amp.r * qScale);
        
        // R wave
        const rPosition = qrsStartNorm + (30 * qrsScale) / cycleLengthMs;
        const rWidth = 30 / cycleLengthMs * qrsScale;
        value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
        
        // S wave
        const sPosition = qrsStartNorm + (50 * qrsScale) / cycleLengthMs;
        const sWidth = 25 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, sPosition, sWidth/2, 1.0 * amp.s * sScale);
        
        // J-point
        const jPoint = qrsStartNorm + qrsDuration;
        if (jCurveFactor > 0) {
          value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
        }
        
        // T wave
        const tPosition = qrsStartNorm + qtDuration * 0.85;
        const tWidth = 35 / cycleLengthMs;
        value += biphasicTWave(normalizedT, tPosition, tWidth, 0.2 * amp.t * tScale, tDescentFactor, biphasicFactor);
        break;
      }

      case 'svt': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const qrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        // SVT has very short cycle, no clear P waves
        const qrsStartNorm = 0.10; // Early QRS for tachycardia
        const qrsDuration = qrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStartNorm + qWidth/2, qWidth/2, 0.08 * amp.r * qScale);
        
        // R wave
        const rPosition = qrsStartNorm + (30 * qrsScale) / cycleLengthMs;
        const rWidth = 30 / cycleLengthMs * qrsScale;
        value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
        
        // S wave
        const sPosition = qrsStartNorm + (50 * qrsScale) / cycleLengthMs;
        const sWidth = 25 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, sPosition, sWidth/2, 1.0 * amp.s * sScale);
        
        // J-point
        const jPoint = qrsStartNorm + qrsDuration;
        if (jCurveFactor > 0) {
          value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
        }
        
        // T wave
        const tPosition = qrsStartNorm + qtDuration * 0.85;
        const tWidth = 35 / cycleLengthMs;
        value += biphasicTWave(normalizedT, tPosition, tWidth, 0.25 * amp.t * tScale, tDescentFactor, biphasicFactor);
        break;
      }

      case 'vtach': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        // VTach has wide QRS - base is 140ms, but scales with qrsScale
        const vtQrsMs = 140 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const qrsStartNorm = 0.08;
        const qrsDuration = vtQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // Wide QRS monomorphic VT
        const vtAmp = (amp.r * rScale + amp.s * sScale) / 2;
        
        // Q wave (wide)
        const qWidth = 40 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStartNorm + qWidth/2, qWidth/2, 0.15 * vtAmp);
        
        // R wave (wide)
        const rPosition = qrsStartNorm + (60 * qrsScale) / cycleLengthMs;
        const rWidth = 60 / cycleLengthMs * qrsScale;
        value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.2 * vtAmp, rDescentFactor);
        
        // S wave (wide)
        const sPosition = qrsStartNorm + (110 * qrsScale) / cycleLengthMs;
        const sWidth = 50 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, sPosition, sWidth/2, 0.5 * vtAmp);
        
        // T wave with appropriate discordance (opposite to QRS)
        const tPosition = qrsStartNorm + qtDuration * 0.85;
        const tWidth = 50 / cycleLengthMs;
        const vtDiscordance = vtAmp > 0 ? -0.4 * tScale : 0.4 * tScale;
        value += biphasicTWave(normalizedT, tPosition, tWidth, vtDiscordance, tDescentFactor, biphasicFactor);
        break;
      }

      case 'vfib':
        value = 0.4 * (Math.sin(time * 15 + Math.sin(time * 7)) + 0.7 * Math.sin(time * 23) + 0.5 * Math.sin(time * 31)) / 2.5;
        break;

      case 'asystole':
        value = 0.01 * Math.sin(time * 3);
        break;

      case 'first_degree':
        // 1st degree block: prolonged PR (>200ms), typically 240-300ms
        value = generateNormalComplex(normalizedT, amp, 240, null);
        break;

      case 'mobitz1': {
        // Wenckebach: Progressive PR prolongation until dropped beat
        const beatInCycle = Math.floor(time / cycleLength) % 4;
        const prIntervalsMs = [180, 240, 320, 999]; // Progressive PR prolongation in ms
        if (beatInCycle < 3) {
          value = generateNormalComplex(normalizedT, amp, prIntervalsMs[beatInCycle], null);
        } else {
          // Dropped beat - only P wave
          const cycleLengthMs = 60000 / hr;
          const pStart = 80 / cycleLengthMs;
          const pDuration = 80 / cycleLengthMs;
          value = gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        }
        break;
      }

      case 'mobitz2': {
        const beatNum = Math.floor(time / cycleLength) % 3;
        const cycleLengthMs = 60000 / hr;
        
        // Mobitz II has constant (often prolonged) PR and wide QRS
        const prMs = 200 * prScale; // Base 200ms, scales with PR control
        const mobitzQrsMs = 140 * qrsScale; // Wide QRS ~140ms base
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        if (beatNum < 2) {
          const pStart = 80 / cycleLengthMs;
          const pDur = 80 / cycleLengthMs;
          const qrsStart = pStart + prMs / cycleLengthMs;
          const qrsDuration = mobitzQrsMs / cycleLengthMs;
          const qtDuration = qtMs / cycleLengthMs;
          
          // P wave
          value += gaussian(normalizedT, pStart + pDur/2, pDur/3, 0.15 * amp.p * pScale);
          
          // Wide QRS with R/S progression
          const qWidth = 30 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, qrsStart + qWidth/2, qWidth/2, 0.08 * amp.r * qScale);
          
          const rPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
          const rWidth = 40 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (100 * qrsScale) / cycleLengthMs;
          const sWidth = 35 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 1.2 * amp.s * sScale);
          
          // J-point
          const jPoint = qrsStart + qrsDuration;
          if (jCurveFactor > 0) {
            value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
          }
          
          // T wave
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 50 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * amp.t * tScale, tDescentFactor, biphasicFactor);
        } else {
          // Dropped QRS - only P wave
          const pStart = 80 / cycleLengthMs;
          const pDur = 80 / cycleLengthMs;
          value = gaussian(normalizedT, pStart + pDur/2, pDur/3, 0.15 * amp.p * pScale);
        }
        break;
      }

      case 'third_degree': {
        // Third degree AV block - complete dissociation between atria and ventricles
        const cycleLengthMs = 60000 / hr;
        
        // QRS width depends on escape rhythm type
        const isJunctional = hr >= 40; // Junctional escape is faster
        const escapeQrsMs = isJunctional ? (90 * qrsScale) : (140 * qrsScale); // Narrow vs wide
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        // Atrial rate ~80 bpm (independent of ventricular rate)
        const pPhase = (time * 1.33) % 1;
        const ventRate = hr / 60;
        const ventPhase = (time * ventRate) % 1;
        
        // P waves at regular atrial rate
        value = gaussian(pPhase, 0.1, 0.025, 0.15 * amp.p * pScale);
        
        // Escape rhythm QRS complex
        const qrsStartNorm = 0.15;
        const qrsDuration = escapeQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // Q wave
        const qWidth = (isJunctional ? 20 : 30) / cycleLengthMs * qrsScale;
        value -= gaussian(ventPhase, qrsStartNorm + qWidth/2, qWidth/2, 0.08 * amp.r * qScale);
        
        // R wave
        const rPosition = qrsStartNorm + ((isJunctional ? 30 : 50) * qrsScale) / cycleLengthMs;
        const rWidth = (isJunctional ? 30 : 50) / cycleLengthMs * qrsScale;
        const rAmp = isJunctional ? 1.0 : 1.1;
        value += asymmetricGaussian(ventPhase, rPosition, rWidth/2, rAmp * amp.r * rScale, rDescentFactor);
        
        // S wave
        const sPosition = qrsStartNorm + ((isJunctional ? 50 : 100) * qrsScale) / cycleLengthMs;
        const sWidth = (isJunctional ? 25 : 40) / cycleLengthMs * qrsScale;
        value -= gaussian(ventPhase, sPosition, sWidth/2, (isJunctional ? amp.s : 0.8 * amp.s) * sScale);
        
        // J-point
        const jPoint = qrsStartNorm + qrsDuration;
        if (jCurveFactor > 0) {
          value += gaussian(ventPhase, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
        }
        
        // T wave - discordant for ventricular escape
        const tPosition = qrsStartNorm + qtDuration * 0.85;
        const tWidth = 50 / cycleLengthMs;
        const tDiscordance = (!isJunctional && amp.r > 0) ? -0.3 : 0.3;
        value += biphasicTWave(ventPhase, tPosition, tWidth, tDiscordance * Math.abs(amp.t) * tScale, tDescentFactor, biphasicFactor);
        break;
      }

      case 'rbbb': {
        // Right Bundle Branch Block - wide QRS with RSR' pattern in V1-V2
        const cycleLengthMs = 60000 / hr;
        const prMs = 160 * prScale;
        const rbbbQrsMs = 120 * qrsScale; // RBBB has wide QRS ~120ms base
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = rbbbQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        if (lead === 'V1' || lead === 'V2') {
          // RSR' pattern ("rabbit ears") - specific to V1/V2
          const r1Position = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const r1Width = 25 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, r1Position, r1Width/2, 0.4 * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
          const sWidth = 20 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 0.2 * sScale);
          
          // R' wave (terminal)
          const r2Position = qrsStart + (90 * qrsScale) / cycleLengthMs;
          const r2Width = 35 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, r2Position, r2Width/2, 0.6 * rScale, rDescentFactor);
        } else if (['I', 'aVL', 'V5', 'V6'].includes(lead)) {
          // Wide slurred S wave in lateral leads
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 0.8 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (80 * qrsScale) / cycleLengthMs;
          const sWidth = 45 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 1.5 * amp.s * sScale);
        } else {
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (70 * qrsScale) / cycleLengthMs;
          const sWidth = 35 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 1.0 * amp.s * sScale);
        }
        
        // J-point
        const jPoint = qrsStart + qrsDuration;
        if (jCurveFactor > 0) {
          value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
        }
        
        // T wave
        const tPosition = qrsStart + qtDuration * 0.85;
        const tWidth = 45 / cycleLengthMs;
        value += biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * amp.t * tScale, tDescentFactor, biphasicFactor);
        break;
      }

      case 'lbbb': {
        // Left Bundle Branch Block - wide QRS with broad notched R in lateral leads
        const cycleLengthMs = 60000 / hr;
        const prMs = 160 * prScale;
        const lbbbQrsMs = 140 * qrsScale; // LBBB has wide QRS ~140ms base
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = lbbbQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        if (['V1', 'V2', 'V3'].includes(lead)) {
          // Deep QS pattern in V1-V3 (mostly negative)
          const qsPosition = qrsStart + (70 * qrsScale) / cycleLengthMs;
          const qsWidth = 80 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, qsPosition, qsWidth/2, 1.2 * sScale);
          
          // J-point (inverted for negative QRS)
          const jPoint = qrsStart + qrsDuration;
          if (jCurveFactor > 0) {
            value -= gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
          }
          
          // T wave (positive, discordant)
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * tScale, tDescentFactor, biphasicFactor);
        } else if (['I', 'aVL', 'V5', 'V6'].includes(lead)) {
          // Broad notched R wave in lateral leads
          const r1Position = qrsStart + (40 * qrsScale) / cycleLengthMs;
          const r1Width = 45 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, r1Position, r1Width/2, 0.6 * amp.r * rScale, rDescentFactor);
          
          // Notch (second R peak)
          const r2Position = qrsStart + (95 * qrsScale) / cycleLengthMs;
          const r2Width = 45 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, r2Position, r2Width/2, 0.8 * amp.r * rScale, rDescentFactor);
          
          // J-point
          const jPoint = qrsStart + qrsDuration;
          if (jCurveFactor > 0) {
            value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
          }
          
          // T wave (negative, discordant)
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value -= biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * tScale, tDescentFactor, biphasicFactor);
        } else {
          // Other leads
          const rPosition = qrsStart + (70 * qrsScale) / cycleLengthMs;
          const rWidth = 80 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          // J-point
          const jPoint = qrsStart + qrsDuration;
          if (jCurveFactor > 0) {
            value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
          }
        }
        break;
      }

      case 'anterior_stemi': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const prMs = 160 * prScale;
        const stemiQrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = stemiQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        const stemiRScale = rScale * 1.06;
        const stemiJCurve = jCurveFactor + 0.5;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStart + qWidth/2, qWidth/2, 0.1 * amp.r * qScale);
        
        const anteriorSTElev = 0.35 + (stShift * 0.5);
        
        if (['V1', 'V2', 'V3', 'V4'].includes(lead)) {
          // R wave
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * stemiRScale, rDescentFactor);
          
          // J-point and ST elevation
          const jPoint = qrsStart + qrsDuration;
          const takeoffWidth = 0.04 + (stemiJCurve * 0.03);
          value += gaussian(normalizedT, jPoint + 0.02, takeoffWidth, anteriorSTElev * 0.6);
          
          // ST plateau
          const stPlateauPos = jPoint + (qtDuration - qrsDuration) * 0.4;
          value += gaussian(normalizedT, stPlateauPos, 0.10, anteriorSTElev * 0.8);
          
          // T wave
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 50 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, anteriorSTElev * 0.5 * tScale, tDescentFactor, biphasicFactor);
          
          // Apply ST slope
          const stStart = jPoint + 0.02;
          const stEnd = tPosition - 0.05;
          if (stSlopeFactor !== 0 && normalizedT > stStart && normalizedT < stEnd) {
            const progress = (normalizedT - stStart) / (stEnd - stStart);
            value += stSlopeFactor * 0.15 * (progress - 0.5) * Math.sin(progress * Math.PI);
          }
        } else if (['II', 'III', 'aVF'].includes(lead)) {
          // Reciprocal leads - ST depression
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
          const sWidth = 25 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 0.2 * amp.s * sScale);
          
          const jPoint = qrsStart + qrsDuration;
          const deprAmount = 0.15 - stShift * 0.15;
          const takeoffWidth = 0.03 + (stemiJCurve * 0.02);
          value -= gaussian(normalizedT, jPoint + 0.02, takeoffWidth, deprAmount * 0.5);
          value -= gaussian(normalizedT, jPoint + 0.10, 0.08, deprAmount * 0.5);
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.25 * amp.t * tScale, tDescentFactor, biphasicFactor);
        } else {
          // Other leads - normal morphology
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
          const sWidth = 25 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 0.2 * amp.s * sScale);
          
          if (stShift !== 0) {
            const jPoint = qrsStart + qrsDuration;
            value += gaussian(normalizedT, jPoint + 0.06, 0.08, stShift * 0.25);
          }
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * amp.t * tScale, tDescentFactor, biphasicFactor);
        }
        break;
      }

      case 'inferior_stemi': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const prMs = 160 * prScale;
        const stemiQrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = stemiQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        const stemiRScale = rScale * 1.06;
        const stemiJCurve = jCurveFactor + 0.5;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStart + qWidth/2, qWidth/2, 0.1 * amp.r * qScale);
        
        const inferiorSTElev = 0.35 + (stShift * 0.5);
        
        if (['II', 'III', 'aVF'].includes(lead)) {
          // R wave
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * stemiRScale, rDescentFactor);
          
          // J-point and ST elevation
          const jPoint = qrsStart + qrsDuration;
          const takeoffWidth = 0.04 + (stemiJCurve * 0.03);
          value += gaussian(normalizedT, jPoint + 0.02, takeoffWidth, inferiorSTElev * 0.6);
          
          // ST plateau
          const stPlateauPos = jPoint + (qtDuration - qrsDuration) * 0.4;
          value += gaussian(normalizedT, stPlateauPos, 0.10, inferiorSTElev * 0.8);
          
          // T wave
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 50 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, inferiorSTElev * 0.5 * tScale, tDescentFactor, biphasicFactor);
          
          // Apply ST slope
          const stStart = jPoint + 0.02;
          const stEnd = tPosition - 0.05;
          if (stSlopeFactor !== 0 && normalizedT > stStart && normalizedT < stEnd) {
            const progress = (normalizedT - stStart) / (stEnd - stStart);
            value += stSlopeFactor * 0.15 * (progress - 0.5) * Math.sin(progress * Math.PI);
          }
        } else if (['I', 'aVL'].includes(lead)) {
          // Reciprocal leads - ST depression
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
          const sWidth = 25 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 0.2 * amp.s * sScale);
          
          const jPoint = qrsStart + qrsDuration;
          const deprAmount = 0.18 - stShift * 0.15;
          const takeoffWidth = 0.03 + (stemiJCurve * 0.02);
          value -= gaussian(normalizedT, jPoint + 0.02, takeoffWidth, deprAmount * 0.5);
          value -= gaussian(normalizedT, jPoint + 0.10, 0.08, deprAmount * 0.5);
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.25 * amp.t * tScale, tDescentFactor, biphasicFactor);
        } else {
          // Other leads - normal morphology
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
          const sWidth = 25 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 0.2 * amp.s * sScale);
          
          if (stShift !== 0) {
            const jPoint = qrsStart + qrsDuration;
            value += gaussian(normalizedT, jPoint + 0.06, 0.08, stShift * 0.25);
          }
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * amp.t * tScale, tDescentFactor, biphasicFactor);
        }
        break;
      }

      case 'lateral_stemi': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const prMs = 160 * prScale;
        const stemiQrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = stemiQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        const stemiRScale = rScale * 1.06;
        const stemiJCurve = jCurveFactor + 0.5;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStart + qWidth/2, qWidth/2, 0.1 * amp.r * qScale);
        
        const lateralSTElev = 0.30 + (stShift * 0.5);
        
        if (['I', 'aVL', 'V5', 'V6'].includes(lead)) {
          // R wave
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * stemiRScale, rDescentFactor);
          
          // J-point and ST elevation
          const jPoint = qrsStart + qrsDuration;
          const takeoffWidth = 0.04 + (stemiJCurve * 0.03);
          value += gaussian(normalizedT, jPoint + 0.02, takeoffWidth, lateralSTElev * 0.6);
          
          // ST plateau
          const stPlateauPos = jPoint + (qtDuration - qrsDuration) * 0.4;
          value += gaussian(normalizedT, stPlateauPos, 0.10, lateralSTElev * 0.8);
          
          // T wave
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 50 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, lateralSTElev * 0.5 * tScale, tDescentFactor, biphasicFactor);
          
          // Apply ST slope
          const stStart = jPoint + 0.02;
          const stEnd = tPosition - 0.05;
          if (stSlopeFactor !== 0 && normalizedT > stStart && normalizedT < stEnd) {
            const progress = (normalizedT - stStart) / (stEnd - stStart);
            value += stSlopeFactor * 0.15 * (progress - 0.5) * Math.sin(progress * Math.PI);
          }
        } else if (['II', 'III', 'aVF'].includes(lead)) {
          // Reciprocal leads - ST depression
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
          const sWidth = 25 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 0.2 * amp.s * sScale);
          
          const jPoint = qrsStart + qrsDuration;
          const deprAmount = 0.12 - stShift * 0.15;
          const takeoffWidth = 0.03 + (stemiJCurve * 0.02);
          value -= gaussian(normalizedT, jPoint + 0.02, takeoffWidth, deprAmount * 0.5);
          value -= gaussian(normalizedT, jPoint + 0.10, 0.08, deprAmount * 0.5);
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.25 * amp.t * tScale, tDescentFactor, biphasicFactor);
        } else {
          // Other leads - normal morphology
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
          const sWidth = 25 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 0.2 * amp.s * sScale);
          
          if (stShift !== 0) {
            const jPoint = qrsStart + qrsDuration;
            value += gaussian(normalizedT, jPoint + 0.06, 0.08, stShift * 0.25);
          }
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * amp.t * tScale, tDescentFactor, biphasicFactor);
        }
        break;
      }

      case 'posterior_stemi': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const prMs = 160 * prScale;
        const stemiQrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = stemiQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        const stemiRScale = rScale * 1.06;
        const stemiJCurve = jCurveFactor + 0.5;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStart + qWidth/2, qWidth/2, 0.1 * amp.r * qScale);
        
        if (['V1', 'V2', 'V3'].includes(lead)) {
          // Reciprocal changes: tall R + ST depression
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 35 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.2 * amp.r * rScale, rDescentFactor);
          
          const jPoint = qrsStart + qrsDuration;
          const deprAmount = 0.20 - stShift * 0.2;
          const takeoffWidth = 0.03 + (stemiJCurve * 0.02);
          value -= gaussian(normalizedT, jPoint + 0.02, takeoffWidth, deprAmount * 0.5);
          value -= gaussian(normalizedT, jPoint + 0.10, 0.08, deprAmount * 0.5);
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.4 * Math.abs(amp.t) * tScale, tDescentFactor, biphasicFactor);
        } else {
          // Other leads - normal morphology
          const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
          const rWidth = 30 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
          
          const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
          const sWidth = 25 / cycleLengthMs * qrsScale;
          value -= gaussian(normalizedT, sPosition, sWidth/2, 0.2 * amp.s * sScale);
          
          if (stShift !== 0) {
            const jPoint = qrsStart + qrsDuration;
            value += gaussian(normalizedT, jPoint + 0.06, 0.08, stShift * 0.25);
          }
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 45 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * amp.t * tScale, tDescentFactor, biphasicFactor);
        }
        break;
      }

      case 'hyperkalemia': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        // Hyperkalemia often shows PR prolongation and wide QRS
        const prMs = 160 * prScale;
        const hyperKQrsMs = 110 * qrsScale; // Slightly widened QRS
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = hyperKQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // Minimal/absent P wave (controlled by pScale)
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.05 * pScale);
        
        if (lead === 'V1') {
          // Deep S wave
          const sPosition = qrsStart + (55 * qrsScale) / cycleLengthMs;
          const sWidth = 50 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, sPosition, sWidth/2, -1.2 * sScale, rDescentFactor);
          
          // J-point
          const jPoint = qrsStart + qrsDuration;
          if (jCurveFactor > 0) {
            value -= gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
          }
          
          // Peaked T wave
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 25 / cycleLengthMs; // Narrow peaked T
          value += biphasicTWave(normalizedT, tPosition, tWidth, 1.4 * tScale, tDescentFactor, biphasicFactor);
        } else if (lead === 'V2') {
          // Deepest S wave
          const sPosition = qrsStart + (55 * qrsScale) / cycleLengthMs;
          const sWidth = 50 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, sPosition, sWidth/2, -1.5 * sScale, rDescentFactor);
          
          // J-point
          const jPoint = qrsStart + qrsDuration;
          if (jCurveFactor > 0) {
            value -= gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
          }
          
          // Tall peaked T wave
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 25 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 2.2 * tScale, tDescentFactor, biphasicFactor);
        } else if (lead === 'V3') {
          // Deep S wave
          const sPosition = qrsStart + (55 * qrsScale) / cycleLengthMs;
          const sWidth = 50 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, sPosition, sWidth/2, -1.0 * sScale, rDescentFactor);
          
          // J-point
          const jPoint = qrsStart + qrsDuration;
          if (jCurveFactor > 0) {
            value -= gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
          }
          
          // Tallest peaked T wave
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 25 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, 2.4 * tScale, tDescentFactor, biphasicFactor);
        } else if (lead === 'aVR') {
          // aVR: inverted
          const rPosition = qrsStart + (55 * qrsScale) / cycleLengthMs;
          const rWidth = 45 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, -0.2 * rScale, rDescentFactor);
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 25 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, -1.4 * tScale, tDescentFactor, biphasicFactor);
        } else {
          // Limb leads and V4-V6: Small R wave, peaked T wave
          const rPosition = qrsStart + (45 * qrsScale) / cycleLengthMs;
          const rWidth = 45 / cycleLengthMs * qrsScale;
          value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 0.25 * rScale, rDescentFactor);
          
          // J-point
          const jPoint = qrsStart + qrsDuration;
          if (jCurveFactor > 0) {
            value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
          }
          
          let tHeight = 1.2;
          if (lead === 'II') tHeight = 1.8;
          else if (lead === 'V4') tHeight = 1.8;
          else if (lead === 'V5') tHeight = 1.4;
          else if (lead === 'V6') tHeight = 1.2;
          else if (lead === 'III' || lead === 'aVF') tHeight = 1.4;
          else if (lead === 'I') tHeight = 1.2;
          else if (lead === 'aVL') tHeight = 1.0;
          
          const tPosition = qrsStart + qtDuration * 0.85;
          const tWidth = 25 / cycleLengthMs;
          value += biphasicTWave(normalizedT, tPosition, tWidth, tHeight * tScale, tDescentFactor, biphasicFactor);
        }
        
        // Apply ST shift if set
        if (stShift !== 0) {
          const jPoint = qrsStart + qrsDuration;
          value += stShift * 0.4 * gaussian(normalizedT, jPoint + 0.08, 0.06, 1);
        }
        break;
      }

      case 'hypokalemia':
        value = generateNormalComplex(normalizedT, amp);
        // Flattened T wave and prominent U wave
        value -= gaussian(normalizedT, 0.45, 0.05, 0.2 * amp.t * tScale);
        value += gaussian(normalizedT, 0.6, 0.04, 0.25 * amp.t * tScale); // U wave
        value -= 0.08 * gaussian(normalizedT, 0.35, 0.1, 1) * heightScale; // ST depression
        break;

      case 'pe':
        value = generateNormalComplex(normalizedT, amp);
        // S1Q3T3 pattern
        if (lead === 'I') value -= gaussian(normalizedT, 0.3, 0.015, 0.3 * sScale); // S in I
        if (lead === 'III') { 
          value -= gaussian(normalizedT, 0.26, 0.01, 0.25 * qScale); // Q in III
          value -= gaussian(normalizedT, 0.45, 0.05, 0.2 * tScale); // Inverted T in III
        }
        if (['V1', 'V2', 'V3'].includes(lead)) value -= gaussian(normalizedT, 0.45, 0.05, 0.4 * tScale); // T inversions
        break;

      case 'pericarditis': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const prMs = 160 * prScale;
        const periQrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = periQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // PR depression in most leads, PR elevation in aVR
        if (lead === 'aVR') {
          value += 0.05 * gaussian(normalizedT, pStart - 0.02, 0.05, 1) * heightScale;
        } else {
          value -= 0.05 * gaussian(normalizedT, pStart - 0.02, 0.05, 1) * heightScale;
        }
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStart + qWidth/2, qWidth/2, 0.08 * amp.r * qScale);
        
        // R wave
        const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
        const rWidth = 30 / cycleLengthMs * qrsScale;
        value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
        
        // S wave
        const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
        const sWidth = 25 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, sPosition, sWidth/2, 1.0 * amp.s * sScale);
        
        // J-point
        const jPoint = qrsStart + qrsDuration;
        if (jCurveFactor > 0) {
          const jSign = lead === 'aVR' ? -1 : 1;
          value += jSign * gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
        }
        
        // ST elevation in most leads, depression in aVR and V1
        const stPos = jPoint + 0.04;
        if (lead === 'aVR') {
          value -= (0.15 + stShift * 0.3) * gaussian(normalizedT, stPos, 0.12, 1) * heightScale;
        } else if (lead === 'V1') {
          value -= 0.05 * gaussian(normalizedT, stPos, 0.12, 1) * heightScale;
        } else {
          value += (0.15 + stShift * 0.3) * gaussian(normalizedT, stPos, 0.12, 1) * heightScale;
        }
        
        // T wave
        const tPosition = qrsStart + qtDuration * 0.85;
        const tWidth = 40 / cycleLengthMs;
        value += biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * amp.t * tScale, tDescentFactor, biphasicFactor);
        break;
      }

      case 'wpw': {
        // WPW: Short PR due to accessory pathway, delta wave, wide QRS
        const cycleLengthMs = 60000 / hr;
        // WPW has short PR (~100-120ms) and widened QRS due to delta wave
        const wpwPrMs = 100 * prScale; // Shortened PR
        const wpwQrsMs = 120 * qrsScale; // Widened due to delta wave
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + wpwPrMs / cycleLengthMs;
        const qrsDuration = wpwQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        // Delta wave (slurred upstroke)
        const deltaPosition = qrsStart + (20 * qrsScale) / cycleLengthMs;
        const deltaWidth = 40 / cycleLengthMs * qrsScale;
        value += gaussian(normalizedT, deltaPosition, deltaWidth/2, 0.3 * amp.r * rScale);
        
        // R wave
        const rPosition = qrsStart + (60 * qrsScale) / cycleLengthMs;
        const rWidth = 35 / cycleLengthMs * qrsScale;
        value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 0.8 * amp.r * rScale, rDescentFactor);
        
        // S wave
        const sPosition = qrsStart + (90 * qrsScale) / cycleLengthMs;
        const sWidth = 30 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, sPosition, sWidth/2, 0.8 * amp.s * sScale);
        
        // J-point
        const jPoint = qrsStart + qrsDuration;
        if (jCurveFactor > 0) {
          value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
        }
        
        // T wave (often inverted in WPW)
        const tPosition = qrsStart + qtDuration * 0.85;
        const tWidth = 40 / cycleLengthMs;
        value -= biphasicTWave(normalizedT, tPosition, tWidth, 0.2 * amp.t * tScale, tDescentFactor, biphasicFactor);
        break;
      }

      case 'lgl': {
        // LGL: Short PR, normal QRS, NO delta wave
        const cycleLengthMs = 60000 / hr;
        const lglPrMs = 100 * prScale; // Short PR (~100ms)
        const lglQrsMs = 90 * qrsScale; // Normal QRS
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + lglPrMs / cycleLengthMs;
        const qrsDuration = lglQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStart + qWidth/2, qWidth/2, 0.08 * amp.r * qScale);
        
        // R wave
        const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
        const rWidth = 30 / cycleLengthMs * qrsScale;
        value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
        
        // S wave
        const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
        const sWidth = 25 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, sPosition, sWidth/2, 1.0 * amp.s * sScale);
        
        // J-point
        const jPoint = qrsStart + qrsDuration;
        if (jCurveFactor > 0) {
          value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3);
        }
        
        // T wave
        const tPosition = qrsStart + qtDuration * 0.85;
        const tWidth = 35 / cycleLengthMs;
        value += biphasicTWave(normalizedT, tPosition, tWidth, 0.3 * amp.t * tScale, tDescentFactor, biphasicFactor);
        break;
      }

      case 'long_qt':
        // Long QT: Use normal complex but with modified T wave timing/morphology
        // The QT prolongation is handled by the qtScale parameter
        value = generateNormalComplex(normalizedT, amp);
        // Add additional broad, bifid T wave component for typical Long QT appearance
        if (tScale > 0.3) {
          value += gaussian(normalizedT, 0.55, 0.04, 0.15 * amp.t * tScale * heightScale);
        }
        break;

      case 'tamponade': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const prMs = 160 * prScale;
        const tampQrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = tampQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // Electrical alternans
        const beatNumber = Math.floor(time / cycleLength);
        const alternans = beatNumber % 2 === 0 ? 1.0 : 0.6;
        const lowVoltage = 0.5;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.12 * amp.p * pScale * lowVoltage);
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStart + qWidth/2, qWidth/2, 0.08 * amp.r * qScale * lowVoltage * alternans);
        
        // R wave
        const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
        const rWidth = 30 / cycleLengthMs * qrsScale;
        value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 0.8 * amp.r * rScale * lowVoltage * alternans, rDescentFactor);
        
        // S wave
        const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
        const sWidth = 25 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, sPosition, sWidth/2, 0.8 * amp.s * sScale * lowVoltage * alternans);
        
        // J-point
        const jPoint = qrsStart + qrsDuration;
        if (jCurveFactor > 0) {
          value += gaussian(normalizedT, jPoint, 0.02 + jCurveFactor * 0.03, stShift * 0.3 * lowVoltage * alternans);
        }
        
        // T wave
        const tPosition = qrsStart + qtDuration * 0.85;
        const tWidth = 40 / cycleLengthMs;
        value += biphasicTWave(normalizedT, tPosition, tWidth, 0.2 * amp.t * tScale * lowVoltage * alternans, tDescentFactor, biphasicFactor);
        break;
      }

      case 'early_repol': {
        // Calculate timing based on interval controls
        const cycleLengthMs = 60000 / hr;
        const prMs = 160 * prScale;
        const erQrsMs = 90 * qrsScale;
        const baseQtMs = 400 * Math.sqrt(60 / hr);
        const qtMs = baseQtMs * qtScale;
        
        const pStart = 80 / cycleLengthMs;
        const pDuration = 80 / cycleLengthMs;
        const qrsStart = pStart + prMs / cycleLengthMs;
        const qrsDuration = erQrsMs / cycleLengthMs;
        const qtDuration = qtMs / cycleLengthMs;
        
        // P wave
        value += gaussian(normalizedT, pStart + pDuration/2, pDuration/3, 0.15 * amp.p * pScale);
        
        // Q wave
        const qWidth = 20 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, qrsStart + qWidth/2, qWidth/2, 0.08 * amp.r * qScale);
        
        // R wave
        const rPosition = qrsStart + (30 * qrsScale) / cycleLengthMs;
        const rWidth = 30 / cycleLengthMs * qrsScale;
        value += asymmetricGaussian(normalizedT, rPosition, rWidth/2, 1.0 * amp.r * rScale, rDescentFactor);
        
        // S wave
        const sPosition = qrsStart + (50 * qrsScale) / cycleLengthMs;
        const sWidth = 25 / cycleLengthMs * qrsScale;
        value -= gaussian(normalizedT, sPosition, sWidth/2, 1.0 * amp.s * sScale);
        
        // J-point notch/elevation (fishhook) - most prominent in V2-V5
        const jPoint = qrsStart + qrsDuration;
        const baseJPointAmp = ['V2', 'V3', 'V4', 'V5'].includes(lead) ? 0.25 :
                             ['V1', 'V6', 'I', 'II'].includes(lead) ? 0.15 : 0.08;
        const jPointWidth = 0.015 + (jCurveFactor * 0.02);
        value += gaussian(normalizedT, jPoint, jPointWidth, baseJPointAmp * heightScale);
        
        // Concave upward ST elevation
        if (!['aVR', 'V1'].includes(lead)) {
          value += (0.1 + stShift * 0.3) * gaussian(normalizedT, jPoint + 0.04, 0.06, 1) * heightScale;
        }
        
        // T wave
        const tPosition = qrsStart + qtDuration * 0.85;
        const tWidth = 40 / cycleLengthMs;
        value += biphasicTWave(normalizedT, tPosition, tWidth, 0.4 * amp.t * tScale, tDescentFactor, biphasicFactor);
        break;
      }

      case 'la_ra_reversal': {
        // LA-RA (Left Arm - Right Arm) reversal - most common error
        // Lead I inverted, aVR/aVL swapped, II/III swapped
        let reversedAmp = { ...amp };
        if (lead === 'I') {
          reversedAmp = { p: -amp.p, r: -amp.r, s: -amp.s, t: -amp.t };
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
          reversedAmp = { p: 0.1, r: 0.1, s: 0.02, t: 0.1 }; // Nearly flat
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
          reversedAmp = { p: 0.1, r: 0.1, s: 0.02, t: 0.1 }; // Nearly flat
        } else if (lead === 'I') {
          reversedAmp = { p: -amp.p, r: -amp.r, s: -amp.s, t: -amp.t };
        } else if (lead === 'III') {
          reversedAmp = { p: -amp.p, r: -amp.r, s: -amp.s, t: -amp.t };
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
    
    // Apply R wave descent modification for pathologies that don't use generateNormalComplex
    // This is a fallback for any pathologies that may not have been updated with asymmetricGaussian
    // rDescentFactor < 0: steeper descent (sharper R wave)
    // rDescentFactor > 0: gentler/slurred descent (like delta wave effect)
    const pathologiesWithBuiltInRDescent = [
      'normal', 'sinus_brady', 'sinus_tachy', 'first_degree', 'mobitz1', 'mobitz2', 'third_degree',
      'afib', 'aflutter', 'svt', 'vtach', 'rbbb', 'lbbb',
      'anterior_stemi', 'inferior_stemi', 'lateral_stemi', 'posterior_stemi',
      'hyperkalemia', 'hypokalemia', 'pe', 'pericarditis', 'wpw', 'lgl', 'long_qt',
      'tamponade', 'early_repol',
      'la_ra_reversal', 'la_ll_reversal', 'ra_ll_reversal', 'precordial_reversal'
    ];
    const pathologiesWithoutR = ['vfib', 'asystole'];
    
    if (rDescentFactor !== 0 && !pathologiesWithBuiltInRDescent.includes(pathology) && !pathologiesWithoutR.includes(pathology)) {
      // R wave typically peaks around 0.22-0.25 normalized time
      // Modify the descending portion (after the peak, before S wave)
      const rPeakApprox = 0.23;
      const rEnd = 0.28;
      if (normalizedT > rPeakApprox && normalizedT < rEnd) {
        const descendProgress = (normalizedT - rPeakApprox) / (rEnd - rPeakApprox);
        // Steep descent (negative): reduce amplitude faster after peak
        // Gradual descent (positive): maintain amplitude longer after peak (slurred)
        const descentMod = rDescentFactor * 0.2 * (1 - descendProgress);
        value += value * descentMod * Math.sin(descendProgress * Math.PI);
      }
    }
    
    // Apply global ST shift for pathologies that don't have specific ST handling
    // Uses J-point curve for smooth takeoff and ST slope for direction
    if ((stShift !== 0 || stSlopeFactor !== 0) && !['vfib', 'asystole'].includes(pathology)) {
      const jPointSigma = 0.03 + (jCurveFactor * 0.04);
      // J-point bump
      value += gaussian(normalizedT, 0.33, jPointSigma, stShift * 0.3);
      
      // ST segment with slope
      if (normalizedT > 0.34 && normalizedT < 0.48) {
        const progress = (normalizedT - 0.34) / 0.14;
        let stValue = stShift * 0.35;
        // Apply slope adjustment
        if (stSlopeFactor !== 0) {
          stValue += stSlopeFactor * 0.2 * (progress - 0.5);
        }
        const edgeFactor = Math.sin(progress * Math.PI);
        value += stValue * edgeFactor;
      }
    }
    
    // Apply beat-to-beat amplitude variation
    value *= ampVariation;
    
    // Apply global wave height scaling
    value *= heightScale;
    
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
          const value = generateWaveform(lead, t, pathology, effectiveHR, artifactLevel, rrVariability, waveIrregularity, prInterval, qrsWidth, qtInterval, waveHeight, waveWidth, pWaveAmp, qWaveAmp, rWaveAmp, sWaveAmp, tWaveAmp, stElevation, stDepression, jPointCurve, stSlope, stConcavity, tWaveDescent, tWaveBiphasic, leadOverrides);
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
      const value = generateWaveform('II', t, pathology, effectiveHR, artifactLevel, rrVariability, waveIrregularity, prInterval, qrsWidth, qtInterval, waveHeight, waveWidth, pWaveAmp, qWaveAmp, rWaveAmp, sWaveAmp, tWaveAmp, stElevation, stDepression, jPointCurve, stSlope, stConcavity, tWaveDescent, tWaveBiphasic, leadOverrides);
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

  }, [pathology, heartRate, artifactLevel, rrVariability, waveIrregularity, prInterval, qrsWidth, qtInterval, waveHeight, waveWidth, pWaveAmp, qWaveAmp, rWaveAmp, sWaveAmp, tWaveAmp, stElevation, stDepression, jPointCurve, stSlope, stConcavity, tWaveDescent, tWaveBiphasic, leadOverrides]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">12-Lead EKG Simulator</h1>
        
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <Tooltip text="Select the cardiac rhythm or pathology to simulate">
                <label className="block text-sm font-medium mb-1">Pathology</label>
                <select
                  value={pathology}
                  onChange={(e) => handlePathologyChange(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white"
                >
                  {Object.entries(pathologies).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </Tooltip>
            </div>
            <div className="w-64">
              <Tooltip text="Adjust the heart rate in beats per minute (20-250 bpm)">
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
              </Tooltip>
            </div>
            <div className="w-48">
              <Tooltip text="Add baseline wander, muscle tremor, and electrical noise to simulate real-world interference">
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
              </Tooltip>
            </div>
            <div className="w-48">
              <Tooltip text="Beat-to-beat variation in timing (sinus arrhythmia). Higher = more irregular spacing between beats">
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
              </Tooltip>
            </div>
            <div className="w-48">
              <Tooltip text="Subtle beat-to-beat variation in wave amplitudes for more realistic appearance">
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
              </Tooltip>
            </div>
          </div>
          
          {/* Interval Controls - Global (applies to all leads) */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-32">
                <Tooltip text="PR interval - time from P wave to QRS. ↑ for 1st degree AV block (>200ms). Normal 120-200ms">
                  <label className="block text-sm font-medium mb-1">
                    PR: {prInterval}% ({getIntervalValues().pr}ms)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="250"
                    value={prInterval}
                    onChange={(e) => setPrInterval(Number(e.target.value))}
                    className="w-full"
                    disabled={['vfib', 'asystole', 'afib', 'aflutter'].includes(pathology)}
                  />
                </Tooltip>
              </div>
              <div className="w-32">
                <Tooltip text="QRS width - duration of ventricular depolarization. ↑ for BBB (>120ms), WPW. Normal 80-100ms">
                  <label className="block text-sm font-medium mb-1">
                    QRS: {qrsWidth}% ({getIntervalValues().qrs}ms)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={qrsWidth}
                    onChange={(e) => setQrsWidth(Number(e.target.value))}
                    className="w-full"
                    disabled={['vfib', 'asystole'].includes(pathology)}
                  />
                </Tooltip>
              </div>
              <div className="w-32">
                <Tooltip text="QT interval - total ventricular activity time. ↑ for long QT syndrome, drugs. ↓ for hypercalcemia">
                  <label className="block text-sm font-medium mb-1">
                    QT: {qtInterval}% ({getIntervalValues().qt}ms)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={qtInterval}
                    onChange={(e) => setQtInterval(Number(e.target.value))}
                    className="w-full"
                    disabled={['vfib', 'asystole'].includes(pathology)}
                  />
                </Tooltip>
              </div>
              <div className="flex gap-3 items-center">
                <Tooltip text="RR interval - time between R waves. Determined by heart rate. RR = 60,000 / HR">
                  <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                    <strong>RR:</strong> {getIntervalValues().rr}ms
                  </span>
                </Tooltip>
                <Tooltip text="Corrected QT (Bazett) - QT adjusted for heart rate. Normal: <450ms (men), <460ms (women). >500ms = high risk">
                  <span className={`px-2 py-1 rounded text-sm ${getIntervalValues().qtc > 500 ? 'bg-red-200' : getIntervalValues().qtc > 450 ? 'bg-yellow-200' : 'bg-green-100'}`}>
                    <strong>QTc:</strong> {getIntervalValues().qtc}ms
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>
          
          {/* Individual Wave Controls with Lead Selector */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 items-center mb-3">
              <div className="w-36">
                <Tooltip text="Select 'All Leads' to adjust globally, or pick a specific lead to customize individually">
                  <label className="block text-sm font-medium mb-1">
                    Adjust Lead:
                  </label>
                  <select
                    value={selectedLead}
                    onChange={(e) => setSelectedLead(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    {allLeads.map(lead => (
                      <option key={lead} value={lead}>{lead === 'All' ? 'All Leads' : lead}</option>
                    ))}
                  </select>
                </Tooltip>
              </div>
              {selectedLead !== 'All' && (
                <Tooltip text="Remove custom settings for this lead and revert to global values">
                  <button
                    onClick={clearLeadOverrides}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1 px-3 rounded text-sm"
                  >
                    Clear {selectedLead}
                  </button>
                </Tooltip>
              )}
              {Object.keys(leadOverrides).length > 0 && (
                <span className="text-xs text-gray-500">
                  Custom: {Object.keys(leadOverrides).join(', ')}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="w-28">
                <Tooltip text="P wave = atrial depolarization. ↓ for hyperkalemia, ↑ for atrial enlargement, 0% = absent (AFib)">
                  <label className="block text-sm font-medium mb-1">
                    P Wave: {getDisplayValue('pWaveAmp', pWaveAmp)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={getDisplayValue('pWaveAmp', pWaveAmp)}
                    onChange={(e) => setParamValue('pWaveAmp', Number(e.target.value), setPWaveAmp)}
                    className="w-full"
                    disabled={['vfib', 'asystole', 'afib', 'aflutter'].includes(pathology)}
                  />
                </Tooltip>
              </div>
              <div className="w-28">
                <Tooltip text="Q wave = initial downward deflection. ↑ for pathological Q waves (old MI)">
                  <label className="block text-sm font-medium mb-1">
                    Q Wave: {getDisplayValue('qWaveAmp', qWaveAmp)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={getDisplayValue('qWaveAmp', qWaveAmp)}
                    onChange={(e) => setParamValue('qWaveAmp', Number(e.target.value), setQWaveAmp)}
                    className="w-full"
                    disabled={['vfib', 'asystole'].includes(pathology)}
                  />
                </Tooltip>
              </div>
              <div className="w-28">
                <Tooltip text="R wave = main upward spike. ↑ for LVH/RVH, ↓ for low voltage or poor R progression">
                  <label className="block text-sm font-medium mb-1">
                    R Wave: {getDisplayValue('rWaveAmp', rWaveAmp)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={getDisplayValue('rWaveAmp', rWaveAmp)}
                    onChange={(e) => setParamValue('rWaveAmp', Number(e.target.value), setRWaveAmp)}
                    className="w-full"
                    disabled={['vfib', 'asystole'].includes(pathology)}
                  />
                </Tooltip>
              </div>
              <div className="w-28">
                <Tooltip text="S wave = downward deflection after R. Deep S waves in RVH (V5-V6) or RBBB">
                  <label className="block text-sm font-medium mb-1">
                    S Wave: {getDisplayValue('sWaveAmp', sWaveAmp)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={getDisplayValue('sWaveAmp', sWaveAmp)}
                    onChange={(e) => setParamValue('sWaveAmp', Number(e.target.value), setSWaveAmp)}
                    className="w-full"
                    disabled={['vfib', 'asystole'].includes(pathology)}
                  />
                </Tooltip>
              </div>
              <div className="w-28">
                <Tooltip text="T wave = ventricular repolarization. Peaked in hyperkalemia, inverted in ischemia, flat in hypokalemia">
                  <label className="block text-sm font-medium mb-1">
                    T Wave: {getDisplayValue('tWaveAmp', tWaveAmp)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={getDisplayValue('tWaveAmp', tWaveAmp)}
                    onChange={(e) => setParamValue('tWaveAmp', Number(e.target.value), setTWaveAmp)}
                    className="w-full"
                    disabled={['vfib', 'asystole'].includes(pathology)}
                  />
                </Tooltip>
              </div>
              <div className="w-28">
                <Tooltip text="ST elevation - seen in STEMI, pericarditis, early repolarization">
                  <label className="block text-sm font-medium mb-1">
                    ST Elev: {getDisplayValue('stElevation', stElevation)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getDisplayValue('stElevation', stElevation)}
                    onChange={(e) => setParamValue('stElevation', Number(e.target.value), setStElevation)}
                    className="w-full"
                    disabled={['vfib', 'asystole'].includes(pathology)}
                  />
                </Tooltip>
              </div>
              <div className="w-28">
                <Tooltip text="ST depression - seen in ischemia, reciprocal changes, digitalis effect">
                  <label className="block text-sm font-medium mb-1">
                    ST Depr: {getDisplayValue('stDepression', stDepression)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getDisplayValue('stDepression', stDepression)}
                    onChange={(e) => setParamValue('stDepression', Number(e.target.value), setStDepression)}
                    className="w-full"
                    disabled={['vfib', 'asystole'].includes(pathology)}
                  />
                </Tooltip>
              </div>
            <div className="w-28">
              <Tooltip text="J-point curve - smoothness of QRS to ST transition. Higher = smoother takeoff (for STEMI)">
                <label className="block text-sm font-medium mb-1">
                  J-Curve: {getDisplayValue('jPointCurve', jPointCurve)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={getDisplayValue('jPointCurve', jPointCurve)}
                  onChange={(e) => setParamValue('jPointCurve', Number(e.target.value), setJPointCurve)}
                  className="w-full"
                  disabled={['vfib', 'asystole'].includes(pathology)}
                />
              </Tooltip>
            </div>
            <div className="w-28">
              <Tooltip text="ST slope: Negative = downsloping (ischemia), Zero = flat, Positive = upsloping (benign)">
                <label className="block text-sm font-medium mb-1">
                  ST Slope: {getDisplayValue('stSlope', stSlope)}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={getDisplayValue('stSlope', stSlope)}
                  onChange={(e) => setParamValue('stSlope', Number(e.target.value), setStSlope)}
                  className="w-full"
                  disabled={['vfib', 'asystole'].includes(pathology)}
                />
              </Tooltip>
            </div>
            <div className="w-28">
              <Tooltip text="R wave downslope: Negative = steep/sharp descent, Zero = symmetric, Positive = gradual/slurred descent (like WPW delta wave effect)">
                <label className="block text-sm font-medium mb-1">
                  R Slope: {getDisplayValue('stConcavity', stConcavity)}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={getDisplayValue('stConcavity', stConcavity)}
                  onChange={(e) => setParamValue('stConcavity', Number(e.target.value), setStConcavity)}
                  className="w-full"
                  disabled={['vfib', 'asystole'].includes(pathology)}
                />
              </Tooltip>
            </div>
            <div className="w-28">
              <Tooltip text="T wave downslope: Negative = steep/sharp descent, Zero = symmetric, Positive = gradual/prolonged descent">
                <label className="block text-sm font-medium mb-1">
                  T Slope: {getDisplayValue('tWaveDescent', tWaveDescent)}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={getDisplayValue('tWaveDescent', tWaveDescent)}
                  onChange={(e) => setParamValue('tWaveDescent', Number(e.target.value), setTWaveDescent)}
                  className="w-full"
                  disabled={['vfib', 'asystole'].includes(pathology)}
                />
              </Tooltip>
            </div>
            <div className="w-28">
              <Tooltip text="Biphasic T wave: Negative = initial inversion (down-up), Zero = monophasic, Positive = terminal inversion (up-down, like Wellens)">
                <label className="block text-sm font-medium mb-1">
                  T Biphasic: {getDisplayValue('tWaveBiphasic', tWaveBiphasic)}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={getDisplayValue('tWaveBiphasic', tWaveBiphasic)}
                  onChange={(e) => setParamValue('tWaveBiphasic', Number(e.target.value), setTWaveBiphasic)}
                  className="w-full"
                  disabled={['vfib', 'asystole'].includes(pathology)}
                />
              </Tooltip>
            </div>
            <div className="w-28">
              <Tooltip text="Overall voltage. ↓ for low voltage (obesity, effusion, COPD). ↑ for LVH">
                <label className="block text-sm font-medium mb-1">
                  Height: {getDisplayValue('waveHeight', waveHeight)}%
                </label>
                <input
                  type="range"
                  min="25"
                  max="300"
                  value={getDisplayValue('waveHeight', waveHeight)}
                  onChange={(e) => setParamValue('waveHeight', Number(e.target.value), setWaveHeight)}
                  className="w-full"
                  disabled={['vfib', 'asystole'].includes(pathology)}
                />
              </Tooltip>
            </div>
            <div className="w-28">
              <Tooltip text="Wave visual width (roundedness). ↑ for wider/rounder waves, ↓ for sharper/narrower. Does NOT change timing intervals">
                <label className="block text-sm font-medium mb-1">
                  Width: {getDisplayValue('waveWidth', waveWidth)}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={getDisplayValue('waveWidth', waveWidth)}
                  onChange={(e) => setParamValue('waveWidth', Number(e.target.value), setWaveWidth)}
                  className="w-full"
                  disabled={['vfib', 'asystole'].includes(pathology)}
                />
              </Tooltip>
            </div>
            <div className="w-28 flex items-end">
              <Tooltip text="Reset all settings to defaults and clear all lead-specific customizations">
                <button
                  onClick={resetAllSettings}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded text-sm"
                >
                  Reset All
                </button>
              </Tooltip>
            </div>
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
          
          {/* Reference Links */}
          {pathologies[pathology].references && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">📚 Reference EKG Examples:</h3>
              <div className="flex flex-wrap gap-3">
                {pathologies[pathology].references.map((ref, index) => (
                  <a
                    key={index}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-lg transition-colors border border-blue-200"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {ref.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-2">Educational simulation only</p>
      </div>
    </div>
  );
};

export default EKGPrintout;
