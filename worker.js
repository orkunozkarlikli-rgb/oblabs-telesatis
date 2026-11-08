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
    // Portal bu endpoint'i kullanarak son 24 saatte eklenen firmaları alır
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

    // 3. API: Leadleri Çek (sadece gerektiğinde - portal artık bunu çağırmıyor)
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

    // 4. API: Toplu Lead Ekle (Scraper İçin)
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

    // 5. Statik Portal Varlıklarını Sun
    return env.ASSETS.fetch(request);
  },

  // ---- GÜNLÜK CRON (Her gece 02:00 UTC = 05:00 TR) ----
  // Son 25 saatte eklenen yeni firmaları D1'den okur, KV'ye yazar
  // Portal sabah açıldığında KV'den yeni firmaları alır (D1'e dokunmaz)
  async scheduled(event, env, ctx) {
    try {
      // Son 25 saatte eklenen firmalar (biraz overlap ile güvenli)
      const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      const { results } = await env.oblabs_leads_db.prepare(
        'SELECT * FROM leads WHERE created_at > ? ORDER BY created_at DESC LIMIT 10000'
      ).bind(since).all();

      if (results && results.length > 0) {
        // KV'ye yaz - 24 saat TTL (otomatik silinir)
        await env.LEADS_KV.put('new_leads_cache', JSON.stringify(results), {
          expirationTtl: 86400
        });
        console.log(`Cron: ${results.length} yeni firma KV'ye yazıldı`);
      }
    } catch (err) {
      console.error('Cron error:', err.message);
    }
  }
};
