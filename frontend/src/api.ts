import type { Customer, Address, Order, Payment } from './types';
const BASE = (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL)) || 'http://localhost:4000/api';
console.log('[api] BASE', BASE);

async function parseResponse(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return null; }
}

async function request(path: string, opts?: RequestInit) {
  const url = `${BASE}${path}`;
  console.log('[api] REQUEST', opts?.method ?? 'GET', url, opts?.body ? JSON.parse(String(opts.body)) : '');
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });

  let payload: any = null;
  const text = await res.text();
  try { payload = JSON.parse(text); } catch { payload = text; }
  console.log('[api] RESPONSE', res.status, payload ?? null);

  if (!res.ok) {
    const err: any = new Error(payload?.message ?? res.statusText);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  if (payload && payload.success === false) {
    const err: any = new Error(payload.message ?? 'Server error');
    err.payload = payload;
    throw err;
  }
  return payload;
}

export async function fetchCustomers(params?: Record<string, any>) {
  const url = new URL(`${BASE}/customers`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, String(v));
    });
  }
  const res = await fetch(url.toString());
  const payload = await res.json();
  if (!res.ok || payload?.success === false) throw new Error(payload?.message ?? res.statusText);
  return payload as { success: true; data: Customer[]; page: number; totalPages: number; total: number; };
}

export async function fetchCustomer(id: number) {
  return (await request(`/customers/${id}`)) as { success: true; customer: Customer; addresses: Address[]; orders?: Order[]; payments?: Payment[] };
}

export async function createCustomer(body: Partial<Customer>) {
  return (await request('/customers', { method: 'POST', body: JSON.stringify(body) }));
}

export async function updateCustomer(id: number, body: Partial<Customer>) {
  return (await request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }));
}

export async function deleteCustomer(id: number) {
  return (await request(`/customers/${id}`, { method: 'DELETE' }));
}

/* Addresses */
export async function fetchAddressesForCustomer(customerId: number) {
  return (await request(`/addresses/customer/${customerId}`)) as { success: true; data: Address[] };
}

export async function createAddress(customerId: number, body: Partial<Address>) {
  return (await request(`/addresses/customer/${customerId}`, { method: 'POST', body: JSON.stringify(body) }));
}

export async function updateAddress(id: number, body: Partial<Address>) {
  return (await request(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }));
}

export async function deleteAddress(id: number) {
  return (await request(`/addresses/${id}`, { method: 'DELETE' }));
}

/* Orders & payments (backend optional) */
export async function fetchOrdersForCustomer(customerId: number) {
  try {
    const r = await request(`/orders/customer/${customerId}`);
    return r.data as Order[];
  } catch { return []; }
}
export async function fetchPaymentsForCustomer(customerId: number) {
  try {
    const r = await request(`/payments/customer/${customerId}`);
    return r.data as Payment[];
  } catch { return []; }
}

/* log posting */
export async function postLog(payload: any) {
  try {
    await request('/logs', { method: 'POST', body: JSON.stringify(payload) });
  } catch {}
}
