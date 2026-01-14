
import React, { useState } from 'react';
import { Section, Card } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface SectionEditorProps {
  section: Section | null;
  onSave: (s: Section) => void;
  onCancel: () => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({ section, onSave, onCancel }) => {
  const [title, setTitle] = useState(section?.title || '');
  const [desc, setDesc] = useState(section?.description || '');
  const [cards, setCards] = useState<Card[]>(section?.cards || []);

  const addCard = () => {
    setCards([...cards, { id: crypto.randomUUID(), vocab: '', meaning: '' }]);
  };

  const updateCard = (id: string, field: keyof Card, val: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a section title.");
      return;
    }
    // Only save cards that are actually completed
    const validCards = cards.filter(c => c.vocab.trim() && c.meaning.trim());
    if (validCards.length === 0) {
      alert("Please add at least one complete vocabulary card.");
      return;
    }
    onSave({
      id: section?.id || crypto.randomUUID(),
      title,
      description: desc,
      cards: validCards,
      createdAt: section?.createdAt || Date.now()
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-black uppercase tracking-tight">{section ? 'Edit' : 'Create'} Section</h2>
        <div className="flex gap-4">
          <button onClick={onCancel} className="px-4 py-2 font-black text-black hover:underline uppercase text-sm">Cancel</button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-sky-500 text-white rounded-xl font-black border-2 border-black hover:bg-sky-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-2 text-black">
            <label className="text-xs font-black uppercase tracking-[0.2em]">Section Title</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              className="px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 outline-none font-black text-black placeholder:text-slate-400"
              placeholder="e.g. Essential Verbs"
            />
          </div>
          <div className="flex flex-col gap-2 text-black">
            <label className="text-xs font-black uppercase tracking-[0.2em]">Description</label>
            <input
              value={desc} onChange={e => setDesc(e.target.value)}
              className="px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 outline-none font-black text-black placeholder:text-slate-400"
              placeholder="What are you learning?"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-black uppercase tracking-wide">Vocabulary Cards</h3>
        <div className="flex gap-3">
          <button onClick={addCard} className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-sky-500 text-white rounded-lg font-black hover:bg-sky-600 transition-all text-xs uppercase">
            <PlusIcon className="w-4 h-4 text-white" />
            Add Word
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {cards.map((c, i) => (
          <div key={c.id} className="group flex gap-6 bg-white p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="flex-1 text-black">
              <label className="text-[10px] font-black uppercase mb-1 block">Word / Phrase</label>
              <input
                value={c.vocab} onChange={e => updateCard(c.id, 'vocab', e.target.value)}
                className="w-full bg-transparent border-b-2 border-black py-1 font-black text-xl outline-none text-black placeholder:text-slate-300"
                placeholder="Vocabulary..."
              />
            </div>
            <div className="flex-[2] relative text-black">
              <label className="text-[10px] font-black uppercase mb-1 block">Meaning / Definition</label>
              <input
                value={c.meaning} onChange={e => updateCard(c.id, 'meaning', e.target.value)}
                className="w-full bg-transparent border-b-2 border-black py-1 font-medium text-lg outline-none text-black placeholder:text-slate-300"
                placeholder="Meaning..."
              />
            </div>
            <button onClick={() => removeCard(c.id)} className="p-2 hover:bg-red-50 self-end transition-all">
              <TrashIcon className="w-6 h-6 text-red-500 hover:text-red-600" />
            </button>
          </div>
        ))}
        {cards.length === 0 && <p className="text-center py-10 font-black text-black border-2 border-dashed border-sky-300 rounded-2xl uppercase text-sm tracking-widest bg-white/40">List is empty</p>}
      </div>
    </div>
  );
};

export default SectionEditor;
