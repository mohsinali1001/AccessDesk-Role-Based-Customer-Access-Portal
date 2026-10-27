import { Router } from 'express';
import { PROFILES, USAGE_COSTS_CREDIT, creditsLeft } from '../config/roles.js';
import { checkAccess } from '../middleware/checkAccess.js';

const router = Router();

router.get('/summary', checkAccess('usage'), (req, res) => {
  const profile = req.profile;

  if (!USAGE_COSTS_CREDIT) creditsLeft[profile.role] += 1;

  const roles = Object.values(PROFILES).map((roleProfile) => ({
    role: roleProfile.role,
    maxRows: roleProfile.maxRows,
    totalCredits: roleProfile.totalCredits,
    creditsUsed: roleProfile.totalCredits - creditsLeft[roleProfile.role],
    creditsLeft: creditsLeft[roleProfile.role]
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