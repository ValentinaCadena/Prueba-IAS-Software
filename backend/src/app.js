import express from 'express';
import cors from 'cors';
import { createDispatchService } from './domain/dispatchService.js';
import { createAuth } from './http/auth.js';

export function createApp(options = {}) {
  const username = options.username ?? process.env.TEST_USERNAME ?? 'candidate';
  const password = options.password ?? process.env.TEST_PASSWORD ?? 'candidate-local-only';
  const service = options.service ?? createDispatchService();
  const auth = createAuth({ username, password });

  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: [/^http:\/\/localhost(:\d+)?$/] }));
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'UP' }));

  app.post('/api/session', (req, res) => {
    const token = auth.login(req.body);
    if (!token) return res.status(401).json({ error: 'invalid_credentials' });
    return res.json({ accessToken: token });
  });

  app.get('/api/availability', (req, res) => {
    const centerId = String(req.query.centerId ?? '');
    const partCode = String(req.query.partCode ?? '');
    if (!centerId || !partCode) return res.status(400).json({ error: 'centerId and partCode are required' });
    return res.json(service.availability(centerId, partCode));
  });

  app.post('/api/dispatch-requests', auth.middleware, (req, res) => {
    const outcome = service.create(req.body);
    if (outcome.kind === 'validation_error') return res.status(400).json({ error: 'invalid_request', details: outcome.errors });
    return res.status(201).json(outcome.result);
  });

  app.get('/api/dispatch-requests', auth.middleware, (_req, res) => {
    return res.json({ items: service.recent(10) });
  });

  app.get('/api/dispatch-requests/:requestReference', auth.middleware, (req, res) => {
    const result = service.get(req.params.requestReference);
    if (!result) return res.status(404).json({ error: 'dispatch_request_not_found' });
    return res.json(result);
  });

  app.use((err, _req, res, _next) => {
    console.error('Unhandled request error', err);
    if (err instanceof SyntaxError && 'body' in err) return res.status(400).json({ error: 'invalid_json' });
    return res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
