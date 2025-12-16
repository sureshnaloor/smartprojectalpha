/**
 * Auth Health Check Script
 * 
 * This script performs health checks on the authentication system:
 * - Verifies the server is running
 * - Checks session cookie configuration
 * - Validates OAuth environment variables
 * - Tests auth endpoints
 * 
 * Usage:
 *   npx tsx scripts/auth-health-check.ts
 * 
 * Or set a custom base URL:
 *   BASE_URL=http://localhost:8080 npx tsx scripts/auth-health-check.ts
 */

import dotenv from 'dotenv';

// Load env from .env file
dotenv.config();

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: Record<string, any>;
}

const results: HealthCheckResult[] = [];

const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
const apiUrl = `${baseUrl}/api`;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkServerHealth() {
  try {
    const response = await fetch(`${apiUrl}/hello`);
    if (response.ok) {
      results.push({
        name: 'Server Health',
        status: 'pass',
        message: `✓ Server is running on ${baseUrl}`,
      });
    } else {
      results.push({
        name: 'Server Health',
        status: 'fail',
        message: `✗ Server returned ${response.status}`,
      });
    }
  } catch (error) {
    results.push({
      name: 'Server Health',
      status: 'fail',
      message: `✗ Cannot reach server at ${baseUrl}. Is it running?`,
      details: { error: String(error) },
    });
  }
}

function checkEnvironmentVariables() {
  const requiredVars = {
    'SESSION_SECRET': process.env.SESSION_SECRET,
    'BASE_URL': process.env.BASE_URL,
    'NODE_ENV': process.env.NODE_ENV,
  };

  const googleVars = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'GOOGLE_CALLBACK_URL': process.env.GOOGLE_CALLBACK_URL,
  };

  const linkedinVars = {
    'LINKEDIN_CLIENT_ID': process.env.LINKEDIN_CLIENT_ID,
    'LINKEDIN_CLIENT_SECRET': process.env.LINKEDIN_CLIENT_SECRET,
    'LINKEDIN_CALLBACK_URL': process.env.LINKEDIN_CALLBACK_URL,
  };

  // Check required vars
  const requiredMissing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (requiredMissing.length === 0) {
    results.push({
      name: 'Required Environment Variables',
      status: 'pass',
      message: '✓ All required env vars are set',
      details: requiredVars,
    });
  } else {
    results.push({
      name: 'Required Environment Variables',
      status: 'fail',
      message: `✗ Missing: ${requiredMissing.join(', ')}`,
      details: requiredVars,
    });
  }

  // Check Google OAuth
  const googleMissing = Object.entries(googleVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (googleMissing.length === 0) {
    results.push({
      name: 'Google OAuth Configuration',
      status: 'pass',
      message: '✓ Google OAuth is configured',
      details: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.slice(0, 20) + '...',
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
      },
    });
  } else {
    results.push({
      name: 'Google OAuth Configuration',
      status: 'warn',
      message: `⚠ Incomplete: Missing ${googleMissing.join(', ')}`,
    });
  }

  // Check LinkedIn OAuth
  const linkedinMissing = Object.entries(linkedinVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (linkedinMissing.length === 0) {
    results.push({
      name: 'LinkedIn OAuth Configuration',
      status: 'pass',
      message: '✓ LinkedIn OAuth is configured',
      details: {
        LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID?.slice(0, 20) + '...',
        LINKEDIN_CALLBACK_URL: process.env.LINKEDIN_CALLBACK_URL,
      },
    });
  } else {
    results.push({
      name: 'LinkedIn OAuth Configuration',
      status: 'warn',
      message: `⚠ Incomplete: Missing ${linkedinMissing.join(', ')}`,
    });
  }
}

