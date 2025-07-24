import { useState, useRef } from 'react'
import { Upload, FileImage, X } from 'lucide-react'

const FileUploader = ({ onFileUpload, settings }) => {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [collapsed, setCollapsed] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target && e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList) => {
    try {
      setError(null)
      const validFiles = Array.from(fileList).filter(file => {
        const ext = file.name.toLowerCase()
        return ext.includes('.arw') || ext.includes('.cr2') || ext.includes('.cr3') || 
               ext.includes('.nef') || ext.includes('.dng') || ext.includes('.raw') ||
               ext.includes('.jpg') || ext.includes('.jpeg') || ext.includes('.png')
      })
      
      if (validFiles.length === 0) {
        setError('Please select a valid image file (.arw, .cr2, .cr3, .nef, .dng, .raw, .jpg, .jpeg, .png)')
        return
      }
      
      const newFiles = validFiles.map(file => {
        console.log('FileUploader: Processing file:', file.name, file.type, file.size);
        const blobUrl = URL.createObjectURL(file);
        console.log('FileUploader: Created blob URL:', blobUrl);
        
        return {
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          preview: blobUrl,
          status: 'ready'
        };
      });
      
      setFiles(prev => [...prev, ...newFiles])
      
      // Send the first file's data to parent for image display
      if (newFiles.length > 0 && onFileUpload) {
        const fileData = {
          url: newFiles[0].preview,
          filename: newFiles[0].name,
          size: newFiles[0].size,
          type: newFiles[0].file.type
        };
        console.log('FileUploader: Calling onFileUpload with:', fileData);
        onFileUpload(fileData)
      }
    } catch (err) {
      console.error('File upload error:', err)
      setError('Error processing file upload. Please try again.')
    }
  }

  const removeFile = (id) => {
    try {
      setFiles(prev => {
        const filtered = prev.filter(file => file.id !== id)
        // Clean up blob URL to prevent memory leaks
        const fileToRemove = prev.find(file => file.id === id)
        if (fileToRemove && fileToRemove.preview) {
          URL.revokeObjectURL(fileToRemove.preview)
        }
        return filtered
      })
      setError(null)
    } catch (err) {
      console.error('Error removing file:', err)
      setError('Error removing file.')
    }
  }

  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className={`flex items-center justify-center gap-4 bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-2xl shadow-xl px-6 py-4 transition-all duration-300 ${collapsed ? 'h-12 overflow-hidden' : 'h-auto'} ${dragActive ? 'border-blue-400 bg-blue-50/10' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleChange}
          accept=".arw,.cr2,.cr3,.nef,.dng,.raw,.jpg,.jpeg,.png"
          className="hidden"
        />
        
        {error && (
          <div className="w-full bg-red-500/20 border border-red-500 text-red-200 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {!collapsed && (
          <>
            <button
              onClick={onButtonClick}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group"
            >
              <Upload className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              {files.length === 0 ? 'Upload File' : 'Upload More'}
            </button>
            
            {files.length > 0 && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <FileImage className="h-5 w-5 text-purple-400 mr-2" />
                <span className="text-white font-semibold text-base truncate max-w-[180px]">{files[0].name}</span>
                <span className="text-white/60 text-xs ml-2">{(files[0].size / (1024 * 1024)).toFixed(2)} MB</span>
                <button
                  onClick={() => removeFile(files[0].id)}
                  className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
        
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-2 p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title={collapsed ? 'Expand' : 'Minimize'}
        >
          {collapsed ? <span className="text-lg">▸</span> : <span className="text-lg">▾</span>}
        </button>
      </div>
    </div>
  )
}

export default FileUploader
