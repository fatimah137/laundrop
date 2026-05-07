export const formatIDR = (n) => {
  const v = Number(n || 0);
  return 'Rp ' + v.toLocaleString('id-ID', { maximumFractionDigits: 0 });
};

export const formatDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
};

export const formatDateTime = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return d; }
};

export const generateOrderNumber = () => {
  const now = new Date();
  const ymd = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `LD-${ymd}-${rnd}`;
};