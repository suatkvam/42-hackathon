module move_backend::linktree {
    use std::string::String;
    use std::option::{Self, Option};
    use sui::vec_map::{Self, VecMap};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    
    // YENİ V2 İmportları:
    use sui::dynamic_field as df; 
    use sui::transfer::share_object; 

    // --- Structs (Depolama Yapısı AYNEN KORUNDU) ---

    // V1'deki gibi kalmalı, depolama yapısını bozmayalım
    public struct LinkTreeProfile has key, store {
        id: UID,
        owner: address,
        username: String,
        name: String,
        bio: String,
        blob_id: String,
        links: VecMap<String, String>,
        theme: String,
        username_change_count: u64  // Kaç kez username değiştirildi
    }

    // YENİ: ProfileRegistry objesi eklendi
    public struct ProfileRegistry has key, store {
        id: UID
    }

    // --- Hata Kodları ---
    const ENotOwner: u64 = 0;
    const EReservedUsername: u64 = 1;
    const EUsernameAlreadyTaken: u64 = 2;
    const EInsufficientPayment: u64 = 3;

    // --- Sabitler ---
    const USERNAME_CHANGE_FEE: u64 = 1_000_000_000; // 1 SUI (sonraki değişiklikler için)

    // --- Fonksiyonlar (V2) ---

    // 1. REGISTRY OLUŞTURMA (YENİ)
    public fun create_registry(ctx: &mut TxContext) {
        let registry = ProfileRegistry {
            id: object::new(ctx)
        };
        share_object(registry);
    }

    // 2. PROFİL OLUŞTURMA (ORIGINAL V1 - DEPRECATED)
    #[allow(lint(self_transfer))]
    public fun create_profile(
        name: String,
        bio: String,
        blob_id: String,
        theme: String,
        ctx: &mut TxContext
    ) {
        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            username: std::string::utf8(b"legacy"),
            name: name,
            bio: bio,
            blob_id: blob_id,
            links: vec_map::empty<String, String>(),
            theme: theme,
            username_change_count: 0
        };
        transfer::transfer(profile, tx_context::sender(ctx));
    }

    // 2b. PROFİL OLUŞTURMA V2 (YENİ - REGISTRY İLE)
    #[allow(lint(self_transfer))]
    public fun create_profile_v2(
        registry: &mut ProfileRegistry,
        username: String,
        name: String,
        bio: String,
        blob_id: String,
        theme: String,
        ctx: &mut TxContext
    ) {
        // Reserved username kontrolü
        assert!(!is_reserved_username(&username), EReservedUsername);
        
        // Username daha önce alınmış mı kontrolü
        assert!(!username_exists(registry, username), EUsernameAlreadyTaken);

        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            username: username,
            name: name,
            bio: bio,
            blob_id: blob_id,
            links: vec_map::empty<String, String>(),
            theme: theme,
            username_change_count: 0
        };

        // Dinamik Alan Ekleme
        let profile_id = object::uid_to_inner(&profile.id);
        df::add(&mut registry.id, username, profile_id); 

        transfer::transfer(profile, tx_context::sender(ctx));
    }

    // 3. PROFİL GÜNCELLEME (YENİ)
    public entry fun update_profile(
        profile: &mut LinkTreeProfile,
        name: String,
        bio: String,
        blob_id: String,
        theme: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        profile.name = name;
        profile.bio = bio;
        profile.blob_id = blob_id;
        profile.theme = theme;
    }

    // 4. PROFİL SİLME (YENİ - REGISTRY'DEN DE SİLER)
    public entry fun delete_profile(
        registry: &mut ProfileRegistry,
        profile: LinkTreeProfile,
        ctx: &mut TxContext
    ) {
        let LinkTreeProfile { id, owner, username, name: _, bio: _, blob_id: _, links: _, theme: _, username_change_count: _ } = profile;
        assert!(owner == tx_context::sender(ctx), ENotOwner);
        
        // Registry'den username'i sil
        if (df::exists_<String>(&registry.id, username)) {
            df::remove<String, ID>(&mut registry.id, username);
        };
        
        object::delete(id);
    }

    // 5. LINK EKLEME (DEĞİŞMEDİ)
    public entry fun add_link(
        profile: &mut LinkTreeProfile,
        label: String,
        url: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        vec_map::insert(&mut profile.links, label, url);
    }

    // 6. USERNAME DEĞİŞTİRME (YENİ)
    public entry fun change_username(
        registry: &mut ProfileRegistry,
        profile: &mut LinkTreeProfile,
        new_username: String,
        payment: Option<Coin<SUI>>,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        
        // Reserved username kontrolü
        assert!(!is_reserved_username(&new_username), EReservedUsername);
        
        // Yeni username daha önce alınmış mı kontrolü
        assert!(!username_exists(registry, new_username), EUsernameAlreadyTaken);
        
        // İlk değişiklikten sonra ödeme gerekli
        if (profile.username_change_count > 0) {
            assert!(option::is_some(&payment), EInsufficientPayment);
            let coin = option::destroy_some(payment);
            assert!(coin::value(&coin) >= USERNAME_CHANGE_FEE, EInsufficientPayment);
            // Ücreti yak veya hazineye gönder
            transfer::public_transfer(coin, @0x0); // Yakma
        } else {
            // İlk değişiklik bedava, ödeme varsa geri ver
            if (option::is_some(&payment)) {
                let coin = option::destroy_some(payment);
                transfer::public_transfer(coin, tx_context::sender(ctx));
            };
        };
        
        // Eski username'i registry'den sil
        if (df::exists_<String>(&registry.id, profile.username)) {
            df::remove<String, ID>(&mut registry.id, profile.username);
        };
        
        // Yeni username'i registry'ye ekle
        let profile_id = object::uid_to_inner(&profile.id);
        df::add(&mut registry.id, new_username, profile_id);
        
        // Profile'daki username'i güncelle
        profile.username = new_username;
        profile.username_change_count = profile.username_change_count + 1;
    }

    // 7. OKUMA FONKSİYONLARI (EKLENDİ)
    public fun get_profile_id_by_username(
        registry: &ProfileRegistry, 
        username: String
    ): ID {
        *df::borrow<String, ID>(&registry.id, username) 
    }

    public fun username_exists(
        registry: &ProfileRegistry, 
        username: String
    ): bool {
        df::exists_<String>(&registry.id, username)
    }

    // Reserved username kontrolü
    fun is_reserved_username(username: &String): bool {
        let reserved = vector[
            std::string::utf8(b"dashboard"),
            std::string::utf8(b"admin"),
            std::string::utf8(b"root"),
            std::string::utf8(b"system"),
            std::string::utf8(b"api"),
            std::string::utf8(b"www"),
            std::string::utf8(b"app"),
            std::string::utf8(b"support"),
            std::string::utf8(b"help"),
            std::string::utf8(b"settings"),
            std::string::utf8(b"profile"),
            std::string::utf8(b"login"),
            std::string::utf8(b"register"),
            std::string::utf8(b"signup"),
            std::string::utf8(b"signin"),
            std::string::utf8(b"logout"),
            std::string::utf8(b"home"),
            std::string::utf8(b"about"),
            std::string::utf8(b"contact"),
            std::string::utf8(b"terms"),
            std::string::utf8(b"privacy"),
            std::string::utf8(b"legal")
        ];
        
        vector::contains(&reserved, username)
    }

}
