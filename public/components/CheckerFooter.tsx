import React from 'react';

export const CheckerFooter: React.FC = () => {
  return (
    <div className="w-full h-24 sm:h-32 overflow-hidden absolute bottom-0 left-0 -z-0">
      <div 
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #1e40af 25%, transparent 25%), 
            linear-gradient(-45deg, #1e40af 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #1e40af 75%), 
            linear-gradient(-45deg, transparent 75%, #1e40af 75%)
          `,
          backgroundPosition: '0 0, 0 25px, 25px -25px, -25px 0px',
          backgroundSize: '50px 50px',
          opacity: 0.9
        }}
      />
    </div>
  );
};