const base = 'http://127.0.0.1:3000';
const mgrEmail = 'manager@aromacraft.test';
const mgrPass = 'Manager123!';

async function req(path: string, options: any = {}) {
  const url = base + path;
  const res = await fetch(url, options);
  const text = await res.text();
  const setCookieHeader = res.headers.get('set-cookie');
  const setCookie = setCookieHeader ? [setCookieHeader] : undefined;
  return { status: res.status, headers: res.headers, body: text, setCookie };
}

function pickCookie(setCookie?: string[]) {
  if (!setCookie || setCookie.length === 0) return undefined;
  // join cookies name=value
  return setCookie.map((c) => c.split(';')[0]).join('; ');
}

async function main() {
  console.log('Test 1: Manager login (correct role)');
  const login1 = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginMode: 'email',
      role: 'manager',
      identifier: mgrEmail,
      password: mgrPass,
    }),
  });
  const mgrCookie = pickCookie(login1.setCookie);
  console.log({ status: login1.status, cookie: mgrCookie, body: login1.body });

  console.log('\nTest 2: Role mismatch (expect 4xx)');
  const login2 = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginMode: 'email',
      role: 'customer',
      identifier: mgrEmail,
      password: mgrPass,
    }),
  });
  console.log({ status: login2.status, body: login2.body });

  console.log('\nTest 3: Wrong password (expect 401)');
  const login3 = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loginMode: 'email',
      role: 'manager',
      identifier: mgrEmail,
      password: 'WrongPass!',
    }),
  });
  console.log({ status: login3.status, body: login3.body });

  console.log('\nTest 4: Manager overview without cookie (expect 401)');
  const overviewNo = await req('/api/manager/overview');
  console.log({ status: overviewNo.status, body: overviewNo.body });

  console.log('\nTest 5: Manager overview with manager cookie (expect 200)');
  const overviewMgr = await req('/api/manager/overview', {
    headers: mgrCookie ? { Cookie: mgrCookie } : undefined,
  });
  console.log({ status: overviewMgr.status, body: overviewMgr.body });

  console.log(
    '\nTest 6: Signup regular user, login, and call manager overview (expect 403/401)'
  );
  const rand = Math.floor(Math.random() * 1000000);
  const uemail = `testuser${rand}@aromacraft.test`;
  const username = `TestUser${rand}`;
  const signup = await req('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      gender: 'other',
      username,
      mobile: '+14155552671',
      email: uemail,
      password: 'User123!',
      confirmPassword: 'User123!',
    }),
  });
  console.log('signup', { status: signup.status, body: signup.body });
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
