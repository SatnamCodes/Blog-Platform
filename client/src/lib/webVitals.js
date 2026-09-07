import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// Console-only web-vitals reporting. Good enough for local dev insight
// without pulling in a full Lighthouse CI pipeline.
export function reportWebVitals() {
  const log = (metric) => {
    console.info(`[web-vitals] ${metric.name}: ${metric.value.toFixed(2)}`);
  };
  onCLS(log);
  onFCP(log);
  onLCP(log);
  onTTFB(log);
  onINP(log);
}
