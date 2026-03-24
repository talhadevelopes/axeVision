import React from 'react';

export function HeroSection() {
  return (
    <section className="py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Welcome to axeVision
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Monitor website changes, capture snapshots, and analyze accessibility with AI.
      </p>
      <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Get Started
      </button>
    </section>
  );
}