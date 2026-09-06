"use client";

import React from 'react';
import Link from 'next/link';

interface CTAButton {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface CTASectionProps {
  title: string;
  subtitle?: string;
  buttons: CTAButton[];
  className?: string;
}

const buttonStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-900 text-white hover:bg-gray-800',
  outline: 'border-2 border-gray-700 text-gray-900 hover:bg-gray-100',
};

export default function CTASection({ title, subtitle, buttons, className = '' }: CTASectionProps) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
      {subtitle && (
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">{subtitle}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
        {buttons.map((btn, index) => (
          <Link
            key={index}
            href={btn.href}
            className={`px-8 py-3 rounded-lg font-medium text-center transition-colors ${buttonStyles[btn.variant || 'primary']}`}
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </div>
  );
}