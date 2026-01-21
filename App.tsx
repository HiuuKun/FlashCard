


import React, { useState, useEffect, useRef } from 'react';
import { Section, ViewMode } from './types';
import { BrainIcon, PlusIcon, PencilIcon, TrashIcon, PlayIcon, ExportIcon, ImportIcon } from './components/Icons';
import SectionEditor from './components/SectionEditor';
import FlashcardMode from './components/FlashcardMode';
import QuizMode from './components/QuizMode';
import ResponseMode from './components/ResponseMode';
import TestMode from './components/TestMode';
import ListeningTest from './components/ListeningTest';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [sections, setSections] = useState<Section[]>(() => {
    try {
      const saved = localStorage.getItem('linguist_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse linguist_data from localStorage", e);
    }
    return [];
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('dashboard');

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('linguist_data', JSON.stringify(sections));
    } catch (e) {
      console.error("Failed to save data to localStorage", e);
    }
  }, [sections]);

  const activeSection = sections.find(s => s.id === activeId);

  const handleSave = (s: Section) => {
    setSections(prev => {
      const exists = prev.find(p => p.id === s.id);
      if (exists) {
        return prev.map(p => p.id === s.id ? s : p);
      }
      return [...prev, s];
    });
    setMode('dashboard');
    setActiveId(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      if (deleteId === 'BULK') {
        setSections(prev => prev.filter(s => !selectedIds.has(s.id)));
        setSelectedIds(new Set());
      } else {
        setSections(prev => prev.filter(s => s.id !== deleteId));
      }
      setDeleteId(null);
    }
  };

  const handleEdit = (id: string) => {
    setActiveId(id);
    setMode('edit');
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === sections.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sections.map(s => s.id)));
    }
  };

  const handleExport = (s: Section) => {
    downloadJSON(s, `${s.title.toLowerCase().replace(/\s/g, '_')}.json`);
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkExport = async (singleFile: boolean) => {
    const selectedSections = sections.filter(s => selectedIds.has(s.id));
    if (singleFile) {
      downloadJSON(selectedSections, `linguist_export_${Date.now()}.json`);
    } else {
      // Create a ZIP file with all selected sections
      const zip = new JSZip();

      selectedSections.forEach(s => {
        const filename = `${s.title.toLowerCase().replace(/\s/g, '_')}.json`;
        zip.file(filename, JSON.stringify(s, null, 2));
      });

      // Generate the ZIP file
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linguist_sections_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setShowExportModal(false);
    setSelectedIds(new Set());
  };

  const handleImportFromText = (jsonText: string) => {
    try {
      const json = JSON.parse(jsonText);
      const dataList = Array.isArray(json) ? json : [json];
      const newSections: Section[] = [];

      dataList.forEach((data: any) => {
        if (data.title && Array.isArray(data.cards)) {
          // Assign a new ID to avoid collisions with existing data
          data.id = crypto.randomUUID();
          newSections.push(data as Section);
        }
      });

      if (newSections.length > 0) {
        setSections(prev => [...prev, ...newSections]);
        setShowImportModal(false);
        alert(`Successfully imported ${newSections.length} section(s)!`);
      } else {
        alert("No valid sections found in the pasted content.");
      }
    } catch (err) {
      alert("Invalid JSON format. Please check your input and try again.");
      console.error("Error parsing JSON:", err);
    }
  };

  const handleImportFromFiles = async (files: FileList) => {
    const newSections: Section[] = [];

    const readFile = (file: File): Promise<void> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const json = JSON.parse(ev.target?.result as string);
            const dataList = Array.isArray(json) ? json : [json];

            dataList.forEach((data: any) => {
              if (data.title && Array.isArray(data.cards)) {
                // Assign a new ID to avoid collisions with existing data
                data.id = crypto.randomUUID();
                newSections.push(data as Section);
              }
            });
          } catch (err) {
            console.error(`Error parsing file ${file.name}`, err);
          }
          resolve();
        };
        reader.readAsText(file);
      });
    };

    await Promise.all(Array.from(files).map(readFile));

    if (newSections.length > 0) {
      setSections(prev => [...prev, ...newSections]);
      setShowImportModal(false);
      alert(`Successfully imported ${newSections.length} section(s)!`);
    } else {
      alert("No valid sections found in the imported files.");
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    // Set effect to move
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    if (dragItem.current === null || dragItem.current === position) return;

    const newSections = [...sections];
    const draggedItemContent = newSections[dragItem.current];
    newSections.splice(dragItem.current, 1);
    newSections.splice(position, 0, draggedItemContent);

    dragItem.current = position;
    setSections(newSections);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-black">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-black mb-4 uppercase">
              {deleteId === 'BULK' ? `Delete ${selectedIds.size} Sections?` : 'Delete Section?'}
            </h3>
            <p className="text-black mb-8 font-medium">This action cannot be undone. You will lose all cards in {deleteId === 'BULK' ? 'these sections' : 'this section'}.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-3 border-2 border-black text-black rounded-xl font-black hover:bg-slate-100 transition-all uppercase text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-500 text-white border-2 border-black rounded-xl font-black hover:bg-red-600 transition-all uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-black mb-4 uppercase">Export Options</h3>
            <p className="text-black mb-8 font-medium">How would you like to export {selectedIds.size} sections?</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleBulkExport(true)}
                className="w-full px-4 py-3 bg-sky-500 text-white border-2 border-black rounded-xl font-black hover:bg-sky-600 transition-all uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Single JSON File
              </button>
              <button
                onClick={() => handleBulkExport(false)}
                className="w-full px-4 py-3 bg-white text-black border-2 border-black rounded-xl font-black hover:bg-slate-100 transition-all uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Multiple JSON Files (ZIP)
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full px-4 py-2 text-black hover:underline font-bold text-sm mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-black mb-4 uppercase">Import Sections</h3>
            <p className="text-black mb-6 font-medium">Paste JSON content or drag and drop JSON files below</p>

            {/* Textarea for pasting JSON */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-black mb-2 uppercase">Paste JSON Content</label>
              <textarea
                id="import-textarea"
                placeholder='Paste your JSON here... e.g., {"title": "My Section", "cards": [...]}'
                className="w-full h-48 p-4 border-2 border-black rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Drag and Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-sky-500', 'bg-sky-50');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-sky-500', 'bg-sky-50');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-sky-500', 'bg-sky-50');
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  handleImportFromFiles(files);
                }
              }}
              className="mb-6 border-2 border-dashed border-black rounded-xl p-8 text-center transition-all cursor-pointer hover:border-sky-500 hover:bg-sky-50"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <ImportIcon className="w-12 h-12 mx-auto mb-3 text-sky-500" />
              <p className="font-bold text-black mb-1">Drag and drop JSON files here</p>
              <p className="text-sm text-gray-600">or click to browse</p>
              <input
                id="file-input"
                type="file"
                accept=".json"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleImportFromFiles(e.target.files);
                  }
                  e.target.value = '';
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-3 border-2 border-black text-black rounded-xl font-black hover:bg-slate-100 transition-all uppercase text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const textarea = document.getElementById('import-textarea') as HTMLTextAreaElement;
                  if (textarea && textarea.value.trim()) {
                    handleImportFromText(textarea.value.trim());
                    textarea.value = '';
                  } else {
                    alert('Please paste JSON content or upload a file.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-sky-500 text-white border-2 border-black rounded-xl font-black hover:bg-sky-600 transition-all uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Import from Text
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white border-b-2 border-sky-200 py-4 px-8 flex justify-between items-center sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-8">
          <div onClick={() => setMode('dashboard')} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white">
              <BrainIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-black">IeltsForMH</span>
          </div>

          {/* Navigation Links */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('dashboard')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all border-2 ${mode === 'dashboard' || mode === 'edit'
                ? 'bg-sky-500 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black border-transparent hover:border-sky-300 hover:bg-sky-50'
                }`}
            >
              Flashcard
            </button>
            <button
              onClick={() => setMode('listening')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all border-2 ${mode === 'listening'
                ? 'bg-purple-500 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black border-transparent hover:border-purple-300 hover:bg-purple-50'
                }`}
            >
              Listening
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-black hover:bg-sky-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-sky-300"
          >
            <ImportIcon /> Import
          </button>
          <button
            type="button"
            onClick={() => { setMode('edit'); setActiveId(null); }}
            className="flex items-center gap-2 px-5 py-2 border-2 border-black bg-sky-500 text-white rounded-lg font-bold hover:bg-sky-600 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <PlusIcon /> New Section
          </button>
        </div>
      </nav>

      <main className="flex-grow p-8">
        {mode === 'dashboard' && (
          <div className="max-w-6xl mx-auto mb-24">
            {sections.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-3xl border-2 border-dashed border-sky-300">
                <div className="w-24 h-24 bg-white border-2 border-sky-400 rounded-full flex items-center justify-center mb-6">
                  <BrainIcon className="w-12 h-12 text-sky-500" />
                </div>
                <h3 className="text-2xl font-black text-black">No collections yet</h3>
                <p className="text-black mt-2 mb-8 font-medium">Start by creating or importing your first vocabulary section.</p>
                <button type="button" onClick={() => setMode('edit')} className="px-8 py-3 border-2 border-black bg-sky-500 text-white rounded-xl font-black hover:bg-sky-600 transition-all">Create Now</button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-2">
                  <button onClick={selectAll} className="text-sm font-bold underline hover:text-sky-600">
                    {selectedIds.size === sections.length && sections.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sections.map((s, index) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`group bg-white rounded-2xl p-6 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(14,165,233,0.4)] transition-all duration-300 relative overflow-hidden cursor-move active:cursor-grabbing active:scale-105 active:shadow-[8px_8px_0px_0px_rgba(14,165,233,0.6)] z-10 active:z-50 ${selectedIds.has(s.id) ? 'border-sky-500 ring-2 ring-sky-300' : 'border-black'}`}
                    >
                      <div className="absolute top-4 left-4 z-30" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(s.id)}
                          onChange={() => toggleSelection(s.id)}
                          className="w-5 h-5 rounded border-2 border-black text-sky-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-start mb-4 relative z-20 pl-8">
                        <span className="px-3 py-1 border border-black text-black text-[10px] font-black uppercase rounded-lg bg-sky-50">
                          {s.cards.length} Cards
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleExport(s)}
                            className="p-2 text-black hover:bg-sky-100 rounded-lg transition-colors border border-black cursor-pointer"
                            title="Export"
                          >
                            <ExportIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(s.id)}
                            className="p-2 text-black hover:bg-sky-100 rounded-lg transition-colors border border-black cursor-pointer"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(s.id)}
                            className="p-2 hover:bg-red-500 rounded-lg transition-all border border-black cursor-pointer group/trash"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4 text-red-500 group-hover/trash:text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-xl font-black text-black mb-2 uppercase tracking-tight truncate">{s.title}</h3>
                        <p className="text-black text-sm mb-8 line-clamp-2 h-10 font-medium leading-tight">{s.description}</p>
                      </div>
                      <div className="flex flex-col gap-3 relative z-20">
                        <button type="button" onClick={() => { setActiveId(s.id); setMode('flashcard'); }} className="flex items-center justify-center gap-2 py-3 bg-sky-500 text-white rounded-xl font-black text-sm hover:bg-sky-600 border-2 border-black transition-all uppercase cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                          <PlayIcon className="w-4 h-4" /> Flashcards
                        </button>
                        <button type="button" onClick={() => { setActiveId(s.id); setMode('quiz'); }} className="flex items-center justify-center gap-2 py-3 bg-yellow-300 text-black rounded-xl font-black text-sm hover:bg-yellow-400 border-2 border-black transition-all uppercase cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                          Multiple Choices
                        </button>
                        <button type="button" onClick={() => { setActiveId(s.id); setMode('response'); }} className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-black text-sm hover:bg-green-600 border-2 border-black transition-all uppercase cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                          Response
                        </button>
                        <button type="button" onClick={() => { setActiveId(s.id); setMode('test'); }} className="flex items-center justify-center gap-2 py-3 bg-purple-500 text-white rounded-xl font-black text-sm hover:bg-purple-600 border-2 border-black transition-all uppercase cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                          Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedIds.size > 0 && mode === 'dashboard' && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border-2 border-black px-6 py-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-6 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-300">
            <span className="font-black text-black">{selectedIds.size} Selected</span>
            <div className="h-6 w-0.5 bg-gray-300"></div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-black rounded-lg border-2 border-black font-bold text-sm transition-colors"
              >
                <ExportIcon className="w-4 h-4" /> Export
              </button>
              <button
                onClick={() => setDeleteId('BULK')}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-black rounded-lg border-2 border-black font-bold text-sm transition-colors"
              >
                <TrashIcon className="w-4 h-4 text-red-500" /> Delete
              </button>
            </div>
          </div>
        )}

        {mode === 'edit' && <SectionEditor section={activeSection || null} onSave={handleSave} onCancel={() => setMode('dashboard')} />}
        {mode === 'flashcard' && activeSection && <FlashcardMode section={activeSection} onClose={() => setMode('dashboard')} />}
        {mode === 'quiz' && activeSection && <QuizMode section={activeSection} onClose={() => setMode('dashboard')} />}
        {mode === 'response' && activeSection && <ResponseMode section={activeSection} onClose={() => setMode('dashboard')} />}
        {mode === 'test' && activeSection && <TestMode section={activeSection} onClose={() => setMode('dashboard')} />}
        {mode === 'listening' && <ListeningTest onClose={() => setMode('dashboard')} />}
      </main>
    </div>
  );
};

export default App;
