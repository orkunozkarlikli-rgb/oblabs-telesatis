const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function test() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=tr-TR,tr']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Google Maps aciliyor...');
  await page.goto('https://www.google.com/maps/search/oto+tamir+kadikoy?hl=tr', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  await new Promise(r => setTimeout(r, 4000));
  console.log('Sayfa basligi:', await page.title());

  // Check consent buttons
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean);
  });
  console.log('Bulunan butonlar (ilk 10):', buttons.slice(0, 10));

  // Check links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(h => h.includes('/maps/place/'));
  });
  console.log('Bulunan maps/place link sayisi:', links.length);
  if (links.length > 0) {
    console.log('Ornek link:', links[0]);
  }

  await browser.close();
}

test().catch(console.error);
