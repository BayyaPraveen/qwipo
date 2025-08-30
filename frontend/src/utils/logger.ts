import { postLog } from '../api';

export async function logError(err: unknown, context = {}) {
  try {
    const entry = {
      ts: new Date().toISOString(),
      error: typeof err === 'string' ? err : (err && (err as any).message) || String(err),
      stack: (err && (err as any).stack) || null,
      context
    };
    const logs = JSON.parse(localStorage.getItem('__qwipo_logs') || '[]');
    logs.unshift(entry);
    localStorage.setItem('__qwipo_logs', JSON.stringify(logs.slice(0, 200)));
    postLog(entry).catch(()=>{});
  } catch (e) {
    console.error('Logger failed', e);
  }
}
