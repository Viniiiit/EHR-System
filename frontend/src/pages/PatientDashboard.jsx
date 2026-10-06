import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notesAPI } from '../services/api';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotes = async () => {
    try {
      const data = await notesAPI.getNotes({ processed_only: true });
      setNotes(data);
    } catch (e) {
      setError('Failed to load your prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Prescriptions</h1>
            <p className="text-gray-600">Upload a prescription and view extracted medical terms</p>
          </div>
          <button onClick={() => navigate('/upload')} className="btn-primary">Upload Prescription</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{error}</div>}

        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No processed prescriptions yet. Upload one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notes.map((note) => (
              <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                    <p className="text-xs text-gray-500">{new Date(note.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Processed</span>
                </div>
                {note.summary && <p className="mt-3 text-sm text-gray-700">{note.summary}</p>}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Extracted Medical Terms</h4>
                  <div className="flex flex-wrap gap-2">
                    {note.entities.slice(0, 12).map((e, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border border-gray-200">
                        {e.text} <span className="ml-2 text-[10px] uppercase text-gray-500">{e.category}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;


