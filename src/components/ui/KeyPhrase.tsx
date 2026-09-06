"use client";

import React from 'react';

interface KeyPhraseProps {
  text: string;
  className?: string;
  variant?: 'center' | 'left' | 'blockquote';
}

export default function KeyPhrase({ text, className = '', variant = 'center' }: KeyPhraseProps) {
  const variants = {
    center: 'text-center text-2xl sm:text-3xl font-semibold italic my-8 px-4',
    left: 'text-left text-xl font-semibold italic my-6 px-4 border-l-4 border-blue-500 pl-6',
    blockquote: 'text-center text-xl sm:text-2xl font-medium my-8 px-4 text-gray-700 bg-gray-50 py-6 rounded-lg border border-gray-200',
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      {text}
    </div>
  );
}