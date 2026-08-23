const base = 'http://127.0.0.1:3000';
const mgrEmail = 'manager@aromacraft.test';
const mgrPass = 'Manager123!';

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function req(path: string, options: any = {}) {
  const url = base + path;
  const res = await fetch(url, options);
  const text = await res.text();
  const setCookieHeader = res.headers.get('set-cookie');
  const setCookie = setCookieHeader ? [setCookieHeader] : undefined;
  return { status: res.status, body: text, setCookie };
}

function pickCookie(setCookie?: string[]) {
  if (!setCookie || setCookie.length === 0) return undefined;
  return setCookie.map((c) => c.split(';')[0]).join('; ');
}

async function main() {
  console.log('Test 2: Role mismatch (manager creds, role=customer)');
  const t2 = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginMode: 'email',
      role: 'customer',
      identifier: mgrEmail,
      password: mgrPass,
    }),
  });
  console.log({ status: t2.status, body: t2.body });

  await sleep(3000);

  console.log('\nTest 3: Wrong password');
  const t3 = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginMode: 'email',
      role: 'manager',
      identifier: mgrEmail,
      password: 'WrongPass!',
    }),
  });
  console.log({ status: t3.status, body: t3.body });

  await sleep(3000);

  console.log(
    '\nTest 6: Signup regular user, login, and call manager overview'
  );
  const rand = Math.floor(Math.random() * 1000000);
  const uemail = `testuser${rand}@aromacraft.test`;
  const username = `TestUser${rand}`;
  const mobile = '+14155552671';

  const signup = await req('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      gender: 'other',
      username,
      mobile,
      email: uemail,
      password: 'User123!',
      confirmPassword: 'User123!',
    }),
  });
  console.log('signup', { status: signup.status, body: signup.body });

  await sleep(3000);

  const loginUser = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginMode: 'email',
      role: 'customer',
      identifier: uemail,
      password: 'User123!',
    }),
  });
  const userCookie = pickCookie(loginUser.setCookie);
  console.log('login user', {
    status: loginUser.status,
    cookie: userCookie,
    body: loginUser.body,
  });

  await sleep(1000);

  const overviewNonMgr = await req('/api/manager/overview', {
    headers: userCookie ? { Cookie: userCookie } : undefined,
  });
  console.log('overview with non-manager', {
    status: overviewNonMgr.status,
    body: overviewNonMgr.body,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
