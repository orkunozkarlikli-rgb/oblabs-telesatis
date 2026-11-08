const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function processSql() {
  const sqlFile = path.join(__dirname, 'backup_leads.sql');
  const outFile = path.join(__dirname, 'portal', 'leads_data.json');

  const fileStream = fs.createReadStream(sqlFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const leads = [];
  const phoneSet = new Set();

  for await (const line of rl) {
    if (!line.startsWith('INSERT INTO') && !line.startsWith('INSERT OR IGNORE INTO')) continue;
    
    // Parse VALUES (...)
    const valIdx = line.indexOf('VALUES');
    if (valIdx === -1) continue;
    
    const valuesPart = line.substring(valIdx + 6).trim();
    // Regex or match tuple: ('id', 'name', 'district', 'city', 'category', 'phone', rating, reviews, 'address', 'website', 'status', 'notes', 'maps_url', 'created_at')
    try {
      // Split by comma outside quotes
      const parsedValues = [];
      let inQuote = false;
      let current = '';
      for (let i = 0; i < valuesPart.length; i++) {
        const char = valuesPart[i];
        if (char === "'" && (i === 0 || valuesPart[i-1] !== '\\')) {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          parsedValues.push(current.trim());
          current = '';
        } else if ((char === '(' && !inQuote) || (char === ')' && !inQuote) || (char === ';' && !inQuote)) {
          // ignore outer parens
        } else {
          current += char;
        }
      }
      if (current.trim()) parsedValues.push(current.trim());

      const cleanVal = (v) => {
        if (!v) return '';
        v = v.trim();
        if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
        return v;
      };

      if (parsedValues.length >= 13) {
        const lead = {
          id: cleanVal(parsedValues[0]),
          name: cleanVal(parsedValues[1]),
          district: cleanVal(parsedValues[2]),
          city: cleanVal(parsedValues[3]),
          category: cleanVal(parsedValues[4]),
          phone: cleanVal(parsedValues[5]),
          rating: parseFloat(cleanVal(parsedValues[6])) || 4.5,
          reviews_count: parseInt(cleanVal(parsedValues[7]), 10) || 0,
          address: cleanVal(parsedValues[8]),
          website: cleanVal(parsedValues[9]),
          status: cleanVal(parsedValues[10]) || 'Aranacak',
          notes: cleanVal(parsedValues[11]),
          maps_url: cleanVal(parsedValues[12]),
          created_at: cleanVal(parsedValues[13]) || ''
        };

        const p = (lead.phone || '').replace(/\D/g, '');
        if (p && !phoneSet.has(p)) {
          phoneSet.add(p);
          leads.push(lead);
        }
      }
    } catch (e) {}
  }

  console.log('Total extracted unique leads:', leads.length);
  fs.writeFileSync(outFile, JSON.stringify(leads), 'utf-8');
  console.log('Saved to', outFile);
}

processSql();
