# 🎨 NFT Avatar Sistemi

## Genel Bakış
Her kullanıcı kayıt olurken **3 random unique avatar** arasından birini seçer. Seçilen avatar **sadece o kullanıcıya ait** olur ve başka kimse aynı avatarı seçemez - tam bir NFT sistemi gibi!

## 📋 Özellikler

### ✅ Tamamlanan
1. **16 Unique Avatar Koleksiyonu**
   - Gerçek resim dosyaları (JPEG/PNG/SVG)
   - `frontend/public/avatars/` klasöründe saklanır
   - ID sistemli takip (1-16 arası)

2. **Random Avatar Seçimi**
   - Kayıt sırasında kullanıcıya 3 random avatar sunulur
   - Daha önce seçilmiş avatarlar filtrelenir
   - Pre-select ile ilk avatar otomatik seçili

3. **Blockchain Üzerinde Uniqueness**
   - `ProfileRegistry` içinde `assigned_avatars` VecMap
   - Avatar ID -> Owner Address mapping
   - Duplicate seçim engellenir (EAvatarAlreadyAssigned)

4. **Avatar Kalıcılığı**
   - Profile silme durumunda avatar serbest bırakılır
   - Başka kullanıcı o avatarı tekrar seçebilir
   - `nft_avatar_id` profile struct'ında saklanır

5. **Gerçek Resim Dosyaları**
   - JPEG, JPG, PNG, SVG formatları desteklenir
   - `nft-1.jpeg`, `nft-2.jpeg`... formatında isimlendirme
   - Public klasöründe static hosting

## 🗂️ Dosya Yapısı

### Backend (Move)
```
move_backend/sources/move_backend.move
├─ LinkTreeProfile struct (nft_avatar_id field eklendi)
├─ ProfileRegistry struct (assigned_avatars dynamic field)
├─ create_profile_v3() - NFT avatar ile profil oluşturma
├─ delete_profile() - Avatar'ı serbest bırakma
├─ init_avatar_registry() - Avatar registry başlatma
├─ is_avatar_assigned() - Avatar kontrolü
├─ assign_avatar() - Avatar atama
├─ unassign_avatar() - Avatar serbest bırakma
└─ get_assigned_avatar_ids() - Atanmış avatar listesi
```

### Frontend (React)
```
frontend/src/
├─ avatarNftService.ts - Avatar yönetim servisi
│  ├─ NFT_AVATARS - 15 avatar path listesi
│  ├─ generateAvatarSvg() - SVG generate
│  ├─ getRandomAvatarsForUser() - Random seçim
│  ├─ getAvatarById() - ID'den avatar getir
│  ├─ avatarIdToString() - Storage formatı
│  └─ parseAvatarId() - Parse avatar ID
│
├─ CreateProfile.tsx - Kayıt formu
│  ├─ NFT avatar seçim UI'ı
│  ├─ 3 avatar card gösterimi
│  ├─ fetchAvailableAvatars() - Blockchain'den mevcut avatarlar
│  └─ create_profile_v3() çağrısı
│
└─ ProfileDashboard.tsx - Profil görüntüleme
   ├─ NFT avatar display
   ├─ Priority: NFT > Cloudinary > Walrus > Default
   └─ parseAvatarId() ile backward compatibility
```

## 🎯 Kullanım Akışı

### 1. Yeni Kullanıcı Kaydı
```
1. Kullanıcı "Create Profile" tıklar
2. Sistem blockchain'den atanmış avatar listesini çeker
3. 16 avatar'dan zaten atanmış olanlar filtrelenir
4. Kalan avatarlardan random 3 tanesi seçilir
5. Kullanıcıya 3 seçenek gösterilir (gerçek resim dosyaları)
6. Kullanıcı birini seçer
7. create_profile_v3() çağrılır:
   - Username unique mi kontrol edilir
   - Avatar müsait mi kontrol edilir (is_avatar_assigned)
   - Profile oluşturulur (nft_avatar_id kaydedilir)
   - Avatar atanır (assign_avatar)
   - Registry'e eklenir
```

### 2. Avatar Görüntüleme
```
1. Profile yüklenirken nft_avatar_id çekilir
2. Display sırası:
   - NFT Avatar (nft_avatar_id > 0 ise)
   - Cloudinary URL (avatarUrl varsa)
   - Walrus Blob (avatar varsa)
   - Default emoji (👤)
3. Gerçek resim dosyası olarak render edilir (JPEG/PNG/SVG)
```

### 3. Profil Silme
```
1. delete_profile() çağrılır
2. Username registry'den silinir
3. Avatar unassign edilir (unassign_avatar)
4. Profile object silinir
5. Avatar tekrar havuza döner (başkaları seçebilir)
```

## 🔧 Teknik Detaylar

### Move Contract
```move
// Profile Struct
public struct LinkTreeProfile has key, store {
    id: UID,
    owner: address,
    username: String,
    content_blob_id: String,
    theme: String,
    username_change_count: u64,
    nft_avatar_id: u64  // 1-16 arası avatar ID
}

// Registry
public struct ProfileRegistry has key, store {
    id: UID
    // Dynamic field: b"assigned_avatars" -> VecMap<u64, address>
}

// Error Codes
const EAvatarAlreadyAssigned: u64 = 3;
```

