import { Bot } from 'grammy';
import { registerMenuHandlers } from './handlers/menu';
import { registerOrderHandlers } from './handlers/order';
import { registerBookingHandlers } from './handlers/booking';
import { registerAdminHandlers } from './handlers/admin';

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err.message);
  });

  // Register all handlers
  registerMenuHandlers(bot);
  registerOrderHandlers(bot);
  registerBookingHandlers(bot);
  registerAdminHandlers(bot);

  return bot;
}
