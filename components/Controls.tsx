
import React, { useRef, useState, useEffect } from 'react';
import { AspectRatio, ImageStyle, ReferenceImage, SuggestionCategories, ReferenceUsage, SecondarySubject, ReferenceMode, Draft } from '../types';
import { WORLD_DATA, UNIVERSAL_TRAITS, QUICK_TEMPLATES, ADDITIONAL_SUBJECTS } from '../constants';

interface ControlsProps {
  prompt: string;
  setPrompt: (val: string) => void;
  negativePrompt: string;
  setNegativePrompt: (val: string) => void;
  style: string;
  setStyle: (val: string) => void;
  aspectRatio: string;
  setAspectRatio: (val: string) => void;
  referenceImages: ReferenceImage[];
  onAddImages: (files: FileList) => void;
  onRemoveImage: (index: number) => void;
  onUpdateImageUsage: (index: number, usage: ReferenceUsage) => void;
  onUpdateImageIntensity: (index: number, val: number) => void;
  onGenerate: () => void;
  onEnhancePrompt: () => void;
  onGetSuggestions: () => Promise<SuggestionCategories>;
  isGenerating: boolean;
  isEnhancing: boolean;
  
  // New props
  likeness: number;
  setLikeness: (val: number) => void;
  referenceMode: ReferenceMode;
  setReferenceMode: (val: ReferenceMode) => void;

  batchSize: number;
  setBatchSize: (val: number) => void;
  isBatchMode: boolean;
  setIsBatchMode: (val: boolean) => void;
  batchSettings: {
    varyPose: boolean;
    varyAge: boolean;
    varyHair: boolean;
    varyEmotion: boolean;
    varySkinTexture: boolean;
    varyFraming: boolean;
    varyLens: boolean;
    varyFocus: boolean;
    varyMotion: boolean;
    varyLighting: boolean;
    varyOutfit: boolean;
    varyLocation: boolean;
    varyWeather: boolean;
  };
  setBatchSettings: React.Dispatch<React.SetStateAction<{
    varyPose: boolean;
    varyAge: boolean;
    varyHair: boolean;
    varyEmotion: boolean;
    varySkinTexture: boolean;
    varyFraming: boolean;
    varyLens: boolean;
    varyFocus: boolean;
    varyMotion: boolean;
    varyLighting: boolean;
    varyOutfit: boolean;
    varyLocation: boolean;
    varyWeather: boolean;
  }>>;

  // World State from Parent
  selectedWorld: keyof typeof WORLD_DATA;
  setSelectedWorld: (val: keyof typeof WORLD_DATA) => void;

  // Drafts Props
  drafts: Draft[];
  onSaveDraft: () => void;
  onLoadDraft: (draft: Draft) => void;
  onDeleteDraft: (id: string) => void;
}

interface WeightedTerm {
  term: string;
  weight: number;
  type: 'positive' | 'negative';
  scope: 'Global' | 'Subject' | 'Background';
}

