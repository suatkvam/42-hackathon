# Tusky Vault Entegrasyonu

Bu proje, Tusky decentralized storage platformunu kullanarak kullanıcıların resimlerini güvenli bir vault'ta saklayabilmesi ve gelecekte NFT'ye dönüştürebilmesi için tasarlanmıştır.

## 🚀 Özellikler

- ✅ **Resim Yükleme**: Kullanıcılar resimlerini Tusky vault'a yükleyebilir
- ✅ **Vault Yönetimi**: Tüm asset'leri görüntüleme, listeleme ve silme
- ✅ **Güvenli Depolama**: End-to-end şifreli, decentralized storage (Walrus protokolü)
- 🔜 **NFT Minting**: Asset'leri Sui blockchain'de NFT'ye dönüştürme (Tusky'de "coming soon")
- 🔜 **Token Gated Access**: Private vault'lara token-bazlı erişim (2025'te gelecek)

## 📦 Kurulum

### 1. Dependencies Yükle

```bash
cd frontend
npm install
```

### 2. Environment Değişkenlerini Ayarla

`.env` dosyası oluştur ve aşağıdaki bilgileri ekle:

```env
VITE_TUSKY_API_KEY=your_api_key_here
VITE_TUSKY_VAULT_ID=your_vault_id_here
VITE_TUSKY_API_URL=https://api.tusky.io
```

**Not**: `.env.example` dosyasından kopyalayabilirsiniz.

### 3. Development Server'ı Başlat

```bash
npm run dev
```

## 🔑 API Anahtarı ve Vault ID Alma

