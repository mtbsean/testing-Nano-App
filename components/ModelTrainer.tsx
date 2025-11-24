import React, { useState, useRef } from 'react';
import { fileToBase64 } from '../services/geminiService';
import { CustomModel } from '../types';

interface ModelTrainerProps {
  onSave: (model: CustomModel) => void;
  onCancel: () => void;
  initialImages?: {base64: string, mimeType: string, preview: string}[];
}

export const ModelTrainer: React.FC<ModelTrainerProps> = ({ onSave, onCancel, initialImages = [] }) => {
  const [name, setName] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [type, setType] = useState<'Character' | 'Style'>('Character');
  const [images, setImages] = useState<{base64: string, mimeType: string, preview: string}[]>(initialImages);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = [];
      // Limit to 10 images max total
      const remainingSlots = 10 - images.length;
      // Explicitly cast to File[] to ensure correct type inference for iteration
      const filesToProcess = Array.from(e.target.files).slice(0, remainingSlots) as File[];

      for (const file of filesToProcess) {
        try {
          const base64 = await fileToBase64(file);
          newImages.push({
            base64,
            mimeType: file.type,
            preview: URL.createObjectURL(file)
          });
        } catch (err) {
          console.error(err);
        }
      }
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleTrain = async () => {
    if (!name || !triggerWord || images.length === 0) return;

    setIsTraining(true);
    setProgress(0);

    // Simulate training process visuals
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
       setProgress(i * 10);
       await new Promise(r => setTimeout(r, 150)); // Fake delay
    }

    const newModel: CustomModel = {
      id: Date.now().toString(),
      name,
      triggerWord,
      type,
      thumbnail: images[0].base64, // Use first image as thumbnail
      images: images.map(img => ({ base64: img.base64, mimeType: img.mimeType })),
      timestamp: Date.now()
    };

    onSave(newModel);
    setIsTraining(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <div className="p-1.5 bg-indigo-600 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
             </div>
             Train Custom Model (LoRA)
           </h3>
           <button onClick={onCancel} disabled={isTraining} className="text-slate-400 hover:text-white">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
           
           {/* Form */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Model Name</label>
                 <input 
                   type="text" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   placeholder="e.g. Cyber Samurai, Neo-Noir Style"
                   className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                 />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Trigger Word</label>
                 <input 
                   type="text" 
                   value={triggerWord}
                   onChange={(e) => setTriggerWord(e.target.value)}
                   placeholder="e.g. cyb_sam, neon_noir"
                   className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                 />
              </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Model Type</label>
              <div className="flex gap-4">
                 <label className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all ${type === 'Character' ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}>
                    <input type="radio" name="type" className="hidden" checked={type === 'Character'} onChange={() => setType('Character')} />
                    <div className="font-bold text-sm text-white mb-1">Character</div>
                    <div className="text-xs text-slate-400">Train specific face, body type, or outfit consistency.</div>
                 </label>
                 <label className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all ${type === 'Style' ? 'bg-purple-900/40 border-purple-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}>
                    <input type="radio" name="type" className="hidden" checked={type === 'Style'} onChange={() => setType('Style')} />
                    <div className="font-bold text-sm text-white mb-1">Art Style</div>
                    <div className="text-xs text-slate-400">Train color palette, brushwork, and aesthetic.</div>
                 </label>
              </div>
           </div>

           {/* Image Upload */}
           <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Training Data (Images)</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-2">
                 {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-600 group">
                       <img src={img.preview} alt="train" className="w-full h-full object-cover" />
                       <button 
                         onClick={() => removeImage(idx)}
                         className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                         </svg>
                       </button>
                    </div>
                 ))}
                 {images.length < 10 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video rounded-lg border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-800 transition-colors flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-[9px]">Add Image</span>
                    </button>
                 )}
              </div>
              <p className="text-[10px] text-slate-500">Upload 5-10 images for best results. Supported: JPG, PNG.</p>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFiles} />
           </div>

           {/* Progress Bar */}
           {isTraining && (
              <div className="space-y-1">
                 <div className="flex justify-between text-xs font-bold">
                    <span className="text-indigo-400">Training Model...</span>
                    <span className="text-white">{progress}%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    ></div>
                 </div>
              </div>
           )}

        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end gap-3">
           <button 
             onClick={onCancel}
             disabled={isTraining}
             className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={handleTrain}
             disabled={isTraining || !name || images.length === 0}
             className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all ${
                isTraining || !name || images.length === 0
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25'
             }`}
           >
             {isTraining ? 'Training...' : 'Train Model'}
           </button>
        </div>

      </div>
    </div>
  );
};