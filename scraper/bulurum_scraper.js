const fs = require('fs');

function normalizeSector(category, name) {
  const text = ((category || '') + ' ' + (name || '')).toLowerCase();

  if (text.match(/oto|araç|araba|lastik|kaporta|tamirhane|çekici|kurtarma|rent a car|kiralama|egzoz|yedek parça|servisi/)) return 'Otomotiv & Araç Servisi';
  if (text.match(/güzellik|kuaför|berber|tırnak|cilt|estetik|masaj|lazer|saç|makyaj/)) return 'Güzellik, Kuaför & Bakım';
  if (text.match(/avukat|hukuk|icra|danışmanlık|arabuluculuk|hukuki|barosu|dava/)) return 'Hukuk & Avukatlık';
  if (text.match(/muhasebe|mali müşavir|smm|denetim|yeminli mali|defter/)) return 'Mali Müşavirlik & Muhasebe';
  if (text.match(/diş|hastane|klinik|doktor|psikolog|diyetisyen|fizyoterapi|tıp|sağlık|optik|eczane|ortodonti/)) return 'Sağlık, Klinik & Doktor';
  if (text.match(/veteriner|pet shop|hayvan|köpek|kedi/)) return 'Veterinerlik & Pet';
  if (text.match(/elektrik|tesisat|kombi|klima|çilingir|tamir|ustas|boya|badana|dekorasyon|tadilat/)) return 'Teknik Servis, Tesisat & Usta';
  if (text.match(/mobilya|marangoz|imalat|ahşap|mutfak dolap|koltuk|döşeme/)) return 'Mobilya & İmalat';
  if (text.match(/sigorta|acent|kasko|emeklilik|reassürans/)) return 'Sigorta & Aracılık';
  if (text.match(/temizlik|halı yıkama|koltuk yıkama|kuru temizleme|lostra|yıkama/)) return 'Temizlik & Halı Yıkama';
  if (text.match(/emlak|gayrimenkul|arsa|konut|realty/)) return 'Emlak & Gayrimenkul';
  if (text.match(/inşaat|mimarlık|mühendislik|harita|proje|müteahhit|yapı/)) return 'İnşaat & Mimarlık';
  if (text.match(/restoran|lokanta|kafe|cafe|kebap|pizza|burger|tatlı|pastane|fırın|çiğköfte|lezzet|döner|yemek/)) return 'Yeme, İçme & Restoran';
  if (text.match(/nakliyat|lojistik|kargo|kurye|taşımacılık|vinç|forklift/)) return 'Nakliyat, Lojistik & Vinç';
  if (text.match(/reklam|ajans|matbaa|baskı|tabela|promosyon|organizasyon|düğün|fotoğraf/)) return 'Reklam, Matbaa & Organizasyon';
  if (text.match(/kurs|eğitim|sürücü kursu|özel ders|okul|kreş|anaokulu/)) return 'Eğitim & Kurslar';
  if (text.match(/otel|pansiyon|turizm|seyahat|gezi/)) return 'Turizm & Konaklama';
  
  return 'Diğer Hizmetler';
}

