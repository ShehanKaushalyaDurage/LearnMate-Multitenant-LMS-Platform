/**
 * LearnHub — Typed Configuration Loader
 *
 * Loads and validates all environment variables with sensible defaults.
 * Accessed via ConfigService.get('database.masterUrl'), etc.
 */
export default () => ({
    // Application
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    appDomain: process.env.APP_DOMAIN || 'learnhub.lk',

    // Master Database
    database: {
        masterUrl: process.env.MASTER_DATABASE_URL,
        tenantHost: process.env.TENANT_DB_HOST || 'localhost',
        tenantPort: parseInt(process.env.TENANT_DB_PORT ?? '5432', 10),
        tenantUser: process.env.TENANT_DB_USER || 'learnhub',
        tenantPassword: process.env.TENANT_DB_PASSWORD,
    },

    // Redis
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },

    // JWT Authentication
    jwt: {
        secret: process.env.JWT_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },

    // Encryption (AES-256-GCM)
    encryption: {
        key: process.env.ENCRYPTION_KEY,
    },

    // Cloudflare R2 (File Storage)
    r2: {
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucketName: process.env.R2_BUCKET_NAME || 'learnhub-files',
        publicUrl: process.env.R2_PUBLIC_URL,
    },

    // Bunny.net CDN (Video)
    bunny: {
        apiKey: process.env.BUNNY_API_KEY,
        libraryId: process.env.BUNNY_LIBRARY_ID,
        cdnHostname: process.env.BUNNY_CDN_HOSTNAME,
    },

    // Resend (Email)
    email: {
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.EMAIL_FROM || 'noreply@learnhub.lk',
    },

    // SMS Gateway
    sms: {
        apiUrl: process.env.SMS_API_URL,
        apiKey: process.env.SMS_API_KEY,
        senderId: process.env.SMS_SENDER_ID || 'LearnHub',
    },

    // PayHere Payment Gateway
    payhere: {
        merchantId: process.env.PAYHERE_MERCHANT_ID,
        merchantSecret: process.env.PAYHERE_MERCHANT_SECRET,
        baseUrl: process.env.PAYHERE_BASE_URL || 'https://sandbox.payhere.lk',
    },

    // Rate Limiting
    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
    },
});
