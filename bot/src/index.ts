import 'dotenv/config';
import { createBot } from './bot';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = createBot(token);

bot.start({
  onStart: () => {
    console.log('🤖 Ko\'hna Chig\'atoy bot is running!');
  },
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down bot...');
  bot.stop();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
