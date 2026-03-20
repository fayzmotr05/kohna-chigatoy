import crypto from 'crypto';

interface ValidatedData {
  valid: true;
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
}

interface InvalidData {
  valid: false;
  error: string;
}

type ValidationResult = ValidatedData | InvalidData;

/**
 * Validate Telegram Mini App initData using HMAC-SHA256.
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string): ValidationResult {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { valid: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  if (!initData) {
    return { valid: false, error: 'initData is empty' };
  }

  // Parse the query string
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    return { valid: false, error: 'Missing hash' };
  }

  // Check auth_date is not older than 1 hour
  const authDate = params.get('auth_date');
  if (!authDate) {
    return { valid: false, error: 'Missing auth_date' };
  }

  const authTimestamp = parseInt(authDate, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authTimestamp > 3600) {
    return { valid: false, error: 'initData expired (older than 1 hour)' };
  }

  // Build data-check-string: sorted key=value pairs joined by \n, excluding hash
  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // secret_key = HMAC-SHA256("WebAppData", bot_token)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // computed_hash = HMAC-SHA256(secret_key, data_check_string)
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Timing-safe comparison
  const hashBuffer = Buffer.from(hash, 'hex');
  const computedBuffer = Buffer.from(computedHash, 'hex');

  if (hashBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(hashBuffer, computedBuffer)) {
    return { valid: false, error: 'Invalid hash' };
  }

  // Extract user
  const userParam = params.get('user');
  if (!userParam) {
    return { valid: false, error: 'Missing user data' };
  }

  try {
    const user = JSON.parse(userParam);
    return {
      valid: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code,
      },
    };
  } catch {
    return { valid: false, error: 'Invalid user JSON' };
  }
}
