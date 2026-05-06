const crypto = require('crypto');
const secret = '6299b14799e0ad7925be36b198dc26bfe8cdf8c932bc3fe0a53eaccaccc384e4c2e07cc78c6707836208262ec7a822657184743dda06862a20869b89d8481e22';

// Create JWT
const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({
    sub: 'da927f3b-bbd3-4e0f-a4cc-7131ef3b42cc', // Admin user id (doesn't matter for GET)
    email: 'shehankmusic@gmail.com',
    role: 'ADMIN',
    tenantId: 'shehan',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
})).toString('base64url');

const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
const token = `${header}.${payload}.${signature}`;

// Fetch from API
fetch('http://localhost:3000/api/tenant/users?page=1&limit=100', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-slug': 'shehan'
    }
})
    .then(res => res.json())
    .then(json => console.log(JSON.stringify(json, null, 2)))
    .catch(err => console.error(err));
