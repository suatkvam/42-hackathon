module move_backend::linktree {
    use std::string::String;
    use std::option::{Self, Option};
    use sui::vec_map::{Self, VecMap};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    
    // NEW V2 Imports:
    use sui::dynamic_field as df; 
    use sui::transfer::share_object; 

    // --- Structs (Storage Structure KEPT AS IS) ---

    // Should remain as in V1, don't break storage structure
    public struct LinkTreeProfile has key, store {
        id: UID,
        owner: address,
        username: String,
        name: String,
        bio: String,
        blob_id: String,
        links: VecMap<String, String>,
        theme: String,
        username_change_count: u64  // How many times username changed
    }

    // NEW: ProfileRegistry object added
    public struct ProfileRegistry has key, store {
        id: UID
    }

    // --- Error Codes ---
    const ENotOwner: u64 = 0;
    const EReservedUsername: u64 = 1;
    const EUsernameAlreadyTaken: u64 = 2;
    const EInsufficientPayment: u64 = 3;

    // --- Constants ---
    const USERNAME_CHANGE_FEE: u64 = 1_000_000_000; // 1 SUI (for subsequent changes)

    // --- Functions (V2) ---

    // 1. CREATE REGISTRY (NEW)
    public fun create_registry(ctx: &mut TxContext) {
        let registry = ProfileRegistry {
            id: object::new(ctx)
        };
        share_object(registry);
    }

    // 2. CREATE PROFILE (ORIGINAL V1 - DEPRECATED)
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

    // 2b. CREATE PROFILE V2 (NEW - WITH REGISTRY)
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
        // Reserved username check
        assert!(!is_reserved_username(&username), EReservedUsername);
        
        // Check if username was already taken
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

        // Add Dynamic Field
        let profile_id = object::uid_to_inner(&profile.id);
        df::add(&mut registry.id, username, profile_id); 

        transfer::transfer(profile, tx_context::sender(ctx));
    }

    // 3. UPDATE PROFILE (NEW)
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

    // 4. DELETE PROFILE (NEW - ALSO DELETES FROM REGISTRY)
    public entry fun delete_profile(
        registry: &mut ProfileRegistry,
        profile: LinkTreeProfile,
        ctx: &mut TxContext
    ) {
        let LinkTreeProfile { id, owner, username, name: _, bio: _, blob_id: _, links: _, theme: _, username_change_count: _ } = profile;
        assert!(owner == tx_context::sender(ctx), ENotOwner);
        
        // Remove username from registry
        if (df::exists_<String>(&registry.id, username)) {
            df::remove<String, ID>(&mut registry.id, username);
        };
        
        object::delete(id);
    }

    // 5. ADD LINK (UNCHANGED)
    public entry fun add_link(
        profile: &mut LinkTreeProfile,
        label: String,
        url: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        vec_map::insert(&mut profile.links, label, url);
    }

    // 5b. REMOVE LINK (NEW)
    public entry fun remove_link(
        profile: &mut LinkTreeProfile,
        label: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        let (_key, _value) = vec_map::remove(&mut profile.links, &label);
    }

    // 5c. UPDATE LINK (NEW)
    public entry fun update_link(
        profile: &mut LinkTreeProfile,
        old_label: String,
        new_label: String,
        new_url: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        // Remove old link
        let (_key, _value) = vec_map::remove(&mut profile.links, &old_label);
        // Add new link
        vec_map::insert(&mut profile.links, new_label, new_url);
    }

    // 6. CHANGE USERNAME (NEW - SIMPLIFIED)
    public entry fun change_username(
        registry: &mut ProfileRegistry,
        profile: &mut LinkTreeProfile,
        new_username: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        
        // Reserved username check
        assert!(!is_reserved_username(&new_username), EReservedUsername);
        
        // Check if new username was already taken
        assert!(!username_exists(registry, new_username), EUsernameAlreadyTaken);
        
        // Remove old username from registry
        if (df::exists_<String>(&registry.id, profile.username)) {
            df::remove<String, ID>(&mut registry.id, profile.username);
        };
        
        // Add new username to registry
        let profile_id = object::uid_to_inner(&profile.id);
        df::add(&mut registry.id, new_username, profile_id);
        
        // Update username in profile
        profile.username = new_username;
        profile.username_change_count = profile.username_change_count + 1;
    }

    // 7. READ FUNCTIONS (ADDED)
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

    // Reserved username check
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
