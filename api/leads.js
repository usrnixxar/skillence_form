'use strict';

const { randomUUID } = require('node:crypto');
const COURSES = new Set(['ADCA+ with AI', 'Tally with GST', 'Video Editing', 'CSC Advance']);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return res.status(415).json({ success: false, error: 'JSON required.' });
  }
  // Reject browser requests from unrelated sites; no permissive CORS headers.
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) throw new Error();
    } catch {
      return res.status(403).json({ success: false, error: 'Origin not allowed.' });
    }
  }
  let body;
  try {
    if (Number(req.headers['content-length'] || 0) > 12000) throw new Error();
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || Array.isArray(body) || JSON.stringify(body).length > 12000) throw new Error();
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid request.' });
  }
  const fields = { name: 120, phone: 10, email: 254, course: 80, message: 2000 };
  const lead = {};
  for (const [key, max] of Object.entries(fields)) {
    const value = body[key] === undefined ? '' : body[key];
    if (typeof value !== 'string' || value.trim().length > max) {
      return res.status(400).json({ success: false, error: 'Invalid form details.' });
    }
    lead[key] = value.trim();
  }
  if (lead.name.length < 2 || !/^\d{10}$/.test(lead.phone) || !COURSES.has(lead.course) ||
      (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))) {
    return res.status(400).json({ success: false, error: 'Please check your form details.' });
  }
  const id = body.submissionId || randomUUID();
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(id)) {
    return res.status(400).json({ success: false, error: 'Invalid submission ID.' });
  }
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_SECRET;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url) || !secret || secret.length < 32) {
    return res.status(503).json({ success: false, error: 'Admissions storage is not configured yet. Please use WhatsApp.' });
  }
  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ ...lead, submissionId: id, secret, source: 'Skillence Form Website' })
    });
    const result = await upstream.json();
    if (!upstream.ok || result.success !== true || result.submissionId !== id) throw new Error();
    return res.status(200).json({ success: true, submissionId: id });
  } catch {
    // Do not log contact details, the webhook URL, or the shared secret.
    return res.status(502).json({ success: false, error: 'Could not confirm storage. Please retry or use WhatsApp.' });
  }
};
