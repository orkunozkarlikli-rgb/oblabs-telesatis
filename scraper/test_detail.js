const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testDetail() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=tr-TR,tr']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const url = 'https://www.google.com/maps/place/Kad%C4%B1k%C3%B6y+Otomotiv+-+Tamir+Oto+Elektrik+Ak%C3%BC,+Lastik+ve+Yol+Yard%C4%B1m/data=!4m7!3m6!1s0x14cab9851f0b4bc3:0x803b9311b13d75c5!8m2!3d40.9949435!4d29.0340822!16s%2Fg%2F11xv06xc2f!19sChIJw0sLH4W5yhQRxXU9sRGTO4A?authuser=0&hl=tr&rclk=1';

  console.log('Firma detayina gidiliyor...');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const info = await page.evaluate(() => {
    const title = document.querySelector('h1')?.textContent?.trim() || '';
    
    // Website check
    const web = document.querySelector('a[data-item-id="authority"]')?.getAttribute('href') || 
                document.querySelector('a[aria-label*="web"]')?.getAttribute('href') || '';
                
    // Phone check
    const phone = document.querySelector('button[data-item-id*="phone"]')?.getAttribute('aria-label') || 
                  document.querySelector('button[aria-label*="Telefon"]')?.getAttribute('aria-label') || '';
                  
    // Rating & reviews
    const ratingText = document.querySelector('div.F7nice')?.textContent || '';

    // Category
    const category = document.querySelector('button[jsaction*="category"]')?.textContent?.trim() || '';

    // Address
    const address = document.querySelector('button[data-item-id="address"]')?.getAttribute('aria-label') || '';

    return { title, category, ratingText, web, phone, address };
  });

  console.log('Cekilen Gercek Bilgi:', JSON.stringify(info, null, 2));
  await browser.close();
}

testDetail().catch(console.error);
