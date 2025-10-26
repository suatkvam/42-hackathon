/**
 * Avatar NFT Service
 * Manages unique avatar assignments for users (NFT-like system)
 */

// Total 16 unique NFT avatars
// IMPORTANT: Place your avatar images in frontend/public/avatars/
// Name them: nft-1.jpeg, nft-2.jpeg, ... nft-16.jpeg
// Supported formats: .jpeg, .jpg, .png, .svg
export const NFT_AVATARS = [
  '/avatars/nft-1.jpeg',
  '/avatars/nft-2.jpeg',
  '/avatars/nft-3.jpeg',
  '/avatars/nft-4.jpeg',
  '/avatars/nft-5.jpeg',
  '/avatars/nft-6.jpeg',
  '/avatars/nft-7.jpeg',
  '/avatars/nft-8.jpeg',
  '/avatars/nft-9.jpeg',
  '/avatars/nft-10.jpeg',
  '/avatars/nft-11.jpeg',
  '/avatars/nft-12.jpeg',
  '/avatars/nft-13.jpeg',
  '/avatars/nft-14.jpeg',
  '/avatars/nft-15.jpeg',
  '/avatars/nft-16.jpeg',
];

// Generate SVG avatar dynamically
export function generateAvatarSvg(index: number): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AAB7B8',
    '#52C4B8', '#EC7063', '#5DADE2', '#48C9B0', '#F5B041'
  ];
  
  const emojis = [
    '👤', '🚀', '🌟', '👾', '🎮', 
    '🎨', '🎭', '🎪', '🎯', '🎲',
    '🎸', '🎺', '🎻', '🎹', '🎬'
  ];
  
  const color = colors[index % colors.length];
  const emoji = emojis[index % emojis.length];
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cdefs%3E%3CradialGradient id='grad${index}'%3E%3Cstop offset='0%25' style='stop-color:${color};stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:${color};stop-opacity:0.7' /%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='100' cy='100' r='90' fill='url(%23grad${index})'/%3E%3Ctext x='100' y='100' text-anchor='middle' dy='.3em' font-size='80' fill='white'%3E${emoji}%3C/text%3E%3C/svg%3E`;
}

// Initialize all avatars with generated SVGs
export function initializeAvatars() {
  return NFT_AVATARS.map((path, index) => ({
    id: index + 1,
    path: path,
    svg: generateAvatarSvg(index),
    isAssigned: false
  }));
}

/**
 * Get 3 random unassigned avatars for a new user
 * @param assignedAvatarIds - Array of already assigned avatar IDs
 * @returns Array of 3 random unassigned avatar objects
 */
export function getRandomAvatarsForUser(assignedAvatarIds: number[]): Array<{id: number, path: string, imageUrl: string}> {
  const allAvatars = initializeAvatars();
  
  // Filter out already assigned avatars
  const availableAvatars = allAvatars.filter(avatar => !assignedAvatarIds.includes(avatar.id));
  
  // If less than 3 available, return all available
  if (availableAvatars.length <= 3) {
    return availableAvatars.map(a => ({ id: a.id, path: a.path, imageUrl: a.path }));
  }
  
  // Shuffle and pick 3 random avatars
  const shuffled = [...availableAvatars].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(a => ({ id: a.id, path: a.path, imageUrl: a.path }));
}

/**
 * Get avatar data by ID
 */
export function getAvatarById(avatarId: number): {id: number, path: string, imageUrl: string} | null {
  if (avatarId < 1 || avatarId > NFT_AVATARS.length) return null;
  
  const path = NFT_AVATARS[avatarId - 1];
  return {
    id: avatarId,
    path: path,
    imageUrl: path  // Direct image URL, no SVG generation
  };
}

/**
 * Convert avatar ID to display format (for storage)
 */
export function avatarIdToString(avatarId: number): string {
  return `nft_avatar_${avatarId}`;
}

/**
 * Parse avatar ID from stored string
 */
export function parseAvatarId(avatarString: string): number | null {
  const match = avatarString.match(/nft_avatar_(\d+)/);
  return match ? parseInt(match[1]) : null;
}
