import { Router } from 'express';
import { PROFILES, USAGE_COSTS_CREDIT, creditsLeft } from '../config/roles.js';
import { checkAccess } from '../middleware/checkAccess.js';

const router = Router();

// GET /api/access/summary  -> Admin only.
// Only role names and numbers are returned. API keys and DB settings are never included.
router.get('/summary', checkAccess('usage'), (req, res) => {
  const profile = req.profile;

  // Credit was already spent by checkAccess; give it back if usage checks are free.
  if (!USAGE_COSTS_CREDIT) creditsLeft[profile.role] += 1;

  const roles = Object.values(PROFILES).map((p) => ({
    role: p.role,
    maxRows: p.maxRows,
    totalCredits: p.totalCredits,
    creditsUsed: p.totalCredits - creditsLeft[p.role],
    creditsLeft: creditsLeft[p.role]
  }));

  res.json({
    meta: {
      role: profile.role,
      allowedRows: profile.maxRows,
      remainingCredits: creditsLeft[profile.role]
    },
    data: roles
  });
});

export default router;