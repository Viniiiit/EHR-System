import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { notesAPI } from '../services/api';

const PatientView = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const fetchNote = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getNoteDetail(noteId);
      setNote(response);
    } catch (err) {
      setError('Failed to fetch note details');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const processNote = async () => {
    try {
      setProcessing(true);
      await notesAPI.processNote(noteId);
      await fetchNote(); // Refresh the note data
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to process note');
    } finally {
      setProcessing(false);
    }
  };

  const deleteNote = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await notesAPI.deleteNote(noteId);
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to delete note');
      }
    }
  };

  const getEntityCategoryColor = (category) => {
    const colors = {
      'DISEASE_CONDITION': 'entity-disease',
      'SYMPTOM': 'entity-symptom',
      'MEDICATION': 'entity-medication',
      'LAB_RESULT': 'entity-lab',
      'PROCEDURE': 'entity-procedure',
      'OTHER': 'entity-other',
    };
    return colors[category] || 'entity-other';
  };

  const getEntityCategoryIcon = (category) => {
    const icons = {
      'DISEASE_CONDITION': '🦠',
      'SYMPTOM': '🤒',
      'MEDICATION': '💊',
      'LAB_RESULT': '🧪',
      'PROCEDURE': '🏥',
      'OTHER': '📋',
    };
    return icons[category] || '📋';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading note details...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Note Not Found</h2>
          <p className="text-gray-600 mb-4">The requested note could not be found.</p>
          <Link to="/dashboard" className="btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{note.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Patient ID: {note.patient_id || 'N/A'}</span>
                <span>•</span>
                <span>Type: {note.note_type}</span>
                <span>•</span>
                <span>Created: {formatDate(note.created_at)}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              {!note.is_processed && (
                <button
                  onClick={processNote}
                  disabled={processing}
                  className="btn-primary flex items-center"
                >
                  {processing ? (
                    <div className="loading-spinner h-4 w-4 mr-2"></div>
                  ) : (
                    <span className="mr-2">🔍</span>
                  )}
                  Process Note
                </button>
              )}
              <button
                onClick={deleteNote}
                className="btn-danger flex items-center"
              >
                <span className="mr-2">🗑️</span>
                Delete
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Note Text */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Clinical Note</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">{note.note_text}</p>
              </div>
            </div>

            {/* AI Summary */}
            {note.is_processed && note.summary && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Summary</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-800">{note.summary}</p>
                </div>
              </div>
            )}

            {/* Sections */}
            {note.is_processed && note.sections.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Detected Sections</h2>
                <div className="space-y-3">
                  {note.sections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{section.name}</h3>
                      <p className="text-gray-700 text-sm">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Processing Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`entity-badge ${note.is_processed ? 'entity-lab' : 'entity-other'}`}>
                    {note.is_processed ? 'Processed' : 'Pending'}
                  </span>
                </div>
                {note.is_processed && note.processing_metadata && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Entities Found</span>
                      <span className="text-sm font-medium">{note.processing_metadata.total_entities}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sections Detected</span>
                      <span className="text-sm font-medium">{note.processing_metadata.sections_detected}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Processing Time</span>
                      <span className="text-sm font-medium">
                        {note.processing_metadata.processing_time_seconds?.toFixed(2)}s
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Extracted Entities */}
            {note.is_processed && note.entities.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Entities</h3>
                <div className="space-y-3">
                  {Object.entries(
                    note.entities.reduce((acc, entity) => {
                      if (!acc[entity.category]) {
                        acc[entity.category] = [];
                      }
                      acc[entity.category].push(entity);
                      return acc;
                    }, {})
                  ).map(([category, entities]) => (
                    <div key={category}>
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">{getEntityCategoryIcon(category)}</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {category.replace('_', ' ')} ({entities.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entities.map((entity, index) => (
                          <span
                            key={index}
                            className={`entity-badge ${getEntityCategoryColor(entity.category)} ${
                              entity.negated ? 'negated' : ''
                            }`}
                            title={`Confidence: ${(entity.confidence * 100).toFixed(1)}%`}
                          >
                            {entity.text}
                            {entity.dosage && ` (${entity.dosage})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className="btn-secondary w-full text-center block"
                >
                  ← Back to Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="btn-primary w-full text-center block"
                >
                  Upload Another Note
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientView;
