// Runs the verification cases from the assignment against a RUNNING API.
// Restart the server first so credits are fresh:   npm run serve   then   npm test
const BASE = process.env.API_BASE || 'http://localhost:5000';
const KEYS = {
  guest: 'guest-key-111', student: 'student-key-123',
  teacher: 'teacher-key-456', admin: 'admin-key-789'
};

let passed = 0, failed = 0;

async function call(path, key) {
  const res = await fetch(BASE + path, { headers: key ? { 'x-api-key': key } : {} });
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  return { status: res.status, body };
}

function check(label, ok, detail = '') {
  ok ? passed++ : failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  -> ' + detail : ''}`);
}

console.log(`Testing ${BASE}\n`);

// 1. Unknown key
let r = await call('/api/customers?limit=10', 'wrong-key');
check('Unknown API key -> 401, no records', r.status === 401 && !r.body.data, `status ${r.status}`);

r = await call('/api/customers?limit=10');
check('Missing API key -> 401', r.status === 401, `status ${r.status}`);

// 2. Guest load
r = await call('/api/customers?limit=10', KEYS.guest);
check('Guest loads 10 -> 200, max 2 rows', r.status === 200 && r.body.data.length === 2, `rows ${r.body.data?.length}`);
check('Guest rows contain NAME only (no address key)',
  r.body.data.every((row) => Object.keys(row).join() === 'name'), JSON.stringify(r.body.data[0]));
check('Guest metadata correct', r.body.meta.role === 'guest' && r.body.meta.allowedRows === 2 && r.body.meta.remainingCredits === 3);

// 3. Guest search
r = await call('/api/customers/search?name=Ali', KEYS.guest);
check('Guest search -> 403', r.status === 403 && !r.body.data, `status ${r.status}`);
r = await call('/api/customers?limit=1', KEYS.guest);
check('Denied search did not spend a credit (3 left before, 2 after this load)', r.body.meta.remainingCredits === 2, `left ${r.body.meta.remainingCredits}`);

// 4. Student load
r = await call('/api/customers?limit=10', KEYS.student);
check('Student loads 10 -> 200, max 3 rows', r.status === 200 && r.body.data.length === 3, `rows ${r.body.data?.length}`);
check('Student rows have name + address', 'address' in r.body.data[0]);

// 5. Teacher load
r = await call('/api/customers?limit=10', KEYS.teacher);
check('Teacher loads 10 -> 200, 10 rows', r.status === 200 && r.body.data.length === 10, `rows ${r.body.data?.length}`);

// 6. Admin cap
r = await call('/api/customers?limit=50', KEYS.admin);
check('Admin loads 50 -> 200, capped at 20', r.status === 200 && r.body.data.length === 20, `rows ${r.body.data?.length}`);

// 7. Search (role maxRows, bound value)
r = await call('/api/customers/search?name=Ali', KEYS.student);
check('Student search "Ali" -> 200, at most 3 rows, all match', r.status === 200 && r.body.data.length <= 3 &&
  r.body.data.every((x) => /ali/i.test(x.name)), `rows ${r.body.data?.length}`);
r = await call('/api/customers/search?name=Ali', KEYS.teacher);
check('Teacher search "Ali" returns multiple matches', r.status === 200 && r.body.data.length >= 4, `rows ${r.body.data?.length}`);
r = await call('/api/customers/search?name=zzzz-no-match', KEYS.teacher);
check('Search with no match -> 200, empty array', r.status === 200 && r.body.data.length === 0);
r = await call("/api/customers/search?name=' OR '1'='1", KEYS.teacher);
check('SQL injection text is treated as plain text -> 0 rows', r.status === 200 && r.body.data.length === 0, `rows ${r.body.data?.length}`);
r = await call('/api/customers/search?name=%25', KEYS.teacher);
check('Literal "%" is escaped, not a wildcard -> 0 rows', r.status === 200 && r.body.data.length === 0, `rows ${r.body.data?.length}`);
r = await call('/api/customers/search?name=', KEYS.teacher);
check('Empty search -> 400', r.status === 400, `status ${r.status}`);

// 8. Usage endpoint
r = await call('/api/access/summary', KEYS.student);
check('Non-admin opens usage -> 403', r.status === 403 && !r.body.data, `status ${r.status}`);
r = await call('/api/access/summary');
check('Usage without key -> 401', r.status === 401);
r = await call('/api/access/summary', KEYS.admin);
const text = JSON.stringify(r.body);
check('Admin usage -> 200 with 4 roles', r.status === 200 && r.body.data.length === 4, `status ${r.status}`);
check('Usage response contains NO api keys', !/key-\d+/.test(text) && !/password|DB_/i.test(text));

// 9. Exhaust Student credits. Used so far: 2 (load, search). 8 total.
let last;
for (let i = 0; i < 6; i++) last = await call('/api/customers?limit=3', KEYS.student);
check('Student 8th request still succeeds', last.status === 200 && last.body.meta.remainingCredits === 0, `left ${last.body?.meta?.remainingCredits}`);
r = await call('/api/customers?limit=3', KEYS.student);
check('Student 9th request -> 429, no records', r.status === 429 && !r.body.data, `status ${r.status}`);
r = await call('/api/customers/search?name=Ali', KEYS.student);
check('Student search after credits end -> 429', r.status === 429);

// 10. Other roles unaffected
r = await call('/api/customers?limit=3', KEYS.teacher);
check('Teacher unaffected by Student exhaustion', r.status === 200);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);