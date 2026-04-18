import { useState, useEffect } from 'react';

// Normal ranges for simulation
const ranges = {
  temp: { min: 36.5, max: 37.5, drift: 0.1 },
  hr: { min: 60, max: 100, drift: 2 },
  rr: { min: 12, max: 20, drift: 1 },
  bp_sys: { min: 110, max: 140, drift: 3 },
  bp_dia: { min: 70, max: 90, drift: 2 },
  spo2: { min: 95, max: 100, drift: 1 },
};

export function useVitalsSimulation(patientId: string, diagnosis: string) {
  const [currentVitals, setCurrentVitals] = useState({
    temp: 37.0,
    hr: 80,
    rr: 16,
    bp_sys: 120,
    bp_dia: 80,
    spo2: 98,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    // Initial random start based on diagnosis
    let base = { ...currentVitals };
    if (diagnosis.includes('Sepsis') || diagnosis.includes('Pneumonia')) {
      base.temp = 38.2;
      base.hr = 105;
      base.rr = 22;
      base.bp_sys = 105;
    }
    setCurrentVitals(base);

    const interval = setInterval(() => {
      setCurrentVitals(prev => {
        const drift = (r: { drift: number }) => (Math.random() - 0.5) * r.drift * 2;
        
        // Randomly simulate a spikes for "deteriorating" feel if relevant
        const spikeChance = diagnosis.includes('Pneumonia') ? 0.05 : 0.01;
        const offset = Math.random() < spikeChance ? 5 : 0;

        return {
          temp: Number((prev.temp + drift(ranges.temp)).toFixed(1)),
          hr: Math.round(prev.hr + drift(ranges.hr) + offset),
          rr: Math.round(prev.rr + drift(ranges.rr) + (offset > 0 ? 2 : 0)),
          bp_sys: Math.round(prev.bp_sys + drift(ranges.bp_sys) - offset),
          bp_dia: Math.round(prev.bp_dia + drift(ranges.bp_dia)),
          spo2: Math.min(100, Math.max(85, Math.round(prev.spo2 + drift(ranges.spo2) - (offset > 0 ? 1 : 0)))),
          timestamp: new Date().toISOString()
        };
      });
    }, 3000); // Update visual every 3 seconds

    return () => clearInterval(interval);
  }, [patientId, diagnosis]);

  return currentVitals;
}
