// utils/generateReadableId.js
import Order from '../models/order.model.js';

export const genarateSRFNumber = async () => {
  const prefix = 'ABSRF';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12

  // Count existing orders in current year and month
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);

  const count = await Order.countDocuments({
    createdAt: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
  });

  const nextNumber = String(count + 1).padStart(3, '0'); // 001, 002, ...
  return `${prefix}/${year}/${month}/${nextNumber}`;
};