function checkCookieConfiguration() {
  const isProd = process.env.NODE_ENV === 'production';
  const baseUrlValue = process.env.BASE_URL || '';
  const isHttps = baseUrlValue.startsWith('https');

  const cookieSecure = isProd && isHttps;
  const sameSite = cookieSecure ? 'none' : 'lax';

  results.push({
    name: 'Session Cookie Configuration',
    status: 'pass',
    message: '✓ Cookie configuration checked',
    details: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      BASE_URL: baseUrlValue || 'not set (defaults to http://localhost:8080)',
      'cookie.secure': cookieSecure,
      'cookie.sameSite': sameSite,
      'cookie.httpOnly': true,
      note: cookieSecure
        ? 'Cookies will be secure (HTTPS only)'
        : 'Cookies will work on HTTP (suitable for localhost development)',
    },
  });
}

async function checkAuthStatus() {
  try {
    const response = await fetch(`${apiUrl}/auth/status`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      results.push({
        name: 'Auth Status Endpoint',
        status: 'pass',
        message: '✓ Auth status endpoint is working',
        details: {
          authenticated: data.authenticated,
          user: data.user,
        },
      });
    } else {
      results.push({
        name: 'Auth Status Endpoint',
        status: 'fail',
        message: `✗ Auth status returned ${response.status}`,
      });
    }
  } catch (error) {
    results.push({
      name: 'Auth Status Endpoint',
      status: 'fail',
      message: '✗ Cannot reach auth status endpoint',
      details: { error: String(error) },
    });
  }
}

function checkCallbackUrls() {
  const expectedCallbacks = {
    google: `${baseUrl}/api/auth/google/callback`,
    linkedin: `${baseUrl}/api/auth/linkedin/callback`,
  };

  const configuredCallbacks = {
    google: process.env.GOOGLE_CALLBACK_URL,
    linkedin: process.env.LINKEDIN_CALLBACK_URL,
  };

  const mismatches: string[] = [];

  Object.entries(expectedCallbacks).forEach(([provider, expected]) => {
    const configured = configuredCallbacks[provider as keyof typeof configuredCallbacks];
    if (configured && configured !== expected) {
      mismatches.push(`${provider}: expected "${expected}", configured as "${configured}"`);
    }
  });

  if (mismatches.length === 0) {
    results.push({
      name: 'OAuth Callback URLs',
      status: 'pass',
      message: '✓ Callback URLs are correctly configured for BASE_URL',
      details: expectedCallbacks,
    });
  } else {
    results.push({
      name: 'OAuth Callback URLs',
      status: 'warn',
      message: '⚠ Callback URL mismatches found',
      details: {
        mismatches,
        configured: configuredCallbacks,
        expected: expectedCallbacks,
      },
    });
  }
}

async function runHealthChecks() {
  log('\n=== Auth Health Check ===\n', 'blue');
  log(`Base URL: ${baseUrl}\n`, 'blue');

  checkEnvironmentVariables();
  checkCookieConfiguration();
  checkCallbackUrls();
  await checkServerHealth();
  await checkAuthStatus();

  log('\n=== Results ===\n', 'blue');

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  results.forEach((result) => {
    const statusSymbol = {
      pass: '✓',
      fail: '✗',
      warn: '⚠',
    }[result.status];

    const color = {
      pass: 'green',
      fail: 'red',
      warn: 'yellow',
    }[result.status] as keyof typeof colors;

    log(`${statusSymbol} ${result.name}: ${result.message}`, color);

    if (result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        if (typeof value === 'object') {
          console.log(`    ${key}:`, JSON.stringify(value, null, 2).split('\n').join('\n    '));
        } else {
          console.log(`    ${key}: ${value}`);
        }
      });
    }

    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else if (result.status === 'warn') warnCount++;
  });

  log(`\n${passCount} passed, ${warnCount} warnings, ${failCount} failed\n`, 'blue');

  if (failCount > 0) {
    log('⚠ There are failures. Please check the items above.', 'red');
    process.exit(1);
  } else if (warnCount > 0) {
    log('ℹ There are warnings. Review them above if needed.', 'yellow');
  } else {
    log('✓ All checks passed! Auth system is healthy.', 'green');
  }
}

// Run health checks
runHealthChecks().catch((error) => {
  log(`\n✗ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
