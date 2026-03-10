import { Context } from 'grammy';

const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_USER_IDS || '')
  .split(',')
  .map((id) => parseInt(id.trim()))
  .filter((id) => !isNaN(id));

export function isAdmin(ctx: Context): boolean {
  return ADMIN_IDS.includes(ctx.from?.id ?? 0);
}
