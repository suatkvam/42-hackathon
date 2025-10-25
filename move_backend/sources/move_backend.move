module move_backend::linktree {
    use std::string::String;
    use sui::vec_map::{Self, VecMap};
    
    // YENİ V2 İmportları:
    use sui::dynamic_field as df; 
    use sui::transfer::share_object; 

    // --- Structs (Depolama Yapısı AYNEN KORUNDU) ---

    // V1'deki gibi kalmalı, depolama yapısını bozmayalım
    public struct LinkTreeProfile has key, store {
        id: UID,
        owner: address,
        name: String,
        bio: String,
        blob_id: String,
        links: VecMap<String, String>,
        theme: String
    }

    // YENİ: ProfileRegistry objesi eklendi
    public struct ProfileRegistry has key, store {
        id: UID
    }

    // --- Hata Kodları ---
    const ENotOwner: u64 = 0;

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
            name: name,
            bio: bio,
            blob_id: blob_id,
            links: vec_map::empty<String, String>(),
            theme: theme
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
        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            name: name,
            bio: bio,
            blob_id: blob_id,
            links: vec_map::empty<String, String>(),
            theme: theme
        };

        // Dinamik Alan Ekleme
        let profile_id = object::uid_to_inner(&profile.id);
        df::add(&mut registry.id, username, profile_id); 

        transfer::transfer(profile, tx_context::sender(ctx));
    }

    // 3. PROFİL GÜNCELLEME (YENİ)
    public fun update_profile(
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

    // 4. PROFİL SİLME (YENİ)
    public fun delete_profile(
        profile: LinkTreeProfile,
        ctx: &mut TxContext
    ) {
        let LinkTreeProfile { id, owner, name: _, bio: _, blob_id: _, links: _, theme: _ } = profile;
        assert!(owner == tx_context::sender(ctx), ENotOwner);
        object::delete(id);
    }

    // 5. LINK EKLEME (DEĞİŞMEDİ)
    public fun add_link(
        profile: &mut LinkTreeProfile,
        label: String,
        url: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        vec_map::insert(&mut profile.links, label, url);
    }

    // 6. OKUMA FONKSİYONLARI (EKLENDİ)
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

}