function decodeHtml(html) {
  if (!html) return '';
  return html
    .replace(/&#220;/g, 'Ü').replace(/&#252;/g, 'ü')
    .replace(/&#214;/g, 'Ö').replace(/&#246;/g, 'ö')
    .replace(/&#199;/g, 'Ç').replace(/&#231;/g, 'ç')
    .replace(/&#304;/g, 'İ').replace(/&#305;/g, 'ı')
    .replace(/&#350;/g, 'Ş').replace(/&#351;/g, 'ş')
    .replace(/&#286;/g, 'Ğ').replace(/&#287;/g, 'ğ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function normalizePhone(raw) {
  if (!raw) return '';
  let phone = raw.replace(/[^0-9]/g, '').trim();
  if (!phone || phone.length < 10) return '';
  if (phone.startsWith('90') && phone.length === 12) phone = '0' + phone.slice(2);
  if (phone.startsWith('9') && phone.length === 11 && !phone.startsWith('90')) return '';
  if (!phone.startsWith('0') && phone.length === 10) phone = '0' + phone;
  if (phone.length !== 11) return '';
  return phone;
}

// ───────────── MODE A: Schema.org HTML Parsing ─────────────
function parseSchemaLeads(html, catSlug, city) {
  const blocks = html.split(/itemtype="https?:\/\/schema\.org\/LocalBusiness"/i);
  blocks.shift(); // remove first chunk before any match
  
  const leads = [];
  
  for (const block of blocks) {
    // 1. Skip if has external website
    const urlMatch = block.match(/itemprop="url"\s+content="(https?:\/\/[^"]+)"/i);
    if (urlMatch && !urlMatch[1].includes('bulurum.com')) continue;

    // 2. Company Name
    const nameMatch = block.match(/itemprop="name"[^>]*>([\s\S]*?)<\/h2>/i) ||
                      block.match(/itemprop="name"[^>]*>([\s\S]*?)<\//i);
    let name = nameMatch ? decodeHtml(nameMatch[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '';
    name = name.replace(/\([^)]*\)/g, '').trim();
    if (!name || name.length < 3) continue;

    // 3. Phone
    const phoneMatch = block.match(/itemprop="telephone"[^>]*>([\s\S]*?)<\//i);
    const phone = normalizePhone(phoneMatch ? phoneMatch[1] : '');
    if (!phone) continue;

    // 4. City & District
    const localityMatch = block.match(/itemprop="addressLocality"\s+content="([^"]+)"/i) ||
                          block.match(/itemprop="addressLocality"[^>]*>([\s\S]*?)<\//i);
    let district = localityMatch ? decodeHtml(localityMatch[1].replace(/<[^>]+>/g, '')).trim() : '';

    const regionMatch = block.match(/itemprop="addressRegion"\s+content="([^"]+)"/i) ||
                        block.match(/itemprop="addressRegion"[^>]*>([\s\S]*?)<\//i);
    let extractedCity = regionMatch ? decodeHtml(regionMatch[1].replace(/<[^>]+>/g, '')).trim() : '';

    if (!extractedCity && city) extractedCity = city.charAt(0).toUpperCase() + city.slice(1);
    if (!extractedCity) extractedCity = 'İstanbul';

    // 5. Address
    const addrMatch = block.match(/itemprop="streetAddress"[^>]*>([\s\S]*?)<\//i);
    let address = addrMatch ? decodeHtml(addrMatch[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : `${district}, ${extractedCity}`;

    leads.push({
      id: `blm_${phone}`,
      name, phone, city: extractedCity,
      district: district || 'Merkez',
      category: normalizeSector(catSlug.replace(/-/g, ' '), name),
      address, rating: 4.8, reviews_count: 0,
      has_website: 0, status: 'Aranacak', source: 'Bulurum'
    });
  }
  
  return leads;
}

// ───────────── MODE B: Embedded JSON Parsing ─────────────
function parseJsonLeads(html, catSlug, city) {
  // Extract mapInfo.results = [...];
  const match = html.match(/mapInfo\.results\s*=\s*(\[[\s\S]*?\]);\s/);
  if (!match) return [];
  
  let items;
  try {
    items = JSON.parse(match[1]);
  } catch {
    return [];
  }
  
  const leads = [];
  
  for (const item of items) {
    // Skip if has website
    if (item.CompanyWebsite) continue;
    
    const name = (item.CompanyName || '').replace(/\([^)]*\)/g, '').trim();
    if (!name || name.length < 3) continue;
    
    // Try phone from JSON
    let phone = normalizePhone(item.CompanyPhone);
    
    // Extract city from address
    let extractedCity = city ? city.charAt(0).toUpperCase() + city.slice(1) : '';
    let district = '';
    
    if (item.Address) {
      // Address often ends with "İlçe, İl" format
      const parts = item.Address.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        extractedCity = parts[parts.length - 1] || extractedCity;
        district = parts[parts.length - 2] || '';
      }
    }
    if (!extractedCity) extractedCity = 'İstanbul';
    
    leads.push({
      id: `blm_${phone || 'nophone_' + name.replace(/\s/g, '_').substring(0, 20)}`,
      name, phone, city: extractedCity,
      district: district || 'Merkez',
      category: normalizeSector(catSlug.replace(/-/g, ' '), name),
      address: item.Address || `${district}, ${extractedCity}`,
      rating: 4.8, reviews_count: 0,
      has_website: 0, status: 'Aranacak', source: 'Bulurum',
      detailUrl: item.DetailUrl || ''
    });
  }
  
  return leads;
}

// ───────────── Detay sayfasından telefon çekme ─────────────
async function fetchPhoneFromDetail(detailUrl) {
  try {
    const res = await fetch(detailUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    if (!res.ok) return '';
    const html = await res.text();
    
    // Try class="phone" first (most reliable)
    const phoneClassMatch = html.match(/class="[^"]*phone[^"]*"[^>]*>\s*([\d\s]+)/i);
    if (phoneClassMatch) return normalizePhone(phoneClassMatch[1]);
    
    // Try itemprop="telephone"
    const telMatch = html.match(/itemprop="telephone"[^>]*>([^<]+)/i);
    if (telMatch) return normalizePhone(telMatch[1]);
    
    // Try tel: link
    const telLink = html.match(/href="tel:([^"]+)"/i);
    if (telLink) return normalizePhone(telLink[1]);
    
    return '';
  } catch {
    return '';
  }
}

// ───────────── ANA FONKSİYON: İki modu birleştir ─────────────
async function scrapeBulurumCategory(catSlug, city = '', page = 1) {
  let url = `https://www.bulurum.com/dir/${catSlug}/`;
  if (city) url += `${city}/`;
  if (page > 1) url += `?page=${page}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) return [];

    const html = await res.text();
    
    // 1. Schema.org parsing (gets firms with phone already in HTML)
    const schemaLeads = parseSchemaLeads(html, catSlug, city);
    
    // 2. Embedded JSON parsing (gets additional firms, some without phone)
    const jsonLeads = parseJsonLeads(html, catSlug, city);
    
    // 3. Merge: Schema leads take priority (they have phone). 
    //    Add JSON leads that aren't already in schema leads.
    const phoneSet = new Set(schemaLeads.map(l => l.phone).filter(Boolean));
    const nameSet = new Set(schemaLeads.map(l => l.name.toLowerCase()));
    
    const needsPhone = []; // JSON leads without phone that have a detail URL
    
    for (const jl of jsonLeads) {
      if (jl.phone && phoneSet.has(jl.phone)) continue;
      if (nameSet.has(jl.name.toLowerCase())) continue;
      
      if (jl.phone) {
        schemaLeads.push(jl);
        phoneSet.add(jl.phone);
      } else if (jl.detailUrl) {
        needsPhone.push(jl);
      }
    }
    
    // 4. Fetch phone from detail pages for leads without phone (batch, with delay)
    for (const lead of needsPhone) {
      const phone = await fetchPhoneFromDetail(lead.detailUrl);
      if (phone && !phoneSet.has(phone)) {
        lead.phone = phone;
        lead.id = `blm_${phone}`;
        delete lead.detailUrl;
        schemaLeads.push(lead);
        phoneSet.add(phone);
      }
      // Small delay to not hammer the server
      await new Promise(r => setTimeout(r, 200));
    }
    
    // Clean up detailUrl from all leads
    for (const lead of schemaLeads) {
      delete lead.detailUrl;
    }
    
    return schemaLeads;
  } catch (err) {
    return [];
  }
}

// ───────────── Toplam sayfa sayısını bul ─────────────
async function getMaxPages(catSlug, city = '') {
  let url = `https://www.bulurum.com/dir/${catSlug}/`;
  if (city) url += `${city}/`;
  
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) return 1;
    const html = await res.text();
    
    // Find all page= links
    const pages = html.match(/page=(\d+)/g);
    if (!pages) return 1;
    
    let max = 1;
    for (const p of pages) {
      const num = parseInt(p.replace('page=', ''));
      if (num > max) max = num;
    }
    return max;
  } catch {
    return 1;
  }
}

module.exports = { scrapeBulurumCategory, getMaxPages };
