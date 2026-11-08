/**
 * OB Labs - 2 Motorlu Paralel Yerel Scraper (D1 Limiti Bağımsız)
 * Kullanım: node local_scrape_continuous.js --worker=1
 *           node local_scrape_continuous.js --worker=2
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const workerArg = process.argv.find(a => a.startsWith('--worker='));
const workerId = workerArg ? parseInt(workerArg.split('=')[1], 10) : 1;

const PORTAL_PART1 = path.join(__dirname, '..', 'portal', 'leads_part1.json');
const PORTAL_PART2 = path.join(__dirname, '..', 'portal', 'leads_part2.json');
const PORTAL_MANUAL_BASE = path.join(__dirname, '..', 'portal', 'leads_manual.json');
const PORTAL_MY_FILE = path.join(__dirname, '..', 'portal', `leads_manual_w${workerId}.json`);
const SQL_BACKUP = path.join(__dirname, 'output', `manual_leads_w${workerId}.sql`);

if (!fs.existsSync(path.join(__dirname, 'output'))) {
  fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
}

// 1. Tüm mevcut telefonları hafızaya yükle
console.log(`[Motor #${workerId}] 📌 Mevcut veri havuzu taranıyor...`);
const knownPhones = new Set();

function loadPhonesFromFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    list.forEach(item => {
      const p = (item.phone || '').replace(/\D/g, '');
      if (p) knownPhones.add(p);
    });
  } catch (e) {}
}

loadPhonesFromFile(PORTAL_PART1);
loadPhonesFromFile(PORTAL_PART2);
loadPhonesFromFile(PORTAL_MANUAL_BASE);
loadPhonesFromFile(path.join(__dirname, '..', 'portal', 'leads_manual_w1.json'));
loadPhonesFromFile(path.join(__dirname, '..', 'portal', 'leads_manual_w2.json'));

console.log(`[Motor #${workerId}] ✅ ${knownPhones.size.toLocaleString('tr-TR')} adet kayıt hafızada. Mükerrer firma kesinlikle alınmayacak.`);

let myLeads = [];
if (fs.existsSync(PORTAL_MY_FILE)) {
  try { myLeads = JSON.parse(fs.readFileSync(PORTAL_MY_FILE, 'utf-8')); } catch (e) { myLeads = []; }
}

function escapeSql(str) {
  if (!str) return "''";
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function saveLeadsBatch(batch) {
  let newAdded = 0;
  let sqlStatements = '';

  batch.forEach(lead => {
    const cleanPhone = (lead.phone || '').replace(/\D/g, '');
    if (cleanPhone && !knownPhones.has(cleanPhone)) {
      knownPhones.add(cleanPhone);
      myLeads.unshift(lead);
      newAdded++;

      sqlStatements += `INSERT OR IGNORE INTO leads (id, name, district, city, category, phone, rating, reviews_count, address, website, status, notes, maps_url) VALUES (${escapeSql(lead.id)}, ${escapeSql(lead.name)}, ${escapeSql(lead.district)}, ${escapeSql(lead.city)}, ${escapeSql(lead.category)}, ${escapeSql(lead.phone)}, ${Number(lead.rating) || 0}, ${Number(lead.reviews_count) || 0}, ${escapeSql(lead.address)}, '', 'Aranacak', '', ${escapeSql(lead.maps_url)});\n`;
    }
  });

  if (newAdded > 0) {
    fs.writeFileSync(PORTAL_MY_FILE, JSON.stringify(myLeads, null, 2), 'utf-8');
    if (sqlStatements) {
      fs.appendFileSync(SQL_BACKUP, sqlStatements, 'utf-8');
    }
    console.log(`[Motor #${workerId}] 💾 +${newAdded} YENİ FİRMA KAYDEDİLDİ! Bu Motor Toplamı: ${myLeads.length} firma | Genel Havuz: ${(knownPhones.size).toLocaleString('tr-TR')}`);
  }
}

// BÖLGELER (Motor 1 ve Motor 2 Arasında Ayrılmış)
const LOCATIONS_W1 = [
  // İstanbul Anadolu
  { city: "İstanbul", district: "Kadıköy" },
  { city: "İstanbul", district: "Ümraniye" },
  { city: "İstanbul", district: "Ataşehir" },
  { city: "İstanbul", district: "Maltepe" },
  { city: "İstanbul", district: "Kartal" },
  { city: "İstanbul", district: "Pendik" },
  { city: "İstanbul", district: "Tuzla" },
  { city: "İstanbul", district: "Üsküdar" },
  { city: "İstanbul", district: "Çekmeköy" },
  { city: "İstanbul", district: "Sancaktepe" },
  { city: "İstanbul", district: "Sultanbeyli" },
  // İstanbul Avrupa
  { city: "İstanbul", district: "Şişli" },
  { city: "İstanbul", district: "Beşiktaş" },
  { city: "İstanbul", district: "Bakırköy" },
  { city: "İstanbul", district: "Esenyurt" },
  { city: "İstanbul", district: "Başakşehir" },
  { city: "İstanbul", district: "İkitelli OSB" },
  { city: "İstanbul", district: "Bağcılar" },
  { city: "İstanbul", district: "Beylikdüzü" },
  { city: "İstanbul", district: "Kağıthane" },
  { city: "İstanbul", district: "Eyüpsultan" },
  { city: "İstanbul", district: "Zeytinburnu" },
  { city: "İstanbul", district: "Küçükçekmece" },
  // Marmara Sanayi
  { city: "Kocaeli", district: "Gebze" },
  { city: "Kocaeli", district: "İzmit" },
  { city: "Kocaeli", district: "Çayırova" },
  { city: "Kocaeli", district: "Körfez" },
  { city: "Bursa", district: "Nilüfer" },
  { city: "Bursa", district: "Osmangazi" },
  { city: "Bursa", district: "Yıldırım" },
  { city: "Tekirdağ", district: "Çorlu" },
  { city: "Tekirdağ", district: "Çerkezköy" },
  { city: "Sakarya", district: "Adapazarı" }
];

const LOCATIONS_W2 = [
  // Ankara
  { city: "Ankara", district: "Çankaya" },
  { city: "Ankara", district: "Ostim" },
  { city: "Ankara", district: "İvedik OSB" },
  { city: "Ankara", district: "Yenimahalle" },
  { city: "Ankara", district: "Keçiören" },
  { city: "Ankara", district: "Etimesgut" },
  { city: "Ankara", district: "Sincan" },
  { city: "Ankara", district: "Gölbaşı" },
  // İzmir
  { city: "İzmir", district: "Bornova" },
  { city: "İzmir", district: "Konak" },
  { city: "İzmir", district: "Karşıyaka" },
  { city: "İzmir", district: "Buca" },
  { city: "İzmir", district: "Çiğli" },
  { city: "İzmir", district: "Torbalı" },
  { city: "İzmir", district: "Gaziemir" },
  { city: "İzmir", district: "Menemen" },
  // Antalya
  { city: "Antalya", district: "Muratpaşa" },
  { city: "Antalya", district: "Kepez" },
  { city: "Antalya", district: "Alanya" },
  { city: "Antalya", district: "Manavgat" },
  // Diğer Büyük Sanayi & Ticaret İlleri
  { city: "Adana", district: "Seyhan" },
  { city: "Adana", district: "Çukurova" },
  { city: "Gaziantep", district: "Şehitkamil" },
  { city: "Gaziantep", district: "Şahinbey" },
  { city: "Konya", district: "Selçuklu" },
  { city: "Konya", district: "Karatay" },
  { city: "Kayseri", district: "Melikgazi" },
  { city: "Kayseri", district: "Kocasinan" },
  { city: "Denizli", district: "Pamukkale" },
  { city: "Mersin", district: "Akdeniz" },
  { city: "Mersin", district: "Yenişehir" },
  { city: "Eskişehir", district: "Tepebaşı" },
  { city: "Eskişehir", district: "Odunpazarı" },
  { city: "Manisa", district: "Yunusemre" }
];

const SECTORS = [
  "özel oto servis",
  "oto ekspertiz",
  "oto tamir bakım",
  "mali müşavir",
  "avukat",
  "mimarlık ofisi",
  "alüminyum doğrama cam balkon",
  "tadilat dekorasyon",
  "mutfak dolabı mobilya imalat",
  "tabela reklam dijital baskı",
  "matbaa",
  "klima kombi servisi",
  "koltuk halı yıkama",
  "güvenlik alarm kamera sistemleri",
  "düğün kına organizasyon",
  "catering toplu yemek",
  "asansör bakım montaj",
  "nakliyat evden eve",
  "demir doğrama ferforje",
  "su arıtma sistemleri",
  "sigorta acentesi",
  "forklift kiralama tamir",
  "bobinaj elektrik motoru",
  "oto boya kaporta",
  "oto cam film kaplama",
  "endüstriyel temizlik şirketi"
];

const myLocations = workerId === 1 ? LOCATIONS_W1 : LOCATIONS_W2;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function startWorker() {
  console.log(`[Motor #${workerId}] 🚀 Puppeteer başlatılıyor... (${myLocations.length} lokasyon x ${SECTORS.length} sektör)`);
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

  const tasks = [];
  for (const loc of myLocations) {
    for (const sec of SECTORS) {
      tasks.push({ loc, sec });
    }
  }
  tasks.sort(() => Math.random() - 0.5);

  console.log(`[Motor #${workerId}] 📋 Toplam ${tasks.length} arama sıraya alındı.`);

  for (let i = 0; i < tasks.length; i++) {
    const { loc, sec } = tasks[i];
    const query = `${loc.city} ${loc.district} ${sec}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=tr`;

    console.log(`\n[Motor #${workerId}] 🔍 [${i + 1}/${tasks.length}] "${query}"...`);

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await sleep(1400);

      try {
        const rejectBtn = await page.$('button[aria-label*="Tümünü reddet" i], form[action*="consent"] button');
        if (rejectBtn) await rejectBtn.click();
      } catch (e) {}

      try {
        await page.waitForSelector('div[role="feed"]', { timeout: 7000 });
      } catch (e) {
        continue;
      }

      // Derin kaydırma (7 kez)
      for (let s = 1; s <= 7; s++) {
        await page.evaluate(() => {
          const feed = document.querySelector('div[role="feed"]');
          if (feed) feed.scrollTop = feed.scrollHeight;
        });
        await sleep(550);
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
                if (p.includes('Sk.') || p.includes('Cd.') || p.includes('Cad.') || p.includes('Sok.') || p.includes('Mah.') || p.includes('No:') || p.includes('Sanayi') || p.includes('Sitesi')) {
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

        const lead = {
          id: `w${workerId}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
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
        console.log(`[Motor #${workerId}] ⚡ [YENİ] ${lead.name} | Tel: ${lead.phone} | ${lead.city}/${lead.district} | ${lead.rating}★ (${lead.reviews_count})`);
      }

      const topCheck = (extracted.checkLinks || []).slice(0, 5);
      for (const link of topCheck) {
        try {
          await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 7000 });
          await sleep(250);

          const detail = await page.evaluate(() => {
            const name = document.querySelector('h1')?.textContent?.trim() || '';
            const web = document.querySelector('a[data-item-id="authority"]')?.getAttribute('href') ||
                        document.querySelector('a[aria-label*="web" i]')?.getAttribute('href') || '';
            const phoneAttr = document.querySelector('button[data-item-id*="phone"]')?.getAttribute('aria-label') ||
                              document.querySelector('button[aria-label*="Telefon" i]')?.getAttribute('aria-label') || '';
            const phone = phoneAttr.replace(/Telefon:\s*/i, '').trim();

            const ratingText = document.querySelector('div.F7nice')?.textContent || '';
            let rating = 4.5;
            let reviews = 0;
            const rMatch = ratingText.match(/([0-9],[0-9])/);
            if (rMatch) rating = parseFloat(rMatch[1].replace(',', '.'));
            const countMatch = ratingText.match(/\(([0-9.]+)\)/);
            if (countMatch) reviews = parseInt(countMatch[1].replace(/\./g, ''), 10);

            const category = document.querySelector('button[jsaction*="category"]')?.textContent?.trim() || '';
            const addressAttr = document.querySelector('button[data-item-id="address"]')?.getAttribute('aria-label') || '';
            const address = addressAttr.replace(/Adres:\s*/i, '').trim();

            return { name, web, phone, rating, reviews, category, address };
          });

          if (!detail.name || (detail.web && detail.web.trim().length > 3)) continue;
          const cleanPhone = (detail.phone || '').replace(/\D/g, '');
          if (!cleanPhone || cleanPhone.length < 8) continue;
          if (knownPhones.has(cleanPhone)) continue;

          const lead = {
            id: `w${workerId}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            name: detail.name,
            district: loc.district,
            city: loc.city,
            category: detail.category || sec,
            phone: detail.phone,
            rating: detail.rating,
            reviews_count: detail.reviews,
            address: detail.address || `${loc.district}, ${loc.city}`,
            website: "",
            status: "Aranacak",
            notes: "",
            maps_url: link
          };

          buffer.push(lead);
          console.log(`[Motor #${workerId}] 🔥 [DETAY] ${lead.name} | Tel: ${lead.phone} | ${lead.city}/${lead.district}`);
        } catch (e) {}
      }

      if (buffer.length > 0) {
        saveLeadsBatch(buffer);
      }

    } catch (err) {
      console.log(`[Motor #${workerId}] ❌ Hata:`, err.message);
    }

    await sleep(800 + Math.random() * 800);
  }

  await browser.close();
  console.log(`[Motor #${workerId}] 🏁 Tamamlandı!`);
}

startWorker().catch(console.error);
