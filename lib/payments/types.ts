export type CheckoutHolder = {
  firstName: string;
  lastName: string;
  personalId: string;
  email: string;
  phone: string;
};

export type CheckoutLineItem = {
  slug: string;
  qty: number;
  holders?: CheckoutHolder[];
};

export type StoredOrderHolder = CheckoutHolder;
