const fs = require('fs');
const path = require('path');

// 18 temiz ana sektör normalizasyonu
function normalizeSector(category, name) {
  const text = ((category || '') + ' ' + (name || '')).toLowerCase();

  if (text.match(/oto|araç|araba|lastik|kaporta|tamir|çekici|kurtarma|rent a car|kiralama|egzoz|yedek parça|servisi/)) return 'Otomotiv & Araç Servisi';
  if (text.match(/güzellik|kuaför|berber|tırnak|cilt|estetik|masaj|lazer|saç|makyaj|kozmetik/)) return 'Güzellik, Kuaför & Bakım';
  if (text.match(/avukat|hukuk|icra|danışmanlık|arabuluculuk|hukuki|baro|dava/)) return 'Hukuk & Avukatlık';
  if (text.match(/muhasebe|mali müşavir|smm|denetim|yeminli mali|defter/)) return 'Mali Müşavirlik & Muhasebe';
  if (text.match(/diş|hastane|klinik|doktor|psikolog|diyetisyen|fizyoterapi|tıp|sağlık|optik|eczane|ortodonti|medikal/)) return 'Sağlık, Klinik & Doktor';
  if (text.match(/veteriner|pet shop|hayvan|köpek|kedi/)) return 'Veterinerlik & Pet';
  if (text.match(/elektrik|tesisat|kombi|klima|çilingir|tamir|usta|boya|badana|dekorasyon|tadilat|hırdavat|ısıtma|soğutma/)) return 'Teknik Servis, Tesisat & Usta';
  if (text.match(/mobilya|marangoz|imalat|ahşap|mutfak dolap|koltuk|döşeme|ahşap tasarım/)) return 'Mobilya & İmalat';
  if (text.match(/sigorta|acent|kasko|emeklilik|reassürans/)) return 'Sigorta & Aracılık';
  if (text.match(/temizlik|halı yıkama|koltuk yıkama|kuru temizleme|lostra|yıkama|hijyen/)) return 'Temizlik & Halı Yıkama';
  if (text.match(/emlak|gayrimenkul|arsa|konut|realty/)) return 'Emlak & Gayrimenkul';
  if (text.match(/inşaat|mimarlık|mühendislik|harita|proje|müteahhit|yapı/)) return 'İnşaat & Mimarlık';
  if (text.match(/restoran|lokanta|kafe|cafe|kebap|pizza|burger|tatlı|pastane|fırın|çiğköfte|lezzet|döner|yemek|gıda/)) return 'Yeme, İçme & Restoran';
  if (text.match(/nakliyat|lojistik|kargo|kurye|taşımacılık|vinç|forklift|denizcilik|taşıma/)) return 'Nakliyat, Lojistik & Vinç';
  if (text.match(/reklam|ajans|matbaa|baskı|tabela|promosyon|organizasyon|düğün|fotoğraf|basım/)) return 'Reklam, Matbaa & Organizasyon';
  if (text.match(/kurs|eğitim|sürücü kursu|özel ders|okul|kreş|anaokulu/)) return 'Eğitim & Kurslar';
  if (text.match(/otel|pansiyon|turizm|seyahat|gezi/)) return 'Turizm & Konaklama';
  
  return 'Diğer Hizmetler';
}

function normalizePhone(raw) {
  if (!raw) return '';
  let phone = raw.replace(/\D/g, '').trim();
  if (phone.startsWith('90') && phone.length === 12) phone = '0' + phone.slice(2);
  if (!phone.startsWith('0') && phone.length === 10) phone = '0' + phone;
  if (phone.length !== 11) return '';
  if (!phone.match(/^0[2-58]\d{9}$/)) return '';
  return phone;
}

// Tüm 42 sektör
const SECTORS = [
  'zb-guzellik-kozmetik',
  'kb-otomotiv',
  'kk-mobilya',
  'fr-dekorasyon',
  'bf-tesisat',
  'tz-isitma-sogutma',
  'rk-elektrik-elektronik',
  'bk-yapi-insaat',
  'rb-emlak',
  'yt-saglik',
  'tf-hukuk',
  'yc-sigorta',
  'bm-temizlik-hijyen',
  'by-yemek',
  'zc-gida',
  'cz-tasima-lojistik',
  'yf-reklam',
  'mk-basim-yayin',
  'rd-egitim',
  'br-turizm',
  'cy-tekstil-giyim',
  'kt-moda',
  'md-alisveris',
  'fm-danismanlik',
  'mr-ambalaj',
  'mb-bilgisayar-bilisim',
  'kd-makine',
  'kr-metal',
  'tm-hirdavat',
  'tt-kimya-plastik',
  'tk-kultur-sanat',
  'cm-tarim-hayvancilik',
  'bd-telekomunikasyon',
  'tr-ithalat-ihracat',
  'zf-enerji',
  'zt-finans',
  'rr-eglence',
  'fz-denizcilik',
  'fy-dericilik-ayakkabi',
  'bb-diger-sektorler'
];

