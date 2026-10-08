// Minutes depuis minuit → "HH:MM" (25 * 60 = 01:00)
export const fmt = (m) => {
  const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};
