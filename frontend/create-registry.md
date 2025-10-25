# Create Registry Instructions

Before users can create profiles, you need to create a ProfileRegistry object.

## Steps:

1. **Create the registry using Sui CLI:**

```bash
sui client call \
  --package 0x27432c7509c5baf4b0f6c61b76685d1e835193335a060c540d1546ec8b3215d6 \
  --module linktree \
  --function create_registry \
  --gas-budget 50000000
```

2. **Find the created object ID:**
   - Look for the "Created Objects" section in the output
   - Find the object with type ending in `::linktree::ProfileRegistry`
   - Copy its object ID

3. **Update the constants file:**
   - Open `src/constants.ts`
   - Replace the empty `REGISTRY_ID` with the object ID you copied
   
Example:
```typescript
export const REGISTRY_ID = "0xYOUR_REGISTRY_OBJECT_ID_HERE";
```

4. **Restart the dev server:**
```bash
npm run dev
```

Now users will be able to create profiles!
