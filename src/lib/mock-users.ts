export type DevUser = { id: string; username: string; email: string; role: string };

export function devListUsers(): DevUser[] {
  return [
    { id: 'u_customer', username: 'Tbabak', email: 'tbabak@example.com', role: 'customer' },
    { id: 'u_manager', username: 'Admin_Aroma', email: 'manager@aromacraft.test', role: 'manager' },
    { id: 'u_admin', username: 'Super_Aroma', email: 'super@aromacraft.test', role: 'admin' },
  ];
}
