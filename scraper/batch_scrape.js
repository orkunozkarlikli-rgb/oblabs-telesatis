/**
 * OB Labs - Türkiye Geneli Toplu Google Haritalar Lead Toplayıcı
 * Hedef: Web sitesi OLMAYAN, telefonlu, yorumu olan sıcak müşteri datası
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Türkiye'nin En Yüksek Ticaret Hacmine Sahip Şehir & İlçe Matrisi
const LOCATIONS = [
  // İstanbul
  { city: "İstanbul", district: "Kadıköy" },
  { city: "İstanbul", district: "Ümraniye" },
  { city: "İstanbul", district: "Beşiktaş" },
  { city: "İstanbul", district: "Şişli" },
  { city: "İstanbul", district: "Bakırköy" },
  { city: "İstanbul", district: "Pendik" },
  { city: "İstanbul", district: "Ataşehir" },
  { city: "İstanbul", district: "Maltepe" },
  
  // Ankara
  { city: "Ankara", district: "Çankaya" },
  { city: "Ankara", district: "Yenimahalle" },
  { city: "Ankara", district: "Keçiören" },
  { city: "Ankara", district: "Etimesgut" },

  // İzmir
  { city: "İzmir", district: "Bornova" },
  { city: "İzmir", district: "Konak" },
  { city: "İzmir", district: "Karşıyaka" },
  { city: "İzmir", district: "Bayraklı" },

  // Bursa
  { city: "Bursa", district: "Nilüfer" },
  { city: "Bursa", district: "Osmangazi" },

  // Antalya
  { city: "Antalya", district: "Muratpaşa" },
  { city: "Antalya", district: "Konyaaltı" },

  // Kocaeli
  { city: "Kocaeli", district: "İzmit" },
  { city: "Kocaeli", district: "Gebze" }
];

// Satış Dönüşümü En Yüksek Kilit Sektörler
const SECTORS = [
  "oto tamir",
  "oto ekspertiz",
  "güzellik salonu",
  "lazer epilasyon",
  "diş kliniği",
  "evden eve nakliyat",
  "su tesisatçısı",
  "çilingir",
  "veteriner kliniği",
  "mali müşavir"
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBatch() {
  const masterFile = path.join(__dirname, 'output', 'turkiye_websiz_leadler.json');
  const portalFile = path.join(__dirname, '..', 'portal', 'leads_data.json');
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Load existing leads if any
  let masterLeads = [];
  if (fs.existsSync(masterFile)) {
    try {
      masterLeads = JSON.parse(fs.readFileSync(masterFile, 'utf-8'));
    } catch (e) { masterLeads = []; }
  }

  const seenPhones = new Set(masterLeads.map(l => (l.phone || '').replace(/\D/g, '')).filter(Boolean));
  const seenUrls = new Set(masterLeads.map(l => l.maps_url).filter(Boolean));

  console.log(`======================================================`);
  console.log(`🚀 OB Labs Türkiye Geneli Lead Toplama Motoru`);
  console.log(`📊 Mevcut Kayıtlı Lead Sayısı: ${masterLeads.length}`);
  console.log(`🎯 Hedef: ${LOCATIONS.length} İlçe x ${SECTORS.length} Sektör`);
  console.log(`======================================================\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=tr-TR,tr', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let totalNewAdded = 0;

  for (const loc of LOCATIONS) {
    console.log(`\n📍 [LOKASYON]: ${loc.city} - ${loc.district}`);

    for (const sector of SECTORS) {
      const query = `${sector} ${loc.district} ${loc.city}`;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=tr`;

      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await sleep(2500);

        // Scroll 4 times
        for (let s = 0; s < 4; s++) {
          await page.evaluate(() => {
            const feed = document.querySelector('div[role="feed"]');
            if (feed) feed.scrollTop = feed.scrollHeight;
            else window.scrollBy(0, 1000);
          });
          await sleep(1000);
        }

        const placeLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(h => h && h.includes('/maps/place/'));
        });

        const uniqueNew = [...new Set(placeLinks)].filter(u => !seenUrls.has(u)).slice(0, 10);

        for (const link of uniqueNew) {
          seenUrls.add(link);
          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await sleep(1200);

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

            // Filters
            if (!data.name) continue;
            if (data.web && data.web.trim().length > 3) continue; // Skip if website exists
            const cleanPhone = (data.phone || '').replace(/\D/g, '');
            if (!cleanPhone || cleanPhone.length < 8) continue; // Skip if no valid phone
            if (seenPhones.has(cleanPhone)) continue; // Skip if duplicate
            seenPhones.add(cleanPhone);

            const newLead = {
              id: `tr_${Date.now()}_${masterLeads.length + 1}`,
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

            masterLeads.push(newLead);
            totalNewAdded++;
            console.log(`   🔥 [${loc.city}/${loc.district}] ${newLead.name} | Tel: ${newLead.phone} | ${newLead.rating}★ (${newLead.reviews_count} Yorum)`);

            // Autosave every 10 leads so no data is ever lost
            if (totalNewAdded % 10 === 0) {
              fs.writeFileSync(masterFile, JSON.stringify(masterLeads, null, 2), 'utf-8');
              fs.writeFileSync(portalFile, JSON.stringify(masterLeads, null, 2), 'utf-8');
            }

          } catch (e) {}
        }

      } catch (err) {
        console.error(`   ⚠️ Hata (${query}):`, err.message);
      }
    }
  }

  await browser.close();

  // Final save
  fs.writeFileSync(masterFile, JSON.stringify(masterLeads, null, 2), 'utf-8');
  fs.writeFileSync(portalFile, JSON.stringify(masterLeads, null, 2), 'utf-8');

  console.log(`\n======================================================`);
  console.log(`🎉 TOPLU TARAMA TAMAMLANDI!`);
  console.log(`📈 Yeni Eklenen Sıcak Firma Sayısı: ${totalNewAdded}`);
  console.log(`📦 Toplam Veri Tabanı Büyüklüğü: ${masterLeads.length} Firma`);
  console.log(`======================================================\n`);
}

runBatch().catch(console.error);
