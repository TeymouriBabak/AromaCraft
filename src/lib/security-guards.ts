export type SecurityUser = {
  userId: string;
  role: 'customer' | 'admin' | 'manager';
  isActive: boolean;
};

export type SessionLike = {
  status: 'ACTIVE' | 'REVOKED' | string;
  expiresAt: Date;
};

export function canAccessOrder(
  actor: SecurityUser,
  ownerUserId: string,
  orderId: string
) {
  if (!actor.isActive) return false;
  if (actor.role === 'admin') return true;
  return actor.userId === ownerUserId && Boolean(orderId);
}

export function isSessionValid(
  session: SessionLike | null | undefined,
  user: Pick<SecurityUser, 'isActive'> | null | undefined
) {
  if (!session || !user?.isActive) return false;
  if (session.status !== 'ACTIVE') return false;
  return session.expiresAt.getTime() > Date.now();
}

export function calculateOrderTotals(
  items: Array<{ productId: number; quantity: number }>,
  products: Array<{ id: number; price: number }>
) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const subtotal = items.reduce((sum, item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new Error(`Unknown product: ${item.productId}`);
    }
    return sum + product.price * item.quantity;
  }, 0);

  const shippingFee = subtotal > 0 ? 500 : 0;
  return { subtotal, shippingFee, total: subtotal + shippingFee };
}
