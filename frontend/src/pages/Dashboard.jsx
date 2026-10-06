import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notesAPI } from '../services/api';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalNotes: 0,
    processedNotes: 0,
    totalEntities: 0,
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getNotes({ limit: 10 });
      setNotes(response);
      
      // Calculate stats
      const totalNotes = response.length;
      const processedNotes = response.filter(note => note.is_processed).length;
      const totalEntities = response.reduce((sum, note) => sum + note.entities.length, 0);
      
      setStats({ totalNotes, processedNotes, totalEntities });
    } catch (err) {
      setError('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your clinical notes and NLP insights</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">📄</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Notes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalNotes}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Processed Notes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.processedNotes}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">🔍</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Entities</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEntities}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <Link
              to="/upload"
              className="btn-primary flex items-center"
            >
              <span className="mr-2">📝</span>
              Upload New Note
            </Link>
            <button
              onClick={fetchNotes}
              className="btn-secondary flex items-center"
            >
              <span className="mr-2">🔄</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Recent Notes */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Notes</h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
              <p className="text-gray-500 mb-4">Upload your first clinical note to get started</p>
              <Link to="/upload" className="btn-primary">
                Upload Note
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{note.title}</h3>
                        {note.is_processed ? (
                          <span className="entity-badge entity-lab">Processed</span>
                        ) : (
                          <span className="entity-badge entity-other">Pending</span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">
                        Patient ID: {note.patient_id || 'N/A'} • {note.note_type}
                      </p>
                      
                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                        {(note.note_text || "").substring(0, 150)}
                        {(note.note_text || "").length > 150 ? "..." : ""}
                      </p>

                      {note.is_processed && note.entities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {note.entities.slice(0, 5).map((entity, index) => (
                            <span
                              key={index}
                              className={`entity-badge ${getEntityCategoryColor(entity.category)} ${
                                entity.negated ? 'negated' : ''
                              }`}
                            >
                              {entity.text}
                            </span>
                          ))}
                          {note.entities.length > 5 && (
                            <span className="entity-badge entity-other">
                              +{note.entities.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {note.is_processed && note.summary && (
                        <div className="bg-gray-50 rounded-md p-3 mb-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Summary:</span> {note.summary}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 text-right">
                      <p className="text-xs text-gray-500 mb-2">
                        {formatDate(note.created_at)}
                      </p>
                      <Link
                        to={`/patient/${note.id}`}
                        className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
