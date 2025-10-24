module move_backend::linktree {
    use std::string::String;
    use sui::vec_map::{Self, VecMap};
    
    // YENİ V2 İmportları:
    use sui::dynamic_field as df; // Dinamik Alanlar için kısayol
    use sui::transfer::share_object; // Paylaşılan obje oluşturmak için
    // Not: 'use sui::object::{ID}' kaldırıldı, 'ID' zaten import ediliyor.

    // --- Structs (Veri Yapıları) ---

    /// (DEĞİŞİKLİK YOK)
    public struct LinkTreeProfile has key, store {
        id: UID,
        owner: address,
        name: String,
        bio: String,
        avatar_cid: String,
        links: VecMap<String, String>,
        theme: String
    }

    // YENİ V2: Telefon Rehberimiz (Registry)
    public struct ProfileRegistry has key, store {
        id: UID
    }

    // --- Hata Kodları ---
    
    /// (DEĞİŞİKLİK YOK)
    const ENotOwner: u64 = 0;
    
    // Not: EUsernameTaken kaldırıldı, df::add'in kendi hatasını (EFieldAlreadyExists) kullanacağız.

    // --- Fonksiyonlar ---

    /// YENİ V2: Telefon Rehberini (Registry) oluşturan fonksiyon.
    public fun create_registry(ctx: &mut TxContext) {
        let registry = ProfileRegistry {
            id: object::new(ctx)
        };
        share_object(registry);
    }

    /// GÜNCELLENDİ (V2): 
    public fun create_profile(
        registry: &mut ProfileRegistry, // YENİ V2: Telefon Rehberi objesi
        username: String,              // YENİ V2: İstenen kullanıcı adı
        name: String,
        bio: String,
        avatar_cid: String,
        theme: String,
        ctx: &mut TxContext
    ) {
        // HATA ÇÖZÜMÜ: Gereksiz 'exists' kontrolü kaldırıldı.
        // df::add fonksiyonu, 'username' zaten varsa işlemi OTOMATİK olarak iptal edecektir.

        // (DEĞİŞİKLİK YOK) Profil objesini oluştur
        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            name: name,
            bio: bio,
            avatar_cid: avatar_cid,
            links: vec_map::empty<String, String>(),
            theme: theme
        };

        // YENİ V2: Telefon Rehberine Ekle
        let profile_id = object::uid_to_inner(&profile.id);
        
        // Bu fonksiyon 'username' zaten varsa EFieldAlreadyExists hatası vererek işlemi durdurur.
        df::add(&mut registry.id, username, profile_id);

        // (DEĞİŞİKLİK YOK) Objeyi sahibine (onu oluşturan kişiye) transfer et
        transfer::transfer(profile, tx_context::sender(ctx));
    }

    /// (DEĞİŞİKLİK YOK)
    public fun add_link(
        profile: &mut LinkTreeProfile,
        label: String,
        url: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        vec_map::insert(&mut profile.links, label, url);
    }
}