import React, { useRef, useState, useEffect } from 'react';
import { AspectRatio, ImageStyle, ReferenceImage, SuggestionCategories, ReferenceUsage, SecondarySubject, ReferenceMode, Draft, CustomModel } from '../types';
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
    // Identity
    varyGender: boolean;
    varyAge: boolean;
    varyBody: boolean;
    varySkinTone: boolean;
    varyEyeColor: boolean;
    varyFacialFeatures: boolean;
    varyFacialHair: boolean;
    varyHair: boolean;
    varyTattoos: boolean;
    
    // State
    varyPose: boolean;
    varyEmotion: boolean;
    varyOutfit: boolean;
    varyFootwear: boolean;
    varySkinTexture: boolean;
    
    // Environment
    varyLocation: boolean;
    varyWeather: boolean;
    
    // Camera
    varyFraming: boolean;
    varyLens: boolean;
    varyFocus: boolean;
    varyMotion: boolean;
    varyLighting: boolean;
  };
  setBatchSettings: React.Dispatch<React.SetStateAction<any>>;

  // World State from Parent
  selectedWorld: keyof typeof WORLD_DATA;
  setSelectedWorld: (val: keyof typeof WORLD_DATA) => void;

  // Drafts Props
  drafts: Draft[];
  onSaveDraft: () => void;
  onLoadDraft: (draft: Draft) => void;
  onDeleteDraft: (id: string) => void;

  // Custom Models Props
  customModels: CustomModel[];
  onOpenModelTrainer: () => void;
  onLoadModel: (model: CustomModel) => void;
  onDeleteModel: (id: string) => void;
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
  onDeleteDraft,
  customModels,
  onOpenModelTrainer,
  onLoadModel,
  onDeleteModel
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
    poseDescription: '',
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
    const { body, gender, age, emotion, role, hairStyle, hairColor, facialHair, facialHairColor, clothing, footwear, environment, lighting, weather, pose, poseDescription, framing, lens, focus, motion, skinTone, skinTexture, tattoos, eyeColor, facialFeature, imageQuality } = builderState;
    
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

    let poseDesc = pose.toLowerCase();
    if (poseDescription.trim()) {
        poseDesc = `${poseDesc} (${poseDescription.trim()})`;
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
    let newPrompt = `${framing} shot using ${lens} lens, ${motion}, ${focus}. ${promptPrefix} of a ${body.toLowerCase()} ${age} ${gender.toLowerCase()} ${role}, ${skinTone.toLowerCase()} skin, ${skinTexture.toLowerCase()}, ${eyeColor.toLowerCase()} eyes, with ${facialFeature.toLowerCase()}${tattooDesc}, ${emotion.toLowerCase()} expression${faceHairDesc}, ${poseDesc}${secondaryDesc}, ${hairDesc}, wearing ${clothing.toLowerCase()}${footwearDesc}, in a ${environment.toLowerCase()}. Weather: ${weather.toLowerCase()}. Lighting: ${lighting}. Quality: ${imageQuality}.`;
    
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
          varyWeather: false,
          // Reset others
          varyGender: false,
          varyBody: false,
          varySkinTone: false,
          varyEyeColor: false,
          varyFacialFeatures: false,
          varyFacialHair: false,
          varyTattoos: false,
          varyFootwear: false,
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
             {/* World & Era Selection */}
             <div className="mb-6 pb-4 border-b border-slate-800">
                <label className="text-xs text-yellow-500 uppercase font-bold mb-2 block tracking-wider">World Setting & Era</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(WORLD_DATA).map(world => (
                    <button
                      key={world}
                      onClick={() => setSelectedWorld(world as keyof typeof WORLD_DATA)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedWorld === world
                          ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      {world}
                    </button>
                  ))}
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Role & Attributes */}
                <div className="space-y-5">
                   {/* Role & Context */}
                   <div key={selectedWorld} className="animate-in fade-in duration-300">
                      <div className="mb-3">
                        <label className="text-xs text-slate-400 font-bold uppercase mb-1.5 block">Character Role</label>
                        {renderScrollableTraitButtons('role', WORLD_DATA[selectedWorld].roles)}
                      </div>
                      <div className="mb-3">
                        <label className="text-xs text-slate-400 font-bold uppercase mb-1.5 block">Attire / Outfit</label>
                        {renderScrollableTraitButtons('clothing', WORLD_DATA[selectedWorld].clothing)}
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-bold uppercase mb-1.5 block">Location</label>
                        {renderScrollableTraitButtons('environment', WORLD_DATA[selectedWorld].environments)}
                      </div>
                   </div>
                   
                   {/* Identity Group */}
                   <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 border-b border-slate-800 pb-2">Character Traits</h4>
                      <div className="space-y-3">
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Gender</span>
                            {renderTraitButtons('gender', UNIVERSAL_TRAITS.gender)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Age</span>
                            {renderTraitButtons('age', UNIVERSAL_TRAITS.age)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Body Type</span>
                            {renderTraitButtons('body', UNIVERSAL_TRAITS.body)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Skin Tone</span>
                            {renderTraitButtons('skinTone', UNIVERSAL_TRAITS.skinTone)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Eye Color</span>
                            {renderTraitButtons('eyeColor', UNIVERSAL_TRAITS.eyeColor)}
                         </div>
                      </div>
                   </div>

                   {/* Hair & Face Group */}
                   <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 border-b border-slate-800 pb-2">Hair & Face</h4>
                      <div className="space-y-3">
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Hair Style</span>
                            {renderScrollableTraitButtons('hairStyle', UNIVERSAL_TRAITS.hairStyle)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Hair Color</span>
                            {renderScrollableTraitButtons('hairColor', UNIVERSAL_TRAITS.hairColor)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Facial Hair (Men)</span>
                            {renderTraitButtons('facialHair', UNIVERSAL_TRAITS.facialHair)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Facial Features</span>
                            {renderScrollableTraitButtons('facialFeature', UNIVERSAL_TRAITS.facialFeature)}
                         </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Skin Texture (Realism)</span>
                            {renderScrollableTraitButtons('skinTexture', UNIVERSAL_TRAITS.skinTexture)}
                         </div>
                      </div>
                   </div>

                   {/* Body Art & Feet */}
                   <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                       <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 border-b border-slate-800 pb-2">Details</h4>
                       <div className="space-y-3">
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Tattoos / Body Art</span>
                            {renderScrollableTraitButtons('tattoos', UNIVERSAL_TRAITS.tattoos)}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Footwear</span>
                            {renderScrollableTraitButtons('footwear', UNIVERSAL_TRAITS.footwear)}
                          </div>
                       </div>
                   </div>
                </div>

                {/* Right Column: Pose, Composition, Extras */}
                <div className="space-y-5">
                   {/* Pose & Expression */}
                   <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 border-b border-slate-800 pb-2">Pose & Expression</h4>
                      <div className="space-y-3">
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Emotion</span>
                            {renderScrollableTraitButtons('emotion', UNIVERSAL_TRAITS.emotion)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Pose / Action</span>
                            {renderScrollableTraitButtons('pose', UNIVERSAL_TRAITS.pose)}
                            <input 
                              type="text" 
                              placeholder="Or type custom pose description..."
                              value={builderState.poseDescription}
                              onChange={(e) => updateBuilder('poseDescription', e.target.value)}
                              className="w-full mt-2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white placeholder-slate-600 focus:border-yellow-500 outline-none"
                            />
                         </div>
                      </div>
                   </div>
                   
                   {/* Composition */}
                   <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 border-b border-slate-800 pb-2">Composition & Atmosphere</h4>
                      <div className="space-y-3">
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Framing</span>
                            {renderScrollableTraitButtons('framing', UNIVERSAL_TRAITS.framing)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Lighting</span>
                            {renderScrollableTraitButtons('lighting', UNIVERSAL_TRAITS.lighting)}
                         </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Weather</span>
                            {renderTraitButtons('weather', UNIVERSAL_TRAITS.weather)}
                         </div>
                      </div>
                   </div>

                   {/* Camera Settings */}
                   <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 border-b border-slate-800 pb-2">Camera Tech</h4>
                      <div className="space-y-3">
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Lens</span>
                            {renderScrollableTraitButtons('lens', UNIVERSAL_TRAITS.lens)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Focus / Aperture</span>
                            {renderTraitButtons('focus', UNIVERSAL_TRAITS.focus)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Motion Blur</span>
                            {renderTraitButtons('motion', UNIVERSAL_TRAITS.motion)}
                         </div>
                         <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Image Quality</span>
                            {renderScrollableTraitButtons('imageQuality', UNIVERSAL_TRAITS.imageQuality)}
                         </div>
                      </div>
                   </div>

                   {/* Secondary Subjects Section */}
                   <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Additional Subjects</h4>
                        <button 
                          onClick={addSecondarySubject}
                          className="text-[10px] px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add Subject
                        </button>
                      </div>

                      {secondarySubjects.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic">No additional subjects added.</p>
                      ) : (
                        <div className="space-y-3">
                          {secondarySubjects.map((sub, idx) => (
                            <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-700 relative group">
                               <button 
                                 onClick={() => removeSecondarySubject(idx)}
                                 className="absolute top-2 right-2 text-slate-500 hover:text-red-500"
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                   <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                 </svg>
                               </button>

                               <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  {/* Action */}
                                  <div>
                                     <label className="block text-[9px] text-slate-400 mb-1">Interaction</label>
                                     <div className="relative">
                                        <select 
                                          value={sub.action}
                                          onChange={(e) => updateSecondarySubject(idx, 'action', e.target.value)}
                                          className="w-full text-[10px] bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white appearance-none"
                                        >
                                           {ADDITIONAL_SUBJECTS.actions.map(act => <option key={act} value={act}>{act}</option>)}
                                        </select>
                                     </div>
                                  </div>

                                  {/* Type */}
                                  <div>
                                     <label className="block text-[9px] text-slate-400 mb-1">Category</label>
                                     <select 
                                       value={sub.type}
                                       onChange={(e) => updateSecondarySubject(idx, 'type', e.target.value)}
                                       className="w-full text-[10px] bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white"
                                     >
                                        {ADDITIONAL_SUBJECTS.types.map(t => <option key={t} value={t}>{t}</option>)}
                                     </select>
                                  </div>
                                  
                                  {/* Name */}
                                  <div>
                                     <label className="block text-[9px] text-slate-400 mb-1">Subject Name</label>
                                     {/* @ts-ignore */}
                                     {ADDITIONAL_SUBJECTS[sub.type] ? (
                                        <select 
                                          value={sub.name}
                                          onChange={(e) => updateSecondarySubject(idx, 'name', e.target.value)}
                                          className="w-full text-[10px] bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white"
                                        >
                                           {/* @ts-ignore */}
                                           {ADDITIONAL_SUBJECTS[sub.type].map((opt: string) => (
                                              <option key={opt} value={opt}>{opt}</option>
                                           ))}
                                        </select>
                                     ) : (
                                        <input 
                                          type="text"
                                          value={sub.name}
                                          onChange={(e) => updateSecondarySubject(idx, 'name', e.target.value)}
                                          className="w-full text-[10px] bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white"
                                          placeholder="Type name..."
                                        />
                                     )}
                                  </div>
                               </div>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>

                   {/* Advanced Weighting */}
                   <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 border-b border-slate-800 pb-2">Advanced Weighting</h4>
                      <div className="space-y-3">
                         <div className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              value={weightInput}
                              onChange={(e) => setWeightInput(e.target.value)}
                              placeholder="e.g. Fog, Red, Birds"
                              className="flex-grow text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:border-yellow-500 outline-none"
                              onKeyDown={(e) => e.key === 'Enter' && addWeightedTerm()}
                            />
                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5">
                               <input 
                                 type="range" 
                                 min="0.1" 
                                 max="2.0" 
                                 step="0.1"
                                 value={weightValue}
                                 onChange={(e) => setWeightValue(parseFloat(e.target.value))}
                                 className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-yellow-500"
                               />
                               <span className="text-[10px] w-6 text-right font-mono text-yellow-500">{weightValue.toFixed(1)}</span>
                            </div>
                         </div>
                         <div className="flex gap-2">
                             <select 
                               value={weightScope}
                               onChange={(e) => setWeightScope(e.target.value as any)}
                               className="text-[10px] bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300"
                             >
                                <option value="Global">Global</option>
                                <option value="Subject">Subject</option>
                                <option value="Background">Background</option>
                             </select>
                             <div className="flex gap-1 border border-slate-700 rounded p-0.5 bg-slate-900">
                                <button 
                                  onClick={() => setWeightType('positive')}
                                  className={`text-[10px] px-2 py-0.5 rounded ${weightType === 'positive' ? 'bg-green-600 text-white' : 'text-slate-400'}`}
                                >
                                  Positive
                                </button>
                                <button 
                                  onClick={() => setWeightType('negative')}
                                  className={`text-[10px] px-2 py-0.5 rounded ${weightType === 'negative' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                                >
                                  Negative
                                </button>
                             </div>
                             <button 
                               onClick={addWeightedTerm}
                               className="text-[10px] px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded"
                             >
                               Add
                             </button>
                         </div>
                         
                         {weightedTerms.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                               {weightedTerms.map((t, idx) => (
                                  <div key={idx} className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 ${t.type === 'positive' ? 'bg-green-900/40 border border-green-700 text-green-200' : 'bg-red-900/40 border border-red-700 text-red-200'}`}>
                                     <span>{t.scope !== 'Global' && <span className="opacity-70 mr-1">{t.scope}:</span>}{t.term} <span className="opacity-70">({t.weight})</span></span>
                                     <button onClick={() => removeWeightedTerm(idx)} className="hover:text-white">&times;</button>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>
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
        
        {/* Suggestion Chips and Quick Templates */}
        {suggestions && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1">
             <div className="flex items-center gap-2 mb-2">
               <span className="text-xs font-bold text-blue-400 uppercase">AI Suggestions</span>
               <button onClick={() => setSuggestions(null)} className="text-[10px] text-slate-500 hover:text-white">&times; Dismiss</button>
             </div>
             
             {/* Categorized Suggestions */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Lighting */}
                {suggestions.lighting?.length > 0 && (
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                     <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Lighting</span>
                     <div className="flex flex-wrap gap-1.5">
                        {suggestions.lighting.map((s, i) => (
                           <button key={i} onClick={() => applySuggestion(s)} className="text-[10px] px-1.5 py-0.5 bg-blue-900/30 text-blue-200 border border-blue-800 rounded hover:bg-blue-800 hover:text-white transition-colors">{s}</button>
                        ))}
                     </div>
                  </div>
                )}
                {/* Camera */}
                {suggestions.camera?.length > 0 && (
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                     <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Camera</span>
                     <div className="flex flex-wrap gap-1.5">
                        {suggestions.camera.map((s, i) => (
                           <button key={i} onClick={() => applySuggestion(s)} className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 text-purple-200 border border-purple-800 rounded hover:bg-purple-800 hover:text-white transition-colors">{s}</button>
                        ))}
                     </div>
                  </div>
                )}
                {/* Details */}
                {suggestions.details?.length > 0 && (
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                     <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Details</span>
                     <div className="flex flex-wrap gap-1.5">
                        {suggestions.details.map((s, i) => (
                           <button key={i} onClick={() => applySuggestion(s)} className="text-[10px] px-1.5 py-0.5 bg-yellow-900/30 text-yellow-200 border border-yellow-800 rounded hover:bg-yellow-800 hover:text-white transition-colors">{s}</button>
                        ))}
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        <div className="mt-3">
           <span className="text-xs font-medium text-slate-500 mb-2 block">Quick Start Templates:</span>
           <div className="flex flex-wrap gap-2">
             {QUICK_TEMPLATES.map((t, i) => (
               <button
                 key={i}
                 onClick={() => setPrompt(t.text)}
                 className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition-all"
                 title={t.text}
               >
                 {t.label}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Negative Prompt & Weighted Exclusion */}
      <div>
        <div className="flex justify-between items-center mb-2">
           <label htmlFor="negativePrompt" className="block text-sm font-medium text-slate-300">
             Negative Prompt (Exclude)
           </label>
           <button 
             onClick={() => setShowNegWeight(!showNegWeight)}
             className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
           >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Weighted Exclusion
           </button>
        </div>
        
        {showNegWeight && (
           <div className="mb-2 p-2 bg-red-900/10 border border-red-900/30 rounded-lg flex items-center gap-2 animate-in fade-in">
              <input 
                 type="text" 
                 value={negWeightTerm}
                 onChange={(e) => setNegWeightTerm(e.target.value)}
                 placeholder="Element to remove strongly (e.g. Blur)"
                 className="text-xs bg-slate-900 border border-red-900/30 rounded px-2 py-1 text-white focus:border-red-500 outline-none flex-grow"
                 onKeyDown={(e) => e.key === 'Enter' && addNegativeWeightedTerm()}
              />
              <input 
                 type="range" 
                 min="1.1" 
                 max="2.0" 
                 step="0.1" 
                 value={negWeightValue}
                 onChange={(e) => setNegWeightValue(parseFloat(e.target.value))}
                 className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-red-500"
              />
              <span className="text-[10px] text-red-400 w-6">{negWeightValue.toFixed(1)}</span>
              <button 
                onClick={addNegativeWeightedTerm}
                className="text-[10px] px-2 py-1 bg-red-900/50 hover:bg-red-800 text-red-200 rounded border border-red-800"
              >
                Add
              </button>
           </div>
        )}

        <input
          id="negativePrompt"
          type="text"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="blur, low quality, distortion, ugly..."
          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
        />
      </div>
      
      {/* Style & Ratio */}
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
      
      {/* Custom Models (LoRA) */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-indigo-900/30">
         <div className="flex justify-between items-center mb-3">
             <div>
                <span className="block text-sm font-medium text-slate-300">Custom Models (LoRA)</span>
                <span className="text-[10px] text-slate-500">Train & load custom styles or characters.</span>
             </div>
             <button
               onClick={onOpenModelTrainer} 
               className="text-[10px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 font-bold transition-all shadow-lg shadow-indigo-500/20"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Train New Model
             </button>
         </div>
         
         {customModels.length === 0 ? (
            <div className="text-center py-3 border border-dashed border-slate-700 rounded-lg">
                <p className="text-[10px] text-slate-500">No custom models trained yet.</p>
            </div>
         ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
                {customModels.map(model => (
                    <div key={model.id} className="flex-shrink-0 w-32 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors group relative">
                        <div className="h-20 w-full relative">
                            <img src={`data:${model.images[0].mimeType};base64,${model.thumbnail}`} alt={model.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-1 right-1">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDeleteModel(model.id); }}
                                  className="bg-black/50 hover:bg-red-600 text-white rounded-full p-0.5"
                                >
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                     <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                   </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-2">
                            <p className="text-[10px] font-bold text-white truncate">{model.name}</p>
                            <p className="text-[9px] text-slate-500 truncate">{model.type} • {model.triggerWord}</p>
                            <button 
                              onClick={() => onLoadModel(model)}
                              className="mt-2 w-full py-1 text-[9px] bg-slate-800 hover:bg-indigo-600 text-white rounded border border-slate-600 hover:border-indigo-500 transition-colors"
                            >
                               Load Model
                            </button>
                        </div>
                    </div>
                ))}
            </div>
         )}
      </div>

      {/* Reference Image Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
           <label className="block text-sm font-medium text-slate-300">
             Reference Images (Max 4)
           </label>
           
            {/* Reference Mode Toggle */}
            {referenceImages.length > 0 && (
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                    <button 
                        onClick={() => setReferenceMode('character')}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${referenceMode === 'character' ? 'bg-yellow-500 text-black' : 'text-slate-400 hover:text-white'}`}
                        title="Focus on Character Likeness"
                    >
                        Character
                    </button>
                    <button 
                        onClick={() => setReferenceMode('style')}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${referenceMode === 'style' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                         title="Focus on Art Style & Vibe"
                    >
                        Style
                    </button>
                    <button 
                        onClick={() => setReferenceMode('structure')}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${referenceMode === 'structure' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                         title="Focus on Composition & Structure"
                    >
                        Structure
                    </button>
                </div>
            )}
        </div>
        
        <div className="flex flex-wrap gap-4">
          {referenceImages.map((img, idx) => {
            // Calculate label and color for intensity
            let intensityLabel = "Strong";
            let labelColor = "text-yellow-500";
            if (img.intensity >= 0.9) { intensityLabel = "Dominant"; labelColor = "text-red-500"; }
            else if (img.intensity >= 0.7) { intensityLabel = "Strong"; labelColor = "text-orange-500"; }
            else if (img.intensity >= 0.4) { intensityLabel = "Moderate"; labelColor = "text-yellow-500"; }
            else { intensityLabel = "Subtle"; labelColor = "text-blue-400"; }

            return (
            <div key={idx} className="relative group w-36 rounded-lg overflow-hidden border border-slate-600 bg-slate-900 pb-1">
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
              
              <div className="p-2 space-y-2">
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
                 
                 {/* Enhanced Intensity Slider */}
                 <div>
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[8px] text-slate-400 font-bold uppercase">Influence</span>
                       <span className={`text-[8px] font-bold uppercase ${labelColor}`}>
                          {intensityLabel}
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
          )})}
          
          {referenceImages.length < 4 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-28 h-28 rounded-lg border-2 border-dashed border-slate-600 hover:border-yellow-500/50 hover:bg-slate-800 flex flex-col items-center justify-center text-slate-500 hover:text-yellow-500 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] font-medium">Add Image</span>
          </button>
          )}
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
                    <span className="block text-xs font-bold text-slate-400">What to Randomize (Check all that apply)</span>
                    <button 
                        onClick={applyPresetPoseSheet}
                        className="text-[10px] px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded border border-indigo-500 flex items-center gap-1"
                        title="Varies Pose/Camera but keeps everything else fixed"
                    >
                        <span>✨ Quick Preset: Pose Sheet</span>
                    </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {/* Identity Group */}
                    <div className="col-span-full text-[10px] text-slate-500 font-bold uppercase mt-1">Character Identity</div>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyGender} onChange={() => toggleBatchSetting('varyGender')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Gender</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyAge} onChange={() => toggleBatchSetting('varyAge')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Age</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyBody} onChange={() => toggleBatchSetting('varyBody')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Body Type</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varySkinTone} onChange={() => toggleBatchSetting('varySkinTone')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Skin Tone</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyEyeColor} onChange={() => toggleBatchSetting('varyEyeColor')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Eye Color</span>
                    </label>
                     <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyHair} onChange={() => toggleBatchSetting('varyHair')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Hair Style/Color</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyFacialHair} onChange={() => toggleBatchSetting('varyFacialHair')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Facial Hair</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyTattoos} onChange={() => toggleBatchSetting('varyTattoos')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Tattoos</span>
                    </label>

                     {/* State Group */}
                    <div className="col-span-full text-[10px] text-slate-500 font-bold uppercase mt-2">Pose & Attire</div>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyPose} onChange={() => toggleBatchSetting('varyPose')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Pose / Action</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyEmotion} onChange={() => toggleBatchSetting('varyEmotion')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Emotion</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyOutfit} onChange={() => toggleBatchSetting('varyOutfit')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Outfit</span>
                    </label>
                     <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyFootwear} onChange={() => toggleBatchSetting('varyFootwear')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Footwear</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varySkinTexture} onChange={() => toggleBatchSetting('varySkinTexture')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Skin Texture</span>
                    </label>

                     {/* Env Group */}
                    <div className="col-span-full text-[10px] text-slate-500 font-bold uppercase mt-2">Environment</div>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyLocation} onChange={() => toggleBatchSetting('varyLocation')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Location</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyWeather} onChange={() => toggleBatchSetting('varyWeather')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Weather</span>
                    </label>

                     {/* Camera Group */}
                    <div className="col-span-full text-[10px] text-slate-500 font-bold uppercase mt-2">Camera & Tech</div>
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                        <input type="checkbox" checked={batchSettings.varyFraming} onChange={() => toggleBatchSetting('varyFraming')} className="form-checkbox h-3.5 w-3.5 text-yellow-500 rounded border-slate-600 bg-slate-700 focus:ring-yellow-500" />
                        <span className="text-[11px] text-slate-300">Framing</span>
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