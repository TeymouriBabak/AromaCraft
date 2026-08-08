const subscriptions = new Set<string>();

export function hasNewsletterSubscription(email: string) {
  return subscriptions.has(email.toLowerCase());
}

export function addNewsletterSubscription(email: string) {
  subscriptions.add(email.toLowerCase());
}

export function listNewsletterSubscriptions() {
  return Array.from(subscriptions);
}