### Avatar Service
```typescript
// Avatar koleksiyonu (16 gerçek resim dosyası)
export const NFT_AVATARS = [
  '/avatars/nft-1.jpeg',
  '/avatars/nft-2.jpeg',
  // ... 16 total
];

// Random avatar seçimi
export function getRandomAvatarsForUser(
  assignedAvatarIds: number[]
): Array<{id: number, path: string, imageUrl: string}> {
  const available = allAvatars.filter(a => !assignedAvatarIds.includes(a.id));
  return shuffled.slice(0, 3);
}
```

## 📊 Avatar Koleksiyonu

**16 gerçek resim dosyası (JPEG/PNG/SVG)**

| ID | Dosya İsmi | Format | Konum |
|----|------------|--------|-------|
| 1  | nft-1.jpeg | JPEG | `/avatars/nft-1.jpeg` |
| 2  | nft-2.jpeg | JPEG | `/avatars/nft-2.jpeg` |
| 3  | nft-3.jpeg | JPEG | `/avatars/nft-3.jpeg` |
| 4  | nft-4.jpeg | JPEG | `/avatars/nft-4.jpeg` |
| 5  | nft-5.jpeg | JPEG | `/avatars/nft-5.jpeg` |
| 6  | nft-6.jpeg | JPEG | `/avatars/nft-6.jpeg` |
| 7  | nft-7.jpeg | JPEG | `/avatars/nft-7.jpeg` |
| 8  | nft-8.jpeg | JPEG | `/avatars/nft-8.jpeg` |
| 9  | nft-9.jpeg | JPEG | `/avatars/nft-9.jpeg` |
| 10 | nft-10.jpeg | JPEG | `/avatars/nft-10.jpeg` |
| 11 | nft-11.jpeg | JPEG | `/avatars/nft-11.jpeg` |
| 12 | nft-12.jpeg | JPEG | `/avatars/nft-12.jpeg` |
| 13 | nft-13.jpeg | JPEG | `/avatars/nft-13.jpeg` |
| 14 | nft-14.jpeg | JPEG | `/avatars/nft-14.jpeg` |
| 15 | nft-15.jpeg | JPEG | `/avatars/nft-15.jpeg` |
| 16 | nft-16.jpeg | JPEG | `/avatars/nft-16.jpeg` |

### Avatar Dosyalarını Yükleme

1. **16 adet resim hazırlayın** (JPEG, PNG veya SVG)
2. **İsimlendirme**: `nft-1.jpeg`, `nft-2.jpeg`... `nft-16.jpeg`
3. **Konum**: `frontend/public/avatars/` klasörüne koyun
4. **Format değişikliği**: Farklı format kullanıyorsanız `avatarNftService.ts`'deki `NFT_AVATARS` array'ini güncelleyin

Detaylı talimatlar: `frontend/public/avatars/README.md`

## 🚀 Deployment

### Backend Deploy
```bash
cd move_backend
sui client publish --gas-budget 100000000

# Registry oluştur
sui client call \
  --package <PACKAGE_ID> \
  --module linktree \
  --function create_registry \
  --gas-budget 10000000

# Avatar registry başlat
sui client call \
  --package <PACKAGE_ID> \
  --module linktree \
  --function init_avatar_registry \
  --args <REGISTRY_ID> \
  --gas-budget 10000000
```

### Frontend Setup
```bash
cd frontend

# 1. Avatar resimlerini yükle
# frontend/public/avatars/ klasörüne 16 resim koy
# İsimlendirme: nft-1.jpeg, nft-2.jpeg, ... nft-16.jpeg

# 2. Bağımlılıkları yükle
npm install

# 3. Geliştirme sunucusunu başlat
npm run dev
```

## 🎨 UI Özellikleri

### Kayıt Ekranı
- **Başlık**: "🎁 Choose Your FREE NFT Avatar"
- **Alt Başlık**: "Pick one of these 3 unique avatars - it will be yours forever!"
- **Avatar Cards**: 80x80px circular, border animation
- **Seçili**: 4px solid #c96d37 border + shadow
- **Avatar ID**: Alt kısımda #1, #2, #3 gösterimi

### Dashboard
- **Avatar Display**: 80x80px circular
- **Priority System**: NFT > Cloudinary > Walrus > Default
- **Fallback**: 👤 emoji

## 🔒 Güvenlik

1. **Uniqueness Garantisi**: Blockchain kontrol eder
2. **No Duplicates**: `assert!(!is_avatar_assigned())` 
3. **Owner Check**: `assert!(owner == sender)`
4. **Atomic Operations**: Avatar assign/unassign transaction içinde

## 📝 Gelecek Geliştirmeler

- [ ] Avatar trading özelliği
- [ ] Avatar rarity sistemleri (Common, Rare, Legendary)
- [ ] Kullanıcının avatarını başkasına transfer edebilmesi
- [ ] Avatar marketplace
- [ ] Custom avatar upload (premium feature)
- [ ] Avatar animation desteği (GIF/animated SVG)

## 🐛 Bilinen Limitler

1. **16 Avatar Limiti**: Şu an 16 avatar var, daha fazla eklenebilir (backend ve frontend'i güncellemek gerekir)
2. **No Trading**: Avatar değiştirilemez (sadece profil silinirse serbest kalır)
3. **Static Files**: Avatar dosyaları `public` klasöründe, değişiklik için rebuild gerekir
4. **No Preview on Edit**: Edit modda avatar değiştirilemez

## 🎉 Sonuç

Bu sistem kullanıcılara **unique, kalıcı ve NFT benzeri** bir avatar deneyimi sunar. Blockchain garantili uniqueness ile her kullanıcının kendine özel avatarı olur!