1. [Tusky App](https://app.tusky.io) 'e gidin
2. Sui wallet veya Google/Twitch hesabınızla giriş yapın
3. Yeni bir vault oluşturun veya mevcut vault'unuzu kullanın
4. Settings > API Keys'den yeni bir API key oluşturun
5. Vault ID'nizi URL'den alın: `https://app.tusky.io/vaults/YOUR_VAULT_ID/assets`

## 📂 Dosya Yapısı

```
frontend/
├── src/
│   ├── tuskyService.ts      # Tusky API servis fonksiyonları
│   ├── VaultManager.tsx     # Vault yönetim komponenti
│   ├── walrusService.ts     # Walrus storage servisi
│   └── App.tsx             # Ana uygulama routing
├── .env                    # Environment değişkenleri (git'te değil)
└── .env.example           # Environment değişkenleri template
```

## 🔧 API Fonksiyonları

### `tuskyService.ts`

- `uploadImageToTusky(file: File)` - Resim yükle
- `getVaultAssets()` - Tüm asset'leri getir
- `getAsset(assetId: string)` - Belirli bir asset'i getir
- `deleteAsset(assetId: string)` - Asset'i sil
- `mintNFTFromAsset(assetId: string, metadata)` - NFT mint et (coming soon)
- `getRandomAssets(count: number)` - Random asset'ler getir (avatar seçimi için)

## 🎨 Kullanım

### Vault Manager'a Erişim

Tarayıcınızda şu adrese gidin:

```
http://localhost:5173/vault
```

### Resim Yükleme

1. "Resim Yükle" butonuna tıklayın
2. Bilgisayarınızdan bir resim seçin
3. Resim otomatik olarak Tusky vault'a yüklenecek

### NFT Oluşturma (Coming Soon)

1. Bir asset'in üzerine tıklayın
2. "NFT Yap" butonuna tıklayın
3. NFT ismi ve açıklaması girin
4. "NFT Oluştur" butonuna tıklayın

**Not**: NFT minting özelliği Tusky tarafından "coming soon" olarak işaretlenmiştir.

## 🔐 Güvenlik

- API anahtarları `.env` dosyasında saklanır ve git'e commit edilmez
- Tüm data end-to-end şifrelidir
- Walrus decentralized storage protokolü kullanılır
- Sui blockchain altyapısı

## 📚 Kaynaklar

- [Tusky Docs](https://docs.tusky.io)
- [Tusky App](https://app.tusky.io)
- [Walrus Protocol](https://docs.walrus.site)
- [Sui Blockchain](https://sui.io)

## 🐛 Bilinen Sorunlar ve Çözümler

### 1. Walrus Testnet Çalışmıyor (Profile Upload Hatası)

**Sorun**: Walrus testnet API geçici olarak kullanılamıyor, resim yükleme başarısız oluyor.

**Çözüm**: Profile oluştururken 3 alternatif sunuyoruz:

1. **Varsayılan Avatar Seçimi** (✅ En Kolay)
   - Profile oluşturma ekranında 4 farklı varsayılan avatar var
   - Herhangi birine tıklayarak seçin
   - Walrus'a bağlı değil, SVG data URL kullanıyor

2. **Walrus CLI ile Manuel Yükleme**
   ```bash
   # Walrus CLI kurun
   cargo install walrus-cli
   
   # Resim yükleyin
   walrus store resim.png
   
   # Aldığınız blob_id'yi profile formuna yapıştırın
   ```

3. **Walrus Testnet Düzelene Kadar Bekleyin**
   - Testnet düzeldikten sonra "📤 Upload Image" butonu çalışacak

### 2. Tusky Public API Mevcut Değil (404 Hatası)

**Sorun**: Tusky'nin public API'si henüz tam olarak hazır değil. `/v1/vaults/{id}/assets` endpoint'i 404 hatası veriyor.

**Çözüm Seçenekleri**:

#### A) Tusky Web App Kullanımı (Mevcut Çözüm)
Kod hazır ama API aktif olmadığı için direkt Tusky web app'ını kullanabilirsiniz:
- https://app.tusky.io/vaults/YOUR_VAULT_ID/assets
- Vault Manager'da "Tusky App'ı Aç" butonu ile direkt bağlantı

#### B) Tusky TypeScript SDK Bekleme
Tusky resmi TypeScript SDK release ettiğinde:
```bash
npm install @tusky/sdk  # Henüz mevcut değil
```

#### C) Tusky API Dokumantasyonu İnceleme
- https://docs.tusky.io/http-api (Resmi API dokümantasyonu bekleniyor)
- API Key'in doğru scope'a sahip olduğundan emin olun
- Endpoint formatını kontrol edin (belki `/api/v1/` veya farklı bir prefix)

#### D) CORS Proxy Kullanımı
Eğer API mevcut ama CORS sorunu varsa:
```js
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/tusky': {
        target: 'https://api.tusky.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tusky/, '')
      }
    }
  }
});
```

### 3. NFT Minting
**Durum**: Tusky'de "coming soon" 
**Hazırlık**: Kod hazır, API aktif olunca çalışacak

### 4. Token Gated Access
**Durum**: 2025'te gelecek

---

## 🚀 Hızlı Başlangıç (Walrus/Tusky Sorunları için)

**Şu anda ne yapabilirsiniz:**

1. ✅ **Profile Oluşturun**: Varsayılan avatarlarla profile oluşturma çalışıyor
2. ✅ **Kod Hazır**: Tusky ve Walrus API'leri düzeldikten sonra otomatik çalışacak
3. 🚧 **Vault Yönetimi**: Şimdilik https://app.tusky.io üzerinden kullanın
**API'ler düzeldiğinde:**
- Walrus'a direkt resim yükleme çalışacak
- Tusky vault entegrasyonu otomatik aktif olacak
- NFT minting (Tusky feature release'i bekleniyor)

## 🤝 Katkıda Bulunma

1. API endpoint'leri Tusky documentation'dan kontrol edilmeli
2. NFT minting özellği aktif olduğunda `tuskyService.ts`'deki `mintNFTFromAsset` fonksiyonu güncellenmelidir
3. Tusky TypeScript SDK release edildiğinde direkt HTTP istekleri yerine SDK kullanılmalıdır

## 📝 Lisans

Bu proje 42 Hackathon kapsamında geliştirilmiştir.
