export default {
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

    // 1. API: Canlı İstatistikler & Son Güncelleme (Hızlı <5ms)
    if (url.pathname === '/api/stats' && request.method === 'GET') {
      try {
        const totalRow = await env.oblabs_leads_db.prepare('SELECT count(*) as total, max(created_at) as last_updated FROM leads').first();
        const pendingRow = await env.oblabs_leads_db.prepare("SELECT count(*) as count FROM leads WHERE status = 'Aranacak'").first();
        const proposalRow = await env.oblabs_leads_db.prepare("SELECT count(*) as count FROM leads WHERE status = 'Teklif Verildi'").first();
        const wonRow = await env.oblabs_leads_db.prepare("SELECT count(*) as count FROM leads WHERE status = 'Satış Yapıldı'").first();
        const callbackRow = await env.oblabs_leads_db.prepare("SELECT count(*) as count FROM leads WHERE status = 'Randevu Alındı'").first();

        return new Response(JSON.stringify({
          total: totalRow?.total || 0,
          pending: pendingRow?.count || 0,
          proposal: proposalRow?.count || 0,
          won: wonRow?.count || 0,
          callback: callbackRow?.count || 0,
          last_updated: totalRow?.last_updated || new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. API: Leadleri Çek (Incremental 'since' desteği & 100.000 limit)
    if (url.pathname === '/api/leads' && request.method === 'GET') {
      try {
        const since = url.searchParams.get('since');
        let stmt;

        if (since) {
          stmt = env.oblabs_leads_db.prepare(
            'SELECT * FROM leads WHERE created_at > ? ORDER BY created_at DESC LIMIT 5000'
          ).bind(since);
        } else {
          stmt = env.oblabs_leads_db.prepare(
            'SELECT * FROM leads ORDER BY created_at DESC LIMIT 100000'
          );
        }

        const { results } = await stmt.all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. API: Toplu veya Tekil Lead Ekle (Scraper İçin - Anlık Veritabanına Yazma)
    if (url.pathname === '/api/leads/batch' && request.method === 'POST') {
      try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];

        if (!items.length) {
          return new Response(JSON.stringify({ added: 0 }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const statements = items.map(l => {
          const id = l.id || `lead_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
          return env.oblabs_leads_db.prepare(`
            INSERT OR IGNORE INTO leads 
            (id, name, district, city, category, phone, rating, reviews_count, address, website, status, notes, maps_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id,
            l.name || '',
            l.district || '',
            l.city || '',
            l.category || '',
            l.phone || '',
            Number(l.rating) || 0,
            Number(l.reviews_count) || 0,
            l.address || '',
            l.website || '',
            l.status || 'Aranacak',
            l.notes || '',
            l.maps_url || ''
          );
        });

        // Batch execute
        const batchResults = await env.oblabs_leads_db.batch(statements);
        let totalChanges = 0;
        for (const r of batchResults) {
          totalChanges += (r.meta?.changes || 0);
        }

        return new Response(JSON.stringify({ success: true, added: totalChanges }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. Statik Portal Varlıklarını Sun (HTML, CSS, JS)
    return env.ASSETS.fetch(request);
  },
};
