import React from 'react';
import { CheckerFooter } from './components/CheckerFooter';
import { Sunburst } from './components/Sunburst';
import { LoginForm } from './components/LoginForm';

// Note: In a real app, ensure these images exist in your /public folder.
// For this demo, we assume standard placeholders if they are missing, but since
// you provided specific images (cat/dog), you should replace these src attributes
// with your local file paths if they differ.
const CAT_IMAGE_URL = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f408.svg"; // Fallback black cat style
const DOG_IMAGE_URL = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f415.svg"; // Fallback dog style

// Since we need to mimic the provided images specifically (the black blob cat and the spotted dog),
// I will render them as generic placeholders that *you* should replace with your actual assets
// for the perfect look. 
// Below I'm using a workaround to style them to look closer to the "blob" aesthetic of the prompt 
// if real images aren't loaded, but primarily assuming you will drop your files in.

export default function App() {
  return (
    <div className="min-h-screen w-full bg-paper relative overflow-hidden flex flex-col items-center justify-center selection:bg-[#fcd34d] selection:text-[#1e40af]">
      
      {/* Background Elements */}
      <Sunburst className="absolute -right-20 top-20 w-64 h-64 md:w-96 md:h-96 text-amber-300 opacity-80 z-0" />
      
      {/* Main Content Wrapper */}
      <main className="relative z-10 w-full max-w-2xl flex flex-col items-center mb-20">
        
        {/* Title Section */}
        <div className="text-center mb-2 relative">
           {/* The Cat Decoration - Sitting on the text */}
          <div className="absolute -top-16 -left-4 md:-left-16 w-24 h-24 md:w-32 md:h-32 z-20 animate-bounce-slow">
             {/* 
                REPLACE src below with your uploaded cat image 
                Example: src="/assets/cat.png"
             */}
             <img 
               src="https://illustrations.popsy.co/amber/surr-cat.svg" 
               alt="Black Cat Decoration" 
               className="w-full h-full object-contain drop-shadow-xl transform -rotate-12"
             />
          </div>

          <h1 className="font-titan text-[#1e40af] text-[5rem] md:text-[8rem] leading-[0.8] tracking-tighter drop-shadow-sm">
            <div>LOGIN</div>
            <div>PAGE</div>
          </h1>
        </div>

        {/* Form Section */}
        <LoginForm />
        
      </main>

      {/* Footer / Bottom Section */}
      <div className="absolute bottom-0 w-full">
        {/* The Dog Decoration - Running on the checkers */}
        <div className="absolute bottom-20 right-10 md:right-1/4 w-28 h-28 md:w-40 md:h-40 z-20 animate-wiggle">
             {/* 
                REPLACE src below with your uploaded dog image 
                Example: src="/assets/dog.png"
             */}
            <img 
               src="https://illustrations.popsy.co/amber/surr-dog.svg" 
               alt="Running Dog Decoration" 
               className="w-full h-full object-contain drop-shadow-xl transform scale-x-[-1]"
             />
        </div>

        <CheckerFooter />
      </div>
      
      {/* Additional custom styles for animations that Tailwind doesn't have by default */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg) scaleX(-1); }
          50% { transform: rotate(3deg) scaleX(-1); }
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0) rotate(-12deg); }
            50% { transform: translateY(-10px) rotate(-12deg); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
