import bcrypt from 'bcryptjs';

export async function hashOtp(otp: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

export async function verifyOtpHash(otp: string, hash: string) {
  return bcrypt.compare(otp, hash);
}
