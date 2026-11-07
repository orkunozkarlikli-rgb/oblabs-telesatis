const fs = require('fs');
const path = require('path');

const leadsPath = path.join(__dirname, 'portal', 'leads_data.json');
const leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));

console.log(`Toplam aktarilacak lead sayisi: ${leads.length}`);

let sql = '';
const seenPhones = new Set();

for (const l of leads) {
  const phone = (l.phone || '').replace(/\D/g, '');
  if (!phone || seenPhones.has(phone)) continue;
  seenPhones.add(phone);

  const id = (l.id || `lead_${Date.now()}_${Math.random()}`).replace(/'/g, "''");
  const name = (l.name || '').replace(/'/g, "''");
  const district = (l.district || '').replace(/'/g, "''");
  const city = (l.city || '').replace(/'/g, "''");
  const category = (l.category || '').replace(/'/g, "''");
  const rawPhone = (l.phone || '').replace(/'/g, "''");
  const rating = Number(l.rating) || 0;
  const reviews = Number(l.reviews_count) || 0;
  const address = (l.address || '').replace(/'/g, "''");
  const maps_url = (l.maps_url || '').replace(/'/g, "''");

  sql += `INSERT OR IGNORE INTO leads (id, name, district, city, category, phone, rating, reviews_count, address, website, status, notes, maps_url) VALUES ('${id}', '${name}', '${district}', '${city}', '${category}', '${rawPhone}', ${rating}, ${reviews}, '${address}', '', 'Aranacak', '', '${maps_url}');\n`;
}

fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql, 'utf8');
console.log(`seed.sql olusturuldu (${seenPhones.size} tekil firma).`);
