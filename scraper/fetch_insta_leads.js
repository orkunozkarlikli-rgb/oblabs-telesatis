const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Sektör tespiti
function detectSector(text, title) {
  const t = (text + ' ' + title).toLowerCase();
  if (t.match(/butik|giyim|elbise|tesettür|şal|abiye|kıyafet|kombin|çanta|ayakkabı|moda/)) return 'Giyim, Butik & Moda';
  if (t.match(/pasta|tatlı|kurabiye|çikolata|lezzet|yemek|meze|baklava|fırın|mutfak/)) return 'Yeme, İçme & Restoran';
  if (t.match(/güzellik|kuaför|tırnak|protez tırnak|ipek kirpik|makyaj|cilt|estetik|lazer|saç/)) return 'Güzellik, Kuaför & Bakım';
  if (t.match(/takı|gümüş|altın|kolye|bileklik|aksesuar|saat|çelik takı|doğaltaş/)) return 'Takı & Aksesuar';
  if (t.match(/çiçek|buket|aranjman|hediye|hediyelik|mum|epoksi|tasarım|atölye/)) return 'Hediyelik & Çiçek';
  if (t.match(/mobilya|ahşap|dekorasyon|ev tekstil|halı|perde|avize|dekor/)) return 'Mobilya & İmalat';
  if (t.match(/klinik|diş|doktor|diyetisyen|psikolog|fizyoterapi|sağlık/)) return 'Sağlık, Klinik & Doktor';
  if (t.match(/organizasyon|düğün|nişan|kına|doğum günü|davetiye|süsleme/)) return 'Reklam, Matbaa & Organizasyon';
  if (t.match(/oto|araç|kılıf|paspas|aksesuar|detailing|cam filmi/)) return 'Otomotiv & Araç Servisi';
  return 'Diğer Hizmetler';
}

