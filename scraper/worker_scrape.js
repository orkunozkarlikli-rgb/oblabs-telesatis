/**
 * OB Labs - 6 Motorlu Devasa Türkiye Geneli Google Maps Scraper
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// 6 Bağımsız Bölge Grubu (Türkiye'nin En Büyük Ticaret İlçeleri)
const WORKER_GROUPS = {
  // Motor 1: İstanbul Anadolu Yakası (Yoğun Esnaf)
  1: [
    { city: "İstanbul", district: "Kadıköy" },
    { city: "İstanbul", district: "Ümraniye" },
    { city: "İstanbul", district: "Ataşehir" },
    { city: "İstanbul", district: "Maltepe" },
    { city: "İstanbul", district: "Kartal" },
    { city: "İstanbul", district: "Pendik" },
    { city: "İstanbul", district: "Üsküdar" },
    { city: "İstanbul", district: "Sancaktepe" },
    { city: "İstanbul", district: "Sultanbeyli" },
    { city: "İstanbul", district: "Tuzla" },
    { city: "İstanbul", district: "Çekmeköy" }
  ],

  // Motor 2: İstanbul Avrupa Yakası Merkez (Plazalar & Hizmet)
  2: [
    { city: "İstanbul", district: "Beşiktaş" },
    { city: "İstanbul", district: "Şişli" },
    { city: "İstanbul", district: "Bakırköy" },
    { city: "İstanbul", district: "Fatih" },
    { city: "İstanbul", district: "Beyoğlu" },
    { city: "İstanbul", district: "Sarıyer" },
    { city: "İstanbul", district: "Eyüpsultan" },
    { city: "İstanbul", district: "Kağıthane" },
    { city: "İstanbul", district: "Zeytinburnu" }
  ],

  // Motor 3: İstanbul Avrupa Sanayi & Yoğun Nüfus
  3: [
    { city: "İstanbul", district: "Esenyurt" },
    { city: "İstanbul", district: "Bağcılar" },
    { city: "İstanbul", district: "Küçükçekmece" },
    { city: "İstanbul", district: "Bahçelievler" },
    { city: "İstanbul", district: "Başakşehir" },
    { city: "İstanbul", district: "Beylikdüzü" },
    { city: "İstanbul", district: "Avcılar" },
    { city: "İstanbul", district: "Güngören" },
    { city: "İstanbul", district: "Gaziosmanpaşa" },
    { city: "İstanbul", district: "Esenler" },
    { city: "İstanbul", district: "Sultangazi" }
  ],

  // Motor 4: Başkent Ankara
  4: [
    { city: "Ankara", district: "Çankaya" },
    { city: "Ankara", district: "Yenimahalle" },
    { city: "Ankara", district: "Keçiören" },
    { city: "Ankara", district: "Mamak" },
    { city: "Ankara", district: "Etimesgut" },
    { city: "Ankara", district: "Sincan" },
    { city: "Ankara", district: "Altındağ" },
    { city: "Ankara", district: "Gölbaşı" },
    { city: "Ankara", district: "Pursaklar" }
  ],

  // Motor 5: Ege'nin İncisi İzmir
  5: [
    { city: "İzmir", district: "Bornova" },
    { city: "İzmir", district: "Konak" },
    { city: "İzmir", district: "Karşıyaka" },
    { city: "İzmir", district: "Bayraklı" },
    { city: "İzmir", district: "Buca" },
    { city: "İzmir", district: "Çiğli" },
    { city: "İzmir", district: "Gaziemir" },
    { city: "İzmir", district: "Karabağlar" },
    { city: "İzmir", district: "Menemen" },
    { city: "İzmir", district: "Torbalı" }
  ],

  // Motor 6: Büyük Sanayi & Turizm İlleri
  6: [
    { city: "Bursa", district: "Nilüfer" },
    { city: "Bursa", district: "Osmangazi" },
    { city: "Bursa", district: "Yıldırım" },
    { city: "Antalya", district: "Muratpaşa" },
    { city: "Antalya", district: "Kepez" },
    { city: "Antalya", district: "Konyaaltı" },
    { city: "Kocaeli", district: "İzmit" },
    { city: "Kocaeli", district: "Gebze" },
    { city: "Adana", district: "Seyhan" },
    { city: "Adana", district: "Çukurova" },
    { city: "Gaziantep", district: "Şehitkamil" },
    { city: "Konya", district: "Selçuklu" },
    { city: "Kayseri", district: "Melikgazi" },
    { city: "Mersin", district: "Yenişehir" },
    { city: "Eskişehir", district: "Tepebaşı" }
  ]
};

// Genişletilmiş Yüksek Dönüşümlü 16 Sektör
const SECTORS = [
  "oto tamir",
  "oto ekspertiz",
  "oto lastikçi",
  "oto çekici yol yardım",
  "güzellik salonu",
  "lazer epilasyon",
  "diş kliniği",
  "evden eve nakliyat",
  "su tesisatçısı",
  "çilingir anahtarcı",
  "veteriner kliniği",
  "mali müşavir",
  "halı yıkama",
  "alüminyum cam balkon",
  "elektrikçi",
  "tadilat dekorasyon"
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Dosyaya güvenli yazma
function appendToMasterFile(newLeads) {
  const masterFile = path.join(__dirname, 'output', 'turkiye_websiz_leadler.json');
  const portalFile = path.join(__dirname, '..', 'portal', 'leads_data.json');
  
  let current = [];
  if (fs.existsSync(masterFile)) {
    try { current = JSON.parse(fs.readFileSync(masterFile, 'utf-8')); } catch (e) { current = []; }
  }

  const existingPhones = new Set(current.map(l => (l.phone || '').replace(/\D/g, '')).filter(Boolean));
  let added = 0;

  newLeads.forEach(item => {
    const p = (item.phone || '').replace(/\D/g, '');
    if (p && !existingPhones.has(p)) {
      existingPhones.add(p);
      current.push(item);
      added++;
    }
  });

  if (added > 0) {
    fs.writeFileSync(masterFile, JSON.stringify(current, null, 2), 'utf-8');
    fs.writeFileSync(portalFile, JSON.stringify(current, null, 2), 'utf-8');
  }

  return { added, total: current.length };
}

async function runWorker(workerId) {
  const locations = WORKER_GROUPS[workerId];
  if (!locations) {
    console.error(`Geçersiz worker ID: ${workerId}`);
    return;
  }

  console.log(`\n======================================================`);
  console.log(`🚀 WORKER #${workerId} DEVREDE`);
  console.log(`📍 Görev Bölgesi: ${locations.length} İlçe`);
  console.log(`🏢 Sektör Sayısı: ${SECTORS.length} Sektör`);
  console.log(`======================================================\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=tr-TR,tr', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const workerBuffer = [];

  for (const loc of locations) {
    console.log(`\n[Worker #${workerId}] 📍 Bölge: ${loc.city} - ${loc.district}`);

    for (const sector of SECTORS) {
      const query = `${sector} ${loc.district} ${loc.city}`;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=tr`;

      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await sleep(1500 + Math.random() * 1000);

        // Scroll
        for (let s = 0; s < 5; s++) {
          await page.evaluate(() => {
            const feed = document.querySelector('div[role="feed"]');
            if (feed) feed.scrollTop = feed.scrollHeight;
            else window.scrollBy(0, 1000);
          });
          await sleep(600 + Math.random() * 400);
        }

        const placeLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(h => h && h.includes('/maps/place/'));
        });

        const uniqueLinks = [...new Set(placeLinks)].slice(0, 15);

        for (const link of uniqueLinks) {
          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await sleep(800 + Math.random() * 400);

            const data = await page.evaluate(() => {
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

            if (!data.name) continue;
            if (data.web && data.web.trim().length > 3) continue; // Web sitesi var
            const cleanPhone = (data.phone || '').replace(/\D/g, '');
            if (!cleanPhone || cleanPhone.length < 8) continue; // Telefon yok

            const lead = {
              id: `tr_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
              name: data.name,
              district: loc.district,
              city: loc.city,
              category: data.category || sector,
              phone: data.phone,
              rating: data.rating,
              reviews_count: data.reviews,
              address: data.address,
              website: "",
              status: "Aranacak",
              notes: "",
              maps_url: link
            };

            workerBuffer.push(lead);
            console.log(`[Worker #${workerId}] 🔥 [${loc.city}/${loc.district}] ${lead.name} | Tel: ${lead.phone} | ${lead.rating}★ (${lead.reviews_count} Yorum)`);

            if (workerBuffer.length >= 5) {
              const res = appendToMasterFile(workerBuffer);
              workerBuffer.length = 0;
              console.log(`[Worker #${workerId}] 💾 Kaydedildi! Toplam Havuz: ${res.total} firma`);
            }

          } catch (e) {}
        }

      } catch (err) {
        console.error(`[Worker #${workerId}] Hata:`, err.message);
      }
    }
  }

  if (workerBuffer.length > 0) {
    appendToMasterFile(workerBuffer);
  }

  await browser.close();
  console.log(`[Worker #${workerId}] ✅ Görev tamamlandı!`);
}

const workerArg = process.argv.find(a => a.startsWith('--worker='));
const workerId = workerArg ? parseInt(workerArg.split('=')[1], 10) : 1;

runWorker(workerId).catch(console.error);
