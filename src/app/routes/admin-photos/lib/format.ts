const number = new Intl.NumberFormat('nl', { maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'short', year: 'numeric' });

/** "180 kB" or "1,2 MB". */
export const formatSize = (bytes: number) => (bytes < 1e6 ? `${Math.round(bytes / 1e3)} kB` : `${number.format(bytes / 1e6)} MB`);

/** "1 foto" or "12 foto's". */
export const photoCount = (n: number) => (n === 1 ? '1 foto' : `${n} foto's`);

/** "14 mrt 2026". */
export const formatDate = (d: Date) => date.format(d);
