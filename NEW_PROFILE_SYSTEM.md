# 🎨 Yeni Profil Sistemi

## 🎯 Değişiklikler

### Öncesi
- Avatar/Blob ID zorunluydu
- Walrus testnet sorunları profil oluşturmayı engelliyor
- Tek adımda her şey yapılıyordu

### Sonrası
- ✅ Avatar **opsiyonel** (daha sonra eklenebilir)
- ✅ **Link yönetimi** entegre edildi
- ✅ **Responsive** tasarım
- ✅ **Username değiştirilemez** ve benzersiz
- ✅ Basitleştirilmiş, temiz UI

## 📋 Yeni Profil Oluşturma Akışı

### 1. Temel Bilgiler (Şimdi)
```
✓ Kullanıcı Adı (username) - değiştirilemez, URL için
✓ Görünen İsim (name)
✓ Biyografi (bio)
✓ Linkler (opsiyonel)
✓ Tema seçimi
```

### 2. Avatar & NFT (Daha Sonra)
```
◯ Avatar yükleme
◯ Blob ID belirleme
◯ NFT mint etme
```

## 🔗 Link Sistemi

### Özellikler
- Multiple link ekleme
- Label + URL formatı
- Dinamik ekleme/çıkarma
- Profil oluştururken veya sonrasında eklenebilir

### Kullanım
```typescript
// Profil oluşturma sırasında
{
  username: "ali_veli",
  name: "Ali Veli",
  links: [
    { label: "Twitter", url: "https://twitter.com/aliveli" },
    { label: "GitHub", url: "https://github.com/aliveli" }
  ]
}
```

## 🔐 Username Sistemi

### Kurallar
- ✅ Sadece harf, rakam, `-` ve `_`
- ✅ Benzersiz olmalı (registry'de kontrol edilir)
- ✅ Küçük harfe çevrilir otomatik
- ⛔ Oluşturulduktan sonra değiştirilemez

### URL Yapısı
```
Kullanıcı Adı: ali_veli
Profil URL: https://suitree.app/ali_veli
```

## 📱 Responsive Tasarım

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### CSS Teknikleri
```css
/* Fluid typography */
font-size: clamp(16px, 3vw, 20px);

/* Flexible grid */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

/* Responsive padding */
padding: clamp(20px, 5vw, 40px);
```

## 🎨 Komponent Yapısı

```
src/
├── CreateProfileSimple.tsx    # Yeni basitleştirilmiş profil oluşturma
├── CreateProfile.tsx          # Eski komponent (avatar ile)
├── VaultManager.tsx           # Tusky vault entegrasyonu
├── ProfilePage.tsx            # Ana profil sayfası
└── LandingPage.tsx           # Ana sayfa (responsive)
```

## 🚀 Kullanım

### Profil Oluşturma
```tsx
<CreateProfileSimple
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    // Profil başarıyla oluşturuldu
    window.location.reload();
  }}
/>
```

### Avatar Ekleme (İleride)
```tsx
// ProfileSettings komponenti ile
<AvatarUpload
  profileId={profileObjectId}
  onSuccess={(blobId) => {
    // Avatar güncellendi
  }}
/>
```

## 📊 Move Contract Desteği

### Mevcut Yapı
```move
public struct LinkTreeProfile has key, store {
    id: UID,
    owner: address,
    username: String,       // ✅ Benzersiz, değiştirilemez
    name: String,          // ✅ Güncellenebilir
    bio: String,           // ✅ Güncellenebilir
    blob_id: String,       // ✅ Opsiyonel (boş string)
    links: VecMap<String, String>,  // ✅ Link array
    theme: String          // ✅ Tema seçimi
}
```

### API Fonksiyonları
```move
// Profil oluşturma
create_profile_v2(
    registry: &mut ProfileRegistry,
    username: String,
    name: String,
    bio: String,
    blob_id: String,  // Boş string gönderile bilir
    theme: String,
    ctx: &mut TxContext
)

// Link ekleme
add_link(
    profile: &mut LinkTreeProfile,
    label: String,
    url: String,
    ctx: &mut TxContext
)

// Username kontrolü
username_exists(
    registry: &ProfileRegistry, 
    username: String
): bool
```

## 🎯 Gelecek Özellikler

### Faz 1: Temel (✅ Tamamlandı)
- [x] Basitleştirilmiş profil oluşturma
- [x] Link yönetimi
- [x] Username sistemi
- [x] Responsive tasarım

### Faz 2: Avatar & Media (🚧 Yapım Aşamasında)
- [ ] Avatar upload sistemi
- [ ] Tusky vault entegrasyonu
- [ ] Walrus storage direkt entegrasyonu
- [ ] Avatar preview & crop

### Faz 3: NFT (🔜 Yakında)
- [ ] Profile avatar'ı NFT olarak mint etme
- [ ] NFT gallery
- [ ] NFT marketplace entegrasyonu
- [ ] Tusky NFT API (API release'i bekleniyor)

### Faz 4: Sosyal (🔮 Gelecek)
- [ ] Profil takip sistemi
- [ ] Feed sistemi
- [ ] Yorum ve beğeni
- [ ] Token-gated content (2025 - Tusky)

## 🐛 Bilinen Sorunlar

### 1. Walrus Testnet
**Durum**: Geçici olarak çalışmıyor
**Çözüm**: Avatar opsiyonel yapıldı, daha sonra eklenebilir

### 2. Tusky API
**Durum**: Public API henüz mevcut değil
**Çözüm**: Tusky web app üzerinden kullanılabilir

### 3. Link Ekleme (Profil Sonrası)
**Durum**: Şu anda linker profile oluşturma sırasında eklenebilir
**TODO**: Profil oluştuktan sonra da link ekleme UI'ı gerekli

## 📝 Migration Guide

### Eski koddan yeni koda geçiş

**Önce:**
```tsx
<CreateProfile
  isEditing={false}
  onClose={() => {}}
  onSuccess={() => {}}
  existingProfile={undefined}
/>
```

**Sonra:**
```tsx
<CreateProfileSimple
  onClose={() => {}}
  onSuccess={() => {}}
/>
```

### Avatar Ekleme

**Önce:** Zorunlu, profil oluşturma sırasında
**Sonra:** Opsiyonel, profil ayarlarından eklenebilir

```tsx
// ProfileSettings.tsx (yeni komponent gerekli)
function AvatarSection() {
  return (
    <div>
      <h3>Avatar Ekle</h3>
      {/* Avatar upload UI */}
    </div>
  );
}
```

## 🤝 Katkıda Bulunma

Yeni profil sistemi modüler tasarlandı:
- Her feature ayrı komponent
- Bağımsız test edilebilir
- Kolay genişletilebilir

### Yeni Link Tipi Ekleme
```tsx
// CreateProfileSimple.tsx
const LINK_TEMPLATES = {
  twitter: { icon: "🐦", placeholder: "https://twitter.com/username" },
  github: { icon: "🐙", placeholder: "https://github.com/username" },
  // Yeni tip buraya eklenebilir
};
```

## 📚 Kaynaklar

- [Sui Move Documentation](https://docs.sui.io/build/move)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Responsive Design Patterns](https://web.dev/responsive-web-design-basics/)
- [Tusky Documentation](https://docs.tusky.io)