async function main() {
  const targetLeadCount = parseInt(process.env.TARGET_LEADS || '2000', 10);
  console.log(`🚀 Firmaseç Veri Toplama Başlatılıyor (Hedef: ${targetLeadCount} yeni firma)...`);

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

  const collectedLeads = [];
  const maxPagesPerSector = 10; // Doğru URL formatı: /firmalar/slug/sayfaNo

  for (const sectorSlug of SECTORS) {
    if (collectedLeads.length >= targetLeadCount) break;

    console.log(`\n📂 Sektör taranıyor: [${sectorSlug}]`);
    let sectorAdded = 0;

    for (let page = 1; page <= maxPagesPerSector; page++) {
      if (collectedLeads.length >= targetLeadCount) break;

      const pageUrl = page === 1 
        ? `https://www.firmasec.com/firmalar/${sectorSlug}`
        : `https://www.firmasec.com/firmalar/${sectorSlug}/${page}`;

      try {
        const res = await fetch(pageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(10000)
        });

        if (!res.ok) break;

        const html = await res.text();
        const links = html.match(/href="(https:\/\/www\.firmasec\.com\/firma\/[a-z0-9-]+)"/gi) || [];
        const firmUrls = [...new Set(links.map(l => l.replace('href="', '').replace('"', '')))]
          .filter(u => !u.endsWith('/ekle') && !u.includes('/ara/'));

        if (firmUrls.length === 0) break;

        let pageAdded = 0;
        for (const fUrl of firmUrls) {
          if (collectedLeads.length >= targetLeadCount) break;

          try {
            const fRes = await fetch(fUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              signal: AbortSignal.timeout(8000)
            });

            if (!fRes.ok) continue;

            const fHtml = await fRes.text();

            // JSON-LD Schema extraction
            const jsonMatch = fHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i) ||
                              fHtml.match(/\{"@context":"https:\\\/\\\/schema\.org"[\s\S]*?"@type":"LocalBusiness"[\s\S]*?\}/);

            if (!jsonMatch) continue;

            let data;
            try {
              data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } catch(e) {
              continue;
            }

            // Web sitesi kontrolü
            const urlVal = data.url || '';
            const hasExternalWeb = urlVal && !urlVal.includes('firmasec.com');
            const hasWebInText = fHtml.includes('Web Sitesi') && /href="https?:\/\/(?!www\.firmasec|twitter|facebook|instagram)[a-z0-9-.]+\.(?:com|net|org|com\.tr)/i.test(fHtml);

            if (hasExternalWeb || hasWebInText) continue;

            // Telefon kontrolü
            const phone = normalizePhone(data.telephone || '');
            if (!phone || existingPhones.has(phone)) continue;

            // İsim kontrolü
            let name = (data.name || '').replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
            if (!name || name.length < 3) continue;

            // İl ve İlçe
            const addrObj = data.address || {};
            let city = (addrObj.addressRegion || '').trim();
            let district = (addrObj.addressLocality || '').trim();
            const street = (addrObj.streetAddress || '').trim();

            if (!city && street) {
              const parts = street.split('/');
              if (parts.length >= 2) {
                city = parts[parts.length - 2].trim();
                district = parts[parts.length - 1].trim();
              }
            }
            if (!city) city = 'İstanbul';
            if (!district) district = 'Merkez';

            city = city.charAt(0).toLocaleUpperCase('tr-TR') + city.slice(1).toLocaleLowerCase('tr-TR');
            district = district.charAt(0).toLocaleUpperCase('tr-TR') + district.slice(1).toLocaleLowerCase('tr-TR');

            const fullAddress = street ? `${street}, ${district}/${city}` : `${district}, ${city}`;
            const sectorName = data.department || sectorSlug.replace(/^[a-z]+-/, '').replace(/-/g, ' ');
            const cleanCategory = normalizeSector(sectorName, name);

            const lead = {
              id: `fsc_${phone}`,
              name,
              phone,
              city,
              district,
              category: cleanCategory,
              address: fullAddress,
              rating: 4.9,
              reviews_count: 0,
              has_website: 0,
              status: 'Aranacak',
              source: 'Firmaseç'
            };

            existingPhones.add(phone);
            collectedLeads.push(lead);
            sectorAdded++;
            pageAdded++;

            await new Promise(r => setTimeout(r, 80));
          } catch(err) {
            continue;
          }
        }

        if (pageAdded > 0) {
          console.log(`   Sayfa ${page}: +${pageAdded} yeni (Toplam bu sektörde: +${sectorAdded} | Genel toplam: ${collectedLeads.length})`);
        }
        await new Promise(r => setTimeout(r, 200));
      } catch(err) {
        break;
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 TOPLAMA TAMAMLANDI! Toplam ${collectedLeads.length} yeni firma toplandı.`);
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
}

main().catch(console.error);
