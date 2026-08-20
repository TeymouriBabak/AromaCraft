import express from 'express';

const app = express();
app.use(express.json());

let store = [];

app.post('/send', (req, res) => {
  const { to, body } = req.body ?? {};
  if (!to || !body) return res.status(400).json({ ok: false, error: 'missing to or body' });
  const entry = { to: String(to), body: String(body), ts: new Date().toISOString() };
  store.unshift(entry);
  if (store.length > 200) store = store.slice(0, 200);
  return res.json({ ok: true });
});

app.get('/messages', (req, res) => {
  res.json(store);
});

app.delete('/messages', (req, res) => {
  store = [];
  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`sms-mock listening on ${PORT}`));
