# Cloudinary Kurulum Rehberi

Bu proje, resim yükleme için Cloudinary'yi destekliyor. Bu rehber, Cloudinary'yi nasıl kuracağınızı adım adım açıklıyor.

## 1. Cloudinary Hesabı Oluşturma

1. [Cloudinary](https://cloudinary.com/) web sitesine gidin
2. Ücretsiz hesap oluşturun (Sign Up)
3. Email'inizi doğrulayın

## 2. Cloudinary Ayarlarını Alma

### Cloud Name
1. Dashboard'a giriş yapın
2. Sol üst köşede **Cloud Name** göreceksiniz
3. Bu değeri kopyalayın

### Upload Preset Oluşturma
1. Dashboard'da **Settings** (⚙️) butonuna tıklayın
2. Sol menüden **Upload** sekmesine gidin
3. Aşağı kaydırıp **Upload presets** bölümüne gidin
4. **Add upload preset** butonuna tıklayın
5. Aşağıdaki ayarları yapın:
   - **Upload preset name**: `linktree_unsigned` (veya istediğiniz bir isim)
   - **Signing Mode**: **Unsigned** seçin (çok önemli!)
   - **Folder**: `linktree-avatars` (opsiyonel, resimleri organize etmek için)
   - **Allowed formats**: `jpg, png, gif, webp` (resim formatları)
6. **Save** butonuna tıklayın
7. Oluşturduğunuz preset'in adını kopyalayın

## 3. Ortam Değişkenlerini Ayarlama

### Frontend dizininde `.env` dosyası oluşturun:

```bash
cd frontend
cp .env.example .env
```

### `.env` dosyasını düzenleyin:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=linktree_unsigned
```

**Önemli**: 
- `your_cloud_name_here` yerine kendi Cloud Name'inizi yazın
- `linktree_unsigned` yerine kendi preset adınızı yazın

## 4. Test Etme

1. Frontend'i başlatın:
```bash
npm run dev
```

2. Profil oluşturma sayfasına gidin
3. Avatar yükleme kısmında **☁️ Cloudinary** seçeneğini seçin
4. Bir resim yükleyin
5. Resim başarıyla yüklenirse önizleme görünecektir

## 5. Sorun Giderme

### "Cloudinary not configured" Hatası
- `.env` dosyasının doğru konumda olduğundan emin olun (`frontend/.env`)
- Ortam değişkenlerinin doğru yazıldığını kontrol edin
- Sunucuyu yeniden başlatın

### "Upload failed" Hatası
- Upload preset'in **Unsigned** olduğundan emin olun
- Cloud Name'in doğru olduğunu kontrol edin
- Cloudinary dashboard'da quota'nızı (kullanım limitinizi) kontrol edin

### Resim Yüklenemiyor
- İnternet bağlantınızı kontrol edin
- Cloudinary hesabınızın aktif olduğundan emin olun
- Dosya boyutunun 10MB'dan küçük olduğunu kontrol edin

## 6. Ücretsiz Plan Limitleri

Cloudinary'nin ücretsiz planında:
- **25 GB** storage
- **25 GB** bandwidth/ay
- **25,000** transformations/ay

Bu limitler çoğu geliştirme ve küçük ölçekli projeler için yeterlidir.

## 7. Alternatif Yöntemler

Eğer Cloudinary kullanmak istemezseniz, alternatif olarak:
- **Walrus** (blockchain-based storage)
- **Default avatarlar** (SVG emoji avatarlar)
- **Manuel Walrus CLI** ile yükleme

kullanabilirsiniz. CreateProfile bileşeni bu yöntemleri de destekliyor.

## Güvenlik Notları

⚠️ **Önemli**: 
- `.env` dosyasını asla git'e commit etmeyin (`.gitignore`'da olmalı)
- Upload preset **Unsigned** olmalı (signed presets API secret gerektirir)
- Production'da rate limiting ve abuse prevention ekleyin
- Cloudinary'de upload transformations ile otomatik optimizasyon yapabilirsiniz

## Ek Kaynaklar

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)
- [Unsigned Uploads](https://cloudinary.com/documentation/upload_images#unsigned_upload)
