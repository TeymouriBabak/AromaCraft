import express from 'express';

const app = express();
app.use(express.json());

let store = [];

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mock-SMS</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="navbar">
    <strong class="brand">Mock-SMS</strong>
    <input id="search" class="search" type="search" placeholder="Search messages" aria-label="Search messages">
    <button id="delete-all" class="action" type="button">Delete all</button>
    <span id="counter" class="counter" aria-label="Unread and total messages">0 / 0</span>
  </header>
  <main class="shell">
    <aside class="sidebar">
      <div class="nav-item selected">Inbox <span id="inbox-count">0</span></div>
    </aside>
    <section class="list-panel" aria-label="SMS inbox">
      <div id="messages" class="messages"><p class="empty">No messages</p></div>
    </section>
    <section id="detail" class="detail" aria-label="Message details">
      <p class="empty">Select a message</p>
    </section>
  </main>
  <script>
    let messages = [];
    let selectedId = null;
    const relative = date => {
      const seconds = Math.max(0, (Date.now() - new Date(date)) / 1000);
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
      if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
      return Math.floor(seconds / 86400) + ' days ago';
    };
    const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    async function load() {
      const response = await fetch('/api/v1/messages');
      messages = (await response.json()).messages;
      render();
    }
    function render() {
      const query = document.getElementById('search').value.toLowerCase();
      const visible = messages.filter(message => [message.to, message.from, message.body].join(' ').toLowerCase().includes(query));
      const unread = messages.filter(message => !message.read).length;
      document.getElementById('counter').textContent = unread + ' / ' + messages.length;
      document.getElementById('inbox-count').textContent = messages.length;
      document.getElementById('messages').innerHTML = visible.length ? visible.map(message => '<button class="message-row ' + (!message.read ? 'unread ' : '') + (message.id === selectedId ? 'active' : '') + '" data-id="' + escapeHtml(message.id) + '" type="button"><span><strong>' + escapeHtml(message.to) + '</strong><small>' + escapeHtml(message.from || 'SMS') + ' · ' + escapeHtml(message.body) + '</small></span><time>' + relative(message.createdAt) + '</time></button>').join('') : '<p class="empty">No messages</p>';
      document.querySelectorAll('.message-row').forEach(row => row.addEventListener('click', () => select(row.dataset.id)));
      if (selectedId) showDetail(messages.find(message => message.id === selectedId));
    }
    async function select(id) {
      await fetch('/api/v1/message/' + encodeURIComponent(id), { method: 'GET' });
      selectedId = id;
      await load();
      showDetail(messages.find(message => message.id === id));
    }
    function showDetail(message) {
      if (!message) return;
      document.getElementById('detail').innerHTML = '<div class="detail-header"><h2>SMS message</h2><button id="delete-one" class="action" type="button">Delete</button></div><dl><dt>To</dt><dd>' + escapeHtml(message.to) + '</dd><dt>From</dt><dd>' + escapeHtml(message.from || 'Unknown') + '</dd><dt>Date</dt><dd>' + escapeHtml(new Date(message.createdAt).toLocaleString()) + '</dd></dl><pre>' + escapeHtml(message.body) + '</pre>';
      document.getElementById('delete-one').addEventListener('click', async () => { await fetch('/api/v1/message/' + encodeURIComponent(message.id), { method: 'DELETE' }); selectedId = null; await load(); document.getElementById('detail').innerHTML = '<p class="empty">Select a message</p>'; });
    }
    document.getElementById('search').addEventListener('input', render);
    document.getElementById('delete-all').addEventListener('click', async () => { await fetch('/api/v1/messages', { method: 'DELETE' }); selectedId = null; await load(); document.getElementById('detail').innerHTML = '<p class="empty">Select a message</p>'; });
    load(); setInterval(load, 2000);
  </script>
