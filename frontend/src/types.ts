export type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  only_one_address?: number;
  addresses_count?: number;
};

export type Address = {
  id: number;
  customer_id: number;
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  is_primary?: number;
};

export type Order = {
  id: number;
  customer_id: number;
  total: number;
  status: string;
  created_at: string;
};

export type Payment = {
  id: number;
  customer_id: number;
  amount: number;
  method: string;
  created_at: string;
};
