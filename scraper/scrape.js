/**
 * OB Labs - Gerçek Google Haritalar Lead Scraper
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const DEFAULT_SECTORS = [
  "oto tamir",
  "oto ekspertiz",
  "güzellik salonu",
  "lazer epilasyon",
  "diş kliniği",
  "evden eve nakliyat",
  "su tesisatçısı",
  "çilingir",
  "mali müşavir",
  "hukuk bürosu"
];

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    district: "Kadıköy",
    city: "İstanbul",
    limitPerSector: 15,
    sectors: DEFAULT_SECTORS
  };

  args.forEach(arg => {
    if (arg.startsWith('--district=')) config.district = arg.split('=')[1];
    if (arg.startsWith('--city=')) config.city = arg.split('=')[1];
    if (arg.startsWith('--limit=')) config.limitPerSector = parseInt(arg.split('=')[1], 10);
    if (arg.startsWith('--sectors=')) {
      config.sectors = arg.split('=')[1].split(',').map(s => s.trim());
    }
  });

  return config;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const config = parseArgs();
  console.log(`\n======================================================`);
  console.log(`🚀 OB Labs Gerçek Google Haritalar Veri Toplama Başlıyor`);
  console.log(`📍 Lokasyon: ${config.city} - ${config.district}`);
  console.log(`🏢 Taranacak Sektörler: ${config.sectors.join(', ')}`);
  console.log(`🎯 Sektör Başına İncelenecek: ~${config.limitPerSector} işletme`);
  console.log(`======================================================\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--lang=tr-TR,tr',
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const collectedLeads = [];
  const seenUrls = new Set();
  const seenPhones = new Set();

  for (const sector of config.sectors) {
    const searchQuery = `${sector} ${config.district} ${config.city}`;
    console.log(`\n🔍 Aranıyor: "${searchQuery}"...`);

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}?hl=tr`;

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(3500);

      // Scroll to trigger loading
      for (let s = 0; s < 5; s++) {
        await page.evaluate(() => {
          const feed = document.querySelector('div[role="feed"]');
          if (feed) feed.scrollTop = feed.scrollHeight;
          else window.scrollBy(0, 1000);
        });
        await sleep(1500);
      }

      // Collect place links
      const placeLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(h => h && h.includes('/maps/place/'));
      });

      // Deduplicate links
      const uniqueLinks = [...new Set(placeLinks)].filter(u => !seenUrls.has(u)).slice(0, config.limitPerSector);
      console.log(`   └─ ${uniqueLinks.length} adet işletme bulundu. Tek tek web sitesi kontrol ediliyor...`);

      for (const link of uniqueLinks) {
        seenUrls.add(link);
        try {
          await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await sleep(1500);

          const data = await page.evaluate(() => {
            const name = document.querySelector('h1')?.textContent?.trim() || '';

            // Website
            const web = document.querySelector('a[data-item-id="authority"]')?.getAttribute('href') ||
                        document.querySelector('a[aria-label*="web" i]')?.getAttribute('href') || '';

            // Phone
            const phoneAttr = document.querySelector('button[data-item-id*="phone"]')?.getAttribute('aria-label') ||
                              document.querySelector('button[aria-label*="Telefon" i]')?.getAttribute('aria-label') || '';
            const phone = phoneAttr.replace(/Telefon:\s*/i, '').trim();

            // Rating & Review Count
            const ratingText = document.querySelector('div.F7nice')?.textContent || '';
            let rating = 4.5;
            let reviews = 0;

            const rMatch = ratingText.match(/([0-9],[0-9])/);
            if (rMatch) rating = parseFloat(rMatch[1].replace(',', '.'));

            const countMatch = ratingText.match(/\(([0-9.]+)\)/);
            if (countMatch) reviews = parseInt(countMatch[1].replace(/\./g, ''), 10);

            // Category
            const category = document.querySelector('button[jsaction*="category"]')?.textContent?.trim() || '';

            // Address
            const addressAttr = document.querySelector('button[data-item-id="address"]')?.getAttribute('aria-label') || '';
            const address = addressAttr.replace(/Adres:\s*/i, '').trim();

            return { name, web, phone, rating, reviews, category, address };
          });

          if (!data.name) continue;

          // FILTER 1: Has website? Skip!
          if (data.web && data.web.trim().length > 3) {
            // console.log(`   [X Web Sitesi Var]: ${data.name}`);
            continue;
          }

          // FILTER 2: Has valid phone?
          const cleanPhone = (data.phone || '').replace(/[^0-9]/g, '');
          if (!cleanPhone || cleanPhone.length < 8) {
            // console.log(`   [X Telefon Yok]: ${data.name}`);
            continue;
          }

          // FILTER 3: Already processed this phone?
          if (seenPhones.has(cleanPhone)) continue;
          seenPhones.add(cleanPhone);

          const lead = {
            id: `real_${Date.now()}_${collectedLeads.length + 1}`,
            name: data.name,
            district: config.district,
            city: config.city,
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

          collectedLeads.push(lead);
          console.log(`   🔥 [GERÇEK SICAK LEAD]: ${lead.name} | Tel: ${lead.phone} | Puan: ${lead.rating} (${lead.reviews_count} Yorum)`);

        } catch (itemErr) {
          // skip on individual error
        }
      }

    } catch (sectorErr) {
      console.error(`   Hata (${sector}):`, sectorErr.message);
    }
  }

  await browser.close();

  // Save to output folder
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const dateStr = new Date().toISOString().slice(0, 10);
  const outPath = path.join(outputDir, `kadikoy_gercek_firmalar_${dateStr}.json`);
  fs.writeFileSync(outPath, JSON.stringify(collectedLeads, null, 2), 'utf-8');

  // Also write to portal/leads_data.json
  const portalPath = path.join(__dirname, '..', 'portal', 'leads_data.json');
  fs.writeFileSync(portalPath, JSON.stringify(collectedLeads, null, 2), 'utf-8');

  console.log(`\n======================================================`);
  console.log(`🎉 GERÇEK VERİ TARAMASI TAMAMLANDI!`);
  console.log(`📊 Kadıköy'de Web Sitesi Olmayan Sıcak Firma Sayısı: ${collectedLeads.length}`);
  console.log(`💾 Dosya: ${outPath}`);
  console.log(`======================================================\n`);

  return collectedLeads;
}

run().catch(console.error);
