import { products } from '@/data/products-multi-brand';

type OrderItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  grindType?: string;
};

export type Order = {
  id: string;
  userId: string;
  createdAt: string;
  fullName: string;
  email: string;
  address: string;
  items: OrderItem[];
  total: number;
};

export type NewOrder = Omit<Order, 'id' | 'createdAt' | 'total'>;

const orders: Order[] = [];

function getProductById(productId: number) {
  return products.find((product) => product.id === productId);
}

export function getOrdersByUserId(userId: string) {
  return orders.filter((order) => order.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addOrder(order: NewOrder) {
  const id = `ORD-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const normalizedItems = order.items
    .map((item) => {
      const product = getProductById(item.productId);
      const cappedQuantity = Math.max(1, Math.min(item.quantity, product ? 10 : 20));
      return {
        ...item,
        quantity: cappedQuantity,
      };
    })
    .filter((item) => item.quantity > 0);

  const total = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const nextOrder: Order = { id, createdAt, ...order, items: normalizedItems, total };
  orders.push(nextOrder);
  return nextOrder;
}

export function getOrderById(orderId: string) {
  return orders.find((order) => order.id === orderId) ?? null;
}
