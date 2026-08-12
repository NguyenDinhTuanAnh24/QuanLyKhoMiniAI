const crypto = require('crypto');

// In-memory cache for request idempotency (TTL: 5 seconds by default)
const requestCache = new Map();
const TTL_MS = 5000;

// Cleanup expired cache entries periodically every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of requestCache.entries()) {
    if (now - item.timestamp > TTL_MS) {
      requestCache.delete(key);
    }
  }
}, 30000).unref(); // unref so it won't keep process alive in tests

/**
 * Middleware to prevent double submission of inventory & order requests
 */
const idempotencyMiddleware = (req, res, next) => {
  try {
    // 1. Get explicit idempotency key from header or compute payload hash
    const headerKey = req.headers['x-idempotency-key'];
    let cacheKey;

    if (headerKey) {
      cacheKey = `hdr_${req.user ? req.user.user_id : 'anon'}_${headerKey}`;
    } else {
      // Compute fingerprint from user ID + HTTP method + route path + JSON body
      const payloadString = JSON.stringify(req.body || {});
      const hash = crypto.createHash('md5').update(payloadString).digest('hex');
      cacheKey = `fp_${req.user ? req.user.user_id : 'anon'}_${req.baseUrl}${req.path}_${hash}`;
    }

    const now = Date.now();
    const cached = requestCache.get(cacheKey);

    if (cached && (now - cached.timestamp < TTL_MS)) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_SUBMISSION',
        message: 'Thao tác đang được xử lý hoặc đã được gửi trùng lặp. Vui lòng chờ vài giây trước khi thử lại.'
      });
    }

    // Set cache entry for this request key
    requestCache.set(cacheKey, { timestamp: now });

    next();
  } catch (err) {
    // If idempotency check fails unexpectedly, allow request to proceed safely
    console.error('Idempotency middleware error:', err);
    next();
  }
};

module.exports = idempotencyMiddleware;
