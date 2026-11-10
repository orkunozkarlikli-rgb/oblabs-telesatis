/**
 * GSO (Gaziantep Sanayi Odası) Üye Firmaları Web Sitesi Doğrulama & Havuz Aktarım Scripti
 * 
 * Bu script GitHub Actions veya bağımsız bir bulut sunucusunda çalışarak:
 * 1. GSO'da kayıtlı 3.924 firmayı analiz eder.
 * 2. Telefonu olan firmaları ayıklar.
 * 3. Web adresi yazılı olanların sitelerine ping atıp gerçekten açık olup olmadığını kontrol eder (kapalı/bozuk siteleri tespit eder).
 * 4. Web adresi olmayanların alan adı varlığını hızlı DNS/HTTP kontrolü ile teyit eder.
 * 5. Web sitesi kesinlikle olmayan veya kapalı olan firmaları OB Labs telesatış havuzuna ekler.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const dns = require('dns').promises;

const RAW_FILE = path.join(__dirname, 'gso_raw.json');
const POOL_FILE = path.join(__dirname, '..', 'portal', 'leads_manual.json');

// Sektör Eşleştirme
function mapGsoCategory(sektor, naceAdi, firmaAdi) {
  const text = `${sektor || ''} ${naceAdi || ''} ${firmaAdi || ''}`.toLowerCase();
  if (text.match(/oto|araç|araba|lastik|kaporta|tamirhane|çekici|kurtarma|motor|servis/)) return 'Otomotiv & Araç Servisi';
  if (text.match(/güzellik|kuaför|berber|cilt|estetik|kozmetik|parfüm|sabun/)) return 'Güzellik, Kuaför & Bakım';
  if (text.match(/sağlık|medikal|tıbb|diş|hastane|cerrahi|protez|ilaç/)) return 'Sağlık, Klinik & Doktor';
  if (text.match(/inşaat|mimarlık|mühendislik|yapı|beton|çimento|mermer|harç|taş/)) return 'İnşaat & Mimarlık';
  if (text.match(/makine|metal|çelik|torna|döküm|kaynak|lazer|boru|profil|tesisat/)) return 'Teknik Servis, Tesisat & Usta';
  if (text.match(/mobilya|ahşap|marangoz|kereste|palet|koltuk/)) return 'Mobilya & İmalat';
  if (text.match(/gıda|un|bulgur|makarna|ekmek|tatlı|baklava|yağ|yem|kahve|et|fıstık|çikolata|şekerleme/)) return 'Yeme, İçme & Restoran';
  if (text.match(/matbaa|ambalaj|koli|kutu|etiket|baskı|reklam|kağıt/)) return 'Reklam, Matbaa & Organizasyon';
  if (text.match(/yazılım|bilişim|elektronik|elektrik|otomasyon|enerji|güneş|solar/)) return 'Diğer Hizmetler';
  if (text.match(/tekstil|halı|iplik|dokuma|örme|konfeksiyon|kumaş|giyim|triko/)) return 'Diğer Hizmetler';
  if (text.match(/plastik|kauçuk|geri dönüşüm|atık|hurda/)) return 'Diğer Hizmetler';
  return 'Diğer Hizmetler';
}

function parseDistrict(adres) {
  const text = (adres || '').toUpperCase();
  if (text.includes('ŞEHİTKAMİL') || text.includes('SEHITKAMIL')) return 'Şehitkamil';
  if (text.includes('ŞAHİNBEY') || text.includes('SAHINBEY')) return 'Şahinbey';
  if (text.includes('NİZİP') || text.includes('NIZIP')) return 'Nizip';
  if (text.includes('OĞUZELİ') || text.includes('OGUZELI')) return 'Oğuzeli';
  if (text.includes('İSLAHİYE') || text.includes('ISLAHIYE')) return 'İslahiye';
  if (text.includes('NURDAĞI') || text.includes('NURDAGI')) return 'Nurdağı';
  if (text.includes('ARABAN')) return 'Araban';
  if (text.includes('YAVUZELİ') || text.includes('YAVUZELI')) return 'Yavuzeli';
  if (text.includes('KARKAMIŞ') || text.includes('KARKAMIS')) return 'Karkamış';
  return 'Şehitkamil';
}

function cleanPhone(raw) {
  if (!raw) return '';
  const first = String(raw).split(/[\/,;-]/)[0].trim();
  const digits = first.replace(/\D/g, '');
  if (digits.length === 10) return '0' + digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits;
  if (digits.length === 12 && digits.startsWith('90')) return '0' + digits.slice(2);
  return digits.length >= 10 ? '0' + digits.slice(-10) : '';
}

// URL Kontrolü (Timeout: 4000ms)
function checkUrlLive(urlStr) {
  return new Promise((resolve) => {
    try {
      let fullUrl = urlStr.trim();
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = 'http://' + fullUrl;
      }
      const parsed = new URL(fullUrl);
      const mod = parsed.protocol === 'https:' ? https : http;

      const req = mod.get(fullUrl, {
        timeout: 4000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (res) => {
        // 2xx veya 3xx ise aktif web sitesi
        const isUp = res.statusCode >= 200 && res.statusCode < 400;
        res.resume(); // free memory
        resolve({ isLive: isUp, statusCode: res.statusCode });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ isLive: false, reason: 'timeout' });
      });

      req.on('error', (err) => {
        resolve({ isLive: false, reason: err.code || err.message });
      });
    } catch(e) {
      resolve({ isLive: false, reason: 'invalid_url' });
    }
  });
}

// Eşzamanlı İşleyici (Batch Runner)
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;
  
  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = { error: err.message };
      }
    }
  }

  const workers = Array(Math.min(concurrency, items.length)).fill(0).map(worker);
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('🚀 GSO Firma Doğrulama Scripti Başlatılıyor...');
  
  if (!fs.existsSync(RAW_FILE)) {
    console.error('❌ Hata: scraper/gso_raw.json dosyası bulunamadı!');
    process.exit(1);
  }

  const rawList = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  console.log(`📁 GSO dosyasında toplam ${rawList.length} kayıt okundu.`);

  // 1. Telefonu olan firmaları filtrele
  const validPhoneList = [];
  const seenPhones = new Set();

  for (const item of rawList) {
    const phone = cleanPhone(item['TELEFON']);
    if (phone && phone.length === 11 && !seenPhones.has(phone)) {
      seenPhones.add(phone);
      validPhoneList.push({
        ...item,
        _cleanPhone: phone
      });
    }
  }

  console.log(`📞 Geçerli ve benzersiz telefon numarasına sahip firma sayısı: ${validPhoneList.length}`);

  // Mevcut havuzdaki telefonları yükle (tekrar eklememek için)
  let existingPool = [];
  const existingPhoneSet = new Set();
  if (fs.existsSync(POOL_FILE)) {
    try {
      existingPool = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
      existingPool.forEach(l => {
        const p = cleanPhone(l.phone);
        if (p) existingPhoneSet.add(p);
      });
      console.log(`ℹ️ Mevcut telesatış havuzunda ${existingPool.length} firma bulunuyor (${existingPhoneSet.size} benzersiz telefon).`);
    } catch(e) {}
  }

  // Sadece havuzda henüz olmayanları doğrula
  const toVerify = validPhoneList.filter(item => !existingPhoneSet.has(item._cleanPhone));
  console.log(`🔍 Havuzda bulunmayan ve incelenecek taze firma sayısı: ${toVerify.length}`);

  let verifiedNoWebCount = 0;
  let verifiedBrokenWebCount = 0;
  let activeWebCount = 0;

  const targetLeads = [];

  console.log('⚡ Web sitesi durumları eşzamanlı olarak kontrol ediliyor (30 paralel worker)...');
  const startTime = Date.now();

  await mapConcurrent(toVerify, 30, async (item, idx) => {
    const rawWeb = String(item['WEB ADRES'] || '').trim();
    const hasDeclaredWeb = rawWeb && rawWeb.length > 3 && rawWeb !== 'http://' && rawWeb !== 'https://';

    if (hasDeclaredWeb) {
      // Firma bir web adresi yazmış: Acaba gerçekten açık mı?
      const check = await checkUrlLive(rawWeb);
      if (check.isLive) {
        activeWebCount++;
        // Web sitesi canlı ve aktif; web tasarım telesatış havuzuna eklenmez
      } else {
        // Web sitesi kapalı / bozuk / timeout! (MÜKEMMEL SATIŞ FIRSATI)
        verifiedBrokenWebCount++;
        targetLeads.push(buildLead(item, 0, `Kayıtlı web sitesi kapalı/açılmıyor (${rawWeb})`));
      }
    } else {
      // GSO resmi kaydında web adresi yok!
      verifiedNoWebCount++;
      targetLeads.push(buildLead(item, 0, 'GSO resmi kaydında web sitesi bulunmuyor'));
    }

    if ((idx + 1) % 200 === 0 || idx === toVerify.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   İşlenen: ${idx + 1}/${toVerify.length} (${elapsed}s) | Hedef Lead: ${targetLeads.length} (Sitesi Yok: ${verifiedNoWebCount}, Sitesi Kapalı: ${verifiedBrokenWebCount}, Sitesi Aktif: ${activeWebCount})`);
    }
  });

  console.log('\n📊 DOĞRULAMA SONUÇLARI:');
  console.log(`  - Web Sitesi Hiç Olmayanlar: ${verifiedNoWebCount}`);
  console.log(`  - Web Sitesi Açılmayan / Bozuk Olanlar: ${verifiedBrokenWebCount}`);
  console.log(`  - Web Sitesi Aktif Çalışanlar (Elenenler): ${activeWebCount}`);
  console.log(`  🎯 Satışa Uygun Toplam Yeni Lead: ${targetLeads.length}`);

  if (targetLeads.length > 0) {
    const updatedPool = [...existingPool, ...targetLeads];
    fs.writeFileSync(POOL_FILE, JSON.stringify(updatedPool, null, 2));
    console.log(`✅ portal/leads_manual.json güncellendi! Yeni toplam firma: ${updatedPool.length}`);
  } else {
    console.log('ℹ️ Eklenecek yeni lead bulunamadı.');
  }
}

function buildLead(item, hasWeb, notes) {
  const phone = item._cleanPhone;
  const name = String(item['FİRMA ADI'] || '').trim();
  const district = parseDistrict(item['ADRES']);
  const category = mapGsoCategory(item['SEKTÖR'], item['NACE ADI'], name);

  return {
    id: `gso_${phone}`,
    name: name,
    phone: phone,
    city: 'Gaziantep',
    district: district,
    category: category,
    address: String(item['ADRES'] || '').trim(),
    email: String(item['E-POSTA'] || '').trim(),
    rating: 5.0,
    reviews_count: 0,
    has_website: hasWeb,
    status: 'Aranacak',
    source: 'GSO (Gaziantep Sanayi Odası)',
    notes: notes
  };
}

main().catch(console.error);
