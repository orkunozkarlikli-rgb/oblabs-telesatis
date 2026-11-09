export default {
  // ---- HTTP İSTEKLERİ ----
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. API: Hızlı İstatistik (tek sorgu, D1 limitini minimal kullanır)
    if (url.pathname === '/api/stats' && request.method === 'GET') {
      try {
        const row = await env.oblabs_leads_db.prepare(
          'SELECT count(*) as total, max(created_at) as last_updated FROM leads'
        ).first();

        return new Response(JSON.stringify({
          total: row?.total || 0,
          last_updated: row?.last_updated || new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message, total: 0 }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. API: Yeni Firmalar (KV'den - sınırsız okuma, D1'e dokunmaz)
    if (url.pathname === '/api/new-leads' && request.method === 'GET') {
      try {
        const cached = await env.LEADS_KV.get('new_leads_cache', { type: 'json' });
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-From-Cache': 'true' },
          });
        }
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. API: Aktivite Kalp Atışı (Çalışan süresi ve arama tıklamaları)
    if (url.pathname === '/api/activity/heartbeat' && request.method === 'POST') {
      try {
        const body = await request.json();
        const username = (body.username || 'unknown').toLowerCase();
        
        const liveData = {
          username,
          lastSeen: new Date().toISOString(),
          todayOnlineSec: Number(body.todayOnlineSec) || 0,
          todayCallClicks: Number(body.todayCallClicks) || 0,
          todayOutcomes: body.todayOutcomes || {},
          lastAction: body.lastAction || 'Çalışıyor'
        };

        await env.LEADS_KV.put(`rep_live_${username}`, JSON.stringify(liveData), { expirationTtl: 86400 });

        let repList = await env.LEADS_KV.get('known_reps', { type: 'json' }) || [];
        if (!repList.includes(username)) {
          repList.push(username);
          await env.LEADS_KV.put('known_reps', JSON.stringify(repList));
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch(err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 4. API: Aktivite Logu Ekle (Arama tıklandı, sonuç girildi vb.)
    if (url.pathname === '/api/activity/log' && request.method === 'POST') {
      try {
        const body = await request.json();
        const logEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          username: (body.username || 'unknown').toLowerCase(),
          type: body.type || 'action',
          firmName: body.firmName || '',
          firmPhone: body.firmPhone || '',
          outcome: body.outcome || '',
          notes: body.notes || '',
          timestamp: new Date().toISOString()
        };

        const today = new Date().toISOString().slice(0, 10);
        let logs = await env.LEADS_KV.get(`activity_logs_${today}`, { type: 'json' }) || [];
        logs.unshift(logEntry);
        if (logs.length > 500) logs = logs.slice(0, 500);
        await env.LEADS_KV.put(`activity_logs_${today}`, JSON.stringify(logs), { expirationTtl: 86400 * 7 });

        return new Response(JSON.stringify({ success: true, entry: logEntry }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch(err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 5. API: Aktivite Özeti & Loglar (Kamufle Yönetim Paneli İçin)
    if (url.pathname === '/api/activity/summary' && request.method === 'GET') {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const repList = await env.LEADS_KV.get('known_reps', { type: 'json' }) || ['mete', 'nazlie', 'oblabs-admin'];

        const reps = [];
        const now = Date.now();

        for (const u of repList) {
          const data = await env.LEADS_KV.get(`rep_live_${u}`, { type: 'json' });
          if (data) {
            const lastSeenMs = new Date(data.lastSeen).getTime();
            data.isOnline = (now - lastSeenMs) < 90000; // son 90 saniye içinde aktif mi
            reps.push(data);
          } else {
            reps.push({
              username: u,
              isOnline: false,
              todayOnlineSec: 0,
              todayCallClicks: 0,
              todayOutcomes: {},
              lastSeen: null
            });
          }
        }

        const logs = await env.LEADS_KV.get(`activity_logs_${today}`, { type: 'json' }) || [];

        return new Response(JSON.stringify({ date: today, reps, logs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch(err) {
        return new Response(JSON.stringify({ error: err.message, reps: [], logs: [] }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 6. Statik Portal Varlıklarını Sun (HTML ve JSON dosyaları)
    const assetRes = await env.ASSETS.fetch(request);
    if (url.pathname.includes('/leads_') && url.pathname.endsWith('.json')) {
      const newHeaders = new Headers(assetRes.headers);
      newHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
      return new Response(assetRes.body, {
        status: assetRes.status,
        statusText: assetRes.statusText,
        headers: newHeaders
      });
    }
    return assetRes;
  },

  // ---- GÜNLÜK CRON ----
  async scheduled(event, env, ctx) {
    try {
      const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      const { results } = await env.oblabs_leads_db.prepare(
        'SELECT * FROM leads WHERE created_at > ? ORDER BY created_at DESC LIMIT 10000'
      ).bind(since).all();

      if (results && results.length > 0) {
        await env.LEADS_KV.put('new_leads_cache', JSON.stringify(results), { expirationTtl: 86400 });
      }
    } catch (err) {
      console.error('Cron error:', err.message);
    }
  }
};
