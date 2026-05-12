const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.test');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, value] = trimmed.split('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

// Mock Supabase to prevent connection timeouts in tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: 'ADMIN' }, error: null }),
        }),
      }),
    }),
  }),
}));
