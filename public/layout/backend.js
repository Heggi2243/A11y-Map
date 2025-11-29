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