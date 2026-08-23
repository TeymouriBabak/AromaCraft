const baseUrl = 'http://127.0.0.1:3000';
const credentials = [
  {
    role: 'customer',
    identifier: process.env.VERIFY_CUSTOMER_EMAIL || 'tbabak@example.com',
    password: process.env.VERIFY_CUSTOMER_PASSWORD || '',
  },
  {
    role: 'admin',
    identifier: process.env.VERIFY_ADMIN_EMAIL || 'manager@aromacraft.test',
    password: process.env.VERIFY_ADMIN_PASSWORD || '',
  },
  {
    role: 'admin',
    identifier: process.env.VERIFY_MANAGER_EMAIL || 'super@aromacraft.test',
    password: process.env.VERIFY_MANAGER_PASSWORD || '',
  },
];

async function login(role, identifier, password) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const setCookie =
    res.headers.getSetCookie?.().join('; ') ??
    res.headers.get('set-cookie') ??
    '';
  return { status: res.status, setCookie };
}

async function request(path, cookie) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    redirect: 'manual',
    headers: cookie ? { cookie } : {},
  });
  return {
    status: res.status,
    location: res.headers.get('location'),
    bodyPreview: (await res.text()).slice(0, 120),
  };
}

const results = [];

for (const entry of credentials) {
  const { status, setCookie } = await login(
    entry.role,
    entry.identifier,
    entry.password
  );
  if (status !== 200) {
    throw new Error(`${entry.role} login failed with ${status}`);
  }
  const loginRes = await request('/login', setCookie);
  const adminRes = await request('/dashboard/admin', setCookie);
  results.push({ role: entry.role, loginRes, adminRes });
}

const guestRes = await request('/login', '');
results.unshift({ role: 'guest', loginRes: guestRes, adminRes: null });

console.log(JSON.stringify(results, null, 2));
