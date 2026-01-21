
import React, { useState, useEffect, useRef } from 'react';
import { Section, Card } from '../types';
import { CheckIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface TestModeProps {
    section: Section;
    onClose: () => void;
}

type QuestionType = 'mc-word-to-meaning' | 'mc-meaning-to-word' | 'response';

interface Question {
    id: string;
    type: QuestionType;
    card: Card;
    options?: string[]; // For multiple choice questions
    correctAnswer: string; // The correct answer (meaning for word-to-meaning, word for others)
}

const TestMode: React.FC<TestModeProps> = ({ section, onClose }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [isDone, setIsDone] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (isDone) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [isDone]);

    useEffect(() => {
        const allMeanings = section.cards.map(c => c.meaning);
        const allWords = section.cards.map(c => c.vocab);

        // Calculate total number of questions: numberOfCards + Math.ceil(numberOfCards / 4)
        const numberOfCards = section.cards.length;
        const totalQuestions = numberOfCards + Math.ceil(numberOfCards / 4);

        const generatedQuestions: Question[] = [];

        // Generate questions by randomly selecting cards
        for (let i = 0; i < totalQuestions; i++) {
            // Randomly select a card
            const card = section.cards[Math.floor(Math.random() * section.cards.length)];

            // Randomly decide question type
            const rand = Math.random();
            let questionType: QuestionType;

            if (rand < 0.33) {
                questionType = 'mc-word-to-meaning';
            } else if (rand < 0.66) {
                questionType = 'mc-meaning-to-word';
            } else {
                questionType = 'response';
            }

            if (questionType === 'mc-word-to-meaning') {
                // Multiple choice: given word, choose meaning
                let distractors = allMeanings
                    .filter(m => m !== card.meaning)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);

                while (distractors.length < 3) {
                    distractors.push(`Definition ${distractors.length + 1}`);
                }

                const options = [...distractors, card.meaning].sort(() => Math.random() - 0.5);

                generatedQuestions.push({
                    id: `q-${i}-${crypto.randomUUID().slice(0, 8)}`,
                    type: questionType,
                    card,
                    options,
                    correctAnswer: card.meaning
                });
            } else if (questionType === 'mc-meaning-to-word') {
                // Multiple choice: given meaning, choose word
                let distractors = allWords
                    .filter(w => w !== card.vocab)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);

                while (distractors.length < 3) {
                    distractors.push(`Word ${distractors.length + 1}`);
                }

                const options = [...distractors, card.vocab].sort(() => Math.random() - 0.5);

                generatedQuestions.push({
                    id: `q-${i}-${crypto.randomUUID().slice(0, 8)}`,
                    type: questionType,
                    card,
                    options,
                    correctAnswer: card.vocab
                });
            } else {
                // Response type: given meaning, type the word
                generatedQuestions.push({
                    id: `q-${i}-${crypto.randomUUID().slice(0, 8)}`,
                    type: questionType,
                    card,
                    correctAnswer: card.vocab
                });
            }
        }

        setQuestions(generatedQuestions.sort(() => Math.random() - 0.5));
    }, [section]);

    const handleSelectMC = (questionId: string, option: string) => {
        if (isDone) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleResponseInput = (questionId: string, value: string) => {
        if (isDone) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const scrollToQuestion = (idx: number) => {
        questionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const normalizeString = (str: string) => {
        return str.toLowerCase().trim().replace(/\s+/g, ' ');
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach(q => {
            const userAnswer = userAnswers[q.id];
            if (!userAnswer) return;

            if (q.type === 'response') {
                if (normalizeString(userAnswer) === normalizeString(q.correctAnswer)) {
                    score++;
                }
            } else {
                if (userAnswer === q.correctAnswer) {
                    score++;
                }
            }
        });
        return score;
    };

    const isAnswerCorrect = (q: Question) => {
        const userAnswer = userAnswers[q.id];
        if (!userAnswer) return false;

        if (q.type === 'response') {
            return normalizeString(userAnswer) === normalizeString(q.correctAnswer);
        } else {
            return userAnswer === q.correctAnswer;
        }
    };

    const handleEndTest = () => {
        setIsDone(true);
    };

    if (questions.length === 0) return null;

    return (
        <div className="flex min-h-[calc(100vh-100px)] relative">
            <div className="flex-grow px-4 py-10 max-w-4xl mx-auto w-full relative z-0">

                {isDone && (
                    <div className="bg-white p-10 rounded-3xl border-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h2 className="text-4xl font-black text-black mb-2 uppercase italic tracking-tighter">Test Results</h2>
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
                        {isDone ? "Review Test" : "Mixed Test"}
                    </h2>
                    <p className="font-medium text-slate-500 uppercase text-xs tracking-widest">
                        {isDone ? "See where you can improve" : "Multiple choice and response questions"}
                    </p>
                </div>

                <div className="space-y-12 pb-32">
                    {questions.map((q, idx) => {
                        const userAnswer = userAnswers[q.id];
                        const isCorrect = isAnswerCorrect(q);

                        return (
                            <div
                                key={q.id}
                                ref={el => { questionRefs.current[idx] = el; }}
                                className={`bg-white p-8 rounded-3xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all
                  ${isDone ? (isCorrect ? 'ring-4 ring-green-100 border-green-500 shadow-none' : 'ring-4 ring-red-100 border-red-500 shadow-none') : ''}`}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-black uppercase px-3 py-1 rounded-full text-white
                      ${isDone ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : 'bg-black'}`}>
                                            Q{idx + 1}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border-2 border-black
                      ${q.type === 'response' ? 'bg-purple-100' : 'bg-yellow-100'}`}>
                                            {q.type === 'response' ? 'Type Answer' : 'Multiple Choice'}
                                        </span>
                                    </div>
                                    {isDone && (
                                        <span className={`text-[10px] font-black uppercase ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                            {isCorrect ? "Correct" : "Incorrect"}
                                        </span>
                                    )}
                                    {!isDone && userAnswers[q.id] && (
                                        <span className="text-[10px] font-black uppercase text-sky-500">Answered</span>
                                    )}
                                </div>

                                {/* Question Display */}
                                {q.type === 'mc-word-to-meaning' && (
                                    <div className="mb-8">
                                        <p className="text-xs font-black uppercase text-slate-500 mb-2">Select the correct meaning:</p>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-3xl font-black text-black">{q.card.vocab}</h3>
                                            {q.card.wordClass && (
                                                <span className="px-3 py-1 bg-sky-100 border border-black rounded-lg text-xs font-black uppercase">
                                                    {q.card.wordClass}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {q.type === 'mc-meaning-to-word' && (
                                    <div className="mb-8">
                                        <p className="text-xs font-black uppercase text-slate-500 mb-2">Select the correct word:</p>
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="text-xl font-black text-black">{q.card.meaning}</p>
                                        </div>
                                        {q.card.wordClass && (
                                            <span className="px-3 py-1 bg-sky-100 border border-black rounded-lg text-xs font-black uppercase inline-block">
                                                {q.card.wordClass}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {q.type === 'response' && (
                                    <div className="mb-8">
                                        <p className="text-xs font-black uppercase text-slate-500 mb-2">Type the correct word:</p>
                                        <div className="flex items-center gap-3 mb-4">
                                            <p className="text-xl font-black text-black">{q.card.meaning}</p>
                                        </div>
                                        {q.card.wordClass && (
                                            <span className="px-3 py-1 bg-sky-100 border border-black rounded-lg text-xs font-black uppercase inline-block mb-4">
                                                {q.card.wordClass}
                                            </span>
                                        )}
                                        <input
                                            type="text"
                                            value={userAnswers[q.id] || ''}
                                            onChange={(e) => handleResponseInput(q.id, e.target.value)}
                                            disabled={isDone}
                                            className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-lg outline-none text-black placeholder:text-slate-300 focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50"
                                            placeholder="Type your answer..."
                                        />
                                    </div>
                                )}

                                {/* Multiple Choice Options */}
                                {(q.type === 'mc-word-to-meaning' || q.type === 'mc-meaning-to-word') && q.options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt, i) => {
                                            const isSelected = userAnswers[q.id] === opt;
                                            const isTheCorrectAnswer = opt === q.correctAnswer;

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
                                                    onClick={() => handleSelectMC(q.id, opt)}
                                                    className={`p-5 rounded-xl border-2 text-left font-bold transition-all duration-200 text-sm flex items-center justify-between ${buttonClass}`}
                                                >
                                                    <span className="pr-4">{opt}</span>
                                                    {icon}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Feedback for incorrect answers */}
                                {isDone && !isCorrect && (
                                    <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                                        <p className="text-[10px] font-black uppercase text-red-500 mb-1">Feedback</p>
                                        <p className="text-sm font-medium text-black italic">
                                            {q.type === 'mc-word-to-meaning' && (
                                                <>The correct meaning of <span className="font-black">"{q.card.vocab}"</span> is: <span className="font-black text-green-600">"{q.card.meaning}"</span></>
                                            )}
                                            {q.type === 'mc-meaning-to-word' && (
                                                <>The correct word for <span className="font-black">"{q.card.meaning}"</span> is: <span className="font-black text-green-600">"{q.card.vocab}"</span></>
                                            )}
                                            {q.type === 'response' && (
                                                <>The correct answer is: <span className="font-black text-green-600">"{q.card.vocab}"</span></>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Side Navigation Bar */}
            {!isDone && (
                <div
                    className={`fixed top-[73px] right-0 h-[calc(100vh-73px)] bg-white border-l-2 border-black shadow-[-10px_0px_30px_0px_rgba(0,0,0,0.1)] transition-transform duration-300 z-50 
            ${isSidebarOpen ? 'translate-x-0 w-64' : 'translate-x-full w-64'}`}
                >
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
                        <h4 className="font-black uppercase text-xs tracking-widest mb-6 text-black border-b-2 border-black pb-2">Quiz Navigation</h4>
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

export default TestMode;
