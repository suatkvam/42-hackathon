# 🎨 NFT Avatar Dosyaları

## 📂 Bu Klasöre 16 Avatar Resmi Koyun

### Dosya İsimlendirme
Resimleri şu şekilde isimlendirin:

```
nft-1.jpeg
nft-2.jpeg
nft-3.jpeg
nft-4.jpeg
nft-5.jpeg
nft-6.jpeg
nft-7.jpeg
nft-8.jpeg
nft-9.jpeg
nft-10.jpeg
nft-11.jpeg
nft-12.jpeg
nft-13.jpeg
nft-14.jpeg
nft-15.jpeg
nft-16.jpeg
```

### Desteklenen Formatlar
- ✅ `.jpeg` (önerilen)
- ✅ `.jpg`
- ✅ `.png`
- ✅ `.svg`

### Önerilen Özellikler
- **Boyut**: 512x512px veya 1024x1024px
- **Format**: JPEG (daha küçük dosya boyutu)
- **Kalite**: Yüksek kalite, net görüntü
- **Stil**: Tutarlı stil (hepsi aynı tarzda olmalı)

### Örnek Yapı
```
frontend/public/avatars/
├── nft-1.jpeg   (Kırmızı ton, karakter 1)
├── nft-2.jpeg   (Mavi ton, karakter 2)
├── nft-3.jpeg   (Yeşil ton, karakter 3)
├── ...
└── nft-16.jpeg  (Son karakter)
```

### Farklı Format Kullanıyorsanız

Eğer `.jpg` veya `.png` kullanacaksanız, serviste güncelleme yapın:

**Adım 1**: `frontend/src/avatarNftService.ts` dosyasını açın

**Adım 2**: `NFT_AVATARS` array'ini güncelleyin:

```typescript
// .jpg kullanıyorsanız:
export const NFT_AVATARS = [
  '/avatars/nft-1.jpg',
  '/avatars/nft-2.jpg',
  // ...
];

// .png kullanıyorsanız:
export const NFT_AVATARS = [
  '/avatars/nft-1.png',
  '/avatars/nft-2.png',
  // ...
];
```

### ⚠️ Önemli Notlar

1. **Dosya isimlerinde numara sırası önemli!**
   - `nft-1.jpeg` → Avatar ID 1
   - `nft-2.jpeg` → Avatar ID 2
   - vs...

2. **Tüm 16 dosya olmalı!**
   - Eksik dosya varsa hata alırsınız
   - Fazla dosya sorun değil (kullanılmaz)

3. **Dosya boyutlarına dikkat!**
   - Çok büyük resimler (>2MB) yavaş yüklenebilir
   - Optimize edilmiş JPEG önerilir

4. **Test etmeyi unutmayın!**
   - Dosyaları koyduktan sonra `npm run dev` ile çalıştırın
   - Yeni profil oluştururken 3 avatar görmeli

### 🔧 Sorun Giderme

**Avatar görünmüyor mu?**
1. Dosya isimlerini kontrol edin (nft-1.jpeg, nft-2.jpeg...)
2. Dosya formatını kontrol edin (.jpeg, .jpg, .png, .svg)
3. Browser console'da hata var mı bakın (F12)
4. Sunucuyu yeniden başlatın (`npm run dev`)

**404 hatası alıyorum!**
- Dosyaların `frontend/public/avatars/` klasöründe olduğundan emin olun
- Dosya isimlerinin küçük harf olduğundan emin olun
- Path'in `/avatars/nft-X.jpeg` formatında olduğundan emin olun

### 📸 Avatar Tasarımı İpuçları

1. **Tutarlı Stil**: Tüm avatarlar aynı stil ve kalitede olmalı
2. **Farklı Renkler**: Her avatar farklı renk/ton kullanmalı
3. **Tanımlayıcı**: Her avatar kolayca ayırt edilebilmeli
4. **Kare Format**: 1:1 oran kullanın (örn. 512x512)
5. **Arka Plan**: Şeffaf veya düz renk arka plan tercih edin

### ✅ Hazır mısınız?

Dosyalarınızı bu klasöre koyun ve sistemi başlatın:

```bash
cd /home/sora/Desktop/42-hackathon/frontend
npm run dev
```

Kayıt ekranında 3 random avatar görmelisiniz! 🎉
