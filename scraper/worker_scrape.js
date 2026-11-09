/**
 * OB Labs - Türkiye 81 İl 500+ İlçe Coğrafi Hafızalı Turbo Scraper
 * Her worker farklı bölge, gezilen yerler tekrar gezmez.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// TÜM TÜRKİYE - 81 İL - 500+ İLÇE
const ALL_LOCATIONS = [
  // İSTANBUL (39 ilçe)
  {city:"İstanbul",district:"Adalar"},{city:"İstanbul",district:"Arnavutköy"},{city:"İstanbul",district:"Ataşehir"},
  {city:"İstanbul",district:"Avcılar"},{city:"İstanbul",district:"Bağcılar"},{city:"İstanbul",district:"Bahçelievler"},
  {city:"İstanbul",district:"Bakırköy"},{city:"İstanbul",district:"Başakşehir"},{city:"İstanbul",district:"Bayrampaşa"},
  {city:"İstanbul",district:"Beşiktaş"},{city:"İstanbul",district:"Beykoz"},{city:"İstanbul",district:"Beylikdüzü"},
  {city:"İstanbul",district:"Beyoğlu"},{city:"İstanbul",district:"Büyükçekmece"},{city:"İstanbul",district:"Çatalca"},
  {city:"İstanbul",district:"Çekmeköy"},{city:"İstanbul",district:"Esenler"},{city:"İstanbul",district:"Esenyurt"},
  {city:"İstanbul",district:"Eyüpsultan"},{city:"İstanbul",district:"Fatih"},{city:"İstanbul",district:"Gaziosmanpaşa"},
  {city:"İstanbul",district:"Güngören"},{city:"İstanbul",district:"Kadıköy"},{city:"İstanbul",district:"Kağıthane"},
  {city:"İstanbul",district:"Kartal"},{city:"İstanbul",district:"Küçükçekmece"},{city:"İstanbul",district:"Maltepe"},
  {city:"İstanbul",district:"Pendik"},{city:"İstanbul",district:"Sancaktepe"},{city:"İstanbul",district:"Sarıyer"},
  {city:"İstanbul",district:"Şile"},{city:"İstanbul",district:"Silivri"},{city:"İstanbul",district:"Şişli"},
  {city:"İstanbul",district:"Sultanbeyli"},{city:"İstanbul",district:"Sultangazi"},{city:"İstanbul",district:"Tuzla"},
  {city:"İstanbul",district:"Ümraniye"},{city:"İstanbul",district:"Üsküdar"},{city:"İstanbul",district:"Zeytinburnu"},
  // ANKARA (25 ilçe)
  {city:"Ankara",district:"Altındağ"},{city:"Ankara",district:"Ayaş"},{city:"Ankara",district:"Bala"},
  {city:"Ankara",district:"Beypazarı"},{city:"Ankara",district:"Çamlıdere"},{city:"Ankara",district:"Çankaya"},
  {city:"Ankara",district:"Çubuk"},{city:"Ankara",district:"Elmadağ"},{city:"Ankara",district:"Etimesgut"},
  {city:"Ankara",district:"Gölbaşı"},{city:"Ankara",district:"Güdül"},{city:"Ankara",district:"Haymana"},
  {city:"Ankara",district:"Kahramankazan"},{city:"Ankara",district:"Keçiören"},{city:"Ankara",district:"Kızılcahamam"},
  {city:"Ankara",district:"Mamak"},{city:"Ankara",district:"Nallıhan"},{city:"Ankara",district:"Polatlı"},
  {city:"Ankara",district:"Pursaklar"},{city:"Ankara",district:"Sincan"},{city:"Ankara",district:"Yenimahalle"},
  {city:"Ankara",district:"Akyurt"},{city:"Ankara",district:"Kalecik"},{city:"Ankara",district:"Şereflikoçhisar"},
  {city:"Ankara",district:"Evren"},
  // İZMİR (30 ilçe)
  {city:"İzmir",district:"Aliağa"},{city:"İzmir",district:"Balçova"},{city:"İzmir",district:"Bayındır"},
  {city:"İzmir",district:"Bayraklı"},{city:"İzmir",district:"Bergama"},{city:"İzmir",district:"Beydağ"},
  {city:"İzmir",district:"Bornova"},{city:"İzmir",district:"Buca"},{city:"İzmir",district:"Çeşme"},
  {city:"İzmir",district:"Çiğli"},{city:"İzmir",district:"Dikili"},{city:"İzmir",district:"Foça"},
  {city:"İzmir",district:"Gaziemir"},{city:"İzmir",district:"Güzelbahçe"},{city:"İzmir",district:"Karabağlar"},
  {city:"İzmir",district:"Karşıyaka"},{city:"İzmir",district:"Kemalpaşa"},{city:"İzmir",district:"Kınık"},
  {city:"İzmir",district:"Konak"},{city:"İzmir",district:"Menderes"},{city:"İzmir",district:"Menemen"},
  {city:"İzmir",district:"Narlıdere"},{city:"İzmir",district:"Ödemiş"},{city:"İzmir",district:"Seferihisar"},
  {city:"İzmir",district:"Selçuk"},{city:"İzmir",district:"Tire"},{city:"İzmir",district:"Torbalı"},
  {city:"İzmir",district:"Urla"},{city:"İzmir",district:"Kiraz"},{city:"İzmir",district:"Karaburun"},
  // BURSA (17 ilçe)
  {city:"Bursa",district:"Büyükorhan"},{city:"Bursa",district:"Gemlik"},{city:"Bursa",district:"Gürsu"},
  {city:"Bursa",district:"Harmancık"},{city:"Bursa",district:"İnegöl"},{city:"Bursa",district:"İznik"},
  {city:"Bursa",district:"Karacabey"},{city:"Bursa",district:"Keles"},{city:"Bursa",district:"Kestel"},
  {city:"Bursa",district:"Mudanya"},{city:"Bursa",district:"Mustafakemalpaşa"},{city:"Bursa",district:"Nilüfer"},
  {city:"Bursa",district:"Orhaneli"},{city:"Bursa",district:"Orhangazi"},{city:"Bursa",district:"Osmangazi"},
  {city:"Bursa",district:"Yenişehir"},{city:"Bursa",district:"Yıldırım"},
  // ANTALYA (18 ilçe)
  {city:"Antalya",district:"Aksu"},{city:"Antalya",district:"Alanya"},{city:"Antalya",district:"Demre"},
  {city:"Antalya",district:"Döşemealtı"},{city:"Antalya",district:"Elmalı"},{city:"Antalya",district:"Finike"},
  {city:"Antalya",district:"Gazipaşa"},{city:"Antalya",district:"Gündoğmuş"},{city:"Antalya",district:"Kaş"},
  {city:"Antalya",district:"Kemer"},{city:"Antalya",district:"Kepez"},{city:"Antalya",district:"Konyaaltı"},
  {city:"Antalya",district:"Korkuteli"},{city:"Antalya",district:"Kumluca"},{city:"Antalya",district:"Manavgat"},
  {city:"Antalya",district:"Muratpaşa"},{city:"Antalya",district:"Serik"},{city:"Antalya",district:"İbradı"},
  // ADANA (15 ilçe)
  {city:"Adana",district:"Aladağ"},{city:"Adana",district:"Ceyhan"},{city:"Adana",district:"Çukurova"},
  {city:"Adana",district:"Feke"},{city:"Adana",district:"İmamoğlu"},{city:"Adana",district:"Karaisalı"},
  {city:"Adana",district:"Karataş"},{city:"Adana",district:"Kozan"},{city:"Adana",district:"Pozantı"},
  {city:"Adana",district:"Saimbeyli"},{city:"Adana",district:"Sarıçam"},{city:"Adana",district:"Seyhan"},
  {city:"Adana",district:"Tufanbeyli"},{city:"Adana",district:"Yumurtalık"},{city:"Adana",district:"Yüreğir"},
  // MERSİN (13 ilçe)
  {city:"Mersin",district:"Akdeniz"},{city:"Mersin",district:"Anamur"},{city:"Mersin",district:"Aydıncık"},
  {city:"Mersin",district:"Bozyazı"},{city:"Mersin",district:"Çamlıyayla"},{city:"Mersin",district:"Erdemli"},
  {city:"Mersin",district:"Gülnar"},{city:"Mersin",district:"Mezitli"},{city:"Mersin",district:"Mut"},
  {city:"Mersin",district:"Silifke"},{city:"Mersin",district:"Tarsus"},{city:"Mersin",district:"Toroslar"},
  {city:"Mersin",district:"Yenişehir"},
  // GAZİANTEP (9 ilçe)
  {city:"Gaziantep",district:"Araban"},{city:"Gaziantep",district:"İslahiye"},{city:"Gaziantep",district:"Karkamış"},
  {city:"Gaziantep",district:"Nizip"},{city:"Gaziantep",district:"Nurdağı"},{city:"Gaziantep",district:"Oğuzeli"},
  {city:"Gaziantep",district:"Şahinbey"},{city:"Gaziantep",district:"Şehitkamil"},{city:"Gaziantep",district:"Yavuzeli"},
  // KONYA (31 ilçe)
  {city:"Konya",district:"Ahırlı"},{city:"Konya",district:"Akören"},{city:"Konya",district:"Akşehir"},
  {city:"Konya",district:"Altınekin"},{city:"Konya",district:"Beyşehir"},{city:"Konya",district:"Bozkır"},
  {city:"Konya",district:"Cihanbeyli"},{city:"Konya",district:"Çeltik"},{city:"Konya",district:"Çumra"},
  {city:"Konya",district:"Derbent"},{city:"Konya",district:"Derebucak"},{city:"Konya",district:"Doğanhisar"},
  {city:"Konya",district:"Emirgazi"},{city:"Konya",district:"Ereğli"},{city:"Konya",district:"Güneysınır"},
  {city:"Konya",district:"Hadim"},{city:"Konya",district:"Halkapınar"},{city:"Konya",district:"Hüyük"},
  {city:"Konya",district:"Ilgın"},{city:"Konya",district:"Kadınhanı"},{city:"Konya",district:"Karapınar"},
  {city:"Konya",district:"Karatay"},{city:"Konya",district:"Kulu"},{city:"Konya",district:"Meram"},
  {city:"Konya",district:"Sarayönü"},{city:"Konya",district:"Selçuklu"},{city:"Konya",district:"Seydişehir"},
  {city:"Konya",district:"Taşkent"},{city:"Konya",district:"Tuzlukçu"},{city:"Konya",district:"Yalıhüyük"},
  {city:"Konya",district:"Yunak"},
  // KAYSERİ (16 ilçe)
  {city:"Kayseri",district:"Akkışla"},{city:"Kayseri",district:"Bünyan"},{city:"Kayseri",district:"Develi"},
  {city:"Kayseri",district:"Felahiye"},{city:"Kayseri",district:"Hacılar"},{city:"Kayseri",district:"İncesu"},
  {city:"Kayseri",district:"Kocasinan"},{city:"Kayseri",district:"Melikgazi"},{city:"Kayseri",district:"Özvatan"},
  {city:"Kayseri",district:"Pınarbaşı"},{city:"Kayseri",district:"Sarıoğlan"},{city:"Kayseri",district:"Sarız"},
  {city:"Kayseri",district:"Talas"},{city:"Kayseri",district:"Tomarza"},{city:"Kayseri",district:"Yahyalı"},
  {city:"Kayseri",district:"Yeşilhisar"},
  // DİYARBAKIR (17 ilçe)
  {city:"Diyarbakır",district:"Bağlar"},{city:"Diyarbakır",district:"Bismil"},{city:"Diyarbakır",district:"Çermik"},
  {city:"Diyarbakır",district:"Çınar"},{city:"Diyarbakır",district:"Çüngüş"},{city:"Diyarbakır",district:"Dicle"},
  {city:"Diyarbakır",district:"Eğil"},{city:"Diyarbakır",district:"Ergani"},{city:"Diyarbakır",district:"Hani"},
  {city:"Diyarbakır",district:"Hazro"},{city:"Diyarbakır",district:"Kayapınar"},{city:"Diyarbakır",district:"Kocaköy"},
  {city:"Diyarbakır",district:"Kulp"},{city:"Diyarbakır",district:"Lice"},{city:"Diyarbakır",district:"Silvan"},
  {city:"Diyarbakır",district:"Sur"},{city:"Diyarbakır",district:"Yenişehir"},
  // SAMSUN (17 ilçe)
  {city:"Samsun",district:"Alaçam"},{city:"Samsun",district:"Asarcık"},{city:"Samsun",district:"Atakum"},
  {city:"Samsun",district:"Ayvacık"},{city:"Samsun",district:"Bafra"},{city:"Samsun",district:"Canik"},
  {city:"Samsun",district:"Çarşamba"},{city:"Samsun",district:"Havza"},{city:"Samsun",district:"İlkadım"},
  {city:"Samsun",district:"Kavak"},{city:"Samsun",district:"Ladik"},{city:"Samsun",district:"Ondokuzmayıs"},
  {city:"Samsun",district:"Salıpazarı"},{city:"Samsun",district:"Tekkeköy"},{city:"Samsun",district:"Terme"},
  {city:"Samsun",district:"Vezirköprü"},{city:"Samsun",district:"Yakakent"},
  // TRABZON (18 ilçe)
  {city:"Trabzon",district:"Akçaabat"},{city:"Trabzon",district:"Araklı"},{city:"Trabzon",district:"Arsin"},
  {city:"Trabzon",district:"Beşikdüzü"},{city:"Trabzon",district:"Çarşıbaşı"},{city:"Trabzon",district:"Çaykara"},
  {city:"Trabzon",district:"Dernekpazarı"},{city:"Trabzon",district:"Düzköy"},{city:"Trabzon",district:"Hayrat"},
  {city:"Trabzon",district:"Köprübaşı"},{city:"Trabzon",district:"Maçka"},{city:"Trabzon",district:"Of"},
  {city:"Trabzon",district:"Ortahisar"},{city:"Trabzon",district:"Sürmene"},{city:"Trabzon",district:"Şalpazarı"},
  {city:"Trabzon",district:"Tonya"},{city:"Trabzon",district:"Vakfıkebir"},{city:"Trabzon",district:"Yomra"},
  // HATAY (14 ilçe)
  {city:"Hatay",district:"Altınözü"},{city:"Hatay",district:"Antakya"},{city:"Hatay",district:"Arsuz"},
  {city:"Hatay",district:"Belen"},{city:"Hatay",district:"Dörtyol"},{city:"Hatay",district:"Erzin"},
  {city:"Hatay",district:"Hassa"},{city:"Hatay",district:"İskenderun"},{city:"Hatay",district:"Kırıkhan"},
  {city:"Hatay",district:"Kumlu"},{city:"Hatay",district:"Payas"},{city:"Hatay",district:"Reyhanlı"},
  {city:"Hatay",district:"Samandağ"},{city:"Hatay",district:"Yayladağı"},
  // ŞANLIURFA (13 ilçe)
  {city:"Şanlıurfa",district:"Akçakale"},{city:"Şanlıurfa",district:"Birecik"},{city:"Şanlıurfa",district:"Bozova"},
  {city:"Şanlıurfa",district:"Ceylanpınar"},{city:"Şanlıurfa",district:"Eyyübiye"},{city:"Şanlıurfa",district:"Halfeti"},
  {city:"Şanlıurfa",district:"Haliliye"},{city:"Şanlıurfa",district:"Harran"},{city:"Şanlıurfa",district:"Hilvan"},
  {city:"Şanlıurfa",district:"Karaköprü"},{city:"Şanlıurfa",district:"Siverek"},{city:"Şanlıurfa",district:"Suruç"},
  {city:"Şanlıurfa",district:"Viranşehir"},
  // KOCAELİ (12 ilçe)
  {city:"Kocaeli",district:"Başiskele"},{city:"Kocaeli",district:"Çayırova"},{city:"Kocaeli",district:"Darıca"},
  {city:"Kocaeli",district:"Derince"},{city:"Kocaeli",district:"Dilovası"},{city:"Kocaeli",district:"Gebze"},
  {city:"Kocaeli",district:"Gölcük"},{city:"Kocaeli",district:"İzmit"},{city:"Kocaeli",district:"Kandıra"},
  {city:"Kocaeli",district:"Karamürsel"},{city:"Kocaeli",district:"Kartepe"},{city:"Kocaeli",district:"Körfez"},
  // SAKARYA (16 ilçe)
  {city:"Sakarya",district:"Adapazarı"},{city:"Sakarya",district:"Akyazı"},{city:"Sakarya",district:"Arifiye"},
  {city:"Sakarya",district:"Erenler"},{city:"Sakarya",district:"Ferizli"},{city:"Sakarya",district:"Geyve"},
  {city:"Sakarya",district:"Hendek"},{city:"Sakarya",district:"Karapürçek"},{city:"Sakarya",district:"Karasu"},
  {city:"Sakarya",district:"Kaynarca"},{city:"Sakarya",district:"Kocaali"},{city:"Sakarya",district:"Pamukova"},
  {city:"Sakarya",district:"Sapanca"},{city:"Sakarya",district:"Serdivan"},{city:"Sakarya",district:"Söğütlü"},
  {city:"Sakarya",district:"Taraklı"},
  // MUĞLA (12 ilçe)
  {city:"Muğla",district:"Bodrum"},{city:"Muğla",district:"Datça"},{city:"Muğla",district:"Fethiye"},
  {city:"Muğla",district:"Kavaklıdere"},{city:"Muğla",district:"Köyceğiz"},{city:"Muğla",district:"Marmaris"},
  {city:"Muğla",district:"Menteşe"},{city:"Muğla",district:"Milas"},{city:"Muğla",district:"Ortaca"},
  {city:"Muğla",district:"Seydikemer"},{city:"Muğla",district:"Ula"},{city:"Muğla",district:"Yatağan"},
  // AYDIN (17 ilçe)
  {city:"Aydın",district:"Bozdoğan"},{city:"Aydın",district:"Buharkent"},{city:"Aydın",district:"Çine"},
  {city:"Aydın",district:"Didim"},{city:"Aydın",district:"Efeler"},{city:"Aydın",district:"Germencik"},
  {city:"Aydın",district:"İncirliova"},{city:"Aydın",district:"Karacasu"},{city:"Aydın",district:"Karpuzlu"},
  {city:"Aydın",district:"Koçarlı"},{city:"Aydın",district:"Köşk"},{city:"Aydın",district:"Kuşadası"},
  {city:"Aydın",district:"Kuyucak"},{city:"Aydın",district:"Nazilli"},{city:"Aydın",district:"Söke"},
  {city:"Aydın",district:"Sultanhisar"},{city:"Aydın",district:"Yenipazar"},
  // DENİZLİ (19 ilçe)
  {city:"Denizli",district:"Acıpayam"},{city:"Denizli",district:"Babadağ"},{city:"Denizli",district:"Baklan"},
  {city:"Denizli",district:"Bekilli"},{city:"Denizli",district:"Beyağaç"},{city:"Denizli",district:"Bozkurt"},
  {city:"Denizli",district:"Buldan"},{city:"Denizli",district:"Çal"},{city:"Denizli",district:"Çameli"},
  {city:"Denizli",district:"Çardak"},{city:"Denizli",district:"Çivril"},{city:"Denizli",district:"Güney"},
  {city:"Denizli",district:"Honaz"},{city:"Denizli",district:"Kale"},{city:"Denizli",district:"Merkezefendi"},
  {city:"Denizli",district:"Pamukkale"},{city:"Denizli",district:"Sarayköy"},{city:"Denizli",district:"Serinhisar"},
  {city:"Denizli",district:"Tavas"},
  // ESKİŞEHİR (14 ilçe)
  {city:"Eskişehir",district:"Alpu"},{city:"Eskişehir",district:"Beylikova"},{city:"Eskişehir",district:"Çifteler"},
  {city:"Eskişehir",district:"Günyüzü"},{city:"Eskişehir",district:"Han"},{city:"Eskişehir",district:"İnönü"},
  {city:"Eskişehir",district:"Mahmudiye"},{city:"Eskişehir",district:"Mihalıççık"},{city:"Eskişehir",district:"Odunpazarı"},
  {city:"Eskişehir",district:"Sarıcakaya"},{city:"Eskişehir",district:"Seyitgazi"},{city:"Eskişehir",district:"Sivrihisar"},
  {city:"Eskişehir",district:"Tepebaşı"},{city:"Eskişehir",district:"Mihalgazi"},
  // TEKİRDAĞ (11 ilçe)
  {city:"Tekirdağ",district:"Çerkezköy"},{city:"Tekirdağ",district:"Çorlu"},{city:"Tekirdağ",district:"Ergene"},
  {city:"Tekirdağ",district:"Hayrabolu"},{city:"Tekirdağ",district:"Kapaklı"},{city:"Tekirdağ",district:"Malkara"},
  {city:"Tekirdağ",district:"Marmara Ereğlisi"},{city:"Tekirdağ",district:"Muratlı"},{city:"Tekirdağ",district:"Saray"},
  {city:"Tekirdağ",district:"Şarköy"},{city:"Tekirdağ",district:"Süleymanpaşa"},
  // BALIKESİR (20 ilçe)
  {city:"Balıkesir",district:"Altıeylül"},{city:"Balıkesir",district:"Ayvalık"},{city:"Balıkesir",district:"Balya"},
  {city:"Balıkesir",district:"Bandırma"},{city:"Balıkesir",district:"Bigadiç"},{city:"Balıkesir",district:"Burhaniye"},
  {city:"Balıkesir",district:"Dursunbey"},{city:"Balıkesir",district:"Edremit"},{city:"Balıkesir",district:"Erdek"},
  {city:"Balıkesir",district:"Gömeç"},{city:"Balıkesir",district:"Gönen"},{city:"Balıkesir",district:"Havran"},
  {city:"Balıkesir",district:"İvrindi"},{city:"Balıkesir",district:"Karesi"},{city:"Balıkesir",district:"Kepsut"},
  {city:"Balıkesir",district:"Manyas"},{city:"Balıkesir",district:"Marmara"},{city:"Balıkesir",district:"Savaştepe"},
  {city:"Balıkesir",district:"Sındırgı"},{city:"Balıkesir",district:"Susurluk"},
  // MANİSA (17 ilçe)
  {city:"Manisa",district:"Ahmetli"},{city:"Manisa",district:"Akhisar"},{city:"Manisa",district:"Alaşehir"},
  {city:"Manisa",district:"Demirci"},{city:"Manisa",district:"Gölmarmara"},{city:"Manisa",district:"Gördes"},
  {city:"Manisa",district:"Kırkağaç"},{city:"Manisa",district:"Köprübaşı"},{city:"Manisa",district:"Kula"},
  {city:"Manisa",district:"Salihli"},{city:"Manisa",district:"Sarıgöl"},{city:"Manisa",district:"Saruhanlı"},
  {city:"Manisa",district:"Selendi"},{city:"Manisa",district:"Soma"},{city:"Manisa",district:"Şehzadeler"},
  {city:"Manisa",district:"Turgutlu"},{city:"Manisa",district:"Yunusemre"},
  // KAHRAMANMARAŞ (11 ilçe)
  {city:"Kahramanmaraş",district:"Afşin"},{city:"Kahramanmaraş",district:"Andırın"},{city:"Kahramanmaraş",district:"Çağlayancerit"},
  {city:"Kahramanmaraş",district:"Dulkadiroğlu"},{city:"Kahramanmaraş",district:"Ekinözü"},{city:"Kahramanmaraş",district:"Elbistan"},
  {city:"Kahramanmaraş",district:"Göksun"},{city:"Kahramanmaraş",district:"Nurhak"},{city:"Kahramanmaraş",district:"Onikişubat"},
  {city:"Kahramanmaraş",district:"Pazarcık"},{city:"Kahramanmaraş",district:"Türkoğlu"},
  // MALATYA (13 ilçe)
  {city:"Malatya",district:"Akçadağ"},{city:"Malatya",district:"Arapgir"},{city:"Malatya",district:"Arguvan"},
  {city:"Malatya",district:"Battalgazi"},{city:"Malatya",district:"Darende"},{city:"Malatya",district:"Doğanşehir"},
  {city:"Malatya",district:"Doğanyol"},{city:"Malatya",district:"Hekimhan"},{city:"Malatya",district:"Kale"},
  {city:"Malatya",district:"Kuluncak"},{city:"Malatya",district:"Pütürge"},{city:"Malatya",district:"Yazıhan"},
  {city:"Malatya",district:"Yeşilyurt"},
  // VAN (13 ilçe)
  {city:"Van",district:"Bahçesaray"},{city:"Van",district:"Başkale"},{city:"Van",district:"Çatak"},
  {city:"Van",district:"Çaldıran"},{city:"Van",district:"Edremit"},{city:"Van",district:"Erciş"},
  {city:"Van",district:"Gevaş"},{city:"Van",district:"Gürpınar"},{city:"Van",district:"İpekyolu"},
  {city:"Van",district:"Muradiye"},{city:"Van",district:"Özalp"},{city:"Van",district:"Saray"},
  {city:"Van",district:"Tuşba"},
  // ERZURUM (20 ilçe)
  {city:"Erzurum",district:"Aşkale"},{city:"Erzurum",district:"Aziziye"},{city:"Erzurum",district:"Çat"},
  {city:"Erzurum",district:"Hınıs"},{city:"Erzurum",district:"Horasan"},{city:"Erzurum",district:"İspir"},
  {city:"Erzurum",district:"Karaçoban"},{city:"Erzurum",district:"Karayazı"},{city:"Erzurum",district:"Köprüköy"},
  {city:"Erzurum",district:"Narman"},{city:"Erzurum",district:"Oltu"},{city:"Erzurum",district:"Olur"},
  {city:"Erzurum",district:"Palandöken"},{city:"Erzurum",district:"Pasinler"},{city:"Erzurum",district:"Pazaryolu"},
  {city:"Erzurum",district:"Şenkaya"},{city:"Erzurum",district:"Tekman"},{city:"Erzurum",district:"Tortum"},
  {city:"Erzurum",district:"Uzundere"},{city:"Erzurum",district:"Yakutiye"},
  // SİVAS (16 ilçe)
  {city:"Sivas",district:"Akıncılar"},{city:"Sivas",district:"Altınyayla"},{city:"Sivas",district:"Divriği"},
  {city:"Sivas",district:"Doğanşar"},{city:"Sivas",district:"Gemerek"},{city:"Sivas",district:"Gölova"},
  {city:"Sivas",district:"Hafik"},{city:"Sivas",district:"İmranlı"},{city:"Sivas",district:"Kangal"},
  {city:"Sivas",district:"Koyulhisar"},{city:"Sivas",district:"Merkez"},{city:"Sivas",district:"Suşehri"},
  {city:"Sivas",district:"Şarkışla"},{city:"Sivas",district:"Ulaş"},{city:"Sivas",district:"Yıldızeli"},
  {city:"Sivas",district:"Zara"},
  // ORDU (19 ilçe)
  {city:"Ordu",district:"Akkuş"},{city:"Ordu",district:"Altınordu"},{city:"Ordu",district:"Aybastı"},
  {city:"Ordu",district:"Çamaş"},{city:"Ordu",district:"Çatalpınar"},{city:"Ordu",district:"Çaybaşı"},
  {city:"Ordu",district:"Fatsa"},{city:"Ordu",district:"Gölköy"},{city:"Ordu",district:"Gülyalı"},
  {city:"Ordu",district:"Gürgentepe"},{city:"Ordu",district:"İkizce"},{city:"Ordu",district:"Kabadüz"},
  {city:"Ordu",district:"Kabataş"},{city:"Ordu",district:"Korgan"},{city:"Ordu",district:"Kumru"},
  {city:"Ordu",district:"Mesudiye"},{city:"Ordu",district:"Perşembe"},{city:"Ordu",district:"Ulubey"},
  {city:"Ordu",district:"Ünye"},
  // BATMAN (6 ilçe)
  {city:"Batman",district:"Beşiri"},{city:"Batman",district:"Gercüş"},{city:"Batman",district:"Hasankeyf"},
  {city:"Batman",district:"Kozluk"},{city:"Batman",district:"Merkez"},{city:"Batman",district:"Sason"},
  // MARDİN (10 ilçe)
  {city:"Mardin",district:"Artuklu"},{city:"Mardin",district:"Dargeçit"},{city:"Mardin",district:"Derik"},
  {city:"Mardin",district:"Kızıltepe"},{city:"Mardin",district:"Mazıdağı"},{city:"Mardin",district:"Midyat"},
  {city:"Mardin",district:"Nusaybin"},{city:"Mardin",district:"Ömerli"},{city:"Mardin",district:"Savur"},
  {city:"Mardin",district:"Yeşilli"},
  // ÇORUM (14 ilçe)
  {city:"Çorum",district:"Alaca"},{city:"Çorum",district:"Bayat"},{city:"Çorum",district:"Boğazkale"},
  {city:"Çorum",district:"Dodurga"},{city:"Çorum",district:"İskilip"},{city:"Çorum",district:"Kargı"},
  {city:"Çorum",district:"Laçin"},{city:"Çorum",district:"Mecitözü"},{city:"Çorum",district:"Merkez"},
  {city:"Çorum",district:"Oğuzlar"},{city:"Çorum",district:"Ortaköy"},{city:"Çorum",district:"Osmancık"},
  {city:"Çorum",district:"Sungurlu"},{city:"Çorum",district:"Uğurludağ"},
  // TOKAT (12 ilçe)
  {city:"Tokat",district:"Almus"},{city:"Tokat",district:"Artova"},{city:"Tokat",district:"Başçiftlik"},
  {city:"Tokat",district:"Erbaa"},{city:"Tokat",district:"Merkez"},{city:"Tokat",district:"Niksar"},
  {city:"Tokat",district:"Pazar"},{city:"Tokat",district:"Reşadiye"},{city:"Tokat",district:"Sulusaray"},
  {city:"Tokat",district:"Turhal"},{city:"Tokat",district:"Yeşilyurt"},{city:"Tokat",district:"Zile"},
  // KASTAMONU (20 ilçe)
  {city:"Kastamonu",district:"Abana"},{city:"Kastamonu",district:"Ağlı"},{city:"Kastamonu",district:"Araç"},
  {city:"Kastamonu",district:"Azdavay"},{city:"Kastamonu",district:"Bozkurt"},{city:"Kastamonu",district:"Cide"},
  {city:"Kastamonu",district:"Çatalzeytin"},{city:"Kastamonu",district:"Daday"},{city:"Kastamonu",district:"Devrekani"},
  {city:"Kastamonu",district:"Doğanyurt"},{city:"Kastamonu",district:"Hanönü"},{city:"Kastamonu",district:"İhsangazi"},
  {city:"Kastamonu",district:"İnebolu"},{city:"Kastamonu",district:"Küre"},{city:"Kastamonu",district:"Merkez"},
  {city:"Kastamonu",district:"Pınarbaşı"},{city:"Kastamonu",district:"Seydiler"},{city:"Kastamonu",district:"Şenpazar"},
  {city:"Kastamonu",district:"Taşköprü"},{city:"Kastamonu",district:"Tosya"},
  // ZONGULDAK (8 ilçe)
  {city:"Zonguldak",district:"Alaplı"},{city:"Zonguldak",district:"Çaycuma"},{city:"Zonguldak",district:"Devrek"},
  {city:"Zonguldak",district:"Gökçebey"},{city:"Zonguldak",district:"Kilimli"},{city:"Zonguldak",district:"Kozlu"},
  {city:"Zonguldak",district:"Merkez"},{city:"Zonguldak",district:"Ereğli"},
  // KARABÜK (6 ilçe)
  {city:"Karabük",district:"Eflani"},{city:"Karabük",district:"Eskipazar"},{city:"Karabük",district:"Merkez"},
  {city:"Karabük",district:"Ovacık"},{city:"Karabük",district:"Safranbolu"},{city:"Karabük",district:"Yenice"},
  // BARTIN (4 ilçe)
  {city:"Bartın",district:"Amasra"},{city:"Bartın",district:"Kurucaşile"},{city:"Bartın",district:"Merkez"},
  {city:"Bartın",district:"Ulus"},
  // ÇANAKKALE (12 ilçe)
  {city:"Çanakkale",district:"Ayvacık"},{city:"Çanakkale",district:"Bayramiç"},{city:"Çanakkale",district:"Biga"},
  {city:"Çanakkale",district:"Çan"},{city:"Çanakkale",district:"Eceabat"},{city:"Çanakkale",district:"Ezine"},
  {city:"Çanakkale",district:"Gelibolu"},{city:"Çanakkale",district:"Lapseki"},{city:"Çanakkale",district:"Merkez"},
  {city:"Çanakkale",district:"Yenice"},{city:"Çanakkale",district:"Bozcaada"},{city:"Çanakkale",district:"Gökçeada"},
  // EDİRNE (9 ilçe)
  {city:"Edirne",district:"Enez"},{city:"Edirne",district:"Havsa"},{city:"Edirne",district:"İpsala"},
  {city:"Edirne",district:"Keşan"},{city:"Edirne",district:"Lalapaşa"},{city:"Edirne",district:"Meriç"},
  {city:"Edirne",district:"Merkez"},{city:"Edirne",district:"Süloğlu"},{city:"Edirne",district:"Uzunköprü"},
  // KIRKLARELİ (8 ilçe)
  {city:"Kırklareli",district:"Babaeski"},{city:"Kırklareli",district:"Demirköy"},{city:"Kırklareli",district:"Kofçaz"},
  {city:"Kırklareli",district:"Lüleburgaz"},{city:"Kırklareli",district:"Merkez"},{city:"Kırklareli",district:"Pehlivanköy"},
  {city:"Kırklareli",district:"Pınarhisar"},{city:"Kırklareli",district:"Vize"},
  // YALOVA (6 ilçe)
  {city:"Yalova",district:"Altınova"},{city:"Yalova",district:"Armutlu"},{city:"Yalova",district:"Çınarcık"},
  {city:"Yalova",district:"Çiftlikköy"},{city:"Yalova",district:"Merkez"},{city:"Yalova",district:"Termal"},
  // DÜZCE (8 ilçe)
  {city:"Düzce",district:"Akçakoca"},{city:"Düzce",district:"Cumayeri"},{city:"Düzce",district:"Çilimli"},
  {city:"Düzce",district:"Gölyaka"},{city:"Düzce",district:"Gümüşova"},{city:"Düzce",district:"Kaynaşlı"},
  {city:"Düzce",district:"Merkez"},{city:"Düzce",district:"Yığılca"},
  // BOLU (9 ilçe)
  {city:"Bolu",district:"Dörtdivan"},{city:"Bolu",district:"Gerede"},{city:"Bolu",district:"Göynük"},
  {city:"Bolu",district:"Kıbrıscık"},{city:"Bolu",district:"Mengen"},{city:"Bolu",district:"Merkez"},
  {city:"Bolu",district:"Mudurnu"},{city:"Bolu",district:"Seben"},{city:"Bolu",district:"Yeniçağa"},
  // ISPARTA (13 ilçe)
  {city:"Isparta",district:"Aksu"},{city:"Isparta",district:"Atabey"},{city:"Isparta",district:"Eğirdir"},
  {city:"Isparta",district:"Gelendost"},{city:"Isparta",district:"Gönen"},{city:"Isparta",district:"Keçiborlu"},
  {city:"Isparta",district:"Merkez"},{city:"Isparta",district:"Senirkent"},{city:"Isparta",district:"Sütçüler"},
  {city:"Isparta",district:"Şarkikaraağaç"},{city:"Isparta",district:"Uluborlu"},{city:"Isparta",district:"Yalvaç"},
  {city:"Isparta",district:"Yenişarbademli"},
  // BURDUR (11 ilçe)
  {city:"Burdur",district:"Ağlasun"},{city:"Burdur",district:"Altınyayla"},{city:"Burdur",district:"Bucak"},
  {city:"Burdur",district:"Çavdır"},{city:"Burdur",district:"Çeltikçi"},{city:"Burdur",district:"Gölhisar"},
  {city:"Burdur",district:"Karamanlı"},{city:"Burdur",district:"Kemer"},{city:"Burdur",district:"Merkez"},
  {city:"Burdur",district:"Tefenni"},{city:"Burdur",district:"Yeşilova"},
  // AFYONKARAHİSAR (18 ilçe)
  {city:"Afyonkarahisar",district:"Başmakçı"},{city:"Afyonkarahisar",district:"Bayat"},{city:"Afyonkarahisar",district:"Bolvadin"},
  {city:"Afyonkarahisar",district:"Çay"},{city:"Afyonkarahisar",district:"Çobanlar"},{city:"Afyonkarahisar",district:"Dazkırı"},
  {city:"Afyonkarahisar",district:"Dinar"},{city:"Afyonkarahisar",district:"Emirdağ"},{city:"Afyonkarahisar",district:"İhsaniye"},
  {city:"Afyonkarahisar",district:"İscehisar"},{city:"Afyonkarahisar",district:"Kızılören"},{city:"Afyonkarahisar",district:"Merkez"},
  {city:"Afyonkarahisar",district:"Sandıklı"},{city:"Afyonkarahisar",district:"Sinanpaşa"},{city:"Afyonkarahisar",district:"Sultandağı"},
  {city:"Afyonkarahisar",district:"Şuhut"},{city:"Afyonkarahisar",district:"Evciler"},{city:"Afyonkarahisar",district:"Hocalar"},
  // KÜTAHYA (13 ilçe)
  {city:"Kütahya",district:"Altıntaş"},{city:"Kütahya",district:"Aslanapa"},{city:"Kütahya",district:"Çavdarhisar"},
  {city:"Kütahya",district:"Domaniç"},{city:"Kütahya",district:"Dumlupınar"},{city:"Kütahya",district:"Emet"},
  {city:"Kütahya",district:"Gediz"},{city:"Kütahya",district:"Hisarcık"},{city:"Kütahya",district:"Merkez"},
  {city:"Kütahya",district:"Pazarlar"},{city:"Kütahya",district:"Şaphane"},{city:"Kütahya",district:"Simav"},
  {city:"Kütahya",district:"Tavşanlı"},
  // UŞAK (6 ilçe)
  {city:"Uşak",district:"Banaz"},{city:"Uşak",district:"Eşme"},{city:"Uşak",district:"Karahallı"},
  {city:"Uşak",district:"Merkez"},{city:"Uşak",district:"Sivaslı"},{city:"Uşak",district:"Ulubey"},
  // AKSARAY (8 ilçe)
  {city:"Aksaray",district:"Ağaçören"},{city:"Aksaray",district:"Eskil"},{city:"Aksaray",district:"Gülağaç"},
  {city:"Aksaray",district:"Güzelyurt"},{city:"Aksaray",district:"Merkez"},{city:"Aksaray",district:"Ortaköy"},
  {city:"Aksaray",district:"Sarıyahşi"},{city:"Aksaray",district:"Sultanhanı"},
  // NEVŞEHİR (8 ilçe)
  {city:"Nevşehir",district:"Acıgöl"},{city:"Nevşehir",district:"Avanos"},{city:"Nevşehir",district:"Derinkuyu"},
  {city:"Nevşehir",district:"Gülşehir"},{city:"Nevşehir",district:"Hacıbektaş"},{city:"Nevşehir",district:"Kozaklı"},
  {city:"Nevşehir",district:"Merkez"},{city:"Nevşehir",district:"Ürgüp"},
  // NİĞDE (6 ilçe)
  {city:"Niğde",district:"Altunhisar"},{city:"Niğde",district:"Bor"},{city:"Niğde",district:"Çamardı"},
  {city:"Niğde",district:"Çiftlik"},{city:"Niğde",district:"Merkez"},{city:"Niğde",district:"Ulukışla"},
  // KARAMAN (6 ilçe)
  {city:"Karaman",district:"Ayrancı"},{city:"Karaman",district:"Başyayla"},{city:"Karaman",district:"Ermenek"},
  {city:"Karaman",district:"Kazımkarabekir"},{city:"Karaman",district:"Merkez"},{city:"Karaman",district:"Sarıveliler"},
  // ERZİNCAN (9 ilçe)
  {city:"Erzincan",district:"Çayırlı"},{city:"Erzincan",district:"İliç"},{city:"Erzincan",district:"Kemah"},
  {city:"Erzincan",district:"Kemaliye"},{city:"Erzincan",district:"Merkez"},{city:"Erzincan",district:"Otlukbeli"},
  {city:"Erzincan",district:"Refahiye"},{city:"Erzincan",district:"Tercan"},{city:"Erzincan",district:"Üzümlü"},
  // ELAZIĞ (11 ilçe)
  {city:"Elazığ",district:"Ağın"},{city:"Elazığ",district:"Alacakaya"},{city:"Elazığ",district:"Arıcak"},
  {city:"Elazığ",district:"Baskil"},{city:"Elazığ",district:"Karakoçan"},{city:"Elazığ",district:"Keban"},
  {city:"Elazığ",district:"Kovancılar"},{city:"Elazığ",district:"Maden"},{city:"Elazığ",district:"Merkez"},
  {city:"Elazığ",district:"Palu"},{city:"Elazığ",district:"Sivrice"},
  // ADIYAMAN (9 ilçe)
  {city:"Adıyaman",district:"Besni"},{city:"Adıyaman",district:"Çelikhan"},{city:"Adıyaman",district:"Gerger"},
  {city:"Adıyaman",district:"Gölbaşı"},{city:"Adıyaman",district:"Kahta"},{city:"Adıyaman",district:"Merkez"},
  {city:"Adıyaman",district:"Samsat"},{city:"Adıyaman",district:"Sincik"},{city:"Adıyaman",district:"Tut"},
  // OSMANİYE (7 ilçe)
  {city:"Osmaniye",district:"Bahçe"},{city:"Osmaniye",district:"Düziçi"},{city:"Osmaniye",district:"Hasanbeyli"},
  {city:"Osmaniye",district:"Kadirli"},{city:"Osmaniye",district:"Merkez"},{city:"Osmaniye",district:"Sumbas"},
  {city:"Osmaniye",district:"Toprakkale"},
  // KİLİS (4 ilçe)
  {city:"Kilis",district:"Elbeyli"},{city:"Kilis",district:"Merkez"},{city:"Kilis",district:"Musabeyli"},
  {city:"Kilis",district:"Polateli"},
  // ARTVİN (9 ilçe)
  {city:"Artvin",district:"Ardanuç"},{city:"Artvin",district:"Arhavi"},{city:"Artvin",district:"Borçka"},
  {city:"Artvin",district:"Hopa"},{city:"Artvin",district:"Kemalpaşa"},{city:"Artvin",district:"Merkez"},
  {city:"Artvin",district:"Murgul"},{city:"Artvin",district:"Şavşat"},{city:"Artvin",district:"Yusufeli"},
  // RİZE (12 ilçe)
  {city:"Rize",district:"Ardeşen"},{city:"Rize",district:"Çamlıhemşin"},{city:"Rize",district:"Çayeli"},
  {city:"Rize",district:"Derepazarı"},{city:"Rize",district:"Fındıklı"},{city:"Rize",district:"Güneysu"},
  {city:"Rize",district:"Hemşin"},{city:"Rize",district:"İkizdere"},{city:"Rize",district:"İyidere"},
  {city:"Rize",district:"Kalkandere"},{city:"Rize",district:"Merkez"},{city:"Rize",district:"Pazar"},
  // GİRESUN (16 ilçe)
  {city:"Giresun",district:"Alucra"},{city:"Giresun",district:"Bulancak"},{city:"Giresun",district:"Çamoluk"},
  {city:"Giresun",district:"Çanakçı"},{city:"Giresun",district:"Dereli"},{city:"Giresun",district:"Doğankent"},
  {city:"Giresun",district:"Espiye"},{city:"Giresun",district:"Eynesil"},{city:"Giresun",district:"Görele"},
  {city:"Giresun",district:"Güce"},{city:"Giresun",district:"Keşap"},{city:"Giresun",district:"Merkez"},
  {city:"Giresun",district:"Piraziz"},{city:"Giresun",district:"Şebinkarahisar"},{city:"Giresun",district:"Tirebolu"},
  {city:"Giresun",district:"Yağlıdere"},
  // BAYBURT (3 ilçe)
  {city:"Bayburt",district:"Aydıntepe"},{city:"Bayburt",district:"Demirözü"},{city:"Bayburt",district:"Merkez"},
  // GÜMÜŞHANE (6 ilçe)
  {city:"Gümüşhane",district:"Kelkit"},{city:"Gümüşhane",district:"Köse"},{city:"Gümüşhane",district:"Kürtün"},
  {city:"Gümüşhane",district:"Merkez"},{city:"Gümüşhane",district:"Şiran"},{city:"Gümüşhane",district:"Torul"},
  // AĞRI (8 ilçe)
  {city:"Ağrı",district:"Diyadin"},{city:"Ağrı",district:"Doğubayazıt"},{city:"Ağrı",district:"Eleşkirt"},
  {city:"Ağrı",district:"Hamur"},{city:"Ağrı",district:"Merkez"},{city:"Ağrı",district:"Patnos"},
  {city:"Ağrı",district:"Taşlıçay"},{city:"Ağrı",district:"Tutak"},
  // KARS (8 ilçe)
  {city:"Kars",district:"Akyaka"},{city:"Kars",district:"Arpaçay"},{city:"Kars",district:"Digor"},
  {city:"Kars",district:"Kağızman"},{city:"Kars",district:"Merkez"},{city:"Kars",district:"Sarıkamış"},
  {city:"Kars",district:"Selim"},{city:"Kars",district:"Susuz"},
  // ARDAHAN (6 ilçe)
  {city:"Ardahan",district:"Çıldır"},{city:"Ardahan",district:"Damal"},{city:"Ardahan",district:"Göle"},
  {city:"Ardahan",district:"Hanak"},{city:"Ardahan",district:"Merkez"},{city:"Ardahan",district:"Posof"},
  // IĞDIR (4 ilçe)
  {city:"Iğdır",district:"Aralık"},{city:"Iğdır",district:"Karakoyunlu"},{city:"Iğdır",district:"Merkez"},
  {city:"Iğdır",district:"Tuzluca"},
  // HAKKARİ (5 ilçe)
  {city:"Hakkari",district:"Çukurca"},{city:"Hakkari",district:"Derecik"},{city:"Hakkari",district:"Merkez"},
  {city:"Hakkari",district:"Şemdinli"},{city:"Hakkari",district:"Yüksekova"},
  // ŞIRNAK (7 ilçe)
  {city:"Şırnak",district:"Beytüşşebap"},{city:"Şırnak",district:"Cizre"},{city:"Şırnak",district:"Güçlükonak"},
  {city:"Şırnak",district:"İdil"},{city:"Şırnak",district:"Merkez"},{city:"Şırnak",district:"Silopi"},
  {city:"Şırnak",district:"Uludere"},
  // SİİRT (7 ilçe)
  {city:"Siirt",district:"Baykan"},{city:"Siirt",district:"Eruh"},{city:"Siirt",district:"Kurtalan"},
  {city:"Siirt",district:"Merkez"},{city:"Siirt",district:"Pervari"},{city:"Siirt",district:"Şirvan"},
  {city:"Siirt",district:"Tillo"},
  // BİTLİS (7 ilçe)
  {city:"Bitlis",district:"Adilcevaz"},{city:"Bitlis",district:"Ahlat"},{city:"Bitlis",district:"Güroymak"},
  {city:"Bitlis",district:"Hizan"},{city:"Bitlis",district:"Merkez"},{city:"Bitlis",district:"Mutki"},
  {city:"Bitlis",district:"Tatvan"},
  // MUŞ (6 ilçe)
  {city:"Muş",district:"Bulanık"},{city:"Muş",district:"Hasköy"},{city:"Muş",district:"Korkut"},
  {city:"Muş",district:"Malazgirt"},{city:"Muş",district:"Merkez"},{city:"Muş",district:"Varto"},
  // BİNGÖL (8 ilçe)
  {city:"Bingöl",district:"Adaklı"},{city:"Bingöl",district:"Genç"},{city:"Bingöl",district:"Karlıova"},
  {city:"Bingöl",district:"Kiğı"},{city:"Bingöl",district:"Merkez"},{city:"Bingöl",district:"Solhan"},
  {city:"Bingöl",district:"Yayladere"},{city:"Bingöl",district:"Yedisu"},
  // TUNCELİ (8 ilçe)
  {city:"Tunceli",district:"Çemişgezek"},{city:"Tunceli",district:"Hozat"},{city:"Tunceli",district:"Mazgirt"},
  {city:"Tunceli",district:"Merkez"},{city:"Tunceli",district:"Nazımiye"},{city:"Tunceli",district:"Ovacık"},
  {city:"Tunceli",district:"Pertek"},{city:"Tunceli",district:"Pülümür"},
  // KIRIKKALE (9 ilçe)
  {city:"Kırıkkale",district:"Bahşili"},{city:"Kırıkkale",district:"Balışeyh"},{city:"Kırıkkale",district:"Çelebi"},
  {city:"Kırıkkale",district:"Delice"},{city:"Kırıkkale",district:"Karakeçili"},{city:"Kırıkkale",district:"Keskin"},
  {city:"Kırıkkale",district:"Merkez"},{city:"Kırıkkale",district:"Sulakyurt"},{city:"Kırıkkale",district:"Yahşihan"},
  // KIRŞEHİR (7 ilçe)
  {city:"Kırşehir",district:"Akçakent"},{city:"Kırşehir",district:"Akpınar"},{city:"Kırşehir",district:"Boztepe"},
  {city:"Kırşehir",district:"Çiçekdağı"},{city:"Kırşehir",district:"Kaman"},{city:"Kırşehir",district:"Merkez"},
  {city:"Kırşehir",district:"Mucur"},
  // YOZGAT (14 ilçe)
  {city:"Yozgat",district:"Akdağmadeni"},{city:"Yozgat",district:"Aydıncık"},{city:"Yozgat",district:"Boğazlıyan"},
  {city:"Yozgat",district:"Çandır"},{city:"Yozgat",district:"Çayıralan"},{city:"Yozgat",district:"Çekerek"},
  {city:"Yozgat",district:"Kadışehri"},{city:"Yozgat",district:"Merkez"},{city:"Yozgat",district:"Saraykent"},
  {city:"Yozgat",district:"Sarıkaya"},{city:"Yozgat",district:"Sorgun"},{city:"Yozgat",district:"Şefaatli"},
  {city:"Yozgat",district:"Yenifakılı"},{city:"Yozgat",district:"Yerköy"},
  // ÇANKIRI (12 ilçe)
  {city:"Çankırı",district:"Atkaracalar"},{city:"Çankırı",district:"Bayramören"},{city:"Çankırı",district:"Çerkeş"},
  {city:"Çankırı",district:"Eldivan"},{city:"Çankırı",district:"Ilgaz"},{city:"Çankırı",district:"Kızılırmak"},
  {city:"Çankırı",district:"Korgun"},{city:"Çankırı",district:"Kurşunlu"},{city:"Çankırı",district:"Merkez"},
  {city:"Çankırı",district:"Orta"},{city:"Çankırı",district:"Şabanözü"},{city:"Çankırı",district:"Yapraklı"},
  // AMASYA (7 ilçe)
  {city:"Amasya",district:"Göynücek"},{city:"Amasya",district:"Gümüşhacıköy"},{city:"Amasya",district:"Hamamözü"},
  {city:"Amasya",district:"Merkez"},{city:"Amasya",district:"Merzifon"},{city:"Amasya",district:"Suluova"},
  {city:"Amasya",district:"Taşova"},
  // SİNOP (9 ilçe)
  {city:"Sinop",district:"Ayancık"},{city:"Sinop",district:"Boyabat"},{city:"Sinop",district:"Dikmen"},
  {city:"Sinop",district:"Durağan"},{city:"Sinop",district:"Erfelek"},{city:"Sinop",district:"Gerze"},
  {city:"Sinop",district:"Merkez"},{city:"Sinop",district:"Saraydüzü"},{city:"Sinop",district:"Türkeli"},
  // KIRIKKALE zaten yukarıda
];

// TELESATIŞTA EN ÇOK SATAN SEKTÖRLER
const SECTORS = [
  "diş kliniği", "özel diş hekimi", "güzellik merkezi", "lazer epilasyon",
  "veteriner kliniği", "psikolog danışmanlık", "diyetisyen beslenme", "fizik tedavi merkezi",
  "evden eve nakliyat", "asansörlü nakliyat", "oto çekici kurtarıcı", "rent a car oto kiralama",
  "forklift vinç kiralama", "lojistik ambar", "oto ekspertiz", "özel oto servis",
  "oto tamir bakım", "oto boya kaporta", "oto cam film kaplama", "oto yıkama detaylı temizlik",
  "mali müşavir", "avukat hukuk bürosu", "mimarlık ofisi", "iç mimar dekorasyon",
  "sigorta acentesi", "gümrük müşavirliği", "tabela reklam dijital baskı", "matbaa",
  "düğün kına organizasyon", "catering toplu yemek şirketi", "alüminyum cam balkon",
  "tadilat dekorasyon", "demir doğrama ferforje", "çelik çatı sundurma", "mobilya imalat atölyesi",
  "mutfak dolabı imalat", "güvenlik alarm kamera sistemleri", "güneş enerjisi ges sistemleri",
  "asansör bakım montaj", "endüstriyel temizlik şirketi", "koltuk halı yıkama",
  "klima kombi servisi", "su tesisatçısı", "elektrikçi"
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sxvlvvcgkrbjktflroqu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Zaten kazınan lokasyonları Supabase'den çek (city+district bazlı)
async function getScrapedLocations() {
  if (!SUPABASE_KEY) return new Set();
  try {
    // leads tablosundan city+district kombinasyonlarını çek
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=city,district&limit=50000`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return new Set();
    const data = await res.json();
    const counts = {};
    data.forEach(r => {
      if (!r.city || !r.district) return;
      const key = `${r.city}|||${r.district}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    // 15'ten fazla lead olan lokasyonu "kazınmış" say → atla
    const scraped = new Set();
    Object.entries(counts).forEach(([key, count]) => {
      if (count >= 15) scraped.add(key);
    });
    console.log(`[GeoMemory] 🧠 ${scraped.size} lokasyon zaten taranmış, atlanacak.`);
    console.log(`[GeoMemory] 🆕 ${Object.keys(counts).length - scraped.size} lokasyon henüz boş veya az dolu.`);
    return scraped;
  } catch(e) {
    console.error('[GeoMemory] Hata:', e.message);
    return new Set();
  }
}

// Canlı D1 Veritabanına Anlık Senkronizasyon
async function syncToLiveD1(leads) {
  if (!leads || !leads.length) return;
  try {
    const res = await fetch('https://data.oblabs.com.tr/api/leads/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leads)
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`[D1 Sync] ⚡ ${leads.length} firma D1'e gönderildi (Eklenen: ${data.added})`);
    }
  } catch (err) {
    console.error(`[D1 Sync] Hata: ${err.message}`);
  }
}

// Supabase'e Senkronizasyon
async function syncToSupabase(leads) {
  if (!leads || !leads.length) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify(leads)
    });
    if (res.status === 429) {
      console.log('[Supabase] Rate limit! 60s bekleniyor...');
      await sleep(60000);
    } else if (res.ok) {
      console.log(`[Supabase] ✅ ${leads.length} firma gönderildi`);
    }
  } catch (err) {}
}

// Dosyaya yaz + D1 + Supabase'e gönder
async function appendToMasterFile(newLeads) {
  const masterFile = path.join(__dirname, 'output', 'turkiye_websiz_leadler.json');
  let current = [];
  if (fs.existsSync(masterFile)) {
    try { current = JSON.parse(fs.readFileSync(masterFile, 'utf-8')); } catch (e) { current = []; }
  }
  const existingPhones = new Set(current.map(l => (l.phone || '').replace(/\D/g, '')).filter(Boolean));
  const toSync = [];
  newLeads.forEach(item => {
    const p = (item.phone || '').replace(/\D/g, '');
    if (p && !existingPhones.has(p)) {
      existingPhones.add(p);
      current.push(item);
      toSync.push(item);
    }
  });
  if (toSync.length > 0) {
    try { fs.writeFileSync(masterFile, JSON.stringify(current, null, 2), 'utf-8'); } catch(e) {}
    await Promise.allSettled([syncToLiveD1(toSync), syncToSupabase(toSync)]);
  }
  return { added: toSync.length, total: current.length };
}

async function runWorker(workerId) {
  const total = ALL_LOCATIONS.length;
  const perWorker = Math.ceil(total / 4);
  const wId = parseInt(workerId, 10) || 1;

  // Her worker farklı dilim alır
  let start, end;
  if (wId === 1) { start = 0; end = perWorker; }
  else if (wId === 2) { start = perWorker; end = perWorker * 2; }
  else if (wId === 3) { start = perWorker * 2; end = perWorker * 3; }
  else { start = perWorker * 3; end = total; }

  let myLocations = ALL_LOCATIONS.slice(start, end);

  console.log(`\n======================================================`);
  console.log(`🚀 WORKER #${wId} DEVREDE`);
  console.log(`📍 Bölge Dilimi: ${start}-${end} (${myLocations.length} ilçe)`);
  console.log(`======================================================\n`);

  // Coğrafi hafıza: zaten kazınmış yerleri atla
  const scrapedSet = await getScrapedLocations();
  const freshLocations = myLocations.filter(loc => {
    const key = `${loc.city}|||${loc.district}`;
    return !scrapedSet.has(key);
  });

  if (freshLocations.length === 0) {
    console.log(`[Worker #${wId}] ⚠️ Tüm lokasyonlar zaten taranmış! Tüm listeyi yeniden dolaşıyorum...`);
    // Hepsi doluysa tekrar baştan başla ama karıştır
    myLocations.sort(() => Math.random() - 0.5);
  } else {
    console.log(`[Worker #${wId}] 🆕 ${freshLocations.length} taze lokasyon bulundu, oralardan başlanıyor.`);
    myLocations = freshLocations;
    myLocations.sort(() => Math.random() - 0.5);
  }

  const shuffledSectors = [...SECTORS].sort(() => Math.random() - 0.5);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote',
      '--single-process', '--disable-gpu', '--lang=tr-TR,tr', '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const workerBuffer = [];

  for (const loc of myLocations) {
    console.log(`\n[Worker #${wId}] 📍 ${loc.city} - ${loc.district}`);

    for (const sector of shuffledSectors) {
      const query = `${sector} ${loc.district} ${loc.city}`;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=tr`;

      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await sleep(800 + Math.random() * 400);

        // 15 scroll — daha alt kısımdaki firmalar da çekilsin
        for (let s = 1; s <= 15; s++) {
          await page.evaluate(() => {
            const feed = document.querySelector('div[role="feed"]');
            if (feed) feed.scrollTop = feed.scrollHeight;
          });
          await sleep(300);
        }

        const extracted = await page.evaluate((defaultCategory) => {
          const feed = document.querySelector('div[role="feed"]');
          if (!feed) return [];
          const placeLinks = Array.from(feed.querySelectorAll('a[href*="/maps/place/"]'));
          const directLeads = [];
          const seenLinks = new Set();

          for (const a of placeLinks) {
            const href = a.href;
            if (!href || seenLinks.has(href)) continue;
            seenLinks.add(href);

            let card = a.closest('div[role="article"]') || a.parentElement;
            while (card && !card.getAttribute('role') && card.parentElement && card.parentElement.getAttribute('role') !== 'feed') {
              card = card.parentElement;
            }
            if (!card) continue;

            const rawText = card.innerText || '';
            const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

            const hasWeb = !!card.querySelector('a[data-value*="Web" i], a[aria-label*="web" i], a[href*="http"]:not([href*="google.com"])') ||
                           rawText.includes('Web sitesi');
            if (hasWeb) continue;

            const name = a.getAttribute('aria-label') || lines[0] || '';
            if (!name) continue;

            const phoneMatch = rawText.match(/(?:\+90\s*|0)?([2-5][0-9]{2}[\s.-]?[0-9]{3}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2})/);
            const phone = phoneMatch ? phoneMatch[0].trim() : '';

            let rating = 4.5, reviews = 0;
            const ratingMatch = rawText.match(/([1-5],[0-9])/);
            if (ratingMatch) rating = parseFloat(ratingMatch[1].replace(',', '.'));
            const reviewsMatch = rawText.match(/\(([0-9.]+)\)/);
            if (reviewsMatch) reviews = parseInt(reviewsMatch[1].replace(/\./g, ''), 10);

            let category = defaultCategory, address = '';
            for (const line of lines) {
              if (line.includes('·')) {
                const parts = line.split('·').map(p => p.trim());
                if (parts[0] && !parts[0].includes('Açık') && !parts[0].includes('Kapalı')) category = parts[0];
                for (const p of parts) {
                  if (p.includes('Sk.') || p.includes('Cd.') || p.includes('Cad.') || p.includes('Mah.') || p.includes('No:')) address = p;
                }
              }
            }

            if (phone) directLeads.push({ name, phone, rating, reviews, category, address, maps_url: href });
          }
          return directLeads;
        }, sector);

        for (const d of extracted) {
          const cleanPhone = (d.phone || '').replace(/\D/g, '');
          if (!cleanPhone || cleanPhone.length < 8) continue;

          const lead = {
            id: `tr_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            name: d.name, district: loc.district, city: loc.city,
            category: d.category || sector, phone: d.phone,
            rating: d.rating, reviews_count: d.reviews,
            address: d.address || `${loc.district}, ${loc.city}`,
            website: "", status: "Aranacak", notes: "", maps_url: d.maps_url
          };

          workerBuffer.push(lead);
          console.log(`[Worker #${wId}] 🔥 ${lead.name} | ${lead.city} | Tel: ${lead.phone}`);

          if (workerBuffer.length >= 3) {
            await appendToMasterFile(workerBuffer);
            workerBuffer.length = 0;
          }
        }

      } catch (err) {
        console.error(`[Worker #${wId}] Hata:`, err.message);
      }
    }
  }

  if (workerBuffer.length > 0) await appendToMasterFile(workerBuffer);
  await browser.close();
  console.log(`[Worker #${wId}] ✅ Görev tamamlandı!`);
}

const workerArg = process.argv.find(a => a.startsWith('--worker='));
const workerId = workerArg ? workerArg.split('=')[1] : '1';
runWorker(workerId).catch(console.error);
