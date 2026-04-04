const { spawn } = require('node:child_process');
const { URL } = require('node:url');

function asInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dbHost(connectionString) {
  if (!connectionString) return 'not-set';
  try {
    return new URL(connectionString).host;
  } catch {
    return 'invalid-url';
  }
}

function looksTransientDbError(output) {
  const text = String(output || '').toLowerCase();
  return (
    text.includes('p1001') ||
    text.includes('p1002') ||
    text.includes('can\'t reach database server') ||
    text.includes('could not connect to server') ||
    text.includes('connection refused') ||
    text.includes('econnrefused') ||
    text.includes('etimedout') ||
    text.includes('timeout')
  );
}

function run(command, args, options = {}) {
  const { stdio = 'inherit', captureOutput = false } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : stdio,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    if (captureOutput) {
      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        process.stdout.write(text);
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;
        process.stderr.write(text);
      });
    }

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        const err = new Error(`${command} ${args.join(' ')} exited with code ${code}`);
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      }
    });
  });
}

function pickDatabaseUrl() {
  const internal = process.env.DATABASE_URL_INTERNAL;
  const configured = process.env.DATABASE_URL;

  if (internal) {
    process.env.DATABASE_URL = internal;
    return { source: 'DATABASE_URL_INTERNAL', value: internal };
  }

  if (configured) {
    return { source: 'DATABASE_URL', value: configured };
  }

  return { source: 'missing', value: '' };
}

async function runMigrationsWithRetry() {
  const maxAttempts = asInt(process.env.DB_MIGRATE_MAX_ATTEMPTS, 15);
  const baseDelayMs = asInt(process.env.DB_MIGRATE_BASE_DELAY_MS, 2000);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    console.log(`[startup] Running prisma migrate deploy (attempt ${attempt}/${maxAttempts})`);
    try {
      await run('npx', ['prisma', 'migrate', 'deploy'], { captureOutput: true });
      console.log('[startup] Prisma migrations applied');
      return;
    } catch (error) {
      const combined = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`;
      const transient = looksTransientDbError(combined);
      const canRetry = transient && attempt < maxAttempts;

      if (!canRetry) {
        throw error;
      }

      const backoffMs = Math.min(baseDelayMs * Math.pow(2, attempt - 1), 30000);
      console.warn(`[startup] Database not reachable yet (transient error). Retrying in ${backoffMs}ms`);
      await sleep(backoffMs);
    }
  }
}

(async function main() {
  try {
    const picked = pickDatabaseUrl();
    console.log(`[startup] DATABASE_URL source: ${picked.source}`);
    console.log(`[startup] DATABASE_URL host: ${dbHost(picked.value)}`);

    if (!picked.value) {
      throw new Error('DATABASE_URL is not set. Configure Render env var with internalConnectionString.');
    }

    if (
      process.env.RENDER === 'true' &&
      picked.value.includes('.render.com') &&
      !picked.value.includes('.render.internal')
    ) {
      console.warn('[startup] Render detected with external DB host. Prefer Render internal DB URL to avoid P1001 timeouts.');
    }

    await run('npx', ['prisma', 'generate']);
    await runMigrationsWithRetry();

    if (process.env.RUN_DB_SEED_ON_START === 'true') {
      console.log('[startup] RUN_DB_SEED_ON_START=true, running seed');
      await run('npx', ['ts-node', 'prisma/seed.ts']);
    }

    console.log('[startup] Starting application');
    const server = spawn('node', ['dist/index.js'], {
      env: process.env,
      stdio: 'inherit',
      shell: false,
    });

    server.on('close', (code) => {
      process.exit(code || 0);
    });
  } catch (error) {
    console.error('[startup] Startup failed:', error && error.message ? error.message : error);
    process.exit(1);
  }
})();
