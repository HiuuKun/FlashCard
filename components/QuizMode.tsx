
import React, { useState, useEffect, useRef } from 'react';
import { Section, Card } from '../types';
import { CheckIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface QuizModeProps {
  section: Section;
  onClose: () => void;
}

interface Question {
  id: string; // Session-unique ID for the question instance
  card: Card;
  options: string[];
}

const QuizMode: React.FC<QuizModeProps> = ({ section, onClose }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isDone, setIsDone] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to top when test ends
  useEffect(() => {
    if (isDone) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isDone]);

  useEffect(() => {
    const allMeanings = section.cards.map(c => c.meaning);
    
    // Generate questions with session-unique IDs to prevent collisions
    const qs = section.cards.map((card, idx) => {
      let distractors = allMeanings
        .filter(m => m !== card.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      // Fallback if not enough meanings exist in the section
      while (distractors.length < 3) {
        distractors.push(`Definition ${distractors.length + 1}`);
      }

      const options = [...distractors, card.meaning].sort(() => Math.random() - 0.5);
      
      return { 
        id: `q-${idx}-${crypto.randomUUID().slice(0, 8)}`, 
        card, 
        options 
      };
    });

    // Shuffle questions once at start
    setQuestions(qs.sort(() => Math.random() - 0.5));
  }, [section]);

  const handleSelect = (questionId: string, option: string) => {
    if (isDone) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const scrollToQuestion = (idx: number) => {
    questionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.card.meaning) score++;
    });
    return score;
  };

  const handleEndTest = () => {
    // Immediate action, no confirmation dialog
    setIsDone(true);
  };

  if (questions.length === 0) return null;

  // The main view (either active quiz or graded review)
  return (
    <div className="flex min-h-[calc(100vh-100px)] relative">
      {/* Main Content Area - Fixed width container to prevent movement when sidebar toggles */}
      <div className="flex-grow px-4 py-10 max-w-4xl mx-auto w-full relative z-0">
        
        {isDone && (
          <div className="bg-white p-10 rounded-3xl border-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-4xl font-black text-black mb-2 uppercase italic tracking-tighter">Quiz Results</h2>
            <div className="text-8xl font-black text-sky-500 my-6 drop-shadow-md">
              {Math.round((calculateScore() / questions.length) * 100)}%
            </div>
            <p className="text-black mb-8 font-black uppercase tracking-widest text-lg border-y-2 border-black py-4 inline-block px-10">
              Score: {calculateScore()} / {questions.length}
            </p>
            <div className="flex justify-center">
              <button 
                onClick={onClose} 
                className="px-12 py-4 bg-black text-white rounded-xl font-black border-2 border-black hover:bg-sky-500 hover:text-white transition-all uppercase text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Finish & Go Home
              </button>
            </div>
          </div>
        )}

        <div className="mb-10 text-black">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">
              {isDone ? "Review Test" : "Multiple Choice Test"}
            </h2>
            <p className="font-medium text-slate-500 uppercase text-xs tracking-widest">
              {isDone ? "See where you can improve" : "Select the correct definition for each term"}
            </p>
        </div>

        <div className="space-y-12 pb-32">
          {questions.map((q, idx) => {
            const userChoice = userAnswers[q.id];
            const isCorrect = userChoice === q.card.meaning;
            
            return (
              <div 
                key={q.id} 
                ref={el => { questionRefs.current[idx] = el; }}
                className={`bg-white p-8 rounded-3xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all
                  ${isDone ? (isCorrect ? 'ring-4 ring-green-100 border-green-500 shadow-none' : 'ring-4 ring-red-100 border-red-500 shadow-none') : ''}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-xs font-black uppercase px-3 py-1 rounded-full text-white
                    ${isDone ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : 'bg-black'}`}>
                    Q{idx + 1}
                  </span>
                  {isDone && (
                    <span className={`text-[10px] font-black uppercase ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  )}
                  {!isDone && userAnswers[q.id] && (
                     <span className="text-[10px] font-black uppercase text-sky-500">Answered</span>
                  )}
                </div>

                {/* Removed 'uppercase' from the vocabulary title */}
                <h3 className="text-3xl font-black text-black mb-8">{q.card.vocab}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, i) => {
                    const isSelected = userAnswers[q.id] === opt;
                    const isTheCorrectAnswer = opt === q.card.meaning;
                    
                    let buttonClass = "border-black bg-white text-black hover:bg-sky-50";
                    let icon = null;

                    if (isDone) {
                      if (isTheCorrectAnswer) {
                        buttonClass = "border-green-600 bg-green-50 text-green-700 shadow-[2px_2px_0px_0px_rgba(22,163,74,1)]";
                        icon = <CheckIcon className="w-5 h-5 flex-shrink-0 text-green-600" />;
                      } else if (isSelected && !isTheCorrectAnswer) {
                        buttonClass = "border-red-600 bg-red-50 text-red-700 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]";
                        icon = <XMarkIcon className="w-5 h-5 flex-shrink-0 text-red-600" />;
                      } else {
                        buttonClass = "border-slate-200 bg-white text-slate-300 opacity-50";
                      }
                    } else if (isSelected) {
                      buttonClass = "border-black bg-sky-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-1";
                      icon = <CheckIcon className="w-5 h-5 flex-shrink-0 text-white" />;
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isDone}
                        onClick={() => handleSelect(q.id, opt)}
                        /* Removed 'uppercase' from the options buttons */
                        className={`p-5 rounded-xl border-2 text-left font-bold transition-all duration-200 text-sm flex items-center justify-between ${buttonClass}`}
                      >
                        <span className="pr-4">{opt}</span>
                        {icon}
                      </button>
                    );
                  })}
                </div>

                {isDone && !isCorrect && (
                  <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-[10px] font-black uppercase text-red-500 mb-1">Feedback</p>
                    <p className="text-sm font-medium text-black italic">
                      The correct definition of <span className="font-black">"{q.card.vocab}"</span> is: <span className="font-black text-green-600">"{q.card.meaning}"</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Navigation Bar - Overlay style using 'fixed' to avoid shifting the quiz content */}
      {!isDone && (
        <div 
          className={`fixed top-24 right-0 h-[calc(100vh-96px)] bg-white border-l-2 border-black shadow-[-10px_0px_30px_0px_rgba(0,0,0,0.1)] transition-transform duration-300 z-50 
            ${isSidebarOpen ? 'translate-x-0 w-64' : 'translate-x-full w-64'}`}
        >
          {/* Toggle Tab physically attached to the sidebar edge */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -left-10 top-1/2 -translate-y-1/2 w-10 h-24 bg-white border-2 border-black border-r-0 rounded-l-2xl flex flex-col items-center justify-center shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:bg-sky-500 hover:text-white transition-all group"
          >
            {isSidebarOpen ? (
              <ChevronRightIcon className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
            ) : (
              <ChevronLeftIcon className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
            )}
          </button>

          <div className="p-6 h-full flex flex-col">
            <h4 className="font-black uppercase text-xs tracking-widest mb-6 text-black border-b-2 border-black pb-2">Jump to</h4>
            <div className="flex-grow overflow-y-auto grid grid-cols-4 gap-2 content-start pr-2 custom-scrollbar">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => scrollToQuestion(idx)}
                  className={`w-full aspect-square border-2 border-black rounded-lg flex items-center justify-center font-black text-xs transition-all
                    ${userAnswers[q.id] ? 'bg-sky-500 text-white' : 'bg-white text-black hover:bg-sky-100'}`}
                >
                  <span className={userAnswers[q.id] ? 'text-white' : 'text-black'}>{idx + 1}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t-2 border-black space-y-3">
               <div className="text-xs font-black uppercase text-black flex justify-between">
                  <span>Completed</span>
                  <span>{Object.keys(userAnswers).length} / {questions.length}</span>
               </div>
               <button 
                 type="button"
                 onClick={handleEndTest}
                 className="w-full py-4 bg-black text-white rounded-xl font-black border-2 border-black hover:bg-sky-500 hover:text-white transition-all uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
               >
                  <span className="text-white">End Test</span>
               </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #000;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default QuizMode;
