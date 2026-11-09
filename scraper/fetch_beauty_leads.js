const fs = require('fs');
const path = require('path');
const { scrapeBulurumCategory } = require('./bulurum_scraper.js');

async function main() {
  console.log('🚀 Güzellik Merkezleri Lead Toplama Başlatılıyor...');

  // Mevcut telefonları hafızaya alalım (çift kayıt olmasın)
  const existingPhones = new Set();
  const portalDir = path.resolve(__dirname, '../portal');

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

  console.log(`Mevcut havuzdaki telefon sayısı: ${existingPhones.size}`);

  const cities = [
    'istanbul', 'ankara', 'izmir', 'bursa', 'antalya',
    'kocaeli', 'adana', 'konya', 'gaziantep', 'mersin',
    'samsun', 'mugla', 'eskisehir', 'kayseri', 'tekirdag'
  ];

  const newLeads = [];
  const categorySlug = 'guzellik-salonlari-ve-merkezleri';

  for (const city of cities) {
    console.log(`📍 Şehir taranıyor: ${city.toUpperCase()}...`);
    for (let page = 1; page <= 3; page++) {
      try {
        const leads = await scrapeBulurumCategory(categorySlug, city, page);
        if (!leads || leads.length === 0) break;

        let addedForPage = 0;
        for (const lead of leads) {
          const cleanPh = (lead.phone || '').replace(/\D/g, '');
          if (cleanPh && !existingPhones.has(cleanPh)) {
            existingPhones.add(cleanPh);
            newLeads.push(lead);
            addedForPage++;
          }
        }

        console.log(`  -> Sayfa ${page}: +${addedForPage} yeni web sitesiz güzellik merkezi`);
        // Sunucuya kibar davranmak için kısa bekleme
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error(`  Hata (${city} sayfa ${page}):`, err.message);
      }
    }
  }

  // Genel sayfaları da tarayalım
  console.log('📍 Genel sayfalar taranıyor...');
  for (let page = 1; page <= 5; page++) {
    const leads = await scrapeBulurumCategory(categorySlug, '', page);
    if (!leads || leads.length === 0) break;
    for (const lead of leads) {
      const cleanPh = (lead.phone || '').replace(/\D/g, '');
      if (cleanPh && !existingPhones.has(cleanPh)) {
        existingPhones.add(cleanPh);
        newLeads.push(lead);
      }
    }
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n🎉 Toplam ${newLeads.length} adet TAZE ve WEB SİTESİ OLMAYAN Güzellik Merkezi toplandı!`);

  if (newLeads.length > 0) {
    // leads_manual.json dosyasına ekleyelim
    const manualFile = path.join(portalDir, 'leads_manual.json');
    let currentManual = [];
    if (fs.existsSync(manualFile)) {
      try {
        currentManual = JSON.parse(fs.readFileSync(manualFile, 'utf8'));
      } catch (e) { currentManual = []; }
    }

    // Yeni gelenleri en başa ekle (temsilci hemen görsün)
    const updated = [...newLeads, ...currentManual];
    fs.writeFileSync(manualFile, JSON.stringify(updated, null, 2));
    console.log(`✅ leads_manual.json güncellendi! Yeni manual dosya boyutu: ${updated.length} kayıt.`);
  }
}

main();
