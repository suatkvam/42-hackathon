module move_backend::linktree {
    use std::string::String;
    use sui::vec_map::{Self, VecMap};
    
    // YENİ V2 İmportları:
    use sui::dynamic_field as df; 
    use sui::transfer::share_object; 

    // --- Structs ---
    public struct LinkTreeProfile has key, store {
        id: UID,
        owner: address,
        name: String,
        bio: String,
        avatar_cid: String,
        links: VecMap<String, String>,
        theme: String
    }

    public struct ProfileRegistry has key, store {
        id: UID
    }

    // --- Hata Kodları ---
    const ENotOwner: u64 = 0;

    // --- Fonksiyonlar ---

    // Registry Oluşturma
    public fun create_registry(ctx: &mut TxContext) {
        let registry = ProfileRegistry {
            id: object::new(ctx)
        };
        share_object(registry);
    }

    // Profil Oluşturma (V2)
    public fun create_profile(
        registry: &mut ProfileRegistry, 
        username: String,              
        name: String,
        bio: String,
        avatar_cid: String,
        theme: String,
        ctx: &mut TxContext
    ) {
        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            name: name,
            bio: bio,
            avatar_cid: avatar_cid,
            links: vec_map::empty<String, String>(),
            theme: theme
        };

        let profile_id = object::uid_to_inner(&profile.id);
        df::add(&mut registry.id, username, profile_id); // 'username' zaten varsa hata verir

        transfer::transfer(profile, tx_context::sender(ctx));
    }

    // Link Ekleme
    public fun add_link(
        profile: &mut LinkTreeProfile,
        label: String,
        url: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        vec_map::insert(&mut profile.links, label, url);
    }

    // --- Okuma Fonksiyonları (V2) ---

    // HATA ÇÖZÜMÜ: 'view' kaldırıldı. '&' parametresi zaten okuma olduğunu belirtir.
    // HATA ÇÖZÜMÜ: df::borrow<&ID> döndürür, biz * ile değeri (ID) alıp döndürüyoruz.
    public fun get_profile_id_by_username(
        registry: &ProfileRegistry, // Sadece '&' yeterli, 'view' gereksiz
        username: String
    ): ID {
        // df::borrow<&ID> döndürür, * ile değeri alırız (dereference)
        *df::borrow<String, ID>(&registry.id, username) 
    }

    // HATA ÇÖZÜMÜ: 'view' kaldırıldı.
    public fun username_exists(
        registry: &ProfileRegistry, // Sadece '&' yeterli, 'view' gereksiz
        username: String
    ): bool {
        df::exists_<String>(&registry.id, username)
    }

}