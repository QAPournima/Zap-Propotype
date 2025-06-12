import React from 'react';

const ScrollingMessage = () => {
  return (
    <div className="bg-blue-600 text-white py-3 px-2 overflow-hidden whitespace-nowrap z-50 relative shadow-lg" style={{ minHeight: '44px' }}>
      <div className="animate-scroll inline-block text-lg font-extrabold tracking-wide drop-shadow-md">
        <span className="font-black">Zap⚡️ Prototype Now Live!</span>
        <span className="mx-4 font-bold">|</span>
        <span className="font-semibold">This is an early prototype of the Zap⚡️ tool. Stay tuned for the official product launch!</span>
        <span className="mx-4 font-bold">|</span>
        <span className="font-semibold">For more details or inquiries, feel free to contact us.</span>
      </div>
    </div>
  );
};

export default ScrollingMessage; 
