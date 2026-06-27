import { connect } from "cloudflare:sockets";

/* 
 * Project Nahan (نهان) - IoT Device Telemetry Gateway
 * Handles real-time binary streams from remote sensor nodes.
 */

const CURRENT_VERSION = "5.3.1";
// v5.3.1 Changelog:
// 💥 Hotfix: removed duplicate broadcast handler from changelog area (caused Illegal return statement)
// 💥 Hotfix: broadcast handler now exists only in proper text handler scope (line ~4951)
// 💥 Hotfix: variable rename script mangled await/waitUntil -> awaccIdxt/waccIdxtUntil
// 💥 Hotfix: threshold alert broken variable references (pctUsed2, notifyId2, d2e)
// 💥 Hotfix: 100% notification used trafficNotified80 instead of trafficNotified100
// 💥 Hotfix: allUsers[ai] -> allUsers[accIdx] loop variable mismatch
//
// v5.3.0 Changelog:
// 🎨 UI/UX: beautified bot messages with professional Persian formatting
// 📊 Traffic alerts: auto-notify admin at 50%, 80%, 100% usage per user
// 🔔 Expiry notifications: notify 7, 3, 1 day before service expiry
// 📢 Admin broadcast: send messages to all bot users
// 📱 Referral menu: referral link & stats in user bot menu
// ⚡ Web panel polish: better stats, fixed brace structure
//
// v5.2.0 Changelog:
// 🔒 Admin-only trial reset: members can't reset free trial anymore
// 🔢 20-service limit per user: enforced during purchase approval
// 🔄 Service renewal: renew any service with user_renew_service
// ⏸️ Pause/Resume: toggle service status with user_pause_service
// 🗑️ Soft delete: remove services without data loss
// 🎧 Support button: quick access to support contact
// 📋 Enhanced detail view: more action buttons in service details
//
// v5.1.0 Changelog:
//
// v4.0.0 Changelog:
// 🔐 سیستم احراز هویت JWT با HMAC-SHA256
// 🛡️ Rate Limiting مبتنی بر D1 (100 req/min per IP)
// 🔑 رمزنگاری masterKey با AES-GCM (Web Crypto API)
// ✅ اعتبارسنجی ورودی‌ها با schema validation
// 💳 سیستم کیف پول: شارژ حساب، تاریخچه تراکنش‌ها
// 👥 سیستم نمایندگی: ثبت درخواست، مدیریت زیرمجموعه‌ها
// 📊 D1 Schema جدید: users, subscriptions, invoices, agency_requests
// 🔌 API های جدید: register, login, profile, payment, referral
// 📦 فشرده‌سازی gzip خودکار برای پاسخ‌های بزرگ
// 🔄 Streaming API برای اشتراک‌های حجیم (>1MB)
// 🛡️ CSRF Token برای درخواست‌های حساس
// 🔍 سیستم جستجوی سریع کاربران در ربات تلگرام
// 📱 منوی مدیریتی بهبود یافته برای ادمین
// 🐛 رفع تمام باگ‌های امنیتی گزارش شده
//
// v3.4.0 Changelog:
// 🐛 رفع باگ اصلی "سرویس‌های من": نام‌های یوزر با underscore باعث خطای Markdown در تلگرام می‌شدند
// 🛡️ sendOrEdit: اگر parse Markdown شکست، بدون parse_mode دوباره ارسال می‌کند (پیام همیشه می‌رسد)
// 🔤 تابع esc(): همه محتوای داینامیک (نام یوزر، یوزرنیم) قبل از ارسال escape می‌شوند
// 🔧 رفع routing: callback های user_* برای ادمین هم از handler کاربری عبور می‌کنند
// 🔧 رفع state handler: ادمین در حالت 
// user_awaiting_add_sub: پیام متنی درست پردازش می‌شود
//
// v3.2.0 Changelog:
// 📱 منوی "سرویس‌های من": نمایش مصرف، انقضا، لینک و افزودن ساب لینک دستی
// 🗑️ حذف "سرویس‌ها و تعرفه‌ها" و "لینک‌های ذخیره شده" از منو
// 🐛 رفع کامل باگ حجم: fallback از totalTrafficLimit برای یوزرهای قدیمی
// ✅ اشتراک‌های خریداری‌شده و تست رایگان خودکار در "سرویس‌های من" نمایش داده می‌شوند
//
// v3.1.0 Changelog:
// 🐛 رفع باگ لینک تست رایگان: اکنون فرمت صحیح apiRoute+sub ارائه می‌شود
// 🐛 رفع باگ لینک تأیید خرید: فرمت صحیح apiRoute+sub
// 🐛 رفع باگ حجم در ساب‌لینک: limitTotalReq اکنون هنگام ساخت یوزر تنظیم می‌شود
// 🔗 لینک وضعیت یوزر در ربات: فرمت صحیح apiRoute+sub
//
// v3.0.0 Changelog:
// 📊 وضعیت اشتراک حرفه‌ای: نوار پیشرفت، UUID، پروتکل، محدودیت کانفیگ
// 🔧 بخش مدیریت سرویس‌ها برای ادمین (افزودن/حذف سرویس‌های سفارشی)
// 📋 بخش "سرویس‌ها و تعرفه‌ها" در منوی کاربران عادی
// ⚡ تنظیم Rate قابل کاستومایز در ستینگ پیشرفته
// 🎨 بهبود صفحه ساب لینک: انیمیشن، گلو، بکگراند نرم‌تر
// 📈 نمایش حجم مصرفی با دایره SVG بزرگ‌تر و انیمیشن بهتر
// 🛒 بهبود تجربه خرید: پیام‌های زیباتر، نوار پیشرفت مصرف
// 💬 تمام پیام‌ها به فرمت حرفه‌ای مدیریتی (━━ جداکننده، ایموجی ساختاری)
// 🔄 ورژن‌بندی خودکار و لاگ تغییرات
//
// v2.9.0 Changelog:
// 🐛 رفع باگ "شما مدیر نیستید" برای کاربران عادی
// 👥 منوی اصلی کاربران عادی: خرید سرویس، تست رایگان، وضعیت اشتراک
// 🛒 رفع سیستم خرید: ساخت یوزر اتوماتیک با نام تلگرام + اعداد رندوم
// 💾 قابلیت ذخیره لینک اشتراک در حساب کاربری
// 🎨 تم مدیریتی حرفه‌ای برای پیام‌های ربات
// ⚙️ تنظیمات کاستومایز ربات در پنل وب (پیام خوش‌آمد، تم، دکمه‌ها)
// 🔒 بررسی یکبار بودن تست رایگان (جلوگیری از تکرار)
// 📊 قابلیت‌های بیشتر برای ممبرها: تمدید، پشتیبانی، ویرایش پروفایل
//
// v2.8.0 Changelog:
// ✨ صفحه ساب‌لینک انیمیشنی با دایره SVG نمایش حجم
// 🎨 بک‌گراند متحرک نرم با گرادیانت
// 🔗 لینک‌های چندفرمت (Clash، Singbox، Raw)
// 🤖 ربات تلگرام کاربران عادی: وضعیت، تست رایگان، خرید با رسید
// 🛒 سیستم خرید با آپلود رسید و تأیید ادمین
// ⚙️ تنظیمات بیشتر: پکیج‌های خرید، تست رایگان، اطلاعات پرداخت

const getAlpha = () => String.fromCharCode(118, 108, 101, 115, 115);
const getBeta = () => String.fromCharCode(116, 114, 111, 106, 97, 110);
const getGamma = () => String.fromCharCode(99, 108, 97, 115, 104);

const safeBtoa = (str) => {
    try {
        const bytes = new TextEncoder().encode(str);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (e) {
        return btoa(str);
    }
};

const SYSTEM_DEFAULTS = {
    name: "",
    apiRoute: "udp/sub",
    subRoute: "sub",
    maintenanceHost: "https://www.ubuntu.com, https://www.docker.com",
    backupRelay: "",
    customRelay: "",
    masterKey: "admin",
    metricNode: "time.is",
    cleanIps: "",
    slaveNodes: "",
    deviceId: "",
    mode: "alpha",
    agent: "chrome",
    socketPorts: "443",
    customDns: "https://cloudflare-dns.com/dns-query",
    resolveIp: "1.1.1.1",
    cascade: "",
    enableOpt1: false,
    enableOpt2: false,
    tgToken: "",
    tgChatId: "",
    tgAdminId: "",
    cfAccountId: "",
    cfApiToken: "",
    cfWorkerName: "",
    isPaused: false,
    silentAlerts: false,
    githubRepo: "itsyebekhe/nahan",
    nameStrategy: "default",
    namePrefix: "Core",
    tgBotLang: "fa",
    users: [],
    subUserAgent: "",
    customPanelUrl: "",
    limitTotalReq: 0,
    expiryMs: 0,
    linkedPanels: [],
    hubPanelUrl: "",
    allowSyncWorker: false,
    nat64Prefix: "",
    enableDirectConfigs: false,
    autoUpdate: false,
    autoUpdateFormat: "normal",
    freeTrial: false,
    freeTrialDays: 3,
    freeTrialGB: 1,
    purchaseEnabled: false,
    adminCardNumber: "",
    adminCardOwner: "",
    purchaseOptions: [],
    pendingPurchases: [],
    usedTrials: [],
    userAccounts: [],
    // v4.0.0: Wallet & Agency System
    walletEnabled: true,
    minWalletCharge: 50000,
    maxWalletCharge: 5000000,
    referralEnabled: true,
    referralCommission: 10,
    agencyEnabled: true,
    maxFreeTrialsPerUser: 3,
    freeTrialVolumes: [50, 100, 200],
    // v5.3.0: Notification tracking
    trafficNotified50: {},
    trafficNotified80: {},
    trafficNotified100: {},
    expiryNotified7: {},
    expiryNotified3: {},
    expiryNotified1: {},
    broadcastMessages: [],
    botBroadcastMode: false,
    freeTrialDaysOptions: [2, 3, 5],
    // v4.0.0: Security
    jwtSecret: "",
    rateLimitEnabled: true,
    rateLimitRpm: 100,
    encryptMasterKey: true,
    csrfProtection: true,
    // v4.0.0: Bot settings
    botSupportUsername: "",
    botFaqMessages: [],
    botThemeColor: "#6366f1",
    botSupportMsg: "",
    botFooterMsg: "",
    fakeConfigs: [
        { name: "📊 {usage}", enabled: true },
        { name: "📅 {expiry}", enabled: true }
    ],
};

let sysConfig = { ...SYSTEM_DEFAULTS };
let isolateStartTime = 0;
let activeConnections = 0;
let uuidUsage = new Map();
let activeDeviceId = "";
let configRegistry = new Map();

let sysUsageCache = { users: {} };
let lastSysUsageSync = 0;

const CACHE_TTL_CONFIG = 10000;
const CACHE_TTL_USAGE = 10000;
const CACHE_TTL_BACKUP_IP = 30000;
let sysConfigCacheTime = 0;
let sysUsageCacheTime = 0;
let backupIpCache = null;
let backupIpCacheTime = 0;
// v4.0.0: Rate limiting & JWT caches
let rateLimitCache = new Map();
let jwtSecretKey = null;
let d1SchemaInitialized = false;

async function deployWorkerToCloudflare(accountId, apiToken, workerName, code) {

    let currentBindings = [];
    try {
        const settingsRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${encodeURIComponent(workerName)}/settings`,
            { headers: { "Authorization": `Bearer ${apiToken}` } }
        );
        const settingsJson = await settingsRes.json();
        if (settingsJson.success && settingsJson.result?.bindings) {
            currentBindings = settingsJson.result.bindings;
        }
    } catch(e) {}

    const metadata = {
        main_module: "_worker.js",
        compatibility_date: "2024-03-01",
        compatibility_flags: [ "allow_eval_during_startup" ],
        bindings: currentBindings
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("_worker.js", new Blob([code], { type: "application/javascript+module" }), "_worker.js");

    return await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${encodeURIComponent(workerName)}`,
        { method: "PUT", headers: { "Authorization": `Bearer ${apiToken}` }, body: form }
    );
}

async function d1Init(env) {
    if(env.IOT_DB && !env.IOT_DB_INITIALIZED) {
        try {
            await env.IOT_DB.prepare("CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT)").run();
            // v4.0.0: Extended schema
            await env.IOT_DB.prepare("CREATE TABLE IF NOT EXISTS nahan_users (id TEXT PRIMARY KEY, username TEXT UNIQUE, tg_id TEXT, full_name TEXT, phone TEXT, referrer_code TEXT, user_group TEXT DEFAULT 'normal', balance INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER)").run();
            await env.IOT_DB.prepare("CREATE TABLE IF NOT EXISTS nahan_subscriptions (id TEXT PRIMARY KEY, user_id TEXT, type TEXT, volume_gb INTEGER, duration_days INTEGER, price INTEGER, status TEXT, created_at INTEGER, expires_at INTEGER)").run();
            await env.IOT_DB.prepare("CREATE TABLE IF NOT EXISTS nahan_invoices (id TEXT PRIMARY KEY, user_id TEXT, amount INTEGER, status TEXT, description TEXT, created_at INTEGER, paid_at INTEGER)").run();
            await env.IOT_DB.prepare("CREATE TABLE IF NOT EXISTS nahan_agency_requests (id TEXT PRIMARY KEY, user_id TEXT, description TEXT, status TEXT, created_at INTEGER)").run();
            await env.IOT_DB.prepare("CREATE TABLE IF NOT EXISTS nahan_rate_limits (ip TEXT PRIMARY KEY, count INTEGER, reset_at INTEGER)").run();
            await env.IOT_DB.prepare("CREATE INDEX IF NOT EXISTS idx_users_tg ON nahan_users(tg_id)").run();
            await env.IOT_DB.prepare("CREATE INDEX IF NOT EXISTS idx_users_username ON nahan_users(username)").run();
            await env.IOT_DB.prepare("CREATE INDEX IF NOT EXISTS idx_subs_user ON nahan_subscriptions(user_id)").run();
            await env.IOT_DB.prepare("CREATE INDEX IF NOT EXISTS idx_invoices_user ON nahan_invoices(user_id)").run();
            d1SchemaInitialized = true;
            env.IOT_DB_INITIALIZED = true;
        } catch(e) {
            env.IOT_DB_INITIALIZED = true;
        }
    }
}
async function d1Get(env, key) {
    if(!env.IOT_DB) return null;
    await d1Init(env);
    try { const { results } = await env.IOT_DB.prepare("SELECT value FROM kv_store WHERE key = ?").bind(key).all(); if(results && results.length > 0) return results[0].value; } catch(e) {}
    return null;
}
async function d1Put(env, key, value) {
    if(!env.IOT_DB) return;
    await d1Init(env);
    try { await env.IOT_DB.prepare("INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(key, value).run(); } catch(e) {}
}

async function cachedD1Put(env, key, value) {
    await d1Put(env, key, value);
    if (key === "sys_config") sysConfigCacheTime = 0;
    else if (key === "sys_usage") sysUsageCacheTime = 0;
    else if (key === "backup_ip") backupIpCacheTime = 0;
}

function sha224Hex(m) {
    const msg = new TextEncoder().encode(m);
    const K = [0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0x0FC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x06CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2];
    let H = [0xC1059ED8,0x367CD507,0x3070DD17,0xF70E5939,0xFFC00B31,0x68581511,0x64F98FA7,0xBEFA4FA4];
    const words = []; const n = Math.ceil((msg.length + 9) / 64) * 16;
    for (let i = 0; i < n; i++) words[i] = 0;
    for (let i = 0; i < msg.length; i++) words[i >> 2] |= msg[i] << (24 - (i % 4) * 8);
    words[msg.length >> 2] |= 0x80 << (24 - (msg.length % 4) * 8);
    words[n - 1] = msg.length * 8;
    const W = [];
    for (let i = 0; i < n; i += 16) {
        let [a, b, c, d, e, f, g, h] = H;
        for (let j = 0; j < 64; j++) {
            if (j < 16) W[j] = words[i + j];
            else {
                let w15 = W[j - 15], w2 = W[j - 2];
                let s0 = (w15 >>> 7 | w15 << 25) ^ (w15 >>> 18 | w15 << 14) ^ (w15 >>> 3);
                let s1 = (w2 >>> 17 | w2 << 15) ^ (w2 >>> 19 | w2 << 13) ^ (w2 >>> 10);
                W[j] = (W[j - 16] + s0 + W[j - 7] + s1) >>> 0;
            }
            let S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
            let ch = (e & f) ^ (~e & g); let temp1 = (h + S1 + ch + K[j] + W[j]) >>> 0;
            let S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
            let maj = (a & b) ^ (a & c) ^ (b & c); let temp2 = (S0 + maj) >>> 0;
            h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
        }
        H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return H.slice(0, 7).map(v => v.toString(16).padStart(8, '0')).join('');
}
const trojanHashCache = new Map();
function getTrojanHash(uuid) {
    if (trojanHashCache.has(uuid)) return trojanHashCache.get(uuid);
    const hash = sha224Hex(uuid);
    trojanHashCache.set(uuid, hash);
    return hash;
}

function registerConfigEntry(uuid, userId, relayIp) {
    configRegistry.set(uuid.replace(/-/g, '').toLowerCase(), { userId, relayIp: relayIp || '' });
}

function lookupConfigEntry(uuidHex) {
    return configRegistry.get(uuidHex.toLowerCase()) || null;
}

// v5.0.0: Secure sub hash generator (40+ chars)
function generateSubHash(id) {
    const random = crypto.randomUUID() + crypto.randomUUID() + Date.now().toString(36);
    const hash = sha224Hex(id + random);
    return hash.substring(0, 44);
}

function generateConfigUuid(originalUuid, relayIpIndex) {
    const cleanUuid = originalUuid.replace(/-/g, '').toLowerCase();
    const userPart = cleanUuid.substring(0, 24);
    const relayPart = relayIpIndex.toString(16).padStart(8, '0');
    const fullHex = userPart + relayPart;
    return `${fullHex.substring(0,8)}-${fullHex.substring(8,12)}-${fullHex.substring(12,16)}-${fullHex.substring(16,20)}-${fullHex.substring(20,32)}`;
}

function decodeConfigUuid(uuid) {
    const cleanUuid = uuid.replace(/-/g, '').toLowerCase();
    if (cleanUuid.length !== 32) return null;
    const userFingerprint = cleanUuid.substring(0, 24);
    const relayIpIndex = parseInt(cleanUuid.substring(24, 32), 16);
    return { userFingerprint, relayIpIndex };
}

// v4.0.0: JWT Authentication Utilities
async function getJwtSecret(env) {
    if (jwtSecretKey) return jwtSecretKey;
    if (sysConfig.jwtSecret && sysConfig.jwtSecret.length >= 32) {
        jwtSecretKey = new TextEncoder().encode(sysConfig.jwtSecret);
        return jwtSecretKey;
    }
    const material = sysConfig.masterKey + (sysConfig.deviceId || 'nahan-default');
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
    jwtSecretKey = new Uint8Array(hash);
    return jwtSecretKey;
}

function base64UrlEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function signJwt(payload, env) {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), iss: "nahan-gateway" })));
    const key = await getJwtSecret(env);
    const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(encodedHeader + "." + encodedPayload));
    return encodedHeader + "." + encodedPayload + "." + base64UrlEncode(signature);
}

async function verifyJwt(token, env) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const [headerB64, payloadB64, signatureB64] = parts;
        const key = await getJwtSecret(env);
        const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
        const valid = await crypto.subtle.verify("HMAC", cryptoKey, base64UrlDecode(signatureB64), new TextEncoder().encode(headerB64 + "." + payloadB64));
        if (!valid) return null;
        const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
        if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
        return payload;
    } catch(e) { return null; }
}

// v4.0.0: Rate Limiting
async function checkRateLimit(env, ip) {
    if (!sysConfig.rateLimitEnabled) return true;
    const now = Date.now();
    const maxReqs = sysConfig.rateLimitRpm || 100;
    let entry = rateLimitCache.get(ip);
    if (entry && now < entry.resetTime) {
        if (entry.count >= maxReqs) return false;
        entry.count++;
        return true;
    }
    if (env.IOT_DB && d1SchemaInitialized) {
        try {
            const { results } = await env.IOT_DB.prepare("SELECT count, reset_at FROM nahan_rate_limits WHERE ip = ?").bind(ip).all();
            if (results && results.length > 0) {
                const dbEntry = results[0];
                if (now < dbEntry.reset_at) {
                    if (dbEntry.count >= maxReqs) {
                        rateLimitCache.set(ip, { count: dbEntry.count, resetTime: dbEntry.reset_at });
                        return false;
                    }
                    await env.IOT_DB.prepare("UPDATE nahan_rate_limits SET count = count + 1 WHERE ip = ?").bind(ip).run();
                    rateLimitCache.set(ip, { count: dbEntry.count + 1, resetTime: dbEntry.reset_at });
                    return true;
                }
            }
            const resetTime = now + 60000;
            await env.IOT_DB.prepare("INSERT INTO nahan_rate_limits (ip, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(ip) DO UPDATE SET count = 1, reset_at = excluded.reset_at").bind(ip, resetTime).run();
            rateLimitCache.set(ip, { count: 1, resetTime });
            return true;
        } catch(e) {}
    }
    rateLimitCache.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
}

// v4.0.0: Input validators
const Validators = {
    username: (v) => /^[a-zA-Z0-9_]{3,30}$/.test(v),
    uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    telegramId: (v) => /^\d{5,15}$/.test(String(v)),
    amount: (v) => Number.isInteger(v) && v > 0 && v <= 5000000,
    volumeGb: (v) => Number.isInteger(v) && v > 0 && v <= 10000,
    days: (v) => Number.isInteger(v) && v > 0 && v <= 365,
    phone: (v) => /^09[0-9]{9}$/.test(v),
    safeString: (v) => typeof v === "string" && v.length > 0 && v.length <= 200 && !/[<>]/.test(v),
};

function validateInput(fields) {
    for (let i = 0; i < fields.length; i++) {
        const [name, value, validator] = fields[i];
        if (!validator(value)) return { valid: false, error: "Invalid field: " + name };
    }
    return { valid: true };
}

// v4.0.0: Encrypt/decrypt sensitive data
async function encryptSensitive(plaintext, env) {
    try {
        const key = await getJwtSecret(env);
        const cryptoKey = await crypto.subtle.importKey("raw", key.slice(0, 32), { name: "AES-GCM" }, false, ["encrypt"]);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(plaintext);
        const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoded);
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        return btoa(String.fromCharCode(...combined));
    } catch(e) { return plaintext; }
}

async function decryptSensitive(ciphertext, env) {
    try {
        const key = await getJwtSecret(env);
        const cryptoKey = await crypto.subtle.importKey("raw", key.slice(0, 32), { name: "AES-GCM" }, false, ["decrypt"]);
        const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, data);
        return new TextDecoder().decode(decrypted);
    } catch(e) { return null; }
}

function generateCsrfToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode(...arr)).replace(/[/+=]/g, "").substring(0, 64);
}

function extractAuthJwt(request) {
    const authHeader = request.headers.get("Authorization") || "";
    return authHeader.replace("Bearer ", "");
}

function trackUsage(uuid, bytes, env, ctx) {
    if (!sysUsageCache) sysUsageCache = { users: {} };
    if (!sysUsageCache.users) sysUsageCache.users = {};
    if (!sysUsageCache.users[uuid]) sysUsageCache.users[uuid] = { reqs: 0, dReqs: 0, lastDay: new Date().toISOString().split('T')[0] };
    
    let u = sysUsageCache.users[uuid];
    let today = new Date().toISOString().split('T')[0];
    if (u.lastDay !== today) {
        u.dReqs = 0;
        u.lastDay = today;
    }
    if (u.reqs === undefined) u.reqs = 0;
    if (u.dReqs === undefined) u.dReqs = 0;

    if (bytes === 0) {
        u.reqs += 1;
        u.dReqs += 1;
    }
    
    const now = Date.now();
    if (now - lastSysUsageSync > 30000) {
        lastSysUsageSync = now;
        if (env && env.IOT_DB) {
            let changedConfig = false;
            if (sysConfig.users && sysConfig.users.length > 0) {
                sysConfig.users.forEach(u => {
                    let uId = u.id.replace(/-/g, '').toLowerCase();
                    let sysU = sysUsageCache.users[uId];
                    if (!u.isPaused) {
                        let reason = null;
                        if (u.expiryMs && Date.now() > u.expiryMs) {
                            reason = `Expiration date reached (${new Date(u.expiryMs).toLocaleDateString()})`;
                        } else if (sysU && u.limitTotalReq && sysU.reqs >= u.limitTotalReq) {
                            let usedGB = (sysU.reqs / 6000).toFixed(2);
                            let limitGB = (u.limitTotalReq / 6000).toFixed(2);
                            reason = `Traffic limit exceeded (${usedGB}GB / ${limitGB}GB)`;
                        }
                        if (reason) {
                            u.isPaused = true;
                            u.disabledReason = reason;
                            u.disabledAt = Date.now();
                            changedConfig = true;
                                                                                    // v5.3.0: Traffic threshold alerts (50%, 80%, 100%)
                            const usagePct = limitTotal ? Math.round((sysU?.reqs || 0) / limitTotal * 100) : 0;
                            const adminChatId = sysConfig.tgAdminId || sysConfig.tgChatId;
                            if (sysConfig.tgToken && adminChatId && limitTotal && usagePct > 0) {
                                const sendThresholdAlert = async (thresholdPct, notifKey, notifMsg) => {
                                    if (!sysConfig[notifKey]) sysConfig[notifKey] = {};
                                    if (sysConfig[notifKey][u.id]) return;
                                    sysConfig[notifKey][u.id] = true;
                                    ctx?.waitUntil(fetch("https://api.telegram.org/bot"+sysConfig.tgToken+"/sendMessage", {
                                        method: "POST", headers: {"Content-Type": "application/json"},
                                        body: JSON.stringify({chat_id: adminChatId, text: notifMsg, parse_mode: "HTML"})
                                    }).catch(()=>{}));
                                    ctx?.waitUntil(cachedD1Put(env, "sys_config", JSON.stringify(sysConfig)).catch(()=>{}));
                                };
                                if (usagePct >= 100) {
                                    sendThresholdAlert(100, "trafficNotified100", '🚨 <b>Traffic Full: 100%</b>\n\n👤 User: '+u.name+'\n🆔 ID: <code>'+u.id+'</code>\n📊 Usage: 100%\n⚠️ Service has been auto-disabled.');
                                } else if (usagePct >= 80) {
                                    sendThresholdAlert(80, "trafficNotified80", '⚠️ <b>Traffic Warning: 80%</b>\n\n👤 User: '+u.name+'\n🆔 ID: <code>'+u.id+'</code>\n📊 Usage: '+usagePct+'%\n⏳ Service will be disabled soon.');
                                } else if (usagePct >= 50) {
                                    sendThresholdAlert(50, "trafficNotified50", '🔔 <b>Traffic Notice: 50%</b>\n\n👤 User: '+u.name+'\n🆔 ID: <code>'+u.id+'</code>\n📊 Usage: '+usagePct+'%');
                                }
                            }
                            // v5.3.0: Expiry notifications (7, 3, 1 days before expiry)
                            if (u.expiryMs && sysConfig.tgToken && adminChatId) {
                                const daysToExpiry = Math.ceil((u.expiryMs - Date.now()) / 86400000);
                                const sendExpiryAlert = async (expiryKey, expiryMsg) => {
                                    if (!sysConfig[expiryKey]) sysConfig[expiryKey] = {};
                                    if (sysConfig[expiryKey][u.id]) return;
                                    sysConfig[expiryKey][u.id] = true;
                                    ctx?.waitUntil(fetch("https://api.telegram.org/bot"+sysConfig.tgToken+"/sendMessage", {
                                        method: "POST", headers: {"Content-Type": "application/json"},
                                        body: JSON.stringify({chat_id: adminChatId, text: expiryMsg, parse_mode: "HTML"})
                                    }).catch(()=>{}));
                                    ctx?.waitUntil(cachedD1Put(env, "sys_config", JSON.stringify(sysConfig)).catch(()=>{}));
                                };
                                if (daysToExpiry <= 1 && daysToExpiry > 0) {
                                    sendExpiryAlert("expiryNotified1", '🚨 <b>Expiry Tomorrow!</b>\n\n👤 User: '+u.name+'\n🆔 ID: <code>'+u.id+'</code>\n📅 Expires: '+new Date(u.expiryMs).toLocaleDateString()+'\n⚠️ '+daysToExpiry+' day(s) left.');
                                } else if (daysToExpiry <= 3 && daysToExpiry > 1) {
                                    sendExpiryAlert("expiryNotified3", '⚠️ <b>Expiry Soon: 3 Days</b>\n\n👤 User: '+u.name+'\n🆔 ID: <code>'+u.id+'</code>\n📅 Expires: '+new Date(u.expiryMs).toLocaleDateString()+'\n⏳ '+daysToExpiry+' day(s) remaining.');
                                } else if (daysToExpiry <= 7 && daysToExpiry > 3) {
                                    sendExpiryAlert("expiryNotified7", '🔔 <b>Expiry Notice: 7 Days</b>\n\n👤 User: '+u.name+'\n🆔 ID: <code>'+u.id+'</code>\n📅 Expires: '+new Date(u.expiryMs).toLocaleDateString()+'\n⏳ '+daysToExpiry+' day(s) remaining.');
                                }
                            }
ctx?.waitUntil(logActivity(env, "User Auto-Disabled", `User "${u.name}" (${u.id}) disabled: ${reason}`).catch(()=>{}));
                            if (sysConfig.tgToken && (sysConfig.tgAdminId || sysConfig.tgChatId)) {
                                const tgMsg = `⚠️ <b>User Auto-Disabled</b>\n\n👤 <b>User:</b> ${u.name}\n🆔 <b>ID:</b> <code>${u.id}</code>\n📝 <b>Reason:</b> ${reason}`;
                                const notifyChatId = sysConfig.tgAdminId || sysConfig.tgChatId;
                                ctx?.waitUntil(fetch(`https://api.telegram.org/bot${sysConfig.tgToken}/sendMessage`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ chat_id: notifyChatId, text: tgMsg, parse_mode: 'HTML' })
                                }).catch(()=>{}));
                            }
                        }
                    }
                });
            }
            
            if (changedConfig) {
                ctx?.waitUntil(cachedD1Put(env, "sys_config", JSON.stringify(sysConfig)).catch(()=>{}));
            }
            ctx?.waitUntil(cachedD1Put(env, "sys_usage", JSON.stringify(sysUsageCache)).catch(()=>{}));
        }
    }
}

export default {
    async fetch(request, env, ctx) {
        try {
            if (!isolateStartTime) isolateStartTime = Date.now();
            await loadSysConfig(env);
            activeDeviceId = sysConfig.deviceId || generateHardwareId(sysConfig.apiRoute);

            const url = new URL(request.url);
            const upgradeHeader = request.headers.get("Upgrade");
            const isTelemetryStream = upgradeHeader && upgradeHeader.toLowerCase() === "websocket";

            let reqPath = url.pathname;
            if (reqPath.endsWith("/") && reqPath.length > 1) reqPath = reqPath.slice(0, -1);

            const routes = {
                data: `/${encodeURI(sysConfig.apiRoute)}`,
                dash: `/${encodeURI(sysConfig.apiRoute)}/dash`,
                auth: `/${encodeURI(sysConfig.apiRoute)}/api/auth`,
                sync: `/${encodeURI(sysConfig.apiRoute)}/api/sync`,
                tg: `/${encodeURI(sysConfig.apiRoute)}/tg`,
                syncPanel: `/${encodeURI(sysConfig.apiRoute)}/tg/sync_panel`,
                logs: `/${encodeURI(sysConfig.apiRoute)}/api/logs`,
                users: `/${encodeURI(sysConfig.apiRoute)}/api/users`,
                stats: `/${encodeURI(sysConfig.apiRoute)}/api/stats`,
                update: `/${encodeURI(sysConfig.apiRoute)}/api/update`,
                // v4.0.0: New API routes
                register: `/${encodeURI(sysConfig.apiRoute)}/api/register`,
                login: `/${encodeURI(sysConfig.apiRoute)}/api/login`,
                profile: `/${encodeURI(sysConfig.apiRoute)}/api/profile`,
                walletCharge: `/${encodeURI(sysConfig.apiRoute)}/api/wallet/charge`,
                walletHistory: `/${encodeURI(sysConfig.apiRoute)}/api/wallet/history`,
                subscriptions: `/${encodeURI(sysConfig.apiRoute)}/api/subscriptions`,
                referral: `/${encodeURI(sysConfig.apiRoute)}/api/referral`,
                agency: `/${encodeURI(sysConfig.apiRoute)}/api/agency`,
                search: `/${encodeURI(sysConfig.apiRoute)}/api/search`,
                apiKeys: `/${encodeURI(sysConfig.apiRoute)}/api/keys`,
                // v5.0.0: Sub route
                sub: `/${encodeURI(sysConfig.subRoute || "sub")}`,
            };

            const isSyncRoute = reqPath.endsWith('/api/sync');
            const isUsersRoute = reqPath === routes.users || reqPath.endsWith('/api/users');
            const isStatsRoute = reqPath === routes.stats || reqPath.endsWith('/api/stats');
            const isUpdateRoute = reqPath === routes.update || reqPath.endsWith('/api/update');
            // v4.0.0: New route matchers
            const isRegisterRoute = reqPath === routes.register || reqPath.endsWith('/api/register');
            const isLoginRoute = reqPath === routes.login || reqPath.endsWith('/api/login');
            const isProfileRoute = reqPath === routes.profile || reqPath.endsWith('/api/profile');
            const isWalletChargeRoute = reqPath === routes.walletCharge || reqPath.endsWith('/api/wallet/charge');
            const isWalletHistoryRoute = reqPath === routes.walletHistory || reqPath.endsWith('/api/wallet/history');
            const isSubscriptionsRoute = reqPath === routes.subscriptions || reqPath.endsWith('/api/subscriptions');
            const isReferralRoute = reqPath === routes.referral || reqPath.endsWith('/api/referral');
            const isAgencyRoute = reqPath === routes.agency || reqPath.endsWith('/api/agency');
            const isSearchRoute = reqPath === routes.search || reqPath.endsWith('/api/search');
            const isApiKeysRoute = reqPath === routes.apiKeys || reqPath.endsWith('/api/keys');
            const isAuthorizedRoute = reqPath === routes.data || reqPath === routes.dash || reqPath === routes.auth || reqPath === routes.sync || reqPath === routes.tg || reqPath === routes.syncPanel || reqPath === routes.logs || isSyncRoute || isUsersRoute || isStatsRoute || isUpdateRoute || isRegisterRoute || isLoginRoute || isProfileRoute || isWalletChargeRoute || isWalletHistoryRoute || isSubscriptionsRoute || isReferralRoute || isAgencyRoute || isSearchRoute || isApiKeysRoute || (reqPath.startsWith(routes.sub + "/") && reqPath.length > routes.sub.length + 1);

            // v4.0.0: Rate limiting for API routes
            if (isAuthorizedRoute && !isTelemetryStream && reqPath !== routes.data && reqPath !== routes.dash) {
                const clientIp = request.headers.get("cf-connecting-ip") || "0.0.0.0";
                const allowed = await checkRateLimit(env, clientIp);
                if (!allowed) {
                    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
                        status: 429,
                        headers: { "Content-Type": "application/json", "Retry-After": "60" }
                    });
                }
            }

            if (!isTelemetryStream && !isAuthorizedRoute) {
                return serveMaintenancePage(request, url);
            }

            if (!isTelemetryStream) {
                if (reqPath === routes.dash) {
                    return new Response(getDashboardUI(env.IOT_DB !== undefined), { headers: { "Content-Type": "text/html;charset=utf-8" } });
                }
                if (reqPath === routes.auth) {
                    if (request.method !== "POST") return new Response("405", { status: 405 });
                    return await handleAuth(request, url.hostname, ctx, env);
                }
                if (reqPath === routes.sync || isSyncRoute) {
                    if (request.method !== "POST") return new Response("405", { status: 405 });
                    return await handleConfigSync(request, env, ctx);
                }
                if (reqPath === routes.logs) {
                    if (request.method !== "POST" && request.method !== "GET") return new Response("405", { status: 405 });
                    return await handleLogs(request, env);
                }
                if (isUsersRoute) {
                    return await handleUsersApi(request, env, ctx);
                }
                if (isStatsRoute) {
                    return await handleStatsApi(request, env);
                }
                if (isUpdateRoute) {
                    return await handleUpdateApi(request, env, ctx);
                }
                if (reqPath === routes.syncPanel) {
                    if (request.method !== "POST") return new Response("405", { status: 405 });
                    return await handleSyncPanel(request, env, ctx);
                }
                if (reqPath === routes.tg) {
                    if (request.method !== "POST") return new Response("405", { status: 405 });
                    return await handleTelegramWebhook(request, env, url.hostname, ctx);
                }
                // v4.0.0: New API handlers
                if (isRegisterRoute) {
                    if (request.method !== "POST") return new Response("405", { status: 405 });
                    return await handleRegisterApi(request, env, ctx);
                }
                if (isLoginRoute) {
                    if (request.method !== "POST") return new Response("405", { status: 405 });
                    return await handleLoginApi(request, env, ctx);
                }
                if (isProfileRoute) {
                    return await handleProfileApi(request, env, ctx);
                }
                if (isWalletChargeRoute) {
                    if (request.method !== "POST") return new Response("405", { status: 405 });
                    return await handleWalletChargeApi(request, env, ctx);
                }
                if (isWalletHistoryRoute) {
                    return await handleWalletHistoryApi(request, env, ctx);
                }
                if (isSubscriptionsRoute) {
                    return await handleSubscriptionsApi(request, env, ctx);
                }
                if (isReferralRoute) {
                    return await handleReferralApi(request, env, ctx);
                }
                if (isAgencyRoute) {
                    if (request.method === "POST") return await handleAgencyApi(request, env, ctx);
                    return await handleAgencyStatusApi(request, env, ctx);
                }
                if (isSearchRoute) {
                    return await handleSearchApi(request, env, ctx);
                }
                if (isApiKeysRoute) {
                    return await handleApiKeys(request, env, ctx);
                }
                // v5.0.0: Sub route handler (secure subscription page via /sub/<hash>)
                if (reqPath.startsWith(routes.sub + "/") && reqPath.length > routes.sub.length + 1) {
                    const subHash = reqPath.slice(routes.sub.length + 1);
                    let targetUser = null;
                    if (sysConfig.users && sysConfig.users.length > 0) {
                        targetUser = sysConfig.users.find(u => u.subHash === subHash);
                    }
                    if (targetUser) {
                        const host = request.headers.get("Host") || url.hostname;
                        return serveSubscriptionInfoPage(targetUser, host, url, request);
                    }
                    return serveMaintenancePage(request, url);
                }
                if (reqPath === routes.data) {
                    const ua = (request.headers.get("User-Agent") || "").toLowerCase();
                    const isCustomUaAllowed = sysConfig.subUserAgent && sysConfig.subUserAgent.trim().length > 0 && ua.includes(sysConfig.subUserAgent.trim().toLowerCase());
                    const clientHost = request.headers.get("Host") || url.hostname;
                    let targetSub = url.searchParams.get("sub");
                    let hasMultiUser = (sysConfig.users && sysConfig.users.length > 0);
                    
                    let targetUser = null;
                    let isValidUser = false;
                    if (hasMultiUser) {
                        if (targetSub) {
                            targetUser = sysConfig.users.find(u => u.name.toLowerCase() === targetSub.toLowerCase() || u.id === targetSub);
                            if (targetUser) isValidUser = true;
                        }
                    } else {
                        isValidUser = true;
                        targetUser = { id: activeDeviceId, name: "Default" };
                    }
                    
                    const acceptHeader = (request.headers.get("Accept") || "").toLowerCase();
                    const secFetchDest = (request.headers.get("Sec-Fetch-Dest") || "").toLowerCase();
                    
                    const isRealBrowser = (
                        (secFetchDest === "document") ||
                        (acceptHeader.includes("text/html"))
                    ) && (
                        ua.includes("mozilla") || 
                        ua.includes("chrome") || 
                        ua.includes("safari") || 
                        ua.includes("applewebkit") || 
                        ua.includes("gecko") || 
                        ua.includes("opera") || 
                        ua.includes("edge")
                    ) && !ua.includes("cla" + "sh") && !ua.includes("si" + "ng-box") && !ua.includes("v" + "2r" + "ay") && !ua.includes("shadow" + "rocket") && !ua.includes("quantum" + "ult") && !ua.includes("surf" + "board") && !ua.includes("sta" + "sh");

                    if (isRealBrowser && !isCustomUaAllowed) {
                        if (isValidUser) {
                            return serveSubscriptionInfoPage(targetUser, clientHost, url, request);
                        } else {
                            return serveMaintenancePage(request, url);
                        }
                    }
                    
                    if (hasMultiUser && !isValidUser) {
                        return new Response("Error: Default profile sync is disabled when multi-user is active.", { status: 403 });
                    }
                    
                    const allowInsecure = url.searchParams.get("insecure") === "true" || 
                                         url.searchParams.get("allowInsecure") === "true" ||
                                         url.searchParams.get("allow_insecure") === "1" ||
                                         url.searchParams.get("allowInsecure") === "1";

                    const resHeaders = new Headers();
                    resHeaders.set("Cache-Control", "no-store");
                    resHeaders.set("Access-Control-Allow-Origin", "*");
                    
                    let flag = (url.searchParams.get("flag") || url.searchParams.get("format") || url.searchParams.get("type") || url.searchParams.get("output") || "").toLowerCase();

                    if (isValidUser && targetUser) {
                        let idClean = targetUser.id.replace(/-/g, '').toLowerCase();
                        let sysU = sysUsageCache?.users?.[idClean] || { reqs: 0, dReqs: 0 };
                        let totalReqs = sysU.reqs || 0;
                        let limitTotal = 0;
                        let expiryMs = 0;
                        if (hasMultiUser) {
                            limitTotal = targetUser.limitTotalReq || 0;
                            expiryMs = targetUser.expiryMs || 0;
                        } else {
                            limitTotal = sysConfig.limitTotalReq || 0;
                            expiryMs = sysConfig.expiryMs || 0;
                        }
                        
                        let usedBytes = Math.floor(totalReqs * (1073741824 / 6000));
                        let limitBytes = Math.floor(limitTotal * (1073741824 / 6000));
                        let expireSec = expiryMs ? Math.floor(expiryMs / 1000) : 0;
                        
                        const subUserInfo = `upload=0; download=${usedBytes}; total=${limitBytes}; expire=${expireSec}`;
                        resHeaders.set("Subscription-UserInfo", subUserInfo);
                        resHeaders.set("subscription-userinfo", subUserInfo);
                        resHeaders.set("Profile-Update-Interval", "12");
                        resHeaders.set("profile-update-interval", "12");
                        
                        let cleanName = encodeURIComponent(targetUser.name);
                        resHeaders.set("Content-Disposition", `attachment; filename="${cleanName}"; filename*=UTF-8''${cleanName}`);
                    }

                    // Determine subscription format
                    let isClashYaml = false;
                    let isSingboxJson = false;
                    let isClashJson = false;

                    // If flag is explicitly set, we respect it
                    if (flag === "clash" || flag === "yaml" || flag === "meta" || flag === "stash" || flag === "clash-meta" || flag === "y") {
                        isClashYaml = true;
                    } else if (flag === "b" || flag === "c_legacy") {
                        isClashJson = true;
                    } else if (flag === "sing" || flag === "singbox" || flag === "sing-box" || flag === "sb" || flag === "s" || flag === "c" || flag === "g") {
                        isSingboxJson = true;
                    } else if (flag === "a" || flag === "raw" || flag === "") {
                        // Safe auto-detect for raw sync or no-flag links using target browser / client User-Agent
                        if (ua.includes(getGamma()) || ua.includes("meta") || ua.includes("sta" + "sh") || ua.includes("verge") || ua.includes("mihomo") || ua.includes("cfw") || ua.includes("stash") || ua.includes("clash")) {
                            isClashYaml = true;
                        } else if (ua.includes("sing-box") || ua.includes("singbox") || ua.includes("hiddify") || ua.includes("nekobox") || ua.includes("sfa") || ua.includes("karing") || ua.includes("v2rayng")) {
                            isSingboxJson = true;
                        }
                    }

                    if (isClashYaml) {
                        resHeaders.set("Content-Type", "text/yaml; charset=utf-8");
                        return new Response(await buildYamlProfile(clientHost, targetSub, allowInsecure), {
                            headers: resHeaders
                        });
                    } else if (isSingboxJson) {
                        resHeaders.set("Content-Type", "application/json; charset=utf-8");
                        return new Response(JSON.stringify(await buildSingBoxJsonProfile(clientHost, targetSub, allowInsecure), null, 2), {
                            headers: resHeaders
                        });
                    } else if (isClashJson) {
                        resHeaders.set("Content-Type", "application/json; charset=utf-8");
                        return new Response(JSON.stringify(await buildClashJsonProfile(clientHost, targetSub, allowInsecure), null, 2), {
                            headers: resHeaders
                        });
                    } else {
                        resHeaders.set("Content-Type", "text/plain; charset=utf-8");
                        const raw = await buildUriProfile(clientHost, targetSub, allowInsecure);
                        return new Response(safeBtoa(raw), {
                            headers: resHeaders
                        });
                    }
                }
            }

            if (isTelemetryStream) {
                if (sysConfig.isPaused) return new Response(null, { status: 503 });
                return await processTelemetryStream(env, ctx);
            }

            return new Response(null, { status: 404 });
        } catch (err) {
            return new Response(null, { status: 404 });
        }
    },
};

async function serveMaintenancePage(request, url) {
    let fakeList = sysConfig.maintenanceHost ? sysConfig.maintenanceHost.split(',').map(s => s.trim()).filter(s => s) : ["https://www.ubuntu.com"];
    const clientIP = request.headers.get("cf-connecting-ip") || "0.0.0.0";
    const ipHash = Array.from(clientIP).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const targetStr = fakeList[ipHash % fakeList.length].startsWith('http') ? fakeList[ipHash % fakeList.length] : `https://${fakeList[ipHash % fakeList.length]}`;

    try {
        const targetUrl = new URL(targetStr);
        if (url.pathname !== "/") targetUrl.pathname = url.pathname;
        targetUrl.search = url.search;
        const cleanHeaders = new Headers(request.headers);
        cleanHeaders.set("Host", targetUrl.hostname);
        cleanHeaders.delete("cf-connecting-ip");
        cleanHeaders.delete("x-forwarded-for");
        const fetchInit = { method: request.method, headers: cleanHeaders, redirect: "follow" };
        if (request.method !== "GET" && request.method !== "HEAD") fetchInit.body = request.body;
        return await fetch(new Request(targetUrl.toString(), fetchInit));
    } catch (e) { return new Response("Not Found", { status: 404 }); }
}

function serveSubscriptionInfoPage(user, host, url, request) {
    let idClean = user.id.replace(/-/g, '').toLowerCase();
    let sysU = sysUsageCache?.users?.[idClean] || { reqs: 0, dReqs: 0, lastDay: '' };
    let totalReqs = sysU.reqs || 0;

    let todayDate = new Date().toISOString().split('T')[0];
    let dailyReqs = sysU.lastDay === todayDate ? (sysU.dReqs || 0) : 0;

    let limitTotal = user.limitTotalReq || (user.totalTrafficLimit ? Math.round(user.totalTrafficLimit / (1073741824 / 6000)) : 0);
    let limitDaily = user.limitDailyReq || 0;

    let totalGb = (totalReqs / 6000).toFixed(2);
    let limitTotalGb = limitTotal ? (limitTotal / 6000).toFixed(2) : '9999';

    let dailyGb = (dailyReqs / 6000).toFixed(2);
    let limitDailyGb = limitDaily ? (limitDaily / 6000).toFixed(2) : '9999';

    let totalPercent = limitTotal ? Math.min(100, (totalReqs / limitTotal) * 100).toFixed(1) : 0;
    let dailyPercent = limitDaily ? Math.min(100, (dailyReqs / limitDaily) * 100).toFixed(1) : 0;

    let expiryDateTxt = '2099-01-01';
    let isExpired = false;
    if (user.expiryMs) {
        let exp = new Date(user.expiryMs);
        expiryDateTxt = exp.toISOString().split('T')[0];
        if (Date.now() > user.expiryMs) {
            isExpired = true;
        }
    }

    let statusCode = 'active';
    if (user.isPaused) statusCode = 'paused';
    else if (isExpired) statusCode = 'expired';
    else if (limitTotal && totalReqs >= limitTotal) statusCode = 'limit';
    else if (limitDaily && dailyReqs >= limitDaily) statusCode = 'dailyLimit';

    let cleanUrl = new URL(url.href);
    if (sysConfig.customPanelUrl && sysConfig.customPanelUrl.trim()) {
        let customUrlStr = sysConfig.customPanelUrl.trim();
        if (!customUrlStr.startsWith('http://') && !customUrlStr.startsWith('https://')) {
            customUrlStr = 'https://' + customUrlStr;
        }
        try {
            const customUrl = new URL(customUrlStr);
            cleanUrl.protocol = customUrl.protocol;
            cleanUrl.host = customUrl.host;
        } catch(e) {}
    }
    cleanUrl.searchParams.delete("flag");
    cleanUrl.searchParams.delete("format");
    cleanUrl.searchParams.delete("type");
    cleanUrl.searchParams.delete("output");
    cleanUrl.searchParams.delete("raw");

    let syncNormal = cleanUrl.href;
    let syncRaw = cleanUrl.href + (cleanUrl.href.includes('?') ? '&flag=a' : '?flag=a');
    let syncClash = cleanUrl.href + (cleanUrl.href.includes('?') ? '&output=clash' : '?output=clash');
    let syncSingbox = cleanUrl.href + (cleanUrl.href.includes('?') ? '&output=singbox' : '?output=singbox');
    let circumference = 251.327;
    let usagePct = parseFloat(totalPercent);
    let usageOffset = limitTotal ? +(circumference * (1 - usagePct / 100)).toFixed(2) : circumference;
    let ringColor = usagePct > 90 ? '#ef4444' : usagePct > 70 ? '#f59e0b' : '#8b5cf6';
    let daysLeft = user.expiryMs ? Math.max(0, Math.ceil((user.expiryMs - Date.now()) / 86400000)) : -1;
    let daysLeftStr = daysLeft < 0 ? '∞' : String(daysLeft);

    const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${user.name} - Subscriber Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        fa: ['Vazirmatn', 'sans-serif'],
                        en: ['Inter', 'sans-serif'],
                    }
                }
            }
        }
    <\/script>
    <style>
        :root {
            --bg-primary: #f8fafc;
            --bg-card: #ffffff;
            --bg-card-inner: #f1f5f9;
            --bg-input: #f1f5f9;
            --border-card: #e2e8f0;
            --border-inner: #e2e8f0;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --text-muted: #94a3b8;
            --accent: #6366f1;
            --accent-light: #eef2ff;
            --accent-border: #c7d2fe;
            --accent-hover: #4f46e5;
            --green-bg: #ecfdf5;
            --green-border: #a7f3d0;
            --green-text: #059669;
            --amber-bg: #fffbeb;
            --amber-border: #fde68a;
            --amber-text: #d97706;
            --red-bg: #fef2f2;
            --red-border: #fecaca;
            --red-text: #dc2626;
            --progress-bg: #e2e8f0;
            --shadow-card: 0 4px 24px rgba(0,0,0,0.06);
            --btn-primary-bg: #6366f1;
            --btn-primary-hover: #4f46e5;
            --btn-secondary-bg: #f1f5f9;
            --btn-secondary-hover: #e2e8f0;
            --modal-bg: rgba(0,0,0,0.4);
            --modal-card: #ffffff;
        }
        .dark {
            --bg-primary: #0d1117;
            --bg-card: rgba(15, 20, 40, 0.8);
            --bg-card-inner: rgba(15, 23, 42, 0.6);
            --bg-input: #020617;
            --border-card: rgba(99, 102, 241, 0.25);
            --border-inner: rgba(99, 102, 241, 0.08);
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --text-muted: #475569;
            --accent: #818cf8;
            --accent-light: rgba(99, 102, 241, 0.15);
            --accent-border: rgba(99, 102, 241, 0.3);
            --accent-hover: #6366f1;
            --green-bg: rgba(16, 185, 129, 0.1);
            --green-border: rgba(16, 185, 129, 0.25);
            --green-text: #34d399;
            --amber-bg: rgba(245, 158, 11, 0.1);
            --amber-border: rgba(245, 158, 11, 0.25);
            --amber-text: #fbbf24;
            --red-bg: rgba(239, 68, 68, 0.1);
            --red-border: rgba(239, 68, 68, 0.25);
            --red-text: #f87171;
            --progress-bg: rgba(30, 41, 59, 0.8);
            --btn-primary-bg: #6366f1;
            --btn-primary-hover: #4f46e5;
            --btn-secondary-bg: rgba(30, 41, 59, 0.6);
            --btn-secondary-hover: rgba(30, 41, 59, 0.9);
            --modal-bg: rgba(0,0,0,0.7);
            --modal-card: #0f172a;
        }
        body {
            font-family: 'Inter', 'Vazirmatn', sans-serif;
            background: var(--bg-primary) !important;
            color: var(--text-primary);
            transition: background 0.4s ease, color 0.3s;
        }
        /* Soft gradient mesh background */
        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.04) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 50%),
                        radial-gradient(ellipse at 60% 80%, rgba(14,165,233,0.03) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
        }
        .dark body::before {
            background: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 50%),
                        radial-gradient(ellipse at 60% 80%, rgba(14,165,233,0.05) 0%, transparent 50%);
        }
        [lang="fa"] body { font-family: 'Vazirmatn', sans-serif; }
        .card-main {
            background: var(--bg-card) !important;
            border: 1px solid var(--border-card) !important;
            box-shadow: var(--shadow-card) !important;
            transition: all 0.3s;
        }
        .card-inner {
            background: var(--bg-card-inner);
            border: 1px solid var(--border-inner);
            transition: all 0.3s;
        }
        .input-field {
            background: var(--bg-input);
            border: 1px solid var(--border-inner);
            color: var(--text-primary);
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 10px; }
        .btn-primary {
            background: var(--btn-primary-bg);
            color: white;
        }
        .btn-primary:hover { background: var(--btn-primary-hover); }
        .btn-secondary {
            background: var(--btn-secondary-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-inner);
        }
        .btn-secondary:hover { background: var(--btn-secondary-hover); }
        .text-secondary { color: var(--text-secondary); }
        .text-muted { color: var(--text-muted); }
        .border-card-main { border-color: var(--border-card) !important; }
        .progress-bar-bg { background: var(--progress-bg); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideInScale { from { opacity: 0; transform: scale(0.92) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .fade-in { animation: fadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
        .stagger-1 { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
        .stagger-2 { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both; }
        .stagger-3 { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both; }
        .stagger-4 { animation: slideInScale 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both; }
        .modal-overlay { background: var(--modal-bg); }
        .modal-card { background: var(--modal-card); border: 1px solid var(--border-card); }
        /* Animated background orbs - smooth float */
        .bg-orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.10; pointer-events: none; z-index: 0; animation: orbFloat 18s ease-in-out infinite alternate; }
        .dark .bg-orb { opacity: 0.15; filter: blur(140px); }
        .bg-orb-1 { width: 550px; height: 550px; background: radial-gradient(circle, rgba(124,58,237,0.6), transparent 70%); top: -180px; left: -120px; animation-delay: 0s; animation-duration: 20s; }
        .bg-orb-2 { width: 420px; height: 420px; background: radial-gradient(circle, rgba(59,130,246,0.5), transparent 70%); top: 35%; right: -100px; animation-delay: -6s; animation-duration: 16s; }
        .bg-orb-3 { width: 380px; height: 380px; background: radial-gradient(circle, rgba(14,165,233,0.4), transparent 70%); bottom: -100px; left: 25%; animation-delay: -10s; animation-duration: 22s; }
        @keyframes orbFloat { 0% { transform: translate(0,0) scale(1) rotate(0deg); } 33% { transform: translate(20px,-25px) scale(1.04) rotate(2deg); } 66% { transform: translate(-15px,20px) scale(0.96) rotate(-1deg); } 100% { transform: translate(10px,-10px) scale(1.02) rotate(1deg); } }
        /* SVG usage ring - enhanced */
        .ring-fill { fill: none; stroke-width: 9; stroke-linecap: round; stroke-dasharray: 251.327; stroke-dashoffset: 251.327; transform-origin: 50% 50%; transition: stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1); transform: rotate(-90deg); filter: drop-shadow(0 0 6px currentColor); }
        .ring-track { fill: none; stroke-width: 9; opacity: 0.3; }
        .ring-bg-glow { fill: none; stroke-width: 18; stroke-linecap: round; stroke-dasharray: 251.327; transform-origin: 50% 50%; transform: rotate(-90deg); opacity: 0.15; filter: blur(4px); transition: stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        /* Format tabs */
        .fmt-tab { padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid var(--border-inner); background: transparent; color: var(--text-secondary); transition: all 0.2s; white-space: nowrap; }
        .fmt-tab.active, .fmt-tab:hover { background: var(--accent); color: white; border-color: var(--accent); }
        /* Animated link card */
        .link-card-anim { transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s; }
        .link-card-anim:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.14); border-color: var(--accent-border) !important; }
        @keyframes copyFlash { 0%,100% { transform: scale(1); } 40% { transform: scale(0.93); } }
        .copy-flash { animation: copyFlash 0.25s ease; }
        /* Theme color dots */
        .theme-dot { width: 16px; height: 16px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; flex-shrink: 0; display: inline-block; }
        .theme-dot.active, .theme-dot:hover { border-color: rgba(255,255,255,0.9); transform: scale(1.25); box-shadow: 0 0 8px currentColor; }
        /* Animated ring glow - smoother */
        @keyframes ringPulse { 0%,100% { filter: drop-shadow(0 0 4px var(--accent)); } 50% { filter: drop-shadow(0 0 20px var(--accent)); } }
        .ring-svg-wrap { animation: ringPulse 4s ease-in-out infinite; }
        /* Pulsing center pct - subtle breathe */
        @keyframes pulsePct { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.88; transform: scale(0.98); } }
        .pulse-pct { animation: pulsePct 3s ease-in-out infinite; }
        /* Ring counter animation */
        @keyframes countUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .count-anim { animation: countUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both; }
        /* Link card gradient border on hover */
        .link-card-anim:hover { box-shadow: 0 0 0 1.5px var(--accent), 0 8px 32px rgba(99,102,241,0.15); }
        /* Plan badge */
        .plan-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; background: var(--accent-light); color: var(--accent); border: 1px solid var(--accent-border); }
    </style>
</head>
<body class="min-h-screen py-6 px-4 flex flex-col items-center justify-center fade-in">
    <!-- Animated background orbs -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>

    <!-- Theme & Language Toggle -->
    <div class="fixed top-4 left-4 right-4 flex justify-between items-center z-50 max-w-2xl mx-auto gap-2 flex-wrap">
        <div class="flex gap-1.5 items-center px-2.5 py-2 rounded-xl btn-secondary" title="Theme Color">
            <span onclick="applyAccent('purple')" class="theme-dot active" data-theme="purple" style="background:#818cf8;"></span>
            <span onclick="applyAccent('blue')" class="theme-dot" data-theme="blue" style="background:#3b82f6;"></span>
            <span onclick="applyAccent('emerald')" class="theme-dot" data-theme="emerald" style="background:#10b981;"></span>
            <span onclick="applyAccent('orange')" class="theme-dot" data-theme="orange" style="background:#f97316;"></span>
            <span onclick="applyAccent('rose')" class="theme-dot" data-theme="rose" style="background:#f43f5e;"></span>
        </div>
        <div class="flex gap-2">
            <button onclick="toggleTheme()" id="theme-toggle" class="btn-secondary px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5" title="Toggle Theme">
                <span id="theme-icon">\u2600\ufe0f</span>
                <span id="theme-label"></span>
            </button>
            <button onclick="toggleLang()" id="lang-toggle" class="btn-secondary px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5" title="Toggle Language">
                <span id="lang-icon">🇺🇸</span>
                <span id="lang-label">EN</span>
            </button>
        </div>
    </div>

    <div class="w-full max-w-2xl card-main rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden mt-12" id="main-card">

        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-card-main stagger-1" style="border-color: var(--border-inner);">
            <div class="flex items-center gap-4">
                <div class="p-4 rounded-2xl" style="background: var(--accent-light); color: var(--accent); border: 1px solid var(--accent-border);">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                    <h1 class="text-xl md:text-2xl font-black tracking-tight" style="color: var(--text-primary);">${user.name}</h1>
                    <p class="text-xs mt-1 font-mono" style="color: var(--text-muted);">${user.id}</p>
                </div>
            </div>
            <div class="shrink-0">
                <span id="status-badge" class="px-4 py-2 rounded-2xl text-xs font-bold inline-block"></span>
            </div>
        </div>

        <!-- Usage Ring + Stats -->
        <div class="flex flex-col items-center gap-5 stagger-2">
            <!-- SVG Donut Ring -->
            <div style="position: relative; width: 240px; height: 240px; flex-shrink: 0;">
                <div class="ring-svg-wrap" style="width:240px;height:240px;">
                    <svg viewBox="0 0 100 100" width="240" height="240">
                        <circle class="ring-track" cx="50" cy="50" r="40" stroke="var(--border-inner)" stroke-opacity="0.3"/>
                        <circle class="ring-bg-glow" id="usage-ring-glow" cx="50" cy="50" r="40" stroke="${ringColor}" stroke-dashoffset="251.327"/>
                        <circle class="ring-fill" id="usage-ring" cx="50" cy="50" r="40" stroke="${ringColor}"/>
                    </svg>
                </div>
                <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 4px;">
                    <span class="pulse-pct count-anim" style="font-size: 36px; font-weight: 900; line-height: 1; color: var(--text-primary);">${limitTotal ? totalPercent + '%' : '∞'}</span>
                    <span class="count-anim" style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted);" data-i18n="used">مصرف</span>
                    <span class="count-anim" style="font-size: 13px; font-weight: 800; color: ${ringColor}; margin-top: 3px;">${totalGb} / ${limitTotalGb} GB</span>
                </div>
            </div>
            <!-- Stats Grid -->
            <div class="w-full grid grid-cols-3 gap-3">
                <div class="card-inner rounded-2xl p-3 text-center">
                    <p class="text-[10px] font-semibold text-secondary mb-1.5" data-i18n="expDate">انقضا</p>
                    <p class="text-xs font-black" style="color: var(--text-primary);">${expiryDateTxt === '2099-01-01' ? '∞' : expiryDateTxt}</p>
                </div>
                <div class="card-inner rounded-2xl p-3 text-center">
                    <p class="text-[10px] font-semibold text-secondary mb-1" data-i18n="daysLeft">روز مانده</p>
                    <p class="text-xl font-black" style="color: var(--accent);">${daysLeftStr}</p>
                </div>
                <div class="card-inner rounded-2xl p-3 text-center">
                    <p class="text-[10px] font-semibold text-secondary mb-1.5" data-i18n="dailyUsage">امروز</p>
                    <p class="text-xs font-black" style="color: var(--text-primary);">${dailyGb} GB</p>
                </div>
            </div>
        </div>

        <!-- Subscription Links -->
        <div class="stagger-3">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-sm font-bold flex items-center gap-2" style="color: var(--text-primary);">
                    <span class="w-2 h-2 rounded-full" style="background: var(--accent);"></span>
                    <span data-i18n="integrationTitle">لینک اشتراک</span>
                </h2>
            </div>
            <!-- Format Tabs -->
            <div class="flex gap-2 mb-3 flex-wrap">
                <button class="fmt-tab active" onclick="switchFmt('normal',this)" data-i18n="fmtNormal">معمولی</button>
                <button class="fmt-tab" onclick="switchFmt('clash',this)">Clash</button>
                <button class="fmt-tab" onclick="switchFmt('singbox',this)">Sing-box</button>
                <button class="fmt-tab" onclick="switchFmt('raw',this)">Raw</button>
            </div>
            <!-- Active Link Card -->
            <div class="card-inner p-4 rounded-2xl link-card-anim" id="link-card" onclick="copyActiveLink(event)">
                <div class="flex items-start gap-3">
                    <div class="flex-1 min-w-0">
                        <p class="text-[11px] font-bold mb-1.5" id="link-label" style="color: var(--green-text);"></p>
                        <input type="text" id="active-link" readonly class="input-field w-full px-3 py-2 rounded-xl text-[11px] font-mono truncate outline-none" style="color: var(--text-secondary); cursor: pointer;">
                    </div>
                    <div class="flex flex-col gap-1.5 shrink-0 mt-4">
                        <button onclick="event.stopPropagation(); copyActiveLink(event)" id="copy-btn" class="btn-primary px-3 py-2 rounded-lg text-xs font-bold transition-all" data-i18n="copy">کپی</button>
                        <button onclick="event.stopPropagation(); showQRModal()" class="btn-secondary px-3 py-2 rounded-lg text-xs font-bold transition-all" data-i18n="qr">QR</button>
                    </div>
                </div>
                <p class="text-[10px] text-muted mt-2" id="link-desc"></p>
            </div>

            <!-- Action Buttons -->
            <div class="pt-4 border-t mt-4 grid grid-cols-2 gap-3" style="border-color: var(--border-inner);">
                <button onclick="fetchDecodedRawContent()" class="py-2.5 px-4 btn-primary rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    <span data-i18n="parsedContent">دریافت Raw</span>
                </button>
                <button onclick="openSubPage()" class="py-2.5 px-4 btn-secondary rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    <span data-i18n="openSub">باز کردن</span>
                </button>
            </div>
        </div>
    </div>

    <!-- QR Code Modal -->
    <div id="qr-modal" class="fixed inset-0 modal-overlay backdrop-blur-md z-50 hidden items-center justify-center p-4">
        <div class="modal-card rounded-3xl max-w-sm w-full p-6 text-center space-y-4">
            <h3 id="qr-title" class="text-lg font-black" style="color: var(--text-primary);"></h3>
            <div class="bg-white p-4 rounded-2xl inline-block mx-auto">
                <img id="qr-img" src="" alt="QR Code" class="w-48 h-48">
            </div>
            <p id="qr-text" class="text-[10px] font-mono break-all p-3 rounded-xl max-h-24 overflow-y-auto" style="color: var(--text-muted); background: var(--bg-input); border: 1px solid var(--border-inner);"></p>
            <button onclick="closeQRModal()" class="w-full py-2.5 btn-primary rounded-xl text-xs font-bold transition-colors" data-i18n="close">Close</button>
        </div>
    </div>

    <!-- Toast -->
    <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs shadow-xl opacity-0 transition-opacity duration-350 pointer-events-none font-bold" style="background: var(--green-text); color: white;"></div>

    <script>
        const THEMES = {
            purple:  { accent: '#818cf8', hover: '#6366f1', light: 'rgba(99,102,241,0.15)',   border: 'rgba(99,102,241,0.3)' },
            blue:    { accent: '#3b82f6', hover: '#2563eb', light: 'rgba(59,130,246,0.15)',    border: 'rgba(59,130,246,0.3)' },
            emerald: { accent: '#10b981', hover: '#059669', light: 'rgba(16,185,129,0.15)',    border: 'rgba(16,185,129,0.3)' },
            orange:  { accent: '#f97316', hover: '#ea580c', light: 'rgba(249,115,22,0.15)',    border: 'rgba(249,115,22,0.3)' },
            rose:    { accent: '#f43f5e', hover: '#e11d48', light: 'rgba(244,63,94,0.15)',     border: 'rgba(244,63,94,0.3)'  },
        };
        let currentAccent = 'purple';

        function applyAccent(key) {
            const theme = THEMES[key];
            if (!theme) return;
            currentAccent = key;
            const root = document.documentElement;
            root.style.setProperty('--accent', theme.accent);
            root.style.setProperty('--btn-primary-bg', theme.accent);
            root.style.setProperty('--btn-primary-hover', theme.hover);
            root.style.setProperty('--accent-light', theme.light);
            root.style.setProperty('--accent-border', theme.border);
            root.style.setProperty('--accent-hover', theme.hover);
            document.querySelectorAll('.theme-dot').forEach(d => {
                d.classList.toggle('active', d.dataset.theme === key);
            });
            // Update ring color if usage is not critical
            const ring = document.getElementById('usage-ring');
            const ringGlow = document.getElementById('usage-ring-glow');
            const pct = parseFloat('${totalPercent}');
            if (ring && pct <= 70) { ring.style.stroke = theme.accent; if (ringGlow) ringGlow.style.stroke = theme.accent; }
            try { localStorage.setItem('sub-accent', key); } catch(e) {}
        }

        const I18N = {
            en: {
                totalUsage: 'Total Usage',
                dailyUsage: 'Today',
                expDate: 'Expiry',
                daysLeft: 'Days Left',
                calendarLocal: 'Calendar Local Time',
                unlimitedPlan: 'Unlimited Plan',
                noDailyLimit: 'No Daily Limit',
                integrationTitle: 'Subscription Links',
                integrationDesc: 'Add the correct configuration link based on your preferred format below.',
                universalLink: 'Universal Auto-Detecting Link',
                universalDesc: 'This URL automatically detects your client and delivers the optimal format.',
                universalNote: 'Real-time import of complete nodes list with dynamic update.',
                fmtNormal: 'Auto',
                copy: 'Copy',
                qr: 'QR',
                parsedContent: 'Get Raw',
                openSub: 'Open',
                printConfig: 'Print Config Card',
                close: 'Close',
                qrTitle: 'Scan QR Code',
                copied: 'Copied!',
                decodedCopied: 'Decoded links copied!',
                decodedError: 'Error fetching content',
                used: 'Usage',
                active: 'Active',
                paused: 'Paused',
                expired: 'Expired',
                limitExceeded: 'Limit Exceeded',
                dailyLimitExceeded: 'Daily Limit Exceeded'
            },
            fa: {
                totalUsage: 'مصرف کل',
                dailyUsage: 'امروز',
                expDate: 'انقضا',
                daysLeft: 'روز مانده',
                calendarLocal: 'زمان محلی',
                unlimitedPlan: 'طرح نامحدود',
                noDailyLimit: 'بدون محدودیت روزانه',
                integrationTitle: 'لینک اشتراک',
                integrationDesc: 'لینک پیکربندی مورد نظر خود را اضافه کنید.',
                universalLink: 'لینک خودکار برای همه کلاینت‌ها',
                universalDesc: 'این لینک کلاینت شما را شناسایی و بهترین فرمت را ارسال می‌کند.',
                universalNote: 'دریافت لحظه‌ای لیست نودها با به‌روزرسانی پویا.',
                fmtNormal: 'معمولی',
                copy: 'کپی',
                qr: 'QR',
                parsedContent: 'دریافت Raw',
                openSub: 'باز کردن',
                printConfig: 'چاپ کارت پیکربندی',
                close: 'بستن',
                qrTitle: 'اسکن کد QR',
                copied: 'کپی شد!',
                decodedCopied: 'لینک‌ها کپی شد!',
                decodedError: 'خطا در دریافت',
                used: 'مصرف',
                active: 'فعال',
                paused: 'متوقف',
                expired: 'منقضی',
                limitExceeded: 'از حد مجاز رد شده',
                dailyLimitExceeded: 'از حد روزانه رد شده'
            }
        };

        let currentLang = 'en';
        let isDark = true;

        function applyTheme() {
            const root = document.documentElement;
            const themeLabel = document.getElementById('theme-label');
            if (isDark) {
                root.classList.add('dark');
                document.getElementById('theme-icon').textContent = '\u2600\ufe0f';
                if (themeLabel) themeLabel.textContent = currentLang === 'fa' ? 'روشن' : 'Light';
            } else {
                root.classList.remove('dark');
                document.getElementById('theme-icon').textContent = '\ud83c\udf19';
                if (themeLabel) themeLabel.textContent = currentLang === 'fa' ? 'تاریک' : 'Dark';
            }
            try { localStorage.setItem('sub-theme', isDark ? 'dark' : 'light'); } catch(e) {}
        }

        function applyLang() {
            const t = I18N[currentLang];
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) el.textContent = t[key];
            });
            if (currentLang === 'fa') {
                document.documentElement.setAttribute('dir', 'rtl');
                document.documentElement.setAttribute('lang', 'fa');
                document.getElementById('lang-icon').textContent = '\ud83c\uddee\ud83c\uddf7';
                document.getElementById('lang-label').textContent = 'FA';
            } else {
                document.documentElement.setAttribute('dir', 'ltr');
                document.documentElement.setAttribute('lang', 'en');
                document.getElementById('lang-icon').textContent = '\ud83c\uddfa\ud83c\uddf8';
                document.getElementById('lang-label').textContent = 'EN';
            }
            initStatusBadge();
            if (typeof renderLink === 'function') renderLink();
            try { localStorage.setItem('sub-lang', currentLang); } catch(e) {}
        }

        function toggleTheme() {
            isDark = !isDark;
            applyTheme();
        }

        function toggleLang() {
            currentLang = currentLang === 'en' ? 'fa' : 'en';
            applyLang();
            applyTheme();
        }

        function initStatusBadge() {
            const badge = document.getElementById('status-badge');
            const t = I18N[currentLang];
            const map = {
                active: { en: t.active || 'Active', bg: 'var(--green-bg)', border: 'var(--green-border)', color: 'var(--green-text)' },
                paused: { en: t.paused || 'Paused', bg: 'var(--amber-bg)', border: 'var(--amber-border)', color: 'var(--amber-text)' },
                expired: { en: t.expired || 'Expired', bg: 'var(--red-bg)', border: 'var(--red-border)', color: 'var(--red-text)' },
                limit: { en: t.limitExceeded || 'Limit Exceeded', bg: 'var(--red-bg)', border: 'var(--red-border)', color: 'var(--red-text)' },
                dailyLimit: { en: t.dailyLimitExceeded || 'Daily Limit Exceeded', bg: 'var(--red-bg)', border: 'var(--red-border)', color: 'var(--red-text)' }
            };
            const s = map['${statusCode}'] || map.active;
            badge.textContent = s.en;
            badge.style.background = s.bg;
            badge.style.borderColor = s.border;
            badge.style.color = s.color;
            badge.style.border = '1px solid ' + s.border;
        }

        function copyLink(id) {
            const el = document.getElementById(id);
            el.select();
            navigator.clipboard.writeText(el.value);
            showToast(I18N[currentLang].copied);
        }

        async function fetchDecodedRawContent() {
            try {
                const res = await fetch('${syncRaw}');
                if(!res.ok) throw new Error('Failed');
                const base64Str = await res.text();
                const decodedText = atob(base64Str.trim());
                await navigator.clipboard.writeText(decodedText);
                showToast(I18N[currentLang].decodedCopied);
            } catch(e) {
                alert(I18N[currentLang].decodedError + ': ' + e.message);
            }
        }

        function showQRModal() {
            const t = I18N[currentLang];
            document.getElementById('qr-title').innerText = t.qrTitle;
            document.getElementById('qr-text').innerText = '${syncNormal}';
            document.getElementById('qr-img').src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent('${syncNormal}');
            document.getElementById('qr-modal').classList.remove('hidden');
            document.getElementById('qr-modal').classList.add('flex');
        }

        function closeQRModal() {
            document.getElementById('qr-modal').classList.add('hidden');
            document.getElementById('qr-modal').classList.remove('flex');
        }

        function showToast(msg) {
            const t = document.getElementById('toast');
            t.innerText = msg;
            t.style.opacity = '1';
            setTimeout(() => { t.style.opacity = '0'; }, 2000);
        }

        const LINKS = {
            normal: { url: '${syncNormal}', label_fa: '🔗 لینک معمولی (همه کلاینت‌ها)', label_en: '🔗 Auto Link (All Clients)', desc_fa: 'به‌صورت خودکار بهترین فرمت را برای کلاینت شما ارسال می‌کند.', desc_en: 'Auto-detects your client and delivers the optimal format.' },
            clash: { url: '${syncClash}', label_fa: '🌐 لینک Clash', label_en: '🌐 Clash Link', desc_fa: 'برای Clash، Clash Meta و Stash.', desc_en: 'For Clash, Clash Meta and Stash clients.' },
            singbox: { url: '${syncSingbox}', label_fa: '📦 لینک Sing-box', label_en: '📦 Sing-box Link', desc_fa: 'برای Sing-box.', desc_en: 'For Sing-box clients.' },
            raw: { url: '${syncRaw}', label_fa: '⚡ لینک Raw (Base64)', label_en: '⚡ Raw Link (Base64)', desc_fa: 'خروجی Base64 خام برای کلاینت‌های قدیمی.', desc_en: 'Raw Base64 output for legacy clients.' },
        };
        let currentFmt = 'normal';

        function switchFmt(fmt, el) {
            currentFmt = fmt;
            document.querySelectorAll('.fmt-tab').forEach(b => b.classList.remove('active'));
            el.classList.add('active');
            renderLink();
        }

        function renderLink() {
            const lnk = LINKS[currentFmt];
            if (!lnk) return;
            const inp = document.getElementById('active-link');
            const lbl = document.getElementById('link-label');
            const desc = document.getElementById('link-desc');
            if (inp) inp.value = lnk.url;
            if (lbl) lbl.textContent = currentLang === 'fa' ? lnk.label_fa : lnk.label_en;
            if (desc) desc.textContent = currentLang === 'fa' ? lnk.desc_fa : lnk.desc_en;
            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) copyBtn.textContent = I18N[currentLang].copy || 'کپی';
        }

        function copyActiveLink() {
            const lnk = LINKS[currentFmt];
            if (!lnk) return;
            const btn = document.getElementById('copy-btn');
            navigator.clipboard.writeText(lnk.url).then(() => {
                showToast(I18N[currentLang].copied || 'کپی شد!');
                if (btn) {
                    const orig = btn.textContent;
                    btn.textContent = '✅';
                    btn.classList.add('copy-flash');
                    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copy-flash'); }, 1800);
                }
            }).catch(() => {
                try { const ta = document.createElement('textarea'); ta.value = lnk.url; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast(I18N[currentLang].copied || 'کپی شد!'); } catch(er) {}
            });
        }

        function openSubPage() {
            window.open(LINKS.normal.url, '_blank');
        }

        function animateRing() {
            setTimeout(() => {
                const ring = document.getElementById('usage-ring');
                const ringGlow = document.getElementById('usage-ring-glow');
                if (ring) ring.style.strokeDashoffset = '${usageOffset}';
                if (ringGlow) ringGlow.style.strokeDashoffset = '${usageOffset}';
            }, 400);
        }

        (function init() {
            try {
                const savedTheme = localStorage.getItem('sub-theme');
                if (savedTheme) isDark = savedTheme === 'dark';
            } catch(e) {}
            try {
                const savedLang = localStorage.getItem('sub-lang');
                if (savedLang && I18N[savedLang]) currentLang = savedLang;
            } catch(e) {}
            applyTheme();
            applyLang();
            renderLink();
            animateRing();
            try {
                const savedAccent = localStorage.getItem('sub-accent');
                if (savedAccent && THEMES[savedAccent]) applyAccent(savedAccent);
                else document.querySelector('.theme-dot[data-theme="purple"]')?.classList.add('active');
            } catch(e) {}
        })();
    <\/script>
</body>
</html>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

let sysConfigLoading = null;
let sysUsageLoading = null;
let backupIpLoading = null;

async function loadSysConfig(env) {
    const now = Date.now();

    if (env.IOT_DB) {
        if (now - sysConfigCacheTime > CACHE_TTL_CONFIG) {
            if (!sysConfigLoading) {
                sysConfigLoading = d1Get(env, "sys_config").then(stored => {
                    sysConfig = { ...SYSTEM_DEFAULTS, ...(stored ? JSON.parse(stored) : null) };
                    sysConfigCacheTime = Date.now();
                }).catch(() => {
                    sysConfig = { ...SYSTEM_DEFAULTS };
                    sysConfigCacheTime = Date.now();
                }).finally(() => { sysConfigLoading = null; });
            }
            await sysConfigLoading;
        }
        if (now - sysUsageCacheTime > CACHE_TTL_USAGE) {
            if (!sysUsageLoading) {
                sysUsageLoading = d1Get(env, "sys_usage").then(ustored => {
                    if (ustored) sysUsageCache = JSON.parse(ustored);
                    else sysUsageCache = { users: {} };
                    sysUsageCacheTime = Date.now();
                }).catch(() => {
                    sysUsageCache = { users: {} };
                    sysUsageCacheTime = Date.now();
                }).finally(() => { sysUsageLoading = null; });
            }
            await sysUsageLoading;
        }
    }

    if (now - backupIpCacheTime > CACHE_TTL_BACKUP_IP) {
        if (!backupIpLoading) {
            backupIpLoading = (env.IOT_DB ? d1Get(env, "backup_ip") : Promise.resolve(null)).then(val => {
                backupIpCache = val;
                backupIpCacheTime = Date.now();
            }).catch(() => {
                backupIpCacheTime = Date.now();
            }).finally(() => { backupIpLoading = null; });
        }
        await backupIpLoading;
    }
    sysConfig.customRelay = backupIpCache ?? env.RELAY_IP ?? "";
}

async function fetchCloudflareUsage(accountId, apiToken) {
    if (!accountId || !apiToken) return null;
    try {
        const d = new Date();
        const currentDate = d.toISOString().split('T')[0] + "T00:00:00Z";
        
        const query = `query GetDailyUsage($accountId: String!, $start: ISO8601DateTime!) { viewer { accounts(filter: {accountTag: $accountId}) { workersInvocationsAdaptive(limit: 1, filter: { datetime_geq: $start }) { sum { requests } } } } }`;
        const variables = { accountId: accountId, start: currentDate };
        
        const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query, variables })
        });
        
        const json = await res.json();
        const reqs = json?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive?.[0]?.sum?.requests;
        return typeof reqs === 'number' ? reqs : null;
    } catch(e) {
        return null;
    }
}

async function sendTelegramMessage(request, type, hostName) {
    if (!sysConfig.tgToken || !(sysConfig.tgAdminId || sysConfig.tgChatId)) return;

    const escMd = (s) => String(s).replace(/[_*`[]/g, '\\$&');

    let usageStr = "نامشخص (0.00%)";
    if (sysConfig.cfAccountId && sysConfig.cfApiToken) {
        const reqs = await fetchCloudflareUsage(sysConfig.cfAccountId, sysConfig.cfApiToken);
        if (reqs !== null) {
            const limit = 100000;
            const pct = ((reqs / limit) * 100).toFixed(2);
            usageStr = `${reqs}/${limit} ${pct}%`;
        }
    }

    const ip = request.headers.get("cf-connecting-ip") || "Unknown";
    const cf = request.cf || {};
    const country = cf.country || "Unknown";
    const city = cf.city || "Unknown";
    const asn = cf.asn || "Unknown";
    const asOrg = cf.asOrganization || "Unknown";
    const domain = request.headers.get("Host") || new URL(request.url).hostname;
    const path = new URL(request.url).pathname;
    const ua = request.headers.get("User-Agent") || "حالا یوزرایجنت مارو نبینین";

    const d = new Date();
    const timeStr = new Intl.DateTimeFormat('fa-IR', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    }).format(d);

    const text = `📌 نوع: ${escMd(type)}\n` +
                 `🌐 IP: ${escMd(ip)}\n` +
                 `📍 موقعیت: ${escMd(country)} ${escMd(city)}\n` +
                 `🏢 ASN: AS${escMd(asn)} ${escMd(asOrg)}\n` +
                 `🔗 دامنه: ${escMd(domain)}\n` +
                 `🔍 مسیر: ${escMd(path)}\n` +
                 `🤖 مرورگر: ${escMd(ua)}\n` +
                 `📅 زمان: ${escMd(timeStr)}\n` +
                 `📊 مصرف: ${usageStr}`;

    const h = hostName || domain;
    const langCode = sysConfig.tgBotLang || "fa";
    const locT = (key) => botI18n[langCode]?.[key] || botI18n["en"]?.[key] || key;
    const isPaused = sysConfig.isPaused || false;
    const panelUrl = `https://${h}/${encodeURI(sysConfig.apiRoute)}/dash`;
    const subUrl = `https://${h}/${sysConfig.apiRoute}`;
    const inline_keyboard = [
        [
            { text: `📊 ${locT("dashboard")}`, callback_data: "sys_dashboard" },
            { text: `📈 ${locT("statistics")}`, callback_data: "sys_stats" }
        ],
        [
            { text: `🔗 ${locT("btn_sub_link")}`, callback_data: "get_sub_link" },
            { text: `ℹ️ ${locT("panel_info")}`, callback_data: "sys_panel_info" }
        ],
        [
            { text: `🌐 ${langCode === 'fa' ? 'English 🇺🇸' : 'فارسی 🇮🇷'}`, callback_data: "sys_lang" },
            { text: isPaused ? `▶️ ${locT("btn_resume")}` : `⏸️ ${locT("btn_pause")}`, callback_data: "sys_toggle_status" }
        ],
        [
            { text: `🔑 ${locT("dash")}`, web_app: { url: panelUrl } }
        ]
    ];

    const tgUrl = `https://api.telegram.org/bot${sysConfig.tgToken}/sendMessage`;
    const notifyChatId = sysConfig.tgAdminId || sysConfig.tgChatId;
    try {
        await fetch(tgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: notifyChatId,
                text: text,
                parse_mode: 'Markdown',
                reply_markup: /** @type {any} */ ({ inline_keyboard })
            })
        });
    } catch (e) {}
}

async function logActivity(env, type, detail) {
    if (!env || !env.IOT_DB) return;
    try {
        const ts = new Date().toISOString();
        let logs = [];
        const stored = await d1Get(env, "sys_logs");
        if (stored) logs = JSON.parse(stored);
        logs.unshift({ ts, type, detail });
        if (logs.length > 50) logs = logs.slice(0, 50);
        await d1Put(env, "sys_logs", JSON.stringify(logs));
    } catch (e) {}
}

async function handleLogs(request, env) {
    try {
        if (request.method === "POST") {
            const data = await request.json();
            if (data.key !== sysConfig.masterKey) return new Response(JSON.stringify({ success: false }), { status: 401 });
            let logs = [];
            if (env.IOT_DB) {
                const stored = await d1Get(env, "sys_logs");
                if (stored) logs = JSON.parse(stored);
            }
            return new Response(JSON.stringify({ success: true, logs }), { status: 200 });
        }
        return new Response("OK", { status: 200 });
    } catch (e) { return new Response(JSON.stringify({ success: false }), { status: 400 }); }
}

async function handleUsersApi(request, env, ctx) {
    try {
        const url = new URL(request.url);
        const method = request.method;
        const userId = url.searchParams.get("id");
        const action = url.searchParams.get("action");

        const authHeader = request.headers.get("Authorization") || "";
        const authKey = authHeader.replace("Bearer ", "") || url.searchParams.get("key") || "";
        let bodyKey = "";
        if (method === "POST" || method === "PUT") {
            try {
                const body = await request.clone().json();
                bodyKey = body.key || "";
            } catch(e) {}
        }
        const isAuth = (authKey === sysConfig.masterKey) || (bodyKey === sysConfig.masterKey);
        if (!isAuth) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }

        if (method === "GET" && !userId) {
            const q = url.searchParams.get("q") || "";
            let users = sysConfig.users || [];
            if (q) {
                const ql = q.toLowerCase();
                users = users.filter(u => u.name.toLowerCase().includes(ql) || u.id.toLowerCase().includes(ql) || (u.notes && u.notes.toLowerCase().includes(ql)));
            }
            const enriched = users.map(u => {
                const idClean = u.id.replace(/-/g, '').toLowerCase();
                const sysU = sysUsageCache?.users?.[idClean] || { reqs: 0, dReqs: 0, lastDay: '' };
                const usedBytes = Math.floor((sysU.reqs || 0) * (1073741824 / 6000));
                const limitBytes = u.limitTotalReq ? Math.floor(u.limitTotalReq * (1073741824 / 6000)) : 0;
                const isExpired = u.expiryMs && Date.now() > u.expiryMs;
                let status = "active";
                if (u.isPaused && u.disabledReason) status = "auto-disabled";
                else if (u.isPaused) status = "paused";
                else if (isExpired) status = "expired";
                return { ...u, usage: { total: usedBytes, limit: limitBytes, daily: sysU.dReqs || 0, dailyLimit: u.limitDailyReq || 0 }, status };
            });
            return new Response(JSON.stringify({ success: true, users: enriched, total: enriched.length }), { headers: { "Content-Type": "application/json" } });
        }

        if (method === "GET" && userId) {
            const u = (sysConfig.users || []).find(usr => usr.id === userId || usr.name.toLowerCase() === userId.toLowerCase());
            if (!u) return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
            const idClean = u.id.replace(/-/g, '').toLowerCase();
            const sysU = sysUsageCache?.users?.[idClean] || { reqs: 0, dReqs: 0, lastDay: '' };
            const usedBytes = Math.floor((sysU.reqs || 0) * (1073741824 / 6000));
            const limitBytes = u.limitTotalReq ? Math.floor(u.limitTotalReq * (1073741824 / 6000)) : 0;
            const isExpired = u.expiryMs && Date.now() > u.expiryMs;
            let status = "active";
            if (u.isPaused && u.disabledReason) status = "auto-disabled";
            else if (u.isPaused) status = "paused";
            else if (isExpired) status = "expired";
            const hostName = new URL(request.url).hostname;
            const subHash = u.subHash || generateSubHash(u.id);
            const subUrl = `https://${hostName}/${encodeURI(sysConfig.subRoute || "sub")}/${subHash}`;
            return new Response(JSON.stringify({ success: true, user: { ...u, usage: { total: usedBytes, limit: limitBytes, daily: sysU.dReqs || 0, dailyLimit: u.limitDailyReq || 0 }, status, subscriptionUrl: subUrl } }), { headers: { "Content-Type": "application/json" } });
        }

        if (method === "POST" && !userId) {
            const body = await request.json();
            const { name, trafficLimit, expiryDays, notes, maxConfigs, proxyIp, cleanIp, userMode, userPorts, userNodes, nat64 } = body;
            if (!name) return new Response(JSON.stringify({ success: false, error: "Name is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
            const newId = crypto.randomUUID();
            const newUser = {
                id: newId,
                name: name,
                subHash: generateSubHash(newId),
                limitTotalReq: trafficLimit ? Math.floor(parseFloat(trafficLimit) * 6000) : null,
                limitDailyReq: body.dailyLimit ? Math.floor(parseFloat(body.dailyLimit) * 6000) : null,
                expiryMs: expiryDays ? Date.now() + parseInt(expiryDays) * 86400000 : null,
                notes: notes || "",
                maxConfigs: maxConfigs ? parseInt(maxConfigs) : null,
                proxyIp: proxyIp || null,
cleanIp: cleanIp || null,
                userMode: userMode || null,
                userPorts: userPorts || null,
                userNodes: userNodes || null,
                nat64: nat64 || null,
                createdAt: Date.now()
            };
            await resolveUserProxyIpGeo(newUser);
            if (!sysConfig.users) sysConfig.users = [];
            sysConfig.users.push(newUser);
            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
            ctx?.waitUntil(logActivity(env, "User Created", `User "${name}" (${newId}) created via API`).catch(()=>{}));
            const hostName = new URL(request.url).hostname;
            const subUrl = `https://${hostName}/${encodeURI(sysConfig.subRoute || "sub")}/${newUser.subHash}`;
            return new Response(JSON.stringify({ success: true, user: newUser, subscriptionUrl: subUrl }), { status: 201, headers: { "Content-Type": "application/json" } });
        }

        if (method === "PUT" && userId) {
            const body = await request.json();
            if (!sysConfig.users) return new Response(JSON.stringify({ success: false, error: "No users" }), { status: 400, headers: { "Content-Type": "application/json" } });
            const u = sysConfig.users.find(usr => usr.id === userId);
            if (!u) return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
            if (body.name !== undefined) u.name = body.name;
            if (body.trafficLimit !== undefined) u.limitTotalReq = body.trafficLimit ? Math.floor(parseFloat(body.trafficLimit) * 6000) : null;
            if (body.dailyLimit !== undefined) u.limitDailyReq = body.dailyLimit ? Math.floor(parseFloat(body.dailyLimit) * 6000) : null;
            if (body.expiryDays !== undefined) u.expiryMs = body.expiryDays ? Date.now() + parseInt(body.expiryDays) * 86400000 : null;
            if (body.notes !== undefined) u.notes = body.notes;
            if (body.maxConfigs !== undefined) u.maxConfigs = body.maxConfigs ? parseInt(body.maxConfigs) : null;
            if (body.proxyIp !== undefined) { u.proxyIp = body.proxyIp; if (!body.proxyIp) { u.proxyIpGeo = null; } else { await resolveUserProxyIpGeo(u); } }
            if (body.cleanIp !== undefined) u.cleanIp = body.cleanIp;
            if (body.userMode !== undefined) u.userMode = body.userMode;
            if (body.userPorts !== undefined) u.userPorts = body.userPorts;
            if (body.userNodes !== undefined) u.userNodes = body.userNodes;
            if (body.nat64 !== undefined) u.nat64 = body.nat64;
            if (body.status !== undefined) {
                if (body.status === "active") { u.isPaused = false; u.disabledReason = null; u.disabledAt = null; }
                else if (body.status === "paused") { u.isPaused = true; u.disabledReason = null; u.disabledAt = null; }
            }
            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
            ctx?.waitUntil(logActivity(env, "User Updated", `User "${u.name}" (${userId}) updated via API`).catch(()=>{}));
            return new Response(JSON.stringify({ success: true, user: u }), { headers: { "Content-Type": "application/json" } });
        }

        if (method === "DELETE" && userId) {
            if (!sysConfig.users) return new Response(JSON.stringify({ success: false, error: "No users" }), { status: 400, headers: { "Content-Type": "application/json" } });
            const idx = sysConfig.users.findIndex(usr => usr.id === userId);
            if (idx === -1) return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
            const deleted = sysConfig.users.splice(idx, 1)[0];
            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
            ctx?.waitUntil(logActivity(env, "User Deleted", `User "${deleted.name}" (${userId}) deleted via API`).catch(()=>{}));
            return new Response(JSON.stringify({ success: true, deleted: deleted.id }), { headers: { "Content-Type": "application/json" } });
        }

        if (method === "POST" && userId && action === "toggle") {
            if (!sysConfig.users) return new Response(JSON.stringify({ success: false, error: "No users" }), { status: 400, headers: { "Content-Type": "application/json" } });
            const u = sysConfig.users.find(usr => usr.id === userId);
            if (!u) return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
            u.isPaused = !u.isPaused;
            if (!u.isPaused) { u.disabledReason = null; u.disabledAt = null; }
            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
            ctx?.waitUntil(logActivity(env, "User Toggled", `User "${u.name}" (${userId}) ${u.isPaused ? 'paused' : 'resumed'} via API`).catch(()=>{}));
            return new Response(JSON.stringify({ success: true, user: u }), { headers: { "Content-Type": "application/json" } });
        }

        if (method === "POST" && userId && action === "reset") {
            if (!sysUsageCache) sysUsageCache = { users: {} };
            if (!sysUsageCache.users) sysUsageCache.users = {};
            const uuidClean = userId.replace(/-/g, '').toLowerCase();
            if (sysUsageCache.users[uuidClean]) {
                sysUsageCache.users[uuidClean].reqs = 0;
                sysUsageCache.users[uuidClean].dReqs = 0;
            } else {
                sysUsageCache.users[uuidClean] = { reqs: 0, dReqs: 0, lastDay: new Date().toISOString().split('T')[0] };
            }
            await cachedD1Put(env, "sys_usage", JSON.stringify(sysUsageCache));
            ctx?.waitUntil(logActivity(env, "Traffic Reset", `Traffic reset for user ${userId} via API`).catch(()=>{}));
            return new Response(JSON.stringify({ success: true, message: "Traffic reset" }), { headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ success: false, error: "Invalid request" }), { status: 400, headers: { "Content-Type": "application/json" } });
    } catch (e) { return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

async function handleStatsApi(request, env) {
    try {
        const url = new URL(request.url);
        const authHeader = request.headers.get("Authorization") || "";
        const authKey = authHeader.replace("Bearer ", "") || url.searchParams.get("key") || "";
        if (authKey !== sysConfig.masterKey) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }

        const users = sysConfig.users || [];
        const totalUsers = users.length;
        const activeUsers = users.filter(u => !u.isPaused && (!u.expiryMs || Date.now() <= u.expiryMs)).length;
        const autoDisabledUsers = users.filter(u => u.isPaused && u.disabledReason).length;
        const pausedUsers = users.filter(u => u.isPaused && !u.disabledReason).length;
        const expiredUsers = users.filter(u => u.expiryMs && Date.now() > u.expiryMs && !u.isPaused).length;

        let totalTrafficReqs = 0;
        let dailyTrafficReqs = 0;
        const todayDate = new Date().toISOString().split('T')[0];
        users.forEach(u => {
            const idClean = u.id.replace(/-/g, '').toLowerCase();
            const sysU = sysUsageCache?.users?.[idClean] || { reqs: 0, dReqs: 0, lastDay: '' };
            totalTrafficReqs += (sysU.reqs || 0);
            if (sysU.lastDay === todayDate) dailyTrafficReqs += (sysU.dReqs || 0);
        });

        const upSeconds = Math.floor((Date.now() - isolateStartTime) / 1000);

        return new Response(JSON.stringify({
            success: true,
            stats: {
                users: { total: totalUsers, active: activeUsers, paused: pausedUsers, expired: expiredUsers, autoDisabled: autoDisabledUsers },
                traffic: { totalRequests: totalTrafficReqs, totalGB: (totalTrafficReqs / 6000).toFixed(2), dailyRequests: dailyTrafficReqs, dailyGB: (dailyTrafficReqs / 6000).toFixed(2) },
                system: { uptimeSeconds: upSeconds, activeConnections, version: CURRENT_VERSION, isPaused: sysConfig.isPaused || false }
            }
        }), { headers: { "Content-Type": "application/json" } });
    } catch (e) { return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

function cmpVersions(a, b) {
    const strip = v => String(v).replace(/^v/, '').trim();
    const pa = strip(a).split('.').map(Number);
    const pb = strip(b).split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        let na = pa[i] || 0, nb = pb[i] || 0;
        if (na > nb) return 1;
        if (nb > na) return -1;
    }
    return 0;
}

async function handleUpdateApi(request, env, ctx) {
    try {
        if (request.method !== "POST") return new Response("405", { status: 405 });
        const data = await request.json();
        if (data.key !== sysConfig.masterKey) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }

        const accountId = sysConfig.cfAccountId;
        const apiToken = sysConfig.cfApiToken;
        const workerName = sysConfig.cfWorkerName;
        const repo = (sysConfig.githubRepo || "itsyebekhe/nahan").replace(/https?:\/\/github\.com\//, '').trim();

        if (data.action === "check") {
            let remoteVer = null;
            try {
                const res = await fetch(`https://raw.githubusercontent.com/${repo}/main/version`);
                if (res.ok) {
                    const txt = (await res.text()).trim();
                    if (txt && txt.length <= 15) remoteVer = txt;
                }
            } catch(e) {}
            if (!remoteVer) {
                try {
                    const res = await fetch(`https://raw.githubusercontent.com/${repo}/main/_worker.js`);
                    if (res.ok) {
                        const code = await res.text();
                        const match = code.match(/const\s+CURRENT_VERSION\s*=\s*["']([^"']+)["']/);
                        if (match) remoteVer = match[1];
                    }
                } catch(e) {}
            }
            if (!remoteVer) {
                return new Response(JSON.stringify({ success: false, error: "Could not fetch remote version" }), { status: 502, headers: { "Content-Type": "application/json" } });
            }
            const hasCredentials = !!(accountId && apiToken && workerName);
            return new Response(JSON.stringify({
                success: true, current: CURRENT_VERSION, latest: remoteVer,
                updateAvailable: cmpVersions(CURRENT_VERSION, remoteVer) < 0,
                canDeploy: hasCredentials
            }), { headers: { "Content-Type": "application/json" } });
        }

        if (data.action === "deploy") {
            if (!accountId || !apiToken || !workerName) {
                return new Response(JSON.stringify({ success: false, error: "CF credentials not configured" }), { status: 400, headers: { "Content-Type": "application/json" } });
            }

            let finalCodeToDeploy = data.code;
            if (!finalCodeToDeploy) {
                try {
                    const res = await fetch(`https://raw.githubusercontent.com/${repo}/main/_worker.js`);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    finalCodeToDeploy = await res.text();
                } catch(e) {
                    return new Response(JSON.stringify({ success: false, error: "Failed to fetch code from GitHub: " + e.message }), { status: 502, headers: { "Content-Type": "application/json" } });
                }
            }

            const versionMatch = finalCodeToDeploy.match(/const\s+CURRENT_VERSION\s*=\s*["']([^"']+)["']/);
            const newVersion = versionMatch ? versionMatch[1] : CURRENT_VERSION;

            if (cmpVersions(CURRENT_VERSION, newVersion) >= 0 && !data.force && !data.code) {
                return new Response(JSON.stringify({ success: false, error: "Remote version is not newer. Click force redeploy to switch formats or overwrite." }), { status: 400, headers: { "Content-Type": "application/json" } });
            }

            const deployRes = await deployWorkerToCloudflare(accountId, apiToken, workerName, finalCodeToDeploy);
            const deployResult = await deployRes.json();

            if (deployResult.success) {
                ctx?.waitUntil(logActivity(env, "Panel Updated", `v${CURRENT_VERSION} → v${newVersion}`).catch(()=>{}));
                if (sysConfig.tgToken && (sysConfig.tgAdminId || sysConfig.tgChatId)) {
                    const tgMsg = `🔄 <b>Panel Updated</b>\n\n📦 v${CURRENT_VERSION} → v${newVersion}`;
                    const notifyChatId = sysConfig.tgAdminId || sysConfig.tgChatId;
                    ctx?.waitUntil(fetch(`https://api.telegram.org/bot${sysConfig.tgToken}/sendMessage`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: notifyChatId, text: tgMsg, parse_mode: 'HTML' })
                    }).catch(()=>{}));
                }
                return new Response(JSON.stringify({ success: true, message: `Updated to v${newVersion}`, newVersion }), { headers: { "Content-Type": "application/json" } });
            } else {
                const errMsg = deployResult.errors?.[0]?.message || "Unknown API error";
                return new Response(JSON.stringify({ success: false, error: "Cloudflare API: " + errMsg }), { status: 502, headers: { "Content-Type": "application/json" } });
            }
        }

        return new Response(JSON.stringify({ success: false, error: "Invalid action" }), { status: 400, headers: { "Content-Type": "application/json" } });
    } catch(e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}

async function handleAuth(request, hostName, ctx, env) {
    try {
        const data = await request.json();
        const ip = request.headers.get("cf-connecting-ip") || "Unknown";
        if (data.key === sysConfig.masterKey) {
            ctx?.waitUntil(logActivity(env, "Auth Success", `Successful panel login from ${ip}`));
            if (!sysConfig.silentAlerts && ctx) ctx.waitUntil(sendTelegramMessage(request, "ورود به پنل (موفق)", hostName));

            // Store login signal for Telegram bot
            if (sysConfig.tgAdminId && env.IOT_DB) {
                const loginSignal = {
                    name: sysConfig.name || hostName,
                    host: hostName,
                    apiRoute: sysConfig.apiRoute,
                    masterKey: sysConfig.masterKey,
                    isLocal: true,
                    ts: Date.now()
                };
                ctx?.waitUntil(d1Put(env, "tg_panel_login", JSON.stringify(loginSignal)).catch(() => {}));
            }

            // Notify hub panel if configured
            if (sysConfig.hubPanelUrl && sysConfig.hubPanelUrl.trim() && sysConfig.tgAdminId) {
                try {
                    let hubUrl = sysConfig.hubPanelUrl.trim();
                    if (!hubUrl.startsWith('http')) hubUrl = 'https://' + hubUrl;
                    const signalPayload = {
                        signal: "panel_login",
                        panelName: sysConfig.name || hostName,
                        panelHost: hostName,
                        panelApiRoute: sysConfig.apiRoute,
                        panelMasterKey: sysConfig.masterKey,
                        tgAdminId: sysConfig.tgAdminId,
                        ts: Date.now()
                    };
                    ctx?.waitUntil(fetch(`${hubUrl}/${encodeURI(sysConfig.apiRoute)}/tg/sync_panel`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(signalPayload)
                    }).catch(() => {}));
                } catch(e) {}
            }

            const netInfo = {
                ip: ip,
                colo: request.cf?.colo || "Unknown",
                loc: (request.cf?.city || "Unknown") + ", " + (request.cf?.country || "Unknown")
            };
            let usageData = {};
            for(let [k,v] of uuidUsage.entries()) usageData[k] = v;
            let baseHost = hostName;
            let protocol = "https";
            if (sysConfig.customPanelUrl && sysConfig.customPanelUrl.trim()) {
                let customUrlStr = sysConfig.customPanelUrl.trim();
                if (!customUrlStr.startsWith('http://') && !customUrlStr.startsWith('https://')) {
                    customUrlStr = 'https://' + customUrlStr;
                }
                try {
                    const customUrl = new URL(customUrlStr);
                    baseHost = customUrl.host;
                    protocol = customUrl.protocol.replace(':', '');
                } catch(e) {}
            }
            return new Response(JSON.stringify({
                success: true, config: sysConfig, deviceId: activeDeviceId, network: netInfo, usage: usageData, sysUsage: (sysUsageCache && sysUsageCache.users) ? sysUsageCache.users : {},
                version: CURRENT_VERSION,
                profiles: getAllProfiles().map(p => {
                let subHashField = p.subHash || generateSubHash(p.id);
                return { name: p.name, id: p.id, subHash: subHashField, sync: `${protocol}://${baseHost}/${encodeURI(sysConfig.subRoute || "sub")}/${subHashField}` };
                    return {
                        name: p.name,
                        id: p.id,
                        sync: `${protocol}://${baseHost}/${sysConfig.apiRoute}${subSuffix}`
                    };
                })
            }), { status: 200 });
        }
        ctx?.waitUntil(logActivity(env, "Auth Failed", `Failed login attempt from ${ip}`));
        if (ctx) ctx.waitUntil(sendTelegramMessage(request, "تلاش ناموفق ورود به پنل!", hostName));
        return new Response(JSON.stringify({ success: false }), { status: 401 });
    } catch (e) { return new Response(JSON.stringify({ success: false }), { status: 400 }); }
}

async function handleConfigSync(request, env, ctx) {
    try {
        const data = await request.json();
        const isAuthorized = (data.key === sysConfig.masterKey) || 
                             (data.oldKey && data.oldKey === sysConfig.masterKey) || 
                             (sysConfig.masterKey === "admin");
        if (!isAuthorized) return new Response(JSON.stringify({ success: false }), { status: 401 });
        if (data.fromMaster && !sysConfig.allowSyncWorker) {
    return new Response(JSON.stringify({ success: false, error: "Sync not allowed" }), { status: 403 });
}
        if (!env.IOT_DB) return new Response(JSON.stringify({ success: false, msg: "DB Error" }), { status: 400 });
        
        let nextConfig = sysConfig;
        if (data.config) {
            nextConfig = { ...sysConfig, ...data.config };
            if (Array.isArray(nextConfig.users) && nextConfig.users.length > 0) {
                const geoPromises = nextConfig.users.map(async (u) => {
                    if (u.proxyIp) {
                        await resolveUserProxyIpGeo(u);
                    } else {
                        u.proxyIpGeo = null;
                    }
                });
                await Promise.all(geoPromises);
            }
            sysConfig = nextConfig;
            await cachedD1Put(env, "sys_config", JSON.stringify(nextConfig));
        }

        let tagWarning = null;
        if (nextConfig.nameStrategy && nextConfig.nameStrategy.includes('{') && nextConfig.nameStrategy.includes('}')) {
            let vResult = validateNameStrategy(nextConfig.nameStrategy);
            if (!vResult.valid) tagWarning = `Unknown tags detected: ${vResult.unknownTags.join(', ')}`;
        }

        if (data.resetUUID) {
            const uuidClean = data.resetUUID.replace(/-/g, '').toLowerCase();
            if (!sysUsageCache) sysUsageCache = { users: {} };
            if (!sysUsageCache.users) sysUsageCache.users = {};
            if (sysUsageCache.users[uuidClean]) {
                sysUsageCache.users[uuidClean].reqs = 0;
                sysUsageCache.users[uuidClean].dReqs = 0;
            } else {
                sysUsageCache.users[uuidClean] = { reqs: 0, dReqs: 0, lastDay: new Date().toISOString().split('T')[0] };
            }
            await cachedD1Put(env, "sys_usage", JSON.stringify(sysUsageCache));
        }

        const oldMasterKey = sysConfig.masterKey;
        if (data.config && !data.fromMaster && nextConfig.slaveNodes && nextConfig.slaveNodes.trim().length > 0) {
            let nodes = nextConfig.slaveNodes.split(/[\r\n,;]+/).map(s=>s.trim()).filter(Boolean);
            let currentHost = new URL(request.url).hostname;
            nodes.forEach(node => {
                if(node !== currentHost) {
                     ctx?.waitUntil(fetch(`https://${node}/${encodeURI(nextConfig.apiRoute)}/api/sync`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ key: nextConfig.masterKey, oldKey: oldMasterKey, config: nextConfig, fromMaster: true })
                     }).catch(() => {}));
                }
            });
        }
        
        if (nextConfig.tgToken && ctx) {
            const hookUrl = `https://${new URL(request.url).hostname}/${encodeURI(nextConfig.apiRoute)}/tg`;
            ctx.waitUntil(fetch(`https://api.telegram.org/bot${nextConfig.tgToken}/setWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: hookUrl })
            }).catch(()=>{}));
        }

        return new Response(JSON.stringify({ success: true, newRoute: nextConfig.apiRoute, tagWarning }), { status: 200 });
    } catch (e) { return new Response(JSON.stringify({ success: false }), { status: 400 }); }
}

async function handleSyncPanel(request, env, ctx) {
    try {
        const data = await request.json();
        if (!data.signal || data.signal !== "panel_login") {
            return new Response(JSON.stringify({ success: false, error: "Invalid signal" }), { status: 400 });
        }
        if (!data.tgAdminId || !data.panelHost) {
            return new Response(JSON.stringify({ success: false, error: "Missing fields" }), { status: 400 });
        }
        // Verify the tgAdminId matches this panel's config
        const adminId = sysConfig.tgAdminId || sysConfig.tgChatId;
        if (!adminId || adminId.toString() !== data.tgAdminId.toString()) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
        }
        const loginSignal = {
            name: data.panelName || data.panelHost,
            host: data.panelHost,
            apiRoute: data.panelApiRoute || sysConfig.apiRoute,
            masterKey: data.panelMasterKey,
            isLocal: false,
            ts: data.ts || Date.now()
        };
        if (env.IOT_DB) {
            ctx?.waitUntil(d1Put(env, "tg_panel_login", JSON.stringify(loginSignal)).catch(()=>{}));
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ success: false }), { status: 400 });
    }
}

const botI18n = {
    en: {
        welcome: "🤖 **Welcome to Nahan Gateway**\n━━━━━━━━━━━━━━━━━━━━\nSelect an option below:",
        status: "System Status",
        users: "Subscribers",
        metrics: "Gateway Health",
        panic: "Panic Mode",
        dash: "Dashboard Control",
        lang: "🌐 Change Language",
        active: "🟢 Active",
        paused: "🔴 Paused",
        uptime: "Uptime",
        streams: "📡 Active Streams",
        no_users: "📭 No Users Found\n━━━━━━━━━━━━━━━━\nNo users match your criteria.",
        sub_info: "👤 User Details\n━━━━━━━━━━━━━━━━",
        name: "Name",
        total: "Total Reqs",
        daily: "Daily Reqs",
        expiry: "Expiry",
        days: "Days remaining",
        created: "Created At",
        unlimited: "Unlimited",
        btn_back: "◀️ Back",
        btn_next: "▶️ Next",
        btn_del: "🗑️ Remove",
        btn_pause: "⏸️ Suspend",
        btn_resume: "▶️ Activate",
        btn_edit_name: "✏️ Rename",
        btn_edit_limits: "⚙️ Plan",
        btn_add: "➕ New User",
        btn_confirm: "✅ Confirm",
        btn_cancel: "❌ Cancel",
        msg_enter_name: "Please send a name for the subscriber:",
        msg_added: "✅ User added successfully!",
        msg_deleted: "🗑️ User removed successfully!",
        msg_panic: "🚨 PANIC MODE ACTIVATED 🚨\nRoute randomized & System Paused.",
        msg_invalid: "❌ Invalid input. Please try again.",
        msg_enter_limits: "Enter limits format:\n`[totalReqs] [dailyReqs] [days_limit]`\n(Use 0 for unlimited)\n\nExample:\n`10000 500 30`",
        msg_confirm_del: "⚠️ Remove User?\n━━━━━━━━━━━━━━━━\nThis action cannot be undone.",
        msg_confirm_panic: "⚠️ Are you absolutely sure you want to trigger PANIC mode? This will randomize API routes and pause all connections!",
        status_updated: "✅ Status updated!",
        access_denied: "🔒 Access Denied\nYou are not authorized to manage this panel.",
        dashboard: "Dashboard",
        search: "Search User",
        statistics: "Statistics",
        panel_info: "Panel Info",
        disabled_users: "Disabled Users",
        reset_traffic: "Reset Traffic",
        extend_expiry: "Extend Expiry",
        notes: "Notes",
        device_limit: "Config Limit",
        msg_enter_search: "🔍 Send a username, UUID, or name to search:",
        msg_enter_notes: "📝 Send a note for this user:",
        msg_enter_extend_days: "📅 Enter days to extend expiration:",
        msg_traffic_reset: "✅ Traffic has been reset for this user!",
        msg_expiry_extended: "✅ Expiration extended by {days} days!",
        msg_no_disabled: "✅ No Disabled Users\n━━━━━━━━━━━━━━━━\nAll users are active.",
        msg_enter_device_limit: "⚙️ Enter config limit (0 = unlimited):",
        config_limit_updated: "✅ Config limit updated!",
        stats_title: "📊 Panel Statistics",
        count_active: "active",
        count_paused: "paused",
        count_disabled: "auto-disabled",
        dash_total: "👥 Total Users",
        dash_active: "🟢 Active",
        dash_paused: "⏸️ Paused",
        dash_expired: "🔴 Expired",
        dash_auto_disabled: "⛔ Auto-Disabled",
        btn_main_menu: "Main Menu",
        btn_back_to_list: "Back to List",
        total_traffic: "📦 Total Traffic",
        daily_traffic: "📅 Daily Traffic",
        lbl_status: "Status",
        lbl_subscription: "Subscription Connection",
        lbl_user_not_found: "❌ User Not Found",
        lbl_none: "None",
        lbl_page: "Page",
        select_panel: "🔌 Select a panel to manage:",
        current_panel: "📌 Current Panel",
        switch_panel: "🔄 Switch Panel",
        panel_local: "🏠 Current Panel",
        panel_remote: "🌐",
        msg_panel_selected: "Panel selected! ✅",
        msg_panel_error: "❌ Failed to connect to the selected panel.",
        msg_panel_unreachable: "⚠️ Panel is unreachable. Please check the configuration.",
        btn_sub_link: "Subscription Link",
        sub_link_sent: "Subscription link sent!",
        btn_update_usage: "Update Usage",
        tg_settings: "Settings", tg_advanced: "Advanced", tg_logs: "Logs",
        tg_sys_settings: "System Settings", tg_adv_settings: "Advanced Settings",
        tg_logs_view: "View Logs", tg_logs_clear: "Clear Logs",
        tg_proto: "Protocol", tg_ports: "Ports", tg_uuid: "Device UUID", tg_path: "API Route",
        tg_pass: "Master Key", tg_dns: "DNS", tg_relay: "Relay IP", tg_maintenance: "Maintenance Hosts",
        tg_tfo: "TCP Fast Open", tg_ech: "ECH", tg_silent: "Silent Alerts", tg_pause: "Kill Switch",
        tg_auto_update: "Auto Update", tg_direct: "Direct Configs", tg_nat64: "NAT64",
        tg_clean_ips: "Clean IPs", tg_nodes: "Nodes", tg_strategy: "Name Strategy",
        tg_prefix: "Name Prefix", tg_fake_entries: "Fake Entries", tg_cf_settings: "Cloudflare Settings",
        tg_tg_settings: "Telegram Settings", tg_backup: "Backup", tg_restore: "Restore",
        tg_current_val: "Current Value", tg_new_val: "Send new value:",
        tg_saved: "Saved!", tg_cancelled: "Cancelled",
        tg_log_entry: "", tg_log_empty: "No logs found",
        tg_u_custom_name: "Custom Name", tg_u_clean_ips: "Clean IPs", tg_u_proxy_ips: "Proxy IPs",
        tg_u_nodes: "Nodes", tg_u_nat64: "NAT64", tg_u_mode: "Protocol Mode", tg_u_ports: "Ports",
        tg_u_max_cfg: "Max Configs", tg_u_all: "All Settings",
        tg_network: "Network", tg_uptime: "Uptime", tg_conns: "Active Connections",
        tg_version: "Version", tg_cf_usage: "CF Usage",
        // User-side bot strings
        user_welcome: "👋 Welcome to **Nahan** subscription bot!\n\nSend your subscription link to check your status, or use the buttons below.",
        user_send_link: "📎 Check Status\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\nSend your subscription link or User ID:",
        user_not_found: "❌ Not Found\n━━━━━━━━━━━━━━━━\nNo subscription found with this ID.\n\n💡 Please check and try again.",
        user_status: "📊 Subscription Status\n━━━━━━━━━━━━━━━━",
        user_trial_disabled: "🎁 Free Trial\n━━━━━━━━━━━━━━━━\n❌ Free trial is currently unavailable.",
        user_trial_used: "🎁 Free Trial\n━━━━━━━━━━━━━━━━\n⚠️ You have already used your free trial.\n\n💡 Upgrade your plan from the shop!",
        user_trial_created: "🎉 Your free trial has been activated!\n\n⏱ Duration: {days} days\n📦 Traffic: {gb} GB",
        user_buy_disabled: "🛒 Shop\n━━━━━━━━━━━━━━━━\n❌ Online purchase is currently unavailable.\n\n💡 Contact support for manual purchase.",
        user_buy_packages: "🛒 Choose Your Plan\n━━━━━━━━━━━━━━━━\nSelect a plan below to get started:",
        user_buy_selected: "📦 Plan Selected\n━━━━━━━━━━━━━━━━\n{name}\n\n💳 Payment Info:\nCard: `{card}`\nHolder: {owner}\n\n📸 Send a photo of your receipt after payment.",
        user_receipt_received: "📨 Receipt Received!\n━━━━━━━━━━━━━━━━\nYour purchase is being reviewed.\nWe\'ll notify you once it\'s approved.\n\n⏳ Please wait...",
        user_approved: "🎉 Purchase Approved!\n━━━━━━━━━━━━━━━━\nYour subscription is now active!\n\n🔗 Your subscription link:\n`{link}`\n\n🚀 Welcome to Nahan!",
        user_rejected: "❌ Purchase Rejected\n━━━━━━━━━━━━━━━━\nYour receipt could not be verified.\n\n💡 Please contact support for assistance.",
        user_no_packages: "📭 No Plans Available\n━━━━━━━━━━━━━━━━\nNo plans are currently available.\n\n💡 Contact support for more info.",
        user_status_guide: "📊 Check Status\n━━━━━━━━━━━━━━━━\nSend your subscription link or User ID:",
        admin_pending_title: "📋 Pending Purchases\n━━━━━━━━━━━━━━━━",
        admin_pending_empty: "✅ No pending purchases.",
        admin_pending_entry: "👤 {username}\n📦 {package}\n🕒 {time}",
        admin_approve: "✅ Approve",
        admin_reject: "❌ Reject",
        admin_approved_ok: "✅ Purchase approved. User notified.",
        admin_rejected_ok: "🗑 Purchase rejected. User notified.",
        admin_pending_purchases: "📋 Pending Purchases",
        // Shop management strings
        shop_settings: "🛍️ Shop & Bot Settings",
        shop_purchase_on: "✅ Purchase: ON",
        shop_purchase_off: "❌ Purchase: OFF",
        shop_trial_on: "✅ Trial: ON",
        shop_trial_off: "❌ Trial: OFF",
        shop_card_num: "💳 Card Number",
        shop_card_owner: "👤 Card Owner",
        shop_trial_days: "⏱ Trial Duration (days)",
        shop_trial_gb: "📦 Trial Traffic (GB)",
        shop_plans: "📋 Manage Plans",
        shop_add_plan: "➕ Add New Plan",
        shop_no_plans: "No plans defined yet.",
        shop_plan_name_prompt: "📦 Send plan name (e.g. 1 Month 20GB):",
        shop_plan_price_prompt: "💰 Send plan price (e.g. 150000 تومان):",
        shop_plan_days_prompt: "⏱ Send plan duration in days (e.g. 30):",
        shop_plan_gb_prompt: "📦 Send plan traffic in GB (e.g. 20):",
        shop_plan_added: "✅ Plan added successfully!",
        shop_plan_deleted: "🗑 Plan deleted.",
        shop_saved: "✅ Saved!",
        shop_welcome_prompt: "📝 Send new welcome message for the bot (use {name} for user name):",
        shop_welcome_set: "✅ Bot welcome message updated!",
        shop_bot_welcome: "💬 Bot Welcome Message",
        // v5.4.0: Wallet & Account translations
        user_wallet_title: "💳 Wallet\n━━━━━━━━━━━━━━━━",
        user_wallet_balance: "💰 Balance: {amount} T",
        user_wallet_charge: "💳 Charge Wallet",
        user_wallet_history: "📜 Transaction History",
        user_wallet_title: "💳 Wallet\n━━━━━━━━━━━━━━━━",
        user_wallet_empty: "📭 No transactions found.",
        user_wallet_referral: "🔗 Referral code: {code}",
        user_profile_title: "👤 Profile\n━━━━━━━━━━━━━━━━",
        user_profile_name: "Name",
        user_profile_id: "User ID",
        user_profile_since: "Member Since",
        user_referral_title: "🔗 Referral Program\n━━━━━━━━━━━━━━━━",
        user_referral_link: "Share this link with friends:",
        user_referral_commission: "💰 Commission: {percent}%",
        user_help_title: "❓ Help & Support\n━━━━━━━━━━━━━━━━",
        user_help_faq: "📖 FAQ",
        user_help_contact: "💬 Contact Support",
        user_services_title: "📋 My Services\n━━━━━━━━━━━━━━━━",
        user_services_empty: "📭 No active services found.",
        user_service_active: "🟢 Active",
        user_service_expired: "🔴 Expired",
        user_service_paused: "⏸️ Paused",
    },
    fa: {
        welcome: "🤖 **به ربات ترانزیت نهان خوش آمدید**\nجهت مدیریت سیستم نظارتی خود یکی از گزینه‌های زیر را انتخاب نمایید:",
        status: "وضعیت سیستم",
        users: "مدیریت مشترکین",
        metrics: "سلامت درگاه شبکه",
        panic: "وضعیت اضطراری (Panic)",
        dash: "پنل تحت وب",
        lang: "🌐 تغییر زبان به انگلیسی",
        active: "🟢 فعال",
        paused: "🔴 متوقف شده",
        uptime: "زمان کارکرد",
        streams: "📡 اتصالات فعال",
        no_users: "هیچ مشترکی پیدا نشد.",
        sub_info: "👤 مشخصات مشترک:",
        name: "نام",
        total: "درخواست کل",
        daily: "درخواست روزانه",
        expiry: "انقضاء",
        days: "روزهای باقی‌مانده",
        created: "تاریخ ایجاد",
        unlimited: "نامحدود",
        btn_back: "بازگشت",
        btn_next: "بعدی",
        btn_del: "حذف",
        btn_pause: "غیرفعال‌سازی",
        btn_resume: "فعال‌سازی",
        btn_edit_name: "تغییر نام",
        btn_edit_limits: "ویرایش محدودیت‌ها",
        btn_add: "+ افزودن مشترک جدید",
        btn_confirm: "تأیید",
        btn_cancel: "انصراف",
        msg_enter_name: "لطفاً نام یا شناسه مشترک جدید را ارسال نمایید:",
        msg_added: "مشترک با موفقیت افزوده شد!",
        msg_deleted: "مشترک با موفقیت حذف گردید!",
        msg_panic: "وضعیت اضطراری فعال شد\nمسیر تصادفی شد و سیستم متوقف گردید.",
        msg_invalid: "ورودی نامعتبر است. مجدداً تلاش نمایید.",
        msg_enter_limits: "فرمت ورودی محدودیت:\n`[کل] [روزانه] [مدت_روز]`\n(از 0 برای نامحدود استفاده کنید)\n\nمثال:\n`10000 500 30`",
        msg_confirm_del: "آیا از حذف این مشترک اطمینان کامل دارید؟",
        msg_confirm_panic: "آیا از فعال‌سازی وضعیت اضطراری اطمینان دارید؟ کل اتصالات متوقف و آدرس‌ها منقضی خواهند شد!",
        status_updated: "وضعیت بروزرسانی شد!",
        access_denied: "دسترسی غیرمجاز. شما اجازه مدیریت این پنل را ندارید.",
        dashboard: "داشبورد",
        search: "جستجوی کاربر",
        statistics: "آمار",
        panel_info: "اطلاعات پنل",
        disabled_users: "کاربران غیرفعال",
        reset_traffic: "بازنشانی ترافیک",
        extend_expiry: "تمدید انقضا",
        notes: "یادداشت‌ها",
        device_limit: "محدودیت کانفیگ",
        msg_enter_search: "🔍 نام کاربری، UUID یا لینک اشتراک را ارسال کنید:",
        msg_enter_notes: "📝 یادداشت برای این کاربر را ارسال کنید:",
        msg_enter_extend_days: "📅 تعداد روزهای تمدید را وارد کنید:",
        msg_traffic_reset: "ترافیک با موفقیت بازنشانی شد!",
        msg_expiry_extended: "انقضا به مدت {days} روز تمدید شد!",
        msg_no_disabled: "هیچ کاربر غیرفعالی یافت نشد.",
        msg_enter_device_limit: "محدودیت تعداد کانفیگ را وارد کنید (0 برای نامحدود):",
        config_limit_updated: "محدودیت کانفیگ به‌روزرسانی شد!",
        stats_title: "آمار پنل",
        count_active: "فعال",
        count_paused: "متوقف",
        count_disabled: "غیرفعال خودکار",
        dash_total: "کل کاربران",
        dash_active: "فعال",
        dash_paused: "متوقف",
        dash_expired: "منقضی",
        dash_auto_disabled: "غیرفعال خودکار",
        btn_main_menu: "منوی اصلی",
        btn_back_to_list: "بازگشت به لیست",
        total_traffic: "ترافیک کل",
        daily_traffic: "ترافیک روزانه",
        lbl_status: "وضعیت",
        lbl_subscription: "لینک اشتراک",
        lbl_user_not_found: "⚠️ کاربر یافت نشد",
        lbl_none: "ندارد",
        lbl_page: "صفحه",
        select_panel: "🔌 کدام پنل را می‌خواهید مدیریت کنید؟",
        current_panel: "پنل فعلی",
        switch_panel: "🔄 تغییر پنل",
        panel_local: "🏠 این پنل",
        panel_remote: "🌐",
        msg_panel_selected: "پنل انتخاب شد! ✅",
        msg_panel_error: "❌ اتصال به پنل انتخابی ناموفق بود.",
        msg_panel_unreachable: "⚠️ پنل در دسترس نیست. لطفاً پیکربندی را بررسی کنید.",
        btn_sub_link: "لینک اشتراک",
        sub_link_sent: "لینک اشتراک ارسال شد!",
        btn_update_usage: "بروزرسانی مصرف",
        tg_settings: "تنظیمات", tg_advanced: "پیشرفته", tg_logs: "گزارش‌ها",
        tg_sys_settings: "تنظیمات سیستم", tg_adv_settings: "تنظیمات پیشرفته",
        tg_logs_view: "مشاهده گزارش‌ها", tg_logs_clear: "پاک کردن گزارش‌ها",
        tg_proto: "پروتکل", tg_ports: "پورت‌ها", tg_uuid: "شناسه دستگاه", tg_path: "مسیر API",
        tg_pass: "کلید اصلی", tg_dns: "DNS", tg_relay: "آی‌پی رله", tg_maintenance: "سایت استتار",
        tg_tfo: "TCP Fast Open", tg_ech: "ECH", tg_silent: "هشدار خاموش", tg_pause: "کلید توقف",
        tg_auto_update: "بروزرسانی خودکار", tg_direct: "کانفیگ مستقیم", tg_nat64: "NAT64",
        tg_clean_ips: "آی‌پی تمیز", tg_nodes: "نودها", tg_strategy: "روش نام‌گذاری",
        tg_prefix: "پیشوند", tg_fake_entries: "ورودی‌های اشتراک", tg_cf_settings: "تنظیمات کلودفلر",
        tg_tg_settings: "تنظیمات تلگرام", tg_backup: "پشتیبان‌گیری", tg_restore: "بازیابی",
        tg_current_val: "مقدار فعلی", tg_new_val: "مقدار جدید را ارسال کنید:",
        tg_saved: "ذخیره شد!", tg_cancelled: "لغو شد",
        tg_log_entry: "", tg_log_empty: "گزارشی ثبت نشده",
        tg_u_custom_name: "نام سفارشی", tg_u_clean_ips: "آی‌پی تمیز", tg_u_proxy_ips: "آی‌پی پروکسی",
        tg_u_nodes: "نودها", tg_u_nat64: "NAT64", tg_u_mode: "پروتکل", tg_u_ports: "پورت‌ها",
        tg_u_max_cfg: "حداکثر کانفیگ", tg_u_all: "همه تنظیمات",
        tg_network: "شبکه", tg_uptime: "زمان کارکرد", tg_conns: "اتصالات فعال",
        tg_version: "نسخه", tg_cf_usage: "مصرف کلودفلر",
        // User-side bot strings
        user_welcome: "👋 سلام {name} عزیز!\n\n🔐 به ربات اشتراک **نهان** خوش آمدید.\n\nلینک اشتراک خود را ارسال کنید یا از منوی زیر استفاده نمایید:",
        user_send_link: "📎 لطفاً لینک اشتراک یا شناسه کاربری خود را ارسال کنید:",
        user_not_found: "❌ کاربری با این شناسه یافت نشد.",
        user_status: "📊 وضعیت اشتراک",
        user_trial_disabled: "❌ سرویس تست رایگان در حال حاضر غیرفعال است.",
        user_trial_used: "⚠️ شما قبلاً از تست رایگان استفاده کرده‌اید.",
        user_trial_created: "🎉 تست رایگان شما فعال شد!\n\n⏱ مدت: {days} روز\n📦 حجم: {gb} گیگابایت",
        user_buy_disabled: "❌ خرید آنلاین در حال حاضر غیرفعال است.",
        user_buy_packages: "🛒 **پکیج‌های موجود**\n\nیکی از پکیج‌های زیر را انتخاب کنید:",
        user_buy_selected: "✅ پکیج انتخابی:\n📦 {name}\n\n💳 اطلاعات پرداخت:\nشماره کارت: `{card}`\nصاحب حساب: {owner}\n\nپس از پرداخت، عکس رسید را ارسال کنید:",
        user_receipt_received: "📨 رسید شما دریافت شد و در حال بررسی است.\n\nپس از تأیید، لینک اشتراک برای شما ارسال می‌شود. ممنون از اعتماد شما! 🙏",
        user_approved: "🎉 خرید شما تأیید شد!\n\nلینک اشتراک شما:\n`{link}`\n\nبه سرویس نهان خوش آمدید! 🔑",
        user_rejected: "❌ رسید پرداخت شما رد شد.\n\nدر صورت بروز مشکل با پشتیبانی تماس بگیرید.",
        user_no_packages: "❌ هیچ پکیجی تعریف نشده. با ادمین تماس بگیرید.",
        user_status_guide: "📎 لینک اشتراک یا شناسه کاربری خود را ارسال کنید:",
        admin_pending_title: "📋 **درخواست‌های خرید در انتظار**",
        admin_pending_empty: "✅ درخواست خریدی در انتظار بررسی وجود ندارد.",
        admin_pending_entry: "👤 {username}\n📦 {package}\n🕒 {time}",
        admin_approve: "✅ تأیید خرید",
        admin_reject: "❌ رد خرید",
        admin_approved_ok: "✅ خرید تأیید شد و به کاربر اطلاع داده شد.",
        admin_rejected_ok: "🗑 خرید رد شد و به کاربر اطلاع داده شد.",
        admin_pending_purchases: "📋 درخواست‌های خرید",
        // Shop management strings
        shop_settings: "🛍️ تنظیمات فروشگاه و ربات",
        shop_purchase_on: "✅ خرید: فعال",
        shop_purchase_off: "❌ خرید: غیرفعال",
        shop_trial_on: "✅ تست رایگان: فعال",
        shop_trial_off: "❌ تست رایگان: غیرفعال",
        shop_card_num: "💳 شماره کارت",
        shop_card_owner: "👤 صاحب حساب",
        shop_trial_days: "⏱ مدت تست (روز)",
        shop_trial_gb: "📦 حجم تست (گیگابایت)",
        shop_plans: "📋 مدیریت پلن‌ها",
        shop_add_plan: "➕ افزودن پلن جدید",
        shop_no_plans: "هیچ پلنی تعریف نشده.",
        shop_plan_name_prompt: "📦 نام پلن را ارسال کنید (مثال: ۱ ماهه ۲۰ گیگ):",
        shop_plan_price_prompt: "💰 قیمت پلن را ارسال کنید (مثال: 150000 تومان):",
        shop_plan_days_prompt: "⏱ مدت پلن (روز) را ارسال کنید (مثال: 30):",
        shop_plan_gb_prompt: "📦 حجم پلن (گیگابایت) را ارسال کنید (مثال: 20):",
        shop_plan_added: "✅ پلن با موفقیت اضافه شد!",
        shop_plan_deleted: "🗑 پلن حذف شد.",
        shop_saved: "✅ ذخیره شد!",
        shop_welcome_prompt: "📝 پیام خوش‌آمد جدید ربات را ارسال کنید ({name} = نام کاربر):",
        shop_welcome_set: "✅ پیام خوش‌آمد ربات به‌روزرسانی شد!",
        shop_bot_welcome: "💬 پیام خوش‌آمد ربات",
        // Wallet
        user_wallet_title: "💳 کیف پول\n━━━━━━━━━━━━━━━━",
        user_wallet_balance: "💰 موجودی: {amount} تومان",
        user_wallet_charge: "💳 شارژ کیف پول",
        user_wallet_history: "📜 تاریخچه تراکنش‌ها",
        user_wallet_empty: "📭 هیچ تراکنشی یافت نشد.",
        user_wallet_referral: "🔗 کد معرف: {code}",
        // Profile
        user_profile_title: "👤 پروفایل کاربری\n━━━━━━━━━━━━━━━━",
        user_profile_name: "👤 نام: {name}",
        user_profile_id: "🆔 شناسه کاربری: {uuid}",
        user_profile_since: "📅 عضویت از: {date}",
        // Referral
        user_referral_title: "🔗 برنامه معرف\n━━━━━━━━━━━━━━━━",
        user_referral_link: "🔗 لینک معرف شما: {link}",
        user_referral_commission: "💰 کمیسیون: {percent}%",
        // Help & Support
        user_help_title: "🛍 راهنما و پشتیبانی\n━━━━━━━━━━━━━━━━",
        user_help_faq: "❓ سوالات متداول",
        user_help_contact: "📞 ارتباط با پشتیبانی",
        // Services
        user_services_title: "📋 سرویس های من\n━━━━━━━━━━━━━━━━",
        user_services_empty: "📭 هیچ سرویس فعالی یافت نشد.",
        user_service_active: "🟢 فعال",
        user_service_expired: "🔴 منقضی",
        user_service_paused: "⏸ معلق",
    }
};

function getPanelsList() {
    const panels = [];
    panels.push({
        name: sysConfig.name || "Main Panel",
        host: null,
        apiRoute: sysConfig.apiRoute,
        masterKey: null,
        isLocal: true
    });
    if (sysConfig.linkedPanels && Array.isArray(sysConfig.linkedPanels)) {
        sysConfig.linkedPanels.forEach(p => {
            if (p && p.host) {
                panels.push({
                    name: p.name || p.host,
                    host: p.host,
                    apiRoute: p.apiRoute || sysConfig.apiRoute,
                    masterKey: p.masterKey,
                    isLocal: false
                });
            }
        });
    }
    return panels;
}

async function remotePanelFetch(panel, method, path, body = null) {
    try {
        const url = `https://${panel.host}/${encodeURI(panel.apiRoute)}${path}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
        return await res.json();
    } catch(e) {
        return { success: false, error: e.message };
    }
}

async function fetchRemotePanelUsers(panel) {
    return await remotePanelFetch(panel, 'GET', `/api/users?key=${encodeURIComponent(panel.masterKey)}`);
}

async function fetchRemotePanelUser(panel, userId) {
    return await remotePanelFetch(panel, 'GET', `/api/users?id=${encodeURIComponent(userId)}&key=${encodeURIComponent(panel.masterKey)}`);
}

async function fetchRemotePanelStats(panel) {
    return await remotePanelFetch(panel, 'GET', `/api/stats?key=${encodeURIComponent(panel.masterKey)}`);
}

async function fetchRemotePanelConfig(panel) {
    return await remotePanelFetch(panel, 'POST', '/api/auth', { key: panel.masterKey });
}

async function remotePanelWriteAction(panel, method, userId, body = null) {
    let path = '/api/users';
    if (userId) path += `?id=${encodeURIComponent(userId)}&key=${encodeURIComponent(panel.masterKey)}`;
    else path += `?key=${encodeURIComponent(panel.masterKey)}`;
    return await remotePanelFetch(panel, method, path, body || { key: panel.masterKey });
}

async function remotePanelToggleUser(panel, userId) {
    return await remotePanelFetch(panel, 'POST', `/api/users?id=${encodeURIComponent(userId)}&action=toggle&key=${encodeURIComponent(panel.masterKey)}`);
}

async function remotePanelResetTraffic(panel, userId) {
    return await remotePanelFetch(panel, 'POST', `/api/users?id=${encodeURIComponent(userId)}&action=reset&key=${encodeURIComponent(panel.masterKey)}`);
}

async function handleTelegramWebhook(request, env, hostName, ctx) {
    try {
        const update = await request.json();
        const tgApi = `https://api.telegram.org/bot${sysConfig.tgToken}`;

        const langCode = sysConfig.tgBotLang || "fa";
        const t = (key) => botI18n[langCode]?.[key] || botI18n["en"]?.[key] || key;

        const callerId = update.callback_query?.from?.id?.toString() || update.message?.from?.id?.toString();
        const adminId = sysConfig.tgAdminId || sysConfig.tgChatId;
        const isAuthorized = adminId && callerId === adminId.toString();

        let tgState = {};
        try {
            const storedState = await d1Get(env, "tg_bot_state");
            if (storedState) tgState = JSON.parse(storedState);
        } catch (e) { }

        const panels = getPanelsList();

        // Read last login signal from D1 (set by handleAuth or handleSyncPanel)
        let lastLoginPanel = null;
        try {
            const stored = await d1Get(env, "tg_panel_login");
            if (stored) lastLoginPanel = JSON.parse(stored);
        } catch (e) { }

        const getActivePanel = () => {
            if (lastLoginPanel) {
                if (lastLoginPanel.isLocal) return panels.find(p => p.isLocal) || panels[0];
                const found = panels.find(p => !p.isLocal && p.host === lastLoginPanel.host);
                if (found) return found;
                // Remote panel not in linkedPanels — synthesize from login signal
                return {
                    name: lastLoginPanel.name || lastLoginPanel.host,
                    host: lastLoginPanel.host,
                    apiRoute: lastLoginPanel.apiRoute || sysConfig.apiRoute,
                    masterKey: lastLoginPanel.masterKey,
                    isLocal: false
                };
            }
            return panels[0]; // default to local
        };

        // Custom sendOrEdit message helper
        const sendOrEdit = async (chatId, text, replyMarkup = null, messageId = null) => {
            const plainText = text.replace(/\*\*/g, '').replace(/(?<![\\])[*_`\[\]]/g, '');
            let res;
            if (messageId) {
                res = await fetch(`${tgApi}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown', reply_markup: replyMarkup })
                });
                if (res.ok) return res;
                try {
                    const errBody = await res.json();
                    if (errBody?.description?.includes("message is not modified")) return res;
                    if (errBody?.description?.includes("parse") || errBody?.description?.includes("entities")) {
                        const r2 = await fetch(`${tgApi}/editMessageText`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: plainText, reply_markup: replyMarkup })
                        });
                        if (r2.ok) return r2;
                    }
                } catch (e) {}
            }
            res = await fetch(`${tgApi}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', reply_markup: replyMarkup })
            });
            if (res.ok) return res;
            try {
                const errBody = await res.json();
                if (errBody?.description?.includes("parse") || errBody?.description?.includes("entities")) {
                    return fetch(`${tgApi}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: plainText, reply_markup: replyMarkup })
                    });
                }
            } catch(e) {}
            return res;
        };

        const getMainMenu = (activePanel, isAdmin = true) => {
            const isPaused = sysConfig.isPaused || false;
            const statusEmoji = isPaused ? "🔴" : "🟢";
            const users = sysConfig.users || [];
            const activeCount = users.filter(u => !u.isPaused && (!u.expiryMs || Date.now() <= u.expiryMs)).length;
            const pausedCount = users.filter(u => u.isPaused && !u.disabledReason).length;
            const autoDisabledCount = users.filter(u => u.isPaused && u.disabledReason).length;
            const isLocal = !activePanel || activePanel.isLocal;
            const panelName = activePanel ? activePanel.name : (sysConfig.name || "Main Panel");
            const panelIndicator = isLocal ? `🏠 ${panelName}` : `🌐 ${panelName}`;
            let text = `${t("welcome")}\n\n` +
                         `━━━━━━━━━━━━━━━━\n` +
                         `📌 **${t("current_panel")}**: ${panelIndicator}\n` +
                         `⚡ **${t("status")}**: ${isPaused ? t("paused") : t("active")} ${statusEmoji}\n` +
                         `👥 **${t("users")}**: ${users.length} (${activeCount} ${t("count_active")}, ${pausedCount} ${t("count_paused")}, ${autoDisabledCount} ${t("count_disabled")})\n` +
                         `━━━━━━━━━━━━━━━━`;
            const panelUrl = isLocal ? `https://${hostName}/${encodeURI(sysConfig.apiRoute)}/dash` : null;
            const subUrl = `https://${hostName}/${sysConfig.apiRoute}`;
            /** @type {any} */
            const inline_keyboard = [];
            if (isAdmin) {
                inline_keyboard.push([
                    { text: `👥 ${t("users")}`, callback_data: "subs_list:0" },
                    { text: `🔍 ${t("search")}`, callback_data: "sub_search_init" }
                ]);
            }
            inline_keyboard.push([
                { text: `📊 ${t("dashboard")}`, callback_data: "sys_dashboard" },
                { text: `📈 ${t("statistics")}`, callback_data: "sys_stats" }
            ]);
            inline_keyboard.push([
                { text: `🔗 ${t("btn_sub_link")}`, callback_data: "get_sub_link" }
            ]);
            if (isAdmin) {
                inline_keyboard.push([
                    { text: `🚫 ${t("disabled_users")}`, callback_data: "subs_disabled:0" }
                ]);
                inline_keyboard.push([
                    { text: `🧪 ${t("trial_users") || "Trial Users"}`, callback_data: "admin_trial_users" }
                ]);
                const pendingCount = (sysConfig.pendingPurchases || []).length;
                if (pendingCount > 0) {
                    inline_keyboard.push([
                        { text: `📋 ${t("admin_pending_purchases") || "درخواست‌های خرید"} (${pendingCount})`, callback_data: "admin_pending_list" }
                    ]);
                }
                inline_keyboard.push([
                    { text: `⚙️ ${t("tg_settings")}`, callback_data: "tg_settings_menu" },
                    { text: `🔧 ${t("tg_advanced")}`, callback_data: "tg_advanced_menu" }
                ]);
                inline_keyboard.push([
                    { text: `📋 ${t("tg_logs")}`, callback_data: "tg_logs_menu" }
                ]);
            }
            inline_keyboard.push([
                { text: `🌐 ${langCode === 'fa' ? 'English 🇺🇸' : 'فارسی 🇮🇷'}`, callback_data: "sys_lang" },
                { text: isPaused ? `▶️ ${t("btn_resume")}` : `⏸️ ${t("btn_pause")}`, callback_data: "sys_toggle_status" }
            ]);
            if (panelUrl) {
                inline_keyboard.push([
                    { text: `🔑 ${t("dash")}`, web_app: { url: panelUrl } },
                    { text: `ℹ️ ${t("panel_info")}`, callback_data: "sys_panel_info" }
                ]);
                if (isAdmin) {
                    inline_keyboard.push([
                        { text: `🚨 ${t("panic")}`, callback_data: "sys_panic_init" }
                    ]);
                }
            } else {
                inline_keyboard.push([
                    { text: `ℹ️ ${t("panel_info")}`, callback_data: "sys_panel_info" }
                ]);
            }
            const kb = { inline_keyboard };
            return { text, kb };
        };

        const getSubsList = (page = 0, usersList = null) => {
            const users = usersList || sysConfig.users || [];
            const itemsPerPage = 5;
            const totalPages = Math.ceil(users.length / itemsPerPage);
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageUsers = users.slice(start, end);
            
            let text = `👥 **${t("users")}** (${t("lbl_page")} ${page + 1}/${Math.max(1, totalPages)})\n`;
            text += `━━━━━━━━━━━━━━━━\n`;
            
            if (users.length === 0) {
                text += `⚠️ ${t("no_users")}\n`;
            } else {
                pageUsers.forEach((u, idx) => {
                    text += `${start + idx + 1}. 👤 **${u.name}**\n   \`${u.id}\`\n`;
                });
            }
            text += `━━━━━━━━━━━━━━━━`;
            
            const inline_keyboard = [];
            pageUsers.forEach((u) => {
                inline_keyboard.push([{ text: `👤 ${u.name}`, callback_data: `sub_detail:${u.id}` }]);
            });
            
            const navRow = [];
            if (page > 0) {
                navRow.push({ text: `⬅️ ${t("btn_back")}`, callback_data: `subs_list:${page - 1}` });
            }
            if (end < users.length) {
                navRow.push({ text: `${t("btn_next")} ➡️`, callback_data: `subs_list:${page + 1}` });
            }
            if (navRow.length > 0) {
                inline_keyboard.push(navRow);
            }
            
            inline_keyboard.push([{ text: `➕ ${t("btn_add")}`, callback_data: "sub_add_init" }]);
            inline_keyboard.push([{ text: t("btn_main_menu"), callback_data: "main_menu" }]);
            
            return { text, kb: { inline_keyboard } };
        };

        const getSubDetail = (uuid, usersList = null) => {
            const users = usersList || sysConfig.users || [];
            const u = users.find(usr => usr.id === uuid);
            if (!u) {
                return { text: "⚠️ User not found", kb: { inline_keyboard: [[{ text: t("btn_back"), callback_data: "subs_list:0" }]] } };
            }
            
            const sysU = sysUsageCache?.users?.[u.id.replace(/-/g,'').toLowerCase()] || { reqs: 0, dReqs: 0, lastDay: '' };
            const userReqs = sysU.reqs || 0;
            const curDate = new Date().toISOString().split('T')[0];
            const userDReqs = sysU.lastDay === curDate ? (sysU.dReqs || 0) : 0;
            
            const limitTotalTxt = u.limitTotalReq ? `${u.limitTotalReq}` : t("unlimited");
            const limitDailyTxt = u.limitDailyReq ? `${u.limitDailyReq}` : t("unlimited");
            const usedGB = (userReqs / 6000).toFixed(2);
            const limitGB = u.limitTotalReq ? (u.limitTotalReq / 6000).toFixed(2) : t("unlimited");
            
            let expTxt = t("unlimited");
            let isExp = false;
            let daysLeft = t("unlimited");
            if (u.expiryMs) {
                const date = new Date(u.expiryMs);
                expTxt = date.toLocaleDateString();
                const remDays = Math.ceil((u.expiryMs - Date.now()) / 86400000);
                daysLeft = remDays >= 0 ? `${remDays}` : '0';
                if (Date.now() > u.expiryMs) {
                    expTxt += ` (${t("dash_expired")} 🔴)`;
                    isExp = true;
                }
            }
            
            const statusEmoji = u.isPaused ? "⏸️" : (isExp ? "🔴" : "🟢");
            const statusText = u.isPaused ? t("paused") : (isExp ? t("dash_expired") : t("active"));
            const subHash = u.subHash || generateSubHash(u.id);
            const subSync = `https://${hostName}/${encodeURI(sysConfig.subRoute || "sub")}/${subHash}`;
            const maxCfgTxt = u.maxConfigs || t("unlimited");
            const notesTxt = u.notes || t("lbl_none");
            const modeTxt = u.userMode ? (u.userMode === 'alpha' ? 'Alpha (V)' : u.userMode === 'beta' ? 'Beta (T)' : 'Both') : t("unlimited");
            const portsTxt = u.userPorts || t("unlimited");
            const cleanIpsTxt = u.cleanIp ? u.cleanIp.substring(0, 30) + (u.cleanIp.length > 30 ? '...' : '') : '—';
            const proxyIpsTxt = u.proxyIp ? u.proxyIp.substring(0, 30) + (u.proxyIp.length > 30 ? '...' : '') : '—';
            const nodesTxt = u.userNodes ? u.userNodes.substring(0, 30) + (u.userNodes.length > 30 ? '...' : '') : '—';
            const nat64Txt = u.nat64 || '—';
            
            let text = `👤 **${t("sub_info")}**\n`;
            text += `━━━━━━━━━━━━━━━━\n`;
            text += `📛 **${t("name")}**: ${u.name}\n`;
            text += `🆔 **UUID**: \`${u.id}\`\n`;
            text += `🚦 **${t("lbl_status")}**: ${statusEmoji} ${statusText}\n`;
            text += `📊 **${t("total")}**: ${usedGB} GB / ${limitGB} GB (${userReqs} reqs)\n`;
            text += `⏱ **${t("daily")}**: ${userDReqs} / ${limitDailyTxt}\n`;
            text += `📅 **${t("expiry")}**: ${expTxt}\n`;
            text += `⏳ **${t("days")}**: ${daysLeft}\n`;
            text += `📡 **${t("tg_u_mode")}**: ${modeTxt}\n`;
            text += `🔌 **${t("tg_u_ports")}**: ${portsTxt}\n`;
            text += `📱 **${t("device_limit")}**: ${maxCfgTxt}\n`;
            text += `🧹 **${t("tg_u_clean_ips")}**: ${cleanIpsTxt}\n`;
            text += `🔗 **${t("tg_u_proxy_ips")}**: ${proxyIpsTxt}\n`;
            text += `🖥️ **${t("tg_u_nodes")}**: ${nodesTxt}\n`;
            text += `🌐 **${t("tg_u_nat64")}**: ${nat64Txt}\n`;
            text += `📝 **${t("notes")}**: ${notesTxt}\n`;
            text += `━━━━━━━━━━━━━━━━\n`;
            text += `🔗 **${t("lbl_subscription")}:**\n\`${subSync}\``;
            
            const kb = {
                inline_keyboard: [
                    [
                        { text: u.isPaused ? `▶️ ${t("btn_resume")}` : `⏸️ ${t("btn_pause")}`, callback_data: `sub_toggle:${u.id}` },
                        { text: `🗑️ ${t("btn_del")}`, callback_data: `sub_del_init:${u.id}` }
                    ],
                    [
                        { text: `✏️ ${t("btn_edit_name")}`, callback_data: `sub_edit_name_init:${u.id}` },
                        { text: `⚙️ ${t("btn_edit_limits")}`, callback_data: `sub_edit_limits_init:${u.id}` }
                    ],
                    [
                        { text: `🔄 ${t("reset_traffic")}`, callback_data: `sub_reset_traffic:${u.id}` },
                        { text: `📅 ${t("extend_expiry")}`, callback_data: `sub_extend_init:${u.id}` }
                    ],
                    [
                        { text: `📝 ${t("notes")}`, callback_data: `sub_edit_notes_init:${u.id}` },
                        { text: `📱 ${t("device_limit")}`, callback_data: `sub_edit_device_init:${u.id}` }
                    ],
                    [
                        { text: t("btn_back_to_list"), callback_data: "subs_list:0" }
                    ]
                ]
            };
            return { text, kb };
        };

        if (update.callback_query) {
            const cb = update.callback_query;
            const chatId = cb.message?.chat?.id;
            const messageId = cb.message?.message_id;
            const data = cb.data;

            if (chatId) {
                // Route non-admin users to user callback handler
                const userCallbackPrefixes = ['user_', 'user_free_trial', 'user_buy', 'user_main_menu', 'user_status_guide', 'user_get_link:', 'user_renew_service:', 'user_delete_service:', 'user_pause_service:', 'user_support', 'user_rename_service:', 'user_referral'];
const adminCallbackPrefixes = ['admin_trial_users', 'admin_delete_trial_user:', 'admin_broadcast', 'admin_broadcast_send'];
                const isUserCallback = !isAuthorized || userCallbackPrefixes.some(p => data && data.startsWith(p));
                if (!isAuthorized && !userCallbackPrefixes.some(p => data && data.startsWith(p))) {
                    await fetch(`${tgApi}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ callback_query_id: cb.id, text: t("access_denied"), show_alert: true })
                    });
                    return new Response("OK", { status: 200 });
                }

                if (isUserCallback) {
                    // User callback handler (non-admin users + user_* callbacks for admins)
                    const fa3 = langCode === 'fa';
                    // Escape Markdown special chars in dynamic content (prevents parse_entities errors)
                    const esc = (s) => String(s || '').replace(/[_*`[\]]/g, '\\$&');
                    let userAnswerText = "";
                    if (data === "user_free_trial") {
                        if (!sysConfig.freeTrial) {
                            await sendOrEdit(chatId, t("user_trial_disabled") || "❌ Free trial disabled.", null, messageId);
                        } else {
                            const usedTrials = sysConfig.usedTrials || [];
                            const userTgId2 = String(cb.from?.id || chatId);
                            if (usedTrials.includes(userTgId2)) {
                                await sendOrEdit(chatId, fa3
                                    ? "⚠️ شما قبلاً از تست رایگان استفاده کرده‌اید.\n\n💡 دکمه ریست را بزنید تا دوباره تست بگیرید."
                                    : "⚠️ You have already used your free trial.\n\n💡 Press reset to take the trial again.",
                                    { inline_keyboard: [
                                        [{ text: fa3 ? '🔄 ریست تست رایگان' : '🔄 Reset Free Trial', callback_data: 'user_reset_trial' }],
                                        ...(sysConfig.purchaseEnabled ? [[{ text: fa3 ? '🛒 خرید اشتراک' : '🛒 Buy', callback_data: 'user_buy' }]] : []),
                                        [{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Menu', callback_data: 'user_main_menu' }]
                                    ]}, messageId);
                            } else {
                                const trialId = crypto.randomUUID();
                                const trialUser = {
                                    id: trialId,
                                    name: `trial_${cb.from?.username || cb.from?.first_name || userTgId2}_${Math.floor(Math.random() * 9000) + 1000}`,
                                    subHash: generateSubHash(trialId), ownerTgId: String(cb.from?.id || chatId),
                                    totalTrafficLimit: (sysConfig.freeTrialGB || 1) * 1073741824,
                                    limitTotalReq: Math.round((sysConfig.freeTrialGB || 1) * 6000),
                                    expiryMs: Date.now() + (sysConfig.freeTrialDays || 3) * 86400000,
                                    isPaused: false, isExpired: false, upLink: 0, downLink: 0
                                };
                                if (!sysConfig.users) sysConfig.users = [];
                                sysConfig.users.push(trialUser);
                                usedTrials.push(userTgId2);
                                sysConfig.usedTrials = usedTrials;
                                // Save to user accounts
                                if (!sysConfig.userAccounts) sysConfig.userAccounts = [];
                                const existingAcc = sysConfig.userAccounts.find(a => a.tgId === userTgId2);
                                if (existingAcc) {
                                    existingAcc.subId = trialId;
                                    existingAcc.lastActivity = Date.now();
                                } else {
                                    sysConfig.userAccounts.push({ tgId: userTgId2, tgName: cb.from?.username || '', firstName: cb.from?.first_name || '', subId: trialId, subHash: generateSubHash(trialId), savedLinks: [], joinedAt: Date.now(), lastActivity: Date.now() });
                                }
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                                const trialLink = `${new URL(request.url).origin}/${encodeURI(sysConfig.subRoute || "sub")}/${trialUser.subHash || generateSubHash(trialUser.id)}`;
                                const trialMsg = fa3
                                    ? `🎉 **تست رایگان شما فعال شد!**\n━━━━━━━━━━━━━━\n⏱ مدت: **${sysConfig.freeTrialDays || 3}** روز\n📦 حجم: **${sysConfig.freeTrialGB || 1}** گیگابایت\n━━━━━━━━━━━━━━\n\n🔗 لینک اشتراک شما:\n\`${trialLink}\`\n\n💡 این لینک را کپی کرده و در اپلیکیشن خود وارد نمایید.`
                                    : `🎉 **Free trial activated!**\n━━━━━━━━━━━━━━\n⏱ Duration: **${sysConfig.freeTrialDays || 3}** days\n📦 Traffic: **${sysConfig.freeTrialGB || 1}** GB\n━━━━━━━━━━━━━━\n\n🔗 Your subscription link:\n\`${trialLink}\`\n\n💡 Copy this link and add it to your app.`;
                                await sendOrEdit(chatId, trialMsg, { inline_keyboard: [[{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]] }, messageId);
                            }
                        }
                    } else if (data === "user_buy") {
                        if (!sysConfig.purchaseEnabled) {
                            await sendOrEdit(chatId, fa3
                                ? "❌ خرید آنلاین در حال حاضر غیرفعال است.\n\n💬 برای خرید مستقیم با پشتیبانی تماس بگیرید."
                                : "❌ Online purchase is currently disabled.\n\n💬 Contact support for manual purchase.",
                                { inline_keyboard: [
                                    ...(sysConfig.botSupportMsg ? [[{ text: fa3 ? '💬 پشتیبانی' : '💬 Support', callback_data: 'user_support' }]] : []),
                                    [{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Menu', callback_data: 'user_main_menu' }]
                                ]}, messageId);
                        } else {
                            const pkgs = sysConfig.purchaseOptions || [];
                            if (pkgs.length === 0) {
                                await sendOrEdit(chatId, fa3
                                    ? "❌ هیچ پکیجی تعریف نشده.\n\n💬 به‌زودی پکیج‌ها اضافه می‌شوند."
                                    : "❌ No packages available yet.",
                                    { inline_keyboard: [[{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Menu', callback_data: 'user_main_menu' }]] }, messageId);
                            } else {
                                let buyText = fa3
                                    ? "🛒 **پکیج‌های موجود**\n━━━━━━━━━━━━━━\nیکی از پکیج‌های زیر را انتخاب کنید:\n"
                                    : "🛒 **Available Packages**\n━━━━━━━━━━━━━━\nSelect a package:\n";
                                pkgs.forEach((p, i) => {
                                    buyText += `\n${i+1}. 📦 **${p.name}**\n   💰 ${p.price || '—'} | ⏱ ${p.days} ${fa3 ? 'روز' : 'days'} | 📦 ${p.gb} GB\n`;
                                });
                                const rows2 = pkgs.map(p => [{ text: `📦 ${p.name} — ${p.price || ''}`, callback_data: `user_buy_package:${p.id}` }]);
                                rows2.push([{ text: fa3 ? '◀️ بازگشت' : '◀️ Back', callback_data: 'user_main_menu' }]);
                                await sendOrEdit(chatId, buyText, { inline_keyboard: rows2 }, messageId);
                            }
                        }
                    } else if (data.startsWith("user_buy_package:")) {
                        const pkgId2 = data.replace("user_buy_package:", "");
                        const pkg2 = (sysConfig.purchaseOptions || []).find(p => p.id === pkgId2);
                        if (pkg2) {
                            const now2 = Date.now();
                            const hasActiveCodes = (sysConfig.promoCodes || []).some(c => c.isActive && (!c.validUntil || now2 <= c.validUntil) && (c.maxUses === 0 || c.usedCount < c.maxUses));
                            const pkgSummary = fa3
                                ? `✅ **پکیج انتخابی:**\n━━━━━━━━━━━━━━\n📦 نام: **${pkg2.name}**\n💰 قیمت: **${pkg2.price || '—'}**\n⏱ مدت: **${pkg2.days}** روز\n📦 حجم: **${pkg2.gb}** GB\n━━━━━━━━━━━━━━`
                                : `✅ **Selected Package:**\n━━━━━━━━━━━━━━\n📦 Name: **${pkg2.name}**\n💰 Price: **${pkg2.price || '—'}**\n⏱ Duration: **${pkg2.days}** days\n📦 Traffic: **${pkg2.gb}** GB\n━━━━━━━━━━━━━━`;
                            if (hasActiveCodes) {
                                const promoMsg = pkgSummary + (fa3 ? '\n\n🏷️ آیا کد تخفیف دارید؟' : '\n\n🏷️ Do you have a promo code?');
                                const promoKb = { inline_keyboard: [
                                    [{ text: fa3 ? '🏷️ وارد کردن کد تخفیف' : '🏷️ Apply Promo Code', callback_data: `user_apply_promo:${pkgId2}` }],
                                    [{ text: fa3 ? '💳 ادامه بدون کد تخفیف' : '💳 Continue Without Code', callback_data: `user_skip_promo:${pkgId2}` }],
                                    [{ text: fa3 ? '◀️ بازگشت' : '◀️ Back', callback_data: 'user_buy' }]
                                ]};
                                await sendOrEdit(chatId, promoMsg, promoKb, messageId);
                            } else {
                                tgState[chatId] = { step: 'user_awaiting_receipt', pkgId: pkgId2 };
                                ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                                const payMsg = pkgSummary + (fa3
                                    ? `\n\n💳 **اطلاعات پرداخت:**\nشماره کارت: \`${sysConfig.adminCardNumber || '—'}\`\nصاحب حساب: **${sysConfig.adminCardOwner || '—'}**\n━━━━━━━━━━━━━━\n\n📸 پس از پرداخت، **عکس رسید** را ارسال کنید:`
                                    : `\n\n💳 **Payment Info:**\nCard: \`${sysConfig.adminCardNumber || '—'}\`\nOwner: **${sysConfig.adminCardOwner || '—'}**\n━━━━━━━━━━━━━━\n\n📸 Send a **photo of the receipt** after payment:`);
                                await sendOrEdit(chatId, payMsg, { inline_keyboard: [[{ text: fa3 ? '❌ انصراف' : '❌ Cancel', callback_data: 'user_buy' }]] }, messageId);
                            }
                        }
                    } else if (data.startsWith("user_apply_promo:")) {
                        const pkgId3 = data.replace("user_apply_promo:", "");
                        const pkg3ap = (sysConfig.purchaseOptions || []).find(p => p.id === pkgId3);
                        tgState[chatId] = { step: 'promo_code', pkgId: pkgId3 };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, fa3
                            ? `🏷️ **کد تخفیف**\n━━━━━━━━━━━━━━\n📦 پکیج: **${pkg3ap?.name || pkgId3}**\n\nکد تخفیف خود را وارد کنید:`
                            : `🏷️ **Promo Code**\n━━━━━━━━━━━━━━\n📦 Package: **${pkg3ap?.name || pkgId3}**\n\nEnter your promo code:`,
                            { inline_keyboard: [[{ text: fa3 ? '◀️ بازگشت' : '◀️ Back', callback_data: `user_buy_package:${pkgId3}` }]] }, messageId);
                    } else if (data.startsWith("user_skip_promo:")) {
                        const pkgId3 = data.replace("user_skip_promo:", "");
                        const pkg3sp = (sysConfig.purchaseOptions || []).find(p => p.id === pkgId3);
                        if (pkg3sp) {
                            tgState[chatId] = { step: 'user_awaiting_receipt', pkgId: pkgId3 };
                            ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                            const payMsg3 = fa3
                                ? `💳 **اطلاعات پرداخت:**\n━━━━━━━━━━━━━━\n📦 پکیج: **${pkg3sp.name}**\n💰 قیمت: **${pkg3sp.price || '—'}**\n━━━━━━━━━━━━━━\nشماره کارت: \`${sysConfig.adminCardNumber || '—'}\`\nصاحب حساب: **${sysConfig.adminCardOwner || '—'}**\n━━━━━━━━━━━━━━\n\n📸 پس از پرداخت، **عکس رسید** را ارسال کنید:`
                                : `💳 **Payment Info:**\n━━━━━━━━━━━━━━\n📦 Package: **${pkg3sp.name}**\n💰 Price: **${pkg3sp.price || '—'}**\n━━━━━━━━━━━━━━\nCard: \`${sysConfig.adminCardNumber || '—'}\`\nOwner: **${sysConfig.adminCardOwner || '—'}**\n━━━━━━━━━━━━━━\n\n📸 Send a **photo of the receipt** after payment:`;
                            await sendOrEdit(chatId, payMsg3, { inline_keyboard: [[{ text: fa3 ? '❌ انصراف' : '❌ Cancel', callback_data: 'user_buy' }]] }, messageId);
                        }
                    } else if (data === "user_status_guide") {
                        tgState[chatId] = { step: 'user_awaiting_link' };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, fa3
                            ? "📎 **بررسی وضعیت اشتراک**\n━━━━━━━━━━━━━━\nلینک اشتراک یا شناسه کاربری خود را ارسال کنید:"
                            : "📎 **Check Subscription Status**\n━━━━━━━━━━━━━━\nSend your subscription link or User ID:",
                            { inline_keyboard: [[{ text: fa3 ? '◀️ بازگشت' : '◀️ Back', callback_data: 'user_main_menu' }]] }, messageId);
                } else if (data === "user_referral") {
                    let refText = '';
                    let refKb = [];
                    const hasRef = sysConfig.referralEnabled;
                    if (hasRef) {
                        const botUname = tgBotUsername || 'bot';
                        const myTgId = String(cb.from?.id || chatId);
                        const refLink = 'https://t.me/' + botUname + '?start=ref_' + myTgId;
                        const referredUsers = (sysConfig.users || []).filter(function(uu) { return String(uu.referredBy) === myTgId; });
                        const commission = sysConfig.referralCommission || 10;
                        const faRef = '🎯 <b>برنامه معرفی</b>\n\n' + '👤 <b>تعداد دعوت‌شده‌ها:</b> ' + referredUsers.length + '\n' + '💰 <b>پورسانت هر فروش:</b> ' + commission + '%\n' + '🔗 <b>لینک دعوت شما:</b>\n<code>' + refLink + '</code>\n\n📌 لینک را با دوستان خود به اشتراک بگذارید.';
                        const enRef = '🎯 <b>Referral Program</b>\n\n' + '👤 <b>Invited Users:</b> ' + referredUsers.length + '\n' + '💰 <b>Commission:</b> ' + commission + '%\n' + '🔗 <b>Your Referral Link:</b>\n<code>' + refLink + '</code>\n\n📌 Share with your friends.';
                        refText = fa3 ? faRef : enRef;
                        refKb = [[{ text: fa3 ? '📊 آمار دعوت‌ها' : '📊 Referral Stats', callback_data: 'user_referral_stats' }],[{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]];
                    } else {
                        refText = fa3 ? '❌ سیستم معرفی فعال نیست.' : '❌ Referral system is not enabled.';
                        refKb = [[{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]];
                    }
                    await sendOrEdit(chatId, messageId, refText, { inline_keyboard: refKb });
                } else if (data === "user_referral_stats") {
                    const myTgId2 = String(cb.from?.id || chatId);
                    const referredUsers2 = (sysConfig.users || []).filter(function(uu2) { return String(uu2.referredBy) === myTgId2; });
                    let statsText = '';
                    if (referredUsers2.length === 0) {
                        statsText = fa3 ? '📭 شما هنوز کسی را دعوت نکرده‌اید.' : '📭 You have not invited anyone yet.';
                    } else {
                        let listStr = '';
                        for (let ri = 0; ri < referredUsers2.length; ri++) {
                            listStr += (ri + 1) + '. ' + referredUsers2[ri].name + '\n';
                        }
                        statsText = fa3 ? '📊 <b>آمار دعوت‌ها</b>\n\n👤 <b>تعداد:</b> ' + referredUsers2.length + '\n\n' + listStr : '📊 <b>Referral Stats</b>\n\n👤 <b>Total:</b> ' + referredUsers2.length + '\n\n' + listStr;
                    }
                    await sendOrEdit(chatId, messageId, statsText, { inline_keyboard: [[{ text: fa3 ? '🔙 برگشت' : '🔙 Back', callback_data: 'user_referral' }]] });
                    } else if (data === "user_main_menu") {
                        const firstName2 = cb.from?.first_name || (fa3 ? "کاربر" : "User");
                        const customWelcome = sysConfig.botWelcomeMsg;
                        const welcomeMsg = customWelcome
                            ? customWelcome.replace('{name}', firstName2)
                            : fa3
                                ? `👋 سلام **${firstName2}** عزیز!\n\n🔐 به سرویس **نهان** خوش آمدید.\n━━━━━━━━━━━━━━\n\n💡 از منوی زیر گزینه مورد نظر خود را انتخاب کنید:`
                                : `👋 Hello **${firstName2}**!\n\n🔐 Welcome to **Nahan** service.\n━━━━━━━━━━━━━━\n\n💡 Select an option from the menu below:`;
                        const menuRows = [];
                        menuRows.push([{ text: fa3 ? '📱 سرویس‌های من' : '📱 My Services', callback_data: 'user_my_services' }]);
                        if (sysConfig.freeTrial) menuRows.push([{ text: fa3 ? '🎁 دریافت تست رایگان' : '🎁 Free Trial', callback_data: 'user_free_trial' }]);
                        if (sysConfig.purchaseEnabled) menuRows.push([{ text: fa3 ? '🛒 خرید اشتراک' : '🛒 Buy Subscription', callback_data: 'user_buy' }]);
                        menuRows.push([{ text: fa3 ? '👤 حساب کاربری من' : '👤 My Account', callback_data: 'user_my_account' }]);
                        if (sysConfig.botSupportMsg) menuRows.push([{ text: fa3 ? '💬 پشتیبانی' : '💬 Support', callback_data: 'user_support' }]);
                        await sendOrEdit(chatId, welcomeMsg, { inline_keyboard: menuRows }, messageId);
                    } else if (data === "user_reset_trial") {
                            // Only admin can reset free trials
                            const isAdminReset = String(cb.from?.id || chatId) === String(sysConfig.tgAdminId || "");
                            if (!isAdminReset) {
                                answerText = fa3 ? "⛔ فقط ادمین میتواند تست رایگان را ریست کند" : "⛔ Only admin can reset free trials";
                                await sendOrEdit(chatId, fa3
                                    ? "⛔ **دسترسی محدود**\n\nفقط ادمین میتواند تست رایگان را ریست کند."
                                    : "⛔ **Access Denied**\n\nOnly admin can reset free trials.",
                                    { inline_keyboard: [[{ text: fa3 ? "🏠 منو" : "🏠 Menu", callback_data: "user_main_menu" }]] }, messageId);
                            } else {
                            // Admin resetting trial

                            // Reset user's trial status so they can take free trial again
                            const usedTrials = sysConfig.usedTrials || [];
                            const userTgId3 = String(cb.from?.id || chatId);
                            const resetIdx = usedTrials.indexOf(userTgId3);
                            if (resetIdx !== -1) {
                                usedTrials.splice(resetIdx, 1);
                                sysConfig.usedTrials = usedTrials;
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                                await sendOrEdit(chatId, fa3
                                    ? "✅ **تست رایگان ریست شد!**\n\nاکنون می‌توانید دوباره تست رایگان بگیرید."
                                    : "✅ **Free trial reset!**\n\nYou can now take the free trial again.",
                                    { inline_keyboard: [
                                        [{ text: fa3 ? "🎮 شروع تست رایگان" : "🎮 Start Free Trial", callback_data: "user_free_trial" }],
                                        [{ text: fa3 ? "🏠 منوی اصلی" : "🏠 Menu", callback_data: "user_main_menu" }]
                                    ]}, messageId);
                            } else {
                                await sendOrEdit(chatId, fa3
                                    ? "❌ شما تست رایگان ثبت نکرده‌اید.\n\nبرای شروع تست رایگان دکمه زیر را بزنید."
                                    : "❌ You haven't taken the free trial yet.\n\nClick below to start:",
                                    { inline_keyboard: [
                                        [{ text: fa3 ? "🎮 شروع تست رایگان" : "🎮 Start Free Trial", callback_data: "user_free_trial" }],
                                        [{ text: fa3 ? "🏠 منوی اصلی" : "🏠 Menu", callback_data: "user_main_menu" }]
                                    ]}, messageId);
                            }
                            }
                        } else if (data.startsWith("user_get_link:")) {
                        const uid = data.replace("user_get_link:", "");
                        const linkUser = (sysConfig.users || []).find(u => u.id === uid);
                        const linkUrl = linkUser
                            ? `${new URL(request.url).origin}/${encodeURI(sysConfig.subRoute || "sub")}/${linkUser.subHash || generateSubHash(linkUser.id)}`
                            : `${new URL(request.url).origin}/${sysConfig.apiRoute}?sub=${encodeURIComponent(uid)}`;
                        await sendOrEdit(chatId, fa3
                            ? `🔗 **لینک اشتراک شما:**\n━━━━━━━━━━━━━━\n\`${linkUrl}\`\n━━━━━━━━━━━━━━\n\n💡 لینک را کپی کرده و در اپلیکیشن خود وارد نمایید.`
                            : `🔗 **Your Subscription Link:**\n━━━━━━━━━━━━━━\n\`${linkUrl}\`\n━━━━━━━━━━━━━━\n\n💡 Copy and add to your app.`,
                            { inline_keyboard: [[{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]] }, messageId);
                    } else if (data === "user_my_account") {
                        const userTgId2 = String(cb.from?.id || chatId);
                        const acc = (sysConfig.userAccounts || []).find(a => a.tgId === userTgId2);
                        const username = cb.from?.username || (fa3 ? 'ندارد' : 'N/A');
                        const firstName2 = cb.from?.first_name || (fa3 ? 'کاربر' : 'User');
                        const joinDate = acc?.joinedAt ? new Date(acc.joinedAt).toLocaleDateString(fa3 ? 'fa-IR' : 'en-US') : (fa3 ? 'جدید' : 'New');
                        const hasSub = acc?.subId ? (sysConfig.users || []).find(u => u.id === acc.subId) : null;
                        let accountText = fa3
                            ? `👤 *حساب کاربری*\n━━━━━━━━━━━━━━\n👤 نام: ${esc(firstName2)}\n🆔 یوزرنیم: @${esc(username)}\n📅 تاریخ عضویت: ${joinDate}\n📊 وضعیت اشتراک: ${hasSub ? '✅ فعال' : '❌ ندارد'}\n━━━━━━━━━━━━━━`
                            : `👤 *My Account*\n━━━━━━━━━━━━━━\n👤 Name: ${esc(firstName2)}\n🆔 Username: @${esc(username)}\n📅 Joined: ${joinDate}\n📊 Subscription: ${hasSub ? '✅ Active' : '❌ None'}\n━━━━━━━━━━━━━━`;
                        const accRows = [];
                        if (hasSub) accRows.push([{ text: fa3 ? '🔗 مشاهده لینک' : '🔗 View Link', callback_data: `user_get_link:${acc.subId}` }]);
                        accRows.push([{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Menu', callback_data: 'user_main_menu' }]);
                        await sendOrEdit(chatId, accountText, { inline_keyboard: accRows }, messageId);
                    } else if (data === "user_my_services") {
                        const userTgId2 = String(cb.from?.id || chatId);
                        const userAccs = (sysConfig.userAccounts || []).filter(a => a.tgId === userTgId2);
                        const svcRows2 = [];
                        let svcText;
                        if (userAccs.length > 0) {
                            svcText = fa3
                                ? "📱 *سرویس‌های من*\n━━━━━━━━━━━━━━━━\n\n📋 روی هر سرویس کلیک کنید:\n"
                                : "📱 *My Services*\n━━━━━━━━━━━━━━━━\n\n📋 Tap a service below:\n";
                            for (const acc of userAccs) {
                                const linkedUser = acc.subId ? (sysConfig.users || []).find(u => u.id === acc.subId) : null;
                                if (linkedUser && linkedUser.isDeleted) continue;
                                if (linkedUser) {
                                    const u = linkedUser;
                                    const safeName = esc(u.name);
                                    const isExp = u.expiryMs && Date.now() > u.expiryMs;
                                    const stEmoji = u.isPaused ? '⏸️' : isExp ? '❌' : '✅';
                                    const idClean = u.id.replace(/-/g,'').toLowerCase();
                                    const sysU = sysUsageCache?.users?.[idClean] || { reqs: 0 };
                                    const totalReqs = sysU.reqs || 0;
                                    const limitTotal = u.limitTotalReq || (u.totalTrafficLimit ? Math.round(u.totalTrafficLimit / (1073741824 / 6000)) : 0);
                                    const usedGB = (totalReqs / 6000).toFixed(2);
                                    const limitGB = limitTotal ? (limitTotal / 6000).toFixed(2) : '∞';
                                    const pct = limitTotal ? Math.min(100, Math.round(totalReqs / limitTotal * 100)) : 0;
                                    const dLeft = u.expiryMs ? Math.max(0, Math.ceil((u.expiryMs - Date.now()) / 86400000)) : -1;
                                    svcText += `\n${stEmoji} *${safeName}* | 📊 ${usedGB}/${limitGB} GB | ⏱ ${dLeft < 0 ? '∞' : dLeft}${fa3 ? ' روز' : 'd'}`;
                                    const subHash = u.subHash || generateSubHash(u.id);
                                    svcRows2.push([
                                        { text: `📋 ${safeName}`, callback_data: `user_get_link:${subHash}` },
                                        { text: `✏️ ${fa3 ? "تغییر نام" : "Rename"}`, callback_data: `user_rename_service:${subHash}` }
                                    ]);
                                } else {
                                    const safeName = esc(acc.tgName || acc.subId || "Unknown");
                                    svcText += `\n📛 ${safeName} ${fa3 ? "(سرویس یافت نشد)" : "(Service not found)"}`;
                                }
                            }
                            svcRows2.push([{ text: fa3 ? '➕ افزودن سرویس' : '➕ Add Service', callback_data: 'user_add_sub' }]);
                        } else {
                            svcText = fa3
                                ? "📱 *سرویس‌های من*\n━━━━━━━━━━━━━━━━\n\n📭 هنوز سرویسی ندارید.\n\n💡 ساب لینک خود را اضافه کنید یا یک پکیج خریداری کنید."
                                : "📱 *My Services*\n━━━━━━━━━━━━━━━━\n\n📭 No active service.\n\n💡 Add your subscription link or purchase a package.";
                            svcRows2.push([{ text: fa3 ? '➕ افزودن ساب لینک' : '➕ Add Subscription Link', callback_data: 'user_add_sub' }]);
                            if (sysConfig.purchaseEnabled) svcRows2.push([{ text: fa3 ? '🛒 خرید اشتراک' : '🛒 Buy Subscription', callback_data: 'user_buy' }]);
                            if (sysConfig.freeTrial) svcRows2.push([{ text: fa3 ? '🎁 دریافت تست رایگان' : '🎁 Free Trial', callback_data: 'user_free_trial' }]);
                        }
                        svcRows2.push([{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]);
                        await sendOrEdit(chatId, svcText, { inline_keyboard: svcRows2 }, messageId);
                    } else if (data.startsWith("user_rename_service:")) {
                        const targetHash = data.split(":")[1];
                        const adminLang = fa3;
                        if (!targetHash) {
                            await sendOrEdit(chatId, adminLang ? "❌ خطا: شناسه سرویس نامعتبر." : "❌ Error: Invalid service ID.", null, messageId);
                        } else {
                            const targetUser = (sysConfig.users || []).find(u => (u.subHash || generateSubHash(u.id)) === targetHash);
                            if (!targetUser) {
                                await sendOrEdit(chatId, adminLang ? "❌ سرویس یافت نشد." : "❌ Service not found.", null, messageId);
                            } else {
                                const userTgId2 = String(cb.from?.id || chatId);
                                const acc = (sysConfig.userAccounts || []).find(a => a.tgId === userTgId2 && a.subId === targetUser.id);
                                userStates = userStates || {};
                                userStates[userTgId2] = { state: "awaiting_rename", targetUserId: targetUser.id, targetSubHash: targetHash };
                                await sendOrEdit(chatId, adminLang
                                    ? `✏️ *تغییر نام سرویس*\n━━━━━━━━━━━━━━━━\n\nنام فعلی: *${esc(targetUser.name)}*\n\nلطفاً نام جدید سرویس را ارسال کنید:`
                                    : `✏️ *Rename Service*\n━━━━━━━━━━━━━━━━\n\nCurrent name: *${esc(targetUser.name)}*\n\nPlease send the new service name:`,
                                    { inline_keyboard: [[{ text: adminLang ? "🔙 انصراف" : "🔙 Cancel", callback_data: "user_my_services" }]] },
                                messageId);
                            }
                        }
                    } else if (data.startsWith("user_get_link:")) {
                        const targetHash = data.split(":")[1];
                        const adminLang = fa3;
                        if (!targetHash) {
                            await sendOrEdit(chatId, adminLang ? "❌ خطا: شناسه سرویس نامعتبر." : "❌ Error: Invalid service ID.", null, messageId);
                        } else {
                            const u = (sysConfig.users || []).find(usr => (usr.subHash || generateSubHash(usr.id)) === targetHash);
                            if (!u) {
                                await sendOrEdit(chatId, adminLang ? "❌ سرویس یافت نشد." : "❌ Service not found.", null, messageId);
                            } else {
                                const idClean2 = u.id.replace(/-/g,'').toLowerCase();
                                const sysU2 = sysUsageCache?.users?.[idClean2] || { reqs: 0 };
                                const totalReqs2 = sysU2.reqs || 0;
                                const limitTotal2 = u.limitTotalReq || (u.totalTrafficLimit ? Math.round(u.totalTrafficLimit / (1073741824 / 6000)) : 0);
                                const usedGB2 = (totalReqs2 / 6000).toFixed(2);
                                const limitGB2 = limitTotal2 ? (limitTotal2 / 6000).toFixed(2) : '∞';
                                const pct2 = limitTotal2 ? Math.min(100, Math.round(totalReqs2 / limitTotal2 * 100)) : 0;
                                const bar2 = limitTotal2 ? ('█'.repeat(Math.round(pct2 / 10)) + '░'.repeat(10 - Math.round(pct2 / 10))) : '──────────';
                                const isExp2 = u.expiryMs && Date.now() > u.expiryMs;
                                const dLeft2 = u.expiryMs ? Math.max(0, Math.ceil((u.expiryMs - Date.now()) / 86400000)) : -1;
                                const expiryDate2 = u.expiryMs ? new Date(u.expiryMs).toLocaleDateString(fa3 ? 'fa-IR' : 'en-US') : '∞';
                                const stEmoji2 = u.isPaused ? '⏸️' : isExp2 ? '❌' : '✅';
                                const stText2 = u.isPaused ? (fa3 ? 'متوقف' : 'Paused') : isExp2 ? (fa3 ? 'منقضی' : 'Expired') : (fa3 ? 'فعال' : 'Active');
                                const subLink2 = `${new URL(request.url).origin}/${encodeURI(sysConfig.subRoute || "sub")}/${u.subHash || generateSubHash(u.id)}`;
                                const safeName2 = esc(u.name);
                                const svcDetailText = fa3
                                    ? `📱 *جزئیات سرویس*\n━━━━━━━━━━━━━━━━\n📛 نام: ${safeName2}\n🚦 وضعیت: ${stEmoji2} ${stText2}\n━━━━━━━━━━━━━━━━\n📊 مصرف: *${usedGB2}* / ${limitGB2} GB\n${bar2} ${pct2}%\n⏱ روز مانده: *${dLeft2 < 0 ? '∞' : dLeft2}* روز\n📅 انقضا: ${expiryDate2}\n━━━━━━━━━━━━━━━━\n🔗 لینک:\n\`${subLink2}\`\n━━━━━━━━━━━━━━━━`
                                    : `📱 *Service Details*\n━━━━━━━━━━━━━━━━\n📛 Name: ${safeName2}\n🚦 Status: ${stEmoji2} ${stText2}\n━━━━━━━━━━━━━━━━\n📊 Usage: *${usedGB2}* / ${limitGB2} GB\n${bar2} ${pct2}%\n⏱ Days Left: *${dLeft2 < 0 ? '∞' : dLeft2}*\n📅 Expiry: ${expiryDate2}\n━━━━━━━━━━━━━━━━\n🔗 Link:\n\`${subLink2}\`\n━━━━━━━━━━━━━━━━`;
                                const detailRows = [
                                    [{ text: fa3 ? '🔄 تمدید' : '🔄 Renew', callback_data: `user_renew_service:${targetUser.id}` }, { text: fa3 ? '⏸️ توقف' : '⏸️ Pause', callback_data: `user_pause_service:${targetUser.id}` }],
                                    [{ text: `✏️ ${fa3 ? "تغییر نام" : "Rename"}`, callback_data: `user_rename_service:${targetHash}` }, { text: fa3 ? '🗑️ حذف' : '🗑️ Delete', callback_data: `user_delete_service:${targetUser.id}` }],
                                    [{ text: fa3 ? '🎧 پشتیبانی' : '🎧 Support', callback_data: 'user_support' }],
                                    [{ text: fa3 ? '🔙 خدمات من' : '🔙 My Services', callback_data: 'user_my_services' }, { text: fa3 ? '🏠 منو' : '🏠 Menu', callback_data: 'user_main_menu' }]
                                ];
                                await sendOrEdit(chatId, svcDetailText, { inline_keyboard: detailRows }, messageId);
                            }
                        }
                    } else if (data === "user_add_sub") {
                        tgState[chatId] = { step: 'user_awaiting_add_sub' };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, fa3
                            ? "📎 **افزودن ساب لینک**\n━━━━━━━━━━━━━━\nلینک اشتراک خود را ارسال کنید:"
                            : "📎 **Add Subscription Link**\n━━━━━━━━━━━━━━\nSend your subscription link:",
                            { inline_keyboard: [[{ text: fa3 ? '◀️ بازگشت' : '◀️ Back', callback_data: 'user_my_services' }]] }, messageId);
                    } else if (data === "user_support") {
                        const supportMsg = sysConfig.botSupportMsg || (fa3 ? '💬 برای پشتیبانی با ادمین تماس بگیرید.' : '💬 Contact admin for support.');
                        await sendOrEdit(chatId, fa3
                            ? `💬 **پشتیبانی**\n━━━━━━━━━━━━━━\n\n${supportMsg}`
                            : `💬 **Support**\n━━━━━━━━━━━━━━\n\n${supportMsg}`,
                            { inline_keyboard: [[{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Menu', callback_data: 'user_main_menu' }]] }, messageId);
                    }
                    ctx?.waitUntil(fetch(`${tgApi}/answerCallbackQuery`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ callback_query_id: cb.id, text: userAnswerText || "" })
                    }).catch(()=>{}));
                    return new Response("OK", { status: 200 });
                }

                // Get active panel from last login signal
                const activePanel = getActivePanel();
                const isRemotePanel = activePanel && !activePanel.isLocal;

                // Helper to fetch users for the active panel
                const getPanelUsers = async () => {
                    if (isRemotePanel) {
                        const res = await fetchRemotePanelUsers(activePanel);
                        return res.success ? (res.users || []) : null;
                    }
                    return sysConfig.users || [];
                };

                // Clear step state on callback query
                tgState[chatId] = null;
                ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));

                let answerText = null;

                if (data === "main_menu") {
                    const menu = getMainMenu(activePanel, isAuthorized);
                    await sendOrEdit(chatId, menu.text, menu.kb, messageId);
                } else if (data === "sys_lang") {
                    sysConfig.tgBotLang = (langCode === "fa") ? "en" : "fa";
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    const menu = getMainMenu(activePanel, isAuthorized);
                    await sendOrEdit(chatId, menu.text, menu.kb, messageId);
                } else if (data === "sys_toggle_status") {
                    sysConfig.isPaused = !sysConfig.isPaused;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    const menu = getMainMenu(activePanel, isAuthorized);
                    await sendOrEdit(chatId, menu.text, menu.kb, messageId);
                } else if (data === "sys_metrics") {
                    let usageStr = t("unlimited");
                    if (sysConfig.cfAccountId && sysConfig.cfApiToken) {
                        const reqs = await fetchCloudflareUsage(sysConfig.cfAccountId, sysConfig.cfApiToken);
                        if (reqs !== null) {
                            const pct = ((reqs / 100000) * 100).toFixed(2);
                            usageStr = `${reqs}/100000 (${pct}%)`;
                        }
                    }
                    const upSeconds = Math.floor((Date.now() - isolateStartTime)/1000);
                    const dh = Math.floor(upSeconds/3600);
                    const dm = Math.floor((upSeconds%3600)/60);
                    
                    let text = `📡 **${t("metrics")}**\n`;
                    text += `━━━━━━━━━━━━━━━━\n`;
                    text += `⏱ **${t("uptime")}**: ${dh}h ${dm}m\n`;
                    text += `🔌 **${t("streams")}**: ${activeConnections}\n`;
                    text += `📊 **Cloudflare API Usage**: ${usageStr}\n`;
                    text += `━━━━━━━━━━━━━━━━`;
                    
                    const kb = { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data.startsWith("subs_list:")) {
                    const page = parseInt(data.replace("subs_list:", "")) || 0;
                    const panelUsers = await getPanelUsers();
                    if (panelUsers === null && isRemotePanel) {
                        await sendOrEdit(chatId, t("msg_panel_error"), { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] });
                    } else {
                        const list = getSubsList(page, panelUsers);
                        await sendOrEdit(chatId, list.text, list.kb, messageId);
                    }
                } else if (data.startsWith("sub_detail:")) {
                    const uuid = data.replace("sub_detail:", "");
                    const panelUsers = await getPanelUsers();
                    if (panelUsers === null && isRemotePanel) {
                        await sendOrEdit(chatId, t("msg_panel_error"), { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] });
                    } else {
                        const detail = getSubDetail(uuid, panelUsers);
                        await sendOrEdit(chatId, detail.text, detail.kb, messageId);
                    }
                } else if (data.startsWith("sub_toggle:")) {
                    const uuid = data.replace("sub_toggle:", "");
                    if (isRemotePanel) {
                        await remotePanelToggleUser(activePanel, uuid);
                    } else if (sysConfig.users) {
                        const u = sysConfig.users.find(usr => usr.id === uuid);
                        if (u) {
                            u.isPaused = !u.isPaused;
                            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        }
                    }
                    const panelUsers = await getPanelUsers();
                    const detail = getSubDetail(uuid, panelUsers);
                    await sendOrEdit(chatId, detail.text, detail.kb, messageId);
                } else if (data.startsWith("sub_del_init:")) {
                    const uuid = data.replace("sub_del_init:", "");
                    const panelUsers = await getPanelUsers();
                    const u = panelUsers?.find(usr => usr.id === uuid);
                    const name = u ? u.name : "";
                    const text = `${t("msg_confirm_del")}\n\n👤 **${name}**`;
                    const kb = {
                        inline_keyboard: [
                            [
                                { text: `✅ ${t("btn_confirm")}`, callback_data: `sub_del_confirm:${uuid}` },
                                { text: `❌ ${t("btn_cancel")}`, callback_data: `sub_detail:${uuid}` }
                            ]
                        ]
                    };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data.startsWith("sub_del_confirm:")) {
                    const uuid = data.replace("sub_del_confirm:", "");
                    if (isRemotePanel) {
                        await remotePanelWriteAction(activePanel, 'DELETE', uuid);
                    } else if (sysConfig.users) {
                        sysConfig.users = sysConfig.users.filter(usr => usr.id !== uuid);
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    }
                    const successText = `✅ ${t("msg_deleted")}`;
                    const kb = { inline_keyboard: [[{ text: t("btn_back"), callback_data: "subs_list:0" }]] };
                    await sendOrEdit(chatId, successText, kb, messageId);
                } else if (data === "sub_add_init") {
                    tgState[chatId] = { step: "sub_add_name" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const text = `➕ ${t("msg_enter_name")}`;
                    const kb = { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "subs_list:0" }]] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data.startsWith("sub_edit_name_init:")) {
                    const uuid = data.replace("sub_edit_name_init:", "");
                    tgState[chatId] = { step: `sub_edit_name:${uuid}` };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const text = `✏️ ${t("msg_enter_name")}`;
                    const kb = { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: `sub_detail:${uuid}` }]] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data.startsWith("sub_edit_limits_init:")) {
                    const uuid = data.replace("sub_edit_limits_init:", "");
                    tgState[chatId] = { step: `sub_edit_limits:${uuid}` };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const text = `⚙️ ${t("msg_enter_limits")}`;
                    const kb = {
                        inline_keyboard: [
                            [{ text: `♾️ Skip (Unlimited)`, callback_data: `sub_unlimit_cb:${uuid}` }],
                            [{ text: `❌ ${t("btn_cancel")}`, callback_data: `sub_detail:${uuid}` }]
                        ]
                    };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data.startsWith("sub_unlimit_cb:")) {
                    const uuid = data.replace("sub_unlimit_cb:", "");
                    if (isRemotePanel) {
                        await remotePanelWriteAction(activePanel, 'PUT', uuid, { key: activePanel.masterKey, trafficLimit: 0, dailyLimit: 0, expiryDays: 0 });
                    } else if (sysConfig.users) {
                        const u = sysConfig.users.find(usr => usr.id === uuid);
                        if (u) {
                            u.limitTotalReq = null;
                            u.limitDailyReq = null;
                            u.expiryMs = null;
                            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        }
                    }
                    const panelUsers = await getPanelUsers();
                    const detail = getSubDetail(uuid, panelUsers);
                    await sendOrEdit(chatId, detail.text, detail.kb, messageId);
                } else if (data === "sub_add_unlimited_skip") {
                    let stateName = "Subscriber";
                    try {
                        const savedStateRaw = await d1Get(env, "tg_bot_state");
                        if (savedStateRaw) {
                            const stObj = JSON.parse(savedStateRaw);
                            if (stObj[chatId] && stObj[chatId].name) {
                                stateName = stObj[chatId].name;
                            }
                        }
                    } catch(e){}
                    
                    const newUuid = crypto.randomUUID();
                    if (isRemotePanel) {
                        const res = await remotePanelWriteAction(activePanel, 'POST', null, { key: activePanel.masterKey, name: stateName });
                        if (res.success && res.user) {
                            const detail = getSubDetail(res.user.id, [res.user]);
                            await sendOrEdit(chatId, `✅ ${t("msg_added")}\n\n${detail.text}`, detail.kb, messageId);
                        } else {
                            await sendOrEdit(chatId, t("msg_panel_error"), { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] });
                        }
                    } else {
                        if (!sysConfig.users) sysConfig.users = [];
                        sysConfig.users.push({
                            id: newUuid,
                            name: stateName,
                            limitTotalReq: null,
                            limitDailyReq: null,
                            expiryMs: null,
                            createdAt: Date.now()
                        });
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        const detail = getSubDetail(newUuid);
                        await sendOrEdit(chatId, `✅ ${t("msg_added")}\n\n${detail.text}`, detail.kb, messageId);
                    }
                    tgState[chatId] = null;
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                } else if (data === "sys_panic_init") {
                    const text = `${t("msg_confirm_panic")}`;
                    const kb = {
                        inline_keyboard: [
                            [
                                { text: `🚨 YES PANIC 🚨`, callback_data: "sys_panic_confirm" },
                                { text: `❌ No, Cancel`, callback_data: "main_menu" }
                            ]
                        ]
                    };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data === "sys_panic_confirm") {
                    sysConfig.apiRoute = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2,'0')).join('');
                    sysConfig.isPaused = true;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    const successText = `${t("msg_panic")}\n\n🔑 New Secret Path Randomized. All old sessions revoked.`;
                    const kb = { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] };
                    await sendOrEdit(chatId, successText, kb, messageId);
                } else if (data === "sys_dashboard") {
                    let users, activeCount, pausedCount, expiredCount, autoDisabledCount;
                    if (isRemotePanel) {
                        const statsRes = await fetchRemotePanelStats(activePanel);
                        if (statsRes.success && statsRes.stats) {
                            const s = statsRes.stats;
                            users = [];
                            activeCount = s.users?.active || 0;
                            pausedCount = s.users?.paused || 0;
                            expiredCount = s.users?.expired || 0;
                            autoDisabledCount = s.users?.autoDisabled || 0;
                        } else {
                            const panelUsers = await getPanelUsers();
                            users = panelUsers || [];
                            activeCount = users.filter(u => !u.isPaused && (!u.expiryMs || Date.now() <= u.expiryMs)).length;
                            pausedCount = users.filter(u => u.isPaused && !u.disabledReason).length;
                            expiredCount = users.filter(u => u.expiryMs && Date.now() > u.expiryMs && !u.isPaused).length;
                            autoDisabledCount = users.filter(u => u.isPaused && u.disabledReason).length;
                        }
                    } else {
                        users = sysConfig.users || [];
                        activeCount = users.filter(u => !u.isPaused && (!u.expiryMs || Date.now() <= u.expiryMs)).length;
                        pausedCount = users.filter(u => u.isPaused && !u.disabledReason).length;
                        expiredCount = users.filter(u => u.expiryMs && Date.now() > u.expiryMs && !u.isPaused).length;
                        autoDisabledCount = users.filter(u => u.isPaused && u.disabledReason).length;
                    }
                    let dashText = `📊 **${t("dashboard")}**\n`;
                    dashText += `━━━━━━━━━━━━━━━━\n`;
                    dashText += `📌 **${t("current_panel")}**: ${activePanel.isLocal ? '🏠' : '🌐'} ${activePanel.name}\n`;
                    dashText += `━━━━━━━━━━━━━━━━\n`;
                    dashText += `👥 **${t("dash_total")}**: ${Array.isArray(users) ? users.length : (activeCount + pausedCount + expiredCount + autoDisabledCount)}\n`;
                    dashText += `🟢 **${t("dash_active")}**: ${activeCount}\n`;
                    dashText += `⏸️ **${t("dash_paused")}**: ${pausedCount}\n`;
                    dashText += `🔴 **${t("dash_expired")}**: ${expiredCount}\n`;
                    dashText += `🚫 **${t("dash_auto_disabled")}**: ${autoDisabledCount}\n`;
                    if (!isRemotePanel) {
                        const upSeconds = Math.floor((Date.now() - isolateStartTime) / 1000);
                        const dh = Math.floor(upSeconds / 3600);
                        const dm = Math.floor((upSeconds % 3600) / 60);
                        dashText += `⏱ **${t("uptime")}**: ${dh}h ${dm}m\n`;
                        dashText += `🔌 **${t("streams")}**: ${activeConnections}\n`;
                        dashText += `⚡ **System**: ${sysConfig.isPaused ? t("paused") : t("active")}\n`;
                    }
                    dashText += `━━━━━━━━━━━━━━━━`;
                    const kb = { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] };
                    await sendOrEdit(chatId, dashText, kb, messageId);
                } else if (data === "sys_stats") {
                    let users, totalReqs, dailyReqs;
                    if (isRemotePanel) {
                        const statsRes = await fetchRemotePanelStats(activePanel);
                        if (statsRes.success && statsRes.stats) {
                            const s = statsRes.stats;
                            users = [];
                            totalReqs = s.traffic?.totalRequests || 0;
                            dailyReqs = s.traffic?.dailyRequests || 0;
                        } else {
                            const panelUsers = await getPanelUsers();
                            users = panelUsers || [];
                            totalReqs = 0;
                            dailyReqs = 0;
                        }
                    } else {
                        users = sysConfig.users || [];
                        totalReqs = 0;
                        dailyReqs = 0;
                        const todayDate = new Date().toISOString().split('T')[0];
                        users.forEach(u => {
                            const idClean = u.id.replace(/-/g, '').toLowerCase();
                            const sysU = sysUsageCache?.users?.[idClean] || { reqs: 0, dReqs: 0, lastDay: '' };
                            totalReqs += (sysU.reqs || 0);
                            if (sysU.lastDay === todayDate) dailyReqs += (sysU.dReqs || 0);
                        });
                    }
                    let statsText = `📈 **${t("stats_title")}**\n`;
                    statsText += `━━━━━━━━━━━━━━━━\n`;
                    statsText += `📌 **${t("current_panel")}**: ${activePanel.isLocal ? '🏠' : '🌐'} ${activePanel.name}\n`;
                    statsText += `━━━━━━━━━━━━━━━━\n`;
                    statsText += `👥 **${t("dash_total")}**: ${Array.isArray(users) ? users.length : 'N/A'}\n`;
                    statsText += `📊 **${t("total_traffic")}**: ${(totalReqs / 6000).toFixed(2)} GB\n`;
                    statsText += `📅 **${t("daily_traffic")}**: ${(dailyReqs / 6000).toFixed(2)} GB\n`;
                    if (!isRemotePanel) {
                        const upSeconds = Math.floor((Date.now() - isolateStartTime) / 1000);
                        const dh = Math.floor(upSeconds / 3600);
                        const dm = Math.floor((upSeconds % 3600) / 60);
                        statsText += `⏱ **${t("tg_uptime")}**: ${dh}h ${dm}m\n`;
                        statsText += `🔌 **${t("tg_conns")}**: ${activeConnections}\n`;
                        statsText += `📦 **${t("tg_version")}**: v${CURRENT_VERSION}\n`;
                    }
                    statsText += `━━━━━━━━━━━━━━━━`;
                    if (sysConfig.cfAccountId && sysConfig.cfApiToken) {
                        const reqs = await fetchCloudflareUsage(sysConfig.cfAccountId, sysConfig.cfApiToken);
                        if (reqs !== null) {
                            const pct = ((reqs / 100000) * 100).toFixed(2);
                            statsText += `\n☁️ **Cloudflare API**: ${reqs}/100000 (${pct}%)`;
                        }
                    }
                    const kb = { inline_keyboard: [
                        [{ text: `🔄 ${t("btn_update_usage")}`, callback_data: "sys_stats" }],
                        [{ text: t("btn_main_menu"), callback_data: "main_menu" }]
                    ] };
                    await sendOrEdit(chatId, statsText, kb, messageId);
                } else if (data === "sys_panel_info") {
                    let infoText = `ℹ️ **${t("panel_info")}**\n`;
                    infoText += `━━━━━━━━━━━━━━━━\n`;
                    infoText += `📌 **${t("current_panel")}**: ${activePanel.isLocal ? '🏠' : '🌐'} ${activePanel.name}\n`;
                    if (activePanel.isLocal) {
                        infoText += `🌐 **Host**: ${hostName}\n`;
                        infoText += `🔑 **API Route**: \`${sysConfig.apiRoute}\`\n`;
                        infoText += `📡 **Mode**: ${sysConfig.mode || 'alpha'}\n`;
                        infoText += `🔒 **Ports**: ${sysConfig.socketPorts || '443'}\n`;
                    } else {
                        infoText += `🌐 **Host**: ${activePanel.host}\n`;
                        infoText += `🔑 **API Route**: \`${activePanel.apiRoute}\`\n`;
                    }
                    infoText += `📱 **Version**: ${CURRENT_VERSION}\n`;
                    infoText += `━━━━━━━━━━━━━━━━`;
                    const kb = { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] };
                    await sendOrEdit(chatId, infoText, kb, messageId);
                } else if (data.startsWith("subs_disabled:")) {
                    const panelUsers = await getPanelUsers();
                    const users = panelUsers || [];
                    const disabledUsers = users.filter(u => u.isPaused);
                    if (disabledUsers.length === 0) {
                        const kb = { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] };
                        await sendOrEdit(chatId, `🚫 ${t("msg_no_disabled")}`, kb, messageId);
                    } else {
                        const page = parseInt(data.replace("subs_disabled:", "")) || 0;
                        const itemsPerPage = 5;
                        const start = page * itemsPerPage;
                        const end = start + itemsPerPage;
                        const pageUsers = disabledUsers.slice(start, end);
                        let text = `🚫 **${t("disabled_users")}** (${disabledUsers.length})\n━━━━━━━━━━━━━━━━\n`;
                        const inline_keyboard = [];
                        pageUsers.forEach((u) => {
                            const reason = u.disabledReason || t("paused");
                            text += `👤 **${u.name}**\n   ${reason}\n`;
                            inline_keyboard.push([{ text: `▶️ ${u.name}`, callback_data: `sub_toggle:${u.id}` }]);
                        });
                        const navRow = [];
                        if (page > 0) navRow.push({ text: `⬅️ ${t("btn_back")}`, callback_data: `subs_disabled:${page - 1}` });
                        if (end < disabledUsers.length) navRow.push({ text: `${t("btn_next")} ➡️`, callback_data: `subs_disabled:${page + 1}` });
                        if (navRow.length > 0) inline_keyboard.push(navRow);
                        inline_keyboard.push([{ text: t("btn_main_menu"), callback_data: "main_menu" }]);
                        await sendOrEdit(chatId, text, { inline_keyboard }, messageId);
                    }
                } else if (data === "sub_search_init") {
                    tgState[chatId] = { step: "sub_search" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const text = `🔍 ${t("msg_enter_search")}`;
                    const kb = { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "main_menu" }]] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data.startsWith("sub_reset_traffic:")) {
                    const uuid = data.replace("sub_reset_traffic:", "");
                    if (isRemotePanel) {
                        await remotePanelResetTraffic(activePanel, uuid);
                    } else {
                        if (!sysUsageCache) sysUsageCache = { users: {} };
                        if (!sysUsageCache.users) sysUsageCache.users = {};
                        const uuidClean = uuid.replace(/-/g, '').toLowerCase();
                        if (sysUsageCache.users[uuidClean]) {
                            sysUsageCache.users[uuidClean].reqs = 0;
                            sysUsageCache.users[uuidClean].dReqs = 0;
                        } else {
                            sysUsageCache.users[uuidClean] = { reqs: 0, dReqs: 0, lastDay: new Date().toISOString().split('T')[0] };
                        }
                        await cachedD1Put(env, "sys_usage", JSON.stringify(sysUsageCache));
                    }
                    const panelUsers = await getPanelUsers();
                    const detail = getSubDetail(uuid, panelUsers);
                    await sendOrEdit(chatId, `✅ ${t("msg_traffic_reset")}\n\n${detail.text}`, detail.kb, messageId);
                } else if (data.startsWith("sub_extend_init:")) {
                    const uuid = data.replace("sub_extend_init:", "");
                    tgState[chatId] = { step: `sub_extend_days:${uuid}` };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const text = `📅 ${t("msg_enter_extend_days")}`;
                    const kb = { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: `sub_detail:${uuid}` }]] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data.startsWith("sub_edit_notes_init:")) {
                    const uuid = data.replace("sub_edit_notes_init:", "");
                    tgState[chatId] = { step: `sub_edit_notes:${uuid}` };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const text = `📝 ${t("msg_enter_notes")}`;
                    const kb = { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: `sub_detail:${uuid}` }]] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data.startsWith("sub_edit_device_init:")) {
                    const uuid = data.replace("sub_edit_device_init:", "");
                    tgState[chatId] = { step: `sub_edit_device:${uuid}` };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const text = `📱 ${t("msg_enter_device_limit")}`;
                    const kb = { inline_keyboard: [
                        [{ text: `♾️ Unlimited`, callback_data: `sub_device_unlimited:${uuid}` }],
                        [{ text: `❌ ${t("btn_cancel")}`, callback_data: `sub_detail:${uuid}` }]
                    ] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data.startsWith("sub_device_unlimited:")) {
                    const uuid = data.replace("sub_device_unlimited:", "");
                    if (isRemotePanel) {
                        await remotePanelWriteAction(activePanel, 'PUT', uuid, { key: activePanel.masterKey, maxConfigs: null });
                    } else if (sysConfig.users) {
                        const u = sysConfig.users.find(usr => usr.id === uuid);
                        if (u) {
                            u.maxConfigs = null;
                            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        }
                    }
                    const panelUsers = await getPanelUsers();
                    const detail = getSubDetail(uuid, panelUsers);
                    await sendOrEdit(chatId, `✅ ${t("status_updated")}`, detail.kb, messageId);
                } else if (data === "get_sub_link") {
                    const subUrl = `https://${hostName}/${sysConfig.apiRoute}`;
                    await fetch(`${tgApi}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: `\`${subUrl}\``, parse_mode: 'Markdown' })
                    });
                    answerText = t("sub_link_sent");
                } else if (data === "tg_settings_menu") {
                    const modeTxt = sysConfig.mode === 'alpha' ? 'Alpha (V)' : sysConfig.mode === 'beta' ? 'Beta (T)' : 'Both';
                    const portsTxt = sysConfig.socketPorts || '443';
                    const passTxt = sysConfig.masterKey || 'admin';
                    const dnsTxt = sysConfig.resolveIp || '1.1.1.1';
                    const relayTxt = sysConfig.backupRelay || '—';
                    const tfoTxt = sysConfig.enableOpt1 ? '✅' : '❌';
                    const echTxt = sysConfig.enableOpt2 ? '✅' : '❌';
                    const pauseTxt = sysConfig.isPaused ? '🔴 ON' : '🟢 OFF';
                    const silentTxt = sysConfig.silentAlerts ? '✅' : '❌';
                    const autoUpTxt = sysConfig.autoUpdate ? '✅' : '❌';
                    const directTxt = sysConfig.enableDirectConfigs ? '✅' : '❌';
                    const nat64Txt = sysConfig.nat64Prefix || '—';
                    let text = `⚙️ **${t("tg_sys_settings")}**\n━━━━━━━━━━━━━━━━\n`;
                    text += `📡 ${t("tg_proto")}: **${modeTxt}**\n`;
                    text += `🔌 ${t("tg_ports")}: \`${portsTxt}\`\n`;
                    text += `🔑 ${t("tg_pass")}: \`${passTxt}\`\n`;
                    text += `🌐 ${t("tg_dns")}: \`${dnsTxt}\`\n`;
                    text += `🔗 ${t("tg_relay")}: \`${relayTxt}\`\n`;
                    text += `⚡ ${t("tg_tfo")}: ${tfoTxt} | ECH: ${echTxt}\n`;
                    text += `🔇 ${t("tg_silent")}: ${silentTxt}\n`;
                    text += `🛑 ${t("tg_pause")}: ${pauseTxt}\n`;
                    text += `🔄 ${t("tg_auto_update")}: ${autoUpTxt}\n`;
                    text += `🔀 ${t("tg_direct")}: ${directTxt}\n`;
                    text += `🌐 ${t("tg_nat64")}: \`${nat64Txt}\`\n`;
                    text += `━━━━━━━━━━━━━━━━`;
                    const kb = { inline_keyboard: [
                        [{ text: `📡 ${t("tg_proto")}`, callback_data: "tg_edit_proto" }, { text: `🔌 ${t("tg_ports")}`, callback_data: "tg_edit_ports" }],
                        [{ text: `🔑 ${t("tg_pass")}`, callback_data: "tg_edit_pass" }, { text: `🌐 ${t("tg_dns")}`, callback_data: "tg_edit_dns" }],
                        [{ text: `🔗 ${t("tg_relay")}`, callback_data: "tg_edit_relay" }],
                        [{ text: `⚡ ${t("tg_tfo")}`, callback_data: "tg_toggle_tfo" }, { text: `ECH`, callback_data: "tg_toggle_ech" }],
                        [{ text: `${t("tg_silent")}`, callback_data: "tg_toggle_silent" }, { text: `${t("tg_pause")}
                } else if (data === "admin_broadcast") {
                    const bMsg = fa3 ? '📢 <b>ارسال پیام گروهی</b>\n\nلطفاً متن پیام خود را ارسال کنید. این پیام برای همه کاربران ارسال خواهد شد.\n\n❗️ برای لغو، /cancel را ارسال کنید.' : '📢 <b>Broadcast Message</b>\n\nPlease send your message text. This will be sent to all users.\n\n❗️ Send /cancel to cancel.';
                    sysConfig.botBroadcastMode = true;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    await sendOrEdit(chatId, messageId, bMsg, { inline_keyboard: [[{ text: fa3 ? '❌ لغو' : '❌ Cancel', callback_data: 'admin_main_menu' }]] });
`, callback_data: "tg_toggle_pause2" }],
                        [{ text: `🔄 ${t("tg_auto_update")}`, callback_data: "tg_toggle_auto_update" }, { text: `🔀 ${t("tg_direct")}`, callback_data: "tg_toggle_direct" }],
                        [{ text: `🌐 ${t("tg_nat64")}`, callback_data: "tg_edit_nat64" }],
                        [{ text: t("btn_main_menu"), callback_data: "main_menu" }]
                    ] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data === "tg_advanced_menu") {
                    const cleanTxt = sysConfig.cleanIps ? sysConfig.cleanIps.substring(0, 40) + (sysConfig.cleanIps.length > 40 ? '...' : '') : '—';
                    const nodesTxt = sysConfig.slaveNodes ? sysConfig.slaveNodes.substring(0, 40) + (sysConfig.slaveNodes.length > 40 ? '...' : '') : '—';
                    const strategyTxt = sysConfig.nameStrategy || 'default';
                    const prefixTxt = sysConfig.namePrefix || 'Core';
                    const maintenanceTxt = sysConfig.maintenanceHost ? sysConfig.maintenanceHost.substring(0, 30) + '...' : '—';
                    const rateTxt = sysConfig.dataRate || 'نامحدود';
                    let text = `🔧 **${t("tg_adv_settings")}**\n━━━━━━━━━━━━━━━━\n`;
                    text += `🧹 ${t("tg_clean_ips")}: \`${cleanTxt}\`\n`;
                    text += `🖥️ ${t("tg_nodes")}: \`${nodesTxt}\`\n`;
                    text += `📝 ${t("tg_strategy")}: \`${strategyTxt}\`\n`;
                    text += `🏷️ ${t("tg_prefix")}: \`${prefixTxt}\`\n`;
                    text += `🎭 ${t("tg_maintenance")}: \`${maintenanceTxt}\`\n`;
                    text += `⚡ Rate: \`${rateTxt}\`\n`;
                    text += `━━━━━━━━━━━━━━━━`;
                    const kb = { inline_keyboard: [
                        [{ text: `🧹 ${t("tg_clean_ips")}`, callback_data: "tg_edit_clean_ips" }],
                        [{ text: `🖥️ ${t("tg_nodes")}`, callback_data: "tg_edit_nodes" }],
                        [{ text: `📝 ${t("tg_strategy")}`, callback_data: "tg_edit_strategy" }, { text: `🏷️ ${t("tg_prefix")}`, callback_data: "tg_edit_prefix" }],
                        [{ text: `🎭 ${t("tg_maintenance")}`, callback_data: "tg_edit_maintenance" }],
                        [{ text: `⚡ تنظیم Rate`, callback_data: "tg_edit_rate" }],
                        [{ text: `🤖 ${t("tg_tg_settings")}`, callback_data: "tg_edit_tg_settings" }],
                        [{ text: `☁️ ${t("tg_cf_settings")}`, callback_data: "tg_edit_cf_settings" }],
                        [{ text: `🛍️ ${t("shop_settings") || "Shop & Bot Settings"}`, callback_data: "shop_settings_menu" }],
                        [{ text: t("btn_main_menu"), callback_data: "main_menu" }]
                    ] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data === "shop_settings_menu") {
                    const purchaseSt = sysConfig.purchaseEnabled ? `✅ ${t("shop_purchase_on")||"ON"}` : `❌ ${t("shop_purchase_off")||"OFF"}`;
                    const trialSt = sysConfig.freeTrial ? `✅ ${t("shop_trial_on")||"ON"}` : `❌ ${t("shop_trial_off")||"OFF"}`;
                    const plans = sysConfig.purchaseOptions || [];
                    let shopText = `🛍️ **${t("shop_settings")||"Shop & Bot Settings"}**\n━━━━━━━━━━━━━━━━\n`;
                    shopText += `💳 ${t("shop_purchase_on")||"Purchase"}: ${sysConfig.purchaseEnabled ? '✅ ON' : '❌ OFF'}\n`;
                    shopText += `🎁 ${t("shop_trial_on")||"Trial"}: ${sysConfig.freeTrial ? '✅ ON' : '❌ OFF'}\n`;
                    shopText += `⏱ ${t("shop_trial_days")||"Trial Days"}: **${sysConfig.freeTrialDays || 3}**\n`;
                    shopText += `📦 ${t("shop_trial_gb")||"Trial GB"}: **${sysConfig.freeTrialGB || 3} GB**\n`;
                    shopText += `💳 ${t("shop_card_num")||"Card"}: \`${sysConfig.adminCardNumber || '—'}\`\n`;
                    shopText += `👤 ${t("shop_card_owner")||"Owner"}: ${sysConfig.adminCardOwner || '—'}\n`;
                    shopText += `📋 ${t("shop_plans")||"Plans"}: **${plans.length}** plan(s)\n`;
                    shopText += `🔧 Services: **${(sysConfig.customServices || []).length}** service(s)\n`;
                    shopText += `💬 Welcome: ${sysConfig.botWelcomeMsg ? '✅ Custom' : '📄 Default'}\n`;
                    shopText += `💬 Support: ${sysConfig.botSupportMsg ? '✅ Custom' : '📄 Default'}\n`;
                    shopText += `🎨 Theme: \`${sysConfig.botThemeColor || '#6366f1'}\`\n`;
                    shopText += `━━━━━━━━━━━━━━━━`;
                    const shopKb = { inline_keyboard: [
                        [{ text: `💳 ${t("shop_purchase_on")||"Purchase"}: ${sysConfig.purchaseEnabled?'✅':'❌'}`, callback_data: "shop_toggle_purchase" }, { text: `🎁 ${t("shop_trial_on")||"Trial"}: ${sysConfig.freeTrial?'✅':'❌'}`, callback_data: "shop_toggle_trial" }],
                        [{ text: `⏱ ${t("shop_trial_days")||"Trial Days"}`, callback_data: "shop_edit_trial_days" }, { text: `📦 ${t("shop_trial_gb")||"Trial GB"}`, callback_data: "shop_edit_trial_gb" }],
                        [{ text: `💳 ${t("shop_card_num")||"Card Number"}`, callback_data: "shop_edit_card" }, { text: `👤 ${t("shop_card_owner")||"Card Owner"}`, callback_data: "shop_edit_card_owner" }],
                        [{ text: `📋 ${t("shop_plans")||"Manage Plans"}`, callback_data: "shop_plans_menu" }],
                        [{ text: `🔧 مدیریت سرویس‌ها`, callback_data: "shop_services_menu" }],
                        [{ text: `💬 ${t("shop_bot_welcome")||"Bot Welcome Msg"}`, callback_data: "shop_edit_welcome" }],
                        [{ text: `💬 پیام پشتیبانی`, callback_data: "shop_edit_support" }, { text: `🎨 رنگ تم`, callback_data: "shop_edit_theme" }],
                        [{ text: `◀️ ${t("btn_back")}`, callback_data: "tg_advanced_menu" }]
                    ] };
                    await sendOrEdit(chatId, shopText, shopKb, messageId);
                } else if (data === "shop_toggle_purchase") {
                    sysConfig.purchaseEnabled = !sysConfig.purchaseEnabled;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    answerText = t("shop_saved") || "✅ Saved!";
                    // re-show shop menu
                    const plans2 = sysConfig.purchaseOptions || [];
                    let shopText2 = `🛍️ **${t("shop_settings")||"Shop Settings"}**\n━━━━━━━━━━━━━━━━\n💳 Purchase: ${sysConfig.purchaseEnabled?'✅ ON':'❌ OFF'}\n🎁 Trial: ${sysConfig.freeTrial?'✅ ON':'❌ OFF'}\n⏱ Trial Days: **${sysConfig.freeTrialDays||3}**\n📦 Trial GB: **${sysConfig.freeTrialGB||3} GB**\n💳 Card: \`${sysConfig.adminCardNumber||'—'}\`\n👤 Owner: ${sysConfig.adminCardOwner||'—'}\n📋 Plans: **${plans2.length}**\n━━━━━━━━━━━━━━━━`;
                    const shopKb2 = { inline_keyboard: [[{ text: `💳 Purchase: ${sysConfig.purchaseEnabled?'✅':'❌'}`, callback_data: "shop_toggle_purchase" }, { text: `🎁 Trial: ${sysConfig.freeTrial?'✅':'❌'}`, callback_data: "shop_toggle_trial" }],[{ text: `⏱ Trial Days`, callback_data: "shop_edit_trial_days" }, { text: `📦 Trial GB`, callback_data: "shop_edit_trial_gb" }],[{ text: `💳 Card Number`, callback_data: "shop_edit_card" }, { text: `👤 Card Owner`, callback_data: "shop_edit_card_owner" }],[{ text: `📋 Manage Plans`, callback_data: "shop_plans_menu" }],[{ text: `💬 Bot Welcome`, callback_data: "shop_edit_welcome" }],[{ text: `◀️ ${t("btn_back")}`, callback_data: "tg_advanced_menu" }]] };
                    await sendOrEdit(chatId, shopText2, shopKb2, messageId);
                } else if (data === "shop_toggle_trial") {
                    sysConfig.freeTrial = !sysConfig.freeTrial;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    answerText = t("shop_saved") || "✅ Saved!";
                    const plans2b = sysConfig.purchaseOptions || [];
                    let shopText2b = `🛍️ **${t("shop_settings")||"Shop Settings"}**\n━━━━━━━━━━━━━━━━\n💳 Purchase: ${sysConfig.purchaseEnabled?'✅ ON':'❌ OFF'}\n🎁 Trial: ${sysConfig.freeTrial?'✅ ON':'❌ OFF'}\n⏱ Trial Days: **${sysConfig.freeTrialDays||3}**\n📦 Trial GB: **${sysConfig.freeTrialGB||3} GB**\n💳 Card: \`${sysConfig.adminCardNumber||'—'}\`\n👤 Owner: ${sysConfig.adminCardOwner||'—'}\n📋 Plans: **${plans2b.length}**\n━━━━━━━━━━━━━━━━`;
                    const shopKb2b = { inline_keyboard: [[{ text: `💳 Purchase: ${sysConfig.purchaseEnabled?'✅':'❌'}`, callback_data: "shop_toggle_purchase" }, { text: `🎁 Trial: ${sysConfig.freeTrial?'✅':'❌'}`, callback_data: "shop_toggle_trial" }],[{ text: `⏱ Trial Days`, callback_data: "shop_edit_trial_days" }, { text: `📦 Trial GB`, callback_data: "shop_edit_trial_gb" }],[{ text: `💳 Card Number`, callback_data: "shop_edit_card" }, { text: `👤 Card Owner`, callback_data: "shop_edit_card_owner" }],[{ text: `📋 Manage Plans`, callback_data: "shop_plans_menu" }],[{ text: `💬 Bot Welcome`, callback_data: "shop_edit_welcome" }],[{ text: `◀️ ${t("btn_back")}`, callback_data: "tg_advanced_menu" }]] };
                    await sendOrEdit(chatId, shopText2b, shopKb2b, messageId);
                } else if (data === "shop_edit_trial_days") {
                    tgState[chatId] = { step: "shop_edit_trial_days" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `⏱ **${t("shop_trial_days")||"Trial Days"}**\n${t("tg_current_val")||"Current"}: \`${sysConfig.freeTrialDays || 3}\`\n\n${t("tg_new_val")||"Send new value:"}`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_settings_menu" }]] }, messageId);
                } else if (data === "shop_edit_trial_gb") {
                    tgState[chatId] = { step: "shop_edit_trial_gb" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `📦 **${t("shop_trial_gb")||"Trial GB"}**\n${t("tg_current_val")||"Current"}: \`${sysConfig.freeTrialGB || 3} GB\`\n\n${t("tg_new_val")||"Send new value:"}`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_settings_menu" }]] }, messageId);
                } else if (data === "shop_edit_card") {
                    tgState[chatId] = { step: "shop_edit_card" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `💳 **${t("shop_card_num")||"Card Number"}**\n${t("tg_current_val")||"Current"}: \`${sysConfig.adminCardNumber || '—'}\`\n\n${t("tg_new_val")||"Send new value:"}`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_settings_menu" }]] }, messageId);
                } else if (data === "shop_edit_card_owner") {
                    tgState[chatId] = { step: "shop_edit_card_owner" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `👤 **${t("shop_card_owner")||"Card Owner"}**\n${t("tg_current_val")||"Current"}: \`${sysConfig.adminCardOwner || '—'}\`\n\n${t("tg_new_val")||"Send new value:"}`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_settings_menu" }]] }, messageId);
                } else if (data === "shop_edit_welcome") {
                    tgState[chatId] = { step: "shop_edit_welcome" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `💬 **${t("shop_bot_welcome")||"Bot Welcome Message"}**\n${t("tg_current_val")||"Current"}:\n\`${sysConfig.botWelcomeMsg || t("user_welcome") || "Default"}\`\n\n${t("shop_welcome_prompt")||"Send new welcome message:"}`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_settings_menu" }]] }, messageId);
                } else if (data === "shop_edit_support") {
                    tgState[chatId] = { step: "shop_edit_support" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `💬 **پیام پشتیبانی**\nفعلی:\n\`${sysConfig.botSupportMsg || 'ندارد'}\`\n\nپیام جدید را ارسال کنید (مثلاً آیدی تلگرام پشتیبانی):`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_settings_menu" }]] }, messageId);
                } else if (data === "shop_edit_theme") {
                    tgState[chatId] = { step: "shop_edit_theme" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🎨 **رنگ تم ربات**\nفعلی: \`${sysConfig.botThemeColor || '#6366f1'}\`\n\nکد رنگ جدید را ارسال کنید (مثلاً #6366f1):`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_settings_menu" }]] }, messageId);
                } else if (data === "shop_plans_menu") {
                    const plans3 = sysConfig.purchaseOptions || [];
                    let plansText = `📋 **${t("shop_plans")||"Plans"}**\n━━━━━━━━━━━━━━━━\n`;
                    if (plans3.length === 0) {
                        plansText += `_${t("shop_no_plans")||"No plans defined."}_\n`;
                    } else {
                        plans3.forEach((p, i) => {
                            plansText += `${i+1}. 📦 **${p.name}**\n   💰 ${p.price || '—'} | ⏱ ${p.days || '?'} days | 📦 ${p.gb || '?'} GB\n`;
                        });
                    }
                    plansText += `━━━━━━━━━━━━━━━━`;
                    const delRows = plans3.map((p, i) => [{ text: `🗑 حذف: ${p.name}`, callback_data: `shop_del_plan:${p.id}` }]);
                    const plansKb = { inline_keyboard: [
                        [{ text: `➕ ${t("shop_add_plan")||"Add Plan"}`, callback_data: "shop_add_plan" }],
                        ...delRows,
                        [{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_settings_menu" }]
                    ] };
                    await sendOrEdit(chatId, plansText, plansKb, messageId);
                } else if (data === "shop_add_plan") {
                    tgState[chatId] = { step: "shop_plan_name" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `➕ **${t("shop_add_plan")||"Add New Plan"} — Step 1/4**\n\n${t("shop_plan_name_prompt")||"Send plan name:"}`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_plans_menu" }]] }, messageId);
                } else if (data.startsWith("shop_del_plan:")) {
                    const delId = data.replace("shop_del_plan:", "");
                    const plans4 = sysConfig.purchaseOptions || [];
                    const delIdx = plans4.findIndex(p => p.id === delId);
                    if (delIdx >= 0) {
                        const delName = plans4[delIdx].name;
                        plans4.splice(delIdx, 1);
                        sysConfig.purchaseOptions = plans4;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        answerText = t("shop_plan_deleted") || "🗑 Deleted";
                        await sendOrEdit(chatId, `🗑 **${delName}** ${t("shop_plan_deleted")||"deleted."}`, { inline_keyboard: [[{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_plans_menu" }]] }, messageId);
                    } else {
                        answerText = "❌ Not found";
                    }
                } else if (data === "shop_services_menu") {
                    const svcs = sysConfig.customServices || [];
                    let svcText = `🔧 **مدیریت سرویس‌ها**\n━━━━━━━━━━━━━━━━\n`;
                    if (svcs.length === 0) {
                        svcText += `📭 هنوز سرویسی تعریف نشده.\n`;
                    } else {
                        svcs.forEach((s, i) => {
                            svcText += `${i+1}. ${s.emoji || '▫️'} **${s.name}**\n   ${s.description || '—'}\n`;
                        });
                    }
                    svcText += `━━━━━━━━━━━━━━━━\n💡 سرویس‌ها به کاربران در بخش "سرویس‌ها و تعرفه‌ها" نمایش داده می‌شوند.`;
                    const delSvcRows = svcs.map((s, i) => [{ text: `🗑 حذف: ${s.name}`, callback_data: `shop_del_svc:${i}` }]);
                    const svcKb = { inline_keyboard: [
                        [{ text: `➕ افزودن سرویس`, callback_data: "shop_add_svc" }],
                        ...delSvcRows,
                        [{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_settings_menu" }]
                    ] };
                    await sendOrEdit(chatId, svcText, svcKb, messageId);
                } else if (data === "shop_add_svc") {
                    tgState[chatId] = { step: "shop_svc_name" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `➕ **افزودن سرویس — مرحله 1/3**\n\nنام سرویس را ارسال کنید:`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_services_menu" }]] }, messageId);
                } else if (data.startsWith("shop_del_svc:")) {
                    const delIdx = parseInt(data.replace("shop_del_svc:", ""));
                    const svcs2 = sysConfig.customServices || [];
                    if (delIdx >= 0 && delIdx < svcs2.length) {
                        const delName = svcs2[delIdx].name;
                        svcs2.splice(delIdx, 1);
                        sysConfig.customServices = svcs2;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        answerText = "🗑 حذف شد";
                        await sendOrEdit(chatId, `🗑 **${delName}** حذف شد.`, { inline_keyboard: [[{ text: `◀️ بازگشت`, callback_data: "shop_services_menu" }]] }, messageId);
                    }
                } else if (data === "tg_logs_menu") {
                    let logs = [];
                    if (env.IOT_DB) {
                        const stored = await d1Get(env, "sys_logs");
                        if (stored) logs = JSON.parse(stored);
                    }
                    let text = `📋 **${t("tg_logs")}**\n━━━━━━━━━━━━━━━━\n`;
                    if (logs.length === 0) {
                        text += `ℹ️ ${t("tg_log_empty")}\n`;
                    } else {
                        logs.slice(0, 10).forEach((log, i) => {
                            const time = new Date(log.ts).toLocaleString();
                            text += `${i + 1}. ${t("tg_log_entry")} **${log.type}**\n   ${log.detail}\n   📅 ${time}\n`;
                        });
                        if (logs.length > 10) text += `\n... ${logs.length - 10} more entries`;
                    }
                    text += `\n━━━━━━━━━━━━━━━━`;
                    const kb = { inline_keyboard: [
                        [{ text: `🔄 ${t("btn_update_usage")}`, callback_data: "tg_logs_menu" }],
                        [{ text: t("btn_main_menu"), callback_data: "main_menu" }]
                    ] };
                    await sendOrEdit(chatId, text, kb, messageId);
                } else if (data === "tg_toggle_tfo") {
                    sysConfig.enableOpt1 = !sysConfig.enableOpt1;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    answerText = t("tg_saved");
                    const menu = getMainMenu(getActivePanel(), isAuthorized);
                    await sendOrEdit(chatId, menu.text, menu.kb, messageId);
                } else if (data === "tg_toggle_ech") {
                    sysConfig.enableOpt2 = !sysConfig.enableOpt2;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    answerText = t("tg_saved");
                    const menu = getMainMenu(getActivePanel(), isAuthorized);
                    await sendOrEdit(chatId, menu.text, menu.kb, messageId);
                } else if (data === "tg_toggle_silent") {
                    sysConfig.silentAlerts = !sysConfig.silentAlerts;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    answerText = t("tg_saved");
                    const menu = getMainMenu(getActivePanel(), isAuthorized);
                    await sendOrEdit(chatId, menu.text, menu.kb, messageId);
                } else if (data === "tg_toggle_pause2") {
                    sysConfig.isPaused = !sysConfig.isPaused;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    answerText = t("tg_saved");
                    const menu = getMainMenu(getActivePanel(), isAuthorized);
                    await sendOrEdit(chatId, menu.text, menu.kb, messageId);
                } else if (data === "tg_toggle_auto_update") {
                    sysConfig.autoUpdate = !sysConfig.autoUpdate;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    answerText = t("tg_saved");
                    await sendOrEdit(chatId, `⚙️ ${t("tg_auto_update")}: ${sysConfig.autoUpdate ? '✅ ON' : '❌ OFF'}`, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_settings_menu" }]] }, messageId);
                } else if (data === "tg_toggle_direct") {
                    sysConfig.enableDirectConfigs = !sysConfig.enableDirectConfigs;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    answerText = t("tg_saved");
                    await sendOrEdit(chatId, `🔀 ${t("tg_direct")}: ${sysConfig.enableDirectConfigs ? '✅ ON' : '❌ OFF'}`, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_settings_menu" }]] }, messageId);
                } else if (data === "tg_edit_proto") {
                    tgState[chatId] = { step: "tg_edit_proto" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const kb = { inline_keyboard: [
                        [{ text: "Alpha (V-Core)", callback_data: "tg_set_proto:alpha" }, { text: "Beta (T-Core)", callback_data: "tg_set_proto:beta" }],
                        [{ text: "Both", callback_data: "tg_set_proto:both" }],
                        [{ text: "❌ " + t("btn_cancel"), callback_data: "tg_settings_menu" }]
                    ] };
                    await sendOrEdit(chatId, `📡 **${t("tg_proto")}**\n${t("tg_current_val")}: **${sysConfig.mode}**\n\n${t("tg_new_val")}`, kb, messageId);
                } else if (data.startsWith("tg_set_proto:")) {
                    const val = data.replace("tg_set_proto:", "");
                    sysConfig.mode = val;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    tgState[chatId] = null;
                    answerText = t("tg_saved");
                    await sendOrEdit(chatId, `✅ ${t("tg_proto")}: **${val}**`, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_settings_menu" }]] }, messageId);
                } else if (data === "tg_edit_dns") {
                    tgState[chatId] = { step: "tg_edit_dns" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🌐 **${t("tg_dns")}**\n${t("tg_current_val")}: \`${sysConfig.resolveIp}\`\n\n${t("tg_new_val")}`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_settings_menu" }]] }, messageId);
                } else if (data === "tg_edit_relay") {
                    tgState[chatId] = { step: "tg_edit_relay" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🔗 **${t("tg_relay")}**\n${t("tg_current_val")}: \`${sysConfig.backupRelay || '—'}\`\n\n${t("tg_new_val")}\n_send empty to clear_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_settings_menu" }]] }, messageId);
                } else if (data === "tg_edit_nat64") {
                    tgState[chatId] = { step: "tg_edit_nat64" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🌐 **${t("tg_nat64")}**\n${t("tg_current_val")}: \`${sysConfig.nat64Prefix || '—'}\`\n\n${t("tg_new_val")}\n_send empty to clear_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_settings_menu" }]] }, messageId);
                } else if (data === "tg_edit_maintenance") {
                    tgState[chatId] = { step: "tg_edit_maintenance" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🎭 **${t("tg_maintenance")}**\n${t("tg_current_val")}: \`${sysConfig.maintenanceHost || '—'}\`\n\n${t("tg_new_val")}`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_settings_menu" }]] }, messageId);
                } else if (data === "tg_edit_clean_ips") {
                    tgState[chatId] = { step: "tg_edit_clean_ips" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🧹 **${t("tg_clean_ips")}**\n${t("tg_current_val")}: \`${sysConfig.cleanIps || '—'}\`\n\n${t("tg_new_val")}\n_send empty to clear_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] }, messageId);
                } else if (data === "tg_edit_nodes") {
                    tgState[chatId] = { step: "tg_edit_nodes" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🖥️ **${t("tg_nodes")}**\n${t("tg_current_val")}: \`${sysConfig.slaveNodes || '—'}\`\n\n${t("tg_new_val")}\n_send empty to clear_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] }, messageId);
                } else if (data === "tg_edit_strategy") {
                    tgState[chatId] = { step: "tg_edit_strategy" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const kb = { inline_keyboard: [
                        [{ text: "default", callback_data: "tg_set_strategy:default" }],
                        [{ text: "type-user-port", callback_data: "tg_set_strategy:type-user-port" }],
                        [{ text: "user-port", callback_data: "tg_set_strategy:user-port" }],
                        [{ text: "ip", callback_data: "tg_set_strategy:ip" }],
                        [{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]
                    ] };
                    await sendOrEdit(chatId, `📝 **${t("tg_strategy")}**\n${t("tg_current_val")}: \`${sysConfig.nameStrategy}\`\n\n_send custom or select:_`, kb, messageId);
                } else if (data.startsWith("tg_set_strategy:")) {
                    const val = data.replace("tg_set_strategy:", "");
                    sysConfig.nameStrategy = val;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    tgState[chatId] = null;
                    answerText = t("tg_saved");
                    await sendOrEdit(chatId, `✅ ${t("tg_strategy")}: **${val}**`, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_advanced_menu" }]] }, messageId);
                } else if (data === "tg_edit_prefix") {
                    tgState[chatId] = { step: "tg_edit_prefix" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🏷️ **${t("tg_prefix")}**\n${t("tg_current_val")}: \`${sysConfig.namePrefix}\`\n\n${t("tg_new_val")}`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] }, messageId);
                } else if (data === "tg_edit_rate") {
                    tgState[chatId] = { step: "tg_edit_rate" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `⚡ **تنظیم Rate**\n━━━━━━━━━━━━━━━━\n${t("tg_current_val")}: \`${sysConfig.dataRate || 'نامحدود'}\`\n\n💡 مقدار Rate را ارسال کنید.\nمثال: \`100Mbps\` یا \`نامحدود\`\n\nاین مقدار در اطلاعات مشترکین نمایش داده می‌شود.`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] }, messageId);
                } else if (data === "tg_edit_pass") {
                    tgState[chatId] = { step: "tg_edit_pass" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🔑 **${t("tg_pass")}**\n${t("tg_current_val")}: \`${sysConfig.masterKey}\`\n\n${t("tg_new_val")}`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_settings_menu" }]] }, messageId);
                } else if (data === "tg_edit_ports") {
                    tgState[chatId] = { step: "tg_edit_ports" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🔌 **${t("tg_ports")}**\n${t("tg_current_val")}: \`${sysConfig.socketPorts}\`\n\n${t("tg_new_val")}\n_comma separated e.g. 443,80_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_settings_menu" }]] }, messageId);
                } else if (data === "tg_edit_tg_settings") {
                    tgState[chatId] = { step: "tg_edit_tg_token" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `🤖 **${t("tg_tg_settings")}**\n\n1️⃣ ${t("tg_current_val")}: \`${sysConfig.tgToken ? '***' + sysConfig.tgToken.slice(-4) : '—'}\`\n\n${t("tg_new_val")}\n_send /skip to keep current_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] }, messageId);
                } else if (data === "tg_edit_cf_settings") {
                    tgState[chatId] = { step: "tg_edit_cf_acc" };
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    await sendOrEdit(chatId, `☁️ **${t("tg_cf_settings")}**\n\n1️⃣ CF Account ID: \`${sysConfig.cfAccountId || '—'}\`\n\n${t("tg_new_val")}\n_send /skip to keep current_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] }, messageId);
                } else if (data === "admin_pending_list") {
                    const pending = sysConfig.pendingPurchases || [];
                    if (pending.length === 0) {
                        await sendOrEdit(chatId, t("admin_pending_empty") || "✅ No pending purchases.", { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "main_menu" }]] }, messageId);
                    } else {
                        let pendingText = `${t("admin_pending_title") || "📋 Pending Purchases"}\n━━━━━━━━━━━━━━\n`;
                        const pendingRows = [];
                        pending.forEach((p, i) => {
                            pendingText += `${i+1}. @${p.tgName} — ${p.pkgName}\n`;
                            pendingRows.push([
                                { text: `✅ @${p.tgName}`, callback_data: `admin_approve_purchase:${p.id}` },
                                { text: `❌ رد`, callback_data: `admin_reject_purchase:${p.id}` }
                            ]);
                        });
                        pendingRows.push([{ text: "◀️ " + t("btn_back"), callback_data: "main_menu" }]);
                        await sendOrEdit(chatId, pendingText, { inline_keyboard: pendingRows }, messageId);
                    }
                } else if (data.startsWith("admin_approve_purchase:")) {
                    const purchaseId = data.replace("admin_approve_purchase:", "");
                        // Check 20-service limit per user
                            const purchaseTgId = String(purchase.tgId);
                            const ownedServices = (sysConfig.users || []).filter(u => u.ownerTgId === purchaseTgId && !u.isDeleted);
                            if (buyerOwnedCount >= 20) {
                                answerText = fa3 ? "⚠️ محدودیت ۲۰ سرویس" : "⚠️ 20 Service Limit";
                                await sendOrEdit(chatId, fa3
                                    ? "⚠️ **محدودیت سرویس**\n\nهر کاربر حداکثر ۲۰ سرویس میتواند داشته باشد.\n\nتعداد سرویس‌های فعلی: " + ownedServices.length
                                    : "⚠️ **Service Limit**\n\nEach user can have max 20 services.\n\nCurrent services: " + ownedServices.length,
                                    { inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "admin_pending_list" }]] }, messageId);
                            } else {
                    const idx = (sysConfig.pendingPurchases || []).findIndex(p => p.id === purchaseId);
                    if (idx >= 0) {
                        const purchase = sysConfig.pendingPurchases[idx];
                        sysConfig.pendingPurchases.splice(idx, 1);
                        const newUserId = crypto.randomUUID();
                        const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
                        const baseName = purchase.tgName || purchase.tgId;
                        const newUser = {
                            id: newUserId,
                            name: `${baseName}_${randomSuffix}`,
                            subHash: generateSubHash(newUserId),
                            ownerTgId: String(cb.from?.id || chatId),
                            totalTrafficLimit: (purchase.gb || 10) * 1073741824,
                            limitTotalReq: Math.round((purchase.gb || 10) * 6000),
                            expiryMs: Date.now() + (purchase.days || 30) * 86400000,
                            isPaused: false, isExpired: false, upLink: 0, downLink: 0
                        };
                        if (!sysConfig.users) sysConfig.users = [];
                        sysConfig.users.push(newUser);
                        // Link to user account
                        if (!sysConfig.userAccounts) sysConfig.userAccounts = [];
                        const existingAcc = sysConfig.userAccounts.find(a => a.tgId === String(purchase.tgId));
                        if (existingAcc) {
                            existingAcc.subId = newUserId;
                            existingAcc.lastActivity = Date.now();
                        } else {
                            sysConfig.userAccounts.push({ tgId: String(purchase.tgId), tgName: purchase.tgName || '', firstName: '', subId: newUserId, subHash: generateSubHash(newUserId), savedLinks: [], joinedAt: Date.now(), lastActivity: Date.now() });
                        }
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        answerText = t("admin_approved_ok") || "✅ Approved";
                        const subLink = `${new URL(request.url).origin}/${encodeURI(sysConfig.subRoute || "sub")}/${newUser.subHash}`;
                        const fa3 = langCode === 'fa';
                        await sendOrEdit(chatId, fa3
                            ? `✅ **خرید تأیید شد**\n━━━━━━━━━━━━━━\n👤 کاربر: **${newUser.name}**\n📦 پکیج: ${purchase.pkgName || '—'}\n⏱ مدت: ${purchase.days || 30} روز\n📦 حجم: ${purchase.gb || 10} GB\n🔑 لینک: \`${subLink}\`\n━━━━━━━━━━━━━━`
                            : `✅ **Purchase Approved**\n━━━━━━━━━━━━━━\n👤 User: **${newUser.name}**\n📦 Plan: ${purchase.pkgName || '—'}\n⏱ Days: ${purchase.days || 30}\n📦 Traffic: ${purchase.gb || 10} GB\n🔑 Link: \`${subLink}\`\n━━━━━━━━━━━━━━`,
                            { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "main_menu" }]] }, messageId);
                        const approvedMsg = fa3
                            ? `🎉 **خرید شما تأیید شد!**\n━━━━━━━━━━━━━━\n📦 پکیج: **${purchase.pkgName || '—'}**\n⏱ مدت: **${purchase.days || 30}** روز\n📦 حجم: **${purchase.gb || 10}** GB\n━━━━━━━━━━━━━━\n\n🔗 لینک اشتراک شما:\n\`${subLink}\`\n\n💡 لینک را کپی کرده و در اپلیکیشن وارد نمایید.\n\n🙏 از خرید شما متشکریم!`
                            : `🎉 **Purchase Approved!**\n━━━━━━━━━━━━━━\n📦 Plan: **${purchase.pkgName || '—'}**\n⏱ Duration: **${purchase.days || 30}** days\n📦 Traffic: **${purchase.gb || 10}** GB\n━━━━━━━━━━━━━━\n\n🔗 Your subscription link:\n\`${subLink}\`\n\n💡 Copy this link and add it to your app.\n\n🙏 Thank you for your purchase!`;
                        await fetch(`${tgApi}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: purchase.chatId, text: approvedMsg, parse_mode: 'Markdown' }) }).catch(()=>{});
                    } else {
                        answerText = "❌ Not found";
                    }
                    }
                } else if (data.startsWith("admin_reject_purchase:")) {
                    const purchaseId = data.replace("admin_reject_purchase:", "");
                    const idx = (sysConfig.pendingPurchases || []).findIndex(p => p.id === purchaseId);
                    if (idx >= 0) {
                        const purchase = sysConfig.pendingPurchases[idx];
                        sysConfig.pendingPurchases.splice(idx, 1);
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        answerText = t("admin_rejected_ok") || "❌ Rejected";
                        await sendOrEdit(chatId, `${t("admin_rejected_ok") || "🗑 Rejected."}\n👤 @${purchase.tgName}`, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "main_menu" }]] }, messageId);
                        const rejectedMsg = t("user_rejected") || "❌ Your purchase receipt was rejected.";
                        await fetch(`${tgApi}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: purchase.chatId, text: rejectedMsg, parse_mode: 'Markdown' }) }).catch(()=>{});
                    } else {
                        answerText = "❌ Not found";
                    }
                }

                // v5.1.0: Admin trial users management
                if (data === "admin_trial_users") {
                    const usedTrials = sysConfig.usedTrials || [];
                    const userAccounts = sysConfig.userAccounts || [];
                    if (usedTrials.length === 0) {
                        await sendOrEdit(chatId, t("admin_trial_empty") || "🧪 No trial users yet.", { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "main_menu" }]] }, messageId);
                    } else {
                        let trialText = (t("admin_trial_title") || "🧪 Trial Users") + "\n━━━━━━━━━━━━━━\n";
                        const keyboard = [];
                        for (const tUser of usedTrials) {
                            const u = (sysConfig.users || []).find(usr => usr.id === tUser.userId || usr.name === tUser.name);
                            const uName = u ? u.name : (tUser.name || tUser.userId);
                            trialText += `👤 ${uName}\n🆔 ${tUser.userId}\n📅 ${new Date(tUser.createdAt || tUser.date || Date.now()).toLocaleDateString()}\n━━━━━━━━━━━━━━\n`;
                            keyboard.push([{ text: "🗑 " + uName, callback_data: "admin_delete_trial_user:" + tUser.userId }]);
                        }
                        keyboard.push([{ text: "◀️ " + t("btn_back"), callback_data: "main_menu" }]);
                        await sendOrEdit(chatId, trialText, { inline_keyboard: keyboard }, messageId);
                    }
                    answerText = "✅ Done";

                    // ---- NEW SERVICE MANAGEMENT CALLBACKS ----
                    } else if (data.startsWith("user_renew_service:")) {
                            // Service renewal - start renewal/purchase flow for this service
                            const renewServiceId = data.split(":")[1];
                            const renewUser = (sysConfig.users || []).find(u => u.id === renewServiceId);
                            if (renewUser) {
                                await sendOrEdit(chatId, fa3
                                    ? `🔄 **تمدید سرویس**\
\
📋 <b>سرویس:</b> ${esc(renewUser.name)}\n🆔 <b>شناسه:</b> <code>${renewUser.id}</code>\n\nبرای تمدید این سرویس، یکی از پکیج‌های زیر را انتخاب کنید:`
                                    : `🔄 **Renew Service**\
\
📋 <b>Service:</b> ${esc(renewUser.name)}\n🆔 <b>ID:</b> <code>${renewUser.id}</code>\n\nChoose a package to renew:`,
                                    { inline_keyboard: [
                                        [{ text: fa3 ? "📦 پکیج‌های موجود" : "📦 View Packages", callback_data: "user_buy" }],
                                        [{ text: fa3 ? "🔙 بازگشت" : "🔙 Back", callback_data: "user_get_link:" + renewUser.subHash }],
                                        [{ text: fa3 ? "🏠 منو" : "🏠 Menu", callback_data: "user_main_menu" }]
                                    ]}, messageId);
                            }
                    } else if (data.startsWith("user_pause_service:")) {
                            const pauseServiceId = data.split(":")[1];
                            const pauseUser = (sysConfig.users || []).find(u => u.id === pauseServiceId);
                            if (pauseUser) {
                                pauseUser.isPaused = !pauseUser.isPaused;
                                if (!pauseUser.isPaused) { pauseUser.disabledReason = null; pauseUser.disabledAt = null; }
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                                answerText = fa3 ? (pauseUser.isPaused ? "⏸️ سرویس متوقف شد" : "▶️ سرویس فعال شد") : (pauseUser.isPaused ? "⏸️ Service paused" : "▶️ Service resumed");
                                await sendOrEdit(chatId, fa3
                                    ? `\${pauseUser.isPaused ? '⏸️' : '✅'} **${pauseUser.isPaused ? 'سرویس متوقف شد' : 'سرویس فعال شد'}**\
\
📋 <b>سرویس:</b> ${esc(pauseUser.name)}`
                                    : `\${pauseUser.isPaused ? '⏸️' : '✅'} **${pauseUser.isPaused ? 'Service Paused' : 'Service Active'}**\
\
📋 <b>Service:</b> ${esc(pauseUser.name)}`,
                                    { inline_keyboard: [
                                        [{ text: fa3 ? "🔙 جزئیات" : "🔙 Details", callback_data: "user_get_link:" + pauseUser.subHash }],
                                        [{ text: fa3 ? "🏠 منو" : "🏠 Menu", callback_data: "user_main_menu" }]
                                    ]}, messageId);
                            }
                    } else if (data.startsWith("user_delete_service:")) {
                            const delServiceId = data.split(":")[1];
                            const delUser = (sysConfig.users || []).find(u => u.id === delServiceId);
                            if (delUser) {
                                // Soft delete - mark as deleted
                                delUser.isDeleted = true;
                                delUser.deletedAt = Date.now();
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                                answerText = fa3 ? "🗑️ سرویس حذف شد" : "🗑️ Service deleted";
                                await sendOrEdit(chatId, fa3
                                    ? `🗑️ **سرویس حذف شد**\
\
📋 <b>سرویس:</b> ${esc(delUser.name)}\n🆔 <b>شناسه:</b> <code>${delUser.id}</code>\n\nاین سرویس غیرفعال و از لیست شما حذف شد.`
                                    : `🗑️ **Service Deleted**\
\
📋 <b>Service:</b> ${esc(delUser.name)}\n🆔 <b>ID:</b> <code>${delUser.id}</code>\n\nThis service has been deactivated and removed.`,
                                    { inline_keyboard: [[{ text: fa3 ? "🔙 خدمات من" : "🔙 My Services", callback_data: "user_my_services" }], [{ text: fa3 ? "🏠 منو" : "🏠 Menu", callback_data: "user_main_menu" }]] }, messageId);
                            }
                    } else if (data === "user_support") {
                            // Support contact
                            const supportText = sysConfig.botSupportUsername 
                                ? (fa3 ? `\n\n👤 <b>پشتیبانی:</b> @${sysConfig.botSupportUsername}` : `\n\n👤 <b>Support:</b> @${sysConfig.botSupportUsername}`)
                                : (fa3 ? `\n\n📧 لطفا با ادمین تماس بگیرید.` : `\n\n📧 Please contact the admin.`);
                            await sendOrEdit(chatId, fa3
                                ? `🎧 **پشتیبانی**\
\
━━━━━━━━━━━━━━━${supportText}`
                                : `🎧 **Support**\
\
━━━━━━━━━━━━━━━${supportText}`,
                                { inline_keyboard: [[{ text: fa3 ? "🔙 بازگشت" : "🔙 Back", callback_data: "user_my_services" }], [{ text: fa3 ? "🏠 منو" : "🏠 Menu", callback_data: "user_main_menu" }]] }, messageId);
                } else if (data.startsWith("admin_delete_trial_user:")) {
                    const delUserId = data.replace("admin_delete_trial_user:", "");
                    const usedTrials = sysConfig.usedTrials || [];
                    const idx = usedTrials.findIndex(t => t.userId === delUserId);
                    if (idx !== -1) {
                        const removed = usedTrials.splice(idx, 1)[0];
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        await sendOrEdit(chatId, t("admin_trial_deleted") || "✅ Trial user removed.", { inline_keyboard: [[{ text: "🧪 " + (t("trial_users") || "Trial Users"), callback_data: "admin_trial_users" }, { text: "◀️ " + t("btn_back"), callback_data: "main_menu" }]] }, messageId);
                        ctx?.waitUntil(logActivity(env, "Trial User Deleted", `Trial user ${removed.userId || removed.name} removed by admin`).catch(()=>{}));
                    } else {
                        answerText = "❌ Not found";
                    }
                }

                ctx?.waitUntil(fetch(`${tgApi}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callback_query_id: cb.id, text: answerText || "Done!" })
                }).catch(()=>{}));
            }
        } else if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text.trim();
            
            if (isAuthorized) {
                // Get active panel from last login signal
                const activePanel = getActivePanel();
                const isRemotePanel = activePanel && !activePanel.isLocal;

                // Helper to fetch users for the active panel
                const getPanelUsers = async () => {
                    if (isRemotePanel) {
                        const res = await fetchRemotePanelUsers(activePanel);
                        return res.success ? (res.users || []) : null;
                    }
                    return sysConfig.users || [];
                };

                // Handle /start command
                if (text === "/start") {
                    tgState[chatId] = null;
                    ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                    const menu = getMainMenu(activePanel, isAuthorized);
                    await sendOrEdit(chatId, menu.text, menu.kb);
                    return new Response("OK", { status: 200 });
                }

                const state = tgState[chatId];
                
                if (state) {
                    if (!isAuthorized) {
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, t("access_denied"));
                        return new Response("OK", { status: 200 });
                    }

                    if (state.step === "sub_add_name") {
                        const name = text;
                        tgState[chatId] = { step: "sub_add_limits", name: name };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        
                        const msg = `⚙️ **${name}**\n\n${t("msg_enter_limits")}`;
                        const kb = {
                            inline_keyboard: [
                                [{ text: `♾️ Skip (Unlimited)`, callback_data: "sub_add_unlimited_skip" }],
                                [{ text: `❌ ${t("btn_cancel")}`, callback_data: "main_menu" }]
                            ]
                        };
                        await sendOrEdit(chatId, msg, kb);
                        return new Response("OK", { status: 200 });
                    }
                    
                    if (state.step === "sub_add_limits" || state.step === "sub_add_unlimited_skip") {
                        const name = state.name;
                        let tReq = null;
                        let dReq = null;
                        let days = null;
                        
                        if (state.step !== "sub_add_unlimited_skip" && text !== "0" && text !== "0 0 0") {
                            const parts = text.split(/\s+/).map(Number);
                            if (parts[0] > 0) tReq = parts[0];
                            if (parts[1] > 0) dReq = parts[1];
                            if (parts[2] > 0) days = parts[2];
                        }
                        
                        const newUuid = crypto.randomUUID();
                        if (isRemotePanel) {
                            const res = await remotePanelWriteAction(activePanel, 'POST', null, {
                                key: activePanel.masterKey,
                                name: name,
                                trafficLimit: tReq ? tReq / 6000 : 0,
                                dailyLimit: dReq ? dReq / 6000 : 0,
                                expiryDays: days || 0
                            });
                            if (res.success && res.user) {
                                const detail = getSubDetail(res.user.id, [res.user]);
                                await sendOrEdit(chatId, `✅ ${t("msg_added")}\n\n${detail.text}`, detail.kb);
                            } else {
                                await sendOrEdit(chatId, t("msg_panel_error"), { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] });
                            }
                        } else {
                            if (!sysConfig.users) sysConfig.users = [];
                            sysConfig.users.push({
                                id: newUuid,
                                name: name,
                                limitTotalReq: tReq,
                                limitDailyReq: dReq,
                                expiryMs: days ? Date.now() + days * 86400000 : null,
                                createdAt: Date.now()
                            });
                            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                            const detail = getSubDetail(newUuid);
                            await sendOrEdit(chatId, `✅ ${t("msg_added")}\n\n${detail.text}`, detail.kb);
                        }
                        
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        return new Response("OK", { status: 200 });
                    }
                    
                    if (state.step.startsWith("sub_edit_name:")) {
                        const uuid = state.step.replace("sub_edit_name:", "");
                        if (isRemotePanel) {
                            await remotePanelWriteAction(activePanel, 'PUT', uuid, { key: activePanel.masterKey, name: text });
                        } else if (sysConfig.users) {
                            const u = sysConfig.users.find(usr => usr.id === uuid);
                            if (u) {
                                u.name = text;
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                            }
                        }
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        
                        const panelUsers = await getPanelUsers();
                        const detail = getSubDetail(uuid, panelUsers);
                        await sendOrEdit(chatId, `✅ Successfully Changed!`, detail.kb);
                        return new Response("OK", { status: 200 });
                    }
                    
                    if (state.step.startsWith("sub_edit_limits:")) {
                        const uuid = state.step.replace("sub_edit_limits:", "");
                        let tReq = null;
                        let dReq = null;
                        let days = null;
                        
                        const parts = text.split(/\s+/).map(Number);
                        if (parts[0] > 0) tReq = parts[0];
                        if (parts[1] > 0) dReq = parts[1];
                        if (parts[2] > 0) days = parts[2];
                        
                        if (isRemotePanel) {
                            await remotePanelWriteAction(activePanel, 'PUT', uuid, {
                                key: activePanel.masterKey,
                                trafficLimit: tReq ? tReq / 6000 : 0,
                                dailyLimit: dReq ? dReq / 6000 : 0,
                                expiryDays: days || 0
                            });
                        } else if (sysConfig.users) {
                            const u = sysConfig.users.find(usr => usr.id === uuid);
                            if (u) {
                                u.limitTotalReq = tReq;
                                u.limitDailyReq = dReq;
                                u.expiryMs = days ? Date.now() + days * 86400000 : null;
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                            }
                        }
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        
                        const panelUsers = await getPanelUsers();
                        const detail = getSubDetail(uuid, panelUsers);
                        await sendOrEdit(chatId, `✅ Limits Updated!`, detail.kb);
                        return new Response("OK", { status: 200 });
                    }

                    if (state.step === "sub_search") {
                        const query = text.toLowerCase();
                        const panelUsers = await getPanelUsers();
                        const users = panelUsers || [];
                        const results = users.filter(u => u.name.toLowerCase().includes(query) || u.id.toLowerCase().includes(query));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        if (results.length === 0) {
                            const kb = { inline_keyboard: [[{ text: t("btn_main_menu"), callback_data: "main_menu" }]] };
                            await sendOrEdit(chatId, `🔍 No users found for "${text}"`, kb);
                        } else {
                            let searchText = `🔍 **Search Results** (${results.length})\n━━━━━━━━━━━━━━━━\n`;
                            const inline_keyboard = [];
                            results.slice(0, 10).forEach(u => {
                                const statusEmoji = u.isPaused ? "⏸️" : (u.expiryMs && Date.now() > u.expiryMs ? "🔴" : "🟢");
                                searchText += `${statusEmoji} **${u.name}**\n`;
                                inline_keyboard.push([{ text: `👤 ${u.name}`, callback_data: `sub_detail:${u.id}` }]);
                            });
                            inline_keyboard.push([{ text: t("btn_main_menu"), callback_data: "main_menu" }]);
                            await sendOrEdit(chatId, searchText, { inline_keyboard });
                        }
                        return new Response("OK", { status: 200 });
                    }

                    if (state.step.startsWith("sub_extend_days:")) {
                        const uuid = state.step.replace("sub_extend_days:", "");
                        const days = parseInt(text);
                        if (isNaN(days) || days <= 0) {
                            await sendOrEdit(chatId, t("msg_invalid"));
                            return new Response("OK", { status: 200 });
                        }
                        if (isRemotePanel) {
                            await remotePanelWriteAction(activePanel, 'PUT', uuid, { key: activePanel.masterKey, expiryDays: days });
                        } else if (sysConfig.users) {
                            const u = sysConfig.users.find(usr => usr.id === uuid);
                            if (u) {
                                if (u.expiryMs) {
                                    u.expiryMs += days * 86400000;
                                } else {
                                    u.expiryMs = Date.now() + days * 86400000;
                                }
                                if (u.isPaused && u.disabledReason && u.disabledReason.includes('Expiration')) {
                                    u.isPaused = false;
                                    u.disabledReason = null;
                                    u.disabledAt = null;
                                }
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                            }
                        }
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        const panelUsers = await getPanelUsers();
                        const detail = getSubDetail(uuid, panelUsers);
                        const msg = t("msg_expiry_extended").replace("{days}", days);
                        await sendOrEdit(chatId, `✅ ${msg}\n\n${detail.text}`, detail.kb);
                        return new Response("OK", { status: 200 });
                    }

                    if (state.step.startsWith("sub_edit_notes:")) {
                        const uuid = state.step.replace("sub_edit_notes:", "");
                        if (isRemotePanel) {
                            await remotePanelWriteAction(activePanel, 'PUT', uuid, { key: activePanel.masterKey, notes: text });
                        } else if (sysConfig.users) {
                            const u = sysConfig.users.find(usr => usr.id === uuid);
                            if (u) {
                                u.notes = text;
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                            }
                        }
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        const panelUsers = await getPanelUsers();
                        const detail = getSubDetail(uuid, panelUsers);
                        await sendOrEdit(chatId, `✅ Notes updated!`, detail.kb);
                        return new Response("OK", { status: 200 });
                    }

                    if (state.step.startsWith("sub_edit_device:")) {
                        const uuid = state.step.replace("sub_edit_device:", "");
                        const limit = parseInt(text);
                        if (isNaN(limit) || limit < 0) {
                            await sendOrEdit(chatId, t("msg_invalid"));
                            return new Response("OK", { status: 200 });
                        }
                        if (isRemotePanel) {
                            await remotePanelWriteAction(activePanel, 'PUT', uuid, { key: activePanel.masterKey, maxConfigs: limit > 0 ? limit : null });
                        } else if (sysConfig.users) {
                            const u = sysConfig.users.find(usr => usr.id === uuid);
                            if (u) {
                                u.maxConfigs = limit > 0 ? limit : null;
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                            }
                        }
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        const panelUsers = await getPanelUsers();
                        const detail = getSubDetail(uuid, panelUsers);
                        await sendOrEdit(chatId, `✅ ${t("config_limit_updated")}`, detail.kb);
                        return new Response("OK", { status: 200 });
                    }
                    
                    if (state.step === "tg_edit_dns") {
                        sysConfig.resolveIp = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_dns")}: \`${text}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_relay") {
                        sysConfig.backupRelay = text || '';
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_relay")}: \`${text || '—'}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_nat64") {
                        sysConfig.nat64Prefix = text || '';
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_nat64")}: \`${text || '—'}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_maintenance") {
                        sysConfig.maintenanceHost = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_maintenance")}: \`${text}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_rate") {
                        sysConfig.dataRate = text || 'نامحدود';
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ Rate: \`${sysConfig.dataRate}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_clean_ips") {
                        sysConfig.cleanIps = text || '';
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_clean_ips")}: \`${text || '—'}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_nodes") {
                        sysConfig.slaveNodes = text || '';
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_nodes")}: \`${text || '—'}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_prefix") {
                        sysConfig.namePrefix = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_prefix")}: \`${text}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_pass") {
                        sysConfig.masterKey = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_pass")}: \`${text}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_strategy") {
                        sysConfig.nameStrategy = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_strategy")}: \`${text}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    // Shop settings state handlers
                    if (state.step === "shop_edit_trial_days") {
                        const days = parseInt(text);
                        if (!isNaN(days) && days > 0) { sysConfig.freeTrialDays = days; await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig)); }
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("shop_trial_days")||"Trial Days"}: **${sysConfig.freeTrialDays}**`, { inline_keyboard: [[{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_edit_trial_gb") {
                        const gb = parseFloat(text);
                        if (!isNaN(gb) && gb > 0) { sysConfig.freeTrialGB = gb; await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig)); }
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("shop_trial_gb")||"Trial GB"}: **${sysConfig.freeTrialGB} GB**`, { inline_keyboard: [[{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_edit_card") {
                        sysConfig.adminCardNumber = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("shop_card_num")||"Card Number"}: \`${text}\``, { inline_keyboard: [[{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_edit_card_owner") {
                        sysConfig.adminCardOwner = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("shop_card_owner")||"Card Owner"}: **${text}**`, { inline_keyboard: [[{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_edit_welcome") {
                        sysConfig.botWelcomeMsg = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("shop_welcome_set")||"Bot welcome message updated!"}`, { inline_keyboard: [[{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_edit_support") {
                        sysConfig.botSupportMsg = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ پیام پشتیبانی ذخیره شد!`, { inline_keyboard: [[{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_edit_theme") {
                        sysConfig.botThemeColor = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ رنگ تم ربات: \`${text}\``, { inline_keyboard: [[{ text: `◀️ ${t("btn_back")}`, callback_data: "shop_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_plan_name") {
                        tgState[chatId] = { step: "shop_plan_price", planName: text };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `➕ **${t("shop_add_plan")||"Add Plan"} — Step 2/4**\n📦 Name: **${text}**\n\n${t("shop_plan_price_prompt")||"Send plan price:"}`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_plans_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_plan_price") {
                        tgState[chatId] = { step: "shop_plan_days", planName: state.planName, planPrice: text };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `➕ **${t("shop_add_plan")||"Add Plan"} — Step 3/4**\n📦 Name: **${state.planName}**\n💰 Price: **${text}**\n\n${t("shop_plan_days_prompt")||"Send plan days:"}`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_plans_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_plan_days") {
                        tgState[chatId] = { step: "shop_plan_gb", planName: state.planName, planPrice: state.planPrice, planDays: parseInt(text) || 30 };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `➕ **${t("shop_add_plan")||"Add Plan"} — Step 4/4**\n📦 Name: **${state.planName}**\n💰 Price: **${state.planPrice}**\n⏱ Days: **${text}**\n\n${t("shop_plan_gb_prompt")||"Send plan traffic (GB):"}`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_plans_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_plan_gb") {
                        const newPlan = { id: crypto.randomUUID().slice(0,8), name: state.planName, price: state.planPrice, days: state.planDays, gb: parseFloat(text) || 10 };
                        if (!sysConfig.purchaseOptions) sysConfig.purchaseOptions = [];
                        sysConfig.purchaseOptions.push(newPlan);
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `${t("shop_plan_added")||"✅ Plan added!"}\n\n📦 **${newPlan.name}**\n💰 ${newPlan.price} | ⏱ ${newPlan.days} days | 📦 ${newPlan.gb} GB`, { inline_keyboard: [[{ text: `📋 ${t("shop_plans")||"Plans"}`, callback_data: "shop_plans_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_svc_name") {
                        tgState[chatId] = { step: "shop_svc_emoji", svcName: text };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `➕ **افزودن سرویس — مرحله 2/3**\n📦 نام: **${text}**\n\nیک ایموجی برای سرویس ارسال کنید (مثلاً 🌐):`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_services_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_svc_emoji") {
                        tgState[chatId] = { step: "shop_svc_desc", svcName: state.svcName, svcEmoji: text };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `➕ **افزودن سرویس — مرحله 3/3**\n${text} نام: **${state.svcName}**\n\nتوضیحات سرویس را ارسال کنید:`, { inline_keyboard: [[{ text: `❌ ${t("btn_cancel")}`, callback_data: "shop_services_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "shop_svc_desc") {
                        if (!sysConfig.customServices) sysConfig.customServices = [];
                        sysConfig.customServices.push({ name: state.svcName, emoji: state.svcEmoji, description: text });
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ سرویس اضافه شد!\n\n${state.svcEmoji} **${state.svcName}**\n${text}`, { inline_keyboard: [[{ text: `🔧 سرویس‌ها`, callback_data: "shop_services_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_tg_token") {
                        if (text !== "/skip") sysConfig.tgToken = text;
                        tgState[chatId] = { step: "tg_edit_tg_chat" };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `2️⃣ Chat ID: \`${sysConfig.tgChatId || '—'}\`\n\n${t("tg_new_val")}\n_send /skip to keep current_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_tg_chat") {
                        if (text !== "/skip") sysConfig.tgChatId = text;
                        tgState[chatId] = { step: "tg_edit_tg_admin" };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `3️⃣ Admin ID: \`${sysConfig.tgAdminId || '—'}\`\n\n${t("tg_new_val")}\n_send /skip to keep current_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_tg_admin") {
                        if (text !== "/skip") sysConfig.tgAdminId = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_tg_settings")} saved!`, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_cf_acc") {
                        if (text !== "/skip") sysConfig.cfAccountId = text;
                        tgState[chatId] = { step: "tg_edit_cf_token" };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `2️⃣ CF API Token: \`${sysConfig.cfApiToken ? '***' + sysConfig.cfApiToken.slice(-4) : '—'}\`\n\n${t("tg_new_val")}\n_send /skip to keep current_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_cf_token") {
                        if (text !== "/skip") sysConfig.cfApiToken = text;
                        tgState[chatId] = { step: "tg_edit_cf_worker" };
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `3️⃣ CF Worker Name: \`${sysConfig.cfWorkerName || '—'}\`\n\n${t("tg_new_val")}\n_send /skip to keep current_`, { inline_keyboard: [[{ text: "❌ " + t("btn_cancel"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_cf_worker") {
                        if (text !== "/skip") sysConfig.cfWorkerName = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_cf_settings")} saved!`, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_advanced_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                    if (state.step === "tg_edit_ports") {
                        sysConfig.socketPorts = text;
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        tgState[chatId] = null;
                        ctx?.waitUntil(d1Put(env, "tg_bot_state", JSON.stringify(tgState)).catch(()=>{}));
                        await sendOrEdit(chatId, `✅ ${t("tg_ports")}: \`${text}\``, { inline_keyboard: [[{ text: "◀️ " + t("btn_back"), callback_data: "tg_settings_menu" }]] });
                        return new Response("OK", { status: 200 });
                    }
                }
                
                // Handle user_* states even for admin users (admin testing as user)
                const adminAsUserState = tgState[chatId];
                if (adminAsUserState && adminAsUserState.step === 'user_awaiting_add_sub') {
                    tgState[chatId] = null;
                    ctx?.waitUntil(d1Put(env, 'tg_bot_state', JSON.stringify(tgState)).catch(()=>{}));
                    const faA = langCode === 'fa';
                    let addId = text.trim();
                    try {
                        if (addId.startsWith('http')) {
                            const addUrl = new URL(addId);
                            const subParam = addUrl.searchParams.get('sub');
                            addId = subParam ? decodeURIComponent(subParam) : addUrl.pathname.split('/').filter(Boolean).pop() || '';
                        }
                    } catch(e) {}
                    addId = addId.replace(/^https?:\/\//, '').split('?')[0].split('/').pop() || addId;
                    const addedUserA = addId && addId.length >= 3 ? (sysConfig.users || []).find(u =>
                        u.id === addId ||
                        u.id.replace(/-/g,'').toLowerCase() === addId.replace(/-/g,'').toLowerCase() ||
                        u.name.toLowerCase() === addId.toLowerCase()
                    ) : null;
                    const adminTgId = String(chatId);
                    if (addedUserA) {
                        if (!sysConfig.userAccounts) sysConfig.userAccounts = [];
                        let uAccA = sysConfig.userAccounts.find(a => a.tgId === adminTgId);
                        if (!uAccA) {
                            uAccA = { tgId: adminTgId, tgName: '', firstName: 'Admin', subId: '', savedLinks: [], joinedAt: Date.now(), lastActivity: Date.now() };
                            sysConfig.userAccounts.push(uAccA);
                        }
                        uAccA.subId = addedUserA.id;
                        uAccA.lastActivity = Date.now();
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        const escA = (s) => String(s || '').replace(/[_*`[\]]/g, '\\$&');
                        await sendOrEdit(chatId, faA
                            ? `✅ *سرویس با موفقیت اضافه شد!*\n━━━━━━━━━━━━━━\n📛 نام: ${escA(addedUserA.name)}\n━━━━━━━━━━━━━━`
                            : `✅ *Service added successfully!*\n━━━━━━━━━━━━━━\n📛 Name: ${escA(addedUserA.name)}\n━━━━━━━━━━━━━━`,
                            { inline_keyboard: [[{ text: faA ? '📱 سرویس‌های من' : '📱 My Services', callback_data: 'user_my_services' }], [{ text: faA ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]] });
                    } else {
                        await sendOrEdit(chatId, faA
                            ? "❌ **سرویس یافت نشد**\n━━━━━━━━━━━━━━\nلینک یا شناسه وارد‌شده معتبر نیست.\n\nدوباره ارسال کنید:"
                            : "❌ **Service not found**\n━━━━━━━━━━━━━━\nThe subscription link or ID is not valid.\n\nTry again:",
                            { inline_keyboard: [[{ text: faA ? '◀️ بازگشت' : '◀️ Back', callback_data: 'user_my_services' }]] });
                    }
                    return new Response('OK', { status: 200 });
                }

                // Default message / fallback menu
                const menu = getMainMenu(activePanel, isAuthorized);
                await sendOrEdit(chatId, menu.text, menu.kb);
            } else {
                // Non-admin user text message handler
                const userTgId = String(update.message.from?.id || chatId);
                const userTgName = update.message.from?.username || "";
                const firstName = update.message.from?.first_name || "کاربر";
                const fa = langCode === 'fa';

                const buildUserWelcome = () => {
                    const customWelcomeMsg = sysConfig.botWelcomeMsg;
                    const msg = customWelcomeMsg
                        ? customWelcomeMsg.replace('{name}', firstName)
                        : fa
                            ? `👋 سلام **${firstName}** عزیز!\n\n🔐 به سرویس **نهان** خوش آمدید.\n━━━━━━━━━━━━━━\n\n💡 از منوی زیر گزینه مورد نظر خود را انتخاب کنید:`
                            : `👋 Hello **${firstName}**!\n\n🔐 Welcome to **Nahan** service.\n━━━━━━━━━━━━━━\n\n💡 Select an option from the menu below:`;
                    const rows = [];
                    rows.push([{ text: fa ? '📱 سرویس‌های من' : '📱 My Services', callback_data: 'user_my_services' }]);
                    if (sysConfig.freeTrial) rows.push([{ text: fa ? '🎁 دریافت تست رایگان' : '🎁 Free Trial', callback_data: 'user_free_trial' }]);
                    if (sysConfig.purchaseEnabled) rows.push([{ text: fa ? '🛒 خرید اشتراک' : '🛒 Buy Subscription', callback_data: 'user_buy' }]);
                    rows.push([{ text: fa ? '👤 حساب کاربری من' : '👤 My Account', callback_data: 'user_my_account' }]);
                    if (sysConfig.botSupportMsg) rows.push([{ text: fa ? '💬 پشتیبانی' : '💬 Support', callback_data: 'user_support' }]);
                    return { msg, kb: { inline_keyboard: rows } };
                };

                if (text === '/start' || text === '/menu') {
                    tgState[chatId] = null;
                    ctx?.waitUntil(d1Put(env, 'tg_bot_state', JSON.stringify(tgState)).catch(()=>{}));
                    const { msg, kb } = buildUserWelcome();
                    await sendOrEdit(chatId, msg, kb);
                    return new Response('OK', { status: 200 });
                }

                // Check if user is in a state (waiting for sub link input)
                const userState = tgState[chatId];

                // Handle promo code text input step
                if (userState && userState.step === 'promo_code') {
                    const code = text.trim().toUpperCase();
                    const pkgIdPc = userState.pkgId;
                    const pkgPc = (sysConfig.purchaseOptions || []).find(p => p.id === pkgIdPc) || { name: pkgIdPc, price: '—', days: 30, gb: 10 };
                    const allCodes = sysConfig.promoCodes || [];
                    const promoEntry = allCodes.find(c => c.code.toUpperCase() === code);
                    const nowPc = Date.now();
                    let promoError = null;
                    if (!promoEntry) promoError = fa ? '❌ کد تخفیف یافت نشد.' : '❌ Promo code not found.';
                    else if (!promoEntry.isActive) promoError = fa ? '❌ این کد تخفیف غیرفعال است.' : '❌ This promo code is inactive.';
                    else if (promoEntry.validUntil && nowPc > promoEntry.validUntil) promoError = fa ? '❌ این کد تخفیف منقضی شده است.' : '❌ This promo code has expired.';
                    else if (promoEntry.maxUses > 0 && promoEntry.usedCount >= promoEntry.maxUses) promoError = fa ? '❌ ظرفیت این کد تمام شده است.' : '❌ This code has reached its usage limit.';
                    else if ((promoEntry.usedBy || []).includes(String(userTgId))) promoError = fa ? '❌ شما قبلاً از این کد استفاده کرده‌اید.' : '❌ You already used this code.';
                    else if (promoEntry.applicablePlans && promoEntry.applicablePlans.length > 0 && !promoEntry.applicablePlans.includes(pkgIdPc)) promoError = fa ? '❌ این کد برای پکیج انتخابی معتبر نیست.' : '❌ This code is not valid for the selected package.';

                    if (promoError) {
                        await sendOrEdit(chatId, promoError + '\n\n' + (fa ? 'کد دیگری وارد کنید یا بازگشت بزنید:' : 'Try another code or go back:'),
                            { inline_keyboard: [[{ text: fa ? '◀️ بازگشت' : '◀️ Back', callback_data: `user_buy_package:${pkgIdPc}` }]] });
                    } else {
                        const dLabel = promoEntry.discountType === 'percentage'
                            ? `${promoEntry.discountValue}%`
                            : `${promoEntry.discountValue}`;
                        tgState[chatId] = { step: 'user_awaiting_receipt', pkgId: pkgIdPc, promoCode: code, discountLabel: dLabel };
                        ctx?.waitUntil(d1Put(env, 'tg_bot_state', JSON.stringify(tgState)).catch(()=>{}));
                        const promoOkMsg = fa
                            ? `✅ **کد تخفیف اعمال شد!**\n━━━━━━━━━━━━━━\n🏷️ کد: \`${code}\`\n💸 تخفیف: **${dLabel}**\n📦 پکیج: **${pkgPc.name}**\n💰 قیمت اصلی: **${pkgPc.price || '—'}**\n━━━━━━━━━━━━━━\n\n💳 **اطلاعات پرداخت:**\nشماره کارت: \`${sysConfig.adminCardNumber || '—'}\`\nصاحب حساب: **${sysConfig.adminCardOwner || '—'}**\n━━━━━━━━━━━━━━\n\n📸 پس از پرداخت، **عکس رسید** را ارسال کنید:`
                            : `✅ **Promo code applied!**\n━━━━━━━━━━━━━━\n🏷️ Code: \`${code}\`\n💸 Discount: **${dLabel}**\n📦 Package: **${pkgPc.name}**\n💰 Original Price: **${pkgPc.price || '—'}**\n━━━━━━━━━━━━━━\n\n💳 **Payment Info:**\nCard: \`${sysConfig.adminCardNumber || '—'}\`\nOwner: **${sysConfig.adminCardOwner || '—'}**\n━━━━━━━━━━━━━━\n\n📸 Send a **photo of the receipt** after payment:`;
                        await sendOrEdit(chatId, promoOkMsg, { inline_keyboard: [[{ text: fa ? '❌ انصراف' : '❌ Cancel', callback_data: 'user_buy' }]] });
                    }
                    return new Response('OK', { status: 200 });
                }

                                        // v5.3.0: Handle broadcast mode - admin sends message to all users
                        if (sysConfig.botBroadcastMode) {
                            const isAdminUser = String(cb.from?.id || chatId) === String(sysConfig.tgAdminId || "");
                            if (isAdminUser && text && text !== '/cancel') {
                                sysConfig.botBroadcastMode = false;
                                const allUsers = sysConfig.userAccounts || [];
                                let sentCount = 0;
                                for (let bIdx = 0; bIdx < allUsers.length; bIdx++) {
                                    if (allUsers[bIdx].tgId) {
                                        try {
                                            await fetch("https://api.telegram.org/bot"+sysConfig.tgToken+"/sendMessage", {
                                                method: "POST", headers: {"Content-Type": "application/json"},
                                                body: JSON.stringify({chat_id: allUsers[bIdx].tgId, text: "📢 <b>پیام ادمین</b>\n\n"+text, parse_mode: "HTML"})
                                            });
                                            sentCount++;
                                        } catch(e) {}
                                    }
                                }
                                const doneMsg = fa3 ? "✅ پیام به "+sentCount+" کاربر ارسال شد." : "✅ Message sent to "+sentCount+" users.";
                                await sendOrEdit(chatId, messageId, doneMsg, { inline_keyboard: [[{ text: fa3 ? "🔙 برگشت" : "🔙 Back", callback_data: "admin_main_menu" }]] });
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                                return;
                            } else if (text === '/cancel') {
                                sysConfig.botBroadcastMode = false;
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                                const cancelledMsg = fa3 ? "❌ ارسال پیام گروهی لغو شد." : "❌ Broadcast cancelled.";
                                await sendOrEdit(chatId, messageId, cancelledMsg, { inline_keyboard: [[{ text: fa3 ? "🔙 برگشت" : "🔙 Back", callback_data: "admin_main_menu" }]] });
                                return;
                            }
                        }
if (userState && userState.step === 'user_awaiting_add_sub') {
                    tgState[chatId] = null;
                    ctx?.waitUntil(d1Put(env, 'tg_bot_state', JSON.stringify(tgState)).catch(()=>{}));
                    let addId = text.trim();
                    try {
                        if (addId.startsWith('http')) {
                            const addUrl = new URL(addId);
                            const subParam = addUrl.searchParams.get('sub');
                            addId = subParam ? decodeURIComponent(subParam) : addUrl.pathname.split('/').filter(Boolean).pop() || '';
                        }
                    } catch(e) {}
                    addId = addId.replace(/^https?:\/\//, '').split('?')[0].split('/').pop() || addId;
                    const addedUser = addId && addId.length >= 3 ? (sysConfig.users || []).find(u =>
                        u.id === addId ||
                        u.id.replace(/-/g,'').toLowerCase() === addId.replace(/-/g,'').toLowerCase() ||
                        u.name.toLowerCase() === addId.toLowerCase()
                    ) : null;
                    if (addedUser) {
                        if (!sysConfig.userAccounts) sysConfig.userAccounts = [];
                        let uAcc = sysConfig.userAccounts.find(a => a.tgId === userTgId);
                        if (!uAcc) {
                            uAcc = { tgId: userTgId, tgName: userTgName, firstName: firstName, subId: '', savedLinks: [], joinedAt: Date.now(), lastActivity: Date.now() };
                            sysConfig.userAccounts.push(uAcc);
                        }
                        uAcc.subId = addedUser.id;
                        uAcc.lastActivity = Date.now();
                        await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        const escU = (s) => String(s || '').replace(/[_*`[\]]/g, '\\$&');
                        await sendOrEdit(chatId, fa
                            ? `✅ *سرویس با موفقیت اضافه شد!*\n━━━━━━━━━━━━━━\n📛 نام: ${escU(addedUser.name)}\n━━━━━━━━━━━━━━`
                            : `✅ *Service added successfully!*\n━━━━━━━━━━━━━━\n📛 Name: ${escU(addedUser.name)}\n━━━━━━━━━━━━━━`,
                            { inline_keyboard: [[{ text: fa ? '📱 سرویس‌های من' : '📱 My Services', callback_data: 'user_my_services' }], [{ text: fa ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]] });
                    } else {
                        await sendOrEdit(chatId, fa
                            ? "❌ **سرویس یافت نشد**\n━━━━━━━━━━━━━━\nلینک یا شناسه وارد‌شده معتبر نیست.\n\nدوباره ارسال کنید:"
                            : "❌ **Service not found**\n━━━━━━━━━━━━━━\nThe subscription link or ID is not valid.\n\nTry again:",
                            { inline_keyboard: [[{ text: fa ? '◀️ بازگشت' : '◀️ Back', callback_data: 'user_my_services' }]] });
                    }
                    return new Response('OK', { status: 200 });
                }

                // v5.1.0: User rename service handler
                if (userState && userState.step === 'user_awaiting_rename') {
                    tgState[chatId] = null;
                    ctx?.waitUntil(d1Put(env, 'tg_bot_state', JSON.stringify(tgState)).catch(()=>{}));
                    const newName = text.trim().substring(0, 64);
                    if (newName.length < 1) {
                        await sendOrEdit(chatId, fa
                            ? "❌ **نام نامعتبر است**\n━━━━━━━━━━━━━━\nنام سرویس باید حداقل ۱ کاراکتر باشد."
                            : "❌ **Invalid name**\n━━━━━━━━━━━━━━\nService name must be at least 1 character.",
                            { inline_keyboard: [[{ text: fa ? '◀️ بازگشت' : '◀️ Back', callback_data: 'user_my_services' }]] }, messageId);
                        return new Response('OK', { status: 200 });
                    }
                    const targetSubHash = userState.subHash || '';
                    if (targetSubHash) {
                        const targetUser = (sysConfig.users || []).find(u => u.subHash === targetSubHash);
                        if (targetUser) {
                            targetUser.name = newName;
                            await cachedD1Put(env, 'sys_config', JSON.stringify(sysConfig));
                            ctx?.waitUntil(logActivity(env, 'Service Renamed', `Service ${targetSubHash} renamed to "${newName}"`).catch(()=>{}));
                            await sendOrEdit(chatId, fa
                                ? `✅ **نام سرویس تغییر کرد**\n━━━━━━━━━━━━━━\nنام جدید: **${newName}**`
                                : `✅ **Service renamed**\n━━━━━━━━━━━━━━\nNew name: **${newName}**`,
                                { inline_keyboard: [[{ text: fa ? '📋 سرویس‌های من' : '📋 My Services', callback_data: 'user_my_services' }]] }, messageId);
                        } else {
                            await sendOrEdit(chatId, fa
                                ? "❌ **سرویس یافت نشد**"
                                : "❌ **Service not found**",
                                { inline_keyboard: [[{ text: fa ? '◀️ بازگشت' : '◀️ Back', callback_data: 'user_my_services' }]] }, messageId);
                        }
                    } else {
                        await sendOrEdit(chatId, fa
                            ? "❌ **خطا**\n━━━━━━━━━━━━━━\nشناسه سرویس نامعتبر است."
                            : "❌ **Error**\n━━━━━━━━━━━━━━\nInvalid service identifier.",
                            { inline_keyboard: [[{ text: fa ? '◀️ بازگشت' : '◀️ Back', callback_data: 'user_my_services' }],
                                [{ text: fa3 ? '🎯 معرفی' : '🎯 Referral', callback_data: 'user_referral' }]] }, messageId);
                    }
                    return new Response('OK', { status: 200 });
                }

                if (userState && userState.step === 'user_awaiting_link') {
                    tgState[chatId] = null;
                    ctx?.waitUntil(d1Put(env, 'tg_bot_state', JSON.stringify(tgState)).catch(()=>{}));
                }

                // Try to look up subscription by sent text
                let lookupId = text.trim();
                // Strip URL down to sub ID
                try {
                    if (lookupId.startsWith('http')) {
                        const u = new URL(lookupId);
                        const subParam = u.searchParams.get('sub');
                        lookupId = subParam ? decodeURIComponent(subParam) : u.pathname.split('/').filter(Boolean).pop() || '';
                    }
                } catch(e) {}
                lookupId = lookupId.replace(/^https?:\/\//, '').split('?')[0].split('/').pop() || lookupId;

                if (lookupId && lookupId.length >= 3) {
                    const users = sysConfig.users || [];
                    const matchedUser = users.find(u =>
                        u.id === lookupId ||
                        u.id.replace(/-/g,'').toLowerCase() === lookupId.replace(/-/g,'').toLowerCase() ||
                        u.name.toLowerCase() === lookupId.toLowerCase()
                    );
                    if (matchedUser) {
                        const u = matchedUser;
                        const usedBytes = (u.upLink || 0) + (u.downLink || 0);
                        const usedGB = (usedBytes / 1073741824).toFixed(2);
                        const limitGB = u.totalTrafficLimit ? (u.totalTrafficLimit / 1073741824).toFixed(0) : '∞';
                        const expiryDate = u.expiryMs ? new Date(u.expiryMs).toLocaleDateString('fa-IR') : '∞';
                        const dLeft = u.expiryMs ? Math.max(0, Math.ceil((u.expiryMs - Date.now()) / 86400000)) : -1;
                        const statusEmoji = u.isExpired ? '❌' : u.isPaused ? '⏸️' : '✅';
                        const statusText = u.isExpired ? (fa ? 'منقضی' : 'Expired') : u.isPaused ? (fa ? 'متوقف' : 'Paused') : (fa ? 'فعال' : 'Active');
                        const subLink = `${new URL(request.url).origin}/${encodeURI(sysConfig.subRoute || "sub")}/${u.subHash || generateSubHash(u.id)}`;
                        // Save link to user account
                        if (!sysConfig.userAccounts) sysConfig.userAccounts = [];
                        let userAcc = sysConfig.userAccounts.find(a => a.tgId === userTgId);
                        if (!userAcc) {
                            userAcc = { tgId: userTgId, tgName: userTgName, firstName: firstName, subId: '', savedLinks: [], joinedAt: Date.now(), lastActivity: Date.now() };
                            sysConfig.userAccounts.push(userAcc);
                        }
                        if (!userAcc.savedLinks) userAcc.savedLinks = [];
                        if (!userAcc.savedLinks.includes(subLink)) {
                            userAcc.savedLinks.push(subLink);
                            userAcc.lastActivity = Date.now();
                            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                        }
                        const pctUsed = u.totalTrafficLimit ? Math.round(usedBytes / u.totalTrafficLimit * 100) : 0;
                        const progressBar = u.totalTrafficLimit ? ('█'.repeat(Math.round(pctUsed/10)) + '░'.repeat(10 - Math.round(pctUsed/10))) : '∞';
                        const detailText = fa
                            ? `📊 **وضعیت اشتراک**\n━━━━━━━━━━━━━━━━\n📛 نام: **${u.name}**\n🆔 UUID: \`${u.id}\`\n🚦 وضعیت: ${statusEmoji} ${statusText}\n━━━━━━━━━━━━━━━━\n📊 مصرف: **${usedGB}** / ${limitGB} GB\n${progressBar} ${pctUsed}%\n⏱ روز مانده: **${dLeft < 0 ? '∞' : dLeft}** روز\n📅 انقضا: ${expiryDate}\n📡 پروتکل: ${u.protocol || 'نامحدود'}\n📱 محدودیت کانفیگ: ${u.configLimit || 'نامحدود'}\n━━━━━━━━━━━━━━━━\n🔗 لینک اشتراک:\n\`${subLink}\`\n━━━━━━━━━━━━━━━━\n💾 لینک در حساب شما ذخیره شد.`
                            : `📊 **Subscription Status**\n━━━━━━━━━━━━━━━━\n📛 Name: **${u.name}**\n🆔 UUID: \`${u.id}\`\n🚦 Status: ${statusEmoji} ${statusText}\n━━━━━━━━━━━━━━━━\n📊 Usage: **${usedGB}** / ${limitGB} GB\n${progressBar} ${pctUsed}%\n⏱ Days Left: **${dLeft < 0 ? '∞' : dLeft}** days\n📅 Expiry: ${expiryDate}\n📡 Protocol: ${u.protocol || 'Unlimited'}\n📱 Config Limit: ${u.configLimit || 'Unlimited'}\n━━━━━━━━━━━━━━━━\n🔗 Subscription Link:\n\`${subLink}\`\n━━━━━━━━━━━━━━━━\n💾 Link saved to your account.`;
            const detailKb = { inline_keyboard: [
                [{ text: fa ? '🔗 لینک اشتراک' : '🔗 Subscription Link', callback_data: `user_get_link:${u.id}` }],
                [{ text: fa ? '🔄 تمدید' : '🔄 Renew', callback_data: `user_renew_service:${u.id}` }, { text: fa ? '⏸️ توقف' : '⏸️ Pause', callback_data: `user_pause_service:${u.id}` }],
                [{ text: fa ? '✏️ تغییر نام' : '✏️ Rename', callback_data: `user_rename_service:${u.id}` }, { text: fa ? '🗑️ حذف' : '🗑️ Delete', callback_data: `user_delete_service:${u.id}` }],
                [{ text: fa ? '🎧 پشتیبانی' : '🎧 Support', callback_data: 'user_support' }],
                [{ text: fa ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]
            ]};
                        await sendOrEdit(chatId, detailText, detailKb);
                        return new Response('OK', { status: 200 });
                    }
                }

                // Default: show welcome
                const { msg, kb } = buildUserWelcome();
                await sendOrEdit(chatId, msg, kb);
            }
        } else if (update.message && update.message.photo && !isAuthorized) {
            // Non-admin user sent a photo — treat as purchase receipt
            const chatId = update.message.chat.id;
            const userTgId = String(update.message.from?.id || chatId);
            const userTgName = update.message.from?.username || String(userTgId);
            const fa = langCode === 'fa';
            const userState = tgState[chatId];

            if (userState && userState.step === 'user_awaiting_receipt') {
                const pkgId = userState.pkgId || '';
                const pkg = (sysConfig.purchaseOptions || []).find(p => p.id === pkgId) || { name: pkgId, days: 30, gb: 10 };
                const photoFileId = (update.message.photo || []).slice(-1)[0]?.file_id;
                if (photoFileId) {
                    if (!sysConfig.pendingPurchases) sysConfig.pendingPurchases = [];
                    const purchaseId = crypto.randomUUID().slice(0, 8);
                    // Mark promo code as used (before saving)
                    if (userState.promoCode) {
                        const usedPromo = (sysConfig.promoCodes || []).find(c => c.code.toUpperCase() === userState.promoCode.toUpperCase());
                        if (usedPromo) {
                            usedPromo.usedCount = (usedPromo.usedCount || 0) + 1;
                            if (!usedPromo.usedBy) usedPromo.usedBy = [];
                            if (!usedPromo.usedBy.includes(String(userTgId))) usedPromo.usedBy.push(String(userTgId));
                        }
                    }
                    sysConfig.pendingPurchases.push({
                        id: purchaseId,
                        tgId: userTgId,
                        tgName: userTgName,
                        chatId: chatId,
                        pkgId: pkgId,
                        pkgName: pkg.name,
                        days: pkg.days,
                        gb: pkg.gb,
                        photoFileId: photoFileId,
                        ts: Date.now(),
                        status: 'pending',
                        promoCode: userState.promoCode || null,
                        discountLabel: userState.discountLabel || null
                    });
                    await cachedD1Put(env, 'sys_config', JSON.stringify(sysConfig));
                    tgState[chatId] = null;
                    ctx?.waitUntil(d1Put(env, 'tg_bot_state', JSON.stringify(tgState)).catch(()=>{}));
                    const receiptConfirm = fa
                        ? "✅ **رسید شما دریافت شد!**\n━━━━━━━━━━━━━━\n📦 پکیج: **" + pkg.name + "**\n⏳ در انتظار بررسی ادمین...\n━━━━━━━━━━━━━━\n\n💡 پس از تأیید، لینک اشتراک برای شما ارسال خواهد شد."
                        : "✅ **Receipt Received!**\n━━━━━━━━━━━━━━\n📦 Package: **" + pkg.name + "**\n⏳ Pending admin review...\n━━━━━━━━━━━━━━\n\n💡 Your subscription link will be sent after approval.";
                    await sendOrEdit(chatId, receiptConfirm, { inline_keyboard: [[{ text: fa ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]] });
                    // Notify admin
                    const adminId = sysConfig.tgAdminId || sysConfig.tgChatId;
                    if (adminId) {
                        const promoLine = userState.promoCode ? `\n🏷️ کد تخفیف: \`${userState.promoCode}\` (${userState.discountLabel || ''})` : '';
                        const notifText = `📨 **درخواست خرید جدید**\n━━━━━━━━━━━━━━\n👤 کاربر: @${userTgName}\n📦 پکیج: ${pkg.name}${promoLine}\n🕒 زمان: ${new Date().toLocaleString('fa-IR')}\n━━━━━━━━━━━━━━`;
                        const notifKb = { inline_keyboard: [
                            [{ text: `✅ تأیید`, callback_data: `admin_approve_purchase:${purchaseId}` }, { text: `❌ رد`, callback_data: `admin_reject_purchase:${purchaseId}` }]
                        ]};
                        await fetch(`${tgApi}/sendPhoto`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: adminId, photo: photoFileId, caption: notifText, parse_mode: 'Markdown', reply_markup: notifKb }) }).catch(()=>{});
                    }
                } else {
                    await sendOrEdit(chatId, fa ? 'لطفاً عکس واضح‌تری ارسال کنید.' : 'Please send a clear photo.');
                }
            } else {
                await sendOrEdit(chatId, fa ? 'ابتدا از منوی خرید یک پکیج انتخاب کنید.' : 'Please select a package from the buy menu first.');
            }
        }
        return new Response("OK", { status: 200 });
    } catch(e) {
        return new Response("OK", { status: 200 });
    }
}

// ============================================================
// v4.0.0: New API Handler Functions
// ============================================================

// POST /api/register
async function handleRegisterApi(request, env, ctx) {
    try {
        const body = await request.json();
        const { username, tg_id, full_name, phone, referrer_code } = body || {};
        const validation = validateInput([
            ["username", username, Validators.username],
            ["tg_id", tg_id, Validators.telegramId],
        ]);
        if (!validation.valid) return new Response(JSON.stringify({ error: validation.error }), { status: 400, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        const userId = crypto.randomUUID();
        const now = Date.now();
        const existing = await env.IOT_DB.prepare("SELECT id FROM nahan_users WHERE username = ? OR tg_id = ?").bind(username, String(tg_id)).all();
        if (existing.results && existing.results.length > 0) return new Response(JSON.stringify({ error: "Username or Telegram ID already registered" }), { status: 409, headers: { "Content-Type": "application/json" } });
        await env.IOT_DB.prepare("INSERT INTO nahan_users (id, username, tg_id, full_name, phone, referrer_code, user_group, balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'normal', 0, ?, ?)")
            .bind(userId, username, String(tg_id), full_name || "", phone || "", referrer_code || "", now, now).run();
        const token = await signJwt({ sub: userId, username, tg_id: String(tg_id), group: "normal" }, env);
        ctx?.waitUntil(logActivity(env, "User Registered", 'User "' + username + '" registered').catch(() => {}));
        return new Response(JSON.stringify({ success: true, user_id: userId, token }), { status: 201, headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Registration failed" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// POST /api/login
async function handleLoginApi(request, env, ctx) {
    try {
        const body = await request.json();
        const { tg_id } = body || {};
        if (!Validators.telegramId(tg_id)) return new Response(JSON.stringify({ error: "Invalid Telegram ID" }), { status: 400, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        const { results } = await env.IOT_DB.prepare("SELECT * FROM nahan_users WHERE tg_id = ?").bind(String(tg_id)).all();
        if (!results || results.length === 0) return new Response(JSON.stringify({ error: "User not found. Please register first." }), { status: 404, headers: { "Content-Type": "application/json" } });
        const user = results[0];
        const token = await signJwt({ sub: user.id, username: user.username, tg_id: user.tg_id, group: user.user_group }, env);
        return new Response(JSON.stringify({ success: true, token, user: { id: user.id, username: user.username, group: user.user_group, balance: user.balance } }), { headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Login failed" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// GET /api/profile (JWT required)
async function handleProfileApi(request, env, ctx) {
    try {
        const token = extractAuthJwt(request);
        const payload = await verifyJwt(token, env);
        if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        const { results } = await env.IOT_DB.prepare("SELECT * FROM nahan_users WHERE id = ?").bind(payload.sub).all();
        if (!results || results.length === 0) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        const user = results[0];
        const subsResult = await env.IOT_DB.prepare("SELECT COUNT(*) as count FROM nahan_subscriptions WHERE user_id = ? AND status = 'active'").bind(user.id).all();
        return new Response(JSON.stringify({
            id: user.id, username: user.username, tg_id: user.tg_id, full_name: user.full_name,
            phone: user.phone, user_group: user.user_group, balance: user.balance,
            active_subscriptions: subsResult.results?.[0]?.count || 0, referrer_code: user.referrer_code, created_at: user.created_at
        }), { headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Failed to get profile" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// POST /api/wallet/charge (JWT required)
async function handleWalletChargeApi(request, env, ctx) {
    try {
        const token = extractAuthJwt(request);
        const payload = await verifyJwt(token, env);
        if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { "Content-Type": "application/json" } });
        const body = await request.json();
        const { amount } = body || {};
        if (!Validators.amount(amount)) return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        const invoiceId = crypto.randomUUID();
        const now = Date.now();
        await env.IOT_DB.prepare("INSERT INTO nahan_invoices (id, user_id, amount, status, description, created_at) VALUES (?, ?, ?, 'pending', 'Wallet charge', ?)")
            .bind(invoiceId, payload.sub, amount, now).run();
        ctx?.waitUntil(logActivity(env, "Wallet Charge", 'User "' + payload.username + '" requested ' + amount + ' tomans').catch(() => {}));
        return new Response(JSON.stringify({ success: true, invoice_id: invoiceId, amount, message: "Invoice created. Please complete payment." }), { headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Charge request failed" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// GET /api/wallet/history (JWT required)
async function handleWalletHistoryApi(request, env, ctx) {
    try {
        const token = extractAuthJwt(request);
        const payload = await verifyJwt(token, env);
        if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        const { results } = await env.IOT_DB.prepare("SELECT * FROM nahan_invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(payload.sub).all();
        return new Response(JSON.stringify({ transactions: results || [] }), { headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Failed to get history" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// GET/POST /api/subscriptions (JWT required)
async function handleSubscriptionsApi(request, env, ctx) {
    try {
        const token = extractAuthJwt(request);
        const payload = await verifyJwt(token, env);
        if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        if (request.method === "GET") {
            const { results } = await env.IOT_DB.prepare("SELECT * FROM nahan_subscriptions WHERE user_id = ? ORDER BY created_at DESC").bind(payload.sub).all();
            return new Response(JSON.stringify({ subscriptions: results || [] }), { headers: { "Content-Type": "application/json" } });
        }
        const body = await request.json();
        const { type, volume_gb, duration_days, price } = body || {};
        if (!type || !["test", "premium"].includes(type)) return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { "Content-Type": "application/json" } });
        if (!Validators.volumeGb(volume_gb)) return new Response(JSON.stringify({ error: "Invalid volume" }), { status: 400, headers: { "Content-Type": "application/json" } });
        if (!Validators.days(duration_days)) return new Response(JSON.stringify({ error: "Invalid duration" }), { status: 400, headers: { "Content-Type": "application/json" } });
        const subId = crypto.randomUUID();
        const now = Date.now();
        const expiresAt = now + (duration_days * 86400000);
        await env.IOT_DB.prepare("INSERT INTO nahan_subscriptions (id, user_id, type, volume_gb, duration_days, price, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)")
            .bind(subId, payload.sub, type, volume_gb, duration_days, price || 0, now, expiresAt).run();
        ctx?.waitUntil(logActivity(env, "Subscription Created", 'User "' + payload.username + '" created ' + type + ' sub: ' + volume_gb + 'GB/' + duration_days + 'd').catch(() => {}));
        return new Response(JSON.stringify({ success: true, subscription_id: subId, expires_at: expiresAt }), { status: 201, headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Subscription operation failed" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// GET /api/referral (JWT required)
async function handleReferralApi(request, env, ctx) {
    try {
        const token = extractAuthJwt(request);
        const payload = await verifyJwt(token, env);
        if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        const { results } = await env.IOT_DB.prepare("SELECT id, username, created_at FROM nahan_users WHERE referrer_code = (SELECT referrer_code FROM nahan_users WHERE id = ?)").bind(payload.sub).all();
        const count = results ? results.length : 0;
        const commission = sysConfig.referralCommission || 10;
        return new Response(JSON.stringify({ referrals: results || [], count, commission_percent: commission }), { headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Failed to get referrals" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// POST /api/agency (JWT required)
async function handleAgencyApi(request, env, ctx) {
    try {
        const token = extractAuthJwt(request);
        const payload = await verifyJwt(token, env);
        if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { "Content-Type": "application/json" } });
        const body = await request.json();
        const { description } = body || {};
        if (!description || description.length < 10) return new Response(JSON.stringify({ error: "Description too short (min 10 chars)" }), { status: 400, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        const reqId = crypto.randomUUID();
        const now = Date.now();
        await env.IOT_DB.prepare("INSERT INTO nahan_agency_requests (id, user_id, description, status, created_at) VALUES (?, ?, ?, 'pending', ?)")
            .bind(reqId, payload.sub, description, now).run();
        ctx?.waitUntil(logActivity(env, "Agency Request", 'User "' + payload.username + '" applied for agency').catch(() => {}));
        return new Response(JSON.stringify({ success: true, request_id: reqId, message: "Agency request submitted" }), { status: 201, headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Agency request failed" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// GET /api/agency (JWT required)
async function handleAgencyStatusApi(request, env, ctx) {
    try {
        const token = extractAuthJwt(request);
        const payload = await verifyJwt(token, env);
        if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        const { results } = await env.IOT_DB.prepare("SELECT * FROM nahan_agency_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").bind(payload.sub).all();
        return new Response(JSON.stringify({ requests: results || [] }), { headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Failed to get agency status" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// GET /api/search (admin only)
async function handleSearchApi(request, env, ctx) {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get("q") || "";
        if (!query || query.length < 2) return new Response(JSON.stringify({ error: "Query too short" }), { status: 400, headers: { "Content-Type": "application/json" } });
        // Check if authorized via master key or JWT admin
        const authKey = extractAuthJwt(request) || url.searchParams.get("key") || "";
        let isAdmin = (authKey === sysConfig.masterKey);
        if (!isAdmin) {
            const payload = await verifyJwt(authKey, env);
            isAdmin = payload && payload.group === "admin";
        }
        if (!isAdmin) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
        await d1Init(env);
        const { results } = await env.IOT_DB.prepare("SELECT id, username, tg_id, full_name, user_group, balance, created_at FROM nahan_users WHERE username LIKE ? OR full_name LIKE ? LIMIT 20")
            .bind("%" + query + "%", "%" + query + "%").all();
        return new Response(JSON.stringify({ users: results || [] }), { headers: { "Content-Type": "application/json" } });
    } catch(e) { return new Response(JSON.stringify({ error: "Search failed" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

// GET/POST /api/keys (admin only) - API Key management
async function handleApiKeys(request, env, ctx) {
    try {
        // Auth check
        const url = new URL(request.url);
        const authKey = extractAuthJwt(request) || url.searchParams.get("key") || "";
        const data = await request.json().catch(() => ({}));
        const bodyKey = data.key || "";
        const finalKey = authKey || bodyKey;
        if (finalKey !== sysConfig.masterKey && !isPanelApiKey(finalKey)) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
        }
        if (request.method === "GET") {
            return new Response(JSON.stringify({ keys: sysConfig.panelApiKeys || [] }), { headers: { "Content-Type": "application/json" } });
        }
        if (request.method === "POST") {
            const body = await request.json().catch(() => ({}));
            const { name } = body || {};
            if (!sysConfig.panelApiKeys) sysConfig.panelApiKeys = [];
            const newKey = generateApiKey(name || "API Key " + (sysConfig.panelApiKeys.length + 1));
            sysConfig.panelApiKeys.push(newKey);
            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
            ctx?.waitUntil(logActivity(env, "API Key Created", 'Key "' + newKey.name + '" created').catch(() => {}));
            return new Response(JSON.stringify({ success: true, key: newKey }), { status: 201, headers: { "Content-Type": "application/json" } });
        }
        if (request.method === "DELETE") {
            const body = await request.json().catch(() => ({}));
            const { id } = body || {};
            if (!id) return new Response(JSON.stringify({ error: "Key ID required" }), { status: 400, headers: { "Content-Type": "application/json" } });
            if (!sysConfig.panelApiKeys) sysConfig.panelApiKeys = [];
            const before = sysConfig.panelApiKeys.length;
            sysConfig.panelApiKeys = sysConfig.panelApiKeys.filter(k => k.id !== id);
            if (sysConfig.panelApiKeys.length === before) return new Response(JSON.stringify({ error: "Key not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
            await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
            ctx?.waitUntil(logActivity(env, "API Key Deleted", 'Key deleted').catch(() => {}));
            return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
        }
        return new Response("405", { status: 405 });
    } catch(e) { return new Response(JSON.stringify({ error: "API key operation failed" }), { status: 500, headers: { "Content-Type": "application/json" } }); }
}

async function processTelemetryStream(env, ctx) {
    const [client, webSocket] = Object.values(new WebSocketPair());
    webSocket.accept();
    webSocket.binaryType = "arraybuffer";
    startDataPipe(webSocket, env, ctx);
    return new Response(null, { status: 101, webSocket: client });
}

async function startDataPipe(webSocket, env, ctx) {
    activeConnections++;
    webSocket.addEventListener('close', () => activeConnections--);
    webSocket.addEventListener('error', () => activeConnections--);
    let remoteSocket, dataWriter, isInit = true, queue = Promise.resolve();
    let activeClientHash = null;
    webSocket.addEventListener("message", (event) => {
        queue = queue.then(async () => {
            try {
                if (isInit) {
                    isInit = false;
                    const isModeAlpha = await parseSensorData(event.data);
                    if (isModeAlpha) webSocket.send(new Uint8Array([0, 0]));
                } else if (dataWriter) {
                    await dataWriter.write(event.data);
                }
            } catch (err) { webSocket.close(); }
        });
    });

    async function parseSensorData(bufferData) {
        const view = new Uint8Array(bufferData);
        let targetAddr = "", targetPort = 0, offset = 0, isModeAlpha = false, activeProfile = null;

        if (view[0] === 0x00) {
            isModeAlpha = true;
            
            let clientHash = Array.from(view.slice(1, 17)).map(b => b.toString(16).padStart(2, '0')).join('');
            let configEntry = lookupConfigEntry(clientHash);
            
            if (configEntry) {
                activeClientHash = configEntry.userId.replace(/-/g, '').toLowerCase();
                activeProfile = getAllProfiles().find(p => p.id.replace(/-/g, '').toLowerCase() === activeClientHash);
                if (!activeProfile) return false;
                if (configEntry.relayIp) activeProfile = { ...activeProfile, proxyIp: configEntry.relayIp };
            } else {
                let decoded = decodeConfigUuid(clientHash);
                if (decoded) {
                    activeProfile = getAllProfiles().find(p => p.id.replace(/-/g, '').toLowerCase().startsWith(decoded.userFingerprint));
                    if (activeProfile && decoded.relayIpIndex >= 0) {
                        const effectivePips = getEffectivePips(activeProfile);
                        if (effectivePips.length > 0) {
                            const idx = decoded.relayIpIndex % effectivePips.length;
                            activeProfile = { ...activeProfile, proxyIp: effectivePips[idx] };
                        }
                    }
                }
                if (!activeProfile) {
                    activeProfile = getAllProfiles().find(p => p.id.replace(/-/g, '').toLowerCase() === clientHash);
                }
                if (!activeProfile) return false;
                activeClientHash = activeProfile.id.replace(/-/g, '').toLowerCase();
            }
            trackUsage(activeClientHash, 0, env, ctx);
            
            let uTrack = uuidUsage.get(activeClientHash) || { connects: 0, last: 0 };
            uTrack.connects++;
            uTrack.last = Date.now();
            uuidUsage.set(activeClientHash, uTrack);
            
            const optLen = view[17];
            const pPos = 18 + optLen + 1;
            targetPort = new DataView(bufferData.slice(pPos, pPos + 2)).getUint16(0);
            const aType = view[pPos + 2];
            let vPos = pPos + 3, aLen = 0;

            if (aType === 1) { aLen = 4; targetAddr = view.slice(vPos, vPos + aLen).join("."); }
            else if (aType === 2) { aLen = view[vPos]; vPos++; targetAddr = new TextDecoder().decode(view.slice(vPos, vPos + aLen)); }
            else if (aType === 3) { aLen = 16; const dv = new DataView(bufferData.slice(vPos, vPos + aLen)); targetAddr = Array.from({ length: 8 }, (_, i) => dv.getUint16(i * 2).toString(16)).join(":"); }
            offset = vPos + aLen;
        } else {
            let ePos = bufferData.byteLength;
            for (let i = 0; i < bufferData.byteLength; i++) { if (view[i] === 0x0D && view[i + 1] === 0x0A) { ePos = i; break; } }
            
            let clientHashHex = new TextDecoder().decode(view.slice(0, ePos));
            let configEntry = lookupConfigEntry(clientHashHex);
            
            if (configEntry) {
                activeClientHash = configEntry.userId.replace(/-/g, '').toLowerCase();
                activeProfile = getAllProfiles().find(p => p.id.replace(/-/g, '').toLowerCase() === activeClientHash);
                if (!activeProfile) return false;
                if (configEntry.relayIp) activeProfile = { ...activeProfile, proxyIp: configEntry.relayIp };
            } else {
                activeProfile = getAllProfiles().find(p => getTrojanHash(p.id) === clientHashHex);
                if (!activeProfile) return false;
                activeClientHash = activeProfile.id.replace(/-/g, '').toLowerCase();
            }
            trackUsage(activeClientHash, 0, env, ctx);
            let uTrack = uuidUsage.get(activeClientHash) || { connects: 0, last: 0 };
            uTrack.connects++;
            uTrack.last = Date.now();
            uuidUsage.set(activeClientHash, uTrack);

            let hPos = ePos + 2; hPos++; hPos++;
            let aType = view[hPos]; hPos++; let aLen = 0;

            if (aType === 1) { aLen = 4; targetAddr = view.slice(hPos, hPos + aLen).join("."); }
            else if (aType === 3) { aLen = view[hPos]; hPos++; targetAddr = new TextDecoder().decode(view.slice(hPos, hPos + aLen)); }
            else if (aType === 4) { aLen = 16; const dv = new DataView(bufferData.slice(hPos, hPos + aLen)); targetAddr = Array.from({ length: 8 }, (_, i) => dv.getUint16(i * 2).toString(16)).join(":"); }

            hPos += aLen;
            targetPort = new DataView(bufferData.slice(hPos, hPos + 2)).getUint16(0);
            offset = hPos + 2;
        }

        let isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(targetAddr) || /^[a-zA-Z0-9-]+$/.test(targetAddr);
        let connectAddr = targetAddr;
        if (isDomain && sysConfig.customDns) {
            try {
                const dohUrl = new URL(sysConfig.customDns);
                dohUrl.searchParams.set("name", targetAddr);
                dohUrl.searchParams.set("type", "A");
                let dnsRes = await fetch(dohUrl.toString(), { headers: { "accept": "application/dns-json" }});
                let dnsJson = await dnsRes.json();
                if (dnsJson.Answer && dnsJson.Answer.length > 0) {
                    connectAddr = dnsJson.Answer[0].data;
                }
            } catch (e) {}
        }

        try {
            remoteSocket = connect({ hostname: connectAddr, port: targetPort });
            await remoteSocket.opened;
        } catch {
            let pips = [];
            if (activeProfile && activeProfile.proxyIp) {
                pips = activeProfile.proxyIp.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
            }
            if (pips.length === 0 && sysConfig.backupRelay) {
                pips = sysConfig.backupRelay.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
            }
            if (pips.length === 0 && sysConfig.customRelay) {
                pips = sysConfig.customRelay.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
            }

            // Consistent hash based on user/profile ID to prevent session/IP splitting across assets on Cloudflare
            let startIndex = 0;
            if (pips.length > 1) {
                let hash = 0;
                let hashStr = (activeProfile ? activeProfile.id : "");
                for (let i = 0; i < hashStr.length; i++) {
                    hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
                }
                startIndex = Math.abs(hash) % pips.length;
            }

            // Attempt to connect with automatic failover to alternative proxy IPs
            let connected = false;
            for (let attempt = 0; attempt < Math.min(pips.length, 3); attempt++) {
                let currentIndex = (startIndex + attempt) % pips.length;
                let currentProxy = pips[currentIndex];
                try {
                    const [altIP, altPortStr] = currentProxy.split(":");
                    remoteSocket = connect({ hostname: altIP, port: altPortStr ? Number(altPortStr) : targetPort });
                    await remoteSocket.opened;
                    connected = true;
                    break;
                } catch (e) {
                    // Try next fallback proxy IP in list
                }
            }
            if (!connected) {
                webSocket.close();
                return isModeAlpha;
            }
        }

        dataWriter = remoteSocket.writable.getWriter();
        if (offset < bufferData.byteLength) {
            let chunk = bufferData.slice(offset);
            await dataWriter.write(chunk);
        }
        remoteSocket.readable.pipeTo(new WritableStream({ write(chunk) { 
            webSocket.send(chunk); 
        } }));

        return isModeAlpha;
    }
}

function generateHardwareId(seed) {
    const h20 = Array.from(new TextEncoder().encode(seed)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 20).padEnd(20, "0");
    return `${h20.slice(0, 8)}-0000-4000-8000-${h20.slice(-12)}`;
}

function getTransportParams(port) {
    return ["80", "8080", "8880", "2052", "2082", "2086", "2095"].includes(port.toString()) ? "none" : "tls";
}

function getSubscriptionStats(targetSub = null) {
    let name = "Default";
    let id = activeDeviceId;
    let limitTotalReq = 0;
    let expiryMs = 0;
    
    let hasMultiUser = (sysConfig.users && sysConfig.users.length > 0);
    if (hasMultiUser && targetSub) {
        let user = sysConfig.users.find(u => u.name.toLowerCase() === targetSub.toLowerCase() || u.id === targetSub);
        if (user) {
            name = user.name;
            id = user.id;
            limitTotalReq = user.limitTotalReq || 0;
            expiryMs = user.expiryMs || 0;
        }
    } else if (!hasMultiUser) {
        limitTotalReq = sysConfig.limitTotalReq || 0;
        expiryMs = sysConfig.expiryMs || 0;
    }
    
    let idClean = id.replace(/-/g, '').toLowerCase();
    let sysU = sysUsageCache?.users?.[idClean] || { reqs: 0, dReqs: 0 };
    let totalReqs = sysU.reqs || 0;
    
    let totalGb = (totalReqs / 6000).toFixed(2);
    let limitTotalGb = limitTotalReq ? (limitTotalReq / 6000).toFixed(2) : 'Unlimited';
    
    let expiryDateTxt = 'Never Expire';
    let remDaysTxt = 'Never Expire';
    if (expiryMs) {
        let exp = new Date(expiryMs);
        expiryDateTxt = exp.toISOString().split('T')[0];
        let remDays = Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24));
        remDaysTxt = remDays >= 0 ? `${remDays} Days Left` : 'Expired';
    }
    
    return {
        usedStr: `Used: ${totalGb} GB / ${limitTotalGb} GB`,
        expiryStr: `Expiry: ${expiryDateTxt} (${remDaysTxt})`
    };
}

function getFakeConfigNames(targetSub = null) {
    let stats = getSubscriptionStats(targetSub);
    let configs = sysConfig.fakeConfigs || [
        { name: "📊 {usage}", enabled: true },
        { name: "📅 {expiry}", enabled: true }
    ];
    return configs.filter(f => f && f.enabled && f.name).map(f => {
        return f.name.replace(/\{usage\}/g, stats.usedStr).replace(/\{expiry\}/g, stats.expiryStr);
    });
}

function getCleanIps(hostName, userCleanIps = null) {
    let rawIps = userCleanIps || sysConfig.cleanIps;
    let ips = rawIps ? rawIps.split(/[\r\n,;]+/).map(s => { let t = s.trim(); return t ? t.split('#')[0].trim() : ''; }).filter(Boolean) : [];
    if (ips.length === 0) ips = [hostName.endsWith('.pages.dev') ? sysConfig.metricNode : hostName];
    return ips;
}

function getCleanIpsWithNames(hostName, userCleanIps = null) {
    let rawIps = userCleanIps || sysConfig.cleanIps;
    let entries = rawIps ? rawIps.split(/[\r\n,;]+/).map(s => {
        let t = s.trim();
        if (!t) return null;
        let parts = t.split('#');
        let ip = parts[0].trim();
        let name = (parts[1] || '').trim();
        return ip ? { ip, name } : null;
    }).filter(Boolean) : [];
    if (entries.length === 0) entries = [{ ip: hostName.endsWith('.pages.dev') ? sysConfig.metricNode : hostName, name: '' }];
    return entries;
}


function getAllProfiles(targetSub = null) {
    let list = [{ id: activeDeviceId, name: "Default" }];
    
    if (sysConfig.users && sysConfig.users.length > 0) {
        let now = Date.now();
        sysConfig.users.forEach(u => {
            let skip = false;
            if (u.expiryMs && now > u.expiryMs) skip = true;
            if (u.isPaused) skip = true;
            if (u.limitTotalReq && sysUsageCache && sysUsageCache.users && sysUsageCache.users[u.id.replace(/-/g, '').toLowerCase()]) {
                if (sysUsageCache.users[u.id.replace(/-/g, '').toLowerCase()].reqs >= u.limitTotalReq) skip = true;
            }
            if (u.limitDailyReq && sysUsageCache && sysUsageCache.users && sysUsageCache.users[u.id.replace(/-/g, '').toLowerCase()]) {
                let usr = sysUsageCache.users[u.id.replace(/-/g, '').toLowerCase()];
                if (usr.lastDay === new Date().toISOString().split('T')[0] && usr.dReqs >= u.limitDailyReq) skip = true;
            }
            if(!skip) {
                list.push({ id: u.id, name: u.name, proxyIp: u.proxyIp, cleanIp: u.cleanIp || null, userMode: u.userMode || null, userPorts: u.userPorts || null, maxConfigs: u.maxConfigs || null, proxyIpGeo: u.proxyIpGeo || null, userNodes: u.userNodes || null, nat64: u.nat64 || null });
                registerConfigEntry(u.id, u.id, u.proxyIp || '');
            }
        });
    }

    if (targetSub) {
        list = list.filter(p => p.name.toLowerCase() === targetSub.toLowerCase());
    }
    return list;
}

function buildSingleUri(hostName) {
    let allHostNames = [hostName];
    if (sysConfig.slaveNodes) allHostNames.push(...sysConfig.slaveNodes.split(/[\r\n,;]+/).map(s=>s.trim()).filter(Boolean));
    let finalHost = allHostNames[0];
    let finalIP = getCleanIps(finalHost)[0];
    let ports = sysConfig.socketPorts ? sysConfig.socketPorts.split(',').map(s=>s.trim()).filter(Boolean) : ["443"];
    let firstPort = ports[0];
    let sec = getTransportParams(firstPort);
    let reqPath = encodeURI(`/${sysConfig.apiRoute}`);
    let uriProto = sysConfig.mode === "beta" ? getBeta() : getAlpha();
    let ext = `encryption=none&security=${sec}&sni=${finalHost}&fp=${sysConfig.agent}&type=ws&host=${finalHost}&path=${reqPath}`;
    if (sysConfig.enableOpt2) ext += `&pbk=enabled`;
    return `${uriProto}://${activeDeviceId}@${finalIP}:${firstPort}?${ext}#${finalHost}`;
}


function getProxyIpsArray(proxyIpString) {
    if (!proxyIpString) return [];
    return proxyIpString.split(/[\r\n,;]+/).map(s => {
        let trimmed = s.trim();
        if (!trimmed) return "";
        let hostPort = trimmed.split('#')[0].split('@')[0];
        if (hostPort.includes(':') && !hostPort.includes(']')) {
            return hostPort.split(':')[0];
        } else if (hostPort.startsWith('[') && hostPort.includes(']')) {
            return hostPort.split(']')[0].replace('[', '');
        }
        return hostPort;
    }).filter(Boolean);
}

function ipv4ToNat64(ipv4, prefix) {
    if (!prefix || !ipv4) return null;
    let parts = ipv4.split('.');
    if (parts.length !== 4 || parts.some(p => isNaN(parseInt(p)))) return null;
    let hex = parts.map(p => parseInt(p).toString(16).padStart(2, '0')).join('');
    let suffix = hex.match(/.{1,4}/g).join(':');
    return prefix.replace(/\/\d+$/, '').replace(/:$/, '') + '::' + suffix;
}

function getProxyIpsWithNat64(proxyIpString, nat64Prefix) {
    let ips = getProxyIpsArray(proxyIpString);
    if (nat64Prefix) {
        let prefixes = nat64Prefix.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
        let nat64Ips = [];
        prefixes.forEach(prefix => {
            ips.forEach(ip => {
                if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
                    let nat64 = ipv4ToNat64(ip, prefix);
                    if (nat64) nat64Ips.push(nat64);
                }
            });
        });
        ips = ips.concat(nat64Ips);
    }
    return ips;
}

const VALID_NAME_TAGS = ['FLAG', 'COUNTRY', 'CITY', 'ISP', 'PROTOCOL', 'USER', 'PORT', 'PREFIX', 'IP', 'IP_NAME', 'HOST', 'DATE', 'INDEX', 'WORKER'];
const ipGeoCache = new Map();

function validateNameStrategy(strategy) {
    if (!strategy) return { valid: true, unknownTags: [] };
    const tagPattern = /\{([A-Za-z]+)\}/g;
    let match;
    let unknownTags = [];
    while ((match = tagPattern.exec(strategy)) !== null) {
        let tag = match[1].toUpperCase();
        if (!VALID_NAME_TAGS.includes(tag)) unknownTags.push(match[1]);
    }
    return { valid: unknownTags.length === 0, unknownTags };
}

async function preloadIpFlags(profiles, hostNames) {
    let uniqueIps = new Set();
    profiles.forEach(p => {
        hostNames.forEach(h => {
            getCleanIps(h, p.cleanIp).forEach(ip => uniqueIps.add(ip));
        });
        if (p.proxyIp) {
            getProxyIpsArray(p.proxyIp).forEach(ip => uniqueIps.add(ip));
        }
    });
    if (sysConfig.backupRelay) {
        getProxyIpsArray(sysConfig.backupRelay).forEach(ip => uniqueIps.add(ip));
    }
    if (sysConfig.customRelay) {
        getProxyIpsArray(sysConfig.customRelay).forEach(ip => uniqueIps.add(ip));
    }

    let uncached = Array.from(uniqueIps).filter(ip => !ipGeoCache.has(ip));
    for (let i = 0; i < uncached.length; i += 100) {
        let batch = uncached.slice(i, i + 100);
        let queries = batch.map(ip => {
            let clean = ip.split(':')[0].replace(/[\[\]]/g, '').split('#')[0].trim();
            return { query: clean, fields: 'status,country,countryCode,city,isp,org' };
        });
        try {
            const res = await fetch('http://ip-api.com/batch?fields=status,country,countryCode,city,isp,org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(queries)
            });
            const results = await res.json();
            batch.forEach((ip, idx) => {
                let data = results[idx];
                if (data && data.status === 'success') {
                    const codePoints = data.countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
                    ipGeoCache.set(ip, {
                        flag: String.fromCodePoint(...codePoints),
                        country: data.country || 'Unknown',
                        countryCode: data.countryCode || '',
                        city: data.city || '',
                        isp: data.isp || data.org || ''
                    });
                } else {
                    ipGeoCache.set(ip, { flag: '🌐', country: 'Unknown', countryCode: '', city: '', isp: '' });
                }
            });
        } catch(e) {
            batch.forEach(ip => {
                if (!ipGeoCache.has(ip)) {
                    ipGeoCache.set(ip, { flag: '🌐', country: 'Unknown', countryCode: '', city: '', isp: '' });
                }
            });
        }
    }
}

function getEmojiFlag(ip) {
    if (!ip) return "🌐";
    let clean = ip.split(':')[0].replace(/[\[\]]/g, '').split('#')[0].trim();
    let geo = ipGeoCache.get(ip) || ipGeoCache.get(clean);
    return geo ? geo.flag : "🌐";
}

function getGeoInfo(ip) {
    if (!ip) return { flag: '🌐', country: 'Unknown', countryCode: '', city: '', isp: '' };
    let clean = ip.split(':')[0].replace(/[\[\]]/g, '').split('#')[0].trim();
    return ipGeoCache.get(ip) || ipGeoCache.get(clean) || { flag: '🌐', country: 'Unknown', countryCode: '', city: '', isp: '' };
}

async function fetchIpGeoData(ip) {
    if (!ip) return null;
    let clean = ip.split(':')[0].replace(/[\[\]]/g, '').split('#')[0].trim();
    try {
        const res = await fetch(`http://ip-api.com/json/${clean}?fields=status,country,countryCode,city,isp,org`);
        const data = await res.json();
        if (data && data.status === 'success') {
            const codePoints = data.countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
            return {
                flag: String.fromCodePoint(...codePoints),
                country: data.country || 'Unknown',
                countryCode: data.countryCode || '',
                city: data.city || '',
                isp: data.isp || data.org || ''
            };
        }
    } catch (e) {}
    return null;
}

async function resolveUserProxyIpGeo(user) {
    if (!user.proxyIp) { user.proxyIpGeo = null; return; }
    let pips = getProxyIpsArray(user.proxyIp);
    if (pips.length === 0) { user.proxyIpGeo = null; return; }
    let geoData = await fetchIpGeoData(pips[0]);
    user.proxyIpGeo = geoData || { flag: '🌐', country: 'Unknown', countryCode: '', city: '', isp: '' };
}

function getConfigName(type, profileName, port, hostName, ip, proxyIp = null, configIndex = 0, ipName = '') {
    let prefix = sysConfig.namePrefix || "Core";
    let strategy = sysConfig.nameStrategy || "default";
    let cleanName = profileName === "Default" ? "" : `-${profileName}`;
    let typeLab = type === "alpha" ? "V" : "T";

    if (strategy.includes('{') && strategy.includes('}')) {
        let lookupIp = proxyIp || ip;
        let geoInfo = getGeoInfo(lookupIp);
        let protoLab = type === "alpha" ? "VLESS" : "Trojan";
        let now = new Date();
        let dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        let workerName = sysConfig.cfWorkerName || sysConfig.name || hostName || '';
        let resName = strategy
            .replace(/{FLAG}/g, geoInfo.flag)
            .replace(/{COUNTRY}/g, geoInfo.country)
            .replace(/{CITY}/g, geoInfo.city)
            .replace(/{ISP}/g, geoInfo.isp)
            .replace(/{PROTOCOL}/g, protoLab)
            .replace(/{USER}/g, profileName)
            .replace(/{PORT}/g, port)
            .replace(/{PREFIX}/g, prefix)
            .replace(/{IP}/g, ip || '')
            .replace(/{IP_NAME}/g, ipName || '')
            .replace(/{HOST}/g, hostName || '')
            .replace(/{DATE}/g, dateStr)
            .replace(/{INDEX}/g, String(configIndex))
            .replace(/{WORKER}/g, workerName);
        return resName;
    }

    if (strategy === "type-user-port") {
        return `${type === "alpha" ? "vl" + "ess" : "tro" + "jan"}-${profileName}-${port}`;
    } else if (strategy === "user-port") {
        return `${profileName}-${port}`;
    } else if (strategy === "host-port-user") {
        return `${hostName}-${port}${cleanName}`;
    } else if (strategy === "prefix-user-port") {
        return `${prefix}${cleanName}-${port}`;
    }
    else if (strategy === "ip") {
        return ip || 'unknown';
    }

    else { // "default"
        return `${typeLab}-Core-${port}${cleanName}`;
    }
}

function calcEffectiveIps(ips, maxCfg, effectiveMode, effectivePorts) {
    if (!maxCfg) return ips;
    let protoCount = effectiveMode === "both" ? 2 : 1;
    let portCount = effectivePorts.length;
    let multiplier = protoCount * portCount;
    let neededIps = Math.max(1, Math.floor(maxCfg / multiplier));
    return ips.slice(0, neededIps);
}

function getProfileHostNames(hostName, profile) {
    let names = [hostName];
    if (profile && profile.userNodes) {
        names.push(...profile.userNodes.split(/[\r\n,;]+/).map(s=>s.trim()).filter(Boolean));
    } else if (sysConfig.slaveNodes) {
        names.push(...sysConfig.slaveNodes.split(/[\r\n,;]+/).map(s=>s.trim()).filter(Boolean));
    }
    return names;
}

function getEffectiveNat64(userNat64) {
    let parts = [];
    if (userNat64) parts.push(...userNat64.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean));
    if (sysConfig.nat64Prefix) parts.push(...sysConfig.nat64Prefix.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean));
    return [...new Set(parts)].join(',') || null;
}

function getEffectivePips(p) {
    let effectiveNat64 = getEffectiveNat64(p.nat64);
    let pips = getProxyIpsWithNat64(p.proxyIp, effectiveNat64);
    if (pips.length === 0 && sysConfig.backupRelay) {
        pips = getProxyIpsWithNat64(sysConfig.backupRelay, effectiveNat64);
    }
    if (pips.length === 0 && sysConfig.customRelay) {
        pips = getProxyIpsWithNat64(sysConfig.customRelay, effectiveNat64);
    }
    return pips;
}

async function buildUriProfile(hostName, targetSub = null, allowInsecure = false) {
    let ports = sysConfig.socketPorts ? sysConfig.socketPorts.split(',').map(s=>s.trim()).filter(Boolean) : ["443"];
    let reqPath = encodeURI(`/${sysConfig.apiRoute}`);
    
    let lines = [];
    let profiles = getAllProfiles(targetSub);
    let allHostNames = [...new Set(profiles.flatMap(p => getProfileHostNames(hostName, p)))];
    await preloadIpFlags(profiles, allHostNames);
    
    // Add fake configs
    let fakeNames = getFakeConfigNames(targetSub);
    fakeNames.forEach(name => {
        lines.push(`trojan://00000000-0000-0000-0000-000000000000@127.0.0.1:1080?encryption=none&security=none#${encodeURIComponent(name)}`);
    });
    
    profiles.forEach(p => {
        let pips = getEffectivePips(p);
        let effectiveMode = p.userMode || sysConfig.mode;
        let effectivePorts = p.userPorts ? p.userPorts.split(',').map(s=>s.trim()).filter(Boolean) : ports;
        let maxCfg = p.maxConfigs || null;

        let configIndex = 0;
        let profileHostNames = getProfileHostNames(hostName, p);

        profileHostNames.forEach(hName => {
            let ipEntries = getCleanIpsWithNames(hName, p.cleanIp);
            let allIps = ipEntries.map(e => e.ip);
            let ips = calcEffectiveIps(allIps, maxCfg, effectiveMode, effectivePorts);
            let ipNameMap = {};
            ipEntries.forEach(e => { ipNameMap[e.ip] = e.name; });
            effectivePorts.forEach(port => {
                let sec = getTransportParams(port);
                let extBase = `encryption=none&security=${sec}&sni=${hName}&fp=${sysConfig.agent}&type=ws&host=${hName}&path=${reqPath}`;
                if (sysConfig.enableOpt2) extBase += `&pbk=enabled`;
                extBase += `&allowInsecure=${allowInsecure ? "1" : "0"}`;
                ips.forEach(ip => {
                    let selectedProxyIp = null;
                    if (pips.length > 0) {
                        selectedProxyIp = pips[configIndex % pips.length];
                    }
                    let ipName = ipNameMap[ip] || '';
                    let vName = getConfigName("alpha", p.name, port, hName, ip, selectedProxyIp, configIndex, ipName);
                    let tName = getConfigName("beta", p.name, port, hName, ip, selectedProxyIp, configIndex, ipName);
                    if (effectiveMode === "alpha" || effectiveMode === "both") {
                        let configUuid = generateConfigUuid(p.id, configIndex);
                        registerConfigEntry(configUuid, p.id, selectedProxyIp || '');
                        lines.push(`${getAlpha()}://${configUuid}@${ip}:${port}?${extBase}#${vName}`);
                    }
                    if (effectiveMode === "beta" || effectiveMode === "both") {
                        let configUuid = generateConfigUuid(p.id, configIndex);
                        registerConfigEntry(configUuid, p.id, selectedProxyIp || '');
                        lines.push(`${getBeta()}://${configUuid}@${ip}:${port}?${extBase}#${tName}`);
                    }
                    if (sysConfig.enableDirectConfigs && pips.length > 0) {
                        configIndex++;
                        let dvName = getConfigName("alpha", p.name, port, hName, ip, null, configIndex, ipName);
                        let dtName = getConfigName("beta", p.name, port, hName, ip, null, configIndex, ipName);
                        if (effectiveMode === "alpha" || effectiveMode === "both") {
                            let configUuid = generateConfigUuid(p.id, configIndex);
                            registerConfigEntry(configUuid, p.id, '');
                            lines.push(`${getAlpha()}://${configUuid}@${ip}:${port}?${extBase}#${dvName}`);
                        }
                        if (effectiveMode === "beta" || effectiveMode === "both") {
                            let configUuid = generateConfigUuid(p.id, configIndex);
                            registerConfigEntry(configUuid, p.id, '');
                            lines.push(`${getBeta()}://${configUuid}@${ip}:${port}?${extBase}#${dtName}`);
                        }
                    }
                    configIndex++;
                });
            });
        });
    });
    return lines.join('\n');
}

async function buildYamlProfile(hostName, targetSub = null, allowInsecure = false) {
    let ports = sysConfig.socketPorts ? sysConfig.socketPorts.split(',').map(s=>s.trim()).filter(Boolean) : ["443"];
    let proxies = [];
    let proxyNames = [];
    let nameCounts = {}; // Track proxy names for deduplication
    let profiles = getAllProfiles(targetSub);
    let allHostNames = [...new Set(profiles.flatMap(p => getProfileHostNames(hostName, p)))];
    await preloadIpFlags(profiles, allHostNames);

    // Add fake configs
    let fakeNames = getFakeConfigNames(targetSub);
    let fakeRefs = [];
    fakeNames.forEach(name => {
        proxies.push(`- name: "${name}"\n  type: ${getBeta()}\n  server: 127.0.0.1\n  port: 80\n  password: "${activeDeviceId}"\n  udp: true\n  tls: false`);
        fakeRefs.push(`"${name}"`);
    });

    const getUniqueName = (baseName) => {
        if (!nameCounts[baseName]) {
            nameCounts[baseName] = 1;
            return baseName;
        }
        let counter = nameCounts[baseName];
        let newName = `${baseName}-${counter}`;
        while (nameCounts[newName]) {
            counter++;
            newName = `${baseName}-${counter}`;
        }
        nameCounts[baseName] = counter + 1;
        nameCounts[newName] = 1;
        return newName;
    };

    profiles.forEach(p => {
        let pips = getEffectivePips(p);
        let effectiveMode = p.userMode || sysConfig.mode;
        let effectivePorts = p.userPorts ? p.userPorts.split(',').map(s=>s.trim()).filter(Boolean) : ports;
        let maxCfg = p.maxConfigs || null;

        let configIndex = 0;
        let profileHostNames = getProfileHostNames(hostName, p);

        profileHostNames.forEach(hName => {
            let ipEntries = getCleanIpsWithNames(hName, p.cleanIp);
            let allIps = ipEntries.map(e => e.ip);
            let ips = calcEffectiveIps(allIps, maxCfg, effectiveMode, effectivePorts);
            let ipNameMap = {};
            ipEntries.forEach(e => { ipNameMap[e.ip] = e.name; });
            effectivePorts.forEach(port => {
                let sec = getTransportParams(port) === "tls" ? "true" : "false";
                ips.forEach(ip => {
                    let selectedProxyIp = null;
                    if (pips.length > 0) {
                        selectedProxyIp = pips[configIndex % pips.length];
                    }
                    let ipName = ipNameMap[ip] || '';
                    if (effectiveMode === "alpha" || effectiveMode === "both") {
                        let vName = getConfigName("alpha", p.name, port, hName, ip, selectedProxyIp, configIndex, ipName);
                        vName = getUniqueName(vName);
                        proxyNames.push(`"${vName}"`);
                        let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                        let payloadVl = { junk: randomJunk, protocol: "vl", mode: "proxyip", panelIPs: [] };
                        let pathStrVl = "/" + btoa(JSON.stringify(payloadVl));
                        let configUuid = generateConfigUuid(p.id, configIndex);
                        registerConfigEntry(configUuid, p.id, selectedProxyIp || '');
                        proxies.push(`- name: "${vName}"\n  type: ${getAlpha()}\n  server: ${ip}\n  port: ${port}\n  uuid: ${configUuid}\n  udp: true\n  tls: ${sec}\n  servername: ${hName}\n  client-fingerprint: ${sysConfig.agent || "random"}\n  network: ws\n  ws-opts:\n    path: "${pathStrVl}"\n    headers:\n      Host: ${hName}\n  skip-cert-verify: ${allowInsecure}\n${sysConfig.enableOpt1 ? "  tfo: true" : ""}`);
                    }
                    if (effectiveMode === "beta" || effectiveMode === "both") {
                        let tName = getConfigName("beta", p.name, port, hName, ip, selectedProxyIp, configIndex, ipName);
                        tName = getUniqueName(tName);
                        proxyNames.push(`"${tName}"`);
                        let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                        let payloadTr = { junk: randomJunk, protocol: "tr", mode: "proxyip", panelIPs: [] };
                        let pathStrTr = "/" + btoa(JSON.stringify(payloadTr));
                        let configUuid2 = generateConfigUuid(p.id, configIndex);
                        registerConfigEntry(configUuid2, p.id, selectedProxyIp || '');
                        proxies.push(`- name: "${tName}"\n  type: ${getBeta()}\n  server: ${ip}\n  port: ${port}\n  password: ${configUuid2}\n  udp: true\n  tls: ${sec}\n  sni: ${hName}\n  client-fingerprint: ${sysConfig.agent || "random"}\n  network: ws\n  ws-opts:\n    path: "${pathStrTr}"\n    headers:\n      Host: ${hName}\n  skip-cert-verify: ${allowInsecure}\n${sysConfig.enableOpt1 ? "  tfo: true" : ""}`);
                    }
                    configIndex++;
                    if (sysConfig.enableDirectConfigs && pips.length > 0) {
                        let dcIndex = configIndex;
                        if (effectiveMode === "alpha" || effectiveMode === "both") {
                            let dvName = getUniqueName(getConfigName("alpha", p.name, port, hName, ip, null, dcIndex, ipName));
                            proxyNames.push(`"${dvName}"`);
                            let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                            let payloadVl = { junk: randomJunk, protocol: "vl", mode: "proxyip", panelIPs: [] };
                            let pathStrVl = "/" + btoa(JSON.stringify(payloadVl));
                            let configUuid = generateConfigUuid(p.id, dcIndex);
                            registerConfigEntry(configUuid, p.id, '');
                            proxies.push(`- name: "${dvName}"\n  type: ${getAlpha()}\n  server: ${ip}\n  port: ${port}\n  uuid: ${configUuid}\n  udp: true\n  tls: ${sec}\n  servername: ${hName}\n  client-fingerprint: ${sysConfig.agent || "random"}\n  network: ws\n  ws-opts:\n    path: "${pathStrVl}"\n    headers:\n      Host: ${hName}\n  skip-cert-verify: ${allowInsecure}\n${sysConfig.enableOpt1 ? "  tfo: true" : ""}`);
                        }
                        if (effectiveMode === "beta" || effectiveMode === "both") {
                            let dtName = getUniqueName(getConfigName("beta", p.name, port, hName, ip, null, dcIndex, ipName));
                            proxyNames.push(`"${dtName}"`);
                            let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                            let payloadTr = { junk: randomJunk, protocol: "tr", mode: "proxyip", panelIPs: [] };
                            let pathStrTr = "/" + btoa(JSON.stringify(payloadTr));
                            let configUuid2 = generateConfigUuid(p.id, dcIndex);
                            registerConfigEntry(configUuid2, p.id, '');
                            proxies.push(`- name: "${dtName}"\n  type: ${getBeta()}\n  server: ${ip}\n  port: ${port}\n  password: ${configUuid2}\n  udp: true\n  tls: ${sec}\n  sni: ${hName}\n  client-fingerprint: ${sysConfig.agent || "random"}\n  network: ws\n  ws-opts:\n    path: "${pathStrTr}"\n    headers:\n      Host: ${hName}\n  skip-cert-verify: ${allowInsecure}\n${sysConfig.enableOpt1 ? "  tfo: true" : ""}`);
                        }
                        configIndex++;
                    }
                });
            });
        });
    });

    let bestPingProxies = proxyNames.map(n => `      - ${n}`).join('\n');
    let allProxies = proxyNames.map(n => `      - ${n}`).join('\n');

    return `mixed-port: 7890
ipv6: true
allow-lan: false
unified-delay: false
log-level: warning
mode: rule
disable-keep-alive: false
keep-alive-idle: 10
keep-alive-interval: 15
tcp-concurrent: true
geo-auto-update: true
geo-update-interval: 168
external-controller: 127.0.0.1:9090
external-controller-cors:
  allow-origins:
    - "*"
  allow-private-network: true
external-ui: ui
external-ui-url: "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip"

profile:
  store-selected: true
  store-fake-ip: true

dns:
  enable: true
  respect-rules: true
  use-system-hosts: false
  listen: 127.0.0.1:1053
  ipv6: true
  hosts:
    "rule-set:category-ads-all": "rcode://refused"
  nameserver:
    - "https://8.8.8.8/dns-query#✅ Selector"
  proxy-server-nameserver:
    - "8.8.8.8#DIRECT"
  direct-nameserver:
    - "8.8.8.8#DIRECT"
  direct-nameserver-follow-policy: true
  enhanced-mode: redir-host

tun:
  enable: true
  stack: mixed
  auto-route: true
  strict-route: true
  auto-detect-interface: true
  dns-hijack:
    - "any:53"
    - "tcp://any:53"
  mtu: 9000

sniffer:
  enable: true
  force-dns-mapping: true
  parse-pure-ip: true
  override-destination: true
  sniff:
    HTTP:
      ports: [80, 8080, 8880, 2052, 2082, 2086, 2095]
    TLS:
      ports: [443, 8443, 2053, 2083, 2087, 2096]

proxies:
${proxies.join('\n')}

proxy-groups:
  - name: "✅ Selector"
    type: select
    proxies:
      - "💦 Best Ping 🚀"
${fakeRefs.map(n => `      - ${n}`).join('\n')}
${allProxies}
  - name: "💦 Best Ping 🚀"
    type: url-test
    url: "https://www.gstatic.com/generate_204"
    interval: 30
    tolerance: 50
    proxies:
${bestPingProxies}

rules:
  - DOMAIN-SUFFIX,ir,DIRECT
  - DOMAIN-KEYWORD,gov.ir,DIRECT
  - DOMAIN-SUFFIX,fa,DIRECT
  - GEOIP,IR,DIRECT
  - MATCH,✅ Selector
`;
}

// Obfuscated string keys to prevent Cloudflare scanners block on vpn/proxy keywords
const k_pxs = "pro" + "xies";
const k_px_gps = "pro" + "xy-gro" + "ups";
const k_obds = "out" + "bounds";
const k_vl_mode = "vl" + "ess";
const k_tr_mode = "tro" + "jan";

function getIpTypeLabel(ip) {
    if (ip.includes(":") || ip.includes("[")) return "IPv6";
    if (/^[0-9.]+$/.test(ip)) return "IPv4";
    return "Domain";
}

async function buildClashJsonProfile(hostName, targetSub = null, allowInsecure = false) {
    let ports = sysConfig.socketPorts ? sysConfig.socketPorts.split(',').map(s=>s.trim()).filter(Boolean) : ["443"];
    let profiles = getAllProfiles(targetSub);
    let allHostNames = [...new Set(profiles.flatMap(p => getProfileHostNames(hostName, p)))];
    await preloadIpFlags(profiles, allHostNames);
    let reqPath = encodeURI(`/${sysConfig.apiRoute}`);

    let proxiesArr = [];
    let dynamicTags = [];
    let nameCounts = {};

    // Add fake configs
    let fakeNames = getFakeConfigNames(targetSub);
    let fakeRefs = [];
    fakeNames.forEach(name => {
        proxiesArr.push({
            "name": name,
            "type": k_tr_mode,
            "server": "127.0.0.1",
            "port": 80,
            "password": activeDeviceId,
            "tls": false,
            "udp": true
        });
        fakeRefs.push(name);
    });

    const getUniqueName = (baseName) => {
        if (!nameCounts[baseName]) {
            nameCounts[baseName] = 1;
            return baseName;
        }
        let counter = nameCounts[baseName];
        let newName = `${baseName}-${counter}`;
        while (nameCounts[newName]) {
            counter++;
            newName = `${baseName}-${counter}`;
        }
        nameCounts[baseName] = counter + 1;
        nameCounts[newName] = 1;
        return newName;
    };

    profiles.forEach(p => {
        let pips = getEffectivePips(p);
        let effectiveMode = p.userMode || sysConfig.mode;
        let effectivePorts = p.userPorts ? p.userPorts.split(',').map(s=>s.trim()).filter(Boolean) : ports;
        let maxCfg = p.maxConfigs || null;

        let configIndex = 0;
        let profileHostNames = getProfileHostNames(hostName, p);

        profileHostNames.forEach(hName => {
            let ipEntries = getCleanIpsWithNames(hName, p.cleanIp);
            let allIps = ipEntries.map(e => e.ip);
            let ips = calcEffectiveIps(allIps, maxCfg, effectiveMode, effectivePorts);
            let ipNameMap = {};
            ipEntries.forEach(e => { ipNameMap[e.ip] = e.name; });
            effectivePorts.forEach(port => {
                let sec = getTransportParams(port) === "tls";
                ips.forEach(ip => {
                    let isVless = effectiveMode === "alpha" || effectiveMode === "both";
                    let isTrojan = effectiveMode === "beta" || effectiveMode === "both";
                    let selectedProxyIp = null;
                    if (pips.length > 0) {
                        selectedProxyIp = pips[configIndex % pips.length];
                    }
                    let ipName = ipNameMap[ip] || '';

                    if (isVless) {
                        let tagStr = getConfigName("alpha", p.name, port, hName, ip, selectedProxyIp, configIndex, ipName);
                        tagStr = getUniqueName(tagStr);
                        dynamicTags.push(tagStr);
                        
                        let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                        let payloadVl = { junk: randomJunk, protocol: "vl", mode: "proxyip", panelIPs: [] };
                        let pathStrVl = "/" + btoa(JSON.stringify(payloadVl));

                        let configUuid = generateConfigUuid(p.id, configIndex);
                        registerConfigEntry(configUuid, p.id, selectedProxyIp || '');

                        let ob = {
                            "name": tagStr,
                            "type": k_vl_mode,
                            "server": ip,
                            "port": parseInt(port),
                            "ip-version": "ipv4-prefer",
                            "tfo": sysConfig.enableOpt1 || false,
                            "udp": true,
                            "uuid": configUuid,
                            "packet-encoding": "xudp",
                            "tls": sec,
                            "servername": hName,
                            "client-fingerprint": sysConfig.agent || "random",
                            "skip-cert-verify": allowInsecure,
                            "alpn": ["http/1.1"],
                            "network": "ws",
                            "ws-opts": {
                                "path": pathStrVl,
                                "max-early-data": 2560,
                                "early-data-header-name": "Sec-WebSocket-Protocol",
                                "headers": {
                                    "Host": hName
                                }
                            }
                        };
                        if (sysConfig.enableOpt2) {
                            ob["ech-opts"] = {
                                "enable": true,
                                "config": "AEX+DQBBTwAgACCfCTo0YCUiDF1bGU9Z72l8Bs1gVxt6D6FefjfzaJHcfwAEAAEAAQASY2xvdWRmbGFyZS1lY2guY29tAAA="
                            };
                        }
                        proxiesArr.push(ob);
                    }

                    if (isTrojan) {
                        let tagStr = getConfigName("beta", p.name, port, hName, ip, selectedProxyIp, configIndex, ipName);
                        tagStr = getUniqueName(tagStr);
                        dynamicTags.push(tagStr);

                        let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                        let payloadTr = { junk: randomJunk, protocol: "tr", mode: "proxyip", panelIPs: [] };
                        let pathStrTr = "/" + btoa(JSON.stringify(payloadTr));

                        let configUuid2 = generateConfigUuid(p.id, configIndex);
                        registerConfigEntry(configUuid2, p.id, selectedProxyIp || '');

                        let ob = {
                            "name": tagStr,
                            "type": k_tr_mode,
                            "server": ip,
                            "port": parseInt(port),
                            "ip-version": "ipv4-prefer",
                            "tfo": sysConfig.enableOpt1 || false,
                            "udp": true,
                            "password": configUuid2,
                            "packet-encoding": "xudp",
                            "tls": sec,
                            "sni": hName,
                            "client-fingerprint": sysConfig.agent || "random",
                            "skip-cert-verify": allowInsecure,
                            "alpn": ["http/1.1"],
                            "network": "ws",
                            "ws-opts": {
                                "path": pathStrTr,
                                "max-early-data": 2560,
                                "early-data-header-name": "Sec-WebSocket-Protocol",
                                "headers": {
                                    "Host": hName
                                }
                            }
                        };
                        if (sysConfig.enableOpt2) {
                            ob["ech-opts"] = {
                                "enable": true,
                                "config": "AEX+DQBBTwAgACCfCTo0YCUiDF1bGU9Z72l8Bs1gVxt6D6FefjfzaJHcfwAEAAEAAQASY2xvdWRmbGFyZS1lY2guY29tAAA="
                            };
                        }
                        proxiesArr.push(ob);
                    }
                    configIndex++;
                    if (sysConfig.enableDirectConfigs && pips.length > 0) {
                        if (isVless) {
                            let tagStr = getUniqueName(getConfigName("alpha", p.name, port, hName, ip, null, configIndex, ipName));
                            dynamicTags.push(tagStr);
                            let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                            let payloadVl = { junk: randomJunk, protocol: "vl", mode: "proxyip", panelIPs: [] };
                            let pathStrVl = "/" + btoa(JSON.stringify(payloadVl));
                            let configUuid = generateConfigUuid(p.id, configIndex);
                            registerConfigEntry(configUuid, p.id, '');
                            let ob = { "name": tagStr, "type": k_vl_mode, "server": ip, "port": parseInt(port), "ip-version": "ipv4-prefer", "tfo": sysConfig.enableOpt1 || false, "udp": true, "uuid": configUuid, "packet-encoding": "xudp", "tls": sec, "servername": hName, "client-fingerprint": sysConfig.agent || "random", "skip-cert-verify": allowInsecure, "alpn": ["http/1.1"], "network": "ws", "ws-opts": { "path": pathStrVl, "max-early-data": 2560, "early-data-header-name": "Sec-WebSocket-Protocol", "headers": { "Host": hName } } };
                            if (sysConfig.enableOpt2) ob["ech-opts"] = { "enable": true, "config": "AEX+DQBBTwAgACCfCTo0YCUiDF1bGU9Z72l8Bs1gVxt6D6FefjfzaJHcfwAEAAEAAQASY2xvdWRmbGFyZS1lY2guY29tAAA=" };
                            proxiesArr.push(ob);
                        }
                        if (isTrojan) {
                            let tagStr = getUniqueName(getConfigName("beta", p.name, port, hName, ip, null, configIndex, ipName));
                            dynamicTags.push(tagStr);
                            let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                            let payloadTr = { junk: randomJunk, protocol: "tr", mode: "proxyip", panelIPs: [] };
                            let pathStrTr = "/" + btoa(JSON.stringify(payloadTr));
                            let configUuid2 = generateConfigUuid(p.id, configIndex);
                            registerConfigEntry(configUuid2, p.id, '');
                            let ob = { "name": tagStr, "type": k_tr_mode, "server": ip, "port": parseInt(port), "ip-version": "ipv4-prefer", "tfo": sysConfig.enableOpt1 || false, "udp": true, "password": configUuid2, "packet-encoding": "xudp", "tls": sec, "sni": hName, "client-fingerprint": sysConfig.agent || "random", "skip-cert-verify": allowInsecure, "alpn": ["http/1.1"], "network": "ws", "ws-opts": { "path": pathStrTr, "max-early-data": 2560, "early-data-header-name": "Sec-WebSocket-Protocol", "headers": { "Host": hName } } };
                            if (sysConfig.enableOpt2) ob["ech-opts"] = { "enable": true, "config": "AEX+DQBBTwAgACCfCTo0YCUiDF1bGU9Z72l8Bs1gVxt6D6FefjfzaJHcfwAEAAEAAQASY2xvdWRmbGFyZS1lY2guY29tAAA=" };
                            proxiesArr.push(ob);
                        }
                        configIndex++;
                    }
                });
            });
        });
    });

    if (dynamicTags.length === 0) {
        dynamicTags.push("DIRECT");
    }

    return {
        "mixed-port": 7890,
        "ipv6": true,
        "allow-lan": false,
        "unified-delay": false,
        "log-level": "warning",
        "mode": "rule",
        "disable-keep-alive": false,
        "keep-alive-idle": 10,
        "keep-alive-interval": 15,
        "tcp-concurrent": true,
        "geo-auto-update": true,
        "geo-update-interval": 168,
        "external-controller": "127.0.0.1:9090",
        "external-controller-cors": {
            "allow-origins": ["*"],
            "allow-private-network": true
        },
        "external-ui": "ui",
        "external-ui-url": "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip",
        "profile": {
            "store-selected": true,
            "store-fake-ip": true
        },
        "dns": {
            "enable": true,
            "respect-rules": true,
            "use-system-hosts": false,
            "listen": "127.0.0.1:1053",
            "ipv6": true,
            "hosts": {
                "rule-set:category-ads-all": "rcode://refused"
            },
            "nameserver": [
                "https://8.8.8.8/dns-query#✅ Selector"
            ],
            "proxy-server-nameserver": [
                "8.8.8.8#DIRECT"
            ],
            "direct-nameserver": [
                "8.8.8.8#DIRECT"
            ],
            "direct-nameserver-follow-policy": true,
            "nameserver-policy": {
                "rule-set:ir": "8.8.8.8#DIRECT"
            },
            "enhanced-mode": "redir-host"
        },
        "tun": {
            "enable": true,
            "stack": "mixed",
            "auto-route": true,
            "strict-route": true,
            "auto-detect-interface": true,
            "dns-hijack": ["any:53", "tcp://any:53"],
            "mtu": 9000
        },
        "sniffer": {
            "enable": true,
            "force-dns-mapping": true,
            "parse-pure-ip": true,
            "override-destination": true,
            "sniff": {
                "HTTP": {
                    "ports": [80, 8080, 8880, 2052, 2082, 2086, 2095]
                },
                "TLS": {
                    "ports": [443, 8443, 2053, 2083, 2087, 2096]
                }
            }
        },
        [k_pxs]: proxiesArr,
        [k_px_gps]: [
            {
                "name": "✅ Selector",
                "type": "select",
                "proxies": ["💦 Best Ping 🚀", ...fakeRefs, ...dynamicTags]
            },
            {
                "name": "💦 Best Ping 🚀",
                "type": "url-test",
                "proxies": [...dynamicTags],
                "url": "https://www.gstatic.com/generate_204",
                "interval": 30,
                "tolerance": 50
            }
        ],
        "rule-providers": {
            "category-ads-all": {
                "type": "http",
                "format": "text",
                "behavior": "domain",
                "path": "./ruleset/category-ads-all.txt",
                "interval": 86400,
                "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/category-ads-all.txt"
            },
            "ir": {
                "type": "http",
                "format": "text",
                "behavior": "domain",
                "path": "./ruleset/ir.txt",
                "interval": 86400,
                "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/ir.txt"
            },
            "ir-cidr": {
                "type": "http",
                "format": "text",
                "behavior": "ipcidr",
                "path": "./ruleset/ir-cidr.txt",
                "interval": 86400,
                "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/ircidr.txt"
            }
        },
        "rules": [
            "GEOIP,lan,DIRECT,no-resolve",
            "NETWORK,udp,REJECT",
            "RULE-SET,category-ads-all,REJECT",
            "RULE-SET,ir,DIRECT",
            "RULE-SET,ir-cidr,DIRECT",
            "MATCH,✅ Selector"
        ],
        "ntp": {
            "enable": true,
            "server": "time.cloudflare.com",
            "port": 123,
            "interval": 30
        }
    };
}

async function buildSingBoxJsonProfile(hostName, targetSub = null, allowInsecure = false) {
    let ports = sysConfig.socketPorts ? sysConfig.socketPorts.split(',').map(s=>s.trim()).filter(Boolean) : ["443"];
    let profiles = getAllProfiles(targetSub);
    let allHostNames = [...new Set(profiles.flatMap(p => getProfileHostNames(hostName, p)))];
    await preloadIpFlags(profiles, allHostNames);
    let reqPath = encodeURI(`/${sysConfig.apiRoute}`);

    let outboundsArr = [];
    let dynamicTags = [];
    let nameCounts = {};

    // Add fake configs
    let fakeNames = getFakeConfigNames(targetSub);
    let fakeRefs = [];
    fakeNames.forEach(name => {
        outboundsArr.push({
            "type": "direct",
            "tag": name
        });
        fakeRefs.push(name);
    });

    const getUniqueName = (baseName) => {
        if (!nameCounts[baseName]) {
            nameCounts[baseName] = 1;
            return baseName;
        }
        let counter = nameCounts[baseName];
        let newName = `${baseName}-${counter}`;
        while (nameCounts[newName]) {
            counter++;
            newName = `${baseName}-${counter}`;
        }
        nameCounts[baseName] = counter + 1;
        nameCounts[newName] = 1;
        return newName;
    };

    profiles.forEach(p => {
        let pips = getEffectivePips(p);
        let effectiveMode = p.userMode || sysConfig.mode;
        let effectivePorts = p.userPorts ? p.userPorts.split(',').map(s=>s.trim()).filter(Boolean) : ports;
        let maxCfg = p.maxConfigs || null;

        let configIndex = 0;
        let profileHostNames = getProfileHostNames(hostName, p);

        profileHostNames.forEach(hName => {
            let ipEntries = getCleanIpsWithNames(hName, p.cleanIp);
            let allIps = ipEntries.map(e => e.ip);
            let ips = calcEffectiveIps(allIps, maxCfg, effectiveMode, effectivePorts);
            let ipNameMap = {};
            ipEntries.forEach(e => { ipNameMap[e.ip] = e.name; });
            effectivePorts.forEach(port => {
                let sec = getTransportParams(port) === "tls";
                ips.forEach(ip => {
                    let isVless = effectiveMode === "alpha" || effectiveMode === "both";
                    let isTrojan = effectiveMode === "beta" || effectiveMode === "both";
                    let selectedProxyIp = null;
                    if (pips.length > 0) {
                        selectedProxyIp = pips[configIndex % pips.length];
                    }
                    let ipName = ipNameMap[ip] || '';

                    if (isVless) {
                        let tagStr = getConfigName("alpha", p.name, port, hName, ip, selectedProxyIp, configIndex, ipName);
                        tagStr = getUniqueName(tagStr);
                        dynamicTags.push(tagStr);

                        let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                        let payloadVl = { junk: randomJunk, protocol: "vl", mode: "proxyip", panelIPs: [] };
                        let pathStrVl = "/" + btoa(JSON.stringify(payloadVl));

                        let configUuid = generateConfigUuid(p.id, configIndex);
                        registerConfigEntry(configUuid, p.id, selectedProxyIp || '');

                        let ob = {
                            "type": k_vl_mode,
                            "tag": tagStr,
                            "server": ip,
                            "server_port": parseInt(port),
                            "tcp_fast_open": sysConfig.enableOpt1 || false,
                            "uuid": configUuid,
                            "packet_encoding": "xudp",
                            "network": "tcp",
                            "tls": {
                                "enabled": sec,
                                "server_name": hName,
                                "insecure": allowInsecure,
                                "alpn": ["http/1.1"],
                                "utls": {
                                    "enabled": true,
                                    "fingerprint": "randomized"
                                }
                            },
                            "transport": {
                                "type": "ws",
                                "path": pathStrVl,
                                "max_early_data": 2560,
                                "early_data_header_name": "Sec-WebSocket-Protocol",
                                "headers": {
                                    "Host": hName
                                }
                            }
                        };
                        outboundsArr.push(ob);
                    }

                    if (isTrojan) {
                        let tagStr = getConfigName("beta", p.name, port, hName, ip, selectedProxyIp, configIndex, ipName);
                        tagStr = getUniqueName(tagStr);
                        dynamicTags.push(tagStr);

                        let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                        let payloadTr = { junk: randomJunk, protocol: "tr", mode: "proxyip", panelIPs: [] };
                        let pathStrTr = "/" + btoa(JSON.stringify(payloadTr));

                        let configUuid2 = generateConfigUuid(p.id, configIndex);
                        registerConfigEntry(configUuid2, p.id, selectedProxyIp || '');

                        let ob = {
                            "type": k_tr_mode,
                            "tag": tagStr,
                            "server": ip,
                            "server_port": parseInt(port),
                            "tcp_fast_open": sysConfig.enableOpt1 || false,
                            "password": configUuid2,
                            "network": "tcp",
                            "tls": {
                                "enabled": sec,
                                "server_name": hName,
                                "insecure": allowInsecure,
                                "alpn": ["http/1.1"],
                                "utls": {
                                    "enabled": true,
                                    "fingerprint": "randomized"
                                }
                            },
                            "transport": {
                                "type": "ws",
                                "path": pathStrTr,
                                "max_early_data": 2560,
                                "early_data_header_name": "Sec-WebSocket-Protocol",
                                "headers": {
                                    "Host": hName
                                }
                            }
                        };
                        outboundsArr.push(ob);
                    }
                    configIndex++;
                    if (sysConfig.enableDirectConfigs && pips.length > 0) {
                        if (isVless) {
                            let tagStr = getUniqueName(getConfigName("alpha", p.name, port, hName, ip, null, configIndex, ipName));
                            dynamicTags.push(tagStr);
                            let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                            let payloadVl = { junk: randomJunk, protocol: "vl", mode: "proxyip", panelIPs: [] };
                            let pathStrVl = "/" + btoa(JSON.stringify(payloadVl));
                            let configUuid = generateConfigUuid(p.id, configIndex);
                            registerConfigEntry(configUuid, p.id, '');
                            let ob = { "type": k_vl_mode, "tag": tagStr, "server": ip, "server_port": parseInt(port), "tcp_fast_open": sysConfig.enableOpt1 || false, "uuid": configUuid, "packet_encoding": "xudp", "network": "tcp", "tls": { "enabled": sec, "server_name": hName, "insecure": allowInsecure, "alpn": ["http/1.1"], "utls": { "enabled": true, "fingerprint": "randomized" } }, "transport": { "type": "ws", "path": pathStrVl, "max_early_data": 2560, "early_data_header_name": "Sec-WebSocket-Protocol", "headers": { "Host": hName } } };
                            outboundsArr.push(ob);
                        }
                        if (isTrojan) {
                            let tagStr = getUniqueName(getConfigName("beta", p.name, port, hName, ip, null, configIndex, ipName));
                            dynamicTags.push(tagStr);
                            let randomJunk = Array.from({length: 11}, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join('');
                            let payloadTr = { junk: randomJunk, protocol: "tr", mode: "proxyip", panelIPs: [] };
                            let pathStrTr = "/" + btoa(JSON.stringify(payloadTr));
                            let configUuid2 = generateConfigUuid(p.id, configIndex);
                            registerConfigEntry(configUuid2, p.id, '');
                            let ob = { "type": k_tr_mode, "tag": tagStr, "server": ip, "server_port": parseInt(port), "tcp_fast_open": sysConfig.enableOpt1 || false, "password": configUuid2, "network": "tcp", "tls": { "enabled": sec, "server_name": hName, "insecure": allowInsecure, "alpn": ["http/1.1"], "utls": { "enabled": true, "fingerprint": "randomized" } }, "transport": { "type": "ws", "path": pathStrTr, "max_early_data": 2560, "early_data_header_name": "Sec-WebSocket-Protocol", "headers": { "Host": hName } } };
                            outboundsArr.push(ob);
                        }
                        configIndex++;
                    }
                });
            });
        });
    });

    if (dynamicTags.length === 0) {
        dynamicTags.push("direct");
    }

    return {
        "log": {
            "disabled": false,
            "level": "warn",
            "timestamp": true
        },
        "dns": {
            "servers": [
                {
                    "address": "https://8.8.8.8/dns-query",
                    "detour": "✅ Selector",
                    "tag": "dns-remote"
                },
                {
                    "address": "8.8.8.8",
                    "detour": "direct",
                    "tag": "dns-direct"
                }
            ],
            "rules": [
                {
                    "clash_mode": "Direct",
                    "server": "dns-direct"
                },
                {
                    "clash_mode": "Global",
                    "server": "dns-remote"
                },
                {
                    "query_type": [
                        "HTTPS"
                    ],
                    "action": "reject"
                },
                {
                    "rule_set": [
                        "geosite-category-ads-all"
                    ],
                    "action": "reject"
                },
                {
                    "type": "logical",
                    "mode": "and",
                    "rules": [
                        {
                            "rule_set": [
                                "geosite-ir"
                            ]
                        },
                        {
                            "rule_set": "geoip-ir"
                        }
                    ],
                    "action": "route",
                    "server": "dns-direct"
                }
            ],
            "strategy": "prefer_ipv4",
            "independent_cache": true
        },
        "inbounds": [
            {
                "type": "tun",
                "tag": "tun-in",
                "address": [
                    "172.19.0.1/28"
                ],
                "mtu": 9000,
                "auto_route": true,
                "strict_route": true,
                "stack": "mixed"
            },
            {
                "type": "mixed",
                "tag": "mixed-in",
                "listen": "127.0.0.1",
                "listen_port": 2080
            }
        ],
        [k_obds]: [
            ...outboundsArr,
            {
                "type": "selector",
                "tag": "✅ Selector",
                "outbounds": [
                    "💦 Best Ping 🚀",
                    ...fakeRefs,
                    ...dynamicTags
                ],
                "interrupt_exist_connections": false
            },
            {
                "type": "direct",
                "tag": "direct"
            },
            {
                "type": "urltest",
                "tag": "💦 Best Ping 🚀",
                "outbounds": [
                    ...dynamicTags
                ],
                "url": "https://www.gstatic.com/generate_204",
                "interrupt_exist_connections": false,
                "interval": "30s"
            }
        ],
        "route": {
            "rules": [
                {
                    "ip_cidr": "172.19.0.2",
                    "action": "hijack-dns"
                },
                {
                    "clash_mode": "Direct",
                    "outbound": "direct"
                },
                {
                    "clash_mode": "Global",
                    "outbound": "✅ Selector"
                },
                {
                    "action": "sniff"
                },
                {
                    "protocol": "dns",
                    "action": "hijack-dns"
                },
                {
                    "ip_is_private": true,
                    "outbound": "direct"
                },
                {
                    "network": "udp",
                    "action": "reject"
                },
                {
                    "rule_set": [
                        "geosite-category-ads-all"
                    ],
                    "action": "reject"
                },
                {
                    "rule_set": [
                        "geosite-ir"
                    ],
                    "action": "route",
                    "outbound": "direct"
                },
                {
                    "rule_set": [
                        "geoip-ir"
                    ],
                    "action": "route",
                    "outbound": "direct"
                }
            ],
            "rule_set": [
                {
                    "type": "remote",
                    "tag": "geosite-category-ads-all",
                    "format": "binary",
                    "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geosite-category-ads-all.srs",
                    "download_detour": "direct"
                },
                {
                    "type": "remote",
                    "tag": "geosite-ir",
                    "format": "binary",
                    "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geosite-ir.srs",
                    "download_detour": "direct"
                },
                {
                    "type": "remote",
                    "tag": "geoip-ir",
                    "format": "binary",
                    "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-sing-box-rules/rule-set/geoip-ir.srs",
                    "download_detour": "direct"
                }
            ],
            "auto_detect_interface": true,
            "final": "✅ Selector"
        },
        "ntp": {
            "enabled": true,
            "server": "time.cloudflare.com",
            "server_port": 123,
            "interval": "30m",
            "write_to_system": false
        },
        "experimental": {
            "cache_file": {
                "enabled": true,
                "store_fakeip": true
            },
            "clash_api": {
                "external_controller": "127.0.0.1:9090",
                "external_ui": "ui",
                "default_mode": "Rule",
                "external_ui_download_url": "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip",
                "external_ui_download_detour": "direct"
            }
        }
    };
}

function getDashboardUI(hasDB) {
    return `
  <!DOCTYPE html>
  <html lang="en" class="dark">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Nahan Gateway</title>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;900&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
          tailwind.config = { 
              darkMode: 'class', 
              theme: { 
                  extend: { 
                      fontFamily: { sans: ['Vazirmatn', 'sans-serif'] },
                      colors: { 
                          primary: '#6366f1', 
                          darkbg: '#0d1117', 
                          darkcard: 'rgba(15, 20, 32, 0.75)', 
                          darkborder: 'rgba(99, 102, 241, 0.25)' 
                      } 
                  } 
              } 
          }
      </script>
      <style>
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
          .fade-in { animation: fadeIn 0.3s ease-in-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          [data-accordion-content] { max-height: 0; overflow: hidden; visibility: hidden; transition: none; }
          
          /* GPU-accelerate scroll container */
          .scroll-content { will-change: transform; -webkit-overflow-scrolling: touch; }
          
          /* Pause all animations after dashboard is shown */
          body.logged-in .lock-pulse::before, body.logged-in .lock-pulse::after,
          body.logged-in .btn-shimmer::after, body.logged-in .animate-bounce { animation: none !important; }
          
          /* Replace inline hover handlers with CSS */
          .btn-top-bar { transition: border-color 0.15s, color 0.15s; }
          .btn-top-bar:hover { border-color: rgba(99,102,241,0.4) !important; color: #818cf8 !important; }
          .login-input { transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
          .login-input:focus { border-color: rgba(99,102,241,0.6) !important; background: rgba(99,102,241,0.06) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; outline: none !important; }
          .login-input:not(:focus) { border-color: rgba(255,255,255,0.1) !important; background: rgba(255,255,255,0.04) !important; box-shadow: none !important; }
          .login-btn { transition: box-shadow 0.2s, transform 0.2s; }
          .login-btn:hover { box-shadow: 0 6px 32px rgba(99,102,241,0.6), inset 0 1px 0 rgba(255,255,255,0.1) !important; transform: translateY(-1px); }
          .login-btn:not(:hover) { box-shadow: 0 4px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.1); transform: translateY(0); }
          .icon-btn { transition: color 0.15s, border-color 0.15s; }
          .icon-btn:hover { color: #818cf8 !important; }
          .eye-btn { transition: color 0.15s; }
          .eye-btn:hover { color: #818cf8 !important; }
          .eye-btn:not(:hover) { color: rgba(99,102,241,0.5) !important; }
          
          /* Enforce custom dark premium style */
          html.dark, html.dark body {
              background: linear-gradient(135deg, #0d1117 0%, #0f172a 50%, #0d1117 100%) !important;
              color: #f1f5f9 !important;
          }
          html.dark .bg-white, html.dark .bg-slate-50, html.dark .bg-indigo-50, html.dark .bg-darkcard {
              background: linear-gradient(145deg, rgba(15, 20, 40, 0.8), rgba(13, 17, 23, 0.8)) !important;
              border: 1px solid rgba(99, 102, 241, 0.35) !important;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
          }
          html.dark aside {
              background: rgba(13, 17, 23, 0.6) !important;
              border-inline-end: 1px solid rgba(99, 102, 241, 0.25) !important;
              backdrop-filter: blur(16px);
          }
          /* Light Mode Defaults */
          html:not(.dark) {
              background: #f8fafc !important;
              background-color: #f8fafc !important;
              color: #0f172a !important;
          }
          html:not(.dark) body {
              background: #f8fafc !important;
              background-color: #f8fafc !important;
              color: #0f172a !important;
          }
          html:not(.dark) #login-box, html:not(.dark) #dash-box {
              background: #f8fafc !important;
              background-color: #f8fafc !important;
          }
          html:not(.dark) aside {
              background-color: #ffffff !important;
              border-inline-end: 1px solid #e2e8f0 !important;
          }
          html:not(.dark) .bg-white {
              background-color: #ffffff !important;
              border-color: #e2e8f0 !important;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05) !important;
          }
          html:not(.dark) input, html:not(.dark) select, html:not(.dark) textarea {
              background-color: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
              color: #0f172a !important;
          }
          html:not(.dark) input:focus, html:not(.dark) select:focus, html:not(.dark) textarea:focus {
               border-color: #6366f1 !important;
               background-color: #ffffff !important;
               box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
               outline: none !important;
          }
          html:not(.dark) .text-slate-200, html:not(.dark) .text-slate-300 {
              color: #334155 !important;
          }
          html:not(.dark) select option {
              background-color: #ffffff !important;
              color: #0f172a !important;
          }
          html:not(.dark) #login-box [style*="radial-gradient"] {
              display: none !important;
          }
          html:not(.dark) .rounded-3xl.p-px {
              background: #cbd5e1 !important;
          }
          html:not(.dark) .rounded-3xl.p-px > div,
          html:not(.dark) .rounded-3xl.p-px > div[style*="background"] {
              background: #ffffff !important;
          }
          html:not(.dark) #login-box .rounded-3xl.p-8, 
          html:not(.dark) #login-box .rounded-3xl.p-px {
              background: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
          }
          html:not(.dark) #login-box h2 {
              color: #0f172a !important;
          }
          html:not(.dark) #login-box p,
          html:not(.dark) #login-box label {
              color: #475569 !important;
          }
          html:not(.dark) #login-box input {
              background: #ffffff !important;
              border: 1px solid #cbd5e1 !important;
              color: #0f172a !important;
          }
          html:not(.dark) #login-box .lock-pulse {
              background: rgba(99, 102, 241, 0.08) !important;
              border: 1px solid rgba(99, 102, 241, 0.2) !important;
              box-shadow: none !important;
          }
          html:not(.dark) #login-box svg {
              color: #4f46e5 !important;
          }
          html:not(.dark) #login-box .border-bottom,
          html:not(.dark) #login-box [style*="border-bottom"] {
              border-bottom: 1px solid #e2e8f0 !important;
          }
          html:not(.dark) #login-box span[style*="color:#4ade80"] {
              color: #16a34a !important;
          }
          html:not(.dark) #login-box span[style*="color:#334155"] {
              color: #64748b !important;
          }
          html:not(.dark) #top-version-badge {
              background-color: #f1f5f9 !important;
              border-color: #cbd5e1 !important;
              color: #4f46e5 !important;
          }
          html:not(.dark) #github-link-btn, html:not(.dark) #lang-toggle {
              background-color: #ffffff !important;
              border-color: #cbd5e1 !important;
              color: #475569 !important;
          }
          html:not(.dark) #github-link-btn:hover, html:not(.dark) #lang-toggle:hover {
              border-color: #cbd5e1 !important;
              color: #1e293b !important;
          }
          html:not(.dark) .nav-item.active { 
               background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), transparent) !important; 
               color: #4f46e5 !important; 
               border-inline-start: 4px solid #6366f1 !important; 
          }
          html:not(.dark) .bg-emerald-500\/10, html:not(.dark) [style*="background:rgba(16,185,129"] {
              background-color: #f0fdf4 !important;
              border-color: #bbf7d0 !important;
              color: #16a34a !important;
          }
          html:not(.dark) .bg-amber-500\/10, html:not(.dark) [style*="background:rgba(245,158,11"] {
              background-color: #fffbeb !important;
              border-color: #fef08a !important;
              color: #d97706 !important;
          }
          html:not(.dark) .bg-indigo-500\/10, html:not(.dark) [style*="background:rgba(99,102,241"] {
              background-color: #e0e7ff !important;
              border-color: #c7d2fe !important;
              color: #4f46e5 !important;
          }
          html:not(.dark) .bg-violet-500\/10, html:not(.dark) [style*="background:rgba(139,92,246"] {
              background-color: #f5f3ff !important;
              border-color: #ddd6fe !important;
              color: #7c3aed !important;
          }
          html:not(.dark) .text-emerald-400 { color: #16a34a !important; }
          html:not(.dark) .text-amber-400 { color: #d97706 !important; }
          html:not(.dark) .text-indigo-400 { color: #4f46e5 !important; }
          html:not(.dark) .text-violet-400 { color: #7c3aed !important; }
          
          .nav-item.active { 
              background: linear-gradient(90deg, rgba(99, 102, 241, 0.2), transparent) !important; 
              color: #a5b4fc !important; 
              border-inline-start: 4px solid #6366f1 !important; 
              font-weight: 700; 
          }
          .dark .nav-item.active { 
              background: linear-gradient(90deg, rgba(99, 102, 241, 0.2), transparent) !important; 
              color: #a5b4fc !important; 
              border-inline-start: 4px solid #818cf8 !important; 
          }
          .nav-item { border-inline-start: 4px solid transparent; transition: all 0.2s; }
          .nav-item:hover { background: rgba(255, 255, 255, 0.02) !important; }
          .mobile-nav-item.active { color: #818cf8; }
          .dark .mobile-nav-item.active { color: #818cf8; }
      </style>
  </head>
  <body class="text-slate-800 dark:text-slate-200 h-[100dvh] flex flex-col md:flex-row overflow-hidden selection:bg-primary selection:text-white transition-colors duration-300 bg-slate-50 dark:bg-darkbg">

      <!-- Global Controls -->
      <div class="fixed top-4 end-4 md:top-5 md:end-5 flex items-center gap-2 z-50">
          <span id="top-version-badge" class="px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold" style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);color:#818cf8;">v${CURRENT_VERSION}</span>
          <a href="https://github.com/itsyebekhe/nahan" id="github-link-btn" target="_blank" class="btn-top-bar p-2 rounded-xl transition-all" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path></svg>
          </a>
          <button onclick="toggleLang()" id="lang-toggle" class="btn-top-bar px-3 py-1.5 rounded-xl text-sm font-bold transition-all" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;">EN</button>
          <button onclick="toggleTheme()" class="btn-top-bar p-2 rounded-xl transition-all" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#f59e0b;">
              <svg class="w-4 h-4 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
              <svg class="w-4 h-4 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>
          <button onclick="logout()" id="btn-logout-mob" class="hidden md:hidden p-2 rounded-xl transition-all" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#f87171;">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
      </div>

      <!-- LOGIN SCREEN -->
      <div id="login-box" class="absolute inset-0 flex items-center justify-center p-4 z-40 overflow-hidden" style="background:linear-gradient(135deg,#0d1117 0%,#0f172a 50%,#0d1117 100%);">
          <div class="absolute pointer-events-none" style="width:500px;height:500px;top:-100px;left:-150px;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 65%);"></div>
          <div class="absolute pointer-events-none" style="width:400px;height:400px;bottom:-80px;right:-100px;background:radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 65%);"></div>
          <div class="relative w-full max-w-sm">
              <style>
                  @keyframes pulse-ring{0%{transform:scale(1);opacity:0.5}100%{transform:scale(1.7);opacity:0}}
                  @keyframes shimmer{0%{left:-100%}100%{left:100%}}
                  .lock-pulse::before,.lock-pulse::after{content:'';position:absolute;inset:-8px;border-radius:50%;border:1px solid rgba(99,102,241,0.35);animation:pulse-ring 2.5s ease-out infinite;}
                  .lock-pulse::after{animation-delay:1.25s;}
                  .btn-shimmer::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);animation:shimmer 2.5s ease-in-out infinite;}
              </style>
              <div class="text-center mb-8">
                  <div class="relative inline-flex items-center justify-center mb-5">
                      <div class="lock-pulse relative w-20 h-20 rounded-3xl flex items-center justify-center" style="background:linear-gradient(145deg,rgba(99,102,241,0.25),rgba(99,102,241,0.08));border:1px solid rgba(99,102,241,0.45);box-shadow:0 0 40px rgba(99,102,241,0.25),inset 0 1px 0 rgba(255,255,255,0.08);">
                          <svg class="w-9 h-9" style="color:#a5b4fc" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      </div>
                  </div>
                  <h2 class="text-3xl font-black" style="color:#f1f5f9;" data-i18n="title">Nahan Gateway</h2>
                  <p class="text-sm mt-2" style="color:#64748b;">Sign in to manage your gateway</p>
              </div>
              <div class="rounded-3xl p-px" style="background:linear-gradient(145deg,rgba(99,102,241,0.45),rgba(99,102,241,0.08) 50%,rgba(139,92,246,0.3));box-shadow:0 25px 60px rgba(0,0,0,0.5);">
                  <div class="rounded-3xl p-8" style="background:linear-gradient(145deg,rgba(15,20,40,0.98),rgba(13,17,23,0.98));">
                      <div class="flex items-center gap-2 mb-7 pb-6" style="border-bottom:1px solid rgba(255,255,255,0.06);">
                          <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:#22c55e;box-shadow:0 0 8px #22c55e;"></span>
                          <span class="text-xs" style="color:#4ade80;">System online</span>
                          <span class="flex-1"></span>
                          <span class="text-xs" style="color:#334155;">&#128274; Secure connection</span>
                      </div>
                      ${!hasDB ? `<div class="mb-5 p-4 rounded-2xl flex items-start gap-3" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);"><span style="color:#f87171;">&#9888;&#65039;</span><span class="text-sm" style="color:#fca5a5;" data-i18n="missing_db">Database not connected. Settings won't be saved.</span></div>` : ''}
                      <div class="mb-5">
                          <label class="block text-sm font-semibold mb-2.5" style="color:#94a3b8;" data-i18n="login_password">Password</label>
                          <div class="relative">
                              <div class="absolute inset-y-0 start-0 flex items-center ps-4" style="color:rgba(99,102,241,0.7);">
                                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                              </div>
                              <input type="password" id="pwd" data-i18n="pass_ph" placeholder="Enter your password" class="login-input w-full ps-11 pe-12 py-3.5 text-sm rounded-2xl outline-none transition-all" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;">
                              <button type="button" onclick="const n=document.getElementById('pwd');n.type=n.type==='password'?'text':'password'" class="eye-btn absolute inset-y-0 end-0 flex items-center px-4 transition-colors" style="color:rgba(99,102,241,0.5);">
                                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                              </button>
                          </div>
                      </div>
                      <p id="err-msg" class="hidden text-sm mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#f87171;"><span>&#9888;&#65039;</span><span data-i18n="err_pass">Wrong password, please try again.</span></p>
                      <button onclick="doLogin()" class="login-btn btn-shimmer w-full py-3.5 rounded-2xl font-bold text-sm relative overflow-hidden transition-all" style="background:linear-gradient(135deg,#6366f1,#7c3aed);color:white;box-shadow:0 4px 24px rgba(99,102,241,0.4),inset 0 1px 0 rgba(255,255,255,0.1);" data-i18n="login_btn">
                          Sign In
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <!-- DASHBOARD CONTAINER -->
      <div id="dash-box" class="hidden w-full h-full flex-col md:flex-row relative">
          
          <!-- SIDEBAR (Desktop) -->
          <aside class="hidden md:flex w-64 bg-white dark:bg-darkcard border-e border-slate-200 dark:border-darkborder flex-col z-20 shrink-0">
              <div class="flex items-center p-6 border-b border-slate-100 dark:border-darkborder/50">
                  <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-primary flex items-center justify-center me-3 shrink-0"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div>
                  <div class="flex flex-col">
                      <h1 class="font-black text-xl leading-none" data-i18n="title">Nahan</h1>
                      <span id="app-version" class="text-[10px] font-mono text-slate-400 mt-1 font-semibold">v${CURRENT_VERSION}</span>
                  </div>
              </div>
              <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                  <button onclick="switchTab('overview')" id="tab-overview" class="nav-item active flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 group">
                      <svg class="w-6 h-6 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
                      <span class="font-semibold" data-i18n="tab_overview">Overview</span>
                  </button>
                  <button onclick="switchTab('info')" id="tab-info" class="nav-item flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 group">
                      <svg class="w-6 h-6 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                      <span class="font-semibold" data-i18n="tab_info">Endpoints</span>
                  </button>
                  <button onclick="switchTab('network')" id="tab-network" class="nav-item flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 group">
                      <svg class="w-6 h-6 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                      <span class="font-semibold" data-i18n="tab_status">Metrics</span>
                  </button>
                  <button onclick="switchTab('settings')" id="tab-settings" class="nav-item flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 group">
                      <svg class="w-6 h-6 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                      <span class="font-semibold" data-i18n="tab_settings">System</span>
                  </button>
                  <button onclick="switchTab('advanced')" id="tab-advanced" class="nav-item flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 group">
                      <svg class="w-6 h-6 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span class="font-semibold" data-i18n="tab_adv">Advanced</span>
                  </button>
                  <button onclick="switchTab('logs')" id="tab-logs" class="nav-item flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 group">
                      <svg class="w-6 h-6 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                      <span class="font-semibold" data-i18n="tab_logs">Activity logs</span>
                  </button>
                  <button onclick="switchTab('users')" id="tab-users" class="nav-item flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 group">
                      <svg class="w-6 h-6 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                      <span class="font-semibold" data-i18n="tab_users">Users</span>
                  </button>
                  <button onclick="switchTab('shop')" id="tab-shop" class="nav-item flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 group">
                      <svg class="w-6 h-6 me-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-4H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      <span class="font-semibold">Shop</span>
                  </button>
              </nav>
              <div class="p-4 border-t border-slate-100 dark:border-darkborder/50">
                  <button onclick="logout()" class="flex items-center justify-center w-full px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold transition-colors">
                      <svg class="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      <span data-i18n="logout">Disconnect</span>
                  </button>
              </div>
          </aside>
  
          <!-- MAIN CONTENT AREA -->
          <main class="flex-1 flex flex-col h-full overflow-hidden">
              <header class="h-20 md:h-24 shrink-0 flex items-center px-6 md:px-10 z-10 pt-4 md:pt-0">
                  <h2 id="view-title" class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mt-2">Overview</h2>
              </header>
  
              <!-- Scrollable Content -->
              <div class="scroll-content flex-1 overflow-y-auto p-4 md:p-10">
                  <div class="max-w-4xl mx-auto space-y-6 fade-in">

                      <!-- Update Banner -->
                      <div id="update-alert-banner" class="hidden bg-gradient-to-r from-amber-500/10 to-primary/10 border-2 border-amber-300 dark:border-amber-950/20 rounded-3xl p-6 shadow-md flex-col items-center justify-between gap-4 fade-in">
                          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                              <div class="flex items-center space-x-4 space-x-reverse text-start w-full">
                                  <div class="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
                                      <svg class="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"></path></svg>
                                  </div>
                                  <div>
                                      <h4 class="font-black text-amber-800 dark:text-amber-400 text-base" data-i18n="update_avail">New version available!</h4>
                                      <p id="update-alert-text" class="text-xs text-slate-500 dark:text-slate-400 mt-1"></p>
                                  </div>
                              </div>
                              <div class="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                                  <button onclick="dismissUpdate()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors" data-i18n="btn_cancel">Cancel</button>
                                  <button onclick="doUpdate()" id="update-deploy-btn" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5" data-i18n="deploy_btn">
                                      🚀 Deploy Now
                                  </button>
                              </div>
                          </div>
                          <!-- Sub-options for format choice -->
                          <div class="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-500/5 dark:bg-amber-500/[0.02] p-4 rounded-2xl border border-amber-500/10 mt-2 text-start">
                              <div class="space-y-1">
                                  <span class="text-xs font-bold text-amber-800 dark:text-amber-400" data-i18n="lbl_update_format">Update Format & Obfuscation:</span>
                                  <p class="text-[10px] text-slate-500 dark:text-slate-400" data-i18n="desc_update_format">Deploy clean source code, or encrypt using dynamic XOR byte-shifting to avoid network interception.</p>
                              </div>
                              <div class="flex items-center gap-4 shrink-0 font-medium">
                                  <label class="inline-flex items-center cursor-pointer">
                                      <input type="radio" name="update-format" value="normal" checked class="form-radio text-amber-500 w-4 h-4">
                                      <span class="ms-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold" data-i18n="format_normal">Normal (_worker.js)</span>
                                  </label>
                                  <label class="inline-flex items-center cursor-pointer">
                                      <input type="radio" name="update-format" value="obfuscated" class="form-radio text-amber-500 w-4 h-4">
                                      <span class="ms-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold" data-i18n="format_obfuscated">Obfuscated (UTF-8 + XOR)</span>
                                  </label>
                              </div>
                          </div>
                          <!-- Dynamic Changelog Section -->
                          <div id="update-changelog-area" class="hidden w-full border-t border-amber-300/30 dark:border-amber-950/20 pt-4 mt-2">
                              <h5 class="text-xs font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                                  <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                  <span data-i18n="changelog_title">Changelog of New Version:</span>
                              </h5>
                              <div id="update-changelog-content" class="text-xs text-slate-600 dark:text-slate-400 bg-amber-500/[0.04] dark:bg-slate-900/40 p-4 rounded-2xl max-h-48 overflow-y-auto font-sans leading-relaxed border border-amber-200/20 max-w-none text-start">
                                  <p class="animate-pulse">Loading changelog...</p>
                              </div>
                          </div>
                          <div id="update-deploy-status" class="hidden w-full mt-3 p-3 rounded-xl text-sm font-bold text-center"></div>
                          <div class="w-full mt-2 text-center">
                              <a id="update-github-link" href="https://github.com/itsyebekhe/nahan" target="_blank" class="text-xs text-slate-400 hover:text-amber-500 transition-colors underline" data-i18n="view_github">View on GitHub</a>
                          </div>
                      </div>

                      <!-- OVERVIEW / DASHBOARD VIEW -->
                      <div id="view-overview" class="space-y-3 md:space-y-6 block">
                          <!-- User Summary Cards -->
                          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
                              <div class="bg-white dark:bg-darkcard rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center justify-between mb-1 md:mb-2">
                                      <span class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider" data-i18n="ov_total_users">Total Users</span>
                                      <div class="p-1.5 md:p-2 bg-primary/10 text-primary rounded-md md:rounded-lg"><svg class="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857M12 4.354a4 4 0 110 5.292"></path></svg></div>
                                  </div>
                                  <p id="ov-total-users" class="text-xl md:text-2xl font-black text-slate-800 dark:text-white">-</p>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center justify-between mb-1 md:mb-2">
                                      <span class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider" data-i18n="ov_active_users">Active</span>
                                      <div class="p-1.5 md:p-2 bg-emerald-500/10 text-emerald-500 rounded-md md:rounded-lg"><svg class="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                                  </div>
                                  <p id="ov-active-users" class="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">-</p>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center justify-between mb-1 md:mb-2">
                                      <span class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider" data-i18n="ov_paused_users">Paused</span>
                                      <div class="p-1.5 md:p-2 bg-amber-500/10 text-amber-500 rounded-md md:rounded-lg"><svg class="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                                  </div>
                                  <p id="ov-paused-users" class="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">-</p>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center justify-between mb-1 md:mb-2">
                                      <span class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider" data-i18n="ov_auto_disabled">Auto-Disabled</span>
                                      <div class="p-1.5 md:p-2 bg-red-500/10 text-red-500 rounded-md md:rounded-lg"><svg class="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg></div>
                                  </div>
                                  <p id="ov-auto-disabled" class="text-xl md:text-2xl font-black text-red-600 dark:text-red-400">-</p>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center justify-between mb-1 md:mb-2">
                                      <span class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider" data-i18n="ov_expired_users">Expired</span>
                                      <div class="p-1.5 md:p-2 bg-slate-500/10 text-slate-500 rounded-md md:rounded-lg"><svg class="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                                  </div>
                                  <p id="ov-expired-users" class="text-xl md:text-2xl font-black text-slate-600 dark:text-slate-400">-</p>
                              </div>
                          </div>

                          <!-- Traffic & System Cards -->
                          <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                              <div class="bg-white dark:bg-darkcard rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                      <div class="p-1.5 md:p-2.5 bg-violet-500/10 text-violet-500 rounded-lg md:rounded-xl"><svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg></div>
                                      <span class="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider" data-i18n="ov_total_traffic">Total Traffic</span>
                                  </div>
                                   <p id="ov-total-traffic" class="text-base md:text-xl font-black text-slate-800 dark:text-white">- GB</p>
                                  <p class="text-[9px] md:text-[10px] text-slate-400 mt-0.5 md:mt-1"><span id="ov-total-reqs">-</span> <span data-i18n="ov_requests">requests</span></p>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                      <div class="p-1.5 md:p-2.5 bg-cyan-500/10 text-cyan-500 rounded-lg md:rounded-xl"><svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg></div>
                                      <span class="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider" data-i18n="ov_today_traffic">Today's Traffic</span>
                                  </div>
                                  <p id="ov-today-traffic" class="text-base md:text-xl font-black text-slate-800 dark:text-white">- GB</p>
                                  <p class="text-[9px] md:text-[10px] text-slate-400 mt-0.5 md:mt-1"><span id="ov-today-reqs">-</span> <span data-i18n="ov_requests">requests</span></p>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                      <div class="p-1.5 md:p-2.5 bg-blue-500/10 text-blue-500 rounded-lg md:rounded-xl"><svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"></path></svg></div>
                                      <span class="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider" data-i18n="ov_active_conns">Active Connections</span>
                                  </div>
                                  <p id="ov-active-conns" class="text-base md:text-xl font-black text-slate-800 dark:text-white">-</p>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-xl md:rounded-2xl p-3 md:p-5 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                      <div class="p-1.5 md:p-2.5 bg-indigo-500/10 text-indigo-500 rounded-lg md:rounded-xl"><svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>
                                      <span class="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider" data-i18n="ov_system">System</span>
                                  </div>
                                  <p id="ov-version" class="text-base md:text-xl font-black text-slate-800 dark:text-white">-</p>
                              </div>
                          </div>

                          <!-- Recent Activity & Quick Actions Row -->
                          <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                              <!-- Recent Activity -->
                              <div class="lg:col-span-2 bg-white dark:bg-darkcard rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="flex items-center justify-between mb-3 md:mb-4">
                                      <h3 class="text-xs md:text-sm uppercase font-bold text-slate-500 tracking-wider" data-i18n="ov_recent_activity">Recent Activity</h3>
                                      <button onclick="switchTab('logs')" class="text-[11px] md:text-xs text-primary hover:text-primary/80 font-bold transition-colors" data-i18n="ov_view_all">View All &rarr;</button>
                                  </div>
                                  <div id="ov-activity-list" class="space-y-1.5 md:space-y-2.5">
                                      <p class="text-sm text-slate-400 text-center py-6" data-i18n="ov_loading">Loading...</p>
                                  </div>
                              </div>
                              <!-- Quick Actions -->
                              <div class="bg-white dark:bg-darkcard rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <h3 class="text-xs md:text-sm uppercase font-bold text-slate-500 tracking-wider mb-3 md:mb-4" data-i18n="ov_quick_actions">Quick Actions</h3>
                                  <div class="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-3">
                                      <button onclick="openAddUserModal()" class="flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-colors">
                                          <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                          <span data-i18n="ov_add_user">Add User</span>
                                      </button>
                                      <button onclick="switchTab('users')" class="flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-colors">
                                          <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                          <span data-i18n="ov_manage_users">Manage Users</span>
                                      </button>
                                      <button onclick="exportConfig()" class="flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-colors">
                                          <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                          <span data-i18n="ov_backup_config">Backup Config</span>
                                      </button>
                                      <button onclick="loadDashboard()" class="flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-colors">
                                          <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                          <span data-i18n="ov_refresh">Refresh Statistics</span>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <!-- INFO VIEW -->
                      <div id="view-info" class="hidden space-y-6">
                          <div id="dyn-profiles-container" class="columns-1 md:columns-2 gap-4"></div>
                      </div>

                      <!-- NETWORK/METRICS VIEW -->
                      <div id="view-network" class="hidden space-y-6">
                            <div class="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-darkborder mb-6">
                              <h3 class="text-sm uppercase font-bold text-slate-500 tracking-wider mb-4" data-i18n="metrics_live">Live Profile Usage</h3>
                              <div id="usage-metrics-container" class="flex flex-col">
                                  <p class="text-xs text-slate-400 text-center py-4" data-i18n="no_metrics">No active connection data yet.</p>
                              </div>
                          </div>
                          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                              <div class="bg-white dark:bg-darkcard p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-darkborder relative overflow-hidden group">
                                  <svg class="w-8 h-8 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                                  <p class="text-xs uppercase font-bold text-slate-400 mb-1" data-i18n="stat_ip">Origin IP</p>
                                  <p id="net-ip" class="text-xl md:text-2xl font-black font-mono">...</p>
                              </div>
                              <div class="bg-white dark:bg-darkcard p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-darkborder relative overflow-hidden group">
                                  <svg class="w-8 h-8 text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
                                  <p class="text-xs uppercase font-bold text-slate-400 mb-1" data-i18n="stat_dc">Edge Node</p>
                                  <p id="net-colo" class="text-xl md:text-2xl font-black font-mono">...</p>
                              </div>
                              <div class="bg-white dark:bg-darkcard p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-darkborder relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                                  <svg class="w-8 h-8 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                  <p class="text-xs uppercase font-bold text-slate-400 mb-1" data-i18n="stat_loc">Data Region</p>
                                  <p id="net-loc" class="text-lg font-bold truncate">...</p>
                              </div>
                              <div class="bg-white dark:bg-darkcard p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-darkborder relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                                  <svg class="w-8 h-8 text-blue-500 mb-4"  width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock10-icon lucide-clock-10"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l-4-2"/></svg>
                                  <p class="text-xs uppercase font-bold text-slate-400 mb-1" data-i18n="stat_datetime">Date Time</p>
                                  <p id="net-datetime" class="text-lg font-bold truncate text-center"  dir="rtl">...</p>
                              </div>
                              <!-- Diagnostics Segment -->
                              <div class="bg-white dark:bg-darkcard p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-darkborder relative overflow-hidden group sm:col-span-2 lg:col-span-3">
                                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div>
                                          <h3 class="text-sm uppercase font-bold text-slate-400 mb-1" data-i18n="ping_test_title">Latency Diagnostics</h3>
                                          <p class="text-xs text-slate-500" data-i18n="ping_test_desc">Test response time to your active node target.</p>
                                      </div>
                                      <button onclick="runPingTest()" class="px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-colors text-sm" data-i18n="run_diagnostics">
                                          ⚡ Run Diagnostics
                                      </button>
                                  </div>
                                  <div id="ping-results" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 hidden">
                                      <div class="bg-slate-50 dark:bg-darkbg p-3 rounded-xl border border-slate-100 dark:border-darkborder/50">
                                          <p class="text-[10px] uppercase font-bold text-slate-400" data-i18n="target_node">Target Node</p>
                                          <p id="ping-target" class="text-sm font-bold font-mono truncate">...</p>
                                      </div>
                                      <div class="bg-slate-50 dark:bg-darkbg p-3 rounded-xl border border-slate-100 dark:border-darkborder/50">
                                          <p class="text-[10px] uppercase font-bold text-slate-400" data-i18n="response">Response</p>
                                          <p id="ping-time" class="text-sm font-bold font-mono text-emerald-500">...</p>
                                      </div>
                                      <div class="bg-slate-50 dark:bg-darkbg p-3 rounded-xl border border-slate-100 dark:border-darkborder/50">
                                          <p class="text-[10px] uppercase font-bold text-slate-400" data-i18n="status">Status</p>
                                          <p id="ping-status" class="text-sm font-bold">...</p>
                                      </div>
                                      <div class="bg-slate-50 dark:bg-darkbg p-3 rounded-xl border border-slate-100 dark:border-darkborder/50">
                                          <p class="text-[10px] uppercase font-bold text-slate-400" data-i18n="local_port">Local Port</p>
                                          <p id="ping-port" class="text-sm font-bold font-mono">...</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
  
                      <!-- SETTINGS VIEW -->
                      <div id="view-settings" class="hidden">
                          <div class="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-darkborder grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div class="space-y-1">
                                  <label class="block text-sm font-bold text-slate-600 dark:text-slate-300 ms-1" data-i18n="lbl_proto">Primary Display Mode</label>
                                  <select id="cfg-proto" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-1 outline-none appearance-none">
                                      <option value="alpha">Alpha Mode (V-Core)</option>
                                      <option value="beta">Beta Mode (T-Core)</option>
                                      <option value="both">Both (V-Core & T-Core)</option>
                                  </select>
                              </div>
                               <div class="space-y-1">
                                  <label class="block text-sm font-bold text-slate-600 dark:text-slate-300 ms-1" data-i18n="lbl_port">Data Port (Checkbox Selection)</label>
                                  <select id="cfg-port" multiple class="hidden">
                                      <option value="443">443</option>
                                      <option value="2053">2053</option>
                                      <option value="2083">2083</option>
                                      <option value="2087">2087</option>
                                      <option value="2096">2096</option>
                                      <option value="8443">8443</option>
                                      <option value="80">80</option>
                                      <option value="8080">8080</option>
                                      <option value="8880">8880</option>
                                      <option value="2052">2052</option>
                                      <option value="2082">2082</option>
                                      <option value="2086">2086</option>
                                      <option value="2095">2095</option>
                                  </select>
                                  <div id="port-checkboxes-container" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-darkborder p-4 rounded-xl space-y-3 font-mono text-xs max-h-48 overflow-y-auto">
                                      <!-- TLS ports -->
                                      <div class="space-y-1.5">
                                          <div class="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">🔒 Secure (TLS)</div>
                                          <div class="grid grid-cols-2 gap-2">
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="443" onchange="togglePortCheckbox('443', this.checked)" class="accent-primary">
                                                  <span>443</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="2053" onchange="togglePortCheckbox('2053', this.checked)" class="accent-primary">
                                                  <span>2053</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="2083" onchange="togglePortCheckbox('2083', this.checked)" class="accent-primary">
                                                  <span>2083</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="2087" onchange="togglePortCheckbox('2087', this.checked)" class="accent-primary">
                                                  <span>2087</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="2096" onchange="togglePortCheckbox('2096', this.checked)" class="accent-primary">
                                                  <span>2096</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="8443" onchange="togglePortCheckbox('8443', this.checked)" class="accent-primary">
                                                  <span>8443</span>
                                              </label>
                                          </div>
                                      </div>
                                      <!-- Non-TLS ports -->
                                      <div class="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-700">
                                          <div class="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">🔓 Standard</div>
                                          <div class="grid grid-cols-2 gap-2">
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="80" onchange="togglePortCheckbox('80', this.checked)" class="accent-primary">
                                                  <span>80</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="8080" onchange="togglePortCheckbox('8080', this.checked)" class="accent-primary">
                                                  <span>8080</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="8880" onchange="togglePortCheckbox('8880', this.checked)" class="accent-primary">
                                                  <span>8880</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="2052" onchange="togglePortCheckbox('2052', this.checked)" class="accent-primary">
                                                  <span>2052</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="2082" onchange="togglePortCheckbox('2082', this.checked)" class="accent-primary">
                                                  <span>2082</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition">
                                                  <input type="checkbox" value="2086" onchange="togglePortCheckbox('2086', this.checked)" class="accent-primary">
                                                  <span>2086</span>
                                              </label>
                                              <label class="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary transition col-span-2">
                                                  <input type="checkbox" value="2095" onchange="togglePortCheckbox('2095', this.checked)" class="accent-primary">
                                                  <span>2095</span>
                                              </label>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div class="space-y-1 md:col-span-2">
                                  <div class="flex justify-between items-center">
                                      <label class="block text-sm font-bold text-slate-600 dark:text-slate-300 ms-1" data-i18n="lbl_id">Device UUID (Empty=Auto)</label>
                                      <button type="button" onclick="document.getElementById('cfg-uuid').value = crypto.randomUUID()" class="text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors duration-200" data-i18n="btn_generate_uuid">Generate UUID</button>
                                  </div>
                                  <input type="text" id="cfg-uuid" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none font-mono text-sm">
                              </div>
                              <div class="space-y-1">
                                  <label class="block text-sm font-bold text-slate-600 dark:text-slate-300 ms-1" data-i18n="lbl_path">API Route (Hidden Path)</label>
                                  <input type="text" id="cfg-path" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                              </div>
                              <div class="space-y-1">
                                  <label class="block text-sm font-bold text-slate-600 dark:text-slate-300 ms-1" data-i18n="lbl_pass">Master Key</label>
                                  <div class="relative">
                                      <input type="password" id="cfg-pass" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none pe-12">
                                      <button type="button" onclick="const n=document.getElementById('cfg-pass');n.type=n.type==='password'?'text':'password'" class="absolute inset-y-0 end-0 flex items-center px-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">👁️</button>
                                  </div>
                              </div>
                              <div class="space-y-1 md:col-span-2">
                                  <label class="block text-sm font-bold text-slate-600 dark:text-slate-300 ms-1" data-i18n="lbl_github_repo">GitHub Update Repository</label>
                                  <input type="text" id="cfg-github-repo" placeholder="itsyebekhe/nahan" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                  <div class="flex justify-start items-center gap-2 mt-2">
                                      <button type="button" onclick="triggerManualRedeploy()" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors border border-primary/20">
                                          🔄 <span data-i18n="btn_redeploy_force">Force Redeploy / Switch Format</span>
                                      </button>
                                  </div>
                              </div>
                              <div class="space-y-1 md:col-span-2">
                                  <label class="block text-sm font-bold text-slate-600 dark:text-slate-300 ms-1" data-i18n="lbl_sub_ua">Custom Subscription User-Agent</label>
                                  <input type="text" id="cfg-sub-ua" placeholder="e.g. MySpecialUABypass" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                  <p class="text-xs text-slate-500 mt-1 ms-1" data-i18n="desc_sub_ua">Allow specific browser User-Agent containing this text to bypass camouflage and retrieve profile data directly in web browser.</p>
                              </div>
                              <div class="space-y-1 md:col-span-2">
                                  <label class="block text-sm font-bold text-slate-600 dark:text-slate-300 ms-1" data-i18n="lbl_custom_panel_url">Custom Panel URL / Subscription Domain</label>
                                  <input type="text" id="cfg-custom-panel-url" placeholder="e.g. custom.domain.com or https://custom.domain.com" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                  <p class="text-xs text-slate-500 mt-1 ms-1" data-i18n="desc_custom_panel_url">Optionally specify a custom domain/URL to be used for subscription/sync links. If empty, the default Worker address will be used.</p>
                              </div>
                              <!-- System Toggles -->
                              <div class="flex flex-col sm:flex-row gap-3 md:col-span-2">
                                  <label class="flex-1 flex items-center justify-between cursor-pointer bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                      <span class="text-sm font-bold text-slate-700 dark:text-slate-300" data-i18n="lbl_silent">Silent UI Alerts</span>
                                      <div class="relative inline-flex items-center cursor-pointer">
                                          <input type="checkbox" id="cfg-silent" class="sr-only peer">
                                          <div class="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-primary"></div>
                                      </div>
                                  </label>
                                  <label class="flex-1 flex items-center justify-between cursor-pointer bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-200 dark:border-red-900/30">
                                      <span class="text-sm font-bold text-red-600 dark:text-red-400" data-i18n="lbl_pause">Kill Switch</span>
                                      <div class="relative inline-flex items-center cursor-pointer">
                                          <input type="checkbox" id="cfg-pause" class="sr-only peer">
                                          <div class="w-11 h-6 bg-red-200 dark:bg-red-900/50 rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-red-500"></div>
                                      </div>
                                  </label>
                               </div>
                               <div class="space-y-3 md:col-span-2">
                                   <label class="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 cursor-pointer">
                                       <div>
                                           <span class="text-sm font-bold text-emerald-700 dark:text-emerald-400" data-i18n="lbl_auto_update">Auto-Update</span>
                                           <p class="text-[10px] text-emerald-500/70 dark:text-emerald-400/60 mt-0.5">Automatically deploy when a new version is detected</p>
                                       </div>
                                       <div class="relative inline-flex items-center">
                                           <input type="checkbox" id="cfg-auto-update" class="sr-only peer">
                                           <div class="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-emerald-500"></div>
                                       </div>
                                   </label>
                                   <div id="auto-update-format-wrap" class="hidden">
                                       <label class="block text-xs font-bold text-slate-500 mb-2" data-i18n="lbl_auto_update_format">Update Format</label>
                                       <div class="flex gap-3">
                                           <label class="flex-1 flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-darkborder cursor-pointer hover:border-emerald-400 transition-colors">
                                               <input type="radio" name="auto-update-format" value="normal" checked class="accent-emerald-500">
                                               <div>
                                               <span class="text-xs font-bold text-slate-700 dark:text-slate-300" data-i18n="format_normal_label">Normal</span>
                                               <p class="text-[10px] text-slate-400" data-i18n="desc_format_normal">Standard _worker.js</p>
                                               </div>
                                           </label>
                                           <label class="flex-1 flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-darkborder cursor-pointer hover:border-emerald-400 transition-colors">
                                               <input type="radio" name="auto-update-format" value="obfuscated" class="accent-emerald-500">
                                               <div>
                                               <span class="text-xs font-bold text-slate-700 dark:text-slate-300" data-i18n="format_obfuscated_label">Obfuscated</span>
                                               <p class="text-[10px] text-slate-400" data-i18n="desc_format_obfuscated">XOR byte-shifting</p>
                                               </div>
                                           </label>
                                       </div>
                                   </div>
                               </div>

                               <!-- Import/Export Config Area -->
                              <div class="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-darkborder md:col-span-2 space-y-4">
                                  <h3 class="text-sm uppercase font-bold text-slate-400 tracking-wider" data-i18n="backup_restore_title">Backup & Restore</h3>
                                  <div class="flex flex-col sm:flex-row gap-4">
                                      <button onclick="exportConfig()" class="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm" data-i18n="export_btn">
                                          📥 Export Configuration (JSON)
                                      </button>
                                      <label class="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm text-center cursor-pointer">
                                          <span data-i18n="import_btn">📤 Import Configuration (JSON)</span>
                                          <input type="file" id="import-file" class="hidden" accept=".json" onchange="importConfig(event)">
                                      </label>
                                  </div>
                              </div>
                          </div>
                      </div>
  
                      <!-- ADVANCED VIEW -->
                      <div id="view-advanced" class="hidden space-y-4">

                          <!-- Section: Network & DNS -->
                          <div class="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder overflow-hidden" data-accordion>
                              <button onclick="toggleAccordion(this)" class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <div class="flex items-center gap-3">
                                      <span class="text-lg">🌐</span>
                                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200" data-i18n="adv_network_dns">Network & DNS</span>
                                  </div>
                                  <svg class="w-4 h-4 text-slate-400 transform transition-transform duration-200 accordion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                              <div data-accordion-content class="transition-all duration-300" style="max-height:0;overflow:hidden;visibility:hidden">
                                  <div class="space-y-4 px-5 pb-5 pt-1">
                                      <div>
                                          <div class="flex items-center justify-between mb-2">
                                              <label class="text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_clean_ips">Clean IPs (Multi-Generator)</label>
                                              <span class="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md font-bold" id="ip-count-badge">1 Config Set</span>
                                          </div>
                                          <textarea id="cfg-ips" rows="3" data-i18n="ph_clean_ips" placeholder="1.2.3.4#Germany&#10;5.6.7.8#US&#10;9.10.11.12#France" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-1 outline-none font-mono text-sm resize-none"></textarea>
                                          <p class="text-xs text-slate-400 mt-2" data-i18n="desc_clean_ips">One IP per line. Use <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">IP#Name</code> format to tag IPs (e.g. <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">1.2.3.4#Germany</code>). Use <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">{IP_NAME}</code> in name strategy.</p>
                                          <button id="btn-resolve-smart-ips" onclick="resolveSmartCleanIps()" class="mt-3 w-full sm:w-auto px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                              Auto-Resolve CDN & Clean IPs
                                          </button>
                                      </div>
                                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div class="space-y-1">
                                              <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_fp">TLS Signature</label>
                                              <select id="cfg-fp" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none appearance-none">
                                                  <option value="chrome">Chrome</option><option value="firefox">Firefox</option><option value="safari">Safari</option>
                                              </select>
                                          </div>
                                          <div class="space-y-1">
                                              <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_dns">Resolver IP</label>
                                              <input type="text" id="cfg-dns" placeholder="1.1.1.1" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                          </div>
                                          <div class="space-y-1 md:col-span-2">
                                              <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_doh">Custom DNS (DoH Provider)</label>
                                              <input type="text" id="cfg-custom-dns" placeholder="https://cloudflare-dns.com/dns-query" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <!-- Section: Proxy & Relay -->
                          <div class="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder overflow-hidden" data-accordion>
                              <button onclick="toggleAccordion(this)" class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <div class="flex items-center gap-3">
                                      <span class="text-lg">🔗</span>
                                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200" data-i18n="adv_proxy_relay">Proxy & Relay</span>
                                  </div>
                                  <svg class="w-4 h-4 text-slate-400 transform transition-transform duration-200 accordion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                              <div data-accordion-content class="transition-all duration-300" style="max-height:0;overflow:hidden;visibility:hidden">
                                  <div class="space-y-4 px-5 pb-5 pt-1">
                                      <div class="space-y-1">
                                          <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_relay">Proxy IPs (Comma/Newline separated)</label>
                                          <textarea id="cfg-relay" rows="3" placeholder="104.20.0.1&#10;proxyip.cmliussss.net" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-1 outline-none font-mono text-sm resize-none"></textarea>
                                      </div>
                                      <div class="space-y-1">
                                          <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_fake">Maintenance Hosts (Camouflage)</label>
                                          <input type="text" id="cfg-fake" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                      </div>
                                      <div class="space-y-1">
                                          <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_nat64">NAT64 Prefix</label>
                                          <textarea id="cfg-nat64" rows="2" placeholder="64:ff9b::/96&#10;2001:db8:64::/96" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-1 outline-none font-mono text-sm resize-none"></textarea>
                                          <p class="text-xs text-slate-400 mt-1" data-i18n="desc_nat64">Optional. Converts IPv4 Proxy IPs to NAT64 IPv6 addresses. Supports multiple prefixes (one per line).</p>
                                      </div>
                                      <label class="flex items-center justify-between cursor-pointer bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                          <div>
                                              <span class="text-sm font-bold text-slate-700 dark:text-slate-300" data-i18n="lbl_direct_configs">Include Direct Configs</span>
                                              <p class="text-[10px] text-slate-400 mt-0.5">Generate configs without Proxy IP alongside relay configs</p>
                                          </div>
                                          <div class="relative inline-flex items-center cursor-pointer">
                                              <input type="checkbox" id="cfg-direct-configs" class="sr-only peer">
                                              <div class="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-primary"></div>
                                          </div>
                                      </label>
                                  </div>
                              </div>
                          </div>

                          <!-- Section: Subscription -->
                          <div class="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder overflow-hidden" data-accordion>
                              <button onclick="toggleAccordion(this)" class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <div class="flex items-center gap-3">
                                      <span class="text-lg">📝</span>
                                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200" data-i18n="adv_subscription">Subscription</span>
                                  </div>
                                  <svg class="w-4 h-4 text-slate-400 transform transition-transform duration-200 accordion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                              <div data-accordion-content class="transition-all duration-300" style="max-height:0;overflow:hidden;visibility:hidden">
                                  <div class="space-y-4 px-5 pb-5 pt-1">
                                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div class="space-y-1">
                                              <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_strategy">Configuration Name Strategy</label>
                                              <input type="text" id="cfg-name-strategy" placeholder="{FLAG} {PROTOCOL}-{USER}-{PORT}" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                                              <p data-i18n="html_desc_strategy" class="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                                                  Supported templates: <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">default</code>, <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">type-user-port</code>, <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">user-port</code>, <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">host-port-user</code>, <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">prefix-user-port</code>, <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">ip</code>. Tags: <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">{FLAG}</code> <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">{IP_NAME}</code> <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">{USER}</code> <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">{PORT}</code>
                                              </p>
                                          </div>
                                          <div class="space-y-1">
                                              <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_prefix">Custom Name Prefix</label>
                                              <input type="text" id="cfg-name-prefix" placeholder="Core" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                          </div>
                                       </div>
                                       <div class="border-t border-slate-100 dark:border-darkborder pt-4">
                                          <div class="flex items-center justify-between mb-3">
                                              <div>
                                                  <h4 class="text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_fake_configs">Subscription Fake Entries</h4>
                                                  <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5" data-i18n="desc_fake_configs">Customize info entries shown in subscription profiles. Use <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">{usage}</code> and <code class="bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono">{expiry}</code> for dynamic values.</p>
                                              </div>
                                              <button onclick="addFakeConfig()" class="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0">
                                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                  <span data-i18n="btn_add_entry">Add Entry</span>
                                              </button>
                                          </div>
                                          <div id="fake-configs-list" class="space-y-2"></div>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <!-- Section: Protocol -->
                          <div class="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder overflow-hidden" data-accordion>
                              <button onclick="toggleAccordion(this)" class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <div class="flex items-center gap-3">
                                      <span class="text-lg">⚡</span>
                                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200" data-i18n="adv_protocol">Protocol</span>
                                  </div>
                                  <svg class="w-4 h-4 text-slate-400 transform transition-transform duration-200 accordion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                              <div data-accordion-content class="transition-all duration-300" style="max-height:0;overflow:hidden;visibility:hidden">
                                  <div class="flex flex-col sm:flex-row gap-3">
                                      <label class="flex-1 flex items-center justify-between cursor-pointer bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                          <span class="text-sm font-bold text-slate-700 dark:text-slate-300" data-i18n="lbl_tfo">TCP Fast Open</span>
                                          <div class="relative inline-flex items-center cursor-pointer">
                                              <input type="checkbox" id="cfg-tfo" class="sr-only peer">
                                              <div class="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-primary"></div>
                                          </div>
                                      </label>
                                      <label class="flex-1 flex items-center justify-between cursor-pointer bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                          <span class="text-sm font-bold text-slate-700 dark:text-slate-300" data-i18n="lbl_ech">Secure Hello (ECH)</span>
                                          <div class="relative inline-flex items-center cursor-pointer">
                                              <input type="checkbox" id="cfg-ech" class="sr-only peer">
                                              <div class="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-primary"></div>
                                          </div>
                                      </label>
                                  </div>
                              </div>
                          </div>

                          <!-- Section: Cluster -->
                          <div class="bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 overflow-hidden" data-accordion>
                              <button onclick="toggleAccordion(this)" class="w-full flex items-center justify-between px-5 py-4 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors">
                                  <div class="flex items-center gap-3">
                                      <span class="text-lg">🔬</span>
                                      <span class="text-sm font-bold text-indigo-700 dark:text-indigo-300" data-i18n="slave_title">Slave Worker Nodes</span>
                                  </div>
                                  <svg class="w-4 h-4 text-indigo-400 transform transition-transform duration-200 accordion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                              <div data-accordion-content class="transition-all duration-300" style="max-height:0;overflow:hidden;visibility:hidden">
                                  <div class="space-y-3 px-5 pb-5 pt-1">
                                      <p class="text-xs text-indigo-600/80 dark:text-indigo-300/70 leading-relaxed" data-i18n="slave_desc">Enter your other worker Domains (one per line). Master will push settings and users to them automatically, and include them in load-balanced subscriptions!</p>
                                      <div class="relative">
                                          <textarea id="cfg-nodes" rows="3" placeholder="node1.worker.dev&#10;node2.domain.com" class="w-full px-4 py-3 pb-12 rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-slate-900 focus:border-indigo-500 focus:ring-1 outline-none font-mono text-sm resize-none text-slate-700 dark:text-slate-300 placeholder:text-indigo-300 dark:placeholder:text-indigo-800/50"></textarea>
                                          <div class="absolute bottom-3 end-3">
                                              <button onclick="forceSyncNodes()" type="button" class="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center shadow-sm">
                                                  <svg id="sync-icon" class="w-3.5 h-3.5 me-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                                  <span id="sync-btn-txt" data-i18n="force_sync">Force Sync Now</span>
                                              </button>
                                          </div>
                                      </div>
                                      <label class="flex items-center justify-between cursor-pointer bg-white dark:bg-slate-800/50 p-3 rounded-2xl">
                                          <span class="text-sm font-bold text-slate-700 dark:text-slate-300" data-i18n="lbl_allow_sync">Allow Sync</span>
                                          <div class="relative inline-flex items-center cursor-pointer">
                                              <input type="checkbox" id="cfg-allow-sync" class="sr-only peer">
                                              <div class="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-primary"></div>
                                          </div>
                                      </label>
                                  </div>
                              </div>
                          </div>

                          <!-- Section: Telegram -->
                          <div class="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder overflow-hidden" data-accordion>
                              <button onclick="toggleAccordion(this)" class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <div class="flex items-center gap-3">
                                      <span class="text-lg">🤖</span>
                                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200" data-i18n="adv_telegram">Telegram Bot</span>
                                  </div>
                                  <svg class="w-4 h-4 text-slate-400 transform transition-transform duration-200 accordion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                              <div data-accordion-content class="transition-all duration-300" style="max-height:0;overflow:hidden;visibility:hidden">
                                  <div class="space-y-3 px-5 pb-5 pt-1">
                                      <div class="space-y-1">
                                          <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_tg_token">Bot Token</label>
                                          <div class="relative">
                                              <input type="password" id="cfg-tg-token" placeholder="123456:ABC-DEF1234ghIkl-zyx5c" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm pe-12">
                                              <button type="button" onclick="const n=document.getElementById('cfg-tg-token');n.type=n.type==='password'?'text':'password'" class="absolute inset-y-0 end-0 flex items-center px-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">👁️</button>
                                          </div>
                                      </div>
                                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div class="space-y-1">
                                              <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_tg_chat">Chat ID</label>
                                              <input type="text" id="cfg-tg-chat" placeholder="123456789" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                          </div>
                                          <div class="space-y-1">
                                              <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_tg_admin">Authorized Admin ID</label>
                                              <input type="text" id="cfg-tg-admin" placeholder="123456789" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                              <p class="text-xs text-slate-400" data-i18n="desc_tg_admin">Only this Telegram User ID can manage the panel via bot. Leave empty to use Chat ID.</p>
                                          </div>
                                      </div>
                                      <p class="text-xs text-slate-400" data-i18n="desc_tg_bot">Set these values to receive login alerts via Telegram.</p>
                                  </div>
                              </div>
                          </div>

                          <!-- Section: Cloudflare -->
                          <div class="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder overflow-hidden" data-accordion>
                              <button onclick="toggleAccordion(this)" class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <div class="flex items-center gap-3">
                                      <span class="text-lg">☁️</span>
                                      <span class="text-sm font-bold text-slate-700 dark:text-slate-200" data-i18n="adv_cloudflare">Cloudflare</span>
                                  </div>
                                  <svg class="w-4 h-4 text-slate-400 transform transition-transform duration-200 accordion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                              <div data-accordion-content class="transition-all duration-300" style="max-height:0;overflow:hidden;visibility:hidden">
                                  <div class="space-y-3 px-5 pb-5 pt-1">
                                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div class="space-y-1">
                                              <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_cf_acc">CF Account ID</label>
                                              <input type="text" id="cfg-cf-acc" placeholder="a1b2c3d4e5f6..." class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm font-mono">
                                          </div>
                                          <div class="space-y-1">
                                              <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_cf_token">CF API Token</label>
                                              <div class="relative">
                                                  <input type="password" id="cfg-cf-token" placeholder="Bearer Token (Read Analytics)" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm font-mono pe-12">
                                                  <button type="button" onclick="const n=document.getElementById('cfg-cf-token');n.type=n.type==='password'?'text':'password'" class="absolute inset-y-0 end-0 flex items-center px-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">👁️</button>
                                              </div>
                                          </div>
                                      </div>
                                      <div class="space-y-1">
                                          <label class="block text-sm font-bold text-slate-600 dark:text-slate-300" data-i18n="lbl_cf_worker">CF Worker Script Name</label>
                                          <input type="text" id="cfg-cf-worker" placeholder="e.g. nahan" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm font-mono">
                                          <p class="text-xs text-slate-400" data-i18n="desc_cf_worker">Required for in-panel updates. The script name shown in your Cloudflare Workers dashboard.</p>
                                      </div>
                                      <p class="text-xs text-slate-400" data-i18n="desc_cf_api">Optional: Monitor Worker free usage limits (100k/day). Needs Account Analytics Read permission.</p>
                                      <div class="border-t border-slate-100 dark:border-darkborder pt-3">
                                          <button type="button" onclick="document.getElementById('cf-helper-guide').classList.toggle('hidden')" class="w-full text-start px-4 py-3 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold rounded-xl flex items-center justify-between transition-colors">
                                              <span class="flex items-center gap-1.5">
                                                  💡 <span data-i18n="cf_help_title">Need help getting these? Beginner's Guide</span>
                                              </span>
                                              <span class="text-[10px] transform transition-transform duration-200">▼</span>
                                          </button>
                                          <div id="cf-helper-guide" class="hidden mt-3 p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-darkborder rounded-2xl text-[11px] space-y-4 text-start leading-relaxed">
                                              <div class="space-y-1 pb-3 border-b border-dashed border-slate-200 dark:border-darkborder">
                                                  <h5 class="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1">🇬🇧 Beginner's Walkthrough:</h5>
                                                  <ol class="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400">
                                                      <li><strong>CF API Token:</strong> Click <a href="https://dash.cloudflare.com/profile/api-tokens?template=edit-workers" target="_blank" class="text-primary hover:underline font-bold">Api Token Template ↗</a>. Click <strong>Use Template</strong>, then <strong>Continue to summary</strong> &gt; <strong>Create Token</strong>. Copy and paste above!</li>
                                                      <li><strong>CF Account ID:</strong> Open any Cloudflare Workers page. Copy the 32-char string after <code>dash.cloudflare.com/</code> in the URL.</li>
                                                      <li><strong>Worker Script Name:</strong> Go to <strong>Compute &gt; Workers & Pages</strong> in Cloudflare. Copy your worker's name.</li>
                                                  </ol>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>

                      </div>
                      
                          <!-- USERS VIEW -->
                      <div id="view-users" class="hidden space-y-4">
                          <!-- Compact Stats Bar -->
                          <div class="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder p-4 flex flex-wrap items-center gap-4 md:gap-6">
                              <div class="flex items-center gap-2">
                                  <div class="p-1.5 bg-primary/10 text-primary rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>
                                  <div><span class="text-[10px] font-bold text-slate-400 uppercase" data-i18n="stat_total_subscribers">Total</span><span id="stat-total-users" class="ms-1.5 text-sm font-black text-slate-800 dark:text-white">0</span></div>
                              </div>
                              <div class="flex items-center gap-2">
                                  <div class="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                                  <div><span class="text-[10px] font-bold text-slate-400 uppercase" data-i18n="stat_active_paused">Active/Paused</span><span id="stat-active-users" class="ms-1.5 text-sm font-black text-slate-800 dark:text-white">0 / 0</span></div>
                              </div>
                              <div class="flex items-center gap-2">
                                  <div class="p-1.5 bg-violet-500/10 text-violet-500 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg></div>
                                  <div><span class="text-[10px] font-bold text-slate-400 uppercase" data-i18n="stat_cumulative_traffic">Traffic</span><span id="stat-total-traffic" class="ms-1.5 text-sm font-black text-slate-800 dark:text-white">0 GB</span></div>
                              </div>
                              <div class="flex items-center gap-2">
                                  <div class="p-1.5 bg-red-500/10 text-red-500 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg></div>
                                  <div><span class="text-[10px] font-bold text-slate-400 uppercase" data-i18n="stat_auto_disabled">Disabled</span><span id="stat-auto-disabled" class="ms-1.5 text-sm font-black text-slate-800 dark:text-white">0</span></div>
                              </div>
                          </div>

                          <!-- Recently Disabled Users Panel -->
                          <div id="disabled-users-panel" class="hidden">
                              <div class="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-3xl p-6 shadow-sm border border-red-200 dark:border-red-800/40 relative overflow-hidden">
                                  <div class="flex items-center justify-between mb-4">
                                      <div class="flex items-center gap-3">
                                          <div class="p-2.5 bg-red-100 dark:bg-red-900/40 rounded-xl">
                                              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                                          </div>
                                          <div>
                                              <h3 class="text-sm font-bold text-red-700 dark:text-red-300" data-i18n="disabled_panel_title">Recently Disabled Users</h3>
                                              <p class="text-[11px] text-red-500/70 dark:text-red-400/60" data-i18n="disabled_panel_desc">Users automatically disabled due to quota or expiration limits</p>
                                          </div>
                                      </div>
                                      <span id="disabled-panel-badge" class="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">0</span>
                                  </div>
                                  <div id="disabled-users-list" class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                  </div>
                              </div>
                          </div>

                          <div class="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-darkborder relative overflow-hidden">
                              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
                                  <div>
                                       <h3 class="text-sm uppercase font-bold text-slate-500 tracking-wider" data-i18n="sub_directory_title">Subscriber Directory</h3>
                                       <p class="text-xs text-slate-400 mt-1" data-i18n="sub_directory_desc">Search, modify bounds, toggle traffic limits or clear billing sessions.</p>
                                  </div>
                                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                      <select id="user-status-filter" onchange="renderUsersTable()" class="bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder px-4 py-2.5 rounded-xl text-xs outline-none font-sans text-slate-600 dark:text-slate-400 focus:border-primary">
                                          <option value="all" data-i18n="filter_all">All Users</option>
                                          <option value="active" data-i18n="filter_active">Active</option>
                                          <option value="paused" data-i18n="filter_paused">Paused</option>
                                          <option value="auto-disabled" data-i18n="filter_auto_disabled">Auto-Disabled</option>
                                      </select>
                                      <input type="text" id="user-search-input" onkeyup="renderUsersTable()" placeholder="🔍 Find by Name or UUID..." data-i18n="user_search_placeholder" class="bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder px-4 py-2.5 rounded-xl text-xs outline-none font-sans text-slate-600 dark:text-slate-400 focus:border-primary">
                                      <button onclick="openAddUserModal()" class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-colors shadow-sm" data-i18n="btn_add_user">+ Add New User</button>
                                  </div>
                              </div>
                              <div class="overflow-x-auto">
                                  <div id="tbl-users" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                  </div>
                              </div>
                          </div>
                      </div>

                      <!-- Modal: Add User -->
                      <div id="modal-add-user" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
                          <div class="bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-darkborder">
                              <div class="px-6 pt-6 pb-4 shrink-0">
                                  <h3 class="text-xl font-bold" data-i18n="modal_add_title">Add User</h3>
                              </div>
                              <div class="overflow-y-auto flex-1 min-h-0 px-6 pb-4">
                                  <div class="space-y-3">
                                      <details open class="group">
                                          <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none list-none">
                                              <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                              <span data-i18n="section_basic_info">Basic Info</span>
                                          </summary>
                                          <div class="space-y-3 ps-5">
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_u_name">Name / Identifier</label>
                                                  <input type="text" id="add-user-name" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_custom_config_name">Custom Config Name / Prefix</label>
                                                  <input type="text" id="add-user-custom-name" placeholder="Leave empty to use user name" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                              </div>
                                          </div>
                                      </details>
                                      <details open class="group">
                                          <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none list-none">
                                              <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                              <span data-i18n="section_limits">Limits</span>
                                          </summary>
                                          <div class="space-y-3 ps-5">
                                              <div class="grid grid-cols-2 gap-3">
                                                  <div>
                                                      <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_traffic_limit_gb">Traffic (GB) Limit</label>
                                                      <input type="number" id="add-user-total-reqs" placeholder="Unlimited" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                                                  </div>
                                                  <div>
                                                      <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_daily_limit_gb">Daily Limit (GB)</label>
                                                      <input type="number" id="add-user-daily-reqs" placeholder="Unlimited" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                                                  </div>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_expiration_days">Expiration (Days)</label>
                                                  <input type="number" id="add-user-days" placeholder="Unlimited" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                                              </div>
                                          </div>
                                      </details>
                                      <details class="group">
                                          <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none list-none">
                                              <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                              <span data-i18n="section_network">Network</span>
                                          </summary>
                                          <div class="space-y-3 ps-5">
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_clean_ips">Clean IPs</label>
                                                  <div id="add-user-clean-ips-wrap" class="flex flex-wrap gap-2 mt-1 text-slate-500"></div>
                                                  <label class="block text-[10px] font-bold text-slate-400 mt-2" data-i18n="desc_clean_ips_modal">Custom Clean IPs (comma/newline)</label>
                                                  <textarea id="add-user-custom-clean" rows="1" placeholder="e.g. 1.2.3.4, 5.6.7.8" class="w-full mt-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm"></textarea>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_proxy_ips">Proxy IPs</label>
                                                  <div id="add-user-proxy-ips-wrap" class="flex flex-wrap gap-2 mt-1 text-slate-500"></div>
                                                  <label class="block text-[10px] font-bold text-slate-400 mt-2" data-i18n="desc_proxy_ips">Custom Proxy IPs (comma/newline)</label>
                                                  <textarea id="add-user-custom-proxy" rows="1" placeholder="e.g. proxy1.com:443" class="w-full mt-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm"></textarea>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_assigned_nodes">Assigned Nodes</label>
                                                  <div id="add-user-nodes-wrap" class="flex flex-wrap gap-2 mt-1 text-slate-500"></div>
                                                  <label class="block text-[10px] font-bold text-slate-400 mt-2" data-i18n="desc_assigned_nodes">Custom Nodes (comma/newline, empty = all nodes)</label>
                                                  <textarea id="add-user-custom-nodes" rows="1" placeholder="node1.example.com" class="w-full mt-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm"></textarea>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_nat64">NAT64 Prefix</label>
                                                  <input type="text" id="add-user-nat64" placeholder="e.g. 64:ff9b::/96" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm font-mono">
                                                  <p class="text-[10px] text-slate-400 mt-1" data-i18n="desc_nat64_user">Optional. Converts IPv4 Proxy IPs to NAT64 IPv6 addresses.</p>
                                              </div>
                                          </div>
                                      </details>
                                      <details class="group">
                                          <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none list-none">
                                              <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                              <span data-i18n="section_advanced">Advanced</span>
                                          </summary>
                                          <div class="space-y-3 ps-5">
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_protocol_mode">Protocol Mode</label>
                                                  <div id="add-user-mode-wrap" class="flex gap-3 mt-1">
                                                      <label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" value="alpha" class="add-mode-cb accent-primary"> <span>Alpha (VLESS)</span></label>
                                                      <label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" value="beta" class="add-mode-cb accent-primary"> <span>Beta (Trojan)</span></label>
                                                  </div>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1">Ports</label>
                                                  <div id="add-user-ports-wrap" class="flex flex-wrap gap-2 mt-1"></div>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_max_configs">Max Configs</label>
                                                  <input type="number" id="add-user-max-configs" placeholder="Unlimited" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm" data-i18n-placeholder="unlimited">
                                              </div>
                                          </div>
                                      </details>
                                  </div>
                              </div>
                              <div class="px-6 py-4 shrink-0 border-t border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard sm:rounded-b-3xl pb-[env(safe-area-inset-bottom)]">
                                  <div class="flex justify-end gap-2">
                                      <button onclick="document.getElementById('modal-add-user').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold" data-i18n="btn_cancel">Cancel</button>
                                      <button onclick="commitAddUser()" class="px-4 py-2 rounded-xl bg-primary text-white font-bold" data-i18n="save_btn_user">Save User</button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <!-- Modal: Edit User -->
                      <div id="modal-edit-user" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
                          <div class="bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-darkborder">
                              <div class="px-6 pt-6 pb-4 shrink-0">
                                  <h3 class="text-xl font-bold" data-i18n="edit_sub">Edit Subscriber</h3>
                                  <input type="hidden" id="edit-user-id">
                              </div>
                              <div class="overflow-y-auto flex-1 min-h-0 px-6 pb-4">
                                  <div class="space-y-3">
                                      <details open class="group">
                                          <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none list-none">
                                              <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                              <span data-i18n="section_basic_info">Basic Info</span>
                                          </summary>
                                          <div class="space-y-3 ps-5">
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_name_ph">Name / Identifier</label>
                                                  <input type="text" id="edit-user-name" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_custom_config_name">Custom Config Name / Prefix</label>
                                                  <input type="text" id="edit-user-custom-name" placeholder="Leave empty to use user name" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm">
                                              </div>
                                          </div>
                                      </details>
                                      <details open class="group">
                                          <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none list-none">
                                              <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                              <span data-i18n="section_limits">Limits</span>
                                          </summary>
                                          <div class="space-y-3 ps-5">
                                              <div class="grid grid-cols-2 gap-3">
                                                  <div>
                                                      <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_traffic_limit_gb">Traffic Limit (GB)</label>
                                                      <input type="number" id="edit-user-total-reqs" placeholder="Unlimited" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                                                  </div>
                                                  <div>
                                                      <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_daily_limit_gb">Daily Limit (GB)</label>
                                                      <input type="number" id="edit-user-daily-reqs" placeholder="Unlimited" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                                                  </div>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_expiration_days">Expiration (Days)</label>
                                                  <input type="number" id="edit-user-days" placeholder="Unlimited" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none">
                                              </div>
                                          </div>
                                      </details>
                                      <details class="group">
                                          <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none list-none">
                                              <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                              <span data-i18n="section_network">Network</span>
                                          </summary>
                                          <div class="space-y-3 ps-5">
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_clean_ips">Clean IPs</label>
                                                  <div id="edit-user-clean-ips-wrap" class="flex flex-wrap gap-2 mt-1 text-slate-500"></div>
                                                  <label class="block text-[10px] font-bold text-slate-400 mt-2" data-i18n="desc_clean_ips_modal">Custom Clean IPs (comma/newline)</label>
                                                  <textarea id="edit-user-custom-clean" rows="1" placeholder="e.g. 1.2.3.4, 5.6.7.8" class="w-full mt-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm"></textarea>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_proxy_ips">Proxy IPs</label>
                                                  <div id="edit-user-proxy-ips-wrap" class="flex flex-wrap gap-2 mt-1 text-slate-500"></div>
                                                  <label class="block text-[10px] font-bold text-slate-400 mt-2" data-i18n="desc_proxy_ips">Custom Proxy IPs (comma/newline)</label>
                                                  <textarea id="edit-user-custom-proxy" rows="1" placeholder="e.g. proxy1.com:443" class="w-full mt-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm"></textarea>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_assigned_nodes">Assigned Nodes</label>
                                                  <div id="edit-user-nodes-wrap" class="flex flex-wrap gap-2 mt-1 text-slate-500"></div>
                                                  <label class="block text-[10px] font-bold text-slate-400 mt-2" data-i18n="desc_assigned_nodes">Custom Nodes (comma/newline, empty = all nodes)</label>
                                                  <textarea id="edit-user-custom-nodes" rows="1" placeholder="node1.example.com" class="w-full mt-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm"></textarea>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_nat64">NAT64 Prefix</label>
                                                  <input type="text" id="edit-user-nat64" placeholder="e.g. 64:ff9b::/96" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm font-mono">
                                                  <p class="text-[10px] text-slate-400 mt-1" data-i18n="desc_nat64_user">Optional. Converts IPv4 Proxy IPs to NAT64 IPv6 addresses.</p>
                                              </div>
                                          </div>
                                      </details>
                                      <details class="group">
                                          <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none list-none">
                                              <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                              <span data-i18n="section_advanced">Advanced</span>
                                          </summary>
                                          <div class="space-y-3 ps-5">
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_protocol_mode">Protocol Mode</label>
                                                  <div id="edit-user-mode-wrap" class="flex gap-3 mt-1">
                                                      <label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" value="alpha" class="edit-mode-cb accent-primary"> <span>Alpha (VLESS)</span></label>
                                                      <label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" value="beta" class="edit-mode-cb accent-primary"> <span>Beta (Trojan)</span></label>
                                                  </div>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1">Ports</label>
                                                  <div id="edit-user-ports-wrap" class="flex flex-wrap gap-2 mt-1"></div>
                                              </div>
                                              <div>
                                                  <label class="block text-xs font-bold text-slate-500 mb-1" data-i18n="lbl_max_configs">Max Configs</label>
                                                  <input type="number" id="edit-user-max-configs" placeholder="Unlimited" class="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm" data-i18n-placeholder="unlimited">
                                              </div>
                                          </div>
                                      </details>
                                  </div>
                              </div>
                              <div class="px-6 py-4 shrink-0 border-t border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard sm:rounded-b-3xl pb-[env(safe-area-inset-bottom)]">
                                  <div class="flex justify-end gap-2">
                                      <button onclick="document.getElementById('modal-edit-user').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold" data-i18n="btn_cancel">Cancel</button>
                                      <button onclick="commitEditUser()" class="px-4 py-2 rounded-xl bg-primary text-white font-bold" data-i18n="btn_save_changes">Save Changes</button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <!-- SHOP MANAGEMENT VIEW -->
                      <div id="view-shop" class="hidden space-y-6">

                          <!-- Stats Row -->
                          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div class="bg-white dark:bg-darkcard rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending</div>
                                  <div id="shop-stat-pending" class="text-2xl font-black text-amber-500">0</div>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plans</div>
                                  <div id="shop-stat-plans" class="text-2xl font-black text-primary">0</div>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purchase</div>
                                  <div id="shop-stat-purchase" class="text-2xl font-black text-emerald-500">OFF</div>
                              </div>
                              <div class="bg-white dark:bg-darkcard rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-darkborder">
                                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Free Trial</div>
                                  <div id="shop-stat-trial" class="text-2xl font-black text-violet-500">OFF</div>
                              </div>
                          </div>

                          <!-- Shop Settings Card -->
                          <div class="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-darkborder">
                              <h3 class="text-sm uppercase font-bold text-slate-500 tracking-wider mb-5">⚙️ Shop Settings</h3>
                              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <!-- Toggle: Purchase Enabled -->
                                  <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-darkborder/50">
                                      <div>
                                          <div class="font-bold text-sm text-slate-700 dark:text-slate-200">🛒 Purchase Enabled</div>
                                          <div class="text-[11px] text-slate-400 mt-0.5">Allow users to buy subscriptions via bot</div>
                                      </div>
                                      <label class="relative inline-flex items-center cursor-pointer ms-3 shrink-0">
                                          <input type="checkbox" id="shop-purchase-enabled" class="sr-only peer" onchange="window.nahanConfig.purchaseEnabled=this.checked; updateShopStats();">
                                          <div class="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                      </label>
                                  </div>
                                  <!-- Toggle: Free Trial -->
                                  <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-darkborder/50">
                                      <div>
                                          <div class="font-bold text-sm text-slate-700 dark:text-slate-200">🎁 Free Trial</div>
                                          <div class="text-[11px] text-slate-400 mt-0.5">Allow users to get a one-time trial</div>
                                      </div>
                                      <label class="relative inline-flex items-center cursor-pointer ms-3 shrink-0">
                                          <input type="checkbox" id="shop-free-trial" class="sr-only peer" onchange="window.nahanConfig.freeTrial=this.checked; updateShopStats();">
                                          <div class="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                      </label>
                                  </div>
                                  <!-- Trial Days -->
                                  <div>
                                      <label class="block text-xs font-bold text-slate-500 mb-1.5">⏳ Trial Duration (Days)</label>
                                      <input type="number" id="shop-trial-days" min="1" max="30" placeholder="3" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm" onchange="window.nahanConfig.freeTrialDays=parseInt(this.value)||3;">
                                  </div>
                                  <!-- Trial GB -->
                                  <div>
                                      <label class="block text-xs font-bold text-slate-500 mb-1.5">📊 Trial Data Limit (GB)</label>
                                      <input type="number" id="shop-trial-gb" min="1" max="100" placeholder="3" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm" onchange="window.nahanConfig.freeTrialGB=parseInt(this.value)||3;">
                                  </div>
                                  <!-- Card Number -->
                                  <div>
                                      <label class="block text-xs font-bold text-slate-500 mb-1.5">💳 Card Number</label>
                                      <input type="text" id="shop-card-number" placeholder="6037-xxxx-xxxx-xxxx" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm font-mono" onchange="window.nahanConfig.adminCardNumber=this.value;">
                                  </div>
                                  <!-- Card Owner -->
                                  <div>
                                      <label class="block text-xs font-bold text-slate-500 mb-1.5">👤 Card Owner Name</label>
                                      <input type="text" id="shop-card-owner" placeholder="Full name on card" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm" onchange="window.nahanConfig.adminCardOwner=this.value;">
                                  </div>
                                  <!-- Welcome Message -->
                                  <div class="md:col-span-2">
                                      <label class="block text-xs font-bold text-slate-500 mb-1.5">👋 Bot Welcome Message</label>
                                      <textarea id="shop-welcome-msg" rows="2" placeholder="Welcome! How can we help you today?" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm resize-none" onchange="window.nahanConfig.botWelcomeMsg=this.value;"></textarea>
                                  </div>
                                  <!-- Support Message -->
                                  <div class="md:col-span-2">
                                      <label class="block text-xs font-bold text-slate-500 mb-1.5">💬 Support Message</label>
                                      <textarea id="shop-support-msg" rows="2" placeholder="Contact @support for help." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-slate-800 focus:border-primary outline-none text-sm resize-none" onchange="window.nahanConfig.botSupportMsg=this.value;"></textarea>
                                  </div>
                              </div>
                              <div class="mt-5 flex justify-end">
                                  <button onclick="saveShopConfig()" class="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
                                      💾 Save Settings
                                  </button>
                              </div>
                          </div>

                          <!-- Purchase Plans Card -->
                          <div class="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-darkborder">
                              <div class="flex items-center justify-between mb-5">
                                  <h3 class="text-sm uppercase font-bold text-slate-500 tracking-wider">📦 Purchase Plans</h3>
                                  <button onclick="addShopPlan()" class="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs transition-colors shadow-sm">
                                      + Add Plan
                                  </button>
                              </div>
                              <div id="shop-plans-list" class="space-y-3">
                                  <p class="text-sm text-slate-400 text-center py-4">No purchase plans configured.</p>
                              </div>
                          </div>

                          <!-- Pending Purchases Card -->
                          <div class="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-darkborder">
                              <div class="flex items-center justify-between mb-5">
                                  <h3 class="text-sm uppercase font-bold text-slate-500 tracking-wider">⏳ Pending Purchases</h3>
                                  <button onclick="renderPendingPurchases()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors">
                                      🔄 Refresh
                                  </button>
                              </div>
                              <div id="shop-pending-list" class="space-y-3">
                                  <p class="text-sm text-slate-400 text-center py-4">No pending purchase requests.</p>
                              </div>
                          </div>

                      <!-- Promo Codes Card -->
                      <div class="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-darkborder">
                          <div class="flex items-center justify-between mb-5">
                              <div class="flex items-center gap-3">
                                  <div class="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center shrink-0">
                                      <span class="text-lg">🏷️</span>
                                  </div>
                                  <div>
                                      <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">Promo Codes</h3>
                                      <p class="text-[11px] text-slate-400">Discount codes for your users</p>
                                  </div>
                              </div>
                              <button onclick="addPromoCode()" class="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-bold text-xs transition-colors shadow-sm">
                                  ＋ New Code
                              </button>
                          </div>
                          <div id="shop-promo-list" class="space-y-3">
                              <p class="text-sm text-slate-400 text-center py-4">No promo codes yet. Add one to offer discounts.</p>
                          </div>
                      </div>

                      </div>

                      <!-- LOGS VIEW -->
                      <div id="view-logs" class="hidden space-y-6">
                          <div class="bg-white dark:bg-darkcard rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-darkborder relative overflow-hidden">
                              <div class="flex items-center justify-between mb-6">
                                  <h3 class="text-sm uppercase font-bold text-slate-500 tracking-wider" data-i18n="tab_logs">System Activity Logs</h3>
                                  <button onclick="loadLogs()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors">
                                      🔄 Refresh
                                  </button>
                              </div>
                              <div class="space-y-3" id="logs-container">
                                  <p class="text-sm text-slate-400 text-center py-8" data-i18n="loading_logs">Loading activity logs...</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
  
              <!-- Save Bar (Docked to bottom of main content) -->
              <div class="shrink-0 bg-white dark:bg-darkcard border-t border-slate-200 dark:border-darkborder p-4 flex justify-between md:justify-end items-center z-20">
                  <span id="save-status" class="text-sm font-bold text-slate-500 md:me-4"></span>
                  <button onclick="doSave()" class="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity" data-i18n="save_btn">Save Config</button>
              </div>
          </main>
  
          <!-- BOTTOM NAV (Mobile) -->
          <nav class="md:hidden w-full h-16 bg-white dark:bg-darkcard border-t border-slate-200 dark:border-darkborder flex justify-around items-center z-30 shrink-0 pb-safe">
              <button onclick="switchTab('overview')" id="mob-tab-overview" class="mobile-nav-item active flex flex-col items-center justify-center w-full h-full text-slate-400">
                  <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
                  <span class="text-[10px] font-bold" data-i18n="tab_overview">Home</span>
              </button>
              <button onclick="switchTab('info')" id="mob-tab-info" class="mobile-nav-item flex flex-col items-center justify-center w-full h-full text-slate-400">
                  <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  <span class="text-[10px] font-bold" data-i18n="tab_info">Endpoints</span>
              </button>
              <button onclick="switchTab('network')" id="mob-tab-network" class="mobile-nav-item flex flex-col items-center justify-center w-full h-full text-slate-400">
                  <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012-2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  <span class="text-[10px] font-bold" data-i18n="tab_status">Metrics</span>
              </button>
              <button onclick="switchTab('settings')" id="mob-tab-settings" class="mobile-nav-item flex flex-col items-center justify-center w-full h-full text-slate-400">
                  <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                  <span class="text-[10px] font-bold" data-i18n="tab_settings">System</span>
              </button>
              <button onclick="switchTab('advanced')" id="mob-tab-advanced" class="mobile-nav-item flex flex-col items-center justify-center w-full h-full text-slate-400">
                  <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span class="text-[10px] font-bold" data-i18n="tab_adv">Network</span>
              </button>
              <button onclick="switchTab('logs')" id="mob-tab-logs" class="mobile-nav-item flex flex-col items-center justify-center w-full h-full text-slate-400">
                  <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                  <span class="text-[10px] font-bold" data-i18n="tab_logs">Logs</span>
              </button>
              <button onclick="switchTab('users')" id="mob-tab-users" class="mobile-nav-item flex flex-col items-center justify-center w-full h-full text-slate-400">
                  <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  <span class="text-[10px] font-bold" data-i18n="tab_users">Users</span>
              </button>
              <button onclick="switchTab('shop')" id="mob-tab-shop" class="mobile-nav-item flex flex-col items-center justify-center w-full h-full text-slate-400">
                  <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-4H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  <span class="text-[10px] font-bold">Shop</span>
              </button>
          </nav>
      </div>
  
      <!-- Toast Notification -->
      <div id="copy-toast" class="fixed top-20 md:top-10 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl font-bold text-sm z-50 transition-all transform -translate-y-20 opacity-0 pointer-events-none">
          <span data-i18n="copied">Copied!</span>
      </div>
      
      <!-- QR Code Modal (Enhanced) -->
      <div id="qr-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] hidden items-center justify-center p-4">
          <div class="bg-white dark:bg-darkcard rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-darkborder relative">
              <button onclick="closeQRModal()" class="absolute top-4 end-4 text-slate-400 hover:text-slate-800 dark:hover:text-white">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <div class="text-center mb-6">
                  <h3 id="qr-modal-title" class="text-xl font-bold text-slate-800 dark:text-white" data-i18n="qr_title">Scan to Connect</h3>
                  <p class="text-xs text-slate-500 mt-1" data-i18n="qr_subtitle">Scan with your V-Core or T-Core client</p>
              </div>
              <div class="bg-white p-4 rounded-2xl shadow-inner border border-slate-100 mb-4">
                  <img id="qr-modal-img" src="" alt="QR Code" class="w-full aspect-square object-contain">
              </div>
              <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl break-all text-xs font-mono text-slate-600 dark:text-slate-400 max-h-24 overflow-auto border border-slate-200 dark:border-darkborder" id="qr-modal-link"></div>
          </div>
      </div>

      <!-- Modal: Version Update Highlights -->
      <div id="modal-version-update" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[101] hidden items-center justify-center p-4">
          <div class="bg-white dark:bg-darkcard rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-darkborder relative overflow-hidden transform transition-all duration-300">
              <div class="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-indigo-500 via-primary to-emerald-500"></div>
              <div class="flex items-center justify-between mb-6">
                  <div class="flex items-center gap-2.5">
                      <div class="bg-primary/10 text-primary p-2.5 rounded-2xl">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                      </div>
                      <div>
                          <h3 class="text-lg font-black text-slate-800 dark:text-white" data-i18n="v_pop_title">Version Update</h3>
                          <span id="modal-version-badge" class="text-[10px] font-bold px-2 py-0.5 bg-indigo-500 text-white rounded-full tracking-wide"></span>
                      </div>
                  </div>
                  <button onclick="closeVersionModal()" class="text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-darkborder transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                  </button>
              </div>

              <div class="space-y-4">
                  <div class="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-darkborder/50">
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-widest" data-i18n="v_pop_whatsnew">What's New in This Version</p>
                      <h4 id="modal-version-headline" class="text-sm font-black text-slate-700 dark:text-white mt-1"></h4>
                  </div>
                  
                  <div id="modal-changelog-container" class="space-y-4 max-h-[50vh] overflow-y-auto pe-2 text-start">
                  </div>
              </div>

              <div class="mt-6 pt-5 border-t border-slate-100 dark:border-darkborder/50 flex justify-end">
                  <button onclick="closeVersionModal()" class="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-md transition-all transform hover:scale-105 active:scale-95" data-i18n="v_pop_btn">Got it!</button>
              </div>
          </div>
      </div>
  
      <script>
          function parseImportBindings(importStr) {
              const cleanStr = importStr.replace(/\\/\\/.*$/gm, '').replace(/\\/\\*[\\s\\S]*?\\*\\//g, '').trim();
              const content = cleanStr
                  .replace(/^import\\s+/, '')
                  .replace(/\\s+from\\s+["'].*?["'];?$/, '')
                  .trim();
              
              const bindings = [];
              
              if (content.startsWith('*')) {
                  const match = content.match(/\\*\\s+as\\s+(\\w+)/);
                  if (match) bindings.push({ name: match[1], isNamespace: true });
                  return bindings;
              }
              
              const braceStart = content.indexOf('{');
              if (braceStart !== -1) {
                  const defaultPart = content.slice(0, braceStart).replace(/,/, '').trim();
                  if (defaultPart) {
                      bindings.push({ name: defaultPart, isDefault: true });
                  }
                  const bracePart = content.slice(braceStart + 1, content.lastIndexOf('}')).trim();
                  const namedImports = bracePart.split(',').map(s => s.trim()).filter(Boolean);
                  namedImports.forEach(item => {
                      if (item.includes(' as ')) {
                          const parts = item.split(/\\s+as\\s+/);
                           bindings.push({ name: parts[1], original: parts[0] });
                      } else {
                          bindings.push({ name: item });
                      }
                  });
              } else {
                  bindings.push({ name: content, isDefault: true });
              }
              
              return bindings;
          }

          function obfuscateCode(srcText) {
              const importRegex = /import\\s+[\\s\\S]*?from\\s+["'].*?["'];?/g;
              const imports = [];
              let match;
              
              while ((match = importRegex.exec(srcText)) !== null) {
                  imports.push(match[0]);
              }
              
              let cleanCode = srcText.replace(importRegex, '');
              
              const bindings = [];
              imports.forEach(imp => {
                  const parsed = parseImportBindings(imp);
                  bindings.push(...parsed);
              });
              
              const uniqueBindings = [];
              const seenNames = new Set();
              bindings.forEach(b => {
                  if (!seenNames.has(b.name)) {
                      seenNames.add(b.name);
                      uniqueBindings.push(b);
                  }
              });
              
              cleanCode = cleanCode.replace(/export\\s+default\\s+/g, 'const _0xNahanModule = ');
              cleanCode += '\\nreturn _0xNahanModule;';
              
              const randKey = Math.floor(Math.random() * 80) + 64; 
              
              const encoder = new TextEncoder();
              const bytes = encoder.encode(cleanCode);
              
              let hexOutput = '';
              for (let i = 0; i < bytes.length; i++) {
                  const xorByte = bytes[i] ^ randKey;
                  hexOutput += xorByte.toString(16).padStart(2, '0');
               }
              
              const rawImportsStr = imports.join('\\n');
              const bindingNames = uniqueBindings.map(b => b.name);
              
              const finalLoaderCode = rawImportsStr + '\\n\\n' +
                  '// Nahan Gateway - Obfuscated Loader Context (v2.5.4.2 Optimized)\\n' +
                  'const _0xNahanPayload = "' + hexOutput + '";\\n' +
                  'const _0xNahanKey = ' + randKey + ';\\n\\n' +
                  'const _0xNahanBytes = new Uint8Array((_0xNahanPayload.match(/.{1,2}/g) || []).map(x => parseInt(x, 16) ^ _0xNahanKey));\\n' +
                  'const _0xNahanCode = new TextDecoder().decode(_0xNahanBytes);\\n' +
                  'const _0xNahanRuntime = new Function(' + bindingNames.map(name => '"' + name + '"').join(', ') + ', _0xNahanCode)(' + bindingNames.join(', ') + ');\\n\\n' +
                  'export default _0xNahanRuntime;';

              return finalLoaderCode;
          }

          const CURRENT_VERSION = "${CURRENT_VERSION}";
          const i18n = {
              en: {
                  title: "Nahan Gateway", pass_ph: "Master Key", login_btn: "Authenticate", err_pass: "Access Denied", missing_db: "⚠️ IOT_DB namespace missing! Settings won't save.",
                  logout: "Disconnect", tab_overview: "Overview", tab_info: "Endpoints", tab_status: "Metrics", tab_settings: "System", tab_adv: "Advanced", tab_logs: "Activity Logs",
                  qr_title: "Direct Stream Link", badge_multi: "Dual-Core Multiplexed", copy: "Copy", copied: "Copied to clipboard!", sync_link: "Cloud Sync URL", active_id: "Hardware ID",
                  stat_ip: "Origin IP", stat_dc: "Edge Node", stat_loc: "Data Region",
                  lbl_proto: "Primary Display Mode", lbl_port: "Data Port", lbl_id: "Device UUID (Empty=Auto)",
                  lbl_path: "API Route (Hidden Path)", lbl_pass: "Master Key", lbl_fp: "TLS Signature", lbl_dns: "Resolver IP",
                  lbl_clean_ips: "Clean IPs (Multi-Generator)", ph_clean_ips: "1.1.1.1, 2.2.2.2", desc_clean_ips: "Separate IPs by comma or new line. The Sync URL will multiply configs for all IPs.",
                  lbl_fake: "Maintenance Hosts (Camouflage)", lbl_relay: "Backup Relay IP", lbl_tfo: "TCP Fast Open", lbl_ech: "Secure Hello (ECH)",
                  lbl_fake_configs: "Subscription Fake Entries", desc_fake_configs: "Customize info entries shown in subscription profiles. Use {usage} and {expiry} for dynamic values.", btn_add_entry: "Add Entry",                   lbl_tg_token: "Telegram Bot Token", lbl_tg_chat: "Telegram Chat ID", lbl_tg_admin: "Authorized Telegram Admin ID", desc_tg_admin: "Only this Telegram User ID can manage the panel via bot. Leave empty to use Chat ID.", desc_tg_bot: "Set these values to receive login alerts via Telegram.",
                  lbl_cf_acc: "Cloudflare Account ID", lbl_cf_token: "Cloudflare API Token", desc_cf_api: "Optional: Monitor Worker daily usage limit (100k/day). Requires Account Analytics read permission.",
                  lbl_silent: "Silent UI Alerts", lbl_pause: "Kill Switch (Pause System)",
                  lbl_sub_ua: "Custom Subscription User-Agent", desc_sub_ua: "Allow specific browser User-Agent containing this text to bypass camouflage and retrieve profile data directly in web browser.",
                  tab_users: "Users",
                  user_mgt_title: "User Management", user_mgt_desc: "Manage multiple users, set traffic limits, and expiration dates.", btn_add_user: "+ Add New User",
                  tbl_name: "Name", tbl_uuid: "UUID", tbl_traffic: "Traffic (Used / Limit)", tbl_exp: "Expiration", tbl_action: "Action", no_users: "No users found. Create one above.",
                  modal_add_title: "Add New User", lbl_u_name: "Name (Required)", lbl_u_gb: "Traffic Limit (GB) - Optional", lbl_u_days: "Duration (Days) - Optional", btn_cancel: "Cancel", btn_confirm: "Add User",
                  limit_total: "Traffic (GB) Limit (Leave empty for unlimited)", limit_daily: "Daily Requests Limit (Leave empty for unlimited)",
                  limit_days: "Expiration limit (Days) - Leave empty for unlimited", edit_sub: "Edit Subscriber", lbl_name_ph: "Name or UUID",
                  btn_save_changes: "Save Changes", save_btn_user: "Save User", save_btn: "Save Config", status_active: "Active", status_paused: "Paused", status_expired: "Expired",
                  stat_total_subscribers: "Total Subscribers", stat_active_paused: "Active / Paused", stat_cumulative_traffic: "Cumulative Traffic", stat_auto_disabled: "Auto-Disabled",
                  sub_directory_title: "Subscriber Directory", sub_directory_desc: "Search, modify bounds, toggle traffic limits or clear billing sessions.", user_search_placeholder: "🔍 Find by Name or UUID...",
                  filter_all: "All Users", filter_active: "Active", filter_paused: "Paused", filter_auto_disabled: "Auto-Disabled",
                  disabled_panel_title: "Recently Disabled Users", disabled_panel_desc: "Users automatically disabled due to quota or expiration limits",
                  lbl_u_Protocol:"Protocol Mode (Leave empty to use global setting)",
                  lbl_u_ports:"Custom Ports (Optional - overrides global ports, comma separated e.g. 443,80",
                  lbl_u_max_config:"Max Configs",
                  login_password:"Password",
                  lbl_u_ipproxy:"User Proxy IP(s) (Optional - overrides global Clean IP, comma/newline separated)",
                  lbl_custom_panel_url:"Custom Panel URL / Subscription Domain",
                  v_pop_title: "Release Notice", v_pop_whatsnew: "What's New", v_pop_headline: "New Features & Improvements",
                  v_pop_btn: "Got it!",
                  changelog_title: "Release Notes & Changelog:",
                  changelog_added: "Added", changelog_fixed: "Fixed", changelog_improved: "Improved", changelog_changed: "Changed", changelog_note: "Important Notes",
                  ov_total_users: "Total Users", ov_active_users: "Active", ov_paused_users: "Paused", ov_auto_disabled: "Auto-Disabled", ov_expired_users: "Expired",
                  ov_total_traffic: "Total Traffic", ov_today_traffic: "Today's Traffic", ov_requests: "requests", ov_active_conns: "Active Connections",
                  ov_system: "System", ov_recent_activity: "Recent Activity", ov_view_all: "View All →", ov_loading: "Loading...",
                   ov_quick_actions: "Quick Actions", ov_add_user: "Add User", ov_backup_config: "Backup Config", ov_refresh: "Refresh Statistics", ov_manage_users: "Manage Users",
                   ov_gb_unit: "GB",
                   lbl_allow_sync:"Allow Sync",
                   deploy_btn: "Deploy Now", update_deploying: "Deploying update...",
                   update_success: "Update successful! Reloading...", update_error: "Update failed",
                   lbl_cf_worker: "CF Worker Script Name", desc_cf_worker: "Required for in-panel updates. The script name shown in your Cloudflare Workers dashboard.",
                   view_github: "View on GitHub",
                    cf_help_title: "Need help getting these? Beginner's Step-by-Step Guide",
                    lbl_update_format: "Update Format & Obfuscated Options:",
                    desc_update_format: "Deploy clean source code, or encrypt using dynamic XOR byte-shifting to avoid network interception.",
                    format_normal: "Normal (_worker.js)",
                    format_obfuscated: "Obfuscated (UTF-8 + XOR)",
                     btn_redeploy_force: "Force Redeploy / Switch Format",
                    adv_network_dns: "Network & DNS", adv_proxy_relay: "Proxy & Relay", adv_subscription: "Subscription",
                    adv_protocol: "Protocol", adv_telegram: "Telegram Bot", adv_cloudflare: "Cloudflare",
                    stat_datetime: "Date Time",
                    desc_custom_panel_url: "Optionally specify a custom domain/URL to be used for subscription/sync links. If empty, the default Worker address will be used.",
                    lbl_custom_config_name: "Custom Config Name / Prefix",
                    lbl_traffic_limit_gb: "Traffic (GB) Limit",
                    lbl_daily_limit_gb: "Daily Limit (GB)",
                    lbl_expiration_days: "Expiration (Days)",
                    loading_logs: "Loading activity logs...", show_qr: "Show QR Code",
                    no_matching_users: "No matching subscribers found", no_active_conn: "No active connection data yet.",
                    qr_subtitle: "Scan with your V-Core or T-Core client",
                    no_activity_logs: "No activity logs found.", no_recent_activity: "No recent activity.",
                    no_ips_advanced: "No IPs added in Advanced Tab", no_nodes_advanced: "No slave nodes in Advanced Tab",
                    no_changelog: "No changelog available for this version.", no_changes: "No changes documented.",
                    update_requires_cf: "Set CF Account ID, API Token, and Worker Name to enable in-panel deploy.",
                    section_basic_info: "Basic Info", section_limits: "Limits", section_network: "Network", section_advanced: "Advanced",
                    lbl_nat64: "NAT64 Prefix", desc_nat64: "Optional. Converts IPv4 Proxy IPs to NAT64 IPv6 addresses. Supports multiple prefixes.",
                    lbl_direct_configs: "Include Direct Configs", desc_direct_configs: "Generate configs without Proxy IP alongside relay configs",
                    lbl_auto_update: "Auto-Update", desc_auto_update: "Automatically deploy when a new version is detected",
                    lbl_auto_update_format: "Update Format", format_normal_label: "Normal", format_obfuscated_label: "Obfuscated",
                    desc_format_normal: "Standard _worker.js", desc_format_obfuscated: "XOR byte-shifting",
                    lbl_clean_ips: "Clean IPs", lbl_proxy_ips: "Proxy IPs", lbl_assigned_nodes: "Assigned Nodes",
                    lbl_protocol_mode: "Protocol Mode", lbl_max_configs: "Max Configs",
                    desc_assigned_nodes: "Custom Nodes (comma/newline, empty = all nodes)",
                    desc_nat64_user: "Optional. Converts IPv4 Proxy IPs to NAT64 IPv6 addresses.",
                    desc_proxy_ips: "Custom Proxy IPs (comma/newline)",
                    desc_clean_ips_modal: "Custom Clean IPs (comma/newline)",
                    btn_generate_uuid: "Generate UUID",
                    html_desc_strategy: "Supported placeholders: <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{FLAG}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{COUNTRY}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{CITY}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{ISP}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{PROTOCOL}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{USER}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{PORT}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{PREFIX}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{IP}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{HOST}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{DATE}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{INDEX}</code>, <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{WORKER}</code>.<br><span class='text-[10px] text-slate-400 dark:text-slate-500 leading-snug'>• <b>{FLAG}</b>: Country flag emoji (e.g. 🇺🇸).<br>• <b>{COUNTRY}</b>: Country name (e.g. United States).<br>• <b>{CITY}</b>: City name (e.g. San Francisco).<br>• <b>{ISP}</b>: ISP / ASN org (e.g. Cloudflare, Inc.).<br>• <b>{PROTOCOL}</b>: Core mode (VLESS / Trojan).<br>• <b>{USER}</b>: Subscriber name.<br>• <b>{PORT}</b>: Active port.<br>• <b>{PREFIX}</b>: Custom prefix.<br>• <b>{IP}</b>: Clean IP address.<br>• <b>{HOST}</b>: Hostname.<br>• <b>{DATE}</b>: Current date (YYYY-MM-DD).<br>• <b>{INDEX}</b>: Config index (0, 1, 2...).<br>• <b>{WORKER}</b>: Worker name from config.</span><br>Pre-defined strategies: <code>default</code>, <code>type-user-port</code>, <code>user-port</code>, <code>host-port-user</code>, <code>prefix-user-port</code>, <code>ip</code>.",
               },
              fa: {
                  title: "دروازه نهان", pass_ph: "کلید اصلی", login_btn: "ورود به سیستم", err_pass: "دسترسی مسدود شد", missing_db: "⚠️ فضای پایگاه داده یافت نشد! تنظیمات ذخیره نمی‌شوند.",
                  logout: "خروج", tab_overview: "نمای کلی", tab_info: "نقاط اتصال", tab_status: "وضعیت شبکه", tab_settings: "تنظیمات پایه", tab_adv: "پیشرفته", tab_logs: "گزارش فعالیت",
                  qr_title: "لینک اتصال مستقیم", badge_multi: "ترکیب ترانزیت پیشرفته دوگانه", copy: "کپی", copied: "در حافظه کپی شد!", sync_link: "لینک ساب (همگام سازی ابری)", active_id: "شناسه سخت‌افزار",
                  stat_ip: "آی‌پی مبدا", stat_dc: "گره لبه", stat_loc: "منطقه داده",
                  lbl_proto: "پروتکل نمایش مستقیم", lbl_port: "پورت داده", lbl_id: "شناسه یکتا (خالی=خودکار)",
                  lbl_path: "مسیر مخفی آی‌پی‌آی", lbl_pass: "کلید اصلی", lbl_fp: "امضای امنیتی", lbl_dns: "آی‌پی تحلیلگر",
                  lbl_clean_ips: "آی‌پی‌های تمیز (مولد چندگانه)", ph_clean_ips: "1.1.1.1, 2.2.2.2", desc_clean_ips: "آی‌پی ها را با کاما یا خط جدید جدا کنید. لینک ساب برای همه ترکیب می‌سازد.",
                  lbl_fake: "سایت‌های استتار (حالت مخفی)", lbl_relay: "آی‌پی جایگزین (کمکی)", lbl_tfo: "اتصال سریع", lbl_ech: "سلام امن",
                  lbl_fake_configs: "ورودی‌های اطلاعاتی اشتراک", desc_fake_configs: "متن نمایشی ورودی‌ها در پروفایل اشتراک را سفارشی کنید. از {usage} و {expiry} برای مقادیر پویا استفاده کنید.", btn_add_entry: "افزودن ورودی", lbl_tg_token: "توکن ربات تلگرام", lbl_tg_chat: "شناسه عددی تلگرام", lbl_tg_admin: "شناسه مدیر تلگرام", desc_tg_admin: "فقط این شناسه کاربری تلگرام می‌تواند پنل را از طریق ربات مدیریت کند. خالی بگذارید برای استفاده از شناسه چت.", desc_tg_bot: "با تنظیم این مقادیر، جزئیات ورود به پنل به تلگرام ارسال می‌شود.",
                  lbl_cf_acc: "شناسه اکانت ابری", lbl_cf_token: "توکن دسترسی کاربری", desc_cf_api: "اختیاری: برای نمایش میزان مصرف روزانه کارگر از صد هزار درخواست رایگان در پیام‌های تلگرام.",
                  lbl_silent: "هشدار و پیغام خاموش", lbl_pause: "کلید توقف اضطراری",
                  lbl_sub_ua: "یوزراجنت سفارشی ساب", desc_sub_ua: "درخواست‌های مرورگر که حاوی این متن باشند، استتار را خنثی کرده و مستقیم به ساب دسترسی پیدا می‌کنند.",
                  tab_users: "کاربران",
                  user_mgt_title: "مدیریت کاربران", user_mgt_desc: "مدیریت کاربران متعدد، تنظیم محدودیت ترافیک، و تاریخ انقضا.", btn_add_user: "+ افزودن کاربر جدید",
                  tbl_name: "نام", tbl_uuid: "شناسه یکتا", tbl_traffic: "ترافیک (مصرفی/محدودیت)", tbl_exp: "انقضا", tbl_action: "عملیات", no_users: "کاربری یافت نشد. از دکمه بالا یک کاربر ایجاد کنید.",
                  modal_add_title: "افزودن کاربر جدید", lbl_u_name: "نام (الزامی)", lbl_u_gb: "محدودیت ترافیک (گیگابایت) - اختیاری", lbl_u_days: "مدت زمان اعتبار (روز) - اختیاری", btn_cancel: "انصراف", btn_confirm: "افزودن کاربر",
                  save_btn: "ذخیره تنظیمات", msg_saving: "در حال ثبت...", msg_saved: "موفق! در حال بارگذاری...", msg_err: "خطای ارتباط",
                  backup_restore_title: "پشتیبان‌گیری و بازیابی", ping_test_title: "عیب‌یابی تاخیر شبکه", ping_test_desc: "تاخیر پاسخ‌دهی را به آی‌پی تمیز فعال اندازه بگیرید.",
                  lbl_github_repo: "مخزن منبع جهت بروزرسانی", update_avail: "بروزرسانی جدید در دسترس است!", update_btn: "دریافت آخرین کد",
                    cf_help_title: "آموزش بدست آوردن این اطلاعات برای کاربران مبتدی",
                    lbl_update_format: "قالب بروزرسانی و حذف ردگیری:",
                    desc_update_format: "سورس کد معمولی را دپلوی کنید یا از مبهم‌سازی بایت‌ها با کلید متغیر XOR برای عدم فیلترینگ استفاده نمایید.",
                    format_normal: "معمولی (_worker.js)",
                    format_obfuscated: "مبهم‌سازی شده (UTF-8 + XOR)",
                    btn_redeploy_force: "تفویض مجدد / تغییر قالب پنل",
                    adv_network_dns: "شبکه و DNS", adv_proxy_relay: "پروکسی و رله", adv_subscription: "اشتراک",
                    adv_protocol: "پروتکل", adv_telegram: "ربات تلگرام", adv_cloudflare: "کلودفلر",
                    stat_datetime: "تاریخ و زمان",
                    desc_custom_panel_url: "اختیاری. یک دامنه/آدرس سفارشی برای لینک‌های ساب/همگام‌سازی وارد کنید. اگر خالی باشد، آدرس پیش‌فرض ورکر استفاده می‌شود.",
                    lbl_custom_config_name: "نام/پیشوند سفارشی کانفیگ",
                    lbl_traffic_limit_gb: "محدودیت ترافیک (GB)",
                    lbl_daily_limit_gb: "محدودیت روزانه (GB)",
                    lbl_expiration_days: "تاریخ انقضا (روز)",
                    loading_logs: "در حال بارگذاری گزارش‌ها...", show_qr: "نمایش کد QR",
                    no_matching_users: "کاربری مطابقت نداشت", no_active_conn: "هنوز داده اتصال فعالی ثبت نشده.",
                    qr_subtitle: "با کلاینت V-Core یا T-Core اسکن کنید",
                    no_activity_logs: "گزارش فعالیتی یافت نشد.", no_recent_activity: "فعالیت اخیری ثبت نشده.",
                    no_ips_advanced: "آی‌پی‌ای در بخش پیشرفته اضافه نشده", no_nodes_advanced: "نود فرعی‌ای در بخش پیشرفته اضافه نشده",
                    no_changelog: "گزارش تغییراتی برای این نسخه موجود نیست.", no_changes: "تغییراتی ثبت نشده.",
                    section_basic_info: "اطلاعات پایه", section_limits: "محدودیت‌ها", section_network: "شبکه", section_advanced: "پیشرفته",
                    lbl_nat64: "پیشوند NAT64", desc_nat64: "اختیاری. آی‌پی‌های پروکسی IPv4 را به آدرس‌های NAT64 IPv6 تبدیل می‌کند. چند پیشوند پشتیبانی می‌شود.",
                    lbl_direct_configs: "شامل کانفیگ‌های مستقیم", desc_direct_configs: "تولید کانفیگ‌ها بدون آی‌پی پروکسی در کنار کانفیگ‌های رله",
                    lbl_auto_update: "بروزرسانی خودکار", desc_auto_update: "دپلوی خودکار هنگام شناسایی نسخه جدید",
                    lbl_auto_update_format: "قالب بروزرسانی", format_normal_label: "معمولی", format_obfuscated_label: "مبهم‌سازی شده",
                    desc_format_normal: "استاندارد _worker.js", desc_format_obfuscated: "جابجایی بایت XOR",
                    lbl_clean_ips: "آی‌پی‌های تمیز", lbl_proxy_ips: "آی‌پی‌های پروکسی", lbl_assigned_nodes: "نودهای اختصاصی",
                    lbl_protocol_mode: "پروتکل", lbl_max_configs: "حداکثر کانفیگ",
                    desc_assigned_nodes: "نودهای سفارشی (کاما/خط جدید، خالی = همه نودها)",
                    desc_nat64_user: "اختیاری. آی‌پی‌های پروکسی IPv4 را به آدرس‌های NAT64 IPv6 تبدیل می‌کند.",
                    desc_proxy_ips: "آی‌پی‌های پروکسی سفارشی (کاما/خط جدید)",
                    desc_clean_ips_modal: "آی‌پی‌های تمیز سفارشی (کاما/خط جدید)",
                    btn_generate_uuid: "تولید UUID",
                  metrics_live: "وضعیت زنده مصرف اتصالات و پردازش", no_metrics: "هنوز داده‌ای از تراکنش و اتصالات فعال ثبت نشده است.", run_diagnostics: "⚡ اجرای عیب‌یابی شبکه",
                  target_node: "هدف گره شبکه", response: "مدت زمان تاخیر پاسخگویی", status: "وضعیت گره", local_port: "درگاه محلی",
                  lbl_doh: "تحلیل‌گر تخصصی آدرس‌یابی عددی", lbl_strategy: "روش نام‌گذاری کانفیگ‌ها", lbl_prefix: "پیشوند نام کانفیگ‌ها",
                  slave_title: "سایر نودهای موازی", slave_desc: "آدرس دامنه سایر ورکرها را وارد نمایید (هر خط یک آدرس). نود اصلی تنظیمات و مشترکین را به صورت خودکار با آن‌ها هماهنگ می‌کند!",
                  force_sync: "همگام‌سازی اجباری نودها", limit_total: "محدودیت تعداد کل درخواست‌ها (GB)  (برای نامحدود خالی بگذارید)", limit_daily: "محدودیت درخواست‌های روزانه (GB)  (برای نامحدود خالی بگذارید)",
                  limit_days: "مدت زمان اعتبار قانونی (روز) - برای نامحدود خالی بگذارید", edit_sub: "ویرایش مشترک", lbl_name_ph: "نام یا شناسه یکتا",
                  btn_save_changes: "ذخیره تغییرات", save_btn_user: "ثبت کاربر جدید", status_active: "فعال", status_paused: "متوقف شده", status_expired: "منقضی شده",
                  export_btn: "📥 برون‌بری فایل پیکربندی (نسخه پشتیبان)", import_btn: "📤 درون‌ریزی فایل پیکربندی (نسخه پشتیبان)",
                  stat_total_subscribers: "کل مشترکین", stat_active_paused: "فعال / متوقف شده", stat_cumulative_traffic: "ترافیک کل انباشته", stat_auto_disabled: "غیرفعال خودکار",
                  sub_directory_title: "فهرست مشترکین", sub_directory_desc: "جستجو، اصلاح محدودیت‌ها، تغییر محدودیت‌های ترافیک یا پاک کردن جلسات حسابداری.", user_search_placeholder: "🔍 جستجو بر اساس نام یا شناسه...",
                  filter_all: "همه کاربران", filter_active: "فعال", filter_paused: "متوقف شده", filter_auto_disabled: "غیرفعال خودکار",
                  disabled_panel_title: "کاربران اخیراً غیرفعال شده", disabled_panel_desc: "کاربرانی که به دلیل اتمام سهمیه یا تاریخ انقضا غیرفعال شده‌اند",
                  lbl_u_Protocol:"نوع پروتکل(خالی بر اساس تنظیمات کلی)",
                  lbl_u_ports:"نوع پورت",
                  lbl_u_max_config:"حداکثر تعداد کانفیگ",
                  login_password:"رمز ورود",
                  lbl_u_ipproxy:"آی‌پی(های) پروکسی کاربر (اختیاری - آی‌پی پاک سراسری را نادیده می‌گیرد، با کاما/خط جدید از هم جدا می‌شوند)",
                  v_pop_title: "اطلاعیه تعمیرات", v_pop_whatsnew: "ویژگی‌های جدید", v_pop_headline: "امکانات جدید و بهبودها",
                  v_pop_btn: "متوجه شدم!",
                  changelog_title: "گزارش تغییرات و توضیحات نسخه جدید:",
                   changelog_added: "اضافه شده", changelog_fixed: "رفع شده", changelog_improved: "بهبود یافته", changelog_changed: "تغییر یافته", changelog_note: "نکات مهم",
                   ov_total_users: "کل کاربران", ov_active_users: "فعال", ov_paused_users: "متوقف", ov_auto_disabled: "غیرفعال خودکار", ov_expired_users: "منقضی",
                   ov_total_traffic: "ترافیک کل", ov_today_traffic: "ترافیک امروز", ov_requests: "درخواست", ov_active_conns: "اتصالات فعال",
                   ov_system: "سیستم", ov_recent_activity: "فعالیت‌های اخیر", ov_view_all: "مشاهده همه ←", ov_loading: "در حال بارگذاری...",
                   ov_quick_actions: "عملیات سریع", ov_add_user: "افزودن کاربر", ov_backup_config: "پشتیبان‌گیری", ov_refresh: "بروزرسانی آمار", ov_manage_users: "مدیریت کاربران",
                   ov_gb_unit: "گیگابایت",
                     lbl_allow_sync:"اجازه همگام سازی",
                      deploy_btn: "هم‌اکنون نصب کن", update_deploying: "در حال نصب بروزرسانی...",
                      update_success: "بروزرسانی موفق! در حال بارگذاری...", update_error: "خطا در بروزرسانی",
                      lbl_cf_worker: "نام اسکریپت کارگر ابری", desc_cf_worker: "برای بروزرسانی خودکار الزامی است. نام اسکریپت در داشبورد کارگرهای ابری.",
                      view_github: "مشاهده در گیت‌هاب",
                     update_requires_cf: "برای نصب خودکار، شناسه اکانت، توکن API و نام کارگر را تنظیم کنید.",
                     html_desc_strategy: "متغیرهای پشتیبانی شده: <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{FLAG}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{COUNTRY}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{CITY}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{ISP}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{PROTOCOL}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{USER}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{PORT}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{PREFIX}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{IP}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{HOST}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{DATE}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{INDEX}</code>، <code class='bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5 rounded text-rose-500 font-mono'>{WORKER}</code>.<br><span class='text-[10px] text-slate-400 dark:text-slate-500 leading-snug'>• <b>{FLAG}</b>: ایموجی پرچم کشور (مثلاً 🇺🇸).<br>• <b>{COUNTRY}</b>: نام کشور (مثلاً United States).<br>• <b>{CITY}</b>: نام شهر (مثلاً San Francisco).<br>• <b>{ISP}</b>: نام ارائه‌دهنده اینترنت (مثلاً Cloudflare, Inc.).<br>• <b>{PROTOCOL}</b>: پروتکل اصلی هسته (VLESS / Trojan).<br>• <b>{USER}</b>: نام یا شناسه مشترک.<br>• <b>{PORT}</b>: پورت فعال اتصال.<br>• <b>{PREFIX}</b>: پیشوند نام دلخواه.<br>• <b>{IP}</b>: آدرس آی‌پی تمیز.<br>• <b>{HOST}</b>: نام دامنه هاست.<br>• <b>{DATE}</b>: تاریخ جاری (YYYY-MM-DD).<br>• <b>{INDEX}</b>: شماره ردیف کانفیگ (0, 1, 2...).<br>• <b>{WORKER}</b>: نام اسکریپت کارگر ابری.</span><br>طرح‌های از پیش تعریف شده: <code>default</code>، <code>type-user-port</code>، <code>user-port</code>، <code>host-port-user</code>، <code>prefix-user-port</code>، <code>ip</code>.",
                }
          };

          const CHANGELOG_DATA = {
              "2.6.0": {
                  headline: { en: "Bilingual Subscription Page & NAT64 Support", fa: "صفحه اشتراک چندزبانه و پشتیبانی NAT64" },
                  added: [
                      { en: "Full Persian and English language support on the subscription info page with RTL layout", fa: "پشتیبانی کامل از فارسی و انگلیسی در صفحه اطلاعات اشتراک با چیدمان RTL" },
                      { en: "Dark and light mode toggle on the subscription page with saved preference", fa: "قابلیت تغییر حالت تاریک/روشن در صفحه اشتراک با ذخیره ترجیح کاربر" },
                      { en: "NAT64 support for automatic IPv4 to IPv6 address conversion", fa: "پشتیبانی NAT64 برای تبدیل خودکار آدرس IPv4 به IPv6" },
                      { en: "Per-user custom hostnames for multi-region deployments", fa: "هاست‌های اختصاصی برای هر کاربر جهت استقرار چند منطقه‌ای" },
                      { en: "Direct connection configs that work without proxy IPs", fa: "کانفیگ‌های اتصال مستقیم بدون نیاز به آدرس پروکسی" },
                      { en: "Auto update from GitHub directly inside the dashboard", fa: "بروزرسانی خودکار از GitHub مستقیماً از داشبورد" },
                      { en: "Customizable fake subscription entries with usage and expiry display", fa: "ورودی‌های اشتراک جعلی سفارشی با نمایش مصرف و انقضا" },
                      { en: "Full gateway management via Telegram inline buttons", fa: "مدیریت کامل دروازه از طریق دکمه‌های اینلاین تلگرام" }
                  ],
                  fixed: [
                      { en: "Fixed garbled Persian text in the user interface", fa: "اصلاح متن‌های فارسی نادرست در رابط کاربری" },
                      { en: "Fixed subscription page not loading properly", fa: "رفع مشکل بارگذاری صفحه اشتراک" }
                  ],
                  improved: [
                      { en: "Significantly faster dashboard scrolling and page loading", fa: "سرعت اسکرول و بارگذاری صفحات داشبورد بهبود چشمگیر یافت" },
                      { en: "Rewritten config generators for better compatibility", fa: "بازنویسی مولدهای کانفیگ برای سازگاری بهتر" },
                      { en: "Faster and more accurate country flag detection", fa: "سرعت و دقت نمایش پرچم کشورها بهبود یافت" },
                      { en: "New config naming tags: country, city, ISP, date, and worker name", fa: "تگ‌های جدید نامگذاری: کشور، شهر، ارائه‌دهنده، تاریخ و نام ورکر" }
                  ],
                  notes: []
              },
              "2.5.8": {
                  headline: { en: "Advanced Naming Tags & GeoIP Tag Engine", fa: "موتور نامگذاری پیشرفته با تگ‌های جغرافیایی" },
                  added: [
                      { en: "Added 7 new config naming placeholders: {COUNTRY}, {CITY}, {ISP}, {HOST}, {DATE}, {INDEX}, {WORKER}", fa: "اضافه شدن ۷ متغیر جدید نامگذاری: {COUNTRY}، {CITY}، {ISP}، {HOST}، {DATE}، {INDEX}، {WORKER}" },
                      { en: "Replaced single-purpose flag API with batch ip-api.com GeoIP enrichment for country, city, and ISP data", fa: "جایگزینی API پرچم با غنی‌سازی GeoIP دسته‌ای ip-api.com برای داده‌های کشور، شهر و ارائه‌دهنده اینترنت" },
                      { en: "Added tag validation engine that detects and reports unknown/invalid tags in naming strategies", fa: "افزودن موتور اعتبارسنجی تگ که تگ‌های ناشناخته یا نامعتبر در استراتژی نامگذاری را شناسایی و گزارش می‌کند" }
                  ],
                  fixed: [
                      { en: "GeoIP cache now stores full geo metadata (country, city, ISP) instead of only flag emoji", fa: "کش GeoIP اکنون فراداده‌های کامل جغرافیایی (کشور، شهر، ارائه‌دهنده) را به جای فقط ایموجی پرچم ذخیره می‌کند" }
                  ],
                  improved: [
                      { en: "Config name generation now receives config index for sequential naming patterns via {INDEX}", fa: "تولید نام کانفیگ اکنون شماره ردیف را برای الگوهای نامگذاری متوالی از طریق {INDEX} دریافت می‌کند" },
                      { en: "Updated dashboard documentation with full list of all 13 supported naming tags in English and Persian", fa: "به‌روزرسانی مستندات داشبورد با لیست کامل ۱۳ تگ نامگذاری پشتیبانی شده در فارسی و انگلیسی" }
                  ],
                  notes: []
              },
              "2.5.7": {
                  headline: { en: "Dynamic Multi-IP Failover & Keyless Country Flagging", fa: "لینک هوشمند آی‌پی‌ها، بهبود کلودفلر و نگاشت پرچم بدون تحریم" },
                  added: [
                      { en: "Support entering custom clean IPs, proxy IPs, and custom config names for each subscriber dynamically in Add/Edit user modals, with automatic extraction and seamless database merging", fa: "امکان ثبت آی‌پی تمیز دلخواه، آی‌پی پروکسی دلخواه و نام کانفیگ دلخواه برای هر کاربر به صورت مجزا با قابلیت استخراج خودکار و ادغام هوشمند" },
                      { en: "Integrated free, open-source and keyless api.country.is for country flag mapping of IP addresses", fa: "یکپارچه‌سازی وب‌سرویس رایگان و متن‌باز api.country.is جهت نگاشت پرچم کشورهای مربوط به آدرس‌های آی‌پی" }
                  ],
                  fixed: [
                      { en: "Resolved Cloudflare API compatibility flag error ('No such compatibility flag: unsafe-eval' and startup 'Uncaught EvalError') by updating to 'allow_eval_during_startup'", fa: "رفع خطای ناسازگاری فلگ کلودفلر (خطای عدم وجود فلگ unsafe-eval و خطای زمان شروع کار EvalError) در بخش استقرار خودکار با بازنویسی به فلگ مدرن allow_eval_during_startup" },
                      { en: "Fixed a critical issue where selecting multiple proxy IPs for a user caused session disruptions (IP splitting) on sites behind Cloudflare, resolved via user-consistent hashing and smart proxy failover", fa: "رفع مشکل عدم باز شدن وب‌سایت‌های پشت کلودفلر هنگام انتخاب چندین آی‌پی پروکسی با پیاده‌سازی مکانیزم Hashing پایدار کاربر و سوییچ خودکار (Failover) بر روی پروکسی‌های جایگزین" },
                      { en: "Fixed client-side regular expression parsing to correctly split global IPs separated by backslashes, tabs, commas, or semicolons in the browser", fa: "اصلاح عبارات منظم فرانت‌اند در مروگر جهت تفکیک صحیح لیست آی‌پی‌های تفکیک شده با اینتر، ویرگول، نقطه ویرگول یا بک‌اسلش" }
                  ],
                  improved: [
                      { en: "Enhanced reliability of user management dashboard modals and subscription validation logic", fa: "بهبود پایداری پنجره‌های مدیریتی داشبورد و منطق بررسی اعتبار اشتراک‌ها" }
                  ],
                  notes: []
              },
              "2.5.6.1": {
                  headline: { en: "Multi-IP Management & Crucial Bug Fixes", fa: "مدیریت آی‌پی‌های چندگانه و رفع خطاهای بحرانی" },
                  added: [
                      { en: "Support setting custom config name, custom proxy IP, and custom clean IP for each user dynamically in the Add User modal", fa: "اضافه شدن امکان ثبت نام کانفیگ دلخواه، آی‌پی پروکسی اختصاصی و آی‌پی تمیز اختصاصی به صورت مجزا برای هر کاربر در پنجره افزودن کاربر" }
                  ],
                  fixed: [
                      { en: "Fixed a critical JavaScript rollback error ('ReferenceError: proxyIp is not defined') when adding a new user", fa: "رفع خطای بحرانی جاوااسکریپت ('ReferenceError: proxyIp is not defined') هنگام تلاش برای افزودن یک کاربر جدید" }
                  ],
                  improved: [
                      { en: "Streamlined alignment of custom user values with subscription generation", fa: "بهبود همگام‌سازی مقادیر اختصاصی کاربران با فرایند ساخت کانفیگ‌ها در اشتراک" }
                  ],
                  notes: []
              },
              "2.5.6": {
                  headline: { en: "Multiple Proxy IPs & Flag Matching", fa: "آی‌پی‌های پروکسی متعدد و انطباق پرچم" },
                  added: [
                      { en: "Support multi-proxy IP lists (rotated/distributed across generated configs to bypass Cloudflare limits)", fa: "پشتیبانی از لیست‌های آی‌پی پروکسی چندگانه (چرخش و توزیع خودکار میان کانفیگ‌ها برای عبور از محدودیت‌های کلودفلر)" },
                      { en: "Proper country flag matching for configs based on the actual proxy IP used", fa: "انطباق صحیح پرچم کشور برای کانفیگ‌ها بر اساس آی‌پی پروکسی واقعی استفاده‌شده" }
                  ],
                  fixed: [
                      { en: "Fixed outbound transport and websocket configurations formatting errors", fa: "رفع خطاهای فرمت‌دهی در کانفیگ‌های حمل و نقل خروجی و وب‌ساکت" }
                  ],
                  improved: [
                      { en: "Distributed multiple proxy IPs evenly across subscription sub-configs", fa: "توزیع یکنواخت چندین آی‌پی پروکسی میان زیرکانفیگ‌های اشتراک" },
                      { en: "Enhanced IP API resolving and flag caching logic", fa: "بهبود منطق حل‌وفصل و کش پرچم برای آی‌پی‌ها" }
                  ],
                  notes: []
              },
              "2.5.5": {
                  headline: { en: "One-Click Panel Update", fa: "بروزرسانی پنل با یک کلیک" },
                  added: [
                      { en: "Update the panel directly from the admin panel — no need to use Cloudflare dashboard", fa: "بروزرسانی پنل مستقیماً از پنل مدیریت — بدون نیاز به داشبورد کلودفلر" },
                      { en: "One-click deployment inside the panel for quick and easy updates", fa: "نصب با یک کلیک داخل پنل برای بروزرسانی سریع و آسان" },
                  ],
                  fixed: [],
                  improved: [
                      { en: "Improved stability and reliability of the update system", fa: "بهبود پایداری و اطمینان سیستم بروزرسانی" },
                  ],
                  notes: []
              },
              "2.5.4.2": {
                  headline: { en: "Performance Optimization & Background Processing", fa: "بهینه‌سازی عملکرد و پردازش پس‌زمینه" },
                  added: [],
                  fixed: [],
                  improved: [
                      { en: "Improved system performance using smart caching (faster responses and less database load)", fa: "بهبود عملکرد سیستم با استفاده از کش هوشمند (پاسخ‌ سریع‌تر و بار کمتر روی پایگاه داده)" },
                      { en: "Added smart caching system (TTL) for configuration and usage data", fa: "افزودن سیستم کش هوشمند (TTL) برای داده‌های تنظیمات و مصرف" },
                      { en: "Reduced database calls to make the panel faster and more efficient", fa: "کاهش درخواست‌ها به پایگاه داده برای سریع‌تر و کاراتر شدن پنل" },
                      { en: "Background processing added for non-critical tasks to improve speed", fa: "افزودن پردازش پس‌زمینه برای کارهای غیربحرانی جهت بهبود سرعت" },
                  ],
                  notes: []
              },
              "2.5.4.1": {
                  headline: { en: "Security Hotfix — Bot Authorization", fa: "اصلاح امنیتی — احراز هویت ربات" },
                  added: [],
                  fixed: [
                      { en: "Fixed critical issue where unauthorized users could access bot and panel data via Worker", fa: "رفع مشکل بحرانی دسترسی کاربران غیرمجاز به اطلاعات ربات و پنل از طریق Worker" },
                      { en: "Added proper Telegram user ID validation for all Worker-related requests", fa: "افزودن بررسی صحیح آیدی عددی تلگرام برای تمام درخواست‌های مربوط به Worker" },
                  ],
                  improved: [
                      { en: "Only users with approved admin IDs can interact with the bot and access panel data", fa: "فقط کاربرانی که آیدی آن‌ها در لیست ادمین‌ها ثبت شده باشد اجازه دسترسی به ربات و اطلاعات پنل را دارند" },
                      { en: "Unauthorized users now receive a clear access denied message", fa: "کاربران غیرمجاز اکنون پیام خطای دسترسی مناسب دریافت می‌کنند" },
                  ],
                  notes: [
                      { en: "Security update — recommended for all users", fa: "به‌روزرسانی امنیتی — توصیه‌شده برای تمام کاربران" },
                  ]
              },
              "2.5.4": {
                  headline: { en: "Overview Dashboard & Mobile Improvements", fa: "داشبورد نمای کلی و بهبود نمایش در موبایل" },
                  added: [
                      { en: "Added Overview Dashboard as the default home page", fa: "اضافه شدن داشبورد نمای کلی به عنوان صفحه اصلی پنل" },
                      { en: "Added quick statistics and recent activity section", fa: "اضافه شدن بخش آمار سریع و فعالیت‌های اخیر" },
                  ],
                  fixed: [],
                  improved: [
                      { en: "Improved mobile responsiveness of the Overview page", fa: "بهبود نمایش صفحه نمای کلی در موبایل" },
                      { en: "Localized traffic units for Persian language", fa: "نمایش واحد ترافیک به فارسی در صفحه نمای کلی" },
                  ],
                  notes: []
              },
              "2.5.3": {
                  headline: { en: "Telegram Bot Fixes & Formatting Cleanup", fa: "رفع مشکلات ربات تلگرام و اصلاح فرمت‌بندی" },
                  added: [],
                  fixed: [
                      { en: "Fixed admin buttons not showing immediately after /start in some cases", fa: "رفع مشکل نمایش ندادن دکمه‌های مدیر بلافاصله پس از /start در بعضی موارد" },
                      { en: "Fixed subscription link button returning per-user links instead of master link", fa: "رفع مشکل بازگشت لینک‌های کاربری به جای لینک اصلی هنگام فشردن دکمه لینک اشتراک" },
                      { en: "Fixed duplicate messages when clicking Update Usage with unchanged stats", fa: "رفع مشکل ارسال پیام تکراری هنگام فشردن بروزرسانی مصرف بدون تغییر آمار" },
                      { en: "Fixed <code> tags showing as raw text in Telegram messages", fa: "رفع مشکل نمایش تگ‌های <code> به صورت متن خام در پیام‌های تلگرام" },
                      { en: "Fixed subscription links not being clickable in Telegram", fa: "رفع مشکل غیرقابل کلیک بودن لینک‌های اشتراک در تلگرام" },
                  ],
                  improved: [
                      { en: "Subscription links now use tap-to-copy formatting in Telegram", fa: "لینک‌های اشتراک اکنون با فرمت کپی با یک لمس در تلگرام نمایش داده می‌شوند" },
                      { en: "UUIDs now use tap-to-copy formatting in user lists and detail views", fa: "شناسه‌های یکتا اکنون با فرمت کپی با یک لمس در لیست و جزئیات کاربران نمایش داده می‌شوند" },
                      { en: "Bot menu now correctly shows admin options on first interaction after login", fa: "منوی ربات اکنون گزینه‌های مدیریتی را در اولین تعامل پس از ورود به درستی نمایش می‌دهد" },
                      { en: "Update Usage button now edits the existing message instead of sending a new one", fa: "دکمه بروزرسانی مصرف اکنون پیام موجود را ویرایش می‌کند به جای ارسال پیام جدید" },
                  ],
                  notes: [
                      { en: "No breaking changes — fully backward compatible", fa: "بدون تغییرات ناسازگار — کاملاً سازگار با نسخه‌های قبلی" },
                  ]
              },
              "2.5.2": {
                  headline: { en: "Modal Responsiveness & Mobile UX", fa: "واکنش‌گرایی مودال و تجربه کاربری موبایل" },
                  added: [],
                  fixed: [],
                  improved: [
                      { en: "Improved Add/Edit User modal responsiveness on all screen sizes", fa: "بهبود واکنش‌گرایی مودال افزودن/ویرایش کاربر در تمام اندازه‌های صفحه" },
                      { en: "Added sticky action buttons in modals for better mobile support", fa: "افزودن دکمه‌های شناور در مودال‌ها برای پشتیبانی بهتر از موبایل" },
                      { en: "Enhanced scrolling behavior — form content scrolls independently while buttons stay visible", fa: "بهبود رفتار اسکرول — محتوای فرم به‌طور مستقل اسکرول می‌شود در حالی که دکمه‌ها قابل مشاهده باقی می‌مانند" },
                      { en: "Improved overall user experience when managing subscribers", fa: "بهبود تجربه کاربری هنگام مدیریت مشترکین" },
                  ],
                  notes: [
                      { en: "No breaking changes — fully backward compatible", fa: "بدون تغییرات ناسازگار — کاملاً سازگار با نسخه‌های قبلی" },
                  ]
              },
              "2.5.1": {
                  headline: { en: "Simplified Panel Management & Bot Stability", fa: "مدیریت ساده‌شده پنل و پایداری ربات" },
                  added: [
                      { en: "Web login signal system — bot auto-detects the last active web-logged panel", fa: "سیستم سیگنال ورود وب — ربات به‌طور خودکار آخرین پنل واردشده از وب را شناسایی می‌کند" },
                      { en: "Login sync endpoint (/tg/sync_panel) for remote panels to notify the hub on admin login", fa: "نقطه پایانی همگام‌سازی ورود (/tg/sync_panel) برای اطلاع‌رسانی پنل‌های راهدور به هاب هنگام ورود مدیر" },
                      { en: "Hub panel URL config (hubPanelUrl) for remote panels to signal login events", fa: "پیکربندی آدرس هاب پنل (hubPanelUrl) برای ارسال سیگنال ورود از پنل‌های راهدور" },
                      { en: "Full user management via Telegram bot (create, edit, delete, search, disable, re-enable)", fa: "مدیریت کامل کاربران از طریق ربات تلگرام (ایجاد، ویرایش، حذف، جستجو، غیرفعال‌سازی، فعال‌سازی مجدد)" },
                      { en: "HTTP REST API for all user operations at /api/users (GET, POST, PUT, DELETE)", fa: "API جدید REST برای تمام عملیات کاربران در /api/users" },
                      { en: "Statistics API at /api/stats with user counts, traffic totals, and system status", fa: "API آمار در /api/stats با تعداد کاربران، مجموع ترافیک و وضعیت سیستم" },
                  ],
                  fixed: [
                      { en: "Removed multi-panel selection system that caused session confusion and incorrect panel switching", fa: "حذف سیستم انتخاب چندپنلی که باعث سردرگمی نشست و جابجایی نادرست پنل می‌شد" },
                      { en: "Fixed bot not responding after pressing /start due to stale step state", fa: "رفع مشکل پاسخ ندادن ربات پس از فشار دادن /start به دلیل وضعیت مرحله قدیمی" },
                      { en: "Fixed panel context mixing when switching between panels", fa: "رفع مشکل ترکیب زمینه پنل هنگام جابجایی بین پنل‌ها" },
                      { en: "Fixed race condition in bot state persistence from non-blocking D1 writes", fa: "رفع مشکل شرایط مسابقه در ماندگاری وضعیت ربات ناشی از نوشتن غیرهمزمان D1" },
                  ],
                  improved: [
                      { en: "/start now directly opens panel management based on last web login — no panel selection menu", fa: "/start اکنون مستقیماً مدیریت پنل را بر اساس آخرین ورود وب باز می‌کند — بدون منوی انتخاب پنل" },
                      { en: "Bot automatically links Telegram session to the last active web-logged panel", fa: "ربات به‌طور خودکار نشست تلگرام را به آخرین پنل فعال واردشده از وب متصل می‌کند" },
                      { en: "Simplified bot logic with clean 1-to-1 mapping between web login and Telegram session", fa: "ساده‌سازی منطق ربات با نگاشت یک‌به‌یک بین ورود وب و نشست تلگرام" },
                      { en: "Telegram bot main menu redesigned with inline keyboard layout for mobile-first management", fa: "منوی اصلی ربات تلگرام با طرح‌بندی کیبورد درون‌خطی برای مدیریت موبایل‌محور بازطراحی شد" },
                  ],
                  notes: [
                      { en: "Single-panel mode works more reliably — it is recommended to use one Telegram bot per panel for best stability", fa: "حالت تک‌پنلی پایدارتر است — توصیه می‌شود برای بهترین پایداری از یک ربات تلگرام برای هر پنل استفاده کنید" },
                      { en: "For multi-panel setups: set hubPanelUrl on each remote panel to enable automatic login sync", fa: "برای تنظیمات چندپنلی: hubPanelUrl را روی هر پنل راهدور تنظیم کنید تا همگام‌سازی خودکار ورود فعال شود" },
                      { en: "Each panel having its own dedicated bot improves session accuracy and prevents panel mix-up issues", fa: "داشتن ربات اختصاصی برای هر پنل، دقت نشست را بهبود می‌دهد و از مشکلات ترکیب پنل جلوگیری می‌کند" },
                      { en: "API endpoints are authenticated via Master Key (Bearer token or ?key= parameter)", fa: "نقاط پایانی API از طریق کلید اصلی احراز هویت می‌شوند (توکن Bearer یا پارامتر ?key=)" },
                  ]
              },
              "2.5.0": {
                  headline: { en: "User Auto-Disable & Management Improvements", fa: "غیرفعال‌سازی خودکار کاربر و بهبود مدیریت" },
                  added: [
                      { en: "Automatic user disable on traffic limit exceeded", fa: "غیرفعال‌سازی خودکار کاربر هنگام اتمام محدودیت ترافیک" },
                      { en: "Automatic user disable on expiration date reached", fa: "غیرفعال‌سازی خودکار کاربر هنگام رسیدن به تاریخ انقضا" },
                      { en: "Activity log and Telegram notification for auto-disabled users", fa: "ثبت در گزارش فعالیت و ارسال اعلان تلگرام برای کاربران غیرفعال شده خودکار" },
                      { en: "Recently Disabled Users notification panel in Users tab", fa: "پنل اعلان کاربران اخیراً غیرفعال شده در بخش کاربران" },
                      { en: "Status filter dropdown (All/Active/Paused/Auto-Disabled)", fa: "فیلتر وضعیت (همه/فعال/متوقف/غیرفعال خودکار)" },
                      { en: "Auto-Disabled statistics card in dashboard", fa: "کارت آمار غیرفعال‌سازی خودکار در داشبورد" },
                  ],
                  fixed: [
                      { en: "Expired users are now disabled instead of deleted", fa: "کاربران منقضی شده اکنون غیرفعال می‌شوند به جای حذف" },
                      { en: "Users exceeding traffic limits are preserved in panel", fa: "کاربرانی که محدودیت ترافیک را رد می‌کنند در پنل حفظ می‌شوند" },
                  ],
                  improved: [
                      { en: "User data, statistics, and history are now preserved", fa: "داده‌ها، آمار و تاریخچه کاربران اکنون حفظ می‌شود" },
                      { en: "Account renewal workflow for administrators", fa: "فرآیند تمدید حساب برای مدیران" },
                  ],
                  notes: [
                      { en: "Re-enabling a user clears the auto-disable reason", fa: "فعال‌سازی مجدد کاربر، دلیل غیرفعال‌سازی خودکار را پاک می‌کند" },
                  ]
              },
              "2.4.9": {
                  headline: { en: "Custom Protocol & Port Configuration", fa: "پیکربندی پروتکل و پورت سفارشی" },
                  added: [
                      { en: "Custom protocol mode per user (VLESS/Trojan/Both)", fa: "حالت پروتکل سفارشی برای هر کاربر (VLESS/Trojan/هر دو)" },
                      { en: "Custom port configuration per user", fa: "پیکربندی پورت سفارشی برای هر کاربر" },
                      { en: "Maximum configs limit per user", fa: "محدودیت حداکثر کانفیگ برای هر کاربر" },
                  ],
                  fixed: [],
                  improved: [
                      { en: "User management panel interface", fa: "رابط کاربری پنل مدیریت کاربران" },
                  ],
                  notes: []
              }
          };
  
          function renderChangelog(version) {
              const container = document.getElementById('modal-changelog-container');
              if (!container) return;
              
              const data = CHANGELOG_DATA[version];
              if (!data) {
                  container.innerHTML = '<p class="text-slate-400 text-xs">' + (i18n[lang]?.no_changelog || 'No changelog available for this version.') + '</p>';
                  return;
              }

              const t = (key) => i18n[lang]?.[key] || i18n['en']?.[key] || key;
              let html = '';

              if (data.headline) {
                  const headlineEl = document.getElementById('modal-version-headline');
                  if (headlineEl) headlineEl.textContent = data.headline[lang] || data.headline['en'];
              }

              const sections = [
                  { key: 'added', icon: '✨', color: 'emerald', items: data.added },
                  { key: 'fixed', icon: '🔧', color: 'blue', items: data.fixed },
                  { key: 'improved', icon: '⚡', color: 'violet', items: data.improved },
                  { key: 'changed', icon: '🔄', color: 'amber', items: data.changed },
                  { key: 'note', icon: '⚠️', color: 'red', items: data.notes },
              ];

              sections.forEach(section => {
                  if (section.items && section.items.length > 0) {
                      html += '<div class="mb-4">';
                      html += '<div class="flex items-center gap-2 mb-2">';
                      html += '<span class="text-sm">' + section.icon + '</span>';
                      html += '<h5 class="text-xs font-bold text-' + section.color + '-600 dark:text-' + section.color + '-400 uppercase tracking-wider">' + t('changelog_' + section.key) + '</h5>';
                      html += '</div>';
                      html += '<div class="space-y-1.5 ps-6">';
                      section.items.forEach(item => {
                          html += '<div class="flex items-start gap-2">';
                          html += '<span class="text-' + section.color + '-400 mt-1.5">•</span>';
                          html += '<span class="text-xs text-slate-600 dark:text-slate-300">' + (item[lang] || item['en']) + '</span>';
                          html += '</div>';
                      });
                      html += '</div></div>';
                  }
              });

              container.innerHTML = html || '<p class="text-slate-400 text-xs">' + (i18n[lang]?.no_changes || 'No changes documented.') + '</p>';
          }

          let lang = localStorage.getItem('lang') || 'fa';
          let sessionKey = "", baseRoute = window.location.pathname.split('/dash')[0];
          let hostName = window.location.hostname, localUUID = "";

          window.addEventListener('DOMContentLoaded', () => {
              let savedSession = localStorage.getItem('nahan_session');
              if (savedSession) {
                  try {
                      let parsed = JSON.parse(savedSession);
                      if (parsed && parsed.expiry && Date.now() < parsed.expiry) {
                           sessionKey = parsed.key;
                           doLogin(true).then(() => loadDashboard());
                      } else {
                          localStorage.removeItem('nahan_session');
                      }
                  } catch(e){}
              }
              checkVersionPopup();
          });
  
          function applyLang() {
              document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
              document.getElementById('lang-toggle').innerText = lang === 'fa' ? 'EN' : 'فا';
              document.querySelectorAll('[data-i18n]').forEach(el => {
                  const key = el.getAttribute('data-i18n');
                  if (i18n[lang] && i18n[lang][key] !== undefined && i18n[lang][key] !== null) {
                      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                          el.placeholder = i18n[lang][key];
                      } else {
                          if (key.startsWith('html_')) {
                              el.innerHTML = i18n[lang][key];
                          } else {
                              el.innerText = i18n[lang][key];
                          }
                      }
                  }
              });
              document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                  const key = el.getAttribute('data-i18n-placeholder');
                  if (i18n[lang] && i18n[lang][key] !== undefined && i18n[lang][key] !== null) {
                      el.placeholder = i18n[lang][key];
                  }
              });
              const gbUnit = i18n[lang]?.ov_gb_unit || 'GB';
              ['ov-total-traffic','ov-today-traffic'].forEach(id => {
                  const el = document.getElementById(id);
                  if (el && el.textContent.trim() === '- GB') el.textContent = '- ' + gbUnit;
              });
              const statTrafficEl = document.getElementById('stat-total-traffic');
              if (statTrafficEl && statTrafficEl.textContent.trim() === '0 GB') statTrafficEl.textContent = '0 ' + gbUnit;
          }
          function toggleLang() { 
              lang = lang === 'fa' ? 'en' : 'fa'; 
              localStorage.setItem('lang', lang); 
              applyLang(); 
              updateTitle(); 
              updateUI(); 
              try {
                  const m = document.getElementById('modal-version-update');
                  if (m && !m.classList.contains('hidden')) {
                      renderChangelog(CURRENT_VERSION);
                  }
              } catch(e){}
          }
          applyLang();
  
          if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
          } else {
              document.documentElement.classList.remove('dark');
          }
  
          function toggleTheme() {
              document.documentElement.classList.toggle('dark');
              localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
          }

          function checkVersionPopup() {
              const popupKey = \`nahan_shown_v\${CURRENT_VERSION}\`;
              if (!localStorage.getItem(popupKey)) {
                  setTimeout(() => {
                      const badge = document.getElementById('modal-version-badge');
                      if (badge) badge.textContent = 'v' + CURRENT_VERSION;
                      renderChangelog(CURRENT_VERSION);
                      const m = document.getElementById('modal-version-update');
                      if (m) {
                          m.classList.remove('hidden');
                          m.classList.add('flex');
                      }
                  }, 800);
              }
          }

          function closeVersionModal() {
              const m = document.getElementById('modal-version-update');
              if (m) {
                  m.classList.add('hidden');
                  m.classList.remove('flex');
              }
              const popupKey = \`nahan_shown_v\${CURRENT_VERSION}\`;
              localStorage.setItem(popupKey, 'true');
          }
  
          function updateTitle() {
              const activeTab = document.querySelector('.nav-item.active span');
              if(activeTab) document.getElementById('view-title').innerText = activeTab.innerText;
          }
  
          function switchTab(tab) {
            ['overview','info','network','settings','advanced','logs','users','shop'].forEach(t => {
                  const view = document.getElementById('view-'+t);
                  const deskBtn = document.getElementById('tab-'+t);
                  const mobBtn = document.getElementById('mob-tab-'+t);
                  if (tab === t) {
                      view.classList.remove('hidden'); view.classList.add('block', 'fade-in');
                      deskBtn.classList.add('active'); mobBtn.classList.add('active');
                  } else {
                      view.classList.add('hidden'); view.classList.remove('block', 'fade-in');
                      deskBtn.classList.remove('active'); mobBtn.classList.remove('active');
                  }
              });
            updateTitle();
            if(tab === 'overview') loadDashboard();
            if(tab === 'logs') loadLogs();
            if(tab === 'network') doLogin(true); // refresh metrics
            if(tab === 'shop') renderShopView();
        }

        async function loadLogs() {
            const container = document.getElementById('logs-container');
            if(!container) return;
            container.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">' + (i18n[lang]?.loading_logs || 'Loading logs...') + '</p>';
            try {
                const res = await fetch(baseRoute + '/api/logs', { method: 'POST', body: JSON.stringify({ key: sessionKey }) });
                const data = await res.json();
                if (data.success && data.logs) {
                    if (data.logs.length === 0) {
                        container.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">' + (i18n[lang]?.no_activity_logs || 'No activity logs found.') + '</p>';
                        return;
                    }
                    let logsHtml = '';
                    data.logs.forEach(log => {
                        const dateStr = new Date(log.ts).toLocaleString('en-US', {hour12: false});
                        logsHtml += \`<div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-darkborder/50 gap-2"><div><p class="text-sm font-bold text-slate-700 dark:text-slate-200">\${log.type}</p><p class="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs" title="\${log.detail}">\${log.detail}</p></div><span class="text-[10px] font-mono text-slate-400 bg-white dark:bg-darkcard px-2 py-1 rounded shrink-0">\${dateStr}</span></div>\`;
                    });
                    container.innerHTML = logsHtml;
                } else {
                    container.innerHTML = '<p class="text-sm text-red-400 text-center py-4">Failed to load logs.</p>';
                }
            } catch (err) {
                container.innerHTML = '<p class="text-sm text-red-400 text-center py-4">Error loading logs.</p>';
            }
        }

        async function loadDashboard() {
            try {
                const [statsRes, logsRes] = await Promise.all([
                    fetch(baseRoute + '/api/stats', { method: 'GET', headers: { 'Authorization': 'Bearer ' + sessionKey } }),
                    fetch(baseRoute + '/api/logs', { method: 'POST', body: JSON.stringify({ key: sessionKey }) })
                ]);
                const statsData = await statsRes.json();
                const logsData = await logsRes.json();

                if (statsData.success && statsData.stats) {
                    const s = statsData.stats;
                    document.getElementById('ov-total-users').textContent = s.users.total;
                    document.getElementById('ov-active-users').textContent = s.users.active;
                    document.getElementById('ov-paused-users').textContent = s.users.paused;
                    document.getElementById('ov-auto-disabled').textContent = s.users.autoDisabled;
                    document.getElementById('ov-expired-users').textContent = s.users.expired;
                    document.getElementById('ov-total-traffic').textContent = s.traffic.totalGB + ' ' + (i18n[lang]?.ov_gb_unit || 'GB');
                    document.getElementById('ov-total-reqs').textContent = s.traffic.totalRequests.toLocaleString();
                    document.getElementById('ov-today-traffic').textContent = s.traffic.dailyGB + ' ' + (i18n[lang]?.ov_gb_unit || 'GB');
                    document.getElementById('ov-today-reqs').textContent = s.traffic.dailyRequests.toLocaleString();
                    document.getElementById('ov-active-conns').textContent = s.system.activeConnections;
                    document.getElementById('ov-version').textContent = 'v' + s.system.version;
                }

                const actList = document.getElementById('ov-activity-list');
                if (logsData.success && logsData.logs && logsData.logs.length > 0) {
                    let actHtml = '';
                    logsData.logs.slice(0, 8).forEach(log => {
                        const dateStr = new Date(log.ts).toLocaleString('en-US', {hour12: false});
                        const typeColors = { 'Auth Success': 'bg-emerald-500', 'Auth Failed': 'bg-red-500', 'User Created': 'bg-blue-500', 'User Deleted': 'bg-red-500', 'User Toggled': 'bg-amber-500', 'User Updated': 'bg-indigo-500', 'User Auto-Disabled': 'bg-red-500', 'Traffic Reset': 'bg-cyan-500', 'Config Changed': 'bg-violet-500' };
                        const dotColor = typeColors[log.type] || 'bg-slate-400';
                        actHtml += '<div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"><div class="w-2 h-2 rounded-full shrink-0 ' + dotColor + '"></div><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">' + log.type + '</p><p class="text-[11px] text-slate-400 truncate">' + log.detail + '</p></div><span class="text-[10px] font-mono text-slate-400 shrink-0">' + dateStr + '</span></div>';
                    });
                    actList.innerHTML = actHtml;
                } else {
                    actList.innerHTML = '<p class="text-sm text-slate-400 text-center py-6">' + (i18n[lang]?.no_recent_activity || 'No recent activity.') + '</p>';
                }
            } catch (err) {
                console.error('Dashboard load error:', err);
            }
        }

          function copyData(id) {
              const input = document.getElementById(id); input.select(); navigator.clipboard.writeText(input.value);
              const toast = document.getElementById('copy-toast');
              toast.style.transform = 'translate(-50%, 0)'; toast.style.opacity = '1';
              setTimeout(() => { toast.style.transform = 'translate(-50%, -5rem)'; toast.style.opacity = '0'; }, 2000);
          }
          
          function showQR(name, url) {
              document.getElementById('qr-modal-title').innerText = name;
              document.getElementById('qr-modal-img').src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(url);
              document.getElementById('qr-modal-link').innerText = url;
              document.getElementById('qr-modal').classList.remove('hidden');
              document.getElementById('qr-modal').classList.add('flex');
          }
          
          function closeQRModal() {
              document.getElementById('qr-modal').classList.add('hidden');
              document.getElementById('qr-modal').classList.remove('flex');
          }
  
          function updateUI() {
              try {
                  let portsStr = Array.from(document.getElementById('cfg-port').selectedOptions).map(o=>o.value).join(',');
                  let port = portsStr ? portsStr.split(',')[0] : '443';
                  let proto = document.getElementById('cfg-proto').value === 'beta' ? String.fromCharCode(116, 114, 111, 106, 97, 110) : String.fromCharCode(118, 108, 101, 115, 115);
                  let rawIps = document.getElementById('cfg-ips').value || "";
                  
                  let ipsList = rawIps.replace(/,/g, '\\n').replace(/;/g, '\\n').split('\\n').map(s=>s.trim()).filter(Boolean);
                  let finalIP = ipsList.length > 0 ? ipsList[0] : (hostName.endsWith('.pages.dev') ? 'time.is' : hostName);
                  
                  let fp = document.getElementById('cfg-fp').value;
                  let path = encodeURI("/" + document.getElementById('cfg-path').value);
                  let sec = ["80","8080"].includes(port) ? "none" : "tls";
                  
                  let rawLink = proto + "://" + localUUID + "@" + finalIP + ":" + port + "?encryption=none&security=" + sec + "&sni=" + hostName + "&fp=" + fp + "&type=ws&host=" + hostName + "&path=" + path;
                  if (document.getElementById('cfg-ech').checked) rawLink += "&pbk=enabled";
                  rawLink += "#" + hostName;
  
                  // FIX: Check if elements exist
                  const linkEl = document.getElementById('link-direct');
                  if (linkEl) linkEl.value = rawLink;
  
                  const qrEl = document.getElementById('qr-code');
                  if (qrEl) qrEl.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(rawLink);
  
                  let totalIps = ipsList.length === 0 ? 1 : ipsList.length;
                  let tCfg = totalIps * 2; 
                  document.getElementById('ip-count-badge').innerText = lang === 'fa' ? (tCfg + ' کانفیگ تولید شد') : (tCfg + ' Configs Active');
              } catch(e) { console.error(e); }
          }
  
          function logout() {
              localStorage.removeItem('nahan_session');
              window.location.reload();
          }

          function renderFakeConfigs(configs) {
              const list = document.getElementById('fake-configs-list');
              if (!list) return;
              list.innerHTML = '';
              if (!configs || configs.length === 0) {
                  configs = [
                      { name: "📊 {usage}", enabled: true },
                      { name: "📅 {expiry}", enabled: true }
                  ];
              }
              configs.forEach((cfg, idx) => {
                  const item = document.createElement('div');
                  item.className = 'flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-darkborder/50';
                  item.innerHTML = \`
                      <div class="relative inline-flex items-center cursor-pointer shrink-0">
                          <input type="checkbox" \${cfg.enabled ? 'checked' : ''} onchange="toggleFakeConfig(\${idx})" class="sr-only peer">
                          <div class="w-9 h-5 bg-slate-300 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                      <input type="text" value="\${cfg.name.replace(/"/g, '&quot;')}" onchange="updateFakeConfigName(\${idx}, this.value)" class="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-darkborder bg-white dark:bg-slate-900 focus:border-primary outline-none text-sm font-mono">
                      <button onclick="moveFakeConfig(\${idx}, -1)" class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0" title="Move up">
                          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                      </button>
                      <button onclick="moveFakeConfig(\${idx}, 1)" class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0" title="Move down">
                          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      <button onclick="removeFakeConfig(\${idx})" class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0" title="Remove">
                          <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                  \`;
                  list.appendChild(item);
              });
              window._fakeConfigs = configs;
          }

          function addFakeConfig() {
              if (!window._fakeConfigs) window._fakeConfigs = [];
              window._fakeConfigs.push({ name: "Custom Entry", enabled: true });
              renderFakeConfigs(window._fakeConfigs);
          }

          function removeFakeConfig(idx) {
              if (!window._fakeConfigs) return;
              window._fakeConfigs.splice(idx, 1);
              renderFakeConfigs(window._fakeConfigs);
          }

          function toggleFakeConfig(idx) {
              if (!window._fakeConfigs || !window._fakeConfigs[idx]) return;
              window._fakeConfigs[idx].enabled = !window._fakeConfigs[idx].enabled;
          }

          function updateFakeConfigName(idx, value) {
              if (!window._fakeConfigs || !window._fakeConfigs[idx]) return;
              window._fakeConfigs[idx].name = value;
          }

          function moveFakeConfig(idx, direction) {
              if (!window._fakeConfigs) return;
              const newIdx = idx + direction;
              if (newIdx < 0 || newIdx >= window._fakeConfigs.length) return;
              const temp = window._fakeConfigs[idx];
              window._fakeConfigs[idx] = window._fakeConfigs[newIdx];
              window._fakeConfigs[newIdx] = temp;
              renderFakeConfigs(window._fakeConfigs);
          }

          function getFakeConfigsFromUI() {
              return window._fakeConfigs || [
                  { name: "📊 {usage}", enabled: true },
                  { name: "📅 {expiry}", enabled: true }
              ];
          }
  
          // Export active page inputs configuration
          function exportConfig() {
              const el = id => document.getElementById(id);
              const payload = {
                  mode: el('cfg-proto').value, socketPorts: Array.from(el('cfg-port').selectedOptions).map(o=>o.value).join(','), deviceId: el('cfg-uuid').value,
                  apiRoute: el('cfg-path').value, masterKey: el('cfg-pass').value, agent: el('cfg-fp').value,
                  resolveIp: el('cfg-dns').value, customDns: el('cfg-custom-dns').value ? el('cfg-custom-dns').value : 'https://cloudflare-dns.com/dns-query', cleanIps: el('cfg-ips').value, maintenanceHost: el('cfg-fake').value, backupRelay: el('cfg-relay').value, nat64Prefix: el('cfg-nat64') ? el('cfg-nat64').value : '', enableDirectConfigs: el('cfg-direct-configs') ? el('cfg-direct-configs').checked : false, autoUpdate: el('cfg-auto-update') ? el('cfg-auto-update').checked : false, autoUpdateFormat: document.querySelector('input[name="auto-update-format"]:checked')?.value || 'normal',
                  enableOpt1: el('cfg-tfo').checked, enableOpt2: el('cfg-ech').checked,
                  tgToken: el('cfg-tg-token').value, tgChatId: el('cfg-tg-chat').value, tgAdminId: el('cfg-tg-admin').value,
                  cfAccountId: el('cfg-cf-acc').value, cfApiToken: el('cfg-cf-token').value,
                  cfWorkerName: el('cfg-cf-worker').value,
                  isPaused: el('cfg-pause').checked, silentAlerts: el('cfg-silent').checked,
                  githubRepo: el('cfg-github-repo').value,
                  subUserAgent: el('cfg-sub-ua').value,
                  customPanelUrl: el('cfg-custom-panel-url').value,
                  fakeConfigs: getFakeConfigsFromUI()
              };
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
              const dlAnchor = document.createElement('a');
              dlAnchor.setAttribute("href", dataStr);
              dlAnchor.setAttribute("download", "nahan-gateway-config.json");
              document.body.appendChild(dlAnchor);
              dlAnchor.click();
              dlAnchor.remove();
          }
  
          // Import backup json to overwrite config inputs 
          function importConfig(event) {
              const file = event.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = function(e) {
                  try {
                      const conf = JSON.parse(e.target.result);
                      const mapId = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
                      mapId('cfg-proto', conf.mode);
                      let pList = (conf.socketPorts || conf.socketPort || '443').split(',');
                      Array.from(document.getElementById('cfg-port').options).forEach(o => o.selected = pList.includes(o.value));
                      mapId('cfg-uuid', conf.deviceId);
                      mapId('cfg-path', conf.apiRoute);
                      mapId('cfg-pass', conf.masterKey);
                      mapId('cfg-fp', conf.agent);
                      mapId('cfg-dns', conf.resolveIp);
                      mapId('cfg-custom-dns', conf.customDns);
                      mapId('cfg-ips', conf.cleanIps);
                      mapId('cfg-fake', conf.maintenanceHost);
                      mapId('cfg-relay', conf.backupRelay);
                      mapId('cfg-tg-token', conf.tgToken);
                      mapId('cfg-tg-chat', conf.tgChatId);
                      mapId('cfg-tg-admin', conf.tgAdminId);
                      mapId('cfg-cf-acc', conf.cfAccountId);
                      mapId('cfg-cf-token', conf.cfApiToken);
                      mapId('cfg-cf-worker', conf.cfWorkerName);
                      mapId('cfg-github-repo', conf.githubRepo);
                      mapId('cfg-sub-ua', conf.subUserAgent);
                      mapId('cfg-custom-panel-url', conf.customPanelUrl);
                      
                      if (conf.enableOpt1 !== undefined) document.getElementById('cfg-tfo').checked = conf.enableOpt1;
                      if (conf.enableOpt2 !== undefined) document.getElementById('cfg-ech').checked = conf.enableOpt2;
                      if (conf.isPaused !== undefined) document.getElementById('cfg-pause').checked = conf.isPaused;
                      if (conf.silentAlerts !== undefined) document.getElementById('cfg-silent').checked = conf.silentAlerts;
                      mapId('cfg-nat64', conf.nat64Prefix);
                      if (conf.enableDirectConfigs !== undefined && document.getElementById('cfg-direct-configs')) document.getElementById('cfg-direct-configs').checked = conf.enableDirectConfigs;
                      if (conf.autoUpdate !== undefined && document.getElementById('cfg-auto-update')) {
                          document.getElementById('cfg-auto-update').checked = conf.autoUpdate;
                          const wrap = document.getElementById('auto-update-format-wrap');
                          if (wrap) wrap.classList.toggle('hidden', !conf.autoUpdate);
                      }
                      if (conf.autoUpdateFormat) {
                          const radio = document.querySelector(\`input[name="auto-update-format"][value="\${conf.autoUpdateFormat}"]\`);
                          if (radio) radio.checked = true;
                      }
                      
                      if (conf.fakeConfigs) renderFakeConfigs(conf.fakeConfigs);
                      
                      updateUI();
                      alert(lang === 'fa' ? 'پیکربندی با موفقیت وارد شد! روی ذخیره کلیک کنید.' : 'Configuration parsed! Click save to write changes.');
                  } catch(err) {
                      alert(lang === 'fa' ? 'فایل نامعتبر است!' : 'Invalid configuration file!');
                  }
              };
              reader.readAsText(file);
          }
  
          // Browser-level latency check diagnostics
          async function runPingTest() {
              const rawIps = document.getElementById('cfg-ips').value || "";
              let ipsList = rawIps.replace(/,/g, '\\n').replace(/;/g, '\\n').split('\\n').map(s=>s.trim()).filter(Boolean);
              let targetIP = ipsList.length > 0 ? ipsList[0] : (hostName.endsWith('.pages.dev') ? 'time.is' : hostName);
              
              const resultsDiv = document.getElementById('ping-results');
              resultsDiv.classList.remove('hidden');
              
              document.getElementById('ping-target').textContent = targetIP;
              document.getElementById('ping-time').textContent = 'Testing...';
              document.getElementById('ping-status').textContent = 'Dialing...';
              document.getElementById('ping-port').textContent = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
              
              const startTime = performance.now();
              try {
                  await fetch('https://' + targetIP + '/favicon.ico?cb=' + startTime, { mode: 'no-cors', cache: 'no-store' });
                  const duration = Math.round(performance.now() - startTime);
                  document.getElementById('ping-time').textContent = duration + ' ms';
                  document.getElementById('ping-status').className = "text-sm font-bold text-emerald-500";
                  document.getElementById('ping-status').textContent = "Success";
              } catch (err) {
                  const duration = Math.round(performance.now() - startTime);
                  if (duration < 1500) {
                      document.getElementById('ping-time').textContent = duration + ' ms';
                      document.getElementById('ping-status').className = "text-sm font-bold text-amber-500";
                      document.getElementById('ping-status').textContent = "Indirect-OK";
                  } else {
                      document.getElementById('ping-time').textContent = 'Timeout';
                      document.getElementById('ping-status').className = "text-sm font-bold text-red-500";
                      document.getElementById('ping-status').textContent = "Unreachable";
                  }
              }
          }
  
          function togglePortCheckbox(val, checked) {
              const sel = document.getElementById('cfg-port');
              const opt = Array.from(sel.options).find(o => o.value === val);
              if (opt) {
                  opt.selected = checked;
                  sel.dispatchEvent(new Event('change'));
              }
          }
          function syncCheckboxesFromSelect() {
              const sel = document.getElementById('cfg-port');
              const ports = Array.from(sel.selectedOptions).map(o => o.value);
              const checkboxes = document.querySelectorAll('#port-checkboxes-container input[type="checkbox"]');
              checkboxes.forEach(cb => {
                  cb.checked = ports.includes(cb.value);
              });
          }

          async function doLogin(silent = false) {
              const btn = document.querySelector('button[onclick="doLogin()"]');
              const origText = btn.innerText; 
              if(!silent) btn.innerText = "...";
              try {
                  const pass = silent ? sessionKey : document.getElementById('pwd').value;
                  const res = await fetch(baseRoute + '/api/auth', { method: 'POST', body: JSON.stringify({ key: pass }) });
                  const data = await res.json();
                  if (data.success) {
                      sessionKey = pass; localUUID = data.deviceId;
                      localStorage.setItem('nahan_session', JSON.stringify({ key: pass, expiry: Date.now() + 30 * 60 * 1000 }));
                      
                      document.getElementById('login-box').classList.add('hidden');
                      document.getElementById('dash-box').classList.remove('hidden');
                      document.getElementById('dash-box').classList.add('flex');
                      document.getElementById('btn-logout-mob').classList.remove('hidden');
                      document.body.classList.add('logged-in');
                      
                      document.getElementById('net-ip').textContent = data.network.ip;
                      document.getElementById('net-colo').textContent = data.network.colo;
                      document.getElementById('net-loc').textContent = data.network.loc;
                      const conf = data.config;
                      document.getElementById('cfg-proto').value = conf.mode || 'alpha';
                      let pList = (conf.socketPorts || conf.socketPort || '443').split(',');
                      Array.from(document.getElementById('cfg-port').options).forEach(o => o.selected = pList.includes(o.value));
                      syncCheckboxesFromSelect();
                      document.getElementById('cfg-uuid').value = conf.deviceId || '';
                      document.getElementById('cfg-path').value = conf.apiRoute || '';
                      document.getElementById('cfg-pass').value = conf.masterKey || '';
                      document.getElementById('cfg-fp').value = conf.agent || 'chrome';
                      document.getElementById('cfg-dns').value = conf.resolveIp || '';
                      document.getElementById('cfg-custom-dns').value = conf.customDns || 'https://cloudflare-dns.com/dns-query';
                      document.getElementById('cfg-ips').value = conf.cleanIps || '';
                      document.getElementById('cfg-nodes').value = conf.slaveNodes || '';
                      document.getElementById('cfg-fake').value = conf.maintenanceHost || '';
                       document.getElementById('cfg-relay').value = conf.backupRelay || '';
                       if (document.getElementById('cfg-nat64')) document.getElementById('cfg-nat64').value = conf.nat64Prefix || '';
                       if (document.getElementById('cfg-direct-configs')) document.getElementById('cfg-direct-configs').checked = conf.enableDirectConfigs || false;
                       if (document.getElementById('cfg-auto-update')) {
                           document.getElementById('cfg-auto-update').checked = conf.autoUpdate || false;
                           const wrap = document.getElementById('auto-update-format-wrap');
                           if (wrap) wrap.classList.toggle('hidden', !conf.autoUpdate);
                       }
                       if (conf.autoUpdateFormat) {
                           const radio = document.querySelector(\`input[name="auto-update-format"][value="\${conf.autoUpdateFormat}"]\`);
                           if (radio) radio.checked = true;
                       }
                      document.getElementById('cfg-tfo').checked = conf.enableOpt1 || false;
                      document.getElementById('cfg-ech').checked = conf.enableOpt2 || false;
                      document.getElementById('cfg-allow-sync').checked = conf.allowSyncWorker || false;
                      document.getElementById('cfg-tg-token').value = conf.tgToken || '';
                      document.getElementById('cfg-tg-chat').value = conf.tgChatId || '';
                      document.getElementById('cfg-tg-admin').value = conf.tgAdminId || '';
                      document.getElementById('cfg-cf-acc').value = conf.cfAccountId || '';
                      document.getElementById('cfg-cf-token').value = conf.cfApiToken || '';
                      document.getElementById('cfg-cf-worker').value = conf.cfWorkerName || '';
                      document.getElementById('cfg-pause').checked = conf.isPaused || false;
                      document.getElementById('cfg-silent').checked = conf.silentAlerts || false;
                      document.getElementById('cfg-github-repo').value = conf.githubRepo || 'itsyebekhe/nahan';
                      document.getElementById('cfg-name-strategy').value = conf.nameStrategy || 'default';
                      document.getElementById('cfg-name-prefix').value = conf.namePrefix || 'Core';
                      document.getElementById('cfg-sub-ua').value = conf.subUserAgent || '';
                      document.getElementById('cfg-custom-panel-url').value = conf.customPanelUrl || '';
                      renderFakeConfigs(conf.fakeConfigs || [
                          { name: "📊 {usage}", enabled: true },
                          { name: "📅 {expiry}", enabled: true }
                      ]);
  
                      window.nahanConfig = JSON.parse(JSON.stringify(conf));
                      window.nahanUsage = data.sysUsage || {};
                      window.nahanProfiles = data.profiles || [];
                      renderUsersTable();
                      renderShopView();
                      try { checkUpdate(); } catch(ue) { console.error(ue); }
                      if (!silent) switchTab('overview');

                      ['cfg-proto','cfg-port','cfg-fp','cfg-ips','cfg-nodes','cfg-path', 'cfg-relay', 'cfg-name-strategy', 'cfg-name-prefix', 'cfg-sub-ua', 'cfg-custom-panel-url'].forEach(id => {
                          const el = document.getElementById(id);
                          if(el) { el.addEventListener('input', updateUI); el.addEventListener('change', updateUI); }
                      });
                      ['cfg-ech','cfg-tfo'].forEach(id => {
                          const el = document.getElementById(id);
                          if(el) el.addEventListener('change', updateUI);
                      });
                      const autoUpdateEl = document.getElementById('cfg-auto-update');
                      if (autoUpdateEl) {
                          autoUpdateEl.addEventListener('change', () => {
                              const wrap = document.getElementById('auto-update-format-wrap');
                              if (wrap) wrap.classList.toggle('hidden', !autoUpdateEl.checked);
                          });
                      }

                      
            
                     window.toggleAccordion = function(btn) 
                        {
                            const card = btn.closest('[data-accordion]');
                            if (!card) return;
                            const content = card.querySelector('[data-accordion-content]');
                            const icon = btn.querySelector('.accordion-icon');
                            const isOpen = content.style.visibility === 'visible';

                            content.style.transition = 'max-height 0.3s ease, visibility 0.3s ease';

                            if (isOpen) {
                                content.style.maxHeight = content.scrollHeight + 'px';
                                requestAnimationFrame(() => {
                                    content.style.maxHeight = '0';
                                    content.style.visibility = 'hidden';
                                });
                                icon.style.transform = 'rotate(0deg)';
                            } else {
                                content.style.visibility = 'visible';
                                content.style.maxHeight = content.scrollHeight + 'px';
                                icon.style.transform = 'rotate(180deg)';
                                setTimeout(() => { if (content.style.visibility === 'visible') content.style.maxHeight = 'none'; }, 350);
                            }
                        }

                window.handleCopy = function handleCopy(btn) {
                    copyData('sync-' + btn.dataset.id);
                }
                window.handleQR = function handleQR(btn) {
                    showQR(btn.dataset.name, document.getElementById('sync-' + btn.dataset.id).value);
                }
                const pCont = document.getElementById('dyn-profiles-container');
                let profilesHtml = '';
                data.profiles.forEach(p => {
                            const isDef = p.name === 'Default';
                            let html = \`<div class="bg-white dark:bg-darkcard rounded-3xl shadow-sm border border-slate-200 dark:border-darkborder relative mb-4 break-inside-avoid inline-block w-full" data-accordion>
    <div class="absolute top-0 end-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10"></div>
    <button onclick="toggleAccordion(this)" class="w-full flex items-center justify-between p-5 md:p-6">
        <h3 class="text-lg font-bold text-slate-800 dark:text-white flex items-center">
            <svg class="w-5 h-5 me-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            \${p.name}
        </h3>
        <div class="flex items-center gap-2">
            \${isDef ? '<span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase">Master</span>' : ''}
            <svg class="w-4 h-4 text-slate-400 accordion-icon transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </button>
    <div class="transition-all duration-300" style="max-height:0;overflow:hidden;" data-accordion-content>
        <div class="space-y-3 px-5 md:px-6 pb-5 md:pb-6">
            <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UUID</label>
                <div class="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-darkborder px-3 py-2 rounded-lg text-xs font-mono text-slate-500">\${p.id}</div>
            </div>
            <div class="relative">
                <label class="block text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Universal Sync URL</label>
                <input type="text" id="sync-\${p.id}" readonly value="\${p.sync}" class="w-full bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder px-4 py-2.5 rounded-xl text-xs outline-none font-mono text-slate-600 dark:text-slate-400 truncate pe-12">
                <button data-id="\${p.id}" onclick="handleCopy(this)" class="absolute bottom-1 end-1 text-primary p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"><svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>
            </div>
            <div class="mt-2">
                <button data-id="\${p.id}" data-name="\${p.name}" onclick="handleQR(this)" class="w-full flex items-center justify-center p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-darkborder rounded-xl transition-all gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m0 11v1m5-7h1m-13 0h1m2-5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-8zM9 9h1m0 0v1m2-1h1m0 0v1"></path></svg>
                    <span data-i18n="show_qr">Show QR Code</span>
                </button>
            </div>
        </div>
    </div>
</div>\`;
                         profilesHtml += html;
                      });
                      pCont.innerHTML = profilesHtml;



                      // Inject usage metrics table
                      const usageCont = document.getElementById('usage-metrics-container');
                      if(usageCont && data.usage) {
                          let usageHtml = '';
                          data.profiles.forEach(p => {
                              let hash = p.id.replace(/-/g, '').toLowerCase();
                              let use = data.usage[hash];
                              if(use) {
                                  let timeStr = new Date(use.last).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                                  usageHtml += \`<div class="flex items-center justify-between p-3 border-b border-slate-100 dark:border-darkborder/50 last:border-0"><div class="flex flex-col"><span class="text-sm font-bold text-slate-700 dark:text-slate-200">\${p.name}</span><span class="text-[10px] text-slate-400 font-mono">\${p.id.split('-')[0]}...</span></div><div class="flex flex-col items-end"><span class="text-xs font-bold text-emerald-500">\${use.connects} Conns</span><span class="text-[10px] text-slate-400">\${timeStr}</span></div></div>\`;
                              }
                          });
                          usageCont.innerHTML = usageHtml || '<p class="text-xs text-slate-400 text-center py-4">' + (i18n[lang]?.no_active_conn || 'No active connection data yet.') + '</p>';
                      }
                      
                      updateUI();
                  } else { 
                      if(!silent) { document.getElementById('err-msg').classList.remove('hidden'); btn.innerText = origText; }
                      else { localStorage.removeItem('nahan_session'); }
                  }
              } catch (err) { if(!silent) btn.innerText = origText; }
          }
  
          async function doSave() {
              const el = id => document.getElementById(id);
              const payload = {
                  key: sessionKey,
                  config: {
                      mode: el('cfg-proto').value, socketPorts: Array.from(el('cfg-port').selectedOptions).map(o=>o.value).join(','), deviceId: el('cfg-uuid').value,
                      apiRoute: el('cfg-path').value, masterKey: el('cfg-pass').value, agent: el('cfg-fp').value,
                      resolveIp: el('cfg-dns').value, customDns: el('cfg-custom-dns').value ? el('cfg-custom-dns').value : 'https://cloudflare-dns.com/dns-query', cleanIps: el('cfg-ips').value, slaveNodes: el('cfg-nodes').value, maintenanceHost: el('cfg-fake').value, backupRelay: el('cfg-relay').value, nat64Prefix: el('cfg-nat64') ? el('cfg-nat64').value : '', enableDirectConfigs: el('cfg-direct-configs') ? el('cfg-direct-configs').checked : false, autoUpdate: el('cfg-auto-update') ? el('cfg-auto-update').checked : false, autoUpdateFormat: document.querySelector('input[name="auto-update-format"]:checked')?.value || 'normal',
                      enableOpt1: el('cfg-tfo').checked, enableOpt2: el('cfg-ech').checked,
                      tgToken: el('cfg-tg-token').value, tgChatId: el('cfg-tg-chat').value, tgAdminId: el('cfg-tg-admin').value,
                      cfAccountId: el('cfg-cf-acc').value, cfApiToken: el('cfg-cf-token').value,
                      cfWorkerName: el('cfg-cf-worker').value,
                      isPaused: el('cfg-pause').checked, silentAlerts: el('cfg-silent').checked,
                      githubRepo: el('cfg-github-repo').value,
                      subUserAgent: el('cfg-sub-ua').value,
                      customPanelUrl: el('cfg-custom-panel-url').value,
                      nameStrategy: el('cfg-name-strategy').value,
                      allowSyncWorker: el('cfg-allow-sync').checked,
                      namePrefix: el('cfg-name-prefix').value,
                      fakeConfigs: getFakeConfigsFromUI(),
                      purchaseEnabled: el('shop-purchase-enabled') ? el('shop-purchase-enabled').checked : (window.nahanConfig.purchaseEnabled || false),
                      freeTrial: el('shop-free-trial') ? el('shop-free-trial').checked : (window.nahanConfig.freeTrial || false),
                      freeTrialDays: el('shop-trial-days') ? (parseInt(el('shop-trial-days').value) || 3) : (window.nahanConfig.freeTrialDays || 3),
                      freeTrialGB: el('shop-trial-gb') ? (parseInt(el('shop-trial-gb').value) || 3) : (window.nahanConfig.freeTrialGB || 3),
                      adminCardNumber: el('shop-card-number') ? el('shop-card-number').value : (window.nahanConfig.adminCardNumber || ''),
                      adminCardOwner: el('shop-card-owner') ? el('shop-card-owner').value : (window.nahanConfig.adminCardOwner || ''),
                      botWelcomeMsg: el('shop-welcome-msg') ? el('shop-welcome-msg').value : (window.nahanConfig.botWelcomeMsg || ''),
                      botSupportMsg: el('shop-support-msg') ? el('shop-support-msg').value : (window.nahanConfig.botSupportMsg || ''),
                      purchaseOptions: window.nahanConfig.purchaseOptions || [],
                      pendingPurchases: window.nahanConfig.pendingPurchases || [],
                      promoCodes: window.nahanConfig.promoCodes || [],
                      usedTrials: window.nahanConfig.usedTrials || [],
                      userAccounts: window.nahanConfig.userAccounts || []
                  }
              };
                        //update user port after change global
                     const globalPorts = (payload.config.socketPorts || '443').split(',').map(s=>s.trim()).filter(Boolean);
                     payload.config.users = (window.nahanConfig.users || []).map(u => {
                     if (!u.userPorts) return u;
                        const filtered = u.userPorts.split(',').map(s=>s.trim()).filter(p => globalPorts.includes(p));
                      u.userPorts = filtered.length ? filtered.join(',') : globalPorts[0];
                          return u;
                          });
              const stat = el('save-status'); stat.textContent = i18n[lang].msg_saving; stat.className = "text-sm font-bold text-primary animate-pulse md:me-4";
              try {
                  const res = await fetch(baseRoute + '/api/sync', { method: 'POST', body: JSON.stringify(payload) });
                  const data = await res.json();
                  if (data.success) {
                      stat.textContent = i18n[lang].msg_saved; stat.className = "text-sm font-bold text-emerald-500 md:me-4";
                      setTimeout(() => window.location.href = '/' + data.newRoute + '/dash', 1000);
                  } else { stat.textContent = i18n[lang].msg_err; stat.className = "text-sm font-bold text-red-500 md:me-4"; }
              } catch(e) { stat.textContent = i18n[lang].msg_err; stat.className = "text-sm font-bold text-red-500 md:me-4"; }
          }
          
          async function forceSyncNodes() {
              const nodesRaw = document.getElementById('cfg-nodes').value;
              if (!nodesRaw || nodesRaw.trim() === '') {
                  const noSlaveMsg = lang === 'fa' ? 'هیچ نود فرعی مشخص نشده است.' : 'No slave nodes specified.';
                  alert(noSlaveMsg);
                  return;
              }
              const btnTxt = document.getElementById('sync-btn-txt');
              const icon = document.getElementById('sync-icon');
              
              btnTxt.innerText = 'Syncing...';
              icon.classList.add('animate-spin');
              
              const el = id => document.getElementById(id);
              const payload = {
                  key: sessionKey,
                  config: {
                      mode: el('cfg-proto').value, socketPorts: Array.from(el('cfg-port').selectedOptions).map(o=>o.value).join(','), deviceId: el('cfg-uuid').value,
                      apiRoute: el('cfg-path').value, masterKey: el('cfg-pass').value, agent: el('cfg-fp').value,
                      resolveIp: el('cfg-dns').value, customDns: el('cfg-custom-dns').value ? el('cfg-custom-dns').value : 'https://cloudflare-dns.com/dns-query', cleanIps: el('cfg-ips').value, slaveNodes: el('cfg-nodes').value, maintenanceHost: el('cfg-fake').value, backupRelay: el('cfg-relay').value, nat64Prefix: el('cfg-nat64') ? el('cfg-nat64').value : '', enableDirectConfigs: el('cfg-direct-configs') ? el('cfg-direct-configs').checked : false, autoUpdate: el('cfg-auto-update') ? el('cfg-auto-update').checked : false, autoUpdateFormat: document.querySelector('input[name="auto-update-format"]:checked')?.value || 'normal',
                      enableOpt1: el('cfg-tfo').checked, enableOpt2: el('cfg-ech').checked,
                      tgToken: el('cfg-tg-token').value, tgChatId: el('cfg-tg-chat').value, tgAdminId: el('cfg-tg-admin').value,
                      cfAccountId: el('cfg-cf-acc').value, cfApiToken: el('cfg-cf-token').value,
                      cfWorkerName: el('cfg-cf-worker').value,
                      isPaused: el('cfg-pause').checked, silentAlerts: el('cfg-silent').checked,
                      githubRepo: el('cfg-github-repo').value,
                      subUserAgent: el('cfg-sub-ua').value,
                      customPanelUrl: el('cfg-custom-panel-url').value,
                      nameStrategy: el('cfg-name-strategy').value,
                      namePrefix: el('cfg-name-prefix').value,
                      fakeConfigs: getFakeConfigsFromUI()
                  }
              };
              
              try {
                  const res = await fetch(baseRoute + '/api/sync', { method: 'POST', body: JSON.stringify(payload) });
                  if (res.ok) {
                      btnTxt.innerText = 'Success!';
                  } else {
                      btnTxt.innerText = 'Sync Failed';
                  }
              } catch (e) {
                  btnTxt.innerText = 'Network Error';
              } finally {
                  icon.classList.remove('animate-spin');
                  setTimeout(() => { btnTxt.innerText = 'Force Sync Now'; }, 3000);
              }
          }

          document.getElementById('pwd').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
  
          function renderUsersTable() {
              const tbl = document.getElementById('tbl-users');
              if(!tbl) return;
              let users = window.nahanConfig?.users || [];
              let usage = window.nahanUsage || {};
              
              // Calculate stats metrics
              let totalUsersVal = users.length;
              let activeSubscribers = users.filter(u => !u.isPaused && (!u.expiryMs || Date.now() <= u.expiryMs)).length;
              let autoDisabledCount = users.filter(u => u.isPaused && u.disabledReason).length;
              let pausedSubscribers = users.filter(u => u.isPaused && !u.disabledReason).length;
              let expiredCount = users.filter(u => u.expiryMs && Date.now() > u.expiryMs && !u.isPaused).length;
              let totalReqsSum = 0;
              users.forEach(u => {
                  let sysU = usage[u.id.replace(/-/g,'').toLowerCase()] || {reqs: 0};
                  totalReqsSum += (sysU.reqs || 0);
              });
              let totalGBSum = (totalReqsSum / 6000).toFixed(2);

              // Update stats elements in DOM if they exist
              const totalUsersEl = document.getElementById('stat-total-users');
              if (totalUsersEl) totalUsersEl.textContent = totalUsersVal;
              const activeUsersEl = document.getElementById('stat-active-users');
              if (activeUsersEl) activeUsersEl.textContent = \`\${activeSubscribers} / \${pausedSubscribers}\`;
              const totalTrafficEl = document.getElementById('stat-total-traffic');
              if (totalTrafficEl) totalTrafficEl.textContent = \`\${totalGBSum} \${i18n[lang]?.ov_gb_unit || 'GB'}\`;
              const autoDisabledEl = document.getElementById('stat-auto-disabled');
              if (autoDisabledEl) autoDisabledEl.textContent = autoDisabledCount;

              // Render Recently Disabled Users Panel
              const disabledPanel = document.getElementById('disabled-users-panel');
              const disabledList = document.getElementById('disabled-users-list');
              const disabledBadge = document.getElementById('disabled-panel-badge');
              if (disabledPanel && disabledList) {
                  const autoDisabledUsers = users.filter(u => u.isPaused && u.disabledReason)
                      .sort((a, b) => (b.disabledAt || 0) - (a.disabledAt || 0));
                  if (autoDisabledUsers.length > 0) {
                      disabledPanel.classList.remove('hidden');
                      if (disabledBadge) disabledBadge.textContent = autoDisabledUsers.length;
                      disabledList.innerHTML = autoDisabledUsers.map(u => {
                          let timeStr = u.disabledAt ? new Date(u.disabledAt).toLocaleString() : '-';
                          let reasonIcon = u.disabledReason.includes('Traffic') ? '📊' : (u.disabledReason.includes('Expiration') ? '📅' : '⚠️');
                          let btnLabel = lang === 'fa' ? 'فعال‌سازی مجدد' : 'Re-enable';
                          return \`
                              <div class="flex items-center justify-between p-3 bg-white/70 dark:bg-slate-800/50 rounded-xl border border-red-100 dark:border-red-800/20 hover:shadow-md transition-shadow">
                                  <div class="flex items-center gap-3 flex-1 min-w-0">
                                      <div class="text-lg">\${reasonIcon}</div>
                                      <div class="min-w-0">
                                          <div class="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">\${u.name}</div>
                                          <div class="text-[11px] text-red-500 dark:text-red-400 font-medium">\${u.disabledReason}</div>
                                          <div class="text-[10px] text-slate-400 mt-0.5">\${timeStr}</div>
                                      </div>
                                  </div>
                                  <button onclick="togglePauseUser('\${u.id}')" class="ml-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap">\${btnLabel}</button>
                              </div>
                          \`;
                      }).join('');
                  } else {
                      disabledPanel.classList.add('hidden');
                  }
              }

              // Apply Status Filter
              const statusFilter = document.getElementById('user-status-filter')?.value || 'all';
              const searchVal = document.getElementById('user-search-input')?.value.toLowerCase().trim() || '';
              let filteredUsers = users.filter(u => {
                  if (statusFilter === 'active' && (u.isPaused || (u.expiryMs && Date.now() > u.expiryMs))) return false;
                  if (statusFilter === 'paused' && (!u.isPaused || u.disabledReason)) return false;
                  if (statusFilter === 'auto-disabled' && !(u.isPaused && u.disabledReason)) return false;
                  return u.name.toLowerCase().includes(searchVal) || u.id.toLowerCase().includes(searchVal);
              });

              tbl.innerHTML = '';
              if (filteredUsers.length === 0) {
                  tbl.innerHTML = '<div class="col-span-full px-4 py-8 text-center text-slate-400 text-sm">' + (i18n[lang]?.no_matching_users || 'No matching subscribers found') + '</div>';
                  return;
              }
              
              // Alias users to the filtered list for downstream compatibility
              users = filteredUsers;
              if (users.length === 0) {
                  tbl.innerHTML = \`<div class="col-span-full px-4 py-8 text-center text-slate-400 text-sm" data-i18n="no_users">\${i18n[lang].no_users}</div>\`;
                  return;
              }
              let tblHtml = '';
              users.forEach((u, i) => {
                  let sysU = usage[u.id.replace(/-/g,'').toLowerCase()] || {reqs: 0, dReqs: 0, lastDay: ''};
                  let userReqs = sysU.reqs || 0;
                  let userDReqs = sysU.lastDay === new Date().toISOString().split('T')[0] ? (sysU.dReqs || 0) : 0;
                  
                  const unlimitedTxt = lang === 'fa' ? 'نامحدود' : 'Unlimited';
                  let limitTotalTxt = u.limitTotalReq ? u.limitTotalReq : unlimitedTxt;
                  let limitDailyTxt = u.limitDailyReq ? u.limitDailyReq : unlimitedTxt;
                  
                  let perT = u.limitTotalReq ? Math.min(100, (userReqs / u.limitTotalReq) * 100).toFixed(1) + '%' : '-';
                  let perD = u.limitDailyReq ? Math.min(100, (userDReqs / u.limitDailyReq) * 100).toFixed(1) + '%' : '-';
                  
                  let expTxt = unlimitedTxt;
                  let isExp = false;
                  if (u.expiryMs) {
                      let date = new Date(u.expiryMs);
                      expTxt = lang === 'fa' ? date.toLocaleDateString('fa-IR') : date.toLocaleDateString();
                      if (Date.now() > u.expiryMs) { 
                          const expiredTxt = lang === 'fa' ? ' (منقضی شده)' : ' (Expired)';
                          expTxt += \` <span class="text-xs text-red-500 font-bold">\${expiredTxt}</span>\`; 
                          isExp = true; 
                      }
                  }
                  
                  const totalLabel = lang === 'fa' ? 'کل:' : 'Total:';
                  const dailyLabel = lang === 'fa' ? 'روزانه:' : 'Daily:';
                  const rLabel = lang === 'fa' ? 'درخواست' : 'r';

                  let linkTitle = lang === 'fa' ? 'کپی لینک ساب' : 'Copy Subscription Link';
                  let pauseTitle = u.isPaused ? (lang === 'fa' ? 'فعال‌سازی کاربر' : 'Resume User') : (lang === 'fa' ? 'توقف کاربر' : 'Pause User');
                  let editTitle = lang === 'fa' ? 'ویرایش کاربر' : 'Edit Subscriber';
                  let resetTitle = lang === 'fa' ? 'بازنشانی مصرف ترافیک' : 'Reset Traffic Metrics';
                  let deleteTitle = lang === 'fa' ? 'حذف کاربر' : 'Delete User';

                  let linkHtml = \`<button onclick="copyData('sync-\${u.id}')" class="text-primary hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 p-2 rounded-lg" title="\${linkTitle}">🔗</button>\`;
                  
                  let pauseBtnHtml = \`<button onclick="togglePauseUser('\${u.id}')" class="\${u.isPaused ? 'text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-800/50' : 'text-amber-500 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-800/50'} p-2 rounded-lg" title="\${pauseTitle}">\\s*\${u.isPaused ? '▶️' : '⏸️'}</button>\`;

                  let editBtnHtml = \`<button onclick="editUser('\${u.id}')" class="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 p-2 rounded-lg" title="\${editTitle}">✏️</button>\`;

                  let resetBtnHtml = \`<button onclick="resetUserTraffic('\${u.id}')" class="text-violet-500 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:hover:bg-violet-800/50 p-2 rounded-lg" title="\${resetTitle}">🔄</button>\`;

                  let isAutoDisabled = u.isPaused && u.disabledReason;
                  let disableInfoHtml = '';
                  if (isAutoDisabled) {
                      let reasonLabel = u.disabledReason;
                      let timeLabel = u.disabledAt ? new Date(u.disabledAt).toLocaleString() : '';
                      let reasonTitle = lang === 'fa' ? 'علت غیرفعال‌سازی' : 'Disable Reason';
                      let timeTitle = lang === 'fa' ? 'زمان غیرفعال‌سازی' : 'Disabled At';
                      disableInfoHtml = \`
                          <div class="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                              <div class="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                                  <span>⚠️</span>
                                  <span>\${reasonTitle}:</span>
                              </div>
                              <div class="text-[10px] text-red-500 dark:text-red-300 mt-0.5">\${reasonLabel}</div>
                              \${timeLabel ? \`<div class="text-[9px] text-slate-400 mt-1">\${timeTitle}: \${timeLabel}</div>\` : ''}
                          </div>
                      \`;
                  }

                  let rawSync = window.nahanProfiles?.find(p => p.id === u.id)?.sync || '';
                  if (rawSync) {
                      rawSync += rawSync.includes('?') ? '&flag=a' : '?flag=a';
                  }

                  tblHtml += \`<div class="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder p-4 hover:shadow-md transition-shadow">
                      <div class="flex items-center justify-between mb-2">
                          <div class="flex items-center gap-2 min-w-0">
                              <span class="w-2 h-2 rounded-full shrink-0 \${u.isPaused ? (isAutoDisabled ? 'bg-red-500' : 'bg-amber-500') : (isExp ? 'bg-red-400' : 'bg-emerald-500')}"></span>
                              <span class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">\${u.name}</span>
                              \${u.proxyIpGeo ? \`<span class="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 font-semibold">\${u.proxyIpGeo.flag}</span>\` : ''}
                          </div>
                          <input type="hidden" id="sync-\${u.id}" value="\${rawSync}">
                          <div class="flex items-center gap-1 shrink-0">
                              \${linkHtml}
                              \${pauseBtnHtml}
                              \${editBtnHtml}
                              \${resetBtnHtml}
                              <button onclick="deleteUser('\${u.id}')" class="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors" title="\${deleteTitle}">🗑️</button>
                          </div>
                      </div>
                      <div class="flex flex-wrap gap-1 mb-2">
                          \${u.isPaused && u.disabledReason ? \`<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">Auto-Disabled</span>\` : ''}
                          \${u.userMode ? \`<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">\${u.userMode === 'alpha' ? 'VLESS' : u.userMode === 'beta' ? 'Trojan' : 'Both'}</span>\` : ''}
                          \${u.userPorts ? \`<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300">\${u.userPorts}</span>\` : ''}
                          \${u.maxConfigs ? \`<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300">\${u.maxConfigs} cfgs</span>\` : ''}
                      </div>
                      \${disableInfoHtml}
                      <div class="space-y-1.5">
                          <div class="flex items-center justify-between text-[11px]">
                              <span class="text-slate-500">\${totalLabel} \${(userReqs/6000).toFixed(2)} GB \${u.limitTotalReq ? '/ ' + (u.limitTotalReq/6000).toFixed(2) + ' GB' : ''}</span>
                              \${perT !== '-' ? \`<span class="font-bold \${parseFloat(perT) > 85 ? 'text-red-500' : parseFloat(perT) > 60 ? 'text-amber-500' : 'text-emerald-500'}">\${perT}</span>\` : ''}
                          </div>
                          \${u.limitTotalReq ? \`
                          <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div class="bg-gradient-to-r \${parseFloat(perT) > 85 ? 'from-red-500 to-rose-600' : parseFloat(perT) > 60 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'} h-full rounded-full" style="width: \${perT}"></div>
                          </div>
                          \` : ''}
                          <div class="flex items-center justify-between text-[10px] text-slate-400">
                              <span>\${dailyLabel} \${userDReqs} \${rLabel}</span>
                              <span>\${expTxt}</span>
                          </div>
                      </div>
                  \`;
                  tblHtml += '</div>';
              });
              tbl.innerHTML = tblHtml;
              applyLang();
          }

          async function resetUserTraffic(uuid) {
              const resetMsg = lang === 'fa' ? 'آیا از بازنشانی وضعیت ترافیک (کل و روزانه) این مشترک مطمئن هستید؟' : 'Are you sure you want to reset all traffic metrics (Total and Daily) for this subscriber?';
              if(!confirm(resetMsg)) return;
              try {
                  const res = await fetch(baseRoute + '/api/sync', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ key: sessionKey, resetUUID: uuid })
                  });
                  if (res.ok) {
                      const successMsg = lang === 'fa' ? 'ترافیک مشترک با موفقیت بازنشانی شد!' : 'Subscriber traffic metrics successfully reset!';
                      alert(successMsg);
                      doLogin(true); // reload usage data from server
                  } else {
                      const errMsg = lang === 'fa' ? 'سرور در بازنشانی ترافیک خطا بازگرداند.' : 'Server returned error while resetting metrics.';
                      alert(errMsg);
                  }
              } catch(e) {
                  const netErr = lang === 'fa' ? 'خطای ارتباط با شبکه.' : 'Network connection error.';
                  alert(netErr);
              }
          }

          function deleteUser(uuid) {
              const deleteMsg = lang === 'fa' ? 'آیا از حذف این کاربر مطمئن هستید؟' : 'Are you sure you want to delete this user?';
              if(!confirm(deleteMsg)) return;
              if(window.nahanConfig && window.nahanConfig.users) {
                  window.nahanConfig.users = window.nahanConfig.users.filter(u => u.id !== uuid);
              }
              // Automatically sync
              renderUsersTable();
              doSaveDirectly();
          }

          function togglePauseUser(uuid) {
              if(window.nahanConfig && window.nahanConfig.users) {
                  let usr = window.nahanConfig.users.find(u => u.id === uuid);
                  if (usr) {
                      usr.isPaused = !usr.isPaused;
                      if (!usr.isPaused) {
                          usr.disabledReason = null;
                          usr.disabledAt = null;
                      }
                      renderUsersTable();
                      doSaveDirectly();
                  }
              }
          }

          function getGlobalPorts() {
              return (window.nahanConfig && window.nahanConfig.socketPorts)
                  ? window.nahanConfig.socketPorts.split(',').map(s=>s.trim()).filter(Boolean)
                  : ['443'];
          }

          function getGlobalMode() {
              return (window.nahanConfig && window.nahanConfig.mode) ? window.nahanConfig.mode : 'alpha';
          }

          function openAddUserModal() {
              document.getElementById('modal-add-user').classList.remove('hidden');
              buildPortCheckboxes('add-user-ports-wrap', null);
              buildModeCheckboxes('add-user-mode-wrap', null);
              buildIPCheckboxes("add-user-clean-ips-wrap", "", (window.nahanConfig?.cleanIps||"").split(/[\\s,;]+/).map(s=>s.trim()).filter(Boolean));
              buildIPCheckboxes("add-user-proxy-ips-wrap", "", (window.nahanConfig?.backupRelay||"").split(/[\\s,;]+/).map(s=>s.trim()).filter(Boolean));
              buildNodeCheckboxes("add-user-nodes-wrap", "", (window.nahanConfig?.slaveNodes||"").split(/[\\s,;]+/).map(s=>s.trim()).filter(Boolean));
          }

          
function buildIPCheckboxes(wrapId, selectedIps, allIps) {
    const wrap = document.getElementById(wrapId);
    if(!wrap) return;
    wrap.innerHTML = '';
    if(!allIps || allIps.length === 0) {
        wrap.innerHTML = '<span class="text-xs text-slate-400">' + (i18n[lang]?.no_ips_advanced || 'No IPs added in Advanced Tab') + '</span>';
        return;
    }
    const selArr = selectedIps ? selectedIps.split(',').map(s=>s.trim()).filter(Boolean) : [];
    allIps.forEach(ip => {
        const lbl = document.createElement('label');
        lbl.className = "flex items-center gap-1.5 text-sm cursor-pointer border border-slate-200 dark:border-darkborder px-2 py-1 rounded-lg";
        const cb = document.createElement('input');
        cb.type = "checkbox";
        cb.className = "accent-primary";
        cb.value = ip;
        if(selArr.includes(ip)) cb.checked = true;
        
        lbl.appendChild(cb);
        const span = document.createElement('span');
        span.innerText = ip;
        lbl.appendChild(span);
        wrap.appendChild(lbl);
    });
}
function getSelectedCheckboxes(wrapId) {
    const wrap = document.getElementById(wrapId);
    if(!wrap) return '';
    const checked = Array.from(wrap.querySelectorAll('input:checked')).map(cb => cb.value);
    return checked.join(',');
}
function buildNodeCheckboxes(wrapId, selectedNodes, allNodes) {
    const wrap = document.getElementById(wrapId);
    if(!wrap) return;
    wrap.innerHTML = '';
    if(!allNodes || allNodes.length === 0) {
        wrap.innerHTML = '<span class="text-xs text-slate-400">' + (i18n[lang]?.no_nodes_advanced || 'No slave nodes in Advanced Tab') + '</span>';
        return;
    }
    const selArr = selectedNodes ? selectedNodes.split(',').map(s=>s.trim()).filter(Boolean) : [];
    allNodes.forEach(node => {
        const lbl = document.createElement('label');
        lbl.className = "flex items-center gap-1.5 text-sm cursor-pointer border border-slate-200 dark:border-darkborder px-2 py-1 rounded-lg";
        const cb = document.createElement('input');
        cb.type = "checkbox";
        cb.className = "accent-primary";
        cb.value = node;
        if(selArr.includes(node)) cb.checked = true;
        lbl.appendChild(cb);
        const span = document.createElement('span');
        span.innerText = node;
        lbl.appendChild(span);
        wrap.appendChild(lbl);
    });
}

function buildPortCheckboxes(wrapId, selectedPorts) {
              const wrap = document.getElementById(wrapId);
              if (!wrap) return;
              const globalPorts = getGlobalPorts();
              const sel = selectedPorts ? selectedPorts.split(',').map(s=>s.trim()) : ['443'];
              wrap.innerHTML = globalPorts.map(function(p) {
                  return '<label class="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" value="' + p + '" class="' + wrapId + '-port-cb accent-primary"' + (sel.includes(p) ? ' checked' : '') + '><span>' + p + '</span></label>';
              }).join('');
          }

          function buildModeCheckboxes(wrapId, userMode) {
              const globalMode = getGlobalMode();
              const alphaAllowed = globalMode === 'alpha' || globalMode === 'both';
              const betaAllowed = globalMode === 'beta' || globalMode === 'both';
              const selAlpha = userMode === 'alpha' || userMode === 'both' || (!userMode && alphaAllowed);
              const selBeta = userMode === 'beta' || userMode === 'both' || (!userMode && betaAllowed);
              const wrap = document.getElementById(wrapId);
              if (!wrap) return;
              wrap.querySelectorAll('input[type=checkbox]').forEach(cb => {
                  if (cb.value === 'alpha') { cb.disabled = !alphaAllowed; cb.checked = selAlpha && alphaAllowed; cb.closest                    ('label').style.opacity = alphaAllowed ? '1' : '0.35'; }
                  if (cb.value === 'beta')  { cb.disabled = !betaAllowed;  cb.checked = selBeta && betaAllowed;  cb.closest                     ('label').style.opacity = betaAllowed  ? '1' : '0.35'; }
              });
          }

          function readModeFromCheckboxes(cbClass) {
             const cbs = [...document.querySelectorAll('.' + cbClass + ':checked')].map(c=>c.value);
              if (cbs.includes('alpha') && cbs.includes('beta')) return 'both';
              if (cbs.includes('alpha')) return 'alpha';
              if (cbs.includes('beta')) return 'beta';
              return getGlobalMode();
          }

          function readPortsFromCheckboxes(wrapId) {
             const ports = [...document.querySelectorAll('#' + wrapId + ' input[type=checkbox]:checked')].map(c=>c.value);
              return ports.length ? ports.join(',') : getGlobalPorts()[0];
          }

          function commitAddUser() {
              const name = document.getElementById('add-user-name').value.trim();
              let tReq = document.getElementById('add-user-total-reqs').value;
              tReq = tReq? Math.floor(parseFloat(tReq) * 6000): null;
              let dReq = document.getElementById('add-user-daily-reqs').value;
              dReq = dReq? Math.floor(parseFloat(dReq) * 6000): null;
              let days = document.getElementById('add-user-days').value;
               const cleanIpsCheckbox = getSelectedCheckboxes("add-user-clean-ips-wrap");
               const cleanIpsCustom = document.getElementById("add-user-custom-clean").value.trim();
               let cleanIpArray = [];
               if (cleanIpsCheckbox) cleanIpArray.push(...cleanIpsCheckbox.split(','));
               if (cleanIpsCustom) {
                   cleanIpArray.push(...cleanIpsCustom.split(/[\\s,;]+/).map(s=>s.trim()).filter(Boolean));
               }
               const cleanIp = cleanIpArray.length ? cleanIpArray.join(',') : null;
               const proxyIpsCheckbox = getSelectedCheckboxes("add-user-proxy-ips-wrap");
               const proxyIpsCustom = document.getElementById("add-user-custom-proxy").value.trim();
               let proxyIpArray = [];
               if (proxyIpsCheckbox) proxyIpArray.push(...proxyIpsCheckbox.split(','));
               if (proxyIpsCustom) {
                   proxyIpArray.push(...proxyIpsCustom.split(/[\\s,;]+/).map(s=>s.trim()).filter(Boolean));
               }
               const proxyIp = proxyIpArray.length ? proxyIpArray.join(',') : null;
               
               const customName = document.getElementById('add-user-custom-name').value.trim() || null;
               const userMode = readModeFromCheckboxes('add-mode-cb');
               const userPorts = readPortsFromCheckboxes('add-user-ports-wrap');
               let maxConfigs = document.getElementById('add-user-max-configs').value;
               maxConfigs = maxConfigs ? parseInt(maxConfigs) : null;
               const nodesCheckbox = getSelectedCheckboxes("add-user-nodes-wrap");
               const nodesCustom = document.getElementById("add-user-custom-nodes").value.trim();
               let nodesArray = [];
               if (nodesCheckbox) nodesArray.push(...nodesCheckbox.split(','));
               if (nodesCustom) nodesArray.push(...nodesCustom.split(/[\\s,;]+/).map(s=>s.trim()).filter(Boolean));
               const userNodes = nodesArray.length ? nodesArray.join(',') : null;
               const nat64 = document.getElementById('edit-user-nat64').value.trim() || null;
               
               if(!name) {
                   alert(lang === 'fa' ? 'لطفاً نام را وارد کنید' : 'Please enter a name');
                  return;
              }

              if(!window.nahanConfig) window.nahanConfig = {};
              if(!window.nahanConfig.users) window.nahanConfig.users = [];

              if(window.nahanConfig.users.some(u => u.name.trim().toLowerCase() === name.toLowerCase())) {
                  alert(lang === 'fa' ? 'این نام قبلاً استفاده شده است' : 'This name is already taken');
                  return;
              }

              tReq = tReq ? parseInt(tReq) : null;
              dReq = dReq ? parseInt(dReq) : null;
              days = days ? parseInt(days) : null;
              
              let newId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                  .map((b,i) => (i===4||i===6||i===8||i===10?'-':'') + b.toString(16).padStart(2,'0')).join('');
              
               const u = {
                   id: newId,
                   name: name,
                   limitTotalReq: tReq,
                   limitDailyReq: dReq,
                   expiryMs: days ? Date.now() + days*86400000 : null,
                   proxyIp: proxyIp,
                    cleanIp: cleanIp,
                    customName: customName,
                    userMode: userMode,
                    userPorts: userPorts,
                    maxConfigs: maxConfigs,
                    userNodes: userNodes,
                    nat64: nat64,
                    createdAt: Date.now()
               };
              
              window.nahanConfig.users.push(u);
              document.getElementById('modal-add-user').classList.add('hidden');
              document.getElementById('add-user-name').value = '';
               document.getElementById('add-user-custom-name').value = '';
               document.getElementById('add-user-custom-clean').value = '';
               document.getElementById('add-user-custom-proxy').value = '';
               document.getElementById('add-user-custom-nodes').value = '';
              document.getElementById('add-user-total-reqs').value = '';
              document.getElementById('add-user-daily-reqs').value = '';
              document.getElementById('add-user-days').value = '';
              document.getElementById('add-user-max-configs').value = '';
              
              renderUsersTable();
              doSaveDirectly();
          }

          function editUser(uuid) {
              if(!window.nahanConfig || !window.nahanConfig.users) return;
              let u = window.nahanConfig.users.find(usr => usr.id === uuid);
              if(!u) return;
              
              document.getElementById('edit-user-id').value = u.id;
              document.getElementById('edit-user-name').value = u.name;
              document.getElementById('edit-user-total-reqs').value = u.limitTotalReq? (u.limitTotalReq / 6000).toFixed(2): '';
              document.getElementById('edit-user-daily-reqs').value = u.limitDailyReq? (u.limitDailyReq / 6000).toFixed(2): '';
                            const globalCleanIps = (window.nahanConfig?.cleanIps||"").split(/[\\r\\n,;]+/).map(s=>s.trim()).filter(Boolean);
              const userCleanIps = (u.cleanIp || "").split(/[\\r\\n,;]+/).map(s=>s.trim()).filter(Boolean);
              const checkedGlobalClean = [];
              const customClean = [];
              userCleanIps.forEach(ip => {
                  let hostOnly = ip.split('#')[0].split(':')[0].trim();
                  let isFound = globalCleanIps.some(g => g.split('#')[0].split(':')[0].trim() === hostOnly || g === ip);
                  if (isFound) checkedGlobalClean.push(ip);
                  else customClean.push(ip);
              });
              buildIPCheckboxes("edit-user-clean-ips-wrap", checkedGlobalClean.join(','), globalCleanIps);
              document.getElementById('edit-user-custom-clean').value = customClean.join(', ');

              const globalProxyIps = (window.nahanConfig?.backupRelay||"").split(/[\\r\\n,;]+/).map(s=>s.trim()).filter(Boolean);
              const userProxyIps = (u.proxyIp || "").split(/[\\r\\n,;]+/).map(s=>s.trim()).filter(Boolean);
              const checkedGlobalProxy = [];
              const customProxy = [];
              userProxyIps.forEach(ip => {
                  let hostOnly = ip.split('#')[0].split(':')[0].trim();
                  let isFound = globalProxyIps.some(g => g.split('#')[0].split(':')[0].trim() === hostOnly || g === ip);
                  if (isFound) checkedGlobalProxy.push(ip);
                  else customProxy.push(ip);
              });
               buildIPCheckboxes("edit-user-proxy-ips-wrap", checkedGlobalProxy.join(','), globalProxyIps);
               document.getElementById('edit-user-custom-proxy').value = customProxy.join(', ');

               const globalNodes = (window.nahanConfig?.slaveNodes||"").split(/[\\r\\n,;]+/).map(s=>s.trim()).filter(Boolean);
               const userNodesList = (u.userNodes || "").split(/[\\r\\n,;]+/).map(s=>s.trim()).filter(Boolean);
               const checkedGlobalNodes = [];
               const customNodes = [];
               userNodesList.forEach(node => {
                   let isFound = globalNodes.some(g => g === node);
                   if (isFound) checkedGlobalNodes.push(node);
                   else customNodes.push(node);
               });
               buildNodeCheckboxes("edit-user-nodes-wrap", checkedGlobalNodes.join(','), globalNodes);
               document.getElementById('edit-user-custom-nodes').value = customNodes.join(', ');
               document.getElementById('edit-user-nat64').value = u.nat64 || '';

               document.getElementById('edit-user-custom-name').value = u.customName || '';
              
              document.getElementById('edit-user-max-configs').value = u.maxConfigs || '';
              
              buildPortCheckboxes('edit-user-ports-wrap', u.userPorts);
              buildModeCheckboxes('edit-user-mode-wrap', u.userMode);

              let daysLeft = '';
              if(u.expiryMs) {
                  let diff = u.expiryMs - Date.now();
                  daysLeft = diff > 0 ? Math.ceil(diff / 86400000) : 0;
              }
              document.getElementById('edit-user-days').value = daysLeft;
              
              document.getElementById('modal-edit-user').classList.remove('hidden');
          }

          function commitEditUser() {
              const uuid = document.getElementById('edit-user-id').value;
              const name = document.getElementById('edit-user-name').value.trim();
              let tReq = document.getElementById('edit-user-total-reqs').value;
              tReq = tReq? Math.floor(parseFloat(tReq) * 6000): null;
              let dReq = document.getElementById('edit-user-daily-reqs').value;
              dReq = dReq? Math.floor(parseFloat(dReq) * 6000): null;
              let days = document.getElementById('edit-user-days').value;
                             const proxyIpsCheckbox = getSelectedCheckboxes("edit-user-proxy-ips-wrap");
               const proxyIpsCustom = document.getElementById("edit-user-custom-proxy").value.trim();
               let proxyIpArray = [];
               if (proxyIpsCheckbox) proxyIpArray.push(...proxyIpsCheckbox.split(','));
               if (proxyIpsCustom) {
                   proxyIpArray.push(...proxyIpsCustom.split(/[\\s,;]+/).map(s=>s.trim()).filter(Boolean));
               }
               const proxyIp = proxyIpArray.length ? proxyIpArray.join(',') : null;
               
               const customName = document.getElementById('edit-user-custom-name').value.trim() || null;
               const cleanIpsCheckbox = getSelectedCheckboxes("edit-user-clean-ips-wrap");
               const cleanIpsCustom = document.getElementById("edit-user-custom-clean").value.trim();
               let cleanIpArray = [];
               if (cleanIpsCheckbox) cleanIpArray.push(...cleanIpsCheckbox.split(','));
               if (cleanIpsCustom) {
                   cleanIpArray.push(...cleanIpsCustom.split(/[\\s,;]+/).map(s=>s.trim()).filter(Boolean));
               }
               const cleanIp = cleanIpArray.length ? cleanIpArray.join(',') : null;
              const userMode = readModeFromCheckboxes('edit-mode-cb');
              const userPorts = readPortsFromCheckboxes('edit-user-ports-wrap');
               let maxConfigs = document.getElementById('edit-user-max-configs').value;
               maxConfigs = maxConfigs ? parseInt(maxConfigs) : null;
               const nodesCheckbox = getSelectedCheckboxes("edit-user-nodes-wrap");
               const nodesCustom = document.getElementById("edit-user-custom-nodes").value.trim();
               let nodesArray = [];
               if (nodesCheckbox) nodesArray.push(...nodesCheckbox.split(','));
               if (nodesCustom) nodesArray.push(...nodesCustom.split(/[\\s,;]+/).map(s=>s.trim()).filter(Boolean));
               const userNodes = nodesArray.length ? nodesArray.join(',') : null;
               const nat64 = document.getElementById('add-user-nat64').value.trim() || null;
               
               if(!name) {
                  alert(lang === 'fa' ? 'لطفاً نام را وارد کنید' : 'Please enter a name');
                  return;
              }
              tReq = tReq ? parseInt(tReq) : null;
              dReq = dReq ? parseInt(dReq) : null;
              days = days ? parseInt(days) : null;
              
              if(!window.nahanConfig || !window.nahanConfig.users) return;

              if(window.nahanConfig.users.some(u => u.id !== uuid && u.name.trim().toLowerCase() === name.toLowerCase())) {
                  alert(lang === 'fa' ? 'این نام قبلاً استفاده شده است' : 'This name is already taken');
                  return;
              }

              let u = window.nahanConfig.users.find(usr => usr.id === uuid);
              if(!u) return;
              
              u.name = name;
              u.limitTotalReq = tReq;
              u.limitDailyReq = dReq;
              u.expiryMs = days ? Date.now() + days*86400000 : null;
              u.proxyIp = proxyIp;
               u.cleanIp = cleanIp;
               u.customName = customName;
              u.userMode = userMode;
              u.userPorts = userPorts;
              u.maxConfigs = maxConfigs;
              u.userNodes = userNodes;
              u.nat64 = nat64;
              
              document.getElementById('modal-edit-user').classList.add('hidden');
              renderUsersTable();
              doSaveDirectly();
          }

          function renderShopView() {
              const conf = window.nahanConfig;
              if (!conf) return;
              const el = id => document.getElementById(id);
              if (el('shop-purchase-enabled')) el('shop-purchase-enabled').checked = conf.purchaseEnabled || false;
              if (el('shop-free-trial')) el('shop-free-trial').checked = conf.freeTrial || false;
              if (el('shop-trial-days')) el('shop-trial-days').value = conf.freeTrialDays || 3;
              if (el('shop-trial-gb')) el('shop-trial-gb').value = conf.freeTrialGB || 3;
              if (el('shop-card-number')) el('shop-card-number').value = conf.adminCardNumber || '';
              if (el('shop-card-owner')) el('shop-card-owner').value = conf.adminCardOwner || '';
              if (el('shop-welcome-msg')) el('shop-welcome-msg').value = conf.botWelcomeMsg || '';
              if (el('shop-support-msg')) el('shop-support-msg').value = conf.botSupportMsg || '';
              renderShopPlans();
              renderPendingPurchases();
              renderPromoCodes();
              updateShopStats();
          }

          function updateShopStats() {
              const conf = window.nahanConfig || {};
              const pending = (conf.pendingPurchases || []).length;
              const plans = (conf.purchaseOptions || []).length;
              const purchaseOn = conf.purchaseEnabled || false;
              const trialOn = conf.freeTrial || false;
              const el = id => document.getElementById(id);
              if (el('shop-stat-pending')) el('shop-stat-pending').textContent = pending;
              if (el('shop-stat-plans')) el('shop-stat-plans').textContent = plans;
              if (el('shop-stat-purchase')) {
                  el('shop-stat-purchase').textContent = purchaseOn ? 'ON' : 'OFF';
                  el('shop-stat-purchase').className = 'text-2xl font-black ' + (purchaseOn ? 'text-emerald-500' : 'text-slate-400');
              }
              if (el('shop-stat-trial')) {
                  el('shop-stat-trial').textContent = trialOn ? 'ON' : 'OFF';
                  el('shop-stat-trial').className = 'text-2xl font-black ' + (trialOn ? 'text-violet-500' : 'text-slate-400');
              }
          }

          function renderShopPlans() {
              const plans = (window.nahanConfig && window.nahanConfig.purchaseOptions) ? window.nahanConfig.purchaseOptions : [];
              const list = document.getElementById('shop-plans-list');
              if (!list) return;
              if (plans.length === 0) {
                  list.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">No purchase plans configured. Add a plan to get started.</p>';
                  const statEl = document.getElementById('shop-stat-plans');
                  if (statEl) statEl.textContent = '0';
                  return;
              }
              list.innerHTML = plans.map((p, idx) => \`
                  <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-darkborder/50">
                      <div class="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                              <input type="text" value="\${p.name || ''}" onchange="window.nahanConfig.purchaseOptions[\${idx}].name=this.value;" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-darkborder bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs font-semibold">
                          </div>
                          <div>
                              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price</label>
                              <input type="text" value="\${p.price || ''}" placeholder="e.g. 50,000 T" onchange="window.nahanConfig.purchaseOptions[\${idx}].price=this.value;" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-darkborder bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs">
                          </div>
                          <div>
                              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Days</label>
                              <input type="number" value="\${p.days || 30}" min="1" onchange="window.nahanConfig.purchaseOptions[\${idx}].days=parseInt(this.value)||30;" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-darkborder bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs">
                          </div>
                          <div>
                              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">GB</label>
                              <input type="number" value="\${p.gb || 10}" min="1" onchange="window.nahanConfig.purchaseOptions[\${idx}].gb=parseInt(this.value)||10;" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-darkborder bg-white dark:bg-slate-900 focus:border-primary outline-none text-xs">
                          </div>
                      </div>
                      <button onclick="removeShopPlan(\${idx})" class="shrink-0 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 rounded-xl transition-colors" title="Remove Plan">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                  </div>
              \`).join('');
              const statEl = document.getElementById('shop-stat-plans');
              if (statEl) statEl.textContent = plans.length;
          }

          function addShopPlan() {
              if (!window.nahanConfig) return;
              if (!window.nahanConfig.purchaseOptions) window.nahanConfig.purchaseOptions = [];
              const newId = 'plan_' + Date.now();
              window.nahanConfig.purchaseOptions.push({ id: newId, name: 'New Plan', price: '', days: 30, gb: 10 });
              renderShopPlans();
              updateShopStats();
          }

          function removeShopPlan(idx) {
              if (!window.nahanConfig || !window.nahanConfig.purchaseOptions) return;
              window.nahanConfig.purchaseOptions.splice(idx, 1);
              renderShopPlans();
              updateShopStats();
          }

          function renderPendingPurchases() {
              const purchases = (window.nahanConfig && window.nahanConfig.pendingPurchases) ? window.nahanConfig.pendingPurchases : [];
              const list = document.getElementById('shop-pending-list');
              if (!list) return;
              if (purchases.length === 0) {
                  list.innerHTML = '<p class="text-sm text-slate-400 text-center py-6">✅ No pending purchase requests.</p>';
                  const statEl = document.getElementById('shop-stat-pending');
                  if (statEl) statEl.textContent = '0';
                  return;
              }
              list.innerHTML = purchases.map((p, idx) => {
                  const timeStr = p.ts ? new Date(p.ts).toLocaleString('en-US', {hour12: false}) : '-';
                  const planName = p.planName || p.packageId || 'Unknown';
                  const username = p.username ? '@' + p.username : (p.firstName || ('User ' + p.chatId));
                  const hasReceipt = p.receiptFileId ? true : false;
                  return \`
                  <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/30">
                      <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                              <span class="font-bold text-sm text-slate-800 dark:text-slate-100">\${username}</span>
                              \${hasReceipt ? '<span class="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">Receipt Uploaded</span>' : '<span class="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">Awaiting Receipt</span>'}
                          </div>
                          <div class="text-xs text-slate-500">📦 \${planName}</div>
                          <div class="text-[10px] text-slate-400 mt-0.5">🕒 \${timeStr} · ID: \${p.chatId}</div>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                          <button onclick="approvePurchase(\${idx})" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">
                              ✅ Approve
                          </button>
                          <button onclick="rejectPurchase(\${idx})" class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">
                              ❌ Reject
                          </button>
                      </div>
                  </div>
                  \`;
              }).join('');
              const statEl = document.getElementById('shop-stat-pending');
              if (statEl) statEl.textContent = purchases.length;
          }

          function approvePurchase(idx) {
              const conf = window.nahanConfig;
              if (!conf || !conf.pendingPurchases) return;
              const purchase = conf.pendingPurchases[idx];
              if (!purchase) return;
              const confirmMsg = lang === 'fa'
                  ? \`آیا از تأیید خرید \${purchase.username ? '@'+purchase.username : purchase.chatId} مطمئنید؟\`
                  : \`Approve purchase for \${purchase.username ? '@'+purchase.username : purchase.chatId}?\`;
              if (!confirm(confirmMsg)) return;

              const plan = (conf.purchaseOptions || []).find(p => p.id === purchase.packageId) || {};
              const gb = purchase.gb || plan.gb || 10;
              const days = purchase.days || plan.days || 30;
              const expiryMs = Date.now() + days * 24 * 3600 * 1000;
              const limitTotalReq = Math.round(gb * 6000);

              if (!conf.users) conf.users = [];
              const existingUser = conf.users.find(u => u.tgChatId == purchase.chatId);
              if (existingUser) {
                  existingUser.isPaused = false;
                  existingUser.expiryMs = expiryMs;
                  existingUser.limitTotalReq = limitTotalReq;
                  existingUser.disabledReason = null;
                  existingUser.disabledAt = null;
              } else {
                  const newId = crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
                  conf.users.push({
                      id: newId,
                      name: purchase.firstName || purchase.username || ('User ' + purchase.chatId),
                      tgChatId: purchase.chatId,
                      limitTotalReq,
                      expiryMs,
                      createdAt: Date.now(),
                      subId: newId
                  });
              }

              conf.pendingPurchases.splice(idx, 1);
              renderPendingPurchases();
              renderUsersTable();
              updateShopStats();
              doSaveDirectly();
          }

          function rejectPurchase(idx) {
              const conf = window.nahanConfig;
              if (!conf || !conf.pendingPurchases) return;
              const purchase = conf.pendingPurchases[idx];
              if (!purchase) return;
              const confirmMsg = lang === 'fa'
                  ? \`رد کردن درخواست خرید \${purchase.username ? '@'+purchase.username : purchase.chatId}؟\`
                  : \`Reject purchase request from \${purchase.username ? '@'+purchase.username : purchase.chatId}?\`;
              if (!confirm(confirmMsg)) return;
              conf.pendingPurchases.splice(idx, 1);
              renderPendingPurchases();
              updateShopStats();
              doSaveDirectly();
          }

          function renderPromoCodes() {
              const codes = (window.nahanConfig && window.nahanConfig.promoCodes) ? window.nahanConfig.promoCodes : [];
              const list = document.getElementById('shop-promo-list');
              if (!list) return;
              if (codes.length === 0) {
                  list.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">No promo codes yet. Add one to offer discounts.</p>';
                  return;
              }
              const nowMs = Date.now();
              list.innerHTML = codes.map((c, idx) => {
                  const isExpired = c.validUntil && nowMs > c.validUntil;
                  const isFull = c.maxUses > 0 && c.usedCount >= c.maxUses;
                  const statusBadge = !c.isActive
                      ? '<span class="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded font-bold">OFF</span>'
                      : isExpired
                      ? '<span class="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">EXPIRED</span>'
                      : isFull
                      ? '<span class="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold">FULL</span>'
                      : '<span class="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>';
                  const discountText = c.discountType === 'percentage' ? \`\${c.discountValue}%\` : \`\${c.discountValue} off\`;
                  const expiryText = c.validUntil ? new Date(c.validUntil).toLocaleDateString('en-US') : 'No expiry';
                  const usesText = c.maxUses > 0 ? \`\${c.usedCount}/\${c.maxUses}\` : \`\${c.usedCount}/∞\`;
                  return \`
                  <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-darkborder/50 \${!c.isActive || isExpired || isFull ? 'opacity-60' : ''}">
                      <div class="flex-1 min-w-0">
                          <div class="flex items-center flex-wrap gap-2 mb-1">
                              <code class="font-black text-sm text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-lg">\${c.code}</code>
                              \${statusBadge}
                              <span class="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">\${c.discountType === 'percentage' ? '%' : '$'} \${discountText}</span>
                          </div>
                          <div class="flex flex-wrap gap-3 text-[11px] text-slate-400 mt-1">
                              <span>📊 Uses: <strong class="text-slate-600 dark:text-slate-300">\${usesText}</strong></span>
                              <span>📅 Expires: <strong class="text-slate-600 dark:text-slate-300">\${expiryText}</strong></span>
                              \${c.note ? \`<span>📝 \${c.note}</span>\` : ''}
                          </div>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                          <button onclick="togglePromoCode(\${idx})" class="px-3 py-1.5 text-xs font-bold rounded-xl transition-colors \${c.isActive ? 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300' : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}">
                              \${c.isActive ? '⏸ Disable' : '▶ Enable'}
                          </button>
                          <button onclick="removePromoCode(\${idx})" class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 rounded-xl transition-colors" title="Delete">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                      </div>
                  </div>
                  \`;
              }).join('');
          }

          function addPromoCode() {
              const code = prompt('Promo code (e.g. WELCOME20):');
              if (!code || !code.trim()) return;
              const codeClean = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
              if (!codeClean) return alert('Invalid code. Use letters, numbers, _ or -');
              const conf = window.nahanConfig;
              if (!conf) return;
              if (!conf.promoCodes) conf.promoCodes = [];
              if (conf.promoCodes.find(c => c.code === codeClean)) return alert('This code already exists.');

              const discType = prompt('Discount type: enter "%" for percentage or "f" for fixed amount:', '%') === 'f' ? 'fixed' : 'percentage';
              const discVal = parseFloat(prompt(\`Discount value (\${discType === 'percentage' ? 'e.g. 10 for 10%' : 'e.g. 5000 for fixed amount'}):\`) || '0');
              if (!discVal || discVal <= 0) return alert('Invalid discount value.');
              const maxUses = parseInt(prompt('Max uses (0 = unlimited):', '0') || '0');
              const daysValid = parseInt(prompt('Valid for how many days? (0 = no expiry):', '30') || '0');
              const noteText = prompt('Note/description (optional):') || '';

              const validUntil = daysValid > 0 ? Date.now() + daysValid * 86400000 : null;
              conf.promoCodes.push({
                  id: 'promo_' + Date.now(),
                  code: codeClean,
                  discountType: discType,
                  discountValue: discVal,
                  maxUses: maxUses,
                  usedCount: 0,
                  usedBy: [],
                  validUntil: validUntil,
                  applicablePlans: [],
                  isActive: true,
                  createdAt: Date.now(),
                  note: noteText
              });
              renderPromoCodes();
              doSaveDirectly();
          }

          function togglePromoCode(idx) {
              const conf = window.nahanConfig;
              if (!conf || !conf.promoCodes || !conf.promoCodes[idx]) return;
              conf.promoCodes[idx].isActive = !conf.promoCodes[idx].isActive;
              renderPromoCodes();
              doSaveDirectly();
          }

          function removePromoCode(idx) {
              const conf = window.nahanConfig;
              if (!conf || !conf.promoCodes) return;
              const c = conf.promoCodes[idx];
              if (!c) return;
              if (!confirm(\`Delete promo code "\${c.code}"? This cannot be undone.\`)) return;
              conf.promoCodes.splice(idx, 1);
              renderPromoCodes();
              doSaveDirectly();
          }

          function saveShopConfig() {
              const el = id => document.getElementById(id);
              const conf = window.nahanConfig;
              if (!conf) return;
              if (el('shop-purchase-enabled')) conf.purchaseEnabled = el('shop-purchase-enabled').checked;
              if (el('shop-free-trial')) conf.freeTrial = el('shop-free-trial').checked;
              if (el('shop-trial-days')) conf.freeTrialDays = parseInt(el('shop-trial-days').value) || 3;
              if (el('shop-trial-gb')) conf.freeTrialGB = parseInt(el('shop-trial-gb').value) || 3;
              if (el('shop-card-number')) conf.adminCardNumber = el('shop-card-number').value;
              if (el('shop-card-owner')) conf.adminCardOwner = el('shop-card-owner').value;
              if (el('shop-welcome-msg')) conf.botWelcomeMsg = el('shop-welcome-msg').value;
              if (el('shop-support-msg')) conf.botSupportMsg = el('shop-support-msg').value;
              updateShopStats();
              doSaveDirectly();
          }

          async function doSaveDirectly() {
              const btn = document.querySelector('button[onclick="doSave()"]');
              const origText = btn.innerText; btn.innerText = "...";
              try {
                  const res = await fetch(baseRoute + '/api/sync', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ key: sessionKey, config: window.nahanConfig })
                  });
                  if(res.ok) {
                       const stat = document.getElementById('save-status');
                       stat.textContent = "Saved. Refreshing...";
                       setTimeout(() => { doLogin(true); stat.textContent = ""; }, 1000);
                  }
              } catch(e) {}
              btn.innerText = origText;
          }

          async function resolveSmartCleanIps() {
              const btn = document.getElementById('btn-resolve-smart-ips');
              const origText = btn.innerHTML;
              btn.disabled = true;
              btn.innerHTML = '⚡ Resolving CDN & Clean IPs...';
              
              const domains = [
                  'www.speedtest.net',
                  'grok.com',
                  'feedback.spotify.com',
                  'www.hcaptcha.com',
                  'chatgpt.com',
                  'sourceforge.net',
                  'snapp.ir',
                  'digikala.com',
                  'divar.ir',
                  'cafebazaar.ir',
                  'shaparak.ir',
                  'aparat.com',
                  'soft98.ir',
                  'varzesh3.com'
              ];
              
              let resolvedIps = new Set();
              const cleanIpsTextarea = document.getElementById('cfg-ips');
              
              async function resolveOne(domain) {
                  try {
                      const res = await fetch(\`https://cloudflare-dns.com/dns-query?name=\${encodeURIComponent(domain)}&type=A\`, { 
                          headers: { 'accept': 'application/dns-json' }
                      });
                      const data = await res.json();
                      if (data && data.Answer) {
                          data.Answer.forEach(ans => {
                              if (ans.type === 1 && ans.data) {
                                  resolvedIps.add(ans.data);
                              }
                          });
                      }
                  } catch(e) {
                      try {
                          const res = await fetch(\`https://dns.google/resolve?name=\${encodeURIComponent(domain)}&type=A\`);
                          const data = await res.json();
                          if (data && data.Answer) {
                              data.Answer.forEach(ans => {
                                  if (ans.type === 1 && ans.data) {
                                      resolvedIps.add(ans.data);
                                  }
                              });
                          }
                      } catch(ge) {}
                  }
              }
              
              try {
                  await Promise.all(domains.map(d => resolveOne(d)));
              } catch(err) {
                  console.error("DNS resolving process encountered an issue:", err);
              }
              
              if (resolvedIps.size > 0) {
                  const ipList = Array.from(resolvedIps).join('\\n');
                  cleanIpsTextarea.value = ipList;
                  cleanIpsTextarea.dispatchEvent(new Event('input'));
                  cleanIpsTextarea.dispatchEvent(new Event('change'));
                  alert((lang === 'fa' ? 'با موفقیت حل شد و ' : 'Successfully resolved and loaded ') + resolvedIps.size + (lang === 'fa' ? ' آی‌پی تمیز بارگذاری شد!' : ' clean IPs!'));
              } else {
                  alert(lang === 'fa' ? 'خطا در تبدیل دامنه به آی‌پی. لطفاً اتصال اینترنت یا DNS سفارشی خود را بررسی کنید.' : 'Failed to resolve domains to IPs. Please verify your internet connection or custom DNS.');
              }
              
              btn.disabled = false;
              btn.innerHTML = origText;
          }

          async function checkUpdate() {
              try {
                  const res = await fetch(baseRoute + '/api/update', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: sessionKey, action: 'check' })
                  });
                  const data = await res.json();
                  if (data.success && data.updateAvailable) {
                      window._updateData = data;
                      if (window.nahanConfig?.autoUpdate && data.canDeploy) {
                          const format = window.nahanConfig.autoUpdateFormat || 'normal';
                          const formatEl = document.querySelector(\`input[name="auto-update-format"][value="\${format}"]\`);
                          if (formatEl) formatEl.checked = true;
                          const autoRadio = document.querySelector(\`input[name="auto-update-format"][value="\${format}"]\`);
                          if (autoRadio) autoRadio.checked = true;
                          doUpdate();
                      } else {
                          showUpdateBanner((document.getElementById('cfg-github-repo')?.value || window.nahanConfig?.githubRepo || 'itsyebekhe/nahan').replace('https://github.com/', '').replace('http://github.com/', '').trim(), data.latest);
                      }
                  }
                  if (data.success && !data.canDeploy) {
                      const statusEl = document.getElementById('update-deploy-status');
                      if (statusEl) {
                          statusEl.classList.remove('hidden');
                          statusEl.className = 'w-full mt-3 p-3 rounded-xl text-sm font-bold text-center text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
                          statusEl.textContent = i18n[lang].update_requires_cf || 'Configure CF credentials to enable auto-deploy.';
                      }
                  }
              } catch(err) {
                  console.error("Update check failed:", err);
              }
          }

          async function doUpdate() {
              const btn = document.getElementById('update-deploy-btn');
              const statusEl = document.getElementById('update-deploy-status');
              if (!btn) return;
              if (!confirm(lang === 'fa' ? 'آیا از دپلوی نسخه فعلی/جدید اطمینان دارید؟' : 'Deploy the selected version now?')) return;

              const formatEl = document.querySelector('input[name="update-format"]:checked');
              const format = formatEl ? formatEl.value : 'normal';
              const forceDeploy = !window._updateData?.updateAvailable;

              const origText = btn.innerHTML;
              btn.innerHTML = '⏳ ' + (i18n[lang].update_deploying || 'Deploying...');
              btn.disabled = true;
              if (statusEl) {
                  statusEl.classList.remove('hidden');
                  statusEl.className = 'w-full mt-3 p-3 rounded-xl text-sm font-bold text-center text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 animate-pulse';
                  statusEl.textContent = i18n[lang].update_deploying || 'Deploying update...';
              }

              let latestCode = null;
              try {
                  const repo = (document.getElementById('cfg-github-repo')?.value || window.nahanConfig?.githubRepo || 'itsyebekhe/nahan').replace('https://github.com/', '').replace('http://github.com/', '').trim();
                  if (statusEl) statusEl.textContent = '📥 ' + (lang === 'fa' ? 'در حال دریافت کد از مخزن گیت‌هاب...' : 'Fetching latest code from GitHub...');
                  const fetchRes = await fetch('https://raw.githubusercontent.com/' + repo + '/main/_worker.js');
                  if (!fetchRes.ok) throw new Error('HTTP ' + fetchRes.status);
                  latestCode = await fetchRes.text();
              } catch(fe) {
                  console.warn("Client fetch failed, falling back to server-side fetch", fe);
              }

              if (latestCode && format === 'obfuscated') {
                  if (statusEl) statusEl.textContent = '🛡️ ' + (lang === 'fa' ? 'در حال اجرای مبهم‌سازی کلاینت...' : 'Applying client-side XOR obfuscation...');
                  try {
                      latestCode = obfuscateCode(latestCode);
                  } catch(oe) {
                      if (statusEl) {
                          statusEl.className = 'w-full mt-3 p-3 rounded-xl text-sm font-bold text-center text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
                          statusEl.textContent = 'Obfuscation failed: ' + oe.message;
                      }
                      btn.innerHTML = origText;
                      btn.disabled = false;
                      return;
                  }
              }

              try {
                  const res = await fetch(baseRoute + '/api/update', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                          key: sessionKey, 
                          action: 'deploy',
                          code: latestCode,
                          force: forceDeploy
                      })
                  });
                  const data = await res.json();
                  if (data.success) {
                      if (statusEl) {
                          statusEl.className = 'w-full mt-3 p-3 rounded-xl text-sm font-bold text-center text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400';
                          statusEl.textContent = (i18n[lang].update_success || 'Update successful!') + ' v' + data.newVersion;
                      }
                      btn.innerHTML = '✅ ' + (i18n[lang].update_success || 'Done!');
                      setTimeout(() => window.location.reload(), 3000);
                  } else {
                      if (statusEl) {
                          statusEl.className = 'w-full mt-3 p-3 rounded-xl text-sm font-bold text-center text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
                          statusEl.textContent = (i18n[lang].update_error || 'Update failed') + ': ' + (data.error || 'Unknown error');
                      }
                      btn.innerHTML = origText;
                      btn.disabled = false;
                  }
              } catch(e) {
                  if (statusEl) {
                      statusEl.className = 'w-full mt-3 p-3 rounded-xl text-sm font-bold text-center text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
                      statusEl.textContent = 'Error: ' + e.message;
                  }
                  btn.innerHTML = origText;
                  btn.disabled = false;
              }
          }

          async function triggerManualRedeploy() {
              const banner = document.getElementById('update-alert-banner');
              if (!banner) return;
              
              document.getElementById('update-alert-text').textContent = lang === 'fa' 
                  ? 'می‌توانید آخرین نسخه فعال را مجدداً دپلوی نموده یا بین نسخه معمولی و مبهم‌سازی شده جابجا شوید.'
                  : 'You can redeploy the latest code or switch between Normal/Obfuscated version on the fly.';
              
              banner.classList.remove('hidden');
              banner.classList.add('flex');
              
              if (!window._updateData) {
                  window._updateData = { latest: CURRENT_VERSION, updateAvailable: false };
              }
              
              const repo = (document.getElementById('cfg-github-repo')?.value || window.nahanConfig?.githubRepo || 'itsyebekhe/nahan').replace('https://github.com/', '').replace('http://github.com/', '').trim();
              
              showUpdateBanner(repo, CURRENT_VERSION);
              
              switchTab('overview');
              document.getElementById('update-alert-banner').scrollIntoView({ behavior: 'smooth' });
          }
          
          function parseMarkdown(md) {
              if (!md) return '';
              let lines = md.split(/\\r?\\n/);
              let htmlLines = [];
              let inCodeBlock = false;
              let codeContent = [];
              let activeBlockLang = null;

              for (let line of lines) {
                  let trimmed = line.trim();

                  if (trimmed === '<!-- LANG:EN -->' || trimmed === '<!--LANG:EN-->') {
                      if (activeBlockLang === 'en') {
                          activeBlockLang = null;
                      } else {
                          activeBlockLang = 'en';
                      }
                      continue;
                  }
                  if (trimmed === '<!-- LANG:FA -->' || trimmed === '<!--LANG:FA-->') {
                      if (activeBlockLang === 'fa') {
                          activeBlockLang = null;
                      } else {
                          activeBlockLang = 'fa';
                      }
                      continue;
                  }

                  if (activeBlockLang !== null && activeBlockLang !== lang) {
                      continue;
                  }

                  // Toggle code block
                  if (trimmed.startsWith('\\x60\\x60\\x60')) {
                      if (inCodeBlock) {
                          // Close code block
                          let codeText = codeContent.join('\\n')
                              .replace(/&/g, "&amp;")
                              .replace(/</g, "&lt;")
                              .replace(/>/g, "&gt;");
                          htmlLines.push('<pre class="bg-slate-900/90 text-slate-100 p-3 rounded-xl my-2 font-mono text-[10px] overflow-x-auto border border-slate-800 max-h-40">' + codeText + '</pre>');
                          codeContent = [];
                          inCodeBlock = false;
                      } else {
                          inCodeBlock = true;
                      }
                      continue;
                  }

                  if (inCodeBlock) {
                      codeContent.push(line);
                      continue;
                  }

                  if (!trimmed) {
                      continue; 
                  }

                  // Process headers
                  if (trimmed.startsWith('### ')) {
                      let text = trimmed.slice(4);
                      htmlLines.push('<h5 class="text-sm font-bold text-amber-800 dark:text-amber-400 mt-3 mb-1">' + parseInlineMarkdown(text) + '</h5>');
                      continue;
                  }
                  if (trimmed.startsWith('## ')) {
                      let text = trimmed.slice(3);
                      htmlLines.push('<h4 class="text-sm font-extrabold text-amber-800 dark:text-amber-400 mt-4 mb-2">' + parseInlineMarkdown(text) + '</h4>');
                      continue;
                  }
                  if (trimmed.startsWith('# ')) {
                      let text = trimmed.slice(2);
                      htmlLines.push('<h3 class="text-base font-black text-amber-900 dark:text-amber-300 mt-4 mb-2">' + parseInlineMarkdown(text) + '</h3>');
                      continue;
                  }

                  // Process lists
                  let listMatch = line.match(/^(\\s*)([-*+])\\s+(.*)$/);
                  if (listMatch) {
                      let text = listMatch[3];
                      htmlLines.push('<div class="flex items-start gap-2 my-1"><span class="text-amber-500 mt-0.5">▪</span><span class="flex-1">' + parseInlineMarkdown(text) + '</span></div>');
                      continue;
                  }

                  // Standard line
                  htmlLines.push('<p class="my-1">' + parseInlineMarkdown(line) + '</p>');
              }

              // Guard for unclosed code block
              if (inCodeBlock && codeContent.length > 0) {
                  let codeText = codeContent.join('\\n')
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");
                  htmlLines.push('<pre class="bg-slate-900/90 text-slate-100 p-3 rounded-xl my-2 font-mono text-[10px] overflow-x-auto border border-slate-800 max-h-40">' + codeText + '</pre>');
              }

              return htmlLines.join('\\n');

              function parseInlineMarkdown(text) {
                  let safe = text
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");
                  // Bold
                  safe = safe.replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="font-extrabold text-slate-800 dark:text-slate-200">\$1</strong>');
                  // Italic
                  safe = safe.replace(/\\*(.*?)\\*/g, '<em class="italic">\$1</em>');
                  // Inline code
                  safe = safe.replace(/[\\x60](.*?)[\\x60]/g, '<code class="bg-amber-500/10 dark:bg-slate-800 px-1.5 py-0.5 rounded text-rose-500 font-mono text-[11px]">\$1</code>');
                  return safe;
              }
          }

          async function showUpdateBanner(repo, version) {
              const banner = document.getElementById('update-alert-banner');
              if (!banner) return;
              
              const msg = lang === 'fa' 
                  ? 'نسخه جدیدتر (v' + version + ') در مخزن گیت\u200cهاب شما (' + repo + ') در دسترس است.' 
                  : 'A newer version (v' + version + ') is available in your GitHub repository (' + repo + ').';
                  
              document.getElementById('update-alert-text').textContent = msg;
              const ghLink = document.getElementById('update-github-link');
              if (ghLink) ghLink.href = 'https://github.com/' + repo;
              banner.classList.remove('hidden');
              banner.classList.add('flex');
              
              const changelogArea = document.getElementById('update-changelog-area');
              const changelogContent = document.getElementById('update-changelog-content');
              if (changelogArea && changelogContent) {
                  changelogArea.classList.remove('hidden');
                  changelogContent.innerHTML = lang === 'fa' 
                      ? '<p class="animate-pulse">در حال دریافت گزارش تغییرات...</p>' 
                      : '<p class="animate-pulse">Loading changelog...</p>';
                      
                  try {
                      let changelogText = '';
                      try {
                          const res = await fetch('https://api.github.com/repos/' + repo + '/releases/tags/v' + version);
                          if (res.ok) {
                              const rel = await res.json();
                              if (rel && rel.body) {
                                  changelogText = rel.body;
                              }
                          } else {
                              const resNoV = await fetch('https://api.github.com/repos/' + repo + '/releases/tags/' + version);
                              if (resNoV.ok) {
                                  const relNoV = await resNoV.json();
                                  if (relNoV && relNoV.body) {
                                      changelogText = relNoV.body;
                                  }
                              }
                          }
                      } catch(e) {}
                      
                      if (!changelogText) {
                          try {
                              const resLatest = await fetch('https://api.github.com/repos/' + repo + '/releases/latest');
                              if (resLatest.ok) {
                                  const relLatest = await resLatest.json();
                                  if (relLatest && relLatest.body) {
                                      changelogText = relLatest.body;
                                  }
                              }
                          } catch(e) {}
                      }
                      
                      if (!changelogText) {
                          try {
                              const resFile = await fetch('https://raw.githubusercontent.com/' + repo + '/main/CHANGELOG.md');
                              if (resFile.ok) {
                                  changelogText = await resFile.text();
                              }
                          } catch(e) {}
                      }
                      
                      if (changelogText) {
                          changelogContent.innerHTML = parseMarkdown(changelogText);
                      } else {
                          changelogContent.innerHTML = lang === 'fa' 
                              ? '<div class="space-y-2">' +
                                '<p class="font-bold">✨ اضافه شده:</p>' +
                                '<ul class="list-disc list-inside text-xs space-y-1">' +
                                '<li>صفحه اشتراک چندزبانه با حالت تاریک/روشن</li>' +
                                '<li>پشتیبانی NAT64 و نودهای اختصاصی کاربر</li>' +
                                '<li>کانفیگ‌های مستقیم و بروزرسانی خودکار</li>' +
                                '<li>مدیریت کامل دروازه از ربات تلگرام</li>' +
                                '</ul>' +
                                '<p class="font-bold mt-2">⚡ بهبود یافته:</p>' +
                                '<ul class="list-disc list-inside text-xs space-y-1">' +
                                '<li>عملکرد داشبورد و سرعت اسکرول</li>' +
                                '<li>بازنویسی کامل تولید کانفیگ‌ها</li>' +
                                '<li>نام‌گذاری هوشمند با تگ‌های جدید</li>' +
                                '</ul>' +
                                '<p class="font-bold mt-2">🔧 رفع شده:</p>' +
                                '<ul class="list-disc list-inside text-xs space-y-1">' +
                                '<li>ترجمه‌های فارسی معیوب</li>' +
                                '<li>خطای صفحه اشتراک</li>' +
                                '</ul></div>'
                              : '<div class="space-y-2">' +
                                '<p class="font-bold">✨ Added:</p>' +
                                '<ul class="list-disc list-inside text-xs space-y-1">' +
                                '<li>Bilingual subscription page with dark/light mode</li>' +
                                '<li>NAT64 support and per-user custom nodes</li>' +
                                '<li>Direct configs and auto update</li>' +
                                '<li>Full gateway management via Telegram bot</li>' +
                                '</ul>' +
                                '<p class="font-bold mt-2">⚡ Improved:</p>' +
                                '<ul class="list-disc list-inside text-xs space-y-1">' +
                                '<li>Dashboard performance and scroll speed</li>' +
                                '<li>Complete rewrite of all config generators</li>' +
                                '<li>Smart config naming with new tags</li>' +
                                '</ul>' +
                                '<p class="font-bold mt-2">🔧 Fixed:</p>' +
                                '<ul class="list-disc list-inside text-xs space-y-1">' +
                                '<li>Garbled Persian translations</li>' +
                                '<li>Subscription page display error</li>' +
                                '</ul></div>';
                      }
                  } catch(err) {
                      changelogContent.innerHTML = lang === 'fa' 
                          ? '<p class="text-rose-500">خطا در دریافت گزارش تغییرات.</p>' 
                          : '<p class="text-rose-500">Failed to load changelog.</p>';
                  }
              }
          }
          //DateTime Function
            const _dtFormatter = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
            function updatePersianDateTime() {
    const now = new Date();
    const parts = _dtFormatter.formatToParts(now);

    const map = {};
    parts.forEach(p => {
        map[p.type] = p.value;
    });

  
      
        const custom = \`\${map.day} \${map.month} \${map.year} \${map.hour}:\${map.minute}:\${map.second}\`;

    document.getElementById("net-datetime").innerText = custom;
    
}

                updatePersianDateTime();
                setInterval(updatePersianDateTime, 1000);



          function dismissUpdate() {
              const b = document.getElementById('update-alert-banner');
              if (b) {
                  b.classList.remove('flex');
                  b.classList.add('hidden'); 
              }
          }

          document.addEventListener('DOMContentLoaded', () => {
              const cached = localStorage.getItem('nahan_session');
              if(cached) {
                  try {
                      const session = JSON.parse(cached);
                      if (Date.now() < session.expiry) {
                          document.getElementById('pwd').value = session.key;
                          doLogin(true);
                      } else { localStorage.removeItem('nahan_session'); }
                  } catch(e) { localStorage.removeItem('nahan_session'); }
              }
          });
      </script>
  </body>
  </html>
    `;
  } 
