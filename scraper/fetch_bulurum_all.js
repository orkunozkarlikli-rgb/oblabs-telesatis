const fs = require('fs');
const path = require('path');
const { scrapeBulurumCategory, getMaxPages } = require('./bulurum_scraper.js');

// ─── Genişletilmiş kategori listesi ───
const CATEGORIES = [
  // Güzellik & Bakım
  'guzellik-salonlari-ve-merkezleri',
  'kuaforler',
  // Sağlık & Diş
  'dis-hekimleri',
  'diyetisyenler',
  'psikologlar-ve-psikiyatristler',
  'fizyoterapi-merkezleri',
  'veteriner-klinikleri',
  // Hukuk
  'avukatlar',
  'arabuluculuk',
  // Muhasebe
  'serbest-muhasebeci-mali-musavirler',
  'yeminli-mali-musavirler',
  // Otomotiv
  'oto-tamircileri',
  'oto-lastik-rot-balans',
  'oto-galeriler-sifir-arac',
  'araba-kiralama',
  'yol-yardim-oto-kurtarma',
  'oto-boyacilar',
  'oto-elektrikciler',
  // Tesisat & Usta
  'kombi-servisi',
  'klima-servisi',
  'sihhi-tesisat-muslukcular',
  'cilingir-ve-anahtarcilar',
  'elektrikciler-ve-elektrik-malzemeleri',
  'boyacilar',
  // Sigorta
  'sigorta-sirketleri-ve-acenteleri',
  // Emlak & İnşaat
  'emlakcilar',
  'insaat-muhendisligi-ve-muteahhitlik',
  // Temizlik
  'hali-yikama',
  'temizlik-sirketleri-ofis-ve-ev-temizligi',
  'kuru-temizleme',
  // Nakliyat
  'evden-eve-nakliyat',
  'sehirlerarasi-nakliyat',
  // Yemek
  'restoranlar',
  'kafeler-ve-kahvehaneler',
  'pastaneler',
  // Reklam & Organizasyon
  'fotografcilar-fotograf-studyolari',
  'parti-ve-dugun-organizasyonu',
  'dugun-salonlari-ve-evlendirme-daireleri',
  'matbaacilar',
  'tabela-ve-reklam',
  // Eğitim
  'ozel-ders',
  'surucu-kurslari',
  // Mobilya
  'mobilyacilar',
  'mutfak-dolap-imalati',
];

// ─── Türkiye'nin büyük şehirleri ───
const CITIES = [
  'istanbul', 'ankara', 'izmir', 'bursa', 'antalya',
  'adana', 'konya', 'gaziantep', 'kocaeli', 'mersin',
  'kayseri', 'eskisehir', 'diyarbakir', 'samsun', 'denizli',
  'sakarya', 'trabzon', 'malatya', 'manisa', 'balikesir',
  '' // boş = tüm Türkiye
];

async function main() {
  console.log('🚀 Bulurum.com Genişletilmiş Tarama Başlatılıyor...');
  console.log(`📊 ${CATEGORIES.length} kategori × ${CITIES.length} şehir = max ${CATEGORIES.length * CITIES.length} sayfa`);

  const portalDir = path.resolve(__dirname, '../portal');
  const existingPhones = new Set();

  // Mevcut tüm telefonları yükle
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

  const collectedLeads = [];
  let totalRequests = 0;
  let failedRequests = 0;

  for (const cat of CATEGORIES) {
    console.log(`\n📂 [${cat}]`);
    let catTotal = 0;

    for (const city of CITIES) {
      const cityLabel = city ? city.toUpperCase() : 'TÜM TR';
      
      try {
        totalRequests++;
        const leads = await scrapeBulurumCategory(cat, city, 1);
        
        if (!leads || leads.length === 0) {
          // Small delay even on empty
          await new Promise(r => setTimeout(r, 200));
          continue;
        }

        let added = 0;
        for (const item of leads) {
          const ph = (item.phone || '').replace(/\D/g, '');
          if (ph && !existingPhones.has(ph)) {
            existingPhones.add(ph);
            collectedLeads.push(item);
            added++;
            catTotal++;
          }
        }

        if (added > 0) {
          console.log(`   ${cityLabel}: +${added} yeni (${leads.length} toplam, ${leads.length - added} mükerrer/mevcut)`);
        }

        // Rate limiting — her istek arası bekleme
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        failedRequests++;
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    if (catTotal > 0) {
      console.log(`   ✅ [${cat}] → +${catTotal} yeni firma`);
    }

    // Her 100 request'te ara kayıt yap
    if (totalRequests % 100 === 0 && collectedLeads.length > 0) {
      console.log(`\n💾 Ara kayıt: ${collectedLeads.length} yeni lead (${totalRequests} istek tamamlandı)`);
      saveLeads(collectedLeads, portalDir);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 TARAMA TAMAMLANDI!`);
  console.log(`📊 Toplam istek: ${totalRequests} (${failedRequests} başarısız)`);
  console.log(`📊 Toplam yeni lead: ${collectedLeads.length}`);

  if (collectedLeads.length > 0) {
    saveLeads(collectedLeads, portalDir);
  }
}

function saveLeads(newLeads, portalDir) {
  const manualFile = path.join(portalDir, 'leads_manual.json');
  let currentManual = [];
  if (fs.existsSync(manualFile)) {
    try {
      currentManual = JSON.parse(fs.readFileSync(manualFile, 'utf8'));
    } catch (e) { currentManual = []; }
  }

  // Dedup by phone
  const existingPhones = new Set(currentManual.map(l => (l.phone || '').replace(/\D/g, '')));
  const uniqueNew = newLeads.filter(l => {
    const ph = (l.phone || '').replace(/\D/g, '');
    if (!ph || existingPhones.has(ph)) return false;
    existingPhones.add(ph);
    return true;
  });

  const updated = [...uniqueNew, ...currentManual];
  fs.writeFileSync(manualFile, JSON.stringify(updated, null, 2));
  console.log(`✅ leads_manual.json güncellendi! Eklenen: ${uniqueNew.length} | Toplam: ${updated.length}`);
}

main().catch(console.error);
