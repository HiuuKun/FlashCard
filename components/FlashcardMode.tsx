
import React, { useState, useEffect } from 'react';
import { Section, Card } from '../types';
import { CheckIcon, XMarkIcon, ChevronLeftIcon } from './Icons';

interface FlashcardModeProps {
  section: Section;
  onClose: () => void;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ section, onClose }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [forgotten, setForgotten] = useState<Card[]>([]);
  const [remembered, setRemembered] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setCards([...section.cards].sort(() => Math.random() - 0.5));
  }, [section]);

  const handleResponse = (isCorrect: boolean) => {
    if (!isCorrect) {
      setForgotten(prev => [...prev, cards[index]]);
    } else {
      setRemembered(prev => prev + 1);
    }

    if (index < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setIndex(prev => prev + 1), 150);
    } else {
      setIsDone(true);
    }
  };

  const handleBack = () => {
    if (index > 0) {
      setIsFlipped(false);
      setIndex(prev => prev - 1);
    }
  };

  const restartWithForgotten = () => {
    setCards([...forgotten].sort(() => Math.random() - 0.5));
    setForgotten([]);
    setRemembered(0);
    setIndex(0);
    setIsFlipped(false);
    setIsDone(false);
  };

  if (cards.length === 0) return null;

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto mt-10">
        <h2 className="text-3xl font-black text-black mb-6 uppercase">Session End</h2>
        <div className="flex gap-12 mb-10 text-black">
          <div className="text-center">
            <p className="text-5xl font-black">{remembered}</p>
            <p className="text-xs font-black uppercase mt-2">Mastered</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-black">{forgotten.length}</p>
            <p className="text-xs font-black uppercase mt-2">Review</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="px-6 py-3 border-2 border-black text-black rounded-xl font-black hover:bg-slate-100 transition-all uppercase">Back Home</button>
          {forgotten.length > 0 && (
            <button onClick={restartWithForgotten} className="px-6 py-3 bg-black text-white rounded-xl font-black border-2 border-black hover:bg-white hover:text-black transition-all uppercase">Review Missed</button>
          )}
        </div>
      </div>
    );
  }

  const current = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="mb-10 text-black">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-black uppercase">Progress</span>
          <span className="text-sm font-black">{index + 1} / {cards.length}</span>
        </div>
        <div className="w-full bg-slate-100 border border-black h-3 rounded-full overflow-hidden">
          <div className="bg-black h-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="perspective-1000 h-80 mb-12">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          <div className="absolute inset-0 bg-white border-2 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-8 backface-hidden text-black">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Vocabulary</span>
            <h3 className="text-4xl font-black text-center">{current.vocab}</h3>
            <p className="mt-12 text-xs font-black border-b border-black uppercase">Click to Reveal</p>
          </div>
          <div className="absolute inset-0 bg-white border-2 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 text-black">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Meaning</span>
            <p className="text-2xl text-center font-black leading-relaxed">{current.meaning}</p>
          </div>
        </div>
      </div>

      <div className="relative flex justify-center gap-12 text-black">
        <button onClick={() => handleResponse(false)} className="group flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full border-2 border-black bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <XMarkIcon className="w-8 h-8" />
          </div>
          <span className="text-xs font-black uppercase">Forgot</span>
        </button>
        <button onClick={() => handleResponse(true)} className="group flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full border-2 border-black bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CheckIcon className="w-8 h-8" />
          </div>
          <span className="text-xs font-black uppercase">Got it</span>
        </button>
        {index > 0 && (
          <button onClick={handleBack} className="group flex flex-col items-center gap-3 absolute right-0">
            <div className="w-16 h-16 rounded-full border-2 border-black bg-white text-black flex items-center justify-center hover:bg-slate-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <ChevronLeftIcon className="w-8 h-8" />
            </div>
            <span className="text-xs font-black uppercase">Back</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashcardMode;
