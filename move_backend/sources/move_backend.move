module move_backend::linktree {
    // Move 2024 sürümünde 'object', 'transfer', 'tx_context' ve 'UID'
    // gibi temel Sui modülleri otomatik olarak içeri aktarılır (import edilir).
    use std::string::String;
    
    // HATA ÇÖZÜMÜ: 'vec_map' modülünü fonksiyonlarıyla (Self) birlikte import et
    use sui::vec_map::{Self, VecMap}; 

    // --- Structs (Veri Yapıları) ---

    /// Bir kullanıcının on-chain LinkTree profilini temsil eder.
    /// Move 2024, struct'ın 'public' olmasını zorunlu kılar.
    public struct LinkTreeProfile has key, store {
        id: UID,
        /// Profilin sahibi. Sadece bu adres profili güncelleyebilir.
        owner: address,
        /// Profil adı / Başlık
        name: String,
        /// Kısa Biyografi
        bio: String,
        /// Profil resmi için IPFS CID'si veya URL
        avatar_cid: String,
        /// Linkler: "Etiket" -> "URL" eşleşmesi
        links: VecMap<String, String>,
        /// Tema adı (örn: "dark", "light", "retro")
        theme: String
    }

    // --- Hata Kodları ---
    /// Fonksiyonu çağıran kişi objenin sahibi değilse verilecek hata
    const ENotOwner: u64 = 0; 

    // --- Fonksiyonlar ---
    // 'public' fonksiyonlar zaten 'entry' kabul edilir.

    /// Yeni bir LinkTreeProfile objesi oluşturur ve işlemi başlatan kişiye transfer eder.
    public fun create_profile(
        name: String,
        bio: String,
        avatar_cid: String,
        theme: String,
        ctx: &mut TxContext
    ) {
        // Yeni bir profil objesi oluştur
        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx), // Sahibi = işlemi başlatan kişi
            name: name,
            bio: bio,
            avatar_cid: avatar_cid,
            links: vec_map::empty<String, String>(), // Bu satır artık çalışacak
            theme: theme
        };

        // Objeyi sahibine (onu oluşturan kişiye) transfer et
        transfer::transfer(profile, tx_context::sender(ctx));
    }

    /// Mevcut bir profile yeni bir link ekler.
    /// Sadece objenin sahibi çağırabilir.
    public fun add_link(
        profile: &mut LinkTreeProfile,
        label: String,
        url: String,
        ctx: &mut TxContext
    ) {
        // KONTROL: Bu fonksiyonu çağıran kişi objenin sahibi mi?
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);

        // Linki ekle (veya varsa üstüne yaz)
        // Bu satır da artık çalışacak (ve uyarılar kaybolacak)
        vec_map::insert(&mut profile.links, label, url);
    }
}