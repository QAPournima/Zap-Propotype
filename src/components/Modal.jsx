import React from 'react';

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 w-full ${width} border border-neutral-200 dark:border-neutral-700 text-gray-900 dark:text-gray-100 relative`}>
        <div className="flex justify-between items-center mb-4">
          {title && <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>}
          <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl absolute top-4 right-4" onClick={onClose}>&times;</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
} 