async function scrapeInstagramYahoo() {
  console.log('🚀 Instagram Satıcıları Taraması Başlatılıyor (Yahoo Index)...');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Mevcut telefonları yükle (mükerrer olmasın)
  const portalDir = path.resolve(__dirname, '../portal');
  const existingPhones = new Set();
  ['leads_part1.json', 'leads_part2.json', 'leads_manual_w1.json', 'leads_manual_w2.json', 'leads_manual.json'].forEach(f => {
    const p = path.join(portalDir, f);
    if (fs.existsSync(p)) {
      try {
        const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
        arr.forEach(i => {
          const ph = (i.phone || '').replace(/\D/g, '');
          if (ph) existingPhones.add(ph);
        });
      } catch (e) {}
    }
  });
  console.log(`📞 Havuzdaki mevcut telefon sayısı: ${existingPhones.size}`);

  const prefixes = [
    '0532', '0533', '0535', '0536', '0537', '0538', '0530', '0531',
    '0541', '0542', '0543', '0544', '0545', '0546', '0549',
    '0551', '0552', '0553', '0554', '0555',
    '0505', '0506', '0507'
  ];

  const keywords = ['sipariş', 'whatsapp sipariş', 'bilgi ve sipariş'];

  const collectedLeads = [];

  for (const prefix of prefixes) {
    for (const kw of keywords) {
      const q = `site:instagram.com "${kw}" "${prefix}"`;
      const url = `https://search.yahoo.com/search?p=${encodeURIComponent(q)}`;

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const pageResults = await page.evaluate(() => {
          const items = [];
          document.querySelectorAll('.algo, .dd.algo').forEach(el => {
            const titleEl = el.querySelector('h3 a, h3');
            const linkEl = el.querySelector('h3 a, a');
            const text = el.innerText || '';
            const title = titleEl ? titleEl.innerText.trim() : '';
            const href = linkEl ? linkEl.href : '';

            if (!href.includes('instagram.com')) return;

            // Harici site kontrolü (instagram.com ve yahoo.com hariç)
            const textNoIg = text.replace(/instagram\.com/gi, '').replace(/yahoo\.com/gi, '');
            const hasExternalWebsite = /www\.[a-z0-9-]+\.(?:com|net|org|com\.tr)|https?:\/\/(?!www\.instagram)[a-z0-9.-]+\.(?:com|net|org)|shopier|trendyol|hepsiburada/i.test(textNoIg);

            // Telefon bulma (05xx)
            const m = text.match(/(?:0\s*5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2})|(?:5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2})/);
            if (m) {
              let phone = m[0].replace(/\D/g, '');
              if (phone.length === 10 && phone.startsWith('5')) phone = '0' + phone;

              const handleMatch = href.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
              const handle = handleMatch && !['p', 'reel', 'stories', 'explore', 'tv'].includes(handleMatch[1]) ? handleMatch[1] : '';

              items.push({
                title: title.replace(/• Instagram photos and videos/gi, '').replace(/\(@[^)]+\)/g, '').replace(/\|.*/, '').trim(),
                handle,
                phone,
                hasExternalWebsite,
                href,
                snippet: text.replace(/\s+/g, ' ').substring(0, 200)
              });
            }
          });
          return items;
        });

        let addedCount = 0;
        for (const item of pageResults) {
          // Sadece web sitesi OLMAYAN ve 11 haneli 05xx telefonları al
          if (!item.hasExternalWebsite && item.phone.length === 11 && item.phone.startsWith('05')) {
            if (!existingPhones.has(item.phone)) {
              existingPhones.add(item.phone);

              // Temiz işletme adı
              let cleanName = item.title || item.handle || 'Instagram İşletmesi';
              cleanName = cleanName.replace(/Instagram/gi, '').replace(/[\-–—]/g, '').trim();
              if (cleanName.length < 3 && item.handle) cleanName = item.handle;

              // İl tespiti (biyografide geçen şehir)
              let detectedCity = 'İstanbul';
              const cityMatch = item.snippet.match(/\b(istanbul|ankara|izmir|bursa|antalya|adana|konya|gaziantep|kocaeli|mersin|diyarbakır|samsun|denizli|eskişehir|trabzon|kayseri)\b/i);
              if (cityMatch) {
                detectedCity = cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1).toLowerCase();
              }

              const lead = {
                id: `ig_${item.phone}`,
                name: cleanName,
                phone: item.phone,
                city: detectedCity,
                district: item.handle ? `@${item.handle}` : 'Instagram',
                category: detectSector(item.snippet, cleanName),
                address: `Instagram: ${item.handle ? '@' + item.handle : item.href}`,
                rating: 5.0,
                reviews_count: 0,
                has_website: 0,
                status: 'Aranacak',
                source: 'Instagram'
              };

              collectedLeads.push(lead);
              addedCount++;
            }
          }
        }

        if (addedCount > 0) {
          console.log(`   [${prefix} ${kw}] -> +${addedCount} yeni lead (Toplam: ${collectedLeads.length})`);
        }

        // Kısa bekleme
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        // Hata durumunda devam et
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`🎉 TARAMA BİTTİ! Toplam ${collectedLeads.length} yeni Instagram satıcısı toplandı.`);
  console.log(`======================================================\n`);

  if (collectedLeads.length > 0) {
    const manualFile = path.join(portalDir, 'leads_manual.json');
    let currentManual = [];
    if (fs.existsSync(manualFile)) {
      try {
        currentManual = JSON.parse(fs.readFileSync(manualFile, 'utf8'));
      } catch (e) { currentManual = []; }
    }

    const updated = [...collectedLeads, ...currentManual];
    fs.writeFileSync(manualFile, JSON.stringify(updated, null, 2));
    console.log(`✅ portal/leads_manual.json güncellendi! Yeni boyut: ${updated.length}`);
  }

  return collectedLeads;
}

scrapeInstagramYahoo().catch(console.error);
