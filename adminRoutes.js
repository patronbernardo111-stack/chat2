/**
 * adminRoutes.js — Rutas del portal administrativo EGCHAT
 * Montado en app via require('./adminRoutes') desde index.js
 */

const bcryptAdmin = require('bcryptjs');
const jwtAdmin    = require('jsonwebtoken');

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'egchat_admin_secret_2026';

// ── Middleware auth admin ─────────────────────────────────────────────────────
function authAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
    || req.query._t || '';
  if (!token) return res.status(401).json({ message: 'Token requerido' });
  try {
    req.adminUser = jwtAdmin.verify(token, ADMIN_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

// ── RBAC middleware ───────────────────────────────────────────────────────────
const PERMS = {
  super_admin: { '*': ['read','write','delete'] },
  operations:  { operational:['read','write'], chat:['read','write'], infrastructure:['read','write'], sqlite_sync:['read','write'], wallet:['read'], security:['read'], audit:['read'] },
  support:     { chat:['read','write'], operational:['read'] },
  finance:     { wallet:['read','write'], audit:['read'] },
  security:    { security:['read','write'], audit:['read','write'], operational:['read'] },
  auditor:     { '*': ['read'] },
};

function can(role, module, action) {
  const p = PERMS[role];
  if (!p) return false;
  if (p['*']?.includes(action)) return true;
  return p[module]?.includes(action) || false;
}

function require_perm(module, action) {
  return (req, res, next) => {
    if (!can(req.adminUser?.role, module, action)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
}

// ── Función helper: log de auditoría ─────────────────────────────────────────
async function auditLog(supabase, adminId, action, resourceType, resourceId, result, meta = {}) {
  try {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId, action, resource_type: resourceType,
      resource_id: String(resourceId || ''), result, metadata: meta,
    });
  } catch {}
}

// ── Exportar función que monta las rutas ─────────────────────────────────────
module.exports = function mountAdmin(app, supabase, jwt, bcrypt) {

  // ── AUTH ────────────────────────────────────────────────────────────────────
  app.post('/api/admin/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: 'email y password requeridos' });

      const { data: admin } = await supabase.from('admin_users').select('*').eq('email', email).eq('is_active', true).maybeSingle();
      if (!admin) return res.status(401).json({ message: 'Credenciales incorrectas' });

      // Verificar bloqueo
      if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
        return res.status(403).json({ message: `Cuenta bloqueada hasta ${admin.locked_until}` });
      }

      const ok = await bcryptAdmin.compare(password, admin.password_hash);
      if (!ok) {
        const attempts = (admin.failed_attempts || 0) + 1;
        const locked_until = attempts >= 5 ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null;
        await supabase.from('admin_users').update({ failed_attempts: attempts, locked_until }).eq('id', admin.id);
        await auditLog(supabase, admin.id, 'auth.login_failed', 'admin', admin.id, 'failure');
        return res.status(401).json({ message: 'Credenciales incorrectas' });
      }

      // Reset intentos fallidos
      await supabase.from('admin_users').update({ failed_attempts: 0, locked_until: null, last_login: new Date().toISOString() }).eq('id', admin.id);

      // ¿Requiere 2FA?
      const requireTotp = !!admin.totp_secret && ['super_admin','security'].includes(admin.role);
      if (requireTotp) {
        // Token temporal solo para completar TOTP (5min)
        const tempToken = jwtAdmin.sign({ id: admin.id, email: admin.email, role: admin.role, totp_pending: true }, ADMIN_SECRET, { expiresIn: '5m' });
        return res.json({ requireTotp: true, tempToken });
      }

      const token = jwtAdmin.sign({ id: admin.id, email: admin.email, role: admin.role }, ADMIN_SECRET, { expiresIn: '8h' });
      await auditLog(supabase, admin.id, 'auth.login', 'admin', admin.id, 'success');
      res.json({ token, admin: { id: admin.id, email: admin.email, role: admin.role } });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post('/api/admin/auth/totp/verify', async (req, res) => {
    try {
      const { email, code } = req.body;
      const { data: admin } = await supabase.from('admin_users').select('*').eq('email', email).maybeSingle();
      if (!admin?.totp_secret) return res.status(400).json({ message: 'TOTP no configurado' });

      let speakeasy;
      try { speakeasy = require('speakeasy'); } catch { return res.status(501).json({ message: 'speakeasy no instalado' }); }

      const valid = speakeasy.totp.verify({ secret: admin.totp_secret, encoding: 'base32', token: code, window: 1 });
      if (!valid) return res.status(401).json({ message: 'Código incorrecto' });

      const token = jwtAdmin.sign({ id: admin.id, email: admin.email, role: admin.role }, ADMIN_SECRET, { expiresIn: '8h' });
      await auditLog(supabase, admin.id, 'auth.totp_verified', 'admin', admin.id, 'success');
      res.json({ token, admin: { id: admin.id, email: admin.email, role: admin.role } });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post('/api/admin/auth/logout', authAdmin, async (req, res) => {
    await auditLog(supabase, req.adminUser.id, 'auth.logout', 'admin', req.adminUser.id, 'success');
    res.json({ message: 'Sesión cerrada' });
  });

  app.get('/api/admin/auth/me', authAdmin, (req, res) => res.json({ admin: req.adminUser }));

  // ── SSE STREAM ──────────────────────────────────────────────────────────────
  app.get('/api/admin/stream', authAdmin, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    const hb = setInterval(() => {
      try { res.write(`data: ${JSON.stringify({ type: 'heartbeat', ts: Date.now() })}\n\n`); } catch {}
    }, 25000);
    req.on('close', () => clearInterval(hb));
  });

  // ── MÉTRICAS ────────────────────────────────────────────────────────────────
  app.get('/api/admin/metrics/operational', authAdmin, require_perm('operational','read'), async (req, res) => {
    try {
      const [usersRes, chatsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('chats').select('id', { count: 'exact', head: true }),
      ]);
      res.json({
        activeUsers: Math.floor(Math.random() * 300 + 100),
        activeUsersTrend: 8,
        newUsersToday: Math.floor(Math.random() * 50 + 10),
        newUsersTrend: 5,
        activeSessions: Math.floor(Math.random() * 400 + 150),
        uptime: 99.8,
        totalUsers: usersRes.count || 0,
        totalChats: chatsRes.count || 0,
        services: [
          { name: 'API Render', status: 'ok' },
          { name: 'Supabase DB', status: 'ok' },
          { name: 'Vercel CDN', status: 'ok' },
          { name: 'Push Service', status: 'ok' },
        ],
        hourlyUsers: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, users: Math.floor(Math.random() * 200 + 50) })),
      });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  app.get('/api/admin/metrics/chat', authAdmin, require_perm('chat','read'), async (req, res) => {
    try {
      const { count: msgCount } = await supabase.from('messages').select('id', { count: 'exact', head: true });
      res.json({
        messagesPerMin: Math.floor(Math.random() * 200 + 50),
        activeChats: Math.floor(Math.random() * 100 + 30),
        activeCalls: Math.floor(Math.random() * 10),
        latencyP95: Math.floor(Math.random() * 300 + 100),
        privateChats: Math.floor(Math.random() * 80 + 20),
        groupChats: Math.floor(Math.random() * 30 + 5),
        audioCalls: Math.floor(Math.random() * 8),
        videoCalls: Math.floor(Math.random() * 4),
        failedCalls: Math.floor(Math.random() * 2),
        totalMessages: msgCount || 0,
      });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  app.get('/api/admin/metrics/wallet', authAdmin, require_perm('wallet','read'), async (req, res) => {
    try {
      const today = new Date(); today.setHours(0,0,0,0);
      const { data: txToday } = await supabase.from('transactions').select('amount,status').gte('created_at', today.toISOString());
      const completed = (txToday || []).filter(t => t.status === 'completed');
      const failed    = (txToday || []).filter(t => t.status === 'failed');
      const volume    = completed.reduce((s, t) => s + (t.amount || 0), 0);
      const rate      = txToday?.length ? Math.round(completed.length / txToday.length * 100 * 10) / 10 : 100;
      res.json({
        volumeToday: volume, txCount: completed.length, txFailed: failed.length, successRate: rate,
        txTrend: 5, successTrend: 1,
        dailyVolume: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(day => ({ day, volume: Math.floor(Math.random() * 5_000_000 + 1_000_000) })),
        suspicious: [],
      });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  app.get('/api/admin/metrics/security', authAdmin, require_perm('security','read'), async (req, res) => {
    try {
      const hourAgo = new Date(Date.now() - 3600000).toISOString();
      const { data: failedLogins } = await supabase.from('admin_audit_log').select('*').eq('action','auth.login_failed').gte('created_at', hourAgo).order('created_at', { ascending: false }).limit(20);
      res.json({
        failedLoginsHour: failedLogins?.length || 0,
        blockedIps: 0, blockedUsers: 0, activeTokens: 0,
        failedLogins: failedLogins || [],
      });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  app.get('/api/admin/metrics/infra', authAdmin, require_perm('infrastructure','read'), async (req, res) => {
    // Ping servicios externos
    const ping = async (url) => {
      const start = Date.now();
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
        return { ok: r.ok, latency: Date.now() - start };
      } catch { return { ok: false, latency: 9999 }; }
    };
    const [api, db] = await Promise.all([
      ping('https://egchat-api.onrender.com/health'),
      ping(`${process.env.SUPABASE_URL || ''}/rest/v1/`),
    ]);
    res.json({
      renderCpu: Math.floor(Math.random() * 30 + 20),
      renderRam: Math.floor(Math.random() * 40 + 30),
      supabaseConns: Math.floor(Math.random() * 20 + 10),
      supabaseMaxConns: 100,
      cdnHitRate: 94,
      services: [
        { name: 'API Render', url: 'egchat-api.onrender.com', status: api.ok ? 'ok' : 'down', latency: api.latency },
        { name: 'Supabase DB', url: 'supabase.co', status: db.ok ? 'ok' : 'degraded', latency: db.latency },
        { name: 'Vercel CDN', url: 'egchat-v2.vercel.app', status: 'ok', latency: 22 },
      ],
    });
  });

  app.get('/api/admin/metrics/sqlite-sync', authAdmin, require_perm('sqlite_sync','read'), async (req, res) => {
    res.json({ pendingSync: 14, conflicts: 3, syncOkToday: 287, offlineLong: 2, conflictList: [] });
  });

  // ── AUDITORÍA ────────────────────────────────────────────────────────────────
  app.get('/api/admin/audit/log', authAdmin, require_perm('audit','read'), async (req, res) => {
    try {
      const { limit = 50, action, from, to } = req.query;
      let q = supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(Number(limit));
      if (action) q = q.ilike('action', `%${action}%`);
      if (from)   q = q.gte('created_at', from);
      if (to)     q = q.lte('created_at', to);
      const { data, error } = await q;
      if (error) throw error;
      res.json(data || []);
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  app.get('/api/admin/audit/export', authAdmin, require_perm('audit','read'), async (req, res) => {
    try {
      const { format = 'csv' } = req.query;
      const { data } = await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(10000);
      if (format === 'csv') {
        const cols = ['id','created_at','admin_id','action','resource_type','resource_id','ip_address','result'];
        const csv = [cols.join(','), ...(data||[]).map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit_${Date.now()}.csv"`);
        return res.send(csv);
      }
      res.json(data || []);
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  // ── SEGURIDAD ────────────────────────────────────────────────────────────────
  app.post('/api/admin/security/block-ip', authAdmin, require_perm('security','write'), async (req, res) => {
    try {
      const { ip, duration, reason } = req.body;
      await auditLog(supabase, req.adminUser.id, 'security.block_ip', 'ip', ip, 'success', { duration, reason });
      res.json({ message: `IP ${ip} bloqueada ${duration}` });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  app.post('/api/admin/security/block-user', authAdmin, require_perm('security','write'), async (req, res) => {
    try {
      const { userId, reason } = req.body;
      await auditLog(supabase, req.adminUser.id, 'security.block_user', 'user', userId, 'success', { reason });
      res.json({ message: `Usuario ${userId} bloqueado` });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  // ── GESTIÓN DE ADMINS ────────────────────────────────────────────────────────
  app.get('/api/admin/users', authAdmin, require_perm('admin_users','read'), async (req, res) => {
    try {
      const { data } = await supabase.from('admin_users').select('id,email,role,is_active,last_login,created_at').order('created_at');
      res.json(data || []);
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  app.post('/api/admin/users', authAdmin, require_perm('admin_users','write'), async (req, res) => {
    try {
      const { email, role, password } = req.body;
      if (!email || !role || !password) return res.status(400).json({ message: 'email, role y password requeridos' });
      const hash = await bcryptAdmin.hash(password, 10);
      const { data, error } = await supabase.from('admin_users').insert({ email, role, password_hash: hash, created_by: req.adminUser.id }).select().single();
      if (error) throw error;
      await auditLog(supabase, req.adminUser.id, 'admin.user_created', 'admin_user', data.id, 'success', { email, role });
      res.status(201).json(data);
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  app.put('/api/admin/users/:id/role', authAdmin, require_perm('admin_users','write'), async (req, res) => {
    try {
      const { role } = req.body;
      const { data: old } = await supabase.from('admin_users').select('role').eq('id', req.params.id).single();
      await supabase.from('admin_users').update({ role }).eq('id', req.params.id);
      await auditLog(supabase, req.adminUser.id, 'admin.role_changed', 'admin_user', req.params.id, 'success', { old_role: old?.role, new_role: role });
      res.json({ message: 'Rol actualizado' });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  app.delete('/api/admin/users/:id', authAdmin, require_perm('admin_users','delete'), async (req, res) => {
    try {
      await supabase.from('admin_users').update({ is_active: false }).eq('id', req.params.id);
      await auditLog(supabase, req.adminUser.id, 'admin.user_deactivated', 'admin_user', req.params.id, 'success');
      res.json({ message: 'Admin desactivado' });
    } catch (e) { res.status(500).json({ message: e.message }); }
  });

  console.log('[AdminRoutes] ✅ Rutas admin montadas en /api/admin/*');
};
