

import { GoogleGenAI, Part, Type } from "@google/genai";
import { ImageStyle, SuggestionCategories, ReferenceImage } from "../types";

// Helper to convert file to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSocialCaption = async (description: string, style: string): Promise<string> => {
  const ai = getClient();
  const modelId = 'gemini-2.5-flash';
  
  const prompt = `You are a social media expert. Generate a catchy, engaging, and relevant caption for an Instagram or Twitter post featuring an AI-generated image. 
  
  Image Description: "${description}"
  Art Style: "${style}"
  
  Instructions:
  - Keep it under 280 characters.
  - Be creative and engaging.
  - Include 3-5 relevant trending hashtags.
  - Add appropriate emojis.
  - Do not use quotes around the caption.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt
    });
    return response.text?.trim() || "Check out this AI art! #AIart";
  } catch (e) {
    console.error("Caption generation failed", e);
    return "Check out my new AI creation! #NanoBananaStudio";
  }
};

export const generatePromptEnhancement = async (currentPrompt: string, style: string): Promise<string> => {
  const ai = getClient();
  const modelId = 'gemini-2.5-flash';
  
  const systemInstruction = "You are an expert prompt engineer for AI image generation. Your goal is to create detailed, creative, and vivid prompts.";
  
  const userMessage = currentPrompt.trim() 
    ? `Enhance and expand this image prompt to be more descriptive and artistic, suitable for a ${style} style: "${currentPrompt}". Keep it under 50 words.`
    : `Generate a creative, detailed image prompt for a random concept in ${style} style. Keep it under 50 words.`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: userMessage,
    config: { systemInstruction }
  });

  return response.text || currentPrompt;
};

export const generateKeywordSuggestions = async (currentPrompt: string, style: string): Promise<SuggestionCategories> => {
  const ai = getClient();
  const modelId = 'gemini-2.5-flash';
  
  const promptText = currentPrompt.trim() || "A creative scene";

  const userMessage = `Analyze this image prompt: "${promptText}". Style: ${style}.
  Suggest enhancements in three categories:
  1. Lighting (e.g., volumetric fog, cinematic lighting)
  2. Camera (e.g., wide angle, f/1.8, 4k)
  3. Details (e.g., intricate textures, hyper-detailed, debris)
  
  Return a JSON object with keys 'lighting', 'camera', and 'details', each containing an array of 3-5 short string suggestions.`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: userMessage,
    config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                lighting: { type: Type.ARRAY, items: { type: Type.STRING } },
                camera: { type: Type.ARRAY, items: { type: Type.STRING } },
                details: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
    }
  });

  try {
      if (response.text) {
          return JSON.parse(response.text) as SuggestionCategories;
      }
  } catch (e) {
      console.error("Failed to parse suggestions", e);
  }
  
  return { lighting: [], camera: [], details: [] };
};

export const generateImageWithNanoBanana = async (
  prompt: string,
  negativePrompt: string,
  style: string,
  aspectRatio: string,
  referenceImages: ReferenceImage[],
  likeness: number = 8
): Promise<string | null> => {
  try {
    const ai = getClient();
    
    // Construct the final prompt including style and negative prompt
    let finalPrompt = prompt;
    
    // Granular Reference Instructions
    if (referenceImages.length > 0) {
      referenceImages.forEach((img, index) => {
        // Use 0-based index for reference in prompt
        const refIndex = index; 
        
        // Define intensity descriptors
        const intensity = img.intensity !== undefined ? img.intensity : 0.8;
        let strengthDesc = "strong influence";
        const isHighIntensity = intensity >= 0.75;

        if (intensity >= 0.9) strengthDesc = "extreme, exact influence";
        else if (intensity >= 0.7) strengthDesc = "strong influence";
        else if (intensity >= 0.4) strengthDesc = "moderate influence";
        else strengthDesc = "subtle, loose inspiration";

        const weightTerm = `(Weight: ${intensity})`;

        switch(img.usage) {
          case 'Clothing':
            finalPrompt += ` [REF_INSTRUCTION]: Use Reference Image ${refIndex + 1} ${weightTerm} as the ${strengthDesc} source for the character's clothing and attire. Ignore the face in this reference.`;
            break;
          case 'Face':
            finalPrompt += ` [REF_INSTRUCTION]: Use Reference Image ${refIndex + 1} ${weightTerm} as the ${strengthDesc} source for facial features and identity.`;
            if (isHighIntensity) {
                finalPrompt += ` Strictly override the text prompt for Skin Tone, Eye Color, and Hair Color to match this reference image exactly.`;
            }
            break;
          case 'Style':
            finalPrompt += ` [REF_INSTRUCTION]: Use Reference Image ${refIndex + 1} ${weightTerm} as the ${strengthDesc} source for Art Style, Color Palette, and Lighting. Do NOT copy the subject matter.`;
            break;
          case 'Background':
             finalPrompt += ` [REF_INSTRUCTION]: Use Reference Image ${refIndex + 1} ${weightTerm} as the ${strengthDesc} source for the Environment and Background setting.`;
             break;
          case 'Character':
             finalPrompt += ` [REF_INSTRUCTION]: Use Reference Image ${refIndex + 1} ${weightTerm} as the ${strengthDesc} source for the entire Character.`;
             if (isHighIntensity) {
                 finalPrompt += ` Strictly override the text prompt for Hair Color, Skin Color, Eye Color, and Body Build/Physique to match this reference image exactly.`;
             }
             break;
          case 'Structure':
          default:
             finalPrompt += ` [REF_INSTRUCTION]: Use Reference Image ${refIndex + 1} ${weightTerm} as ${strengthDesc} structural inspiration.`;
             if (isHighIntensity) {
                 finalPrompt += ` Strictly override the text prompt for Character Build, Body Type, and Physical Proportions to match this reference.`;
             }
             break;
        }
      });
    }

    if (style !== ImageStyle.NONE) {
      finalPrompt = `${finalPrompt}. Art style: ${style}. High quality, detailed.`;
    }
    if (negativePrompt.trim()) {
      finalPrompt = `${finalPrompt}. Exclude: ${negativePrompt}.`;
    }

    const parts: Part[] = [];

    // Add reference images first
    for (const img of referenceImages) {
      parts.push({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType,
        },
      });
    }

    // Add text prompt
    parts.push({ text: finalPrompt });

    // Nano Banana model maps to 'gemini-2.5-flash-image'
    const modelId = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    return extractImageFromResponse(response);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateUpscale = async (
  imageBase64: string,
  prompt: string,
  style: string,
  aspectRatio: string
): Promise<string | null> => {
  // Uses gemini-3-pro-image-preview for 4K upscale
  const ai = getClient();
  const modelId = 'gemini-3-pro-image-preview';

  let finalPrompt = `Upscale this image to high resolution (4K). Maintain details. ${prompt}`;
  if (style !== ImageStyle.NONE) finalPrompt += `. Style: ${style}`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: 'image/png' } },
        { text: finalPrompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: '4K' 
      }
    }
  });

  return extractImageFromResponse(response);
};

export const generateVariation = async (
  imageBase64: string,
  prompt: string,
  style: string,
  aspectRatio: string
): Promise<string | null> => {
  // Uses gemini-2.5-flash-image for variations
  const ai = getClient();
  const modelId = 'gemini-2.5-flash-image';
  
  let finalPrompt = `Create a variation of this image. ${prompt}`;
  if (style !== ImageStyle.NONE) finalPrompt += `. Style: ${style}`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: 'image/png' } },
        { text: finalPrompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any
      }
    }
  });

  return extractImageFromResponse(response);
};

const extractImageFromResponse = (response: any): string | null => {
  const candidates = response.candidates;
  if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
  }
  return null;
}