# Analytics Setup Guide (Supabase)

Analytics özelliğini aktif etmek için Supabase'de bir proje oluşturup yapılandırmanız gerekiyor.

## 1. Supabase Projesi Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. Ücretsiz hesap oluşturun veya giriş yapın
3. "New Project" butonuna tıklayın
4. Proje adı, database şifresi seçin ve region seçin
5. "Create new project" butonuna tıklayın (1-2 dakika sürebilir)

## 2. Database Tablosunu Oluşturma

1. Supabase dashboard'da projenize gidin
2. Sol menüden **SQL Editor**'e tıklayın
3. "New query" butonuna tıklayın
4. `SUPABASE_SETUP.sql` dosyasının içeriğini kopyalayıp yapıştırın
5. "Run" butonuna basın

## 3. API Credentials Alma

1. Supabase dashboard'da sol menüden **Settings** → **API**'ye gidin
2. Aşağıdaki bilgileri kopyalayın:
   - **Project URL**: `https://xxxxx.supabase.co` formatında
   - **Project API keys** → **anon public**: `eyJ...` ile başlar

## 4. .env Dosyasını Güncelleme

`.env` dosyasına şu satırları ekleyin:

```bash
# Analytics (Supabase)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5. Uygulamayı Yeniden Başlatma

```bash
# Development server'ı yeniden başlatın
pnpm dev
```

## Özellikler

Analytics aktif olduğunda:
- ✅ Her link tıklaması kaydedilir
- ✅ Analytics dashboard'da istatistikler görüntülenir:
  - Toplam tıklama sayısı
  - Link başına tıklamalar
  - Günlere göre tıklamalar
  - Cihaz tipine göre dağılım (mobile/desktop/tablet)
  - Referrer kaynakları (nereden geldi)
  - En aktif saatler
  - Son 7 günlük aktivite

## Test Etme

1. Public profile sayfanıza gidin
2. Linklere tıklayın
3. Dashboard'a dönün ve Analytics ikonuna tıklayın
4. İstatistikleri görüntüleyin

## Notlar

- Analytics **opsiyonel**dir, yapılandırmazsanız sadece uyarı alırsınız
- Tüm veriler kendi Supabase projenizde saklanır
- Ücretsiz tier: 500MB database + 2GB bandwidth/ay
- RLS (Row Level Security) aktif, herkes veri ekleyip okuyabilir
- 90 günden eski veriler opsiyonel cleanup fonksiyonu ile temizlenebilir
