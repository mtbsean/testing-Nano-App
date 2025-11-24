
import React, { useState, useRef, useEffect } from 'react';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (newImageUrl: string) => void;
  onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters' | 'crop'>('adjust');
  
  // Adjustment State
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [blur, setBlur] = useState(0);

  // Crop State
  const [cropRatio, setCropRatio] = useState<number | null>(null); // null = original

  // Load image
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObj(img);
    };
  }, [imageUrl]);

  useEffect(() => {
    drawCanvas();
  }, [imageObj, brightness, contrast, saturation, sepia, grayscale, blur, cropRatio]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions based on crop
    let drawWidth = imageObj.width;
    let drawHeight = imageObj.height;
    let offsetX = 0;
    let offsetY = 0;

    if (cropRatio) {
      // Determine crop dimensions keeping the image centered
      const imgRatio = imageObj.width / imageObj.height;
      
      if (imgRatio > cropRatio) {
        // Image is wider than crop box -> Limit width
        drawWidth = imageObj.height * cropRatio;
        drawHeight = imageObj.height;
        offsetX = (imageObj.width - drawWidth) / 2;
        offsetY = 0;
      } else {
        // Image is taller than crop box -> Limit height
        drawWidth = imageObj.width;
        drawHeight = imageObj.width / cropRatio;
        offsetX = 0;
        offsetY = (imageObj.height - drawHeight) / 2;
      }
    }

    // Set canvas size to the *output* size
    canvas.width = drawWidth;
    canvas.height = drawHeight;

    // Apply filters
    const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%) blur(${blur}px)`;
    ctx.filter = filterString;

    // Draw the image
    // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    ctx.drawImage(
      imageObj, 
      offsetX, offsetY, drawWidth, drawHeight, // Source crop
      0, 0, drawWidth, drawHeight // Destination
    );
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const newUrl = canvas.toDataURL('image/png');
      onSave(newUrl);
    }
  };

  const applyPreset = (preset: string) => {
    // Reset defaults first
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSepia(0);
    setGrayscale(0);
    setBlur(0);

    switch (preset) {
      case 'bw':
        setGrayscale(100);
        setContrast(120);
        break;
      case 'sepia':
        setSepia(100);
        setBrightness(90);
        break;
      case 'vintage':
        setSepia(50);
        setContrast(85);
        setBrightness(110);
        setSaturation(80);
        break;
      case 'cyber':
        setContrast(130);
        setSaturation(150);
        break;
      case 'soft':
        setBrightness(110);
        setContrast(90);
        setBlur(0.5);
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Image
          </h3>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400">Save Changes</button>
          </div>
        </div>

        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-grow bg-slate-950 flex items-center justify-center p-8 overflow-auto relative bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC.25vj0lAAAAFxlEQVQ4T2N4/frrfwY0wIiMj6aQAQAq6d5705p2mAAAAABJRU5ErkJggg==')]">
            <canvas ref={canvasRef} className="max-w-full max-h-full shadow-2xl border border-slate-700" />
          </div>

          {/* Controls Sidebar */}
          <div className="w-full lg:w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              <button 
                onClick={() => setActiveTab('adjust')} 
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'adjust' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-slate-700/50' : 'text-slate-400 hover:text-white'}`}
              >
                Adjust
              </button>
              <button 
                onClick={() => setActiveTab('filters')} 
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'filters' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-slate-700/50' : 'text-slate-400 hover:text-white'}`}
              >
                Filters
              </button>
              <button 
                onClick={() => setActiveTab('crop')} 
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'crop' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-slate-700/50' : 'text-slate-400 hover:text-white'}`}
              >
                Crop
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              
              {/* Adjust Tab */}
              {activeTab === 'adjust' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-slate-300 uppercase font-bold">Brightness</label>
                      <span className="text-xs text-slate-500">{brightness}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-yellow-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"/>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-slate-300 uppercase font-bold">Contrast</label>
                      <span className="text-xs text-slate-500">{contrast}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-yellow-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"/>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-slate-300 uppercase font-bold">Saturation</label>
                      <span className="text-xs text-slate-500">{saturation}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full accent-yellow-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"/>
                  </div>
                   <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs text-slate-300 uppercase font-bold">Blur</label>
                      <span className="text-xs text-slate-500">{blur}px</span>
                    </div>
                    <input type="range" min="0" max="10" step="0.5" value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full accent-yellow-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"/>
                  </div>
                  
                  <button onClick={() => applyPreset('reset')} className="w-full py-2 text-xs text-slate-400 border border-slate-600 rounded hover:bg-slate-700">Reset Adjustments</button>
                </div>
              )}

              {/* Filters Tab */}
              {activeTab === 'filters' && (
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => applyPreset('reset')} className="p-3 bg-slate-700 rounded-lg text-sm text-white hover:bg-slate-600">Normal</button>
                   <button onClick={() => applyPreset('bw')} className="p-3 bg-slate-700 rounded-lg text-sm text-white hover:bg-slate-600 grayscale">B&W</button>
                   <button onClick={() => applyPreset('sepia')} className="p-3 bg-slate-700 rounded-lg text-sm text-white hover:bg-slate-600 sepia">Sepia</button>
                   <button onClick={() => applyPreset('vintage')} className="p-3 bg-slate-700 rounded-lg text-sm text-white hover:bg-slate-600 text-yellow-200">Vintage</button>
                   <button onClick={() => applyPreset('cyber')} className="p-3 bg-slate-700 rounded-lg text-sm text-white hover:bg-slate-600 text-cyan-300 font-bold">Cyber</button>
                   <button onClick={() => applyPreset('soft')} className="p-3 bg-slate-700 rounded-lg text-sm text-white hover:bg-slate-600 opacity-80">Soft</button>
                </div>
              )}

              {/* Crop Tab */}
              {activeTab === 'crop' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Select an aspect ratio to center-crop the image.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setCropRatio(null)} 
                      className={`p-3 rounded-lg text-sm border ${cropRatio === null ? 'border-yellow-500 text-yellow-500 bg-slate-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                    >
                      Original
                    </button>
                    <button 
                      onClick={() => setCropRatio(1)} 
                      className={`p-3 rounded-lg text-sm border ${cropRatio === 1 ? 'border-yellow-500 text-yellow-500 bg-slate-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                    >
                      1:1 Square
                    </button>
                    <button 
                      onClick={() => setCropRatio(16/9)} 
                      className={`p-3 rounded-lg text-sm border ${cropRatio === 16/9 ? 'border-yellow-500 text-yellow-500 bg-slate-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                    >
                      16:9 Landscape
                    </button>
                    <button 
                      onClick={() => setCropRatio(4/3)} 
                      className={`p-3 rounded-lg text-sm border ${cropRatio === 4/3 ? 'border-yellow-500 text-yellow-500 bg-slate-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                    >
                      4:3 Standard
                    </button>
                    <button 
                      onClick={() => setCropRatio(9/16)} 
                      className={`p-3 rounded-lg text-sm border ${cropRatio === 9/16 ? 'border-yellow-500 text-yellow-500 bg-slate-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                    >
                      9:16 Story
                    </button>
                    <button 
                      onClick={() => setCropRatio(3/4)} 
                      className={`p-3 rounded-lg text-sm border ${cropRatio === 3/4 ? 'border-yellow-500 text-yellow-500 bg-slate-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                    >
                      3:4 Portrait
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
