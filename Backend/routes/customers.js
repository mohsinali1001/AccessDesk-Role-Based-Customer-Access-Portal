import { Router } from 'express';
import pool from '../db.js';
import { DATABASE, FIELD_COLUMNS, TABLE, creditsLeft } from '../config/roles.js';
import { checkAccess } from '../middleware/checkAccess.js';

const router = Router();

function getColumns(profile) {
  return profile.fields.map((field) => {
    if (!Object.prototype.hasOwnProperty.call(FIELD_COLUMNS, field)) {
      throw new Error(`Unknown customer field configured for role "${profile.role}"`);
    }

    return `\`${FIELD_COLUMNS[field]}\``;
  }).join(', ');
}

router.get('/', checkAccess('load'), async (req, res) => {
  const rawLimit = req.query.limit;
  let requestedLimit = req.profile.maxRows;

  if (rawLimit !== undefined) {
    if (typeof rawLimit !== 'string' || !/^[1-9]\d*$/.test(rawLimit)) {
      return res.status(400).json({ message: 'Limit must be a positive integer' });
    }

    requestedLimit = Number(rawLimit);
    if (!Number.isSafeInteger(requestedLimit)) {
      return res.status(400).json({ message: 'Limit must be a positive integer' });
    }
  }

  const limit = Math.min(requestedLimit, req.profile.maxRows);
  const columns = getColumns(req.profile);
  const [data] = await pool.query(
    `SELECT ${columns} FROM \`${DATABASE}\`.\`${TABLE}\` LIMIT ?`,
    [limit]
  );

  res.json({
    meta: {
      role: req.profile.role,
      allowedRows: req.profile.maxRows,
      remainingCredits: creditsLeft[req.profile.role]
    },
    data
  });
});

router.get('/search', checkAccess('search'), async (req, res) => {
  const searchTerm = req.query.name;

  if (typeof searchTerm !== 'string' || searchTerm.trim() === '') {
    return res.status(400).json({ message: 'A non-empty name query is required' });
  }

  const columns = getColumns(req.profile);
  const escapedTerm = searchTerm.replace(/[!%_]/g, '!$&');
  const [data] = await pool.query(
    `SELECT ${columns} FROM \`${DATABASE}\`.\`${TABLE}\` ` +
      `WHERE \`${FIELD_COLUMNS.name}\` LIKE ? ESCAPE '!' LIMIT ?`,
    [`%${escapedTerm}%`, req.profile.maxRows]
  );

  res.json({
    meta: {
      role: req.profile.role,
      allowedRows: req.profile.maxRows,
      remainingCredits: creditsLeft[req.profile.role]
    },
    data
  });
});

export default router;