import React, { useState, useRef, useEffect } from 'react';
import testData from '../Tests/Vol1/Test1.json';

interface ListeningTestProps {
    onClose: () => void;
}

interface QuestionBase {
    id: number | string;
    answer: string | string[];
}

interface FormCompletionQuestion extends QuestionBase {
    label: string;
}

interface MultipleChoiceSingleQuestion extends QuestionBase {
    question: string;
    options: Record<string, string>;
    answer: string;
}

interface MultipleChoiceMultiQuestion extends QuestionBase {
    question: string;
    options: Record<string, string>;
    answer: string[];
}

interface SentenceCompletionQuestion extends QuestionBase {
    question: string;
}

interface NoteCompletionQuestion extends QuestionBase {
    label: string;
}

interface TableCell {
    id?: number | string;
    label?: string;
    answer?: string;
}

interface Part {
    type: string;
    instructions: string;
    questions?: any[];
    table?: {
        headers: string[];
        rows: Array<{
            cells: (string | TableCell | TableCell[])[];
        }>;
    };
    limit?: number;
}

interface TestSection {
    id: string;
    title: string;
    audio: string;
    parts: Part[];
}

interface Test {
    id: string;
    title: string;
    sections: TestSection[];
}

const ListeningTest: React.FC<ListeningTestProps> = ({ onClose }) => {
    const tests: Test[] = [testData as Test];

    const [selectedTest, setSelectedTest] = useState<Test | null>(null);
    const [selectedSection, setSelectedSection] = useState<TestSection | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [userAnswers, setUserAnswers] = useState<Record<number | string, string | string[]>>({});
    const [showAnswers, setShowAnswers] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [selectedSection]);

    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setUserAnswers({});
        setShowAnswers(false);
        if (audioRef.current) {
            audioRef.current.load();
        }
    }, [selectedSection]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const time = parseFloat(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const vol = parseFloat(e.target.value);
        audio.volume = vol;
        setVolume(vol);
    };

    const handlePlaybackRateChange = (rate: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.playbackRate = rate;
        setPlaybackRate(rate);
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const skipTime = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    };

    const handleBackToTests = () => {
        setSelectedTest(null);
        setSelectedSection(null);
        setIsPlaying(false);
    };

    const handleBackToSections = () => {
        setSelectedSection(null);
        setIsPlaying(false);
    };

    const handleAnswerChange = (questionId: number | string, answer: string | string[]) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const checkAnswer = (questionId: number | string, correctAnswer: string | string[]): boolean => {
        const userAnswer = userAnswers[questionId];
        if (!userAnswer) return false;

        if (Array.isArray(correctAnswer)) {
            if (!Array.isArray(userAnswer)) return false;
            return correctAnswer.length === userAnswer.length &&
                correctAnswer.every(ans => userAnswer.includes(ans));
        }

        return typeof userAnswer === 'string' &&
            userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    };

    const calculateScore = (): { correct: number; total: number } => {
        if (!selectedSection) return { correct: 0, total: 0 };

        let correct = 0;
        let total = 0;

        selectedSection.parts.forEach(part => {
            if (part.questions) {
                part.questions.forEach(q => {
                    total++;
                    if (checkAnswer(q.id, q.answer)) {
                        correct++;
                    }
                });
            }
            if (part.table) {
                part.table.rows.forEach(row => {
                    row.cells.forEach(cell => {
                        if (Array.isArray(cell)) {
                            cell.forEach(c => {
                                if (c.id) {
                                    total++;
                                    if (checkAnswer(c.id, c.answer!)) correct++;
                                }
                            });
                        } else if (typeof cell === 'object' && cell.id) {
                            total++;
                            if (checkAnswer(cell.id, cell.answer!)) correct++;
                        }
                    });
                });
            }
        });

        return { correct, total };
    };

    // Test Selection View
    if (!selectedTest) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-sky-50 to-pink-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tight">
                                Listening Tests
                            </h1>
                            <p className="text-gray-700 font-medium">Select a test to begin your IELTS listening practice</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white border-2 border-black rounded-xl font-black hover:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 uppercase text-sm"
                        >
                            ← Back
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tests.map((test) => (
                            <div
                                key={test.id}
                                onClick={() => setSelectedTest(test)}
                                className="bg-white rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(168,85,247,0.4)] transition-all p-6 cursor-pointer group"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl border-2 border-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-black mb-2 uppercase">{test.title}</h3>
                                <p className="text-gray-700 font-medium mb-4">Cambridge IELTS Listening Practice Test</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-purple-600">
                                    <span>{test.sections.length} Sections</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Section Selection View
    if (!selectedSection) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-sky-50 to-pink-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tight">
                                {selectedTest.title}
                            </h1>
                            <p className="text-gray-700 font-medium">Cambridge IELTS Listening Practice Test</p>
                        </div>
                        <button
                            onClick={handleBackToTests}
                            className="px-6 py-3 bg-white border-2 border-black rounded-xl font-black hover:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 uppercase text-sm"
                        >
                            ← Back to Tests
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedTest.sections.map((section, idx) => (
                            <div
                                key={section.id}
                                onClick={() => setSelectedSection(section)}
                                className="bg-white rounded-3xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(168,85,247,0.4)] transition-all p-8 cursor-pointer group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl border-2 border-black flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <span className="text-3xl font-black text-white">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-black mb-2 uppercase">{section.title}</h3>
                                        <p className="text-gray-700 font-medium">Click to start listening</p>
                                    </div>
                                    <svg className="w-8 h-8 text-purple-500 group-hover:translate-x-2 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Instructions Card */}
                    <div className="bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 mt-8">
                        <h2 className="text-2xl font-black text-black mb-4 uppercase">Test Instructions</h2>
                        <ul className="space-y-3 text-gray-700 font-medium">
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">1</span>
                                <span>Each test contains 4 sections with increasing difficulty</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">2</span>
                                <span>Listen to each section carefully - in the actual test, you will hear it only once</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">3</span>
                                <span>Take notes while listening to help answer the questions</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">4</span>
                                <span>You can practice with playback controls to improve your skills</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Render different question types
    const renderQuestions = (part: Part, partIndex: number) => {
        const { type, instructions, questions, table, limit } = part;

        return (
            <div key={partIndex} className="bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 mb-6">
                <div className="mb-6">
                    <h3 className="text-xl font-black text-black mb-2 uppercase">Part {partIndex + 1}</h3>
                    <p className="text-gray-700 font-medium whitespace-pre-line">{instructions}</p>
                </div>

                {type === 'form_completion' && questions && (
                    <div className="space-y-4">
                        {questions.map((q: FormCompletionQuestion) => {
                            const isExample = q.id === 'example' || q.id === 'n/a';

                            if (isExample) {
                                // Display as example without answer box
                                return (
                                    <div key={q.id} className="flex items-center gap-4 text-gray-600 italic">
                                        <span className="font-medium flex-1">{q.label}</span>
                                        <span className="font-medium">{q.answer}</span>
                                    </div>
                                );
                            }

                            // Regular question with answer box
                            return (
                                <div key={q.id} className="flex items-center gap-4">
                                    <span className="font-bold text-black min-w-[30px]">{q.id}.</span>
                                    <span className="text-gray-700 font-medium flex-1">{q.label}</span>
                                    <input
                                        type="text"
                                        value={userAnswers[q.id] as string || ''}
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        className={`px-3 py-1.5 border-2 border-black rounded-lg font-medium max-w-[200px] ${showAnswers
                                            ? checkAnswer(q.id, q.answer)
                                                ? 'bg-green-100'
                                                : 'bg-red-100'
                                            : ''
                                            }`}
                                        placeholder="Your answer"
                                        disabled={showAnswers}
                                    />
                                    {showAnswers && !checkAnswer(q.id, q.answer) && (
                                        <span className="text-green-600 font-bold">✓ {q.answer}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {type === 'multiple_choice_single' && questions && (
                    <div className="space-y-6">
                        {questions.map((q: MultipleChoiceSingleQuestion) => (
                            <div key={q.id} className="border-2 border-gray-200 rounded-xl p-4">
                                <div className="font-bold text-black mb-3">{q.id}. {q.question}</div>
                                <div className="space-y-2">
                                    {Object.entries(q.options).map(([key, value]) => (
                                        <label
                                            key={key}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${userAnswers[q.id] === key
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-300'
                                                } ${showAnswers && q.answer === key
                                                    ? 'bg-green-100 border-green-500'
                                                    : ''
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`q${q.id}`}
                                                value={key}
                                                checked={userAnswers[q.id] === key}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                className="w-5 h-5"
                                                disabled={showAnswers}
                                            />
                                            <span className="font-bold">{key}.</span>
                                            <span className="font-medium">{value}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {type === 'multiple_choice_multi' && questions && (
                    <div className="space-y-6">
                        {questions.map((q: MultipleChoiceMultiQuestion) => (
                            <div key={q.id} className="border-2 border-gray-200 rounded-xl p-4">
                                <div className="font-bold text-black mb-3">
                                    {q.id}. {q.question} (Choose {limit} answers)
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(q.options).map(([key, value]) => {
                                        const currentAnswers = (userAnswers[q.id] as string[]) || [];
                                        const isChecked = currentAnswers.includes(key);
                                        const isCorrect = q.answer.includes(key);

                                        return (
                                            <label
                                                key={key}
                                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isChecked
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-purple-300'
                                                    } ${showAnswers && isCorrect
                                                        ? 'bg-green-100 border-green-500'
                                                        : ''
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    value={key}
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const newAnswers = isChecked
                                                            ? currentAnswers.filter(a => a !== key)
                                                            : [...currentAnswers, key];
                                                        handleAnswerChange(q.id, newAnswers);
                                                    }}
                                                    className="w-5 h-5"
                                                    disabled={showAnswers || (!isChecked && currentAnswers.length >= (limit || 3))}
                                                />
                                                <span className="font-bold">{key}.</span>
                                                <span className="font-medium">{value}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {(type === 'sentence_completion' || type === 'note_completion') && questions && (
                    <div className="space-y-4">
                        {questions.map((q: any) => (
                            <div key={q.id} className="flex items-start gap-4">
                                <span className="font-bold text-black min-w-[30px] mt-2">{q.id}.</span>
                                <div className="flex-1">
                                    <p className="text-gray-700 font-medium mb-2">{q.question || q.label}</p>
                                    <input
                                        type="text"
                                        value={userAnswers[q.id] as string || ''}
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        className={`max-w-md px-3 py-1.5 border-2 border-black rounded-lg font-medium ${showAnswers
                                            ? checkAnswer(q.id, q.answer)
                                                ? 'bg-green-100'
                                                : 'bg-red-100'
                                            : ''
                                            }`}
                                        placeholder="Your answer"
                                        disabled={showAnswers}
                                    />
                                    {showAnswers && !checkAnswer(q.id, q.answer) && (
                                        <span className="text-green-600 font-bold mt-2 block">✓ Correct answer: {q.answer}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {type === 'table_completion' && table && (
                    <div className="overflow-x-auto">
                        <table className="w-full border-2 border-black">
                            <thead>
                                <tr className="bg-purple-100">
                                    {table.headers.map((header, idx) => (
                                        <th key={idx} className="border-2 border-black p-3 font-black uppercase text-sm">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {table.rows.map((row, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-gray-50">
                                        {row.cells.map((cell, cellIdx) => (
                                            <td key={cellIdx} className="border-2 border-black p-3">
                                                {typeof cell === 'string' ? (
                                                    <span className="font-medium">{cell}</span>
                                                ) : Array.isArray(cell) ? (
                                                    <div className="space-y-2">
                                                        {cell.map((c: TableCell) => (
                                                            <div key={c.id}>
                                                                <span className="text-gray-700 font-medium">{c.label} </span>
                                                                <input
                                                                    type="text"
                                                                    value={userAnswers[c.id!] as string || ''}
                                                                    onChange={(e) => handleAnswerChange(c.id!, e.target.value)}
                                                                    className={`px-2 py-1 border-2 border-black rounded-lg font-medium text-sm w-32 ${showAnswers
                                                                        ? checkAnswer(c.id!, c.answer!)
                                                                            ? 'bg-green-100'
                                                                            : 'bg-red-100'
                                                                        : ''
                                                                        }`}
                                                                    placeholder="Answer"
                                                                    disabled={showAnswers}
                                                                />
                                                                {showAnswers && !checkAnswer(c.id!, c.answer!) && (
                                                                    <span className="text-green-600 font-bold ml-2">✓ {c.answer}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : cell.id ? (
                                                    <div>
                                                        <span className="text-gray-700 font-medium">{cell.label} </span>
                                                        <input
                                                            type="text"
                                                            value={userAnswers[cell.id] as string || ''}
                                                            onChange={(e) => handleAnswerChange(cell.id!, e.target.value)}
                                                            className={`px-2 py-1 border-2 border-black rounded-lg font-medium text-sm w-32 ${showAnswers
                                                                ? checkAnswer(cell.id, cell.answer!)
                                                                    ? 'bg-green-100'
                                                                    : 'bg-red-100'
                                                                : ''
                                                                }`}
                                                            placeholder="Answer"
                                                            disabled={showAnswers}
                                                        />
                                                        {showAnswers && !checkAnswer(cell.id, cell.answer!) && (
                                                            <span className="text-green-600 font-bold ml-2">✓ {cell.answer}</span>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    // Audio Player View with Questions
    const score = calculateScore();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-sky-50 to-pink-50 p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tight">
                            {selectedTest.title} - {selectedSection.title}
                        </h1>
                        <p className="text-gray-700 font-medium">IELTS Listening Practice</p>
                    </div>
                    <button
                        onClick={handleBackToSections}
                        className="px-6 py-3 bg-white border-2 border-black rounded-xl font-black hover:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 uppercase text-sm"
                    >
                        ← Back to Sections
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Column - Audio Player */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sticky top-8">
                            <audio ref={audioRef} src={selectedSection.audio} preload="metadata" />

                            {/* Visual */}
                            <div className="mb-6 bg-gradient-to-br from-purple-400 via-sky-400 to-pink-400 rounded-2xl border-2 border-black h-48 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-white rounded-full border-2 border-black mx-auto mb-3 flex items-center justify-center">
                                        <span className="text-3xl font-black text-purple-500">
                                            {selectedTest.sections.findIndex(s => s.id === selectedSection.id) + 1}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase">{selectedSection.title}</h3>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                                <div className="flex justify-between mt-1 text-xs font-bold text-gray-600">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Main Controls */}
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <button
                                    onClick={() => skipTime(-10)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-lg transition-all"
                                    title="Rewind 10s"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                                    </svg>
                                </button>

                                <button
                                    onClick={togglePlay}
                                    className="p-4 bg-purple-500 hover:bg-purple-600 text-white border-2 border-black rounded-full transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                                >
                                    {isPlaying ? (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    onClick={() => skipTime(10)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-lg transition-all"
                                    title="Forward 10s"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Playback Speed */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-black mb-2 uppercase">Speed</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {[0.75, 1, 1.25].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => handlePlaybackRateChange(rate)}
                                            className={`py-1 px-2 border-2 border-black rounded-lg font-black text-xs transition-all ${playbackRate === rate
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-white text-black hover:bg-gray-100'
                                                }`}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Volume Control */}
                            <div>
                                <label className="block text-xs font-bold text-black mb-2 uppercase">
                                    Volume: {Math.round(volume * 100)}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="mt-6 pt-6 border-t-2 border-gray-200">
                                {!showAnswers ? (
                                    <button
                                        onClick={() => setShowAnswers(true)}
                                        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white border-2 border-black rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                                    >
                                        Submit Answers
                                    </button>
                                ) : (
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-black mb-2">
                                            {score.correct}/{score.total}
                                        </div>
                                        <div className="text-sm font-bold text-gray-600 mb-4">
                                            {Math.round((score.correct / score.total) * 100)}% Correct
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowAnswers(false);
                                                setUserAnswers({});
                                            }}
                                            className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white border-2 border-black rounded-xl font-black uppercase text-sm"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Questions */}
                    <div className="lg:col-span-3">
                        {selectedSection.parts.map((part, idx) => renderQuestions(part, idx))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListeningTest;
