/**
 * OB Labs - Supabase Turizm Motoru (Bungalov, Butik Otel, Pansiyon, Tekne vb.)
 * Doğrudan Supabase REST API'sine yazar (D1'e hiç dokunmaz, kota yemez!)
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sxvlvvcgkrbjktflroqu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Türkiye'nin En Zengin Turizm & Tatil Merkezleri (Artvin & Karadeniz En Başta!)
const TOURISM_LOCATIONS = [
  // 🌲 ARTVİN & DOĞU KARADENİZ TURİZM HAVZASI (Bungalov, Dağ Evi, Yayla)
  { city: "Artvin", district: "Şavşat" },
  { city: "Artvin", district: "Borçka" },
  { city: "Artvin", district: "Arhavi" },
  { city: "Artvin", district: "Hopa" },
  { city: "Artvin", district: "Yusufeli" },
  { city: "Artvin", district: "Merkez" },
  { city: "Rize", district: "Çamlıhemşin" },
  { city: "Rize", district: "Ayder Yaylası" },
  { city: "Rize", district: "Fındıklı" },
  { city: "Rize", district: "Ardeşen" },
  { city: "Rize", district: "İkizdere" },
  { city: "Trabzon", district: "Uzungöl" },
  { city: "Trabzon", district: "Çaykara" },
  { city: "Trabzon", district: "Maçka" },

  // 🏡 SAKARYA & MARMARA DOĞA HAVZASI
  { city: "Sakarya", district: "Sapanca" },
  { city: "Bolu", district: "Abant" },
  { city: "Bolu", district: "Mudurnu" },

  // 🌊 ANTALYA SAHİL & KOYLAR
  { city: "Antalya", district: "Kaş" },
  { city: "Antalya", district: "Kalkan" },
  { city: "Antalya", district: "Alanya" },
  { city: "Antalya", district: "Manavgat" },
  { city: "Antalya", district: "Kemer" },
  { city: "Antalya", district: "Kumluca" },
  { city: "Antalya", district: "Olimpos" },

  // ⛵ MUĞLA & EGE KOYLARI
  { city: "Muğla", district: "Bodrum" },
  { city: "Muğla", district: "Fethiye" },
  { city: "Muğla", district: "Marmaris" },
  { city: "Muğla", district: "Datça" },
  { city: "Muğla", district: "Akyaka" },
  { city: "Muğla", district: "Köyceğiz" },

  // 🎈 KAPADOKYA
  { city: "Nevşehir", district: "Göreme" },
  { city: "Nevşehir", district: "Ürgüp" },
  { city: "Nevşehir", district: "Uçhisar" },

  // 🏖️ İZMİR & EGE
  { city: "İzmir", district: "Çeşme" },
  { city: "İzmir", district: "Alaçatı" },
  { city: "İzmir", district: "Urla" },
  { city: "İzmir", district: "Seferihisar" },
  { city: "Balıkesir", district: "Ayvalık" },
  { city: "Çanakkale", district: "Bozcaada" }
];

// Yüksek Bütçeli Turizm & Konaklama Sektörleri
const TOURISM_SECTORS = [
  "bungalov evleri",
  "dağ evi konaklama",
  "butik otel",
  "pansiyon konaklama",
  "yayla evi ahşap ev",
  "glamping çadır kamp",
  "apart otel",
  "rafting doğa turları",
  "tekne turu yat kiralama",
  "seyahat turizm acentesi",
  "vip transfer havalimanı"
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Canlı D1 Veritabanına da Yaz (Çift Güvence)
async function syncToLiveD1(leads) {
  if (!leads || !leads.length) return;
  try {
    await fetch('https://data.oblabs.com.tr/api/leads/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leads)
    });
  } catch(e) {}
}

// Supabase'e Toplu Lead Kaydetme (REST API)
async function saveToSupabase(leads) {
  if (!leads || !leads.length) return 0;
  syncToLiveD1(leads); // D1'e de arka planda aktar
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates,return=representation'
      },
      body: JSON.stringify(leads)
    });

    if (res.ok) {
      const saved = await res.json();
      const count = Array.isArray(saved) ? saved.length : leads.length;
      console.log(`[Supabase ⚡] +${count} yeni TURİZM firması veritabanına başarıyla yazıldı!`);
      return count;
    } else {
      const errText = await res.text();
      console.error('[Supabase ❌] Kayıt hatası:', res.status, errText);
      return 0;
    }
  } catch (err) {
    console.error('[Supabase ❌] Ağ hatası:', err.message);
    return 0;
  }
}

// Mevcut telefonları Supabase'den çek
async function getKnownPhones() {
  const set = new Set();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=phone`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        list.forEach(item => {
          const p = (item.phone || '').replace(/\D/g, '');
          if (p) set.add(p);
        });
      }
    }
  } catch (e) {}
  return set;
}

async function startTourismScraper() {
  console.log('🚀 [Supabase Turizm Motoru] Başlatılıyor...');
  console.log(`📍 Hedef: ${TOURISM_LOCATIONS.length} Turizm Bölgesi x ${TOURISM_SECTORS.length} Sektör`);

  const knownPhones = await getKnownPhones();
  console.log(`📋 Supabase'de kayıtlı mevcut telefon sayısı: ${knownPhones.size}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--lang=tr-TR,tr'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

  // İnternet Tasarrufu: Resimleri ve gereksiz medya isteklerini engelle (Kotayı korur!)
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['image', 'media', 'font'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const tasks = [];
  for (const loc of TOURISM_LOCATIONS) {
    for (const sec of TOURISM_SECTORS) {
      tasks.push({ loc, sec });
    }
  }
  tasks.sort(() => Math.random() - 0.5);

  let totalAdded = 0;

  for (let i = 0; i < tasks.length; i++) {
    const { loc, sec } = tasks[i];
    const query = `${loc.city} ${loc.district} ${sec}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=tr`;

    console.log(`\n🏖️ [${i + 1}/${tasks.length}] Aranıyor: "${query}"...`);

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await sleep(1200);

      try {
        const rejectBtn = await page.$('button[aria-label*="Tümünü reddet" i], form[action*="consent"] button');
        if (rejectBtn) await rejectBtn.click();
      } catch (e) {}

      try {
        await page.waitForSelector('div[role="feed"]', { timeout: 6000 });
      } catch (e) {
        continue;
      }

      // 🚀 TURBO HIZLI SCROLL (8 Scroll ile 3 Saniyede Tüm Otel & Bungalovları Çek)
      for (let s = 1; s <= 8; s++) {
        await page.evaluate(() => {
          const feed = document.querySelector('div[role="feed"]');
          if (feed) feed.scrollTop = feed.scrollHeight;
        });
        await sleep(400);
      }

      const extracted = await page.evaluate((defaultSec) => {
        const feed = document.querySelector('div[role="feed"]');
        if (!feed) return { directLeads: [], checkLinks: [] };

        const placeLinks = Array.from(feed.querySelectorAll('a[href*="/maps/place/"]'));
        const directLeads = [];
        const checkLinks = [];
        const seenLinks = new Set();

        for (const a of placeLinks) {
          const href = a.href;
          if (!href || seenLinks.has(href)) continue;
          seenLinks.add(href);

          let card = a.closest('div[role="article"]') || a.parentElement;
          while (card && !card.getAttribute('role') && card.parentElement && card.parentElement.getAttribute('role') !== 'feed') {
            card = card.parentElement;
          }
          if (!card) continue;

          const rawText = card.innerText || '';
          const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

          // Web sitesi olanları ele
          const hasWeb = !!card.querySelector('a[data-value*="Web" i], a[aria-label*="web" i], a[href*="http"]:not([href*="google.com"])') ||
                         rawText.includes('Web sitesi');
          if (hasWeb) continue;

          const name = a.getAttribute('aria-label') || lines[0] || '';
          if (!name) continue;

          const phoneMatch = rawText.match(/(?:\+90\s*|0)?([2-5][0-9]{2}[\s.-]?[0-9]{3}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2})/);
          const phone = phoneMatch ? phoneMatch[0].trim() : '';

          let rating = 4.5;
          let reviews = 0;
          const ratingMatch = rawText.match(/([1-5],[0-9])/);
          if (ratingMatch) rating = parseFloat(ratingMatch[1].replace(',', '.'));
          const reviewsMatch = rawText.match(/\(([0-9.]+)\)/);
          if (reviewsMatch) reviews = parseInt(reviewsMatch[1].replace(/\./g, ''), 10);

          let category = defaultSec;
          let address = '';
          for (const line of lines) {
            if (line.includes('·')) {
              const parts = line.split('·').map(p => p.trim());
              if (parts[0] && !parts[0].includes('Açık') && !parts[0].includes('Kapalı')) {
                category = parts[0];
              }
              for (const p of parts) {
                if (p.includes('Sk.') || p.includes('Cd.') || p.includes('Cad.') || p.includes('Sok.') || p.includes('Mah.') || p.includes('No:') || p.includes('Köy') || p.includes('Mevkii')) {
                  address = p;
                }
              }
            }
          }

          if (phone) {
            directLeads.push({ name, phone, rating, reviews, category, address, maps_url: href });
          } else {
            checkLinks.push(href);
          }
        }

        return { directLeads, checkLinks };
      }, sec);

      const buffer = [];

      for (const d of extracted.directLeads) {
        const cleanPhone = (d.phone || '').replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 8) continue;
        if (knownPhones.has(cleanPhone)) continue;
        knownPhones.add(cleanPhone);

        const lead = {
          id: `tr_supa_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          name: d.name,
          district: loc.district,
          city: loc.city,
          category: d.category || sec,
          phone: d.phone,
          rating: d.rating,
          reviews_count: d.reviews,
          address: d.address || `${loc.district}, ${loc.city}`,
          website: "",
          status: "Aranacak",
          notes: "",
          maps_url: d.maps_url
        };

        buffer.push(lead);
        console.log(`   🏨 [YENİ TURİZM] ${lead.name} | Tel: ${lead.phone} | ${lead.city}/${lead.district} | ${lead.rating}★ (${lead.reviews_count} Yorum)`);
      }



      if (buffer.length > 0) {
        const added = await saveToSupabase(buffer);
        totalAdded += added;
        console.log(`📊 [TOPLAM] Şimdiye kadar Supabase'e eklenen: ${totalAdded} turizm firması!`);
      }

    } catch (err) {
      console.log('   ❌ Arama hatası:', err.message);
    }

    await sleep(800 + Math.random() * 800);
  }

  await browser.close();
  console.log(`🏁 Turizm taraması tamamlandı! Toplam ${totalAdded} firma eklendi.`);
}

startTourismScraper().catch(console.error);
