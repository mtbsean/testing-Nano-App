
import React, { useState } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { Preview } from './components/Preview';
import { History } from './components/History';
import { ImageEditor } from './components/ImageEditor';
import { GifGenerator } from './components/GifGenerator'; // New Import
import { AspectRatio, ImageStyle, ReferenceImage, HistoryItem, SuggestionCategories, ReferenceMode, ReferenceUsage } from './types';
import { UNIVERSAL_TRAITS, WORLD_DATA } from './constants';
import { 
  generateImageWithNanoBanana, 
  fileToBase64, 
  generatePromptEnhancement,
  generateKeywordSuggestions,
  generateUpscale,
  generateVariation,
  generateSocialCaption
} from './services/geminiService';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [style, setStyle] = useState<string>(ImageStyle.PHOTOREALISTIC);
  const [aspectRatio, setAspectRatio] = useState<string>(AspectRatio.SQUARE);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  // New States
  const [likeness, setLikeness] = useState<number>(8);
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>('character');
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  const [batchSettings, setBatchSettings] = useState({
    varyPose: true,
    varyFraming: true,
    varyOutfit: true,
    varyLocation: true
  });
  
  // GIF Generation States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [showGifGenerator, setShowGifGenerator] = useState(false);
  
  // Caption States
  const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // Lifted state for Era-aware batching
  const [selectedWorld, setSelectedWorld] = useState<keyof typeof WORLD_DATA>('Modern Day');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleAddImages = async (files: FileList) => {
    const newImages: ReferenceImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        newImages.push({
          file,
          previewUrl,
          base64,
          mimeType: file.type || 'image/png',
          usage: 'Structure', // Default usage
          intensity: 0.8 // Default high intensity
        });
      } catch (e) {
        console.error("Failed to process image", e);
      }
    }
    setReferenceImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setReferenceImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].previewUrl); // cleanup
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleUpdateImageUsage = (index: number, usage: ReferenceUsage) => {
    setReferenceImages(prev => {
        const newImages = [...prev];
        if (newImages[index]) {
            newImages[index] = { ...newImages[index], usage };
        }
        return newImages;
    });
  };

  const handleUpdateImageIntensity = (index: number, val: number) => {
    setReferenceImages(prev => {
        const newImages = [...prev];
        if (newImages[index]) {
            newImages[index] = { ...newImages[index], intensity: val };
        }
        return newImages;
    });
  };

  const addToHistory = (url: string, usedPrompt: string = prompt) => {
    const newItem: HistoryItem = {
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      prompt: usedPrompt,
      negativePrompt,
      style,
      aspectRatio,
      imageUrl: url,
      timestamp: Date.now()
    };
    setHistory(prev => [...prev, newItem]);
  };

  const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const generateRandomVariantPrompt = (basePrompt: string) => {
    // 1. Get Era-specific data
    const worldInfo = WORLD_DATA[selectedWorld];
    let changes: string[] = [];
    
    // 2. Outfit Variation
    if (batchSettings.varyOutfit) {
      const randomOutfit = getRandomElement(worldInfo.clothing);
      changes.push(`Attire: ${randomOutfit}`);
    }

    // 3. Location & Weather Variation
    if (batchSettings.varyLocation) {
      const randomEnvironment = getRandomElement(worldInfo.environments);
      const randomWeather = getRandomElement(UNIVERSAL_TRAITS.weather);
      changes.push(`Location: ${randomEnvironment}`, `Weather: ${randomWeather}`);
    }

    // 4. Camera, Lighting & Motion Variation
    if (batchSettings.varyFraming) {
      const framing = getRandomElement(UNIVERSAL_TRAITS.framing);
      const lens = getRandomElement(UNIVERSAL_TRAITS.lens);
      const focus = getRandomElement(UNIVERSAL_TRAITS.focus);
      const motion = getRandomElement(UNIVERSAL_TRAITS.motion);
      const lighting = getRandomElement(UNIVERSAL_TRAITS.lighting);
      
      changes.push(`Camera: ${framing}, ${lens}, ${focus}`, `Lighting: ${lighting}`, `Motion: ${motion}`);
    }

    // 5. Pose, Age & Emotion Variation (Character)
    if (batchSettings.varyPose) {
      const pose = getRandomElement(UNIVERSAL_TRAITS.pose);
      const emotion = getRandomElement(UNIVERSAL_TRAITS.emotion);
      // Randomly include hair variation in pose/character changes
      const hairStyle = getRandomElement(UNIVERSAL_TRAITS.hairStyle);
      const hairColor = getRandomElement(UNIVERSAL_TRAITS.hairColor);
      const age = getRandomElement(UNIVERSAL_TRAITS.age);
      const skinTexture = getRandomElement(UNIVERSAL_TRAITS.skinTexture);
      
      changes.push(`Age: ${age}`, `Pose: ${pose}`, `Expression: ${emotion}`, `Hair: ${hairStyle} ${hairColor}`, `Skin Texture: ${skinTexture}`);
    }

    // If no variations are selected, return original prompt
    if (changes.length === 0) return basePrompt;

    return `${basePrompt}. Variation details: ${changes.join('. ')}.`;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setGeneratedCaption(null); // Reset caption on new gen
    
    const targetCount = isBatchMode ? batchSize : 1;
    if (isBatchMode) setBatchProgress({ current: 0, total: targetCount });

    try {
      // Reference images are passed directly; service handles Usage logic
      const refImgs = referenceImages; 

      for (let i = 0; i < targetCount; i++) {
        // Prepare prompt
        let currentPrompt = prompt;
        
        // If batch mode > 1, randomize prompt for variety
        if (isBatchMode && targetCount > 1) {
          currentPrompt = generateRandomVariantPrompt(prompt);
        }

        if (isBatchMode) setBatchProgress({ current: i + 1, total: targetCount });

        const resultUrl = await generateImageWithNanoBanana(
          currentPrompt,
          negativePrompt,
          style,
          aspectRatio,
          refImgs,
          likeness
        );

        if (resultUrl) {
          setGeneratedImageUrl(resultUrl);
          addToHistory(resultUrl, currentPrompt);
        } else {
          console.warn(`Batch item ${i + 1} failed to produce image.`);
        }
        
        // Small delay to prevent rate limiting during large batches
        if (isBatchMode && i < targetCount - 1) {
          await new Promise(r => setTimeout(r, 800)); 
        }
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  };

  const handleEnhancePrompt = async () => {
    setIsEnhancing(true);
    try {
      const enhanced = await generatePromptEnhancement(prompt, style);
      setPrompt(enhanced);
    } catch (err) {
      console.error("Failed to enhance prompt", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!generatedImageUrl) return;
    setIsGeneratingCaption(true);
    try {
      const caption = await generateSocialCaption(prompt, style);
      setGeneratedCaption(caption);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleGetSuggestions = async (): Promise<SuggestionCategories> => {
    try {
      return await generateKeywordSuggestions(prompt, style);
    } catch (err) {
      console.error("Failed to get suggestions", err);
      return { lighting: [], camera: [], details: [] };
    }
  };

  const handleUpscale = async () => {
    if (!generatedImageUrl) return;
    
    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
       try {
         await window.aistudio.openSelectKey();
         if (!await window.aistudio.hasSelectedApiKey()) return;
       } catch (e) {
         console.error("Key selection failed", e);
         return;
       }
    }

    setIsGenerating(true);
    setError(null);
    try {
      const base64 = generatedImageUrl.split(',')[1];
      const resultUrl = await generateUpscale(base64, prompt, style, aspectRatio);
      if (resultUrl) {
        setGeneratedImageUrl(resultUrl);
        addToHistory(resultUrl, prompt + " (Upscaled)");
      } else {
        setError("Upscaling failed to return an image.");
      }
    } catch (err: any) {
      setError(err.message || "Upscaling failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVariation = async () => {
    if (!generatedImageUrl) return;
    setIsGenerating(true);
    setError(null);
    try {
      const base64 = generatedImageUrl.split(',')[1];
      const resultUrl = await generateVariation(base64, prompt, style, aspectRatio);
      if (resultUrl) {
        setGeneratedImageUrl(resultUrl);
        addToHistory(resultUrl, prompt + " (Variation)");
      } else {
        setError("Variation generation failed.");
      }
    } catch (err: any) {
      setError(err.message || "Variations failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = (newImageUrl: string) => {
    setGeneratedImageUrl(newImageUrl);
    addToHistory(newImageUrl, prompt + " (Edited)");
    setIsEditing(false);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setNegativePrompt(item.negativePrompt);
    setStyle(item.style);
    setAspectRatio(item.aspectRatio);
    setGeneratedImageUrl(item.imageUrl);
    setError(null);
    setGeneratedCaption(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Selection Logic for GIF
  const toggleSelection = (id: string) => {
    setSelectedHistoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleOpenGifGenerator = () => {
    if (selectedHistoryIds.length < 2) return;
    setShowGifGenerator(true);
  };

  const getSelectedImagesForGif = () => {
    // Return images in the order they were created (History is typically chronological or reverse)
    // We want the GIF sequence to make sense. Let's find items and sort by timestamp.
    const selectedItems = history.filter(item => selectedHistoryIds.includes(item.id));
    // Sort oldest to newest for animation sequence
    return selectedItems.sort((a, b) => a.timestamp - b.timestamp).map(item => item.imageUrl);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <Header />
      
      {isEditing && generatedImageUrl && (
        <ImageEditor 
          imageUrl={generatedImageUrl}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {showGifGenerator && (
        <GifGenerator 
          images={getSelectedImagesForGif()}
          onClose={() => setShowGifGenerator(false)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Section */}
          <div className="lg:col-span-5 xl:col-span-4">
             <Controls 
               prompt={prompt}
               setPrompt={setPrompt}
               negativePrompt={negativePrompt}
               setNegativePrompt={setNegativePrompt}
               style={style}
               setStyle={setStyle}
               aspectRatio={aspectRatio}
               setAspectRatio={setAspectRatio}
               referenceImages={referenceImages}
               onAddImages={handleAddImages}
               onRemoveImage={handleRemoveImage}
               onUpdateImageUsage={handleUpdateImageUsage}
               onUpdateImageIntensity={handleUpdateImageIntensity}
               onGenerate={handleGenerate}
               onEnhancePrompt={handleEnhancePrompt}
               onGetSuggestions={handleGetSuggestions}
               isGenerating={isGenerating}
               isEnhancing={isEnhancing}
               // New Props
               likeness={likeness}
               setLikeness={setLikeness}
               referenceMode={referenceMode}
               setReferenceMode={setReferenceMode}
               batchSize={batchSize}
               setBatchSize={setBatchSize}
               isBatchMode={isBatchMode}
               setIsBatchMode={setIsBatchMode}
               batchSettings={batchSettings}
               setBatchSettings={setBatchSettings}
               // World State
               selectedWorld={selectedWorld}
               setSelectedWorld={setSelectedWorld}
             />
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            <Preview 
              imageUrl={generatedImageUrl}
              isLoading={isGenerating}
              error={error}
              onUpscale={handleUpscale}
              onVariation={handleVariation}
              onEdit={() => setIsEditing(true)}
              batchProgress={batchProgress}
              onGenerateCaption={handleGenerateCaption}
              isGeneratingCaption={isGeneratingCaption}
              generatedCaption={generatedCaption}
            />
            
            <History 
              history={history}
              onSelect={handleHistorySelect}
              // Selection props
              selectionMode={isSelectionMode}
              selectedIds={selectedHistoryIds}
              onToggleSelection={toggleSelection}
              onEnterSelectionMode={() => setIsSelectionMode(true)}
              onExitSelectionMode={() => {
                setIsSelectionMode(false);
                setSelectedHistoryIds([]);
              }}
              onCreateGif={handleOpenGifGenerator}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
