// Single entry point for every /api/* route. vercel.json routes all API traffic
// here so there is one implementation (server/index.js) rather than several
// partial handlers that each opened their own database connection.
import app from '../server/index.js';

export default app;