</body>
</html>`;

app.get('/', (req, res) => res.type('html').send(page));

app.get('/styles.css', (req, res) => res.type('css').send(`
:root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #343a40; background: #f5f6f8; }
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; }
.navbar { height: 56px; display: flex; align-items: center; gap: 18px; padding: 0 22px; color: #fff; background: #343a40; }
.brand { font-size: 18px; letter-spacing: .1px; }
.search { width: min(420px, 45vw); margin-left: 18px; padding: 8px 12px; border: 1px solid #6c757d; border-radius: 4px; color: #343a40; background: #fff; }
.action { padding: 7px 12px; border: 1px solid #ced4da; border-radius: 4px; color: #495057; background: #fff; cursor: pointer; }
.navbar .action { margin-left: auto; color: #fff; border-color: #6c757d; background: transparent; }
.counter { padding: 4px 8px; border-radius: 12px; font-size: 12px; background: #0d6efd; }
.shell { display: grid; grid-template-columns: 190px minmax(300px, 1fr) minmax(320px, 1.1fr); min-height: calc(100vh - 56px); }
.sidebar { padding: 18px 12px; border-right: 1px solid #dee2e6; background: #eef0f3; }
.nav-item { display: flex; justify-content: space-between; padding: 10px 12px; border-radius: 4px; }
.nav-item.selected { color: #0d6efd; background: #dbeafe; font-weight: 600; }
.list-panel, .detail { background: #fff; }
.list-panel { border-right: 1px solid #dee2e6; }
.messages { display: flex; flex-direction: column; }
.message-row { display: flex; justify-content: space-between; gap: 15px; width: 100%; padding: 14px 16px; border: 0; border-bottom: 1px solid #e9ecef; border-left: 3px solid transparent; color: #495057; background: #fff; text-align: left; cursor: pointer; }
.message-row:hover, .message-row.active { background: #f0f6ff; }
.message-row.unread { border-left-color: #0d6efd; font-weight: 600; }
.message-row span { min-width: 0; }
.message-row strong, .message-row small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.message-row small { margin-top: 4px; color: #6c757d; font-weight: 400; }
.message-row time { flex: 0 0 auto; color: #6c757d; font-size: 12px; }
.empty { margin: auto; padding: 32px; color: #6c757d; text-align: center; }
.detail { padding: 22px; }
.detail-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dee2e6; }
h2 { margin: 0 0 18px; font-size: 20px; font-weight: 500; }
dl { display: grid; grid-template-columns: 70px 1fr; gap: 10px 15px; margin: 22px 0; }
dt { color: #6c757d; font-weight: 600; } dd { margin: 0; overflow-wrap: anywhere; }
pre { min-height: 120px; margin: 0; padding: 18px; overflow: auto; border: 1px solid #dee2e6; border-radius: 4px; white-space: pre-wrap; font: 14px/1.6 ui-monospace, SFMono-Regular, Consolas, monospace; background: #f8f9fa; }
button:focus-visible, input:focus-visible { outline: 3px solid rgba(13,110,253,.35); outline-offset: 2px; }
@media (max-width: 800px) { .shell { grid-template-columns: 1fr; } .sidebar { border-right: 0; border-bottom: 1px solid #dee2e6; } .detail { border-top: 1px solid #dee2e6; } .navbar { gap: 8px; padding: 0 10px; } .search { margin-left: 4px; width: 40vw; } }
`));

app.post('/send', (req, res) => {
  const { to, body, from } = req.body ?? {};
  if (!to || !body)
    return res.status(400).json({ ok: false, error: 'missing to or body' });
  const createdAt = new Date().toISOString();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    to: String(to),
    from: from ? String(from) : '',
    body: String(body),
    createdAt,
    ts: createdAt,
    read: false,
  };
  store.unshift(entry);
  if (store.length > 200) store = store.slice(0, 200);
  return res.json({ ok: true });
});

app.post('/sms', (req, res) => {
  const { to, body, from } = req.body ?? {};
  if (!to || !body)
    return res.status(400).json({ ok: false, error: 'missing to or body' });
  const createdAt = new Date().toISOString();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    to: String(to),
    from: from ? String(from) : '',
    body: String(body),
    createdAt,
    ts: createdAt,
    read: false,
  };
  store.unshift(entry);
  if (store.length > 200) store = store.slice(0, 200);
  return res.json({ ok: true });
});

app.get('/messages', (req, res) => {
  res.json(store);
});

app.get('/api/v1/messages', (req, res) => {
  res.json({ messages: store, total: store.length });
});

app.get('/api/v1/message/:id', (req, res) => {
  const message = store.find(entry => entry.id === req.params.id);
  if (!message) return res.status(404).json({ error: 'message not found' });
  message.read = true;
  return res.json(message);
});

app.delete('/api/v1/messages', (req, res) => {
  store = [];
  return res.json({ ok: true });
});

app.delete('/api/v1/message/:id', (req, res) => {
  const originalLength = store.length;
  store = store.filter(entry => entry.id !== req.params.id);
  if (store.length === originalLength) return res.status(404).json({ error: 'message not found' });
  return res.json({ ok: true });
});

app.delete('/messages', (req, res) => {
  store = [];
  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
const ports = [Number(PORT), Number(PORT) === 3001 ? 3000 : 3001];
ports.forEach(port => app.listen(port, () => console.log(`sms-mock listening on ${port}`)));
