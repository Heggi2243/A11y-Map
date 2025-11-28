export function createSun() {
  return `
  <div class="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 overflow-hidden pointer-events-none z-0">
      <svg
        viewBox="0 0 100 100"
        class="w-full h-full text-amber-400 animate-[spin_10s_linear_infinite]"
        fill="currentColor"
      >
        <path d="M50 50 L50 0 L60 0 Z" />
        <path d="M50 50 L75 6.7 L82 14 Z" />
        <path d="M50 50 L93.3 25 L97 35 Z" />
        <path d="M50 50 L100 50 L100 60 Z" />
        <path d="M50 50 L93.3 75 L86 82 Z" />
        <path d="M50 50 L75 93.3 L65 97 Z" />
        <path d="M50 50 L50 100 L40 100 Z" />
        <path d="M50 50 L25 93.3 L18 86 Z" />
        <path d="M50 50 L6.7 75 L3 65 Z" />
        <path d="M50 50 L0 50 L0 40 Z" />
        <path d="M50 50 L6.7 25 L14 18 Z" />
        <path d="M50 50 L25 6.7 L35 3 Z" />
      </svg>
    </div>
  `;
}

// footer
export function createFooter() {
  return `
    
    <footer class="relative mt-auto">
      <!-- Checkerboard Pattern -->
      <div class="w-full h-16 sm:h-24 flex flex-col overflow-hidden mt-12 border-t-4 border-retro-blue relative">
        <!-- Row 1 -->
        <div class="flex w-full h-1/2 overflow-hidden">
          ${Array(30).fill(null).map((_, i) => `
            <div class="h-full flex-shrink-0 w-12 sm:w-16 ${i % 2 === 0 ? 'bg-retro-blue' : 'bg-white'}"></div>
          `).join('')}
        </div>
        
        <!-- Row 2 (Staggered) -->
        <div class="flex w-full h-1/2 overflow-hidden">
          ${Array(30).fill(null).map((_, i) => `
            <div class="h-full flex-shrink-0 w-12 sm:w-16 ${i % 2 === 0 ? 'bg-white' : 'bg-retro-blue'}"></div>
          `).join('')}
        </div>
        
        <!-- Texture Overlay -->
        <div class="w-full h-full absolute top-0 left-0 pointer-events-none opacity-20" 
             style="background-image: url('https://www.transparenttextures.com/patterns/canvas-orange.png')">
        </div>
      </div>
              <!-- Footer Text -->
      <div class="bg-retro-blue text-white text-center py-4 font-display text-sm tracking-wider">
        暢行無阻 A11y-Map © 2025
      </div>
      
    </footer>
  `;
}