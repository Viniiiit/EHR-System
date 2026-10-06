import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notesAPI } from '../services/api';

const UploadNote = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    patient_id: '',
    note_text: '',
    note_type: 'clinical_note',
  });
  const [mode, setMode] = useState('text');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let created;
      if (mode === 'text') {
        created = await notesAPI.uploadNote(formData);
      } else {
        if (!file) throw new Error('Please select a prescription image to upload');
        created = await notesAPI.uploadPrescription({ file, title: formData.title || 'Prescription', patientId: formData.patient_id || '' });
      }
      setSuccess('Uploaded successfully!');

      setFormData({
        title: '',
        patient_id: '',
        note_text: '',
        note_type: 'clinical_note',
      });
      setFile(null);
      setPreviewUrl('');

      if (created?.id) {
        navigate(`/patient/${created.id}`);
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d?.msg || d?.detail || JSON.stringify(d)).join('\n'));
      } else if (detail && typeof detail === 'object') {
        setError(detail.msg || detail.detail || JSON.stringify(detail));
      } else {
        setError(detail || err.message || 'Failed to upload note');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const sampleNotes = [
    {
      title: "Chest Pain Evaluation",
      patient_id: "P001",
      note_text: "Patient presents with chest pain for 2 days. Denies shortness of breath. History of diabetes and hypertension. Currently taking metformin 500mg daily and lisinopril 10mg daily. Physical exam reveals normal heart sounds, no murmurs. EKG shows normal sinus rhythm. Chest X-ray is clear. Assessment: Chest pain, likely musculoskeletal. Plan: Continue current medications, follow up in 1 week."
    },
    {
      title: "Diabetes Follow-up",
      patient_id: "P002", 
      note_text: "Patient returns for diabetes follow-up. Blood glucose levels have been well controlled. HbA1c is 6.8%. Patient reports good adherence to metformin 1000mg twice daily. No episodes of hypoglycemia. Physical exam unremarkable. Plan: Continue current regimen, recheck HbA1c in 3 months."
    }
  ];

  const loadSampleNote = (sample) => {
    setFormData({
      ...formData,
      title: sample.title,
      patient_id: sample.patient_id,
      note_text: sample.note_text,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Note or Prescription</h1>
          <p className="text-gray-600">Upload a clinical note or a prescription image for NLP processing and entity extraction</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    {success}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Input Type</label>
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => setMode('text')} className={`px-3 py-2 rounded border ${mode==='text' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}>Text Note</button>
                    <button type="button" onClick={() => setMode('prescription')} className={`px-3 py-2 rounded border ${mode==='prescription' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}>Prescription Image</button>
                  </div>
                </div>

                {mode === 'text' && (
                  <>
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Note Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        className="input-field"
                        placeholder="e.g., Chest Pain Evaluation"
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700 mb-2">
                        Patient ID
                      </label>
                      <input
                        type="text"
                        id="patient_id"
                        name="patient_id"
                        className="input-field"
                        placeholder="e.g., P001"
                        value={formData.patient_id}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="note_type" className="block text-sm font-medium text-gray-700 mb-2">
                        Note Type
                      </label>
                      <select
                        id="note_type"
                        name="note_type"
                        className="input-field"
                        value={formData.note_type}
                        onChange={handleChange}
                      >
                        <option value="clinical_note">Clinical Note</option>
                        <option value="discharge_summary">Discharge Summary</option>
                        <option value="progress_note">Progress Note</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="note_text" className="block text-sm font-medium text-gray-700 mb-2">
                        Clinical Note Text *
                      </label>
                      <textarea
                        id="note_text"
                        name="note_text"
                        required
                        rows={12}
                        className="input-field resize-none"
                        placeholder="Enter the clinical note text here..."
                        value={formData.note_text}
                        onChange={handleChange}
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Minimum 10 characters. The NLP system will extract medical entities, detect sections, and generate summaries.
                      </p>
                    </div>
                  </>
                )}

                {mode === 'prescription' && (
                  <>
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Prescription Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        className="input-field"
                        placeholder="e.g., Dr. Smith Prescription"
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700 mb-2">
                        Patient ID
                      </label>
                      <input
                        type="text"
                        id="patient_id"
                        name="patient_id"
                        className="input-field"
                        placeholder="e.g., P001"
                        value={formData.patient_id}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prescription Image *</label>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="input-field" />
                      {previewUrl && (
                        <img src={previewUrl} alt="Preview" className="mt-3 rounded-md border max-h-64 object-contain" />
                      )}
                      <p className="mt-2 text-sm text-gray-500">Accepted: JPG, PNG. We will OCR and extract medical terms.</p>
                    </div>
                  </>
                )}

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 flex justify-center"
                  >
                    {loading ? (
                      <div className="loading-spinner h-5 w-5"></div>
                    ) : (
                      mode === 'text' ? 'Upload Note' : 'Upload Prescription'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Notes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click on a sample note to load it into the form for testing.
              </p>
              
              <div className="space-y-3">
                {sampleNotes.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => loadSampleNote(sample)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="font-medium text-gray-900 text-sm">{sample.title}</div>
                    <div className="text-xs text-gray-500 mt-1">Patient: {sample.patient_id}</div>
                    <div className="text-xs text-gray-600 mt-2 line-clamp-2">
                      {sample.note_text.substring(0, 100)}...
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <span className="text-primary-600 mr-2">1.</span>
                  <span>Your note is uploaded and stored securely</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-600 mr-2">2.</span>
                  <span>NLP pipeline processes the text using ClinicalBERT and medSpaCy</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-600 mr-2">3.</span>
                  <span>Medical entities are extracted and categorized</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-600 mr-2">4.</span>
                  <span>AI-generated summary is created</span>
                </div>
                <div className="flex items-start">
                  <span className="text-primary-600 mr-2">5.</span>
                  <span>Results are available in your dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadNote;
