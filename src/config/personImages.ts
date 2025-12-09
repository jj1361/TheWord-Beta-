/**
 * Person Image Configuration
 *
 * This file maps person IDs to their profile images and cover photos.
 * Images can be local (in public folder) or external URLs.
 *
 * Usage:
 * - avatarUrl: Profile picture (circular avatar)
 * - coverUrl: Cover photo (banner background)
 *
 * Example local path: '/images/people/moses-avatar.jpg'
 * Example external URL: 'https://example.com/images/moses.jpg'
 */

export interface PersonImageConfig {
  avatarUrl?: string;
  coverUrl?: string;
  photos?: string[]; // Array of photo URLs for photo gallery
}

export const personImages: { [personID: string]: PersonImageConfig } = {
  // Example entries - uncomment and customize as needed:

   'adam_78': {
     avatarUrl: '/images/people/adam-avatar.jpg',
     coverUrl: '/images/people/adam-cover.jpg',
     photos: ['/images/people/adam-photo1.jpg',
      '/images/people/adam-photo2.jpg'
     ],
   },

  // 'Moses': {
  //   avatarUrl: '/images/people/moses-avatar.jpg',
  //   coverUrl: '/images/people/moses-cover.jpg'
  
  // },

  // 'David': {
  //   avatarUrl: '/images/people/david-avatar.jpg',
  //   coverUrl: '/images/people/david-cover.jpg'
  // },

  // 'Jesus': {
  //   avatarUrl: '/images/people/jesus-avatar.jpg',
  //   coverUrl: '/images/people/jesus-cover.jpg'
  // },

  // 'Paul': {
  //   avatarUrl: '/images/people/paul-avatar.jpg',
  //   coverUrl: '/images/people/paul-cover.jpg'
  // },

  // 'Mary': {
  //   avatarUrl: '/images/people/mary-avatar.jpg',
  //   coverUrl: '/images/people/mary-cover.jpg'
  // },

  // 'Peter': {
  //   avatarUrl: '/images/people/peter-avatar.jpg',
  //   coverUrl: '/images/people/peter-cover.jpg'
  // },

  // 'Abraham': {
  //   avatarUrl: '/images/people/abraham-avatar.jpg',
  //   coverUrl: '/images/people/abraham-cover.jpg'
  // },

  // 'Sarah': {
  //   avatarUrl: '/images/people/sarah-avatar.jpg',
  //   coverUrl: '/images/people/sarah-cover.jpg'
  // },

  // Add more people as needed...
};

/**
 * Get image configuration for a person
 * @param personID - The person's ID
 * @returns PersonImageConfig or undefined if not configured
 */
export const getPersonImages = (personID: string): PersonImageConfig | undefined => {
  return personImages[personID];
};

/**
 * Check if a person has a custom avatar
 * @param personID - The person's ID
 * @returns true if avatar is configured
 */
export const hasCustomAvatar = (personID: string): boolean => {
  return !!personImages[personID]?.avatarUrl;
};

/**
 * Check if a person has a custom cover photo
 * @param personID - The person's ID
 * @returns true if cover photo is configured
 */
export const hasCustomCover = (personID: string): boolean => {
  return !!personImages[personID]?.coverUrl;
};

/**
 * Get avatar URL for a person, or undefined if not configured
 * @param personID - The person's ID
 * @returns Avatar URL or undefined
 */
export const getAvatarUrl = (personID: string): string | undefined => {
  return personImages[personID]?.avatarUrl;
};

/**
 * Get cover photo URL for a person, or undefined if not configured
 * @param personID - The person's ID
 * @returns Cover photo URL or undefined
 */
export const getCoverUrl = (personID: string): string | undefined => {
  return personImages[personID]?.coverUrl;
};
