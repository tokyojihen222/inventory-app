const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');

if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local not found');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));

if (!dbUrlLine) {
    console.log('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
}

const url = dbUrlLine.split('=', 2)[1].trim().replace(/^['"]|['"]$/g, '');
const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\//);

if (!match) {
    console.log('❌ Invalid URL format');
    process.exit(1);
}

const [_, user, password, host, port] = match;

console.log(`Analyzing Connection String...`);
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`User: ${user}`);

let isPooler = host.includes('pooler.supabase.com');
let isDirect = host.includes('supabase.co');

if (isPooler) {
    console.log('Type: Transaction Pooler');
    if (port !== '6543') { // Pooler uses 6543 usually, but 5432 works too if pgbouncer is enabled on direct? No, pooler is 6543.
        console.log('⚠️ Warning: Pooler usually uses port 6543');
    }
    if (!user.includes('.')) {
        console.log('❌ ERROR: When using Transaction Pooler, username must be in format "postgres.projectref".');
        console.log('   Current username is just "postgres" (or simple string).');
        console.log('   Please revert username to "postgres.ldxdfwjxohwrzjbdhhej"');
    } else {
        console.log('✅ Username format looks correct for Pooler');
    }
} else if (isDirect) {
    console.log('Type: Direct Connection');
    if (user.includes('.')) {
        console.log('⚠️ Warning: Direct connection usually uses simple "postgres" username, but "postgres.projectref" might work too.');
    } else {
        console.log('✅ Username format looks correct for Direct Connection');
    }
} else {
    console.log('❓ Unknown Host Type');
}
