import crypto from 'crypto';

export const generateOrderToken = (orderfor) => {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${orderfor}-${timestamp.slice(-6)}-${randomBytes}`;
};