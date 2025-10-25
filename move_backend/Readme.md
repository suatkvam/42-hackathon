# Move Akıllı Sözleşme (V2) - Teknik Kullanım Kılavuzu

Bu doküman, `move_backend` paketimizin V2 (Dinamik Alanlar) sürümünün frontend (React) tarafından nasıl kullanılacağını açıklar.

## V2'ye Genel Bakış (Dinamik Alanlar)

V1 (MVP), profilleri (`LinkTreeProfile`) oluşturup doğrudan kullanıcının cüzdanına gönderiyordu. Bu profilleri bulmak için `ObjectID` (`0x...`) gerekiyordu.

V2, bu sorunu çözmek için "Telefon Rehberi" (Registry) adı verilen **paylaşılan bir obje** (`ProfileRegistry`) sunar. Bu rehber, **kullanıcı adı** (`String`, örn: "sora") ile **profil ID'sini** (`ID`, örn: `0x...`) eşleştirir.

## 1. Kurulum (Tek Seferlik Gereklilik)

V2'nin çalışması için, tüm sistemi (`create_profile`) besleyecek olan "Telefon Rehberi" (`ProfileRegistry`) objesinin *bir kez* oluşturulması ve ID'sinin bilinmesi gerekir.

**Gereksinim:**
1.  V2 kodu `sui client upgrade` ile yükseltildikten sonra, Lider A (Backend) terminalden **bir kez** `create_registry` fonksiyonunu çağırır.
2.  Bu çağrı, **PAYLAŞILAN_REGISTRY_ID**'sini (örn: `0xabc123...`) üretir.

**Tüm V2 frontend işlemleri bu `PAYLAŞILAN_REGISTRY_ID`'ye bağımlıdır.**

---

## 2. Frontend Entegrasyonu (V2 Akışı)

Lider B (Frontend), V2'yi kullanırken 3 ana akışa odaklanmalıdır:

### Akış A: Kullanıcı Adı Müsait mi? (Kayıt Formu)

Kullanıcı "Kayıt Ol" formunda bir kullanıcı adı yazdığında, bu adın daha önce alınıp alınmadığını kontrol etmeniz gerekir.

**Fonksiyon:** `username_exists` (Okuma/View Fonksiyonu)
**Çağrı:** `useSuiClientQuery('call', ...)`
**Parametreler:**
1.  `PAYLAŞILAN_REGISTRY_ID`
2.  `username: String` (Kontrol edilecek kullanıcı adı)
**Dönüş:** `bool` (true veya false)

### Akış B: Yeni Profil Oluşturma (V2)

Kullanıcı adı müsaitse ve kullanıcı forma `name`, `bio` vb. girip "Oluştur"a basarsa, **V2 `create_profile`** fonksiyonu çağrılır.

**Fonksiyon:** `create_profile`
**Çağrı:** `useSignAndExecuteTransactionBlock`
**Parametreler:**
1.  `PAYLAŞILAN_REGISTRY_ID` (Mutlaka gerekir)
2.  `username: String` (Seçilen kullanıcı adı)
3.  `name: String`
4.  `bio: String`
5.  `avatar_cid: String`
6.  `theme: String`

### Akış C: Profili Kullanıcı Adıyla Gösterme

Bir profil sayfasını (örn: `.../profile/sora`) ziyaret ederken, "sora" kullanıcı adından yola çıkarak `LinkTreeProfile` objesinin ID'sini bulmamız gerekir.

**Fonksiyon:** `get_profile_id_by_username` (Okuma/View Fonksiyonu)
**Çağrı:** `useSuiClientQuery('call', ...)`
**Parametreler:**
1.  `PAYLAŞILAN_REGISTRY_ID`
2.  `username: String` ("sora")
**Dönüş:** `ID` (Profilin `Object ID`si, örn: `0x...`)

**Bu `Object ID`'yi aldıktan sonra,** V1'de olduğu gibi `useSuiClientQuery('getObject', ...)` çağrısı yaparak profilin `name`, `bio`, `links` gibi verilerini çekebilirsiniz.