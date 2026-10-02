export const MALE_NAMES: string[];
export const FEMALE_NAMES: string[];

export interface AIName {
  name: string;
  gender: 'male' | 'female';
  avatar: string;
}

export function generateRandomIndianAINames(aiCount: number): AIName[];
