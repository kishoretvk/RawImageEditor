import React from 'react';
import FileUploader from '../components/FileUploader';
import ConversionSettings from '../components/ConversionSettings';

function UploadConvert({ onFileUpload, settings, onSettingsChange }) {
  const [convSettings, setConvSettings] = React.useState(settings || { quality: 80, format: 'jpeg', resize: 1920, sharpening: 0, noiseReduction: 0 });
  const handleSettingsChange = (newSettings) => setConvSettings(newSettings);
  const [uploadedFiles, setUploadedFiles] = React.useState([]);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [convertedPreview, setConvertedPreview] = React.useState(null);
  const [autoSave, setAutoSave] = React.useState(false);

  // Handle file upload and select first file for preview
  const handleFileUpload = (files) => {
    setUploadedFiles(files);
    if (files.length > 0) setSelectedFile(files[0]);
  };

  // Simulate conversion and preview
  React.useEffect(() => {
    if (selectedFile) {
      // Simulate conversion preview
      setConvertedPreview(selectedFile.preview);
      if (autoSave) {
        // Auto-download
        const a = document.createElement('a');
        a.href = selectedFile.preview;
        a.download = selectedFile.name.replace(/\.[^/.]+$/, '.jpeg');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  }, [selectedFile, autoSave]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center py-20">
      <h1 className="text-4xl font-bold mb-8">Upload and Convert</h1>
      <ConversionSettings
        settings={convSettings}
        onChange={handleSettingsChange}
      />
      <FileUploader onFileUpload={handleFileUpload} settings={convSettings} />
      {/* Live Side-by-Side Preview */}
      {selectedFile && (
        <div className="flex gap-8 mt-12 w-full max-w-4xl">
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
            <img src={selectedFile.preview} alt="Original" className="rounded-xl mb-2 max-h-96" />
            <span className="font-bold text-blue-700">Original</span>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
            <img src={convertedPreview} alt="Converted" className="rounded-xl mb-2 max-h-96" />
            <span className="font-bold text-blue-700">Converted</span>
            <button
              className="mt-4 bg-blue-500 text-black font-bold px-6 py-3 rounded-xl shadow-lg border-2 border-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-200"
              onClick={() => {
                const a = document.createElement('a');
                a.href = convertedPreview;
                a.download = selectedFile.name.replace(/\.[^/.]+$/, '.jpeg');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              Download
            </button>
            <label className="flex items-center mt-2 cursor-pointer">
              <input type="checkbox" checked={autoSave} onChange={e => setAutoSave(e.target.checked)} className="mr-2" />
              <span className="text-sm font-bold text-black">Auto Save</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadConvert;
