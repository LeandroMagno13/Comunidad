"use client";

import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: 'white' | 'gray' | 'dark' | 'accent';
}

const backgrounds = {
  white: 'bg-white',
  gray: 'bg-gray-50',
  dark: 'bg-gray-900 text-white',
  accent: 'bg-blue-50',
};

export default function Section({ children, className = '', id, background = 'white' }: SectionProps) {
  return (
    <section id={id} className={`${backgrounds[background]} py-16 sm:py-24 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}