import React, { useState, useEffect } from 'react';
import { notesAPI, chatAPI } from '../services/api';

const PatientChat = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me anything about your prescriptions and medical terms.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await notesAPI.getNotes({ limit: 20, processed_only: true });
        // Prefer prescriptions first
        setNotes(res);
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: 'Could not load your prescriptions for chat context.' },
        ]);
      }
    };
    load();
  }, []);

  const send = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);
    try {
      const resp = await chatAPI.ask({ question, noteId: selectedNoteId || null, topKNotes: 3 });
      setMessages((m) => [...m, { role: 'assistant', content: resp.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I could not answer right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const prescriptionNotes = notes.filter((n) => n.note_type === 'prescription');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="card h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">Ask about your prescriptions</h1>
              <div className="flex items-center space-x-3">
                <select
                  className="input-field"
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                >
                  <option value="">All Prescriptions</option>
                  {(prescriptionNotes.length ? prescriptionNotes : notes).map((n) => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center space-x-3">
              <textarea
                className="input-field flex-1 resize-none"
                rows={2}
                placeholder="Type your question and press Enter..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button onClick={send} className="btn-primary" disabled={loading}>Send</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Tips</h2>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>Ask what a medication is for and common side effects.</li>
              <li>Ask to summarize your prescription in simple terms.</li>
              <li>Ask to highlight key medical terms found in your note.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientChat;