export const Controls: React.FC<ControlsProps> = ({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  style,
  setStyle,
  aspectRatio,
  setAspectRatio,
  referenceImages,
  onAddImages,
  onRemoveImage,
  onUpdateImageUsage,
  onUpdateImageIntensity,
  onGenerate,
  onEnhancePrompt,
  onGetSuggestions,
  isGenerating,
  isEnhancing,
  likeness,
  setLikeness,
  referenceMode,
  setReferenceMode,
  batchSize,
  setBatchSize,
  isBatchMode,
  setIsBatchMode,
  batchSettings,
  setBatchSettings,
  selectedWorld,
  setSelectedWorld,
  drafts,
  onSaveDraft,
  onLoadDraft,
  onDeleteDraft
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionCategories | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  // Builder State
  const [builderState, setBuilderState] = useState({
    gender: 'Female',
    age: '20s',
    body: 'Athletic',
    skinTone: 'Fair',
    skinTexture: 'Photorealistic Skin',
    tattoos: 'No Tattoos',
    eyeColor: 'Blue',
    hairStyle: 'Long Layers',
    hairColor: 'Blonde',
    facialHair: 'Clean Shaven',
    facialHairColor: 'Match Hair',
    facialFeature: 'Natural Look',
    emotion: 'Neutral',
    role: WORLD_DATA['Modern Day'].roles[0],
    clothing: WORLD_DATA['Modern Day'].clothing[0],
    footwear: 'Match Outfit',
    environment: WORLD_DATA['Modern Day'].environments[0],
    lighting: 'Natural Sunlight',
    weather: 'Sunny',
    pose: 'Standing',
    framing: 'Full Body',
    lens: '50mm Prime',
    focus: 'f/5.6 Sharp',
    motion: 'Static / Tripod',
    imageQuality: 'Extreme Realism'
  });

  // Secondary Subjects State (Multiple)
  const [secondarySubjects, setSecondarySubjects] = useState<SecondarySubject[]>([]);

  // Advanced Weighting State (Builder)
  const [weightedTerms, setWeightedTerms] = useState<WeightedTerm[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [weightValue, setWeightValue] = useState(1.0);
  const [weightType, setWeightType] = useState<'positive' | 'negative'>('positive');
  const [weightScope, setWeightScope] = useState<'Global' | 'Subject' | 'Background'>('Global');

  // Negative Weight Tool State
  const [showNegWeight, setShowNegWeight] = useState(false);
  const [negWeightTerm, setNegWeightTerm] = useState('');
  const [negWeightValue, setNegWeightValue] = useState(1.5);

  // Reset context-specific fields when World changes
  useEffect(() => {
    const worldData = WORLD_DATA[selectedWorld];
    setBuilderState(prev => ({
      ...prev,
      role: worldData.roles[0],
      clothing: worldData.clothing[0],
      environment: worldData.environments[0]
    }));
  }, [selectedWorld]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImages(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateBuilder = (category: keyof typeof builderState, value: string) => {
    setBuilderState(prev => ({ ...prev, [category]: value }));
  };
  
  const addSecondarySubject = () => {
    setSecondarySubjects(prev => [...prev, {
      type: 'Animal',
      name: 'Wolf',
      action: 'Standing next to'
    }]);
  };

  const removeSecondarySubject = (index: number) => {
    setSecondarySubjects(prev => prev.filter((_, i) => i !== index));
  };

  const updateSecondarySubject = (index: number, field: keyof SecondarySubject, value: string) => {
    setSecondarySubjects(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-update name if type changes to a default for that type
      if (field === 'type') {
         // @ts-ignore
         const options = ADDITIONAL_SUBJECTS[value];
         if (options && options.length > 0) {
            updated[index].name = options[0];
         } else {
            updated[index].name = '';
         }
      }
      return updated;
    });
  };

  const addWeightedTerm = () => {
    if (!weightInput.trim()) return;
    setWeightedTerms([...weightedTerms, { 
      term: weightInput.trim(), 
      weight: weightValue, 
      type: weightType, 
      scope: weightScope
    }]);
    setWeightInput('');
    setWeightValue(1.0);
  };

  const removeWeightedTerm = (index: number) => {
    setWeightedTerms(prev => prev.filter((_, i) => i !== index));
  };

  // Helper for direct negative prompt weighting
  const addNegativeWeightedTerm = () => {
    if (!negWeightTerm.trim()) return;
    const term = `<${negWeightTerm.trim()}:${negWeightValue.toFixed(1)}>`;
    setNegativePrompt(prev => {
      const parts = prev.split(',').map(p => p.trim()).filter(Boolean);
      if (!parts.includes(term)) {
        parts.push(term);
      }
      return parts.join(', ');
    });
    setNegWeightTerm('');
    setNegWeightValue(1.5);
  };

  const applyBuilderPrompt = () => {
    const { body, gender, age, emotion, role, hairStyle, hairColor, facialHair, facialHairColor, clothing, footwear, environment, lighting, weather, pose, framing, lens, focus, motion, skinTone, skinTexture, tattoos, eyeColor, facialFeature, imageQuality } = builderState;
    
    let hairDesc = `with ${hairStyle.toLowerCase()} ${hairColor.toLowerCase()} hair`;
    if (hairStyle === 'Bald') hairDesc = 'bald';

    let faceHairDesc = '';
    if (facialHair !== 'Clean Shaven') {
        const color = facialHairColor === 'Match Hair' ? hairColor.toLowerCase() : facialHairColor.toLowerCase();
        faceHairDesc = `, sporting a ${color} ${facialHair.toLowerCase()}`;
    }

    let tattooDesc = '';
    if (tattoos !== 'No Tattoos') {
        tattooDesc = `, with ${tattoos.toLowerCase()}`;
    }

    let footwearDesc = '';
    if (footwear !== 'Match Outfit') {
        footwearDesc = `, wearing ${footwear.toLowerCase()}`;
    }

    // Secondary subjects string
    let secondaryDesc = '';
    if (secondarySubjects.length > 0) {
        // e.g. ", holding a Sword, riding a Dragon"
        const parts = secondarySubjects.map(sub => `${sub.action.toLowerCase()} a ${sub.name.toLowerCase()}`);
        secondaryDesc = `, ${parts.join(', ')}`;
    }

    // Determine prefix based on quality or style to enforce realism if desired
    const isRealistic = imageQuality.includes('Realism') || imageQuality.includes('Photo') || style === ImageStyle.PHOTOREALISTIC || style === ImageStyle.HYPER_REALISTIC;
    const promptPrefix = isRealistic ? 'Photorealistic image' : 'Detailed image';

    // Construct a natural sentence
    let newPrompt = `${framing} shot using ${lens} lens, ${motion}, ${focus}. ${promptPrefix} of a ${body.toLowerCase()} ${age} ${gender.toLowerCase()} ${role}, ${skinTone.toLowerCase()} skin, ${skinTexture.toLowerCase()}, ${eyeColor.toLowerCase()} eyes, with ${facialFeature.toLowerCase()}${tattooDesc}, ${emotion.toLowerCase()} expression${faceHairDesc}, ${pose.toLowerCase()}${secondaryDesc}, ${hairDesc}, wearing ${clothing.toLowerCase()}${footwearDesc}, in a ${environment.toLowerCase()}. Weather: ${weather.toLowerCase()}. Lighting: ${lighting}. Quality: ${imageQuality}.`;
    
    // Append Positive Weighted Terms with Scope
    const positiveWeights = weightedTerms
      .filter(t => t.type === 'positive')
      .map(t => {
        const formatted = `<${t.term}:${t.weight}>`;
        if (t.scope !== 'Global') {
          return `${t.scope}:${formatted}`;
        }
        return formatted;
      })
      .join(' ');
    
    if (positiveWeights) {
      newPrompt += ` ${positiveWeights}`;
    }

    setPrompt(newPrompt);

    // Handle Negative Weighted Terms
    const negativeWeightsList = weightedTerms
      .filter(t => t.type === 'negative')
      .map(t => {
        const formatted = `<${t.term}:${t.weight}>`;
        if (t.scope !== 'Global') {
          return `${t.scope}:${formatted}`;
        }
        return formatted;
      });

    if (negativeWeightsList.length > 0) {
      setNegativePrompt(prev => {
        // Split existing by comma, trim, filter empty
        const currentParts = prev.split(',').map(s => s.trim()).filter(Boolean);
        const newParts = [...currentParts];
        
        // Only add unique terms
        negativeWeightsList.forEach(w => {
          if (!newParts.includes(w)) {
            newParts.push(w);
          }
        });
        
        return newParts.join(', ');
      });
    }
  };

  const handleFetchSuggestions = async () => {
    if (!prompt.trim()) return;
    setIsSuggesting(true);
    setSuggestions(null);
    try {
      const results = await onGetSuggestions();
      setSuggestions(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const applySuggestion = (text: string) => {
    setPrompt(prev => {
      const trimmed = prev.trim();
      const separator = (trimmed.endsWith(',') || trimmed.endsWith('.')) ? ' ' : ', ';
      return trimmed + separator + text;
    });
  };

  const toggleBatchSetting = (key: keyof typeof batchSettings) => {
    setBatchSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const applyPresetPoseSheet = () => {
      setBatchSettings({
          varyPose: true,
          varyAge: false,
          varyHair: false,
          varyEmotion: false,
          varySkinTexture: false,
          varyFraming: true,
          varyLens: false,
          varyFocus: false,
          varyMotion: false,
          varyLighting: false,
          varyOutfit: false,
          varyLocation: false,
          varyWeather: false
      });
  };

  const renderTraitButtons = (category: keyof typeof builderState, options: string[]) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button 
          key={opt} 
          onClick={() => updateBuilder(category, opt)}
          className={`px-2 py-1 rounded-md text-[11px] border transition-all ${
            builderState[category] === opt 
              ? 'bg-yellow-500 text-black border-yellow-500 font-medium shadow-md' 
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-750'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const renderScrollableTraitButtons = (category: keyof typeof builderState, options: string[]) => (
    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 p-1 border border-slate-800 rounded-md bg-slate-900/30">
      {options.map(opt => (
        <button 
          key={opt} 
          onClick={() => updateBuilder(category, opt)}
          className={`px-2 py-1 rounded-md text-[11px] border transition-all whitespace-nowrap ${
            builderState[category] === opt 
              ? 'bg-yellow-500 text-black border-yellow-500 font-medium shadow-md' 
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-750'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
      {/* Prompt Input Area */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
            Image Description
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all font-medium ${
                showDrafts 
                  ? 'bg-indigo-600 text-white border-indigo-500' 
                  : 'bg-slate-700 text-slate-200 border-transparent hover:bg-slate-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Drafts
            </button>
            <button
              onClick={() => setShowBuilder(!showBuilder)}
              className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all font-medium ${
                showBuilder 
                  ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20' 
                  : 'bg-slate-700 text-slate-200 border-transparent hover:bg-slate-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {showBuilder ? 'Close' : 'Builder'}
            </button>
            <button
              onClick={handleFetchSuggestions}
              disabled={isSuggesting || isGenerating || !prompt.trim()}
              className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors px-2 py-1"
              title="Get keyword suggestions from AI"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isSuggesting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Suggestions
            </button>
            <button
              onClick={onEnhancePrompt}
              disabled={isEnhancing || isGenerating}
              className="text-xs flex items-center gap-1 text-yellow-500 hover:text-yellow-400 disabled:opacity-50 transition-colors px-2 py-1"
              title="Generate a random or enhanced prompt"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isEnhancing ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.586 5H7a1 1 0 010-2h7.586l-1.293-1.293A1 1 0 0112 1z" clipRule="evenodd" />
              </svg>
              Magic
            </button>
          </div>
        </div>

        {/* Drafts Panel */}
        {showDrafts && (
           <div className="mb-4 p-4 bg-slate-900 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
             <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-slate-300">Drafts Manager</span>
                <button 
                  onClick={onSaveDraft}
                  disabled={!prompt.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  Save Current as Draft
                </button>
             </div>
             
             {drafts.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">No saved drafts yet.</p>
             ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                   {drafts.map(draft => (
                      <div key={draft.id} className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center group">
                         <div className="overflow-hidden mr-2">
                            <p className="text-xs text-white truncate font-medium">{draft.name}</p>
                            <p className="text-[10px] text-slate-500">
                               {new Date(draft.timestamp).toLocaleDateString()} • {draft.style}
                            </p>
                         </div>
                         <div className="flex gap-2">
                            <button 
                               onClick={() => onLoadDraft(draft)}
                               className="text-xs px-2 py-1 bg-slate-700 hover:bg-blue-600 text-blue-200 hover:text-white rounded transition-colors"
                            >
                               Load
                            </button>
                            <button 
                               onClick={() => onDeleteDraft(draft.id)}
                               className="text-xs px-2 py-1 bg-slate-700 hover:bg-red-600 text-red-200 hover:text-white rounded transition-colors"
                            >
                               Del
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}
           </div>
        )}
        
        {/* Prompt Builder Panel */}
        {showBuilder && (
          <div className="mb-4 p-4 bg-slate-900 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
             {/* World Selector */}
             <div className="mb-5 pb-4 border-b border-slate-800">
               <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 1: Choose World / Era</span>
               <div className="flex flex-wrap gap-2">
                 {(Object.keys(WORLD_DATA) as Array<keyof typeof WORLD_DATA>).map((world) => (
                   <button
                     key={world}
                     onClick={() => setSelectedWorld(world)}
                     className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                       selectedWorld === world
                         ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                         : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                     }`}
                   >
                     {world}
                   </button>
                 ))}
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                {/* Character Traits */}
                <div className="space-y-4">
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="block text-slate-400 mb-2 font-semibold">Who are they?</span>
                    <div className="space-y-3">
                      <div>
                          <span className="text-[10px] text-slate-500 uppercase">Gender</span>
                          {renderTraitButtons('gender', UNIVERSAL_TRAITS.gender)}
                      </div>
                      <div className="w-full">
                           <span className="text-[10px] text-slate-500 uppercase">Age Group</span>
                           {renderTraitButtons('age', UNIVERSAL_TRAITS.age)}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase">Skin Tone</span>
                          {renderTraitButtons('skinTone', UNIVERSAL_TRAITS.skinTone)}
                        </div>
                        <div>
                           <span className="text-[10px] text-slate-500 uppercase">Eye Color</span>
                           {renderTraitButtons('eyeColor', UNIVERSAL_TRAITS.eyeColor)}
                        </div>
                      </div>
                      
                      {/* Skin & Texture Control */}
                      <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
                         <div className="mb-1">
                           <span className="text-[10px] text-yellow-500/80 uppercase font-bold">Skin Realism & Texture</span>
                           <span className="text-[9px] text-slate-500 ml-2">(Affects pores, wrinkles, etc)</span>
                         </div>
                         {/* Switched to Scrollable buttons for Granular options */}
                         {renderScrollableTraitButtons('skinTexture', UNIVERSAL_TRAITS.skinTexture)}
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Face Structure & Details</span>
                        {renderTraitButtons('facialFeature', UNIVERSAL_TRAITS.facialFeature)}
                      </div>

                      {/* Tattoos & Body Art */}
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Body Art & Tattoos</span>
                        {renderTraitButtons('tattoos', UNIVERSAL_TRAITS.tattoos)}
                      </div>
                      
                      {/* Detailed Hair Control */}
                      <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
                         <div className="mb-2">
                           <span className="text-[10px] text-slate-500 uppercase">Hair Style</span>
                           {renderTraitButtons('hairStyle', UNIVERSAL_TRAITS.hairStyle)}
                         </div>
                         <div>
                           <span className="text-[10px] text-slate-500 uppercase">Hair Color</span>
                           {renderTraitButtons('hairColor', UNIVERSAL_TRAITS.hairColor)}
                         </div>
                      </div>

                       {/* Facial Hair Control */}
                       <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
                         <div className="mb-2">
                           <span className="text-[10px] text-slate-500 uppercase">Facial Hair Style (Men)</span>
                           {renderTraitButtons('facialHair', UNIVERSAL_TRAITS.facialHair)}
                         </div>
                         <div>
                           <span className="text-[10px] text-slate-500 uppercase">Facial Hair Color</span>
                           {renderTraitButtons('facialHairColor', UNIVERSAL_TRAITS.facialHairColor)}
                         </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Emotion / Expression</span>
                        {renderTraitButtons('emotion', UNIVERSAL_TRAITS.emotion)}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Body Type</span>
                        {renderTraitButtons('body', UNIVERSAL_TRAITS.body)}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase">Pose / Action</span>
                        {renderScrollableTraitButtons('pose', UNIVERSAL_TRAITS.pose)}
                        <input
                            type="text"
                            value={builderState.pose}
                            onChange={(e) => updateBuilder('pose', e.target.value)}
                            placeholder="Or type custom pose description..."
                            className="w-full mt-1.5 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] text-slate-300 focus:border-yellow-500 outline-none placeholder-slate-600 transition-colors focus:bg-slate-950"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role & Context (Dynamic based on World) */}
                <div className="space-y-4">
                  {/* NOTE: Removed h-full here to prevent layout overlap with subsequent sections */}
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="block text-slate-400 mb-2 font-semibold flex items-center gap-2">
                        Context: <span className="text-indigo-400">{selectedWorld}</span>
                    </span>
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-1 duration-300" key={selectedWorld}>
                       <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Role (Select one)</span>
                        {renderScrollableTraitButtons('role', WORLD_DATA[selectedWorld].roles)}
                      </div>
                       <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Attire</span>
                        {renderScrollableTraitButtons('clothing', WORLD_DATA[selectedWorld].clothing)}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Footwear</span>
                        {renderScrollableTraitButtons('footwear', UNIVERSAL_TRAITS.footwear)}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Location</span>
                        {renderScrollableTraitButtons('environment', WORLD_DATA[selectedWorld].environments)}
                      </div>
                    </div>
                  </div>

                  {/* Secondary Subjects Builder (Multi) */}
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-slate-400 font-semibold text-xs">Additional Subjects / Props</span>
                         <button 
                            onClick={addSecondarySubject}
                            className="px-2 py-0.5 text-[10px] rounded border bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500"
                         >
                            Add +
                         </button>
                    </div>
                    
                    <div className="space-y-3">
                        {secondarySubjects.length === 0 && (
                            <p className="text-[10px] text-slate-600 italic text-center py-2">No additional subjects added.</p>
                        )}

                        {secondarySubjects.map((subject, index) => (
                            <div key={index} className="bg-slate-900/50 p-2 rounded border border-slate-700 relative animate-in fade-in slide-in-from-top-1">
                                <button 
                                    onClick={() => removeSecondarySubject(index)} 
                                    className="absolute top-1 right-1 text-slate-500 hover:text-red-400 p-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                
                                <div className="space-y-2 pr-6">
                                    {/* Type */}
                                    <div>
                                        <div className="flex flex-wrap gap-1">
                                            {ADDITIONAL_SUBJECTS.types.map(t => (
                                                <button 
                                                    key={t}
                                                    onClick={() => updateSecondarySubject(index, 'type', t)}
                                                    className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${subject.type === t ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <input
                                            type="text"
                                            value={subject.name}
                                            onChange={(e) => updateSecondarySubject(index, 'name', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white focus:border-indigo-500 outline-none mb-1 placeholder-slate-600"
                                            placeholder="Specific Name (e.g. Red Dragon)"
                                        />
                                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                            {/* @ts-ignore */}
                                            {(ADDITIONAL_SUBJECTS[subject.type] || []).map((opt: string) => (
                                                <button 
                                                    key={opt}
                                                    onClick={() => updateSecondarySubject(index, 'name', opt)}
                                                    className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${subject.name === opt ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Interaction */}
                                    <div>
                                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Interaction / Action</span>
                                        <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 p-1 border border-slate-800 rounded bg-slate-900/30">
                                            {ADDITIONAL_SUBJECTS.actions.map(opt => (
                                                <button 
                                                    key={opt}
                                                    onClick={() => updateSecondarySubject(index, 'action', opt)}
                                                    className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${subject.action === opt ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
             </div>
             
             {/* Composition & Atmosphere */}
             <div className="mt-8 pt-3 border-t border-slate-800">
                <span className="block text-slate-400 font-semibold mb-3 text-xs">Composition & Atmosphere</span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase mb-2">Framing</span>
                    {renderTraitButtons('framing', UNIVERSAL_TRAITS.framing)}
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase mb-2">Lighting</span>
                    {renderTraitButtons('lighting', UNIVERSAL_TRAITS.lighting)}
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase mb-2">Weather</span>
                    {renderTraitButtons('weather', UNIVERSAL_TRAITS.weather)}
                  </div>
                </div>
                
                {/* Image Quality Section */}
                <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                    <span className="block text-[10px] text-indigo-300 font-bold uppercase mb-2">Image Quality & Style</span>
                    {/* Switched to Scrollable buttons for Granular options */}
                    {renderScrollableTraitButtons('imageQuality', UNIVERSAL_TRAITS.imageQuality)}
                </div>
             </div>

             {/* Camera Settings */}
             <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="block text-slate-400 font-semibold mb-3 text-xs flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Camera Settings
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/30 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase mb-2">Lens</span>
                    {renderTraitButtons('lens', UNIVERSAL_TRAITS.lens)}
                  </div>
                   <div>
                    <span className="block text-[10px] text-slate-500 uppercase mb-2">Aperture / Focus</span>
                    {renderTraitButtons('focus', UNIVERSAL_TRAITS.focus)}
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase mb-2">Shutter / Motion</span>
                    {renderTraitButtons('motion', UNIVERSAL_TRAITS.motion)}
                  </div>
                </div>
             </div>

             {/* Advanced Weighted Elements */}
             <div className="mt-4 pt-3 border-t border-slate-800">
               <span className="block text-slate-400 font-semibold mb-3 text-xs flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                 </svg>
                 Advanced Weighting
               </span>
               <div className="bg-slate-950/30 p-4 rounded-lg border border-slate-800">
                  <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
                    <div className="w-full md:w-32">
                      <label className="text-[10px] text-slate-500 uppercase mb-1 block">Scope</label>
                      <select 
                        value={weightScope}
                        onChange={(e) => setWeightScope(e.target.value as 'Global' | 'Subject' | 'Background')}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:border-purple-500 outline-none"
                      >
                        <option value="Global">Global</option>
                        <option value="Subject">Subject</option>
                        <option value="Background">Background</option>
                      </select>
                    </div>
                    <div className="flex-grow w-full">
                      <label className="text-[10px] text-slate-500 uppercase mb-1 block">Element / Keyword</label>
                      <input 
                        type="text" 
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addWeightedTerm()}
                        placeholder="e.g. forest, fog, crowd"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <label className="text-[10px] text-slate-500 uppercase mb-1 block flex justify-between">
                        <span>Weight</span>
                        <span className="text-purple-400">{weightValue.toFixed(1)}</span>
                      </label>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="2.0" 
                        step="0.1"
                        value={weightValue}
                        onChange={(e) => setWeightValue(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div className="flex bg-slate-900 rounded-lg border border-slate-700 p-1">
                      <button 
                        onClick={() => setWeightType('positive')}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold transition-colors ${weightType === 'positive' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Pos
                      </button>
                      <button 
                        onClick={() => setWeightType('negative')}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold transition-colors ${weightType === 'negative' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Neg
                      </button>
                    </div>
                    <button 
                      onClick={addWeightedTerm}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Weighted List */}
                  {weightedTerms.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {weightedTerms.map((t, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-2 px-2 py-1 rounded border text-[10px] font-mono ${
                            t.type === 'positive' 
                              ? 'bg-green-900/30 border-green-700 text-green-300' 
                              : 'bg-red-900/30 border-red-700 text-red-300'
                          }`}
                        >
                          <span>
                            {t.scope !== 'Global' && <span className="text-slate-400 font-bold mr-1">{t.scope}:</span>}
                            {`<${t.term}:${t.weight}>`}
                          </span>
                          <button onClick={() => removeWeightedTerm(idx)} className="hover:text-white">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
             </div>

             <div className="mt-4 pt-4 flex justify-end">
               <button 
                onClick={applyBuilderPrompt}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-bold text-sm hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20 transform hover:scale-105"
               >
                 <span>Insert into Prompt</span>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                 </svg>
               </button>
             </div>
          </div>
        )}

        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A futuristic city with flying cars and neon lights..."
          className="w-full h-32 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 resize-none transition-all"
        />
        
        {/* Suggestion Chips */}
        {suggestions && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
             <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs text-blue-400 font-bold flex items-center gap-1">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                   </svg>
                   AI Suggestions
                </span>
                <button onClick={() => setSuggestions(null)} className="text-[10px] text-slate-500 hover:text-white">Clear</button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lighting Suggestions */}
                {suggestions.lighting.length > 0 && (
                   <div>
                      <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1.5">Lighting</span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.lighting.map((item, idx) => (
                           <button
                             key={`l-${idx}`}
                             onClick={() => applySuggestion(item)}
                             className="text-[10px] px-2 py-1 rounded-md bg-yellow-900/20 text-yellow-200 border border-yellow-700/30 hover:bg-yellow-800/40 transition-colors"
                           >
                             + {item}
                           </button>
                        ))}
                      </div>
                   </div>
                )}
                
                {/* Camera Suggestions */}
                {suggestions.camera.length > 0 && (
                   <div>
                      <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1.5">Camera</span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.camera.map((item, idx) => (
                           <button
                             key={`c-${idx}`}
                             onClick={() => applySuggestion(item)}
                             className="text-[10px] px-2 py-1 rounded-md bg-blue-900/20 text-blue-200 border border-blue-700/30 hover:bg-blue-800/40 transition-colors"
                           >
                             + {item}
                           </button>
                        ))}
                      </div>
                   </div>
                )}

                {/* Details/Keywords Suggestions */}
                {suggestions.details.length > 0 && (
                   <div>
                      <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1.5">Details</span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.details.map((item, idx) => (
                           <button
                             key={`d-${idx}`}
                             onClick={() => applySuggestion(item)}
                             className="text-[10px] px-2 py-1 rounded-md bg-purple-900/20 text-purple-200 border border-purple-700/30 hover:bg-purple-800/40 transition-colors"
                           >
                             + {item}
                           </button>
                        ))}
                      </div>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* Quick Templates */}
        {!showBuilder && !suggestions && (
          <div className="mt-3">
            <p className="text-xs text-slate-400 mb-2 font-medium">Quick Starts:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setPrompt(t.text)}
                  disabled={isGenerating}
                  className="text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 hover:border-yellow-500/50 hover:text-yellow-400 transition-all cursor-pointer disabled:opacity-50"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Negative Prompt */}
      <div>
        <div className="flex justify-between items-center mb-2">
           <label htmlFor="negativePrompt" className="block text-sm font-medium text-slate-300">
             Negative Prompt (What to exclude)
           </label>
           <button
             onClick={() => setShowNegWeight(!showNegWeight)}
             className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             Add Weighted Exclusion
           </button>
        </div>
        
        <input
          id="negativePrompt"
          type="text"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="blur, distortion, low quality, ugly..."
          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
        />

        {/* Weighted Exclusion Tool */}
        {showNegWeight && (
          <div className="mt-2 p-3 bg-red-950/20 border border-red-500/20 rounded-lg animate-in slide-in-from-top-1">
             <div className="flex gap-2 items-center">
               <div className="flex-grow">
                 <input 
                   type="text" 
                   value={negWeightTerm}
                   onChange={(e) => setNegWeightTerm(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && addNegativeWeightedTerm()}
                   placeholder="e.g. bad anatomy"
                   className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:border-red-500 outline-none"
                 />
               </div>
               <div className="w-24">
                  <div className="flex justify-between text-[9px] text-red-300/80 mb-1">
                    <span>Weight</span>
                    <span>{negWeightValue.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="3.0" 
                    step="0.1"
                    value={negWeightValue}
                    onChange={(e) => setNegWeightValue(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
               </div>
               <button 
                 onClick={addNegativeWeightedTerm}
                 className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
               >
                 Add
               </button>
             </div>
             <p className="text-[10px] text-slate-500 mt-1">
               Example: <span className="font-mono text-red-300">&lt;blur:1.5&gt;</span> strongly excludes blur.
             </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Style Selector */}
        <div>
          <label htmlFor="style" className="block text-sm font-medium text-slate-300 mb-2">
            Artistic Style
          </label>
          <div className="relative">
            <select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full appearance-none px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all cursor-pointer"
            >
              {Object.values(ImageStyle).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div>
          <label htmlFor="ratio" className="block text-sm font-medium text-slate-300 mb-2">
            Aspect Ratio
          </label>
          <div className="relative">
            <select
              id="ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full appearance-none px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all cursor-pointer"
            >
              <option value={AspectRatio.SQUARE}>1:1 (Square)</option>
              <option value={AspectRatio.LANDSCAPE_WIDE}>16:9 (Cinematic)</option>
              <option value={AspectRatio.PORTRAIT_WIDE}>9:16 (Story)</option>
              <option value={AspectRatio.STANDARD_PORTRAIT}>3:4 (Portrait)</option>
              <option value={AspectRatio.STANDARD_LANDSCAPE}>4:3 (Landscape)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Image Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
           <label className="block text-sm font-medium text-slate-300">
             Reference Images (Optional)
           </label>
           <span className="text-[10px] text-slate-500">Upload multiple images. Mix usage types (e.g. one for face, one for clothes).</span>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {referenceImages.map((img, idx) => (
            <div key={idx} className="relative group w-32 rounded-lg overflow-hidden border border-slate-600 bg-slate-900 pb-1">
              <div className="h-24 w-full relative">
                 <img src={img.previewUrl} alt="Ref" className="w-full h-full object-cover" />
                 
                 {/* Remove Button */}
                 <button
                    onClick={() => onRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-white hover:bg-red-500 transition-colors"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
                 
                 {/* Index Badge */}
                 <div className="absolute top-1 left-1 bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    #{idx + 1}
                 </div>
              </div>
              
              <div className="p-1.5 space-y-1.5">
                 {/* Usage Type */}
                 <select 
                   value={img.usage}
                   onChange={(e) => onUpdateImageUsage(idx, e.target.value as ReferenceUsage)}
                   className="w-full text-[9px] bg-slate-800 text-white border border-slate-600 rounded px-1 py-1 outline-none focus:border-yellow-500"
                 >
                   <option value="Structure">Structure</option>
                   <option value="Character">Character (All Traits)</option>
                   <option value="Face">Face ID</option>
                   <option value="Clothing">Clothing</option>
                   <option value="Style">Art Style</option>
                   <option value="Background">Background</option>
                 </select>
                 
                 {/* Intensity Slider */}
                 <div>
                    <div className="flex justify-between items-center mb-0.5">
                       <span className="text-[8px] text-slate-400 font-bold uppercase">Intensity</span>
                       <span className={`text-[8px] font-bold ${img.intensity >= 0.8 ? 'text-yellow-500' : 'text-slate-500'}`}>
                          {(img.intensity * 10).toFixed(0)}
                       </span>
                    </div>
                    <input 
                       type="range" 
                       min="0.1" 
                       max="1.0" 
                       step="0.1" 
                       value={img.intensity}
                       onChange={(e) => onUpdateImageIntensity(idx, parseFloat(e.target.value))}
                       className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 block"
                    />
                 </div>
              </div>
            </div>
          ))}
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-28 h-28 rounded-lg border-2 border-dashed border-slate-600 hover:border-yellow-500/50 hover:bg-slate-800 flex flex-col items-center justify-center text-slate-500 hover:text-yellow-500 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] font-medium">Add Image</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Batch Mode Toggle & Slider */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="block text-sm font-medium text-slate-300">Batch Variation Mode</span>
            <span className="text-[10px] text-slate-500">Generate multiple images with variations based on your prompt.</span>
          </div>
          <button 
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isBatchMode ? 'bg-yellow-500' : 'bg-slate-700'}`}
          >
            <span
              className={`${isBatchMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        {isBatchMode && (
           <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
             <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400">Batch Size</span>
                    <span className="text-sm font-bold text-yellow-500">{batchSize} images</span>
                </div>
                <input 
                type="range" 
                min="1" 
                max="50" 
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
             </div>

             {/* Variation Settings */}
             <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                    <span className="block text-xs font-bold text-slate-400">Variation Settings (Select what to randomize)</span>
                    <button 
                        onClick={applyPresetPoseSheet}
                        className="text-[10px] px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded border border-indigo-500 flex items-center gap-1"
                        title="Varies Pose/Camera but keeps everything else fixed"
                    >
                        <span>✨ Quick Preset: Pose Sheet</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyPose} onChange={() => toggleBatchSetting('varyPose')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Pose / Action</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyAge} onChange={() => toggleBatchSetting('varyAge')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Age</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyHair} onChange={() => toggleBatchSetting('varyHair')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Hair</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyEmotion} onChange={() => toggleBatchSetting('varyEmotion')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Emotion / Expression</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varySkinTexture} onChange={() => toggleBatchSetting('varySkinTexture')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Skin Texture</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyOutfit} onChange={() => toggleBatchSetting('varyOutfit')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Outfit / Attire</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyLocation} onChange={() => toggleBatchSetting('varyLocation')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Location</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyWeather} onChange={() => toggleBatchSetting('varyWeather')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Weather</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyFraming} onChange={() => toggleBatchSetting('varyFraming')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Camera Framing</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyLens} onChange={() => toggleBatchSetting('varyLens')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Lens</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyFocus} onChange={() => toggleBatchSetting('varyFocus')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Focus / Aperture</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyMotion} onChange={() => toggleBatchSetting('varyMotion')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Motion Blur</span>
                    </label>
                     <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyLighting} onChange={() => toggleBatchSetting('varyLighting')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Lighting</span>
                    </label>
                </div>
             </div>
           </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
          isGenerating || !prompt.trim()
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-orange-500/25'
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isBatchMode ? `Generating Batch...` : 'Generating...'}
          </span>
        ) : (
          isBatchMode ? `Generate ${batchSize} Variations` : 'Generate Image'
        )}
      </button>
    </div>
  );
};
