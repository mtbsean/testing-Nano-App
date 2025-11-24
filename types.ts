

export enum ImageStyle {
  PHOTOREALISTIC = 'Photorealistic',
  ANIME = 'Anime',
  CINEMATIC = 'Cinematic',
  SURREAL = 'Surreal',
  WATERCOLOR = 'Watercolor',
  MOEBIUS = 'Moebius',
  HYPER_REALISTIC = 'Hyper-realistic',
  CYBERPUNK = 'Cyberpunk',
  OIL_PAINTING = 'Oil Painting',
  SKETCH = 'Pencil Sketch',
  
  // New Styles
  PIXEL_ART = 'Pixel Art',
  ISO_3D = 'Isometric 3D',
  LOW_POLY = 'Low Poly',
  CLAYMATION = 'Claymation',
  ORIGAMI = 'Origami',
  STAINED_GLASS = 'Stained Glass',
  NEON_NOIR = 'Neon Noir',
  POP_ART = 'Pop Art',
  UKIYO_E = 'Ukiyo-e',
  VAPORWAVE = 'Vaporwave',
  SYNTHWAVE = 'Synthwave',
  STEAMPUNK = 'Steampunk',
  GOTHIC = 'Gothic',
  ART_NOUVEAU = 'Art Nouveau',
  BAUHAUS = 'Bauhaus',
  GRAFFITI = 'Graffiti',
  COMIC_BOOK = 'Comic Book',
  LINE_ART = 'Line Art',
  CHARCOAL = 'Charcoal Drawing',
  STUDIO_GHIBLI = 'Studio Ghibli',
  DISNEY_PIXAR = 'Disney Pixar 3D',
  
  NONE = 'No Style'
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE_WIDE = '16:9',
  PORTRAIT_WIDE = '9:16',
  STANDARD_PORTRAIT = '3:4', // Closest to 4:5 supported by API
  STANDARD_LANDSCAPE = '4:3', // Closest to 3:2 supported by API
}

export type ReferenceUsage = 'Structure' | 'Style' | 'Clothing' | 'Face' | 'Background' | 'Character';

export type ReferenceMode = 'character' | 'style' | 'structure';

export interface ReferenceImage {
  file?: File; // Optional now as loaded models might only have base64
  previewUrl: string;
  base64: string;
  mimeType: string;
  usage: ReferenceUsage;
  intensity: number; // 0.1 to 1.0
}

export interface GeneratedImageResult {
  imageUrl: string | null;
  error?: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  negativePrompt: string;
  style: string;
  aspectRatio: string;
  imageUrl: string;
  timestamp: number;
}

export interface Draft {
  id: string;
  name: string;
  prompt: string;
  negativePrompt: string;
  style: string;
  aspectRatio: string;
  timestamp: number;
}

export interface CustomModel {
  id: string;
  name: string;
  triggerWord: string;
  type: 'Style' | 'Character';
  thumbnail: string;
  images: {
    base64: string;
    mimeType: string;
  }[];
  timestamp: number;
}

export interface SuggestionCategories {
  lighting: string[];
  camera: string[];
  details: string[];
}

export interface SecondarySubject {
  type: string;
  name: string;
  action: string;
}