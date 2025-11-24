
import React, { useState, useRef } from 'react';
import { generateVeoVideo, fileToBase64 } from '../services/geminiService';

interface VeoVideoModalProps {
  initialImage: string | null; // Data URL
  initialPrompt?: string;
  onClose: () => void;
}

export const VeoVideoModal: React.FC<VeoVideoModalProps> = ({ initialImage, initialPrompt, onClose }) => {
  const [image, setImage] = useState<string | null>(initialImage);
  const [prompt, setPrompt] = useState<string>(initialPrompt || "Cinematic, detailed movement, high quality.");
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Initializing...");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        // Create a proper data URL for display
        const mimeType = file.type || 'image/png';
        setImage(`data:${mimeType};base64,${base64}`);
        setVideoUrl(null); // Reset video if new image
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  };

  const handleGenerate = async () => {
    if (!image) return;

    // Check for API Key
    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        try {
          await window.aistudio.openSelectKey();
          if (!await window.aistudio.hasSelectedApiKey()) return;
        } catch (e) {
          console.error("Key selection failed", e);
          setError("Failed to select API Key. Billing is required for Veo.");
          return;
        }
    }

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatusMessage("Preparing upload...");

    try {
      // Extract base64 and mime type
      const parts = image.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const base64 = parts[1];

      const url = await generateVeoVideo(
        base64, 
        mimeType, 
        prompt, 
        aspectRatio,
        (status) => setStatusMessage(status)
      );
      
      if (url) {
        setVideoUrl(url);
      } else {
        setError("Failed to generate video.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during video generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-purple-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
             </div>
             <div>
                <h3 className="text-lg font-bold text-white">Veo Video Generator</h3>
                <p className="text-[10px] text-slate-400">Powered by veo-3.1-fast-generate-preview</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
           
           {/* Left: Input */}
           <div className="w-full lg:w-1/3 border-r border-slate-700 p-6 overflow-y-auto bg-slate-800/50">
              
              {/* Image Uploader */}
              <div className="mb-6">
                 <label className="block text-sm font-bold text-slate-300 mb-2">Source Image</label>
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-600 bg-slate-900 hover:border-purple-500 hover:bg-slate-800 transition-all cursor-pointer overflow-hidden flex items-center justify-center relative group"
                 >
                    {image ? (
                        <>
                           <img src={image} alt="Source" className="w-full h-full object-contain" />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white text-xs font-bold">Click to Change</span>
                           </div>
                        </>
                    ) : (
                        <div className="text-center text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">Click to Upload Image</span>
                        </div>
                    )}
                 </div>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleUpload}
                 />
              </div>

              {/* Controls */}
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Prompt</label>
                    <textarea 
                       value={prompt}
                       onChange={(e) => setPrompt(e.target.value)}
                       placeholder="Describe the motion..."
                       className="w-full h-24 bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-purple-500 outline-none resize-none"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Aspect Ratio</label>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setAspectRatio('16:9')}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold border ${aspectRatio === '16:9' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'}`}
                       >
                         16:9 Landscape
                       </button>
                       <button 
                         onClick={() => setAspectRatio('9:16')}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold border ${aspectRatio === '9:16' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'}`}
                       >
                         9:16 Portrait
                       </button>
                    </div>
                 </div>

                 <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !image}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                        isGenerating || !image
                        ? 'bg-slate-700 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/25'
                    }`}
                 >
                    {isGenerating ? 'Generating Video...' : 'Generate with Veo'}
                 </button>
                 
                 <p className="text-[10px] text-slate-500 text-center">
                    Note: Video generation can take 1-2 minutes.
                 </p>
              </div>
           </div>

           {/* Right: Output */}
           <div className="w-full lg:w-2/3 bg-black flex items-center justify-center relative p-8">
              {isGenerating ? (
                  <div className="text-center space-y-4">
                      <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <div>
                          <p className="text-purple-400 font-bold text-lg animate-pulse">{statusMessage}</p>
                          <p className="text-slate-500 text-xs mt-1">This uses Veo-3.1. Please wait.</p>
                      </div>
                  </div>
              ) : videoUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in">
                      <video 
                         controls 
                         autoPlay 
                         loop 
                         className="max-w-full max-h-[70vh] rounded-lg shadow-2xl border border-slate-800"
                         src={videoUrl}
                      />
                      <div className="mt-4 flex gap-4">
                         <a 
                           href={videoUrl} 
                           download="veo-video.mp4"
                           className="px-6 py-2 bg-slate-800 hover:bg-purple-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download MP4
                         </a>
                      </div>
                  </div>
              ) : error ? (
                  <div className="max-w-md text-center p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-white font-bold mb-2">Generation Failed</h3>
                      <p className="text-red-300 text-sm">{error}</p>
                  </div>
              ) : (
                  <div className="text-center opacity-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-400 font-medium">Video Preview Area</p>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
