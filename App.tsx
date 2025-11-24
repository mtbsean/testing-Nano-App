
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { Preview } from './components/Preview';
import { History } from './components/History';
import { ImageEditor } from './components/ImageEditor';
import { GifGenerator } from './components/GifGenerator'; 
import { VeoVideoModal } from './components/VeoVideoModal'; // New Import
import { AspectRatio, ImageStyle, ReferenceImage, HistoryItem, SuggestionCategories, ReferenceMode, ReferenceUsage, Draft } from './types';
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
  
  // Granular Batch Settings
  const [batchSettings, setBatchSettings] = useState({
    varyPose: true,
    varyAge: false,
    varyHair: false,
    varyEmotion: false,
    varySkinTexture: false,
    varyFraming: true,
    varyLens: false,
    varyFocus: false,
    varyMotion: false,
    varyLighting: true,
    varyOutfit: true,
    varyLocation: true,
    varyWeather: true
  });
  
  // Drafts State
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // GIF Generation States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [showGifGenerator, setShowGifGenerator] = useState(false);
  // For single image animation flow
  const [gifBaseImages, setGifBaseImages] = useState<string[]>([]);

  // Veo Video State
  const [showVeoModal, setShowVeoModal] = useState(false);
  const [veoInitialPrompt, setVeoInitialPrompt] = useState<string>('');
  
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

  // Load Saved Data on Mount
  useEffect(() => {
    // 1. Load Session Autosave
    const savedSession = localStorage.getItem('nanobanana_autosave');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.negativePrompt) setNegativePrompt(parsed.negativePrompt);
        if (parsed.style) setStyle(parsed.style);
        if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
      } catch (e) {
        console.error("Failed to load autosave", e);
      }
    }

    // 2. Load Drafts
    const savedDrafts = localStorage.getItem('nanobanana_drafts');
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (e) {
        console.error("Failed to load drafts", e);
      }
    }
  }, []);

  // Autosave Session on Change
  useEffect(() => {
    const session = {
      prompt,
      negativePrompt,
      style,
      aspectRatio
    };
    localStorage.setItem('nanobanana_autosave', JSON.stringify(session));
  }, [prompt, negativePrompt, style, aspectRatio]);

  const handleSaveDraft = () => {
    if (!prompt.trim()) return;
    const name = prompt.length > 30 ? prompt.slice(0, 30) + '...' : prompt;
    
    const newDraft: Draft = {
      id: Date.now().toString(),
      name,
      prompt,
      negativePrompt,
      style,
      aspectRatio,
      timestamp: Date.now()
    };
    
    const updatedDrafts = [newDraft, ...drafts];
    setDrafts(updatedDrafts);
    localStorage.setItem('nanobanana_drafts', JSON.stringify(updatedDrafts));
  };

  const handleLoadDraft = (draft: Draft) => {
    setPrompt(draft.prompt);
    setNegativePrompt(draft.negativePrompt);
    setStyle(draft.style);
    setAspectRatio(draft.aspectRatio);
  };

  const handleDeleteDraft = (id: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== id);
    setDrafts(updatedDrafts);
    localStorage.setItem('nanobanana_drafts', JSON.stringify(updatedDrafts));
  };

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
    const worldInfo = WORLD_DATA[selectedWorld];
    let changes: string[] = [];
    
    // Granular variations
    if (batchSettings.varyOutfit) {
      changes.push(`Attire: ${getRandomElement(worldInfo.clothing)}`);
    }
    if (batchSettings.varyLocation) {
      changes.push(`Location: ${getRandomElement(worldInfo.environments)}`);
    }
    if (batchSettings.varyWeather) {
      changes.push(`Weather: ${getRandomElement(UNIVERSAL_TRAITS.weather)}`);
    }
    
    // Camera & Technical
    if (batchSettings.varyFraming) {
      changes.push(`Camera: ${getRandomElement(UNIVERSAL_TRAITS.framing)}`);
    }
    if (batchSettings.varyLens) {
      changes.push(`Lens: ${getRandomElement(UNIVERSAL_TRAITS.lens)}`);
    }
    if (batchSettings.varyFocus) {
      changes.push(`Focus: ${getRandomElement(UNIVERSAL_TRAITS.focus)}`);
    }
    if (batchSettings.varyMotion) {
      changes.push(`Motion: ${getRandomElement(UNIVERSAL_TRAITS.motion)}`);
    }
    if (batchSettings.varyLighting) {
      changes.push(`Lighting: ${getRandomElement(UNIVERSAL_TRAITS.lighting)}`);
    }

    // Character
    if (batchSettings.varyPose) {
      changes.push(`Pose: ${getRandomElement(UNIVERSAL_TRAITS.pose)}`);
    }
    if (batchSettings.varyEmotion) {
      changes.push(`Expression: ${getRandomElement(UNIVERSAL_TRAITS.emotion)}`);
    }
    if (batchSettings.varyAge) {
      changes.push(`Age: ${getRandomElement(UNIVERSAL_TRAITS.age)}`);
    }
    if (batchSettings.varyHair) {
      changes.push(`Hair: ${getRandomElement(UNIVERSAL_TRAITS.hairStyle)} ${getRandomElement(UNIVERSAL_TRAITS.hairColor)}`);
    }
    if (batchSettings.varySkinTexture) {
      changes.push(`Skin Texture: ${getRandomElement(UNIVERSAL_TRAITS.skinTexture)}`);
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

    const targetCount = isBatchMode ? batchSize : 1;
    if (isBatchMode) setBatchProgress({ current: 0, total: targetCount });

    try {
      const base64 = generatedImageUrl.split(',')[1];
      
      for (let i = 0; i < targetCount; i++) {
        if (isBatchMode) setBatchProgress({ current: i + 1, total: targetCount });

        // Construct Variation Instruction specifically for Img2Img
        let instruction = "";
        
        if (isBatchMode) {
             // Granular Instructions for Variation
             if (batchSettings.varyPose) {
                 instruction += ` Change pose to ${getRandomElement(UNIVERSAL_TRAITS.pose)}.`;
             }
             if (batchSettings.varyEmotion) {
                 instruction += ` Change expression to ${getRandomElement(UNIVERSAL_TRAITS.emotion)}.`;
             }
             if (batchSettings.varyFraming) {
                 instruction += ` Change camera angle to ${getRandomElement(UNIVERSAL_TRAITS.framing)}.`;
             }
             if (batchSettings.varyLighting) {
                  instruction += ` Change lighting to ${getRandomElement(UNIVERSAL_TRAITS.lighting)}.`;
             }
             if (batchSettings.varyWeather) {
                  instruction += ` Change weather to ${getRandomElement(UNIVERSAL_TRAITS.weather)}.`;
             }
             
             // Check consistency requirements
             if (!batchSettings.varyLocation) {
                 instruction += ` Keep background, location, and environment EXACTLY the same as original.`;
             } else {
                 instruction += ` Change location to ${getRandomElement(WORLD_DATA[selectedWorld].environments)}.`;
             }

             if (!batchSettings.varyOutfit) {
                 instruction += ` Keep character clothing and attire EXACTLY the same as original.`;
             } else {
                 instruction += ` Change outfit to ${getRandomElement(WORLD_DATA[selectedWorld].clothing)}.`;
             }
        }

        const fullPrompt = `${prompt}. ${instruction}`;
        const resultUrl = await generateVariation(base64, fullPrompt, style, aspectRatio);
        
        if (resultUrl) {
            // For first image, update main view, for others just add to history
            if (i === 0) setGeneratedImageUrl(resultUrl);
            addToHistory(resultUrl, fullPrompt + " (Variation)");
        }
        
        if (isBatchMode && i < targetCount - 1) {
            await new Promise(r => setTimeout(r, 800));
        }
      }
    } catch (err: any) {
      setError(err.message || "Variations failed.");
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  };
  
  // Handler for Single Image Animation flow (GIF)
  const handleAnimate = () => {
    if (!generatedImageUrl) return;
    setGifBaseImages([generatedImageUrl]);
    setShowGifGenerator(true);
  };
  
  // Handler for Veo Video
  const handleVeoVideo = (promptText?: string) => {
    if (!generatedImageUrl) return;
    if (promptText && typeof promptText === 'string') {
        setVeoInitialPrompt(promptText);
    } else {
        setVeoInitialPrompt("");
    }
    setShowVeoModal(true);
  };
  
  // Logic to generate frames based on text motion prompt
  const handleGenerateMotionFrames = async (baseImage: string, motionPrompt: string, count: number): Promise<string[]> => {
    const base64 = baseImage.split(',')[1];
    const generatedFrames: string[] = [];
    
    const variationPrompt = `Motion Instruction: ${motionPrompt}. Create the next frame in an animation sequence. Maintain strict consistency in character face, clothing, and background. Only animate the specified movement (e.g., wind, blink, ripple). Do not change the art style or composition.`;
    
    const promises = [];
    for (let i = 0; i < count; i++) {
        // Add a slight index seed to prompt to ensure variety if model is deterministic
        const indexedPrompt = `${variationPrompt}. Frame ${i+1} of sequence.`;
        promises.push(generateVariation(base64, indexedPrompt, style, aspectRatio));
    }
    
    const results = await Promise.all(promises);
    
    results.forEach(res => {
        if (res) {
            generatedFrames.push(res);
        }
    });
    
    if (generatedFrames.length === 0) {
        throw new Error("Failed to generate any frames.");
    }
    
    return generatedFrames;
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
  };

  // Selection Logic for GIF
  const toggleSelection = (id: string) => {
    setSelectedHistoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const handleOpenGifGenerator = () => {
    if (selectedHistoryIds.length < 2) return;
    
    // Get selected images
    const selectedImages = history
        .filter(item => selectedHistoryIds.includes(item.id))
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(item => item.imageUrl);
        
    setGifBaseImages(selectedImages);
    setShowGifGenerator(true);
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
          images={gifBaseImages}
          onClose={() => setShowGifGenerator(false)}
          onGenerateFrames={handleGenerateMotionFrames}
        />
      )}
      
      {showVeoModal && (
        <VeoVideoModal 
           initialImage={generatedImageUrl}
           initialPrompt={veoInitialPrompt}
           onClose={() => setShowVeoModal(false)}
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
               // Drafts
               drafts={drafts}
               onSaveDraft={handleSaveDraft}
               onLoadDraft={handleLoadDraft}
               onDeleteDraft={handleDeleteDraft}
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
              onAnimate={handleAnimate}
              onVeoVideo={handleVeoVideo}
              batchProgress={batchProgress}
              onGenerateCaption={handleGenerateCaption}
              isGeneratingCaption={isGeneratingCaption}
              generatedCaption={generatedCaption}
              // Pass new batch props for button label
              isBatchMode={isBatchMode}
              batchSize={batchSize}
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
