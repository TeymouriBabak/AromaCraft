import { createDbSession, getSessionByCookieValue } from '../src/lib/db-auth';
import { findUserByEmail } from '../src/lib/db-auth';

async function main() {
  const user = await findUserByEmail('tbabak@example.com');
  if (!user) {
    console.error('USER_NOT_FOUND');
    process.exit(1);
  }
  console.log('USER_ID', user.id);
  const session = await createDbSession(user.id, 3600).catch((error) => {
    console.error('CREATE_SESSION_ERROR', error);
    return null;
  });
  console.log('SESSION_RESULT', session);
  if (session) {
    const fetched = await getSessionByCookieValue(session.token).catch((error) => {
      console.error('FETCH_SESSION_ERROR', error);
      return null;
    });
    console.log('FETCHED_SESSION', fetched && { id: fetched.session.id, userId: fetched.session.userId, tokenHash: fetched.session.tokenHash });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
