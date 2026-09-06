"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface ProfessionalCardProps {
  category: string;
  icon: string;
  description: string;
  whyNeeded: string;
  questions: string[];
  projects: string[];
  href: string;
}

export default function ProfessionalCard({ 
  category, 
  icon, 
  description, 
  whyNeeded, 
  questions, 
  projects, 
  href 
}: ProfessionalCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-300">
      <div className={`p-6 cursor-pointer ${expanded ? 'bg-gray-50' : ''}`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gray-100`}>
            <span className="text-3xl">{icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{category}</h3>
            <p className="text-gray-600 mt-1 line-clamp-2">{description}</p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Ocultar' : 'Ver detalle'} {' '}
            <span className="transform transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-6 space-y-6 animate-slideDown">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">¿Por qué te necesitamos?</h4>
            <p className="text-gray-700">{whyNeeded}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Preguntas que necesitamos resolver</h4>
            <ul className="space-y-2">
              {questions.map((q, i) => (
                <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Proyectos donde podrías participar</h4>
            <ul className="space-y-2">
              {projects.map((p, i) => (
                <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                  <span className="text-green-500">▸</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={href}
            className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center w-full"
          >
            QUIERO CONTRIBUIR DESDE {category.toUpperCase()}
          </Link>
        </div>
      )}
    </div>
  );
}