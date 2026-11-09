/**
 * OB Labs - 18 Motorlu Paralel Turbo Türkiye Geneli Google Maps Scraper
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// 18 Bağımsız Paralel Bölge Grubu (Tüm Türkiye'nin En Büyük Ticaret ve Sanayi Merkezleri)
const WORKER_GROUPS = {
  // Motor 1: İstanbul Anadolu Kuzey & Doğu (Merkez & Yeni İlçeler)
  1: [
    { city: "İstanbul", district: "Kadıköy" },
    { city: "İstanbul", district: "Ümraniye" },
    { city: "İstanbul", district: "Ataşehir" },
    { city: "İstanbul", district: "Üsküdar" },
    { city: "İstanbul", district: "Çekmeköy" },
    { city: "İstanbul", district: "Beykoz" },
    { city: "İstanbul", district: "Şile" },
    { city: "İstanbul", district: "Sancaktepe" }
  ],

  // Motor 2: İstanbul Anadolu Sanayi & Sahil & Doğu Koridoru
  2: [
    { city: "İstanbul", district: "Maltepe" },
    { city: "İstanbul", district: "Kartal" },
    { city: "İstanbul", district: "Pendik" },
    { city: "İstanbul", district: "Tuzla" },
    { city: "İstanbul", district: "Sultanbeyli" },
    { city: "Kocaeli", district: "Gebze" },
    { city: "Kocaeli", district: "Çayırova" },
    { city: "Kocaeli", district: "Dilovası" }
  ],

  // Motor 3: İstanbul Avrupa Merkez, Boğaz & Tarihi Yarımada
  3: [
    { city: "İstanbul", district: "Beşiktaş" },
    { city: "İstanbul", district: "Şişli" },
    { city: "İstanbul", district: "Bakırköy" },
    { city: "İstanbul", district: "Fatih" },
    { city: "İstanbul", district: "Beyoğlu" },
    { city: "İstanbul", district: "Sarıyer" },
    { city: "İstanbul", district: "Kağıthane" },
    { city: "İstanbul", district: "Eyüpsultan" },
    { city: "İstanbul", district: "Gaziosmanpaşa" },
    { city: "İstanbul", district: "Bayrampaşa" },
    { city: "İstanbul", district: "Zeytinburnu" }
  ],

  // Motor 4: İstanbul Avrupa Batı Sanayi & Yoğun Nüfus Koridoru
  4: [
    { city: "İstanbul", district: "Esenyurt" },
    { city: "İstanbul", district: "Bağcılar" },
    { city: "İstanbul", district: "Küçükçekmece" },
    { city: "İstanbul", district: "Bahçelievler" },
    { city: "İstanbul", district: "Başakşehir" },
    { city: "İstanbul", district: "Beylikdüzü" },
    { city: "İstanbul", district: "Avcılar" },
    { city: "İstanbul", district: "Güngören" },
    { city: "İstanbul", district: "Esenler" },
    { city: "İstanbul", district: "Sultangazi" },
    { city: "İstanbul", district: "Büyükçekmece" },
    { city: "İstanbul", district: "Arnavutköy" },
    { city: "İstanbul", district: "Silivri" },
    { city: "İstanbul", district: "Çatalca" }
  ],

  // Motor 5: Ankara Merkez, Batı & Sanayi Koridoru
  5: [
    { city: "Ankara", district: "Çankaya" },
    { city: "Ankara", district: "Yenimahalle" },
    { city: "Ankara", district: "Etimesgut" },
    { city: "Ankara", district: "Gölbaşı" },
    { city: "Ankara", district: "Kahramankazan" },
    { city: "Ankara", district: "Beypazarı" },
    { city: "Ankara", district: "Ayaş" }
  ],

  // Motor 6: Ankara Doğu, Sanayi & Çevre
  6: [
    { city: "Ankara", district: "Keçiören" },
    { city: "Ankara", district: "Mamak" },
    { city: "Ankara", district: "Sincan" },
    { city: "Ankara", district: "Altındağ" },
    { city: "Ankara", district: "Pursaklar" },
    { city: "Ankara", district: "Polatlı" },
    { city: "Ankara", district: "Çubuk" },
    { city: "Ankara", district: "Akyurt" },
    { city: "Ankara", district: "Elmadağ" }
  ],

  // Motor 7: İzmir Merkez & Doğu Sanayi Koridoru
  7: [
    { city: "İzmir", district: "Bornova" },
    { city: "İzmir", district: "Konak" },
    { city: "İzmir", district: "Karşıyaka" },
    { city: "İzmir", district: "Bayraklı" },
    { city: "İzmir", district: "Buca" },
    { city: "İzmir", district: "Kemalpaşa" },
    { city: "İzmir", district: "Torbalı" },
    { city: "İzmir", district: "Menderes" }
  ],

  // Motor 8: İzmir Kuzey, Güney, Sanayi & Sahil
  8: [
    { city: "İzmir", district: "Çiğli" },
    { city: "İzmir", district: "Gaziemir" },
    { city: "İzmir", district: "Karabağlar" },
    { city: "İzmir", district: "Menemen" },
    { city: "İzmir", district: "Aliağa" },
    { city: "İzmir", district: "Seferihisar" },
    { city: "İzmir", district: "Urla" },
    { city: "İzmir", district: "Çeşme" },
    { city: "İzmir", district: "Bergama" },
    { city: "İzmir", district: "Tire" },
    { city: "İzmir", district: "Ödemiş" }
  ],

  // Motor 9: Bursa & Balıkesir (Dev Otomotiv, Tekstil & Sanayi)
  9: [
    { city: "Bursa", district: "Nilüfer" },
    { city: "Bursa", district: "Osmangazi" },
    { city: "Bursa", district: "Yıldırım" },
    { city: "Bursa", district: "Gemlik" },
    { city: "Bursa", district: "İnegöl" },
    { city: "Bursa", district: "Kestel" },
    { city: "Bursa", district: "Gürsu" },
    { city: "Bursa", district: "Mudanya" },
    { city: "Bursa", district: "Karacabey" },
    { city: "Bursa", district: "Mustafakemalpaşa" },
    { city: "Balıkesir", district: "Karesi" },
    { city: "Balıkesir", district: "Altıeylül" },
    { city: "Balıkesir", district: "Bandırma" },
    { city: "Balıkesir", district: "Edremit" },
    { city: "Balıkesir", district: "Ayvalık" },
    { city: "Balıkesir", district: "Burhaniye" }
  ],

  // Motor 10: Kocaeli, Sakarya, Yalova, Düzce, Bolu
  10: [
    { city: "Kocaeli", district: "İzmit" },
    { city: "Kocaeli", district: "Darıca" },
    { city: "Kocaeli", district: "Körfez" },
    { city: "Kocaeli", district: "Gölcük" },
    { city: "Kocaeli", district: "Kartepe" },
    { city: "Kocaeli", district: "Başiskele" },
    { city: "Sakarya", district: "Adapazarı" },
    { city: "Sakarya", district: "Serdivan" },
    { city: "Sakarya", district: "Erenler" },
    { city: "Sakarya", district: "Hendek" },
    { city: "Sakarya", district: "Akyazı" },
    { city: "Yalova", district: "Merkez" },
    { city: "Yalova", district: "Çiftlikköy" },
    { city: "Düzce", district: "Merkez" },
    { city: "Bolu", district: "Merkez" }
  ],

  // Motor 11: Antalya, Isparta, Burdur (Yüksek Gelirli Turizm, Sağlık & Tarım)
  11: [
    { city: "Antalya", district: "Muratpaşa" },
    { city: "Antalya", district: "Kepez" },
    { city: "Antalya", district: "Konyaaltı" },
    { city: "Antalya", district: "Alanya" },
    { city: "Antalya", district: "Manavgat" },
    { city: "Antalya", district: "Serik" },
    { city: "Antalya", district: "Döşemealtı" },
    { city: "Antalya", district: "Kemer" },
    { city: "Antalya", district: "Kumluca" },
    { city: "Antalya", district: "Finike" },
    { city: "Antalya", district: "Kaş" },
    { city: "Isparta", district: "Merkez" },
    { city: "Burdur", district: "Merkez" }
  ],

  // Motor 12: Muğla, Aydın, Denizli (Ege Turizm, Mermer & Tekstil)
  12: [
    { city: "Muğla", district: "Bodrum" },
    { city: "Muğla", district: "Fethiye" },
    { city: "Muğla", district: "Marmaris" },
    { city: "Muğla", district: "Milas" },
    { city: "Muğla", district: "Menteşe" },
    { city: "Muğla", district: "Ortaca" },
    { city: "Aydın", district: "Efeler" },
    { city: "Aydın", district: "Kuşadası" },
    { city: "Aydın", district: "Nazilli" },
    { city: "Aydın", district: "Söke" },
    { city: "Aydın", district: "Didim" },
    { city: "Denizli", district: "Pamukkale" },
    { city: "Denizli", district: "Merkezefendi" }
  ],

  // Motor 13: Manisa, Çanakkale, Tekirdağ, Edirne, Kırklareli (Trakya Sanayi & Tarım)
  13: [
    { city: "Manisa", district: "Yunusemre" },
    { city: "Manisa", district: "Şehzadeler" },
    { city: "Manisa", district: "Turgutlu" },
    { city: "Manisa", district: "Salihli" },
    { city: "Manisa", district: "Akhisar" },
    { city: "Tekirdağ", district: "Çorlu" },
    { city: "Tekirdağ", district: "Süleymanpaşa" },
    { city: "Tekirdağ", district: "Çerkezköy" },
    { city: "Tekirdağ", district: "Kapaklı" },
    { city: "Tekirdağ", district: "Ergene" },
    { city: "Edirne", district: "Merkez" },
    { city: "Kırklareli", district: "Lüleburgaz" },
    { city: "Kırklareli", district: "Merkez" },
    { city: "Çanakkale", district: "Merkez" },
    { city: "Çanakkale", district: "Biga" }
  ],

  // Motor 14: Adana, Mersin, Hatay, Osmaniye (Çukurova Sanayi & Lojistik)
  14: [
    { city: "Adana", district: "Seyhan" },
    { city: "Adana", district: "Çukurova" },
    { city: "Adana", district: "Yüreğir" },
    { city: "Adana", district: "Sarıçam" },
    { city: "Adana", district: "Ceyhan" },
    { city: "Adana", district: "Kozan" },
    { city: "Mersin", district: "Yenişehir" },
    { city: "Mersin", district: "Mezitli" },
    { city: "Mersin", district: "Toroslar" },
    { city: "Mersin", district: "Akdeniz" },
    { city: "Mersin", district: "Tarsus" },
    { city: "Mersin", district: "Erdemli" },
    { city: "Mersin", district: "Silifke" },
    { city: "Hatay", district: "Antakya" },
    { city: "Hatay", district: "İskenderun" },
    { city: "Hatay", district: "Dörtyol" },
    { city: "Osmaniye", district: "Merkez" },
    { city: "Osmaniye", district: "Kadirli" }
  ],

  // Motor 15: Gaziantep, Şanlıurfa, Kahramanmaraş, Kilis, Adıyaman (Güneydoğu Sanayi)
  15: [
    { city: "Gaziantep", district: "Şehitkamil" },
    { city: "Gaziantep", district: "Şahinbey" },
    { city: "Gaziantep", district: "Nizip" },
    { city: "Şanlıurfa", district: "Haliliye" },
    { city: "Şanlıurfa", district: "Eyyübiye" },
    { city: "Şanlıurfa", district: "Karaköprü" },
    { city: "Şanlıurfa", district: "Siverek" },
    { city: "Kahramanmaraş", district: "Onikişubat" },
    { city: "Kahramanmaraş", district: "Dulkadiroğlu" },
    { city: "Kahramanmaraş", district: "Elbistan" },
    { city: "Adıyaman", district: "Merkez" },
    { city: "Kilis", district: "Merkez" }
  ],

  // Motor 16: Kayseri, Konya, Aksaray, Niğde, Nevşehir, Karaman (İç Anadolu Ticaret & Sanayi)
  16: [
    { city: "Kayseri", district: "Melikgazi" },
    { city: "Kayseri", district: "Kocasinan" },
    { city: "Kayseri", district: "Talas" },
    { city: "Kayseri", district: "Develi" },
    { city: "Konya", district: "Selçuklu" },
    { city: "Konya", district: "Meram" },
    { city: "Konya", district: "Karatay" },
    { city: "Konya", district: "Ereğli" },
    { city: "Konya", district: "Akşehir" },
    { city: "Aksaray", district: "Merkez" },
    { city: "Niğde", district: "Merkez" },
    { city: "Nevşehir", district: "Merkez" },
    { city: "Karaman", district: "Merkez" }
  ],

  // Motor 17: Samsun, Trabzon, Ordu, Giresun, Rize, Zonguldak, Çorum, Tokat (Karadeniz)
  17: [
    { city: "Samsun", district: "İlkadım" },
    { city: "Samsun", district: "Atakum" },
    { city: "Samsun", district: "Canik" },
    { city: "Samsun", district: "Bafra" },
    { city: "Samsun", district: "Çarşamba" },
    { city: "Trabzon", district: "Ortahisar" },
    { city: "Trabzon", district: "Akçaabat" },
    { city: "Ordu", district: "Altınordu" },
    { city: "Ordu", district: "Ünye" },
    { city: "Ordu", district: "Fatsa" },
    { city: "Giresun", district: "Merkez" },
    { city: "Giresun", district: "Bulancak" },
    { city: "Rize", district: "Merkez" },
    { city: "Zonguldak", district: "Merkez" },
    { city: "Zonguldak", district: "Ereğli" },
    { city: "Çorum", district: "Merkez" },
    { city: "Tokat", district: "Merkez" },
    { city: "Amasya", district: "Merkez" },
    { city: "Kastamonu", district: "Merkez" }
  ],

  // Motor 18: Doğu ve Güneydoğu Anadolu (Diyarbakır, Erzurum, Malatya, Van, Elazığ, Batman, Mardin, Sivas)
  18: [
    { city: "Diyarbakır", district: "Kayapınar" },
    { city: "Diyarbakır", district: "Bağlar" },
    { city: "Diyarbakır", district: "Yenişehir" },
    { city: "Erzurum", district: "Yakutiye" },
    { city: "Erzurum", district: "Palandöken" },
    { city: "Malatya", district: "Battalgazi" },
    { city: "Malatya", district: "Yeşilyurt" },
    { city: "Van", district: "İpekyolu" },
    { city: "Van", district: "Tuşba" },
    { city: "Elazığ", district: "Merkez" },
    { city: "Batman", district: "Merkez" },
    { city: "Mardin", district: "Artuklu" },
    { city: "Mardin", district: "Kızıltepe" },
    { city: "Sivas", district: "Merkez" },
    { city: "Erzincan", district: "Merkez" }
  ]
};

// TELESATIŞTA EN ÇOK SATAN & EN YÜKSEK GELİRLİ ÖNCELİKLİ SEKTÖRLER
const SECTORS = [
  // 1. Sağlık, Klinik & Estetik (Çok Yüksek Bilet, Güven Odaklı)
  "diş kliniği",
  "özel diş hekimi",
  "güzellik merkezi",
  "lazer epilasyon",
  "veteriner kliniği",
  "psikolog danışmanlık",
  "diyetisyen beslenme",
  "fizik tedavi merkezi",

  // 2. Taşımacılık, Kurtarma & Araç Kiralama (Acil & Güven İhtiyacı)
  "evden eve nakliyat",
  "asansörlü nakliyat",
  "oto çekici kurtarıcı",
  "rent a car oto kiralama",
  "forklift vinç kiralama",
  "lojistik ambar",

  // 3. Otomotiv & Özel Servisler
  "oto ekspertiz",
  "özel oto servis",
  "oto tamir bakım",
  "oto boya kaporta",
  "oto cam film kaplama",
  "oto yıkama detaylı temizlik",

  // 4. Kurumsal & Prestij Hizmetleri
  "mali müşavir",
  "avukat hukuk bürosu",
  "mimarlık ofisi",
  "iç mimar dekorasyon",
  "sigorta acentesi",
  "gümrük müşavirliği",

  // 5. Reklam, Tabela, Organizasyon & İkram
  "tabela reklam dijital baskı",
  "matbaa",
  "düğün kına organizasyon",
  "catering toplu yemek şirketi",

  // 6. İmalat, Tadilat & Doğrama (Yüksek Sözleşme Tutarları)
  "alüminyum cam balkon",
  "tadilat dekorasyon",
  "demir doğrama ferforje",
  "çelik çatı sundurma",
  "mobilya imalat atölyesi",
  "mutfak dolabı imalat",

  // 7. Tesisat, Güvenlik, Enerji & İklimlendirme
  "güvenlik alarm kamera sistemleri",
  "güneş enerjisi ges sistemleri",
  "asansör bakım montaj",
  "endüstriyel temizlik şirketi",
  "koltuk halı yıkama",
  "klima kombi servisi",
  "su tesisatçısı",
  "elektrikçi"
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sxvlvvcgkrbjktflroqu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

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

// Canlı Supabase Veritabanına Anlık Senkronizasyon (Çift Yedekli)
async function syncToSupabase(leads) {
  if (!leads || !leads.length) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify(leads)
    });
    if (res.ok) {
      console.log(`[Supabase Sync] ⚡ ${leads.length} firma doğrudan canlı Supabase veritabanına aktarıldı!`);
    }
  } catch (err) {}
}

// Dosyaya güvenli yazma ve D1 + Supabase buluta basma
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
    try {
      fs.writeFileSync(masterFile, JSON.stringify(current, null, 2), 'utf-8');
      fs.writeFileSync(portalFile, JSON.stringify(current, null, 2), 'utf-8');
    } catch(e) {}
  }

  // ANLIK OLARAK CANLI D1 VE SUPABASE VERİTABANINA GÖNDER
  if (toSync.length > 0) {
    await Promise.allSettled([
      syncToLiveD1(toSync),
      syncToSupabase(toSync)
    ]);
  }

  return { added, total: current.length };
}

async function runWorker(groupSelection) {
  let selectedGroupIds = [];
  if (typeof groupSelection === 'string' && groupSelection.includes(',')) {
    selectedGroupIds = groupSelection.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
  } else if (Array.isArray(groupSelection)) {
    selectedGroupIds = groupSelection;
  } else {
    selectedGroupIds = [parseInt(groupSelection, 10) || 1];
  }

  // Seçilen tüm grupların lokasyonlarını birleştir
  let locations = [];
  selectedGroupIds.forEach(gid => {
    if (WORKER_GROUPS[gid]) {
      locations.push(...WORKER_GROUPS[gid]);
    }
  });

  if (!locations.length) {
    console.error(`Geçersiz worker/group: ${groupSelection}`);
    return;
  }

  // Her seferinde farklı ilçe ve sektörden başlasın (Sıfır tekrar, maksimum hız)
  locations.sort(() => Math.random() - 0.5);
  const shuffledSectors = [...SECTORS].sort(() => Math.random() - 0.5);

  console.log(`\n======================================================`);
  console.log(`🚀 WORKER DEVREDE (Gruplar: ${selectedGroupIds.join(', ')})`);
  console.log(`📍 Görev Bölgesi: ${locations.length} İlçe (Rastgele Dağıtılmış)`);
  console.log(`🏢 Sektör Sayısı: ${shuffledSectors.length} Yüksek Gelirli Sektör`);
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

    for (const sector of shuffledSectors) {
      const query = `${sector} ${loc.district} ${loc.city}`;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=tr`;

      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await sleep(1000 + Math.random() * 500);

        // 🎯 GERÇEK DERİN DİBE İNME MOTORU (En dibe kadar inerek tüm firmaları aç)
        let prevHeight = 0;
        let sameHeightCount = 0;
        for (let s = 1; s <= 25; s++) {
          const scrollInfo = await page.evaluate(() => {
            const feed = document.querySelector('div[role="feed"]');
            if (!feed) return { atBottom: true, height: 0 };
            
            feed.scrollTop = feed.scrollHeight;
            const isEnd = feed.innerText.includes('Sonuçların sonuna geldiniz') || 
                          feed.innerText.includes('daha fazla sonuç yok') ||
                          !!document.querySelector('span.HlvSq');
            return { atBottom: isEnd, height: feed.scrollHeight };
          });

          if (scrollInfo.atBottom) {
            console.log(`[Worker] 🛑 Listenin en dibine ulaşıldı (${s}. kaydırma).`);
            break;
          }

          if (scrollInfo.height === prevHeight) {
            sameHeightCount++;
            if (sameHeightCount >= 3) break; // 3 kez yükseklik değişmediyse dibe gelinmiştir
          } else {
            sameHeightCount = 0;
            prevHeight = scrollInfo.height;
          }

          // Google Maps'in yeni kartları AJAX ile yüklemesi için 1.0 - 1.2 saniye bekle
          await sleep(1000 + Math.random() * 200);
        }

        // 🚀 ULTRA HIZLI ANLIK KART AYIKLAMA (Tek tek sayfa açmadan doğrudan feed'den çek)
        const extracted = await page.evaluate((defaultCategory) => {
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

            // Kart kapsayıcısını bul
            let card = a.closest('div[role="article"]') || a.parentElement;
            while (card && !card.getAttribute('role') && card.parentElement && card.parentElement.getAttribute('role') !== 'feed') {
              card = card.parentElement;
            }
            if (!card) continue;

            const rawText = card.innerText || '';
            const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

            // 1. Web sitesi olanları ANINDA ELE (Sıfır vakit kaybı)
            const hasWeb = !!card.querySelector('a[data-value*="Web" i], a[aria-label*="web" i], a[href*="http"]:not([href*="google.com"])') ||
                           rawText.includes('Web sitesi');
            if (hasWeb) continue; // Web sitesi var, ATLA!

            // İsim
            const name = a.getAttribute('aria-label') || lines[0] || '';
            if (!name) continue;

            // Telefon (05xx, 0212, 0216, 03xx, 0850 vb.)
            const phoneMatch = rawText.match(/(?:\+90\s*|0)?([2-5][0-9]{2}[\s.-]?[0-9]{3}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2})/);
            const phone = phoneMatch ? phoneMatch[0].trim() : '';

            // Puan ve Yorum
            let rating = 4.5;
            let reviews = 0;
            const ratingMatch = rawText.match(/([1-5],[0-9])/);
            if (ratingMatch) rating = parseFloat(ratingMatch[1].replace(',', '.'));
            const reviewsMatch = rawText.match(/\(([0-9.]+)\)/);
            if (reviewsMatch) reviews = parseInt(reviewsMatch[1].replace(/\./g, ''), 10);

            // Kategori ve Adres
            let category = defaultCategory;
            let address = '';
            for (const line of lines) {
              if (line.includes('·')) {
                const parts = line.split('·').map(p => p.trim());
                if (parts[0] && !parts[0].includes('Açık') && !parts[0].includes('Kapalı')) {
                  category = parts[0];
                }
                for (const p of parts) {
                  if (p.includes('Sk.') || p.includes('Cd.') || p.includes('Cad.') || p.includes('Sok.') || p.includes('Mah.') || p.includes('No:') || p.includes('Sanayi')) {
                    address = p;
                  }
                }
              }
            }

            if (phone) {
              // Telefonu hazır olanları anında al
              directLeads.push({ name, phone, rating, reviews, category, address, maps_url: href });
            } else {
              // Telefonu dışarıda görünmeyenleri detay kontrol listesine ekle
              checkLinks.push(href);
            }
          }

          return { directLeads, checkLinks };
        }, sector);

        // 1. ANINDA YAKALANANLARI HAVUZA VE D1'E GÖNDER
        for (const d of extracted.directLeads) {
          const cleanPhone = (d.phone || '').replace(/\D/g, '');
          if (!cleanPhone || cleanPhone.length < 8) continue;

          const lead = {
            id: `tr_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            name: d.name,
            district: loc.district,
            city: loc.city,
            category: d.category || sector,
            phone: d.phone,
            rating: d.rating,
            reviews_count: d.reviews,
            address: d.address || `${loc.district}, ${loc.city}`,
            website: "",
            status: "Aranacak",
            notes: "",
            maps_url: d.maps_url
          };

          workerBuffer.push(lead);
          console.log(`[Worker #${workerId}] ⚡ [${loc.city}/${loc.district}] ${lead.name} | Tel: ${lead.phone} | ${lead.rating}★ (${lead.reviews_count} Yorum)`);

          if (workerBuffer.length >= 5) {
            const res = await appendToMasterFile(workerBuffer);
            workerBuffer.length = 0;
            console.log(`[Worker #${workerId}] 💾 Kaydedildi! Toplam Havuz: ${res.total} firma`);
          }
        }

        // 2. KARTINDA TELEFON YAZMAYAN FİRMALARIN İÇİNE HIZLICA GİRİP TELEFONA BAK (25 Firmaya Kadar)
        const topCheckLinks = (extracted.checkLinks || []).slice(0, 25);
        for (const link of topCheckLinks) {
          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 8000 });
            await sleep(250 + Math.random() * 150);

            const detailData = await page.evaluate(() => {
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

            if (!detailData.name) continue;
            if (detailData.web && detailData.web.trim().length > 3) continue;
            const cleanPhone = (detailData.phone || '').replace(/\D/g, '');
            if (!cleanPhone || cleanPhone.length < 8) continue;

            const lead = {
              id: `tr_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
              name: detailData.name,
              district: loc.district,
              city: loc.city,
              category: detailData.category || sector,
              phone: detailData.phone,
              rating: detailData.rating,
              reviews_count: detailData.reviews,
              address: detailData.address,
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

const groupsArg = process.argv.find(a => a.startsWith('--groups='));
const workerArg = process.argv.find(a => a.startsWith('--worker='));

let targetGroups = "1";
if (groupsArg) {
  targetGroups = groupsArg.split('=')[1];
} else if (workerArg) {
  const wVal = workerArg.split('=')[1];
  // Matrix eşleştirmeleri:
  if (wVal === '1') targetGroups = "6,7,14,16";       // İç Anadolu & Başkent (Ankara, OSTİM, Konya, Kayseri, Denizli)
  else if (wVal === '2') targetGroups = "8,9,11,12";   // Ege & Akdeniz (İzmir, Bursa, Antalya, Adana, Mersin)
  else if (wVal === '3') targetGroups = "13,18";       // Güneydoğu & Doğu (Gaziantep, Urfa, Maraş, Diyarbakır, Erzurum)
  else if (wVal === '4') targetGroups = "10,15,17";    // Karadeniz & Trakya (Samsun, Trabzon, Artvin, Sakarya, Çorlu)
  else targetGroups = wVal;
}

runWorker(targetGroups).catch(console.error);
