# ODES demo prototipi

Çalışan, bağımlılıksız (HTML + CSS + JavaScript) bir demo prototipidir. Derleme veya sunucu gerekmez: `index.html` dosyasını tarayıcıda açmanız yeterlidir. (İsterseniz `python3 -m http.server` ile de sunabilirsiniz.)

## Demo hesapları

Giriş ekranındaki "Hızlı demo girişi" düğmelerini kullanabilir veya e-posta ile giriş yapabilirsiniz. Şifre alanı doğrulanmaz.

| Rol | E-posta |
| --- | --- |
| Öğrenci | ogrenci@odes.demo |
| Öğretmen | ogretmen@odes.demo |
| Yönetici | yonetici@odes.demo |

Öğretmen olarak kayıt olursanız hesabınız "onay bekliyor" durumuna düşer; yönetici paneli > Onay bekleyenler ekranından onaylayabilirsiniz.

## Dosya yapısı

```
index.html                    → login.html'e yönlendirir
login.html / register.html    → giriş ve kayıt
student.html                  → öğrenci paneli (genel bakış, ödev, not, program, bildirimler)
teacher.html                  → öğretmen paneli (sınıflar, yoklama, ödev, bildirimler)
admin.html                    → yönetici paneli (kullanıcılar, onaylar, günlük, bildirimler)
notification-create.html      → bildirim oluşturma (taslak / hemen / zamanlı)
notification-history.html     → geçmiş, durum takibi, okunma, hatırlatma
admin-stats.html              → istatistikler, CSV dışa aktarma
assets/css/styles.css         → ortak tasarım sistemi
assets/js/data.js             → demo veri deposu (localStorage) ve iş kuralları
assets/js/app.js              → ortak kabuk, menü, modal, toast, gelen kutusu, grafikler
assets/js/pages/*.js          → ekran başına betikler
```

## Önemli sınırlamalar (prototip)

- **Gerçek kimlik doğrulama yoktur.** Giriş yalnızca e-posta ile demo hesabı eşleştirir; şifre hiçbir yerde doğrulanmaz, saklanmaz veya gönderilmez.
- **Veriler yalnızca bu tarayıcıda** (`localStorage`) tutulur; cihazlar arasında paylaşılmaz. Kullanıcı menüsündeki "Demo verilerini sıfırla" ile başlangıca dönülür.
- **Yetki kontrolleri yalnızca istemci tarafındadır** (rol yönlendirmesi, öğretmenin yalnızca kendi sınıflarına gönderebilmesi). Üretimde bunların sunucuda uygulanması gerekir.
- **Bildirimler gerçekten iletilmez** (e-posta/SMS/push yok). Zamanlanmış bildirimler, sayfa yüklendiğinde zamanı gelmişse "gönderildi" olur; arka planda çalışan bir zamanlayıcı yoktur.
- Not, devamsızlık ve ders programı demo verisidir.
