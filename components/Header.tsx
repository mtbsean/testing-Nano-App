import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436-3.118 2.428-7.169 3.814-11.528 3.814-.528 0-1.047-.02-1.556-.06a14.954 14.954 0 00-2.002 4.67.75.75 0 01-1.426-.482 16.48 16.48 0 012.394-5.5 16.48 16.48 0 01-1.48-6.194.75.75 0 011.5.063c.038.995.176 1.964.407 2.895 2.124-.863 4.463-1.341 6.903-1.341 2.373 0 4.652.456 6.726 1.282A15.045 15.045 0 009.315 7.584z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Nano<span className="text-yellow-400">Banana</span> Studio</span>
          </div>
          <div className="text-sm text-slate-400 hidden sm:block">
            Powered by gemini-2.5-flash-image
          </div>
        </div>
      </div>
    </header>
  );
};