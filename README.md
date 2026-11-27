ODES – Okul Deneyim ve Güvenlik Sistemi

ODES, okullarda karşılaşılabilecek güvenlik risklerinin bildirilmesini, değerlendirilmesini ve analiz edilmesini amaçlayan web tabanlı bir demo prototipidir.

Proje; öğrencilerin karşılaştıkları veya gözlemledikleri riskli durumları bildirebilmesini, öğretmenlerin bu bildirimleri inceleyebilmesini ve yöneticilerin okul genelindeki riskleri takip ederek önleyici çalışmalar planlayabilmesini hedefler.

Projenin Amacı

ODES'in temel amacı, okul ortamında meydana gelebilecek güvenlik sorunlarının erken fark edilmesine ve sistematik biçimde değerlendirilmesine katkı sağlamaktır.

Sistem; risk bildirimlerini kategorilerine, konumlarına, sıklıklarına ve önem derecelerine göre sınıflandırarak okul güvenliğine yönelik daha bilinçli kararlar alınmasını destekler.

Temel Özellikler

Öğrenci Modülü

- Okul içerisinde karşılaşılan veya gözlemlenen riskli durumları bildirme
- Bildirimleri kategori ve konum bilgileriyle oluşturma
- Riskin önem derecesini ve tekrarlanma sıklığını belirtme
- İsteğe bağlı anonim bildirim oluşturma
- Bildirimlerin durumunu takip etme

Öğretmen Modülü

- Kendisine yönlendirilen risk bildirimlerini görüntüleme
- Bildirimleri inceleme ve değerlendirme
- Bildirim durumlarını güncelleme
- Müdahale ve değerlendirme sürecini takip etme

Yönetici Modülü

- Okuldaki risk bildirimlerini genel olarak görüntüleme
- Bildirimleri inceleme ve ilgili öğretmenlere yönlendirme
- Bildirimlerin durumlarını takip etme
- Risk haritası üzerinden risklerin okul içerisindeki dağılımını inceleme
- Risk istatistikleriyle kategori, konum, sıklık ve önem derecesi analizlerini görüntüleme
- Verileri CSV formatında dışa aktarma

Risk Sınıflandırması

ODES, bildirimleri aşağıdaki temel ölçütlere göre değerlendirir:

Ölçüt| Sınıflandırma
Kategoriler| Zorbalık, güvenlik, fiziksel ortam, iletişim, diğer
Önem derecesi| Düşük, orta, yüksek, kritik
Sıklık| Bir kez, bazen, sık sık, sürekli
Durum| Yeni, inceleniyor, çözüldü, kapatıldı

Bildirimlerde okulun farklı alanları konum olarak seçilebilir. Böylece risklerin hangi alanlarda yoğunlaştığı değerlendirilebilir.

Kullanılan Teknolojiler

- HTML5: Sayfa yapılarının oluşturulması
- CSS3: Arayüz tasarımı ve duyarlı görünüm
- JavaScript: Uygulama mantığı, veri yönetimi ve etkileşimler
- LocalStorage: Demo verilerinin tarayıcıda saklanması
- GitHub Pages: Projenin internet üzerinden görüntülenmesi

Proje herhangi bir JavaScript kütüphanesine veya derleme işlemine ihtiyaç duymadan çalışan bir prototip olarak geliştirilmiştir.

Projeyi Çalıştırma

ODES'i görüntülemek için:

1. GitHub deposunu açın.
2. Proje dosyalarını indirin veya depoyu klonlayın.
3. "index.html" dosyasını bir tarayıcıda açın.

Alternatif olarak proje bir yerel HTTP sunucusu üzerinden çalıştırılabilir:

python3 -m http.server 8000

Ardından tarayıcıdan "http://localhost:8000" adresine gidilebilir.

Demo Hesapları

Giriş ekranındaki hızlı demo girişlerini kullanabilir veya aşağıdaki e-posta adresleriyle giriş yapabilirsiniz.

Rol| E-posta
Öğrenci| ogrenci@odes.demo
Öğretmen| ogretmen@odes.demo
Yönetici| yonetici@odes.demo

Demo prototipinde şifre doğrulaması yapılmaz.

Öğretmen olarak kayıt oluşturulduğunda hesap yönetici onayı bekler.

Önemli Sınırlamalar

ODES mevcut hâliyle bir demo prototipidir. Gerçek okul ortamında kullanılmadan önce aşağıdaki geliştirmelere ihtiyaç vardır:

- Gerçek kullanıcı kimlik doğrulama sistemi bulunmamaktadır.
- Veriler tarayıcının "localStorage" alanında tutulur; farklı cihazlar arasında otomatik olarak paylaşılmaz.
- Yetki kontrolleri istemci tarafında gerçekleştirilir. Gerçek kullanımda sunucu tarafında güvenli yetkilendirme gereklidir.
- Bildirimler gerçek e-posta, SMS veya anlık bildirim hizmetleri üzerinden iletilmez.
- Demo verileri gerçek okul güvenliği verileri değildir.

Bu nedenle mevcut sürüm, projenin temel işleyişini ve arayüzünü göstermek amacıyla hazırlanmıştır.

Proje Bağlantısı

GitHub deposu: https://github.com/yasobabainho/ODES

Canlı demo: https://yasobabainho.github.io/ODES/

---

ODES – Daha güvenli okul ortamları için riskleri fark et, bildir ve değerlendir.
