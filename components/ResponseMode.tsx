
import React, { useState, useEffect } from 'react';
import { Section, Card } from '../types';
import { CheckIcon, XMarkIcon, ChevronLeftIcon } from './Icons';

interface ResponseModeProps {
    section: Section;
    onClose: () => void;
}

const ResponseMode: React.FC<ResponseModeProps> = ({ section, onClose }) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [index, setIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [incorrect, setIncorrect] = useState<Card[]>([]);
    const [correct, setCorrect] = useState(0);
    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
        setCards([...section.cards].sort(() => Math.random() - 0.5));
    }, [section]);

    const normalizeString = (str: string) => {
        return str.toLowerCase().trim().replace(/\s+/g, ' ');
    };

    const checkAnswer = () => {
        const currentCard = cards[index];
        const userAnswer = normalizeString(userInput);
        const correctAnswer = normalizeString(currentCard.vocab);

        const correct = userAnswer === correctAnswer;
        setIsCorrect(correct);
        setShowFeedback(true);

        if (!correct) {
            setIncorrect(prev => [...prev, currentCard]);
        } else {
            setCorrect(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (index < cards.length - 1) {
            setShowFeedback(false);
            setUserInput('');
            setIndex(prev => prev + 1);
        } else {
            setIsDone(true);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (!showFeedback) {
                checkAnswer();
            } else {
                handleNext();
            }
        }
    };

    const restartWithIncorrect = () => {
        setCards([...incorrect].sort(() => Math.random() - 0.5));
        setIncorrect([]);
        setCorrect(0);
        setIndex(0);
        setUserInput('');
        setShowFeedback(false);
        setIsDone(false);
    };

    if (cards.length === 0) return null;

    if (isDone) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto mt-10">
                <h2 className="text-3xl font-black text-black mb-6 uppercase">Session End</h2>
                <div className="flex gap-12 mb-10 text-black">
                    <div className="text-center">
                        <p className="text-5xl font-black">{correct}</p>
                        <p className="text-xs font-black uppercase mt-2">Correct</p>
                    </div>
                    <div className="text-center">
                        <p className="text-5xl font-black">{incorrect.length}</p>
                        <p className="text-xs font-black uppercase mt-2">Incorrect</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-6 py-3 border-2 border-black text-black rounded-xl font-black hover:bg-slate-100 transition-all uppercase">Back Home</button>
                    {incorrect.length > 0 && (
                        <button onClick={restartWithIncorrect} className="px-6 py-3 bg-black text-white rounded-xl font-black border-2 border-black hover:bg-white hover:text-black transition-all uppercase">Review Missed</button>
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

            <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8">
                <div className="text-center mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Definition</span>
                    {current.wordClass && (
                        <div className="mt-4 mb-4">
                            <span className="px-4 py-2 bg-sky-100 border-2 border-black rounded-lg text-sm font-black uppercase">
                                {current.wordClass}
                            </span>
                        </div>
                    )}
                    <p className="text-2xl font-black text-black mt-6 leading-relaxed">{current.meaning}</p>
                </div>

                <div className="mt-8">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-black">Your Answer</label>
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={showFeedback}
                        className="w-full px-4 py-4 bg-white border-2 border-black rounded-xl font-bold text-xl outline-none text-black placeholder:text-slate-300 focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                        placeholder="Type the word..."
                        autoFocus
                    />
                </div>

                {showFeedback && (
                    <div className={`mt-6 p-6 rounded-xl border-2 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                        <div className="flex items-center gap-3 mb-3">
                            {isCorrect ? (
                                <>
                                    <CheckIcon className="w-6 h-6 text-green-600" />
                                    <span className="text-sm font-black uppercase text-green-600">Correct!</span>
                                </>
                            ) : (
                                <>
                                    <XMarkIcon className="w-6 h-6 text-red-600" />
                                    <span className="text-sm font-black uppercase text-red-600">Incorrect</span>
                                </>
                            )}
                        </div>
                        {!isCorrect && (
                            <div className="mt-4">
                                <p className="text-xs font-black uppercase text-slate-500 mb-1">Correct Answer:</p>
                                <p className="text-2xl font-black text-black">{current.vocab}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-4">
                {!showFeedback ? (
                    <button
                        onClick={checkAnswer}
                        disabled={!userInput.trim()}
                        className="px-8 py-4 bg-sky-500 text-white border-2 border-black rounded-xl font-black hover:bg-sky-600 transition-all uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Check Answer
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="px-8 py-4 bg-black text-white border-2 border-black rounded-xl font-black hover:bg-sky-500 transition-all uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                    >
                        {index < cards.length - 1 ? 'Next' : 'Finish'}
                    </button>
                )}
            </div>

            <div className="mt-6 text-center">
                <button onClick={onClose} className="text-sm font-bold text-black hover:underline uppercase">
                    Exit
                </button>
            </div>
        </div>
    );
};

export default ResponseMode;
