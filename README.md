# OB Labs - Telesatış Portalı & Google Maps Veri Toplama Sistemi

Web sitesi olmayan işletmeleri tespit edip telesatış ekibinizin kullanımına sunan tam kapsamlı sistem.

---

## 📁 Proje Yapısı

* **`portal/`** : `https://data.oblabs.com.tr` üzerinde çalışacak modern telesatış web arayüzü (Cloudflare Pages uyumlu).
* **`scraper/`** : Google Haritalar'dan ilçeye ve sektöre göre web sitesi **olmayan**, telefonlu ve yüksek puanlı firmaları toplayan robotik tarayıcı.

---

## 🌐 1. `data.oblabs.com.tr` Cloudflare Kurulumu (2 Dakika)

`portal/` klasöründeki dosyalar hiçbir derleme veya karmaşık ayar gerektirmeden doğrudan Cloudflare Pages üzerinde çalışacak şekilde hazırlanmıştır.

### Adım Adım Kurulum:
1. **Cloudflare Dashboard**'a girin: [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sol menüden **Workers & Pages** -> **Create application** -> **Pages** sekmesine gelin.
3. **"Upload assets"** (Doğrudan yükleme) seçeneğini seçin.
4. Proje adına **`oblabs-data`** yazın ve `portal` klasörünü sürükleyip bırakın (veya Deploy deyin).
5. **Özel Alan Adı (data.oblabs.com.tr) Bağlama:**
   - Projeniz oluştuktan sonra üstteki **"Custom domains"** sekmesine tıklayın.
   - **"Set up a custom domain"** butonuna basın.
   - `data.oblabs.com.tr` yazıp onaylayın.
   - Domaininiz zaten Cloudflare'de olduğu için DNS kaydı ve SSL sertifikası otomatik olarak 30 saniye içinde tamamlanacaktır!
   - Artık eski `hairdresser` uzantısı olmadan doğrudan **`https://data.oblabs.com.tr`** adresine gidebilirsiniz.

---

## 🤖 2. Veri Çekme Motoru (Google Maps Scraper)

Scraper, Google Haritalar üzerinde Kadıköy (veya dilediğiniz başka bir ilçe) için yüksek potansiyelli sektörleri gezer.
- Web sitesi olanları **otomatik eler**.
- Web sitesi olmayan, telefonu açık ve müşteri yorumu olan işletmeleri ayıklar.
- Çıktıyı doğrudan portalın tanıyacağı JSON formatında kaydeder.

### Nasıl Çalıştırılır?
`scraper` klasöründe terminalden:

```bash
# Kadıköy için varsayılan tarama (12 kilit sektör):
node scrape.js --district=Kadıköy --city=İstanbul

# Sadece belirli sektörleri taramak için:
node scrape.js --district=Kadıköy --sectors="Oto Tamir Servis,Güzellik Salonu,Diş Kliniği" --limit=30

# Tarayıcıyı ekranda canlı izlemek isterseniz:
node scrape.js --district=Kadıköy --visible
```

---

## 📊 3. Verileri Satış Portalına Aktarma

1. Tarama tamamlandığında `scraper/output/` klasöründe `.json` dosyası oluşur.
2. `https://data.oblabs.com.tr` adresine girin.
3. Sağ üstteki **"Data Yükle (Excel/JSON)"** butonuna tıklayıp bu dosyayı seçin.
4. Sistem tüm firmaları anında portala döker; satış ekibiniz aramaya başlar!
