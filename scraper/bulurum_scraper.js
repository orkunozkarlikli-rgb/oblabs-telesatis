const fs = require('fs');

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

async function scrapeBulurumCategory(catSlug, city = '', page = 1) {
  let url = `https://www.bulurum.com/dir/${catSlug}/`;
  if (city) {
    url += `${city}/`;
  }
  if (page > 1) {
    url += `?page=${page}`;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      return [];
    }

    const html = await res.text();
    const blocks = html.split(/itemtype="https?:\/\/schema\.org\/LocalBusiness"/i);
    blocks.shift();

    const leads = [];

    for (const block of blocks) {
      // 1. Web sitesi kontrolü: Harici web sitesi varsa ATLA (sadece web sitesi olmayanları alıyoruz)
      const urlMatch = block.match(/itemprop="url"\s+content="(https?:\/\/[^"]+)"/i);
      if (urlMatch && !urlMatch[1].includes('bulurum.com')) {
        continue;
      }

      // 2. Firma Adı
      const nameMatch = block.match(/itemprop="name"[^>]*>([\s\S]*?)<\/h2>/i) ||
                        block.match(/itemprop="name"[^>]*>([\s\S]*?)<\//i);
      let name = nameMatch ? decodeHtml(nameMatch[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '';
      name = name.replace(/\([^)]*\)/g, '').trim();
      if (!name || name.length < 3) continue;

      // 3. Telefon
      const phoneMatch = block.match(/itemprop="telephone"[^>]*>([\s\S]*?)<\//i);
      let phone = phoneMatch ? phoneMatch[1].replace(/[^0-9]/g, '').trim() : '';
      if (!phone || phone.length < 10) continue;
      if (phone.startsWith('90')) phone = '0' + phone.slice(2);
      if (!phone.startsWith('0')) phone = '0' + phone;

      // 4. Şehir ve İlçe
      const localityMatch = block.match(/itemprop="addressLocality"\s+content="([^"]+)"/i) ||
                            block.match(/itemprop="addressLocality"[^>]*>([\s\S]*?)<\//i);
      let district = localityMatch ? decodeHtml(localityMatch[1].replace(/<[^>]+>/g, '')).trim() : '';

      const regionMatch = block.match(/itemprop="addressRegion"\s+content="([^"]+)"/i) ||
                          block.match(/itemprop="addressRegion"[^>]*>([\s\S]*?)<\//i);
      let extractedCity = regionMatch ? decodeHtml(regionMatch[1].replace(/<[^>]+>/g, '')).trim() : '';

      if (!extractedCity && city) {
        extractedCity = city.charAt(0).toUpperCase() + city.slice(1);
      }
      if (!extractedCity && district.includes('Merkez')) {
        extractedCity = district.replace('Merkez', '').trim();
      }
      if (!extractedCity) extractedCity = 'İstanbul';

      // 5. Adres
      const addrMatch = block.match(/itemprop="streetAddress"[^>]*>([\s\S]*?)<\//i);
      let address = addrMatch ? decodeHtml(addrMatch[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : `${district}, ${extractedCity}`;

      leads.push({
        id: `blm_${phone}`,
        name: name,
        phone: phone,
        city: extractedCity,
        district: district || 'Merkez',
        category: 'Güzellik, Kuaför & Bakım',
        address: address,
        rating: 4.8,
        reviews_count: 0,
        has_website: 0,
        status: 'Aranacak',
        source: 'Bulurum'
      });
    }

    return leads;
  } catch (err) {
    return [];
  }
}

module.exports = { scrapeBulurumCategory };
