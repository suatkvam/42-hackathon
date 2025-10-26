module move_backend::linktree {
    use std::string::String;
    
    // V3 Imports:
    use sui::dynamic_field as df; 
    use sui::transfer::share_object;
    use sui::vec_map::{Self, VecMap};
    use sui::package;
    use sui::display;

    // --- Structs (Storage Structure KEPT AS IS) ---

    // One-time witness for Display creation
    public struct LINKTREE has drop {}

    // V3: Optimized storage - profile data stored in Walrus
    public struct LinkTreeProfile has key, store {
        id: UID,
        owner: address,
        username: String,
        content_blob_id: String,  // Walrus blob ID containing JSON: {name, bio, avatar_blob_id, links}
        theme: String,
        username_change_count: u64,
        nft_avatar_id: u64  // NFT Avatar ID (1-16), unique per user
    }

    // NEW: ProfileRegistry object added
    public struct ProfileRegistry has key, store {
        id: UID
        // Dynamic field: "assigned_avatars" -> VecMap<u64, address>
        // Stores avatar_id -> owner_address mapping to ensure uniqueness
    }

    // --- Error Codes ---
    const ENotOwner: u64 = 0;
    const EReservedUsername: u64 = 1;
    const EUsernameAlreadyTaken: u64 = 2;
    const EAvatarAlreadyAssigned: u64 = 3;

    // --- Init Function (Module initializer) ---
    fun init(otw: LINKTREE, ctx: &mut TxContext) {
        let keys = vector[
            std::string::utf8(b"name"),
            std::string::utf8(b"description"),
            std::string::utf8(b"link"),
            std::string::utf8(b"image_url"),
            std::string::utf8(b"project_url"),
            std::string::utf8(b"creator"),
        ];

        let values = vector[
            std::string::utf8(b"42Tree Profile - {username}"),
            std::string::utf8(b"Decentralized link-in-bio profile for {username} on 42Tree"),
            std::string::utf8(b"https://42tree.walrus.site/{username}"),
            std::string::utf8(b"https://aggregator.walrus-testnet.walrus.space/v1/{content_blob_id}"),
            std::string::utf8(b"https://42tree.walrus.site"),
            std::string::utf8(b"42Tree"),
        ];

        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<LinkTreeProfile>(
            &publisher, keys, values, ctx
        );
        
        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    // --- Functions (V2) ---

    // 1. CREATE REGISTRY (NEW)
    public fun create_registry(ctx: &mut TxContext) {
        let registry = ProfileRegistry {
            id: object::new(ctx)
        };
        share_object(registry);
    }

    // 2. CREATE PROFILE (DEPRECATED - V1)
    // Kept for backwards compatibility

    // 2b. CREATE PROFILE V2 (DEPRECATED - use create_profile_v3)
    // Kept for backwards compatibility
    #[allow(lint(self_transfer))]
    public fun create_profile_v2(
        registry: &mut ProfileRegistry,
        username: String,
        content_blob_id: String,
        theme: String,
        ctx: &mut TxContext
    ) {
        assert!(!is_reserved_username(&username), EReservedUsername);
        assert!(!username_exists(registry, username), EUsernameAlreadyTaken);

        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            username: username,
            content_blob_id: content_blob_id,
            theme: theme,
            username_change_count: 0,
            nft_avatar_id: 0  // Default for old profiles
        };

        let profile_id = object::uid_to_inner(&profile.id);
        df::add(&mut registry.id, username, profile_id); 

        transfer::transfer(profile, tx_context::sender(ctx));
    }

    // 2c. CREATE PROFILE V3 (With NFT Avatar)
    #[allow(lint(self_transfer))]
    public fun create_profile_v3(
        registry: &mut ProfileRegistry,
        username: String,
        content_blob_id: String,
        theme: String,
        nft_avatar_id: u64,  // NFT Avatar ID (1-16)
        ctx: &mut TxContext
    ) {
        // Reserved username check
        assert!(!is_reserved_username(&username), EReservedUsername);
        
        // Check if username was already taken
        assert!(!username_exists(registry, username), EUsernameAlreadyTaken);
        
        // Check if avatar is already assigned
        assert!(!is_avatar_assigned(registry, nft_avatar_id), EAvatarAlreadyAssigned);

        let sender = tx_context::sender(ctx);
        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: sender,
            username: username,
            content_blob_id: content_blob_id,
            theme: theme,
            username_change_count: 0,
            nft_avatar_id: nft_avatar_id
        };

        // Add username to registry
        let profile_id = object::uid_to_inner(&profile.id);
        df::add(&mut registry.id, username, profile_id);
        
        // Assign avatar (mark as taken)
        assign_avatar(registry, nft_avatar_id, sender);

        transfer::transfer(profile, sender);
    }

    // 3. UPDATE PROFILE V3
    public entry fun update_profile(
        profile: &mut LinkTreeProfile,
        content_blob_id: String,
        theme: String,
        ctx: &mut TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        profile.content_blob_id = content_blob_id;
        profile.theme = theme;
    }

    // 4. DELETE PROFILE V3
    public entry fun delete_profile(
        registry: &mut ProfileRegistry,
        profile: LinkTreeProfile,
        ctx: &mut TxContext
    ) {
        let LinkTreeProfile { id, owner, username, content_blob_id: _, theme: _, username_change_count: _, nft_avatar_id } = profile;
        assert!(owner == tx_context::sender(ctx), ENotOwner);
        
        // Remove username from registry
        if (df::exists_<String>(&registry.id, username)) {
            df::remove<String, ID>(&mut registry.id, username);
        };
        
        // Unassign avatar (free it up)
        if (nft_avatar_id > 0) {
            unassign_avatar(registry, nft_avatar_id);
        };
        
        object::delete(id);
    }

    // 5. LINKS - DEPRECATED (V3)
    // Links now stored in Walrus JSON, not on-chain
    // Kept for backwards compatibility but do nothing

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

    // --- NFT Avatar Functions ---
    
    // Initialize avatar registry (call once after registry creation)
    public fun init_avatar_registry(registry: &mut ProfileRegistry) {
        if (!df::exists_<vector<u8>>(&registry.id, b"assigned_avatars")) {
            df::add(&mut registry.id, b"assigned_avatars", vec_map::empty<u64, address>());
        };
    }
    
    // Check if avatar is already assigned
    fun is_avatar_assigned(registry: &ProfileRegistry, avatar_id: u64): bool {
        if (!df::exists_<vector<u8>>(&registry.id, b"assigned_avatars")) {
            return false
        };
        
        let avatars = df::borrow<vector<u8>, VecMap<u64, address>>(&registry.id, b"assigned_avatars");
        vec_map::contains(avatars, &avatar_id)
    }
    
    // Assign avatar to user
    fun assign_avatar(registry: &mut ProfileRegistry, avatar_id: u64, owner: address) {
        if (!df::exists_<vector<u8>>(&registry.id, b"assigned_avatars")) {
            init_avatar_registry(registry);
        };
        
        let avatars = df::borrow_mut<vector<u8>, VecMap<u64, address>>(&mut registry.id, b"assigned_avatars");
        vec_map::insert(avatars, avatar_id, owner);
    }
    
    // Unassign avatar (free it up)
    fun unassign_avatar(registry: &mut ProfileRegistry, avatar_id: u64) {
        if (!df::exists_<vector<u8>>(&registry.id, b"assigned_avatars")) {
            return
        };
        
        let avatars = df::borrow_mut<vector<u8>, VecMap<u64, address>>(&mut registry.id, b"assigned_avatars");
        if (vec_map::contains(avatars, &avatar_id)) {
            vec_map::remove(avatars, &avatar_id);
        };
    }
    
    // Get all assigned avatar IDs (for frontend to filter available avatars)
    public fun get_assigned_avatar_ids(registry: &ProfileRegistry): vector<u64> {
        if (!df::exists_<vector<u8>>(&registry.id, b"assigned_avatars")) {
            return vector::empty<u64>()
        };
        
        let avatars = df::borrow<vector<u8>, VecMap<u64, address>>(&registry.id, b"assigned_avatars");
        vec_map::keys(avatars)
    }

}
