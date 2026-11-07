/**
 * OB Labs - 18 Motorlu Paralel Turbo Türkiye Geneli Google Maps Scraper
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// 18 Bağımsız Paralel Bölge Grubu (Tüm Türkiye)
const WORKER_GROUPS = {
  // Motor 1: İstanbul Anadolu Merkez
  1: [
    { city: "İstanbul", district: "Kadıköy" },
    { city: "İstanbul", district: "Ümraniye" },
    { city: "İstanbul", district: "Ataşehir" },
    { city: "İstanbul", district: "Üsküdar" },
    { city: "İstanbul", district: "Çekmeköy" }
  ],

  // Motor 2: İstanbul Anadolu Sanayi & Sahil
  2: [
    { city: "İstanbul", district: "Maltepe" },
    { city: "İstanbul", district: "Kartal" },
    { city: "İstanbul", district: "Pendik" },
    { city: "İstanbul", district: "Tuzla" },
    { city: "İstanbul", district: "Sancaktepe" },
    { city: "İstanbul", district: "Sultanbeyli" }
  ],

  // Motor 3: İstanbul Avrupa Merkez & Hizmet
  3: [
    { city: "İstanbul", district: "Beşiktaş" },
    { city: "İstanbul", district: "Şişli" },
    { city: "İstanbul", district: "Bakırköy" },
    { city: "İstanbul", district: "Fatih" },
    { city: "İstanbul", district: "Beyoğlu" },
    { city: "İstanbul", district: "Sarıyer" },
    { city: "İstanbul", district: "Kağıthane" }
  ],

  // Motor 4: İstanbul Avrupa Sanayi & Nüfus
  4: [
    { city: "İstanbul", district: "Esenyurt" },
    { city: "İstanbul", district: "Bağcılar" },
    { city: "İstanbul", district: "Küçükçekmece" },
    { city: "İstanbul", district: "Bahçelievler" },
    { city: "İstanbul", district: "Başakşehir" },
    { city: "İstanbul", district: "Beylikdüzü" },
    { city: "İstanbul", district: "Avcılar" },
    { city: "İstanbul", district: "Güngören" }
  ],

  // Motor 5: Ankara Merkez (Çankaya, Yenimahalle vb.)
  5: [
    { city: "Ankara", district: "Çankaya" },
    { city: "Ankara", district: "Yenimahalle" },
    { city: "Ankara", district: "Etimesgut" },
    { city: "Ankara", district: "Gölbaşı" }
  ],

  // Motor 6: Ankara Sanayi & Çevre
  6: [
    { city: "Ankara", district: "Keçiören" },
    { city: "Ankara", district: "Mamak" },
    { city: "Ankara", district: "Sincan" },
    { city: "Ankara", district: "Altındağ" },
    { city: "Ankara", district: "Pursaklar" },
    { city: "Ankara", district: "Polatlı" }
  ],

  // Motor 7: İzmir Merkez (Bornova, Konak, Karşıyaka)
  7: [
    { city: "İzmir", district: "Bornova" },
    { city: "İzmir", district: "Konak" },
    { city: "İzmir", district: "Karşıyaka" },
    { city: "İzmir", district: "Bayraklı" },
    { city: "İzmir", district: "Buca" }
  ],

  // Motor 8: İzmir Sanayi & Çevre
  8: [
    { city: "İzmir", district: "Çiğli" },
    { city: "İzmir", district: "Gaziemir" },
    { city: "İzmir", district: "Karabağlar" },
    { city: "İzmir", district: "Menemen" },
    { city: "İzmir", district: "Torbalı" },
    { city: "İzmir", district: "Aliağa" }
  ],

  // Motor 9: Bursa & Balıkesir
  9: [
    { city: "Bursa", district: "Nilüfer" },
    { city: "Bursa", district: "Osmangazi" },
    { city: "Bursa", district: "Yıldırım" },
    { city: "Bursa", district: "Gemlik" },
    { city: "Bursa", district: "İnegöl" },
    { city: "Balıkesir", district: "Karesi" },
    { city: "Balıkesir", district: "Altıeylül" },
    { city: "Balıkesir", district: "Bandırma" }
  ],

  // Motor 10: Kocaeli, Sakarya, Yalova
  10: [
    { city: "Kocaeli", district: "İzmit" },
    { city: "Kocaeli", district: "Gebze" },
    { city: "Kocaeli", district: "Darıca" },
    { city: "Kocaeli", district: "Körfez" },
    { city: "Sakarya", district: "Adapazarı" },
    { city: "Sakarya", district: "Serdivan" },
    { city: "Yalova", district: "Merkez" }
  ],

  // Motor 11: Antalya & Muğla (Yüksek Gelirli Turizm & Sağlık)
  11: [
    { city: "Antalya", district: "Muratpaşa" },
    { city: "Antalya", district: "Kepez" },
    { city: "Antalya", district: "Konyaaltı" },
    { city: "Antalya", district: "Alanya" },
    { city: "Antalya", district: "Manavgat" },
    { city: "Muğla", district: "Bodrum" },
    { city: "Muğla", district: "Fethiye" },
    { city: "Muğla", district: "Marmaris" }
  ],

  // Motor 12: Kayseri & Konya (Büyük Sanayi & Ticaret Odaklı)
  12: [
    { city: "Kayseri", district: "Melikgazi" },
    { city: "Kayseri", district: "Kocasinan" },
    { city: "Kayseri", district: "Talas" },
    { city: "Kayseri", district: "Hacılar" },
    { city: "Kayseri", district: "İncesu" },
    { city: "Kayseri", district: "Develi" },
    { city: "Konya", district: "Selçuklu" },
    { city: "Konya", district: "Meram" },
    { city: "Konya", district: "Karatay" }
  ],

  // Motor 13: Adana, Mersin, Hatay
  13: [
    { city: "Adana", district: "Seyhan" },
    { city: "Adana", district: "Çukurova" },
    { city: "Adana", district: "Yüreğir" },
    { city: "Mersin", district: "Yenişehir" },
    { city: "Mersin", district: "Mezitli" },
    { city: "Mersin", district: "Toroslar" },
    { city: "Hatay", district: "Antakya" },
    { city: "Hatay", district: "İskenderun" }
  ],

  // Motor 14: Gaziantep, Şanlıurfa, Diyarbakır
  14: [
    { city: "Gaziantep", district: "Şehitkamil" },
    { city: "Gaziantep", district: "Şahinbey" },
    { city: "Şanlıurfa", district: "Haliliye" },
    { city: "Şanlıurfa", district: "Eyyübiye" },
    { city: "Diyarbakır", district: "Kayapınar" },
    { city: "Diyarbakır", district: "Bağlar" },
    { city: "Kahramanmaraş", district: "Onikişubat" }
  ],

  // Motor 15: Samsun, Trabzon & Karadeniz
  15: [
    { city: "Samsun", district: "İlkadım" },
    { city: "Samsun", district: "Atakum" },
    { city: "Trabzon", district: "Ortahisar" },
    { city: "Ordu", district: "Altınordu" },
    { city: "Giresun", district: "Merkez" },
    { city: "Rize", district: "Merkez" },
    { city: "Zonguldak", district: "Merkez" }
  ],

  // Motor 16: Eskişehir, Denizli, Aydın, Manisa
  16: [
    { city: "Eskişehir", district: "Tepebaşı" },
    { city: "Eskişehir", district: "Odunpazarı" },
    { city: "Denizli", district: "Pamukkale" },
    { city: "Denizli", district: "Merkezefendi" },
    { city: "Aydın", district: "Efeler" },
    { city: "Aydın", district: "Kuşadası" },
    { city: "Manisa", district: "Yunusemre" },
    { city: "Manisa", district: "Şehzadeler" }
  ],

  // Motor 17: Doğu Anadolu (Erzurum, Malatya, Van, Elazığ)
  17: [
    { city: "Erzurum", district: "Yakutiye" },
    { city: "Erzurum", district: "Palandöken" },
    { city: "Malatya", district: "Battalgazi" },
    { city: "Malatya", district: "Yeşilyurt" },
    { city: "Van", district: "İpekyolu" },
    { city: "Elazığ", district: "Merkez" },
    { city: "Sivas", district: "Merkez" }
  ],

  // Motor 18: Trakya & Çevre (Tekirdağ, Çorlu, Edirne, Çanakkale)
  18: [
    { city: "Tekirdağ", district: "Çorlu" },
    { city: "Tekirdağ", district: "Süleymanpaşa" },
    { city: "Tekirdağ", district: "Çerkezköy" },
    { city: "Edirne", district: "Merkez" },
    { city: "Çanakkale", district: "Merkez" },
    { city: "Isparta", district: "Merkez" },
    { city: "Afyonkarahisar", district: "Merkez" }
  ]
};

// TELESATIŞTA EN ÇOK SATAN & EN YÜKSEK GELİRLİ ÖNCELİKLİ SEKTÖRLER
const SECTORS = [
  // 1. Sağlık & Estetik (Çok Yüksek Bilet, Güven Odaklı)
  "diş kliniği",
  "özel diş hekimi",
  "güzellik merkezi",
  "lazer epilasyon",
  "veteriner kliniği",
  "psikolog danışmanlık",
  "diyetisyen beslenme",

  // 2. Taşımacılık & Kurtarma (Acil & Güven İhtiyacı)
  "evden eve nakliyat",
  "asansörlü nakliyat",
  "oto çekici kurtarıcı",
  "forklift kiralama",

  // 3. Otomotiv & Özel Servisler
  "oto ekspertiz",
  "özel oto servis",
  "oto tamir",
  "oto boya kaporta",
  "oto cam film",

  // 4. Kurumsal & Prestij Hizmetleri
  "mali müşavir",
  "avukat hukuk bürosu",
  "mimarlık ofisi",
  "iç mimar dekorasyon",
  "sigorta acentesi",

  // 5. İmalat, Tadilat & Doğrama (Yüksek Sözleşme Tutarları)
  "alüminyum cam balkon",
  "tadilat dekorasyon",
  "demir doğrama ferforje",
  "çelik çatı sundurma",
  "mobilya imalat atölyesi",

  // 6. Tesisat, Güvenlik & Endüstriyel Hizmetler
  "güvenlik alarm kamera sistemleri",
  "endüstriyel temizlik şirketi",
  "koltuk halı yıkama",
  "klima kombi servisi",
  "su tesisatçısı",
  "elektrikçi",
  "düğün kına organizasyon"
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Canlı Cloudflare D1 Veritabanına Anlık Senkronizasyon (Sıfır Veri Kaybı)
async function syncToLiveD1(leads) {
  if (!leads || !leads.length) return;
  try {
    const res = await fetch('https://data.oblabs.com.tr/api/leads/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leads)
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`[D1 Cloud Sync] ⚡ ${leads.length} firma doğrudan canlı D1 veritabanına aktarıldı! (Eklenen: ${data.added})`);
    } else {
      console.error(`[D1 Cloud Sync] Sunucu yanıt hatası: ${res.status}`);
    }
  } catch (err) {
    console.error(`[D1 Cloud Sync] Bağlantı hatası: ${err.message}`);
  }
}

// Dosyaya güvenli yazma ve D1'e basma
async function appendToMasterFile(newLeads) {
  const masterFile = path.join(__dirname, 'output', 'turkiye_websiz_leadler.json');
  const portalFile = path.join(__dirname, '..', 'portal', 'leads_data.json');
  
  let current = [];
  if (fs.existsSync(masterFile)) {
    try { current = JSON.parse(fs.readFileSync(masterFile, 'utf-8')); } catch (e) { current = []; }
  }

  const existingPhones = new Set(current.map(l => (l.phone || '').replace(/\D/g, '')).filter(Boolean));
  let added = 0;
  const toSync = [];

  newLeads.forEach(item => {
    const p = (item.phone || '').replace(/\D/g, '');
    if (p && !existingPhones.has(p)) {
      existingPhones.add(p);
      current.push(item);
      toSync.push(item);
      added++;
    }
  });

  if (added > 0) {
    fs.writeFileSync(masterFile, JSON.stringify(current, null, 2), 'utf-8');
    fs.writeFileSync(portalFile, JSON.stringify(current, null, 2), 'utf-8');
  }

  // ANLIK OLARAK CANLI D1 VERİTABANINA GÖNDER
  if (toSync.length > 0) {
    await syncToLiveD1(toSync);
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
  console.log(`🚀 WORKER #${workerId} DEVREDE (18 PARALEL TURBO MOTOR)`);
  console.log(`📍 Görev Bölgesi: ${locations.length} İlçe`);
  console.log(`🏢 Sektör Sayısı: ${SECTORS.length} Yüksek Gelirli Sektör`);
  console.log(`======================================================\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--lang=tr-TR,tr',
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Resim, font ve css yüklemelerini engelleyerek hızı 4 katına çıkar
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const workerBuffer = [];

  for (const loc of locations) {
    console.log(`\n[Worker #${workerId}] 📍 Bölge: ${loc.city} - ${loc.district}`);

    for (const sector of SECTORS) {
      const query = `${sector} ${loc.district} ${loc.city}`;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=tr`;

      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await sleep(1000 + Math.random() * 500);

        // Hızlı Derin Scroll (Daha fazla sonuç yükle)
        for (let s = 0; s < 8; s++) {
          await page.evaluate(() => {
            const feed = document.querySelector('div[role="feed"]');
            if (feed) feed.scrollTop = feed.scrollHeight;
            else window.scrollBy(0, 1200);
          });
          await sleep(250 + Math.random() * 200);
        }

        const placeLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(h => h && h.includes('/maps/place/'));
        });

        const uniqueLinks = [...new Set(placeLinks)].slice(0, 35);

        for (const link of uniqueLinks) {
          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 });
            await sleep(350 + Math.random() * 200);

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
            if (data.web && data.web.trim().length > 3) continue; // Web sitesi var, ATLA
            const cleanPhone = (data.phone || '').replace(/\D/g, '');
            if (!cleanPhone || cleanPhone.length < 8) continue; // Telefon yok, ATLA

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
              const res = await appendToMasterFile(workerBuffer);
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
    await appendToMasterFile(workerBuffer);
  }

  await browser.close();
  console.log(`[Worker #${workerId}] ✅ Görev tamamlandı!`);
}

const workerArg = process.argv.find(a => a.startsWith('--worker='));
const workerId = workerArg ? parseInt(workerArg.split('=')[1], 10) : 1;

runWorker(workerId).catch(console.error);
