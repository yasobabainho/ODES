ODES – Okul Deneyim ve Güvenlik Sistemi

ODES (Okul Deneyim ve Güvenlik Sistemi), okullarda karşılaşılabilecek güvenlik sorunlarının bildirilmesi, değerlendirilmesi ve analiz edilmesi amacıyla geliştirilmiş web tabanlı bir demo prototipidir.

Proje; öğrencilerin okul ortamında karşılaştıkları riskleri kolayca bildirebilmesini, öğretmenlerin bu bildirimleri inceleyip takip edebilmesini ve okul yönetiminin güvenlik durumunu veriler üzerinden değerlendirebilmesini hedefler.

Projenin Amacı

ODES'in temel amacı, okul güvenliğini yalnızca sorunlar ortaya çıktıktan sonra ele almak yerine, risklerin erken fark edilmesini ve önleyici çalışmaların desteklenmesini sağlamaktır.

Bu doğrultuda sistem; bildirimlerin belirli kategoriler, okul bölgeleri, önem dereceleri ve tekrar sıklıkları üzerinden sınıflandırılmasına olanak tanır. Böylece okul ortamındaki risklerin daha düzenli takip edilmesi ve gerekli müdahalelerin planlanması amaçlanır.

Temel Özellikler

Öğrenci Paneli

- Okul ortamında karşılaşılan riskler için bildirim oluşturma.
- Bildirimleri kategori, konum, önem derecesi ve sıklığa göre sınıflandırma.
- İsteğe bağlı anonim bildirim oluşturma.
- Kendi bildirimlerinin işlem durumunu takip etme.
- Bildirim geçmişini ve gelen kutusunu görüntüleme.

Öğretmen Paneli

- Erişimine açık güvenlik bildirimlerini görüntüleme.
- Bildirimleri inceleme ve değerlendirme.
- Bildirimlerin durumunu güncelleme.
- Bildirim geçmişini ve gelen kutusunu takip etme.

Yönetici Paneli

- Güvenlik bildirimlerini görüntüleme ve yönetme.
- Bildirimleri öğretmenlere atama.
- Bildirimlerin işlem durumlarını takip etme.
- Okul bölgelerine göre risk dağılımını inceleme.
- Risk istatistiklerini ve genel değerlendirmeleri görüntüleme.
- İstatistikleri CSV formatında dışa aktarma.
- Demo kullanıcılarını yönetme ve öğretmen kayıtlarını onaylama.
- Etkinlik günlüğünü ve gelen kutusunu görüntüleme.

Risk Sınıflandırması

ODES, bildirimleri aşağıdaki ölçütlere göre sınıflandırır:

Ölçüt| Seçenekler
Kategoriler| Akran zorbalığı, güvenlik, fiziksel ortam, iletişim, diğer
Önem derecesi| Düşük, orta, yüksek, kritik
Bildirim sıklığı| Bir kez, ara sıra, sık sık, sürekli
İşlem durumu| Yeni, inceleniyor, çözüldü, kapatıldı

Bildirimler ayrıca okulun farklı bölümlerine göre konumlandırılabilir. Örneğin sınıflar, koridorlar, merdivenler, tuvaletler, laboratuvarlar, kütüphane, kantin ve spor salonu.

Risk İstatistikleri ve Analiz

Yönetici panelindeki istatistikler sayfası, kayıtlı bildirimleri farklı ölçütlere göre analiz eder.

- Tarih aralığına göre filtreleme (7, 30, 90 gün ve tüm zamanlar).
- Bildirim durumlarının dağılımı.
- Risk önem derecelerinin dağılımı.
- Kategori ve bildirim sıklığı analizleri.
- Okul bölgelerine göre bildirim dağılımı.
- Açık yüksek ve kritik risklerin listelenmesi.
- Son bildirimlerin görüntülenmesi.
- CSV formatında veri dışa aktarma.

Bu istatistikler mevcut bildirim kayıtlarını özetler; tek başına okulun gerçek güvenlik düzeyini kanıtlamaz.

Kullanılan Teknolojiler

- HTML5
- CSS3
- JavaScript
- LocalStorage
- GitHub Pages

Proje, harici bir JavaScript kütüphanesi veya derleme işlemi gerektirmeyen bir demo prototipidir.

Projeyi Çalıştırma

Projeyi yerel ortamda çalıştırmak için:

1. Depoyu bilgisayarınıza indirin veya klonlayın.
2. Proje klasörünü açın.
3. "index.html" dosyasını tarayıcıda açın.

Alternatif olarak proje klasöründe yerel sunucu başlatabilirsiniz:

python3 -m http.server 8000

Ardından tarayıcıdan şu adresi açın:

http://localhost:8000

Demo Hesapları

Demo ortamında aşağıdaki örnek hesaplar kullanılabilir:

Rol| E-posta
Öğrenci| ogrenci@odes.demo
Öğretmen| ogretmen@odes.demo
Yönetici| yonetici@odes.demo

Demo girişinde parola kullanılmaz. Öğretmen kayıtları yönetici onayına bağlıdır.

Demo Sınırlamaları ve Güvenlik Notları

ODES şu anda işlevleri göstermek amacıyla geliştirilmiş bir prototiptir. Gerçek bir okul ortamında kullanılmadan önce aşağıdaki geliştirmeler gereklidir:

- Gerçek kullanıcı doğrulama ve sunucu taraflı yetkilendirme sistemi kurulmalıdır.
- Veriler güvenli bir sunucu veritabanında saklanmalıdır.
- Kullanıcı rollerine göre erişim kontrolleri sunucu tarafında uygulanmalıdır.
- Anonim bildirimlerin gizliliği teknik ve idari önlemlerle güvence altına alınmalıdır.
- Gerçek bildirim ve kullanıcı verileri için veri koruma süreçleri oluşturulmalıdır.

Mevcut prototipte veriler tarayıcının LocalStorage alanında tutulur. Bu nedenle farklı cihazlar arasında otomatik veri paylaşımı yapılmaz ve mevcut giriş sistemi gerçek kimlik doğrulama sağlamaz.

Önemli: Demo ortamı gerçek öğrenci bilgileri veya hassas okul verileriyle kullanılmamalıdır.

Proje Bağlantıları

- Canlı Demo: https://yasobabainho.github.io/ODES/
- GitHub Deposu: https://github.com/yasobabainho/ODES

Proje Hedefi

ODES, okul ortamındaki güvenlik risklerinin daha erken fark edilmesini, düzenli biçimde raporlanmasını ve gerekli önleyici çalışmaların desteklenmesini amaçlar.

Daha güvenli okul ortamları için riskleri fark et, bildir ve değerlendir.
