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

  // Use URLSearchParams for correct decoding of the query string
  const params = new URLSearchParams(initData);

  const hash = params.get('hash');
  if (!hash) {
    return { valid: false, error: 'Missing hash' };
  }

  const authDate = params.get('auth_date');
  if (!authDate) {
    return { valid: false, error: 'Missing auth_date' };
  }

  const authTimestamp = parseInt(authDate, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authTimestamp > 86400) {
    return { valid: false, error: 'initData expired' };
  }

  // Build data-check-string per Telegram spec:
  // sorted "key=value" pairs separated by \n, excluding "hash"
  // Values must be the decoded form (URLSearchParams gives us decoded values)
  const entries: string[] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') {
      entries.push(`${key}=${value}`);
    }
  });
  entries.sort();
  const dataCheckString = entries.join('\n');

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
  try {
    const hashBuffer = Buffer.from(hash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (hashBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(hashBuffer, computedBuffer)) {
      return { valid: false, error: 'Invalid hash' };
    }
  } catch {
    return { valid: false, error: 'Invalid hash format' };
  }

  // Extract user
  const userRaw = params.get('user');
  if (!userRaw) {
    return { valid: false, error: 'Missing user data' };
  }

  try {
    const user = JSON.parse(userRaw);
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
