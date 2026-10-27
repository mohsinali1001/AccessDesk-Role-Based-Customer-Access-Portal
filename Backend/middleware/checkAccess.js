import { PROFILES, creditsLeft } from '../config/roles.js';

export function checkAccess(action) {
  return (req, res, next) => {
    const apiKey = req.get('x-api-key');

    if (!apiKey) {
      return res.status(401).json({ message: 'API key required' });
    }

    if (!Object.prototype.hasOwnProperty.call(PROFILES, apiKey)) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    const profile = PROFILES[apiKey];

    if (!profile.actions.includes(action)) {
      return res.status(403).json({ message: 'Action not allowed for this role' });
    }

    if (creditsLeft[profile.role] <= 0) {
      return res.status(429).json({ message: 'Request credits exhausted' });
    }

    creditsLeft[profile.role] -= 1;
    req.profile = profile;
    next();
  };
}