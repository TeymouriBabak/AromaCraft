import { isPhoneNumberValid, normalizePhoneNumber } from '../src/lib/auth-validation';

const cases = [
  '+14155552671',
  '+447911123456',
  '09123456789',
  '12345',
  '+1234',
];

for (const c of cases) {
  console.log(c, '=> valid=', isPhoneNumberValid(c), 'normalized=', normalizePhoneNumber(c));
}
