import { useState } from 'react'
import { Download, Eye, X } from 'lucide-react'
import { Link } from 'react-router-dom';

const Gallery = ({ files }) => {
  const [selectedImage, setSelectedImage] = useState(null)

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-400 mb-4">
          <Eye className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-xl font-medium text-gray-300 mb-2">No images yet</h3>
        <p className="text-gray-500">Upload and convert some RAW files to see them here</p>
      </div>
    )
  }

  const completedFiles = files.filter(file => file.status === 'completed')

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <h1>Gallery</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/editor">Editor</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>
      <main>
        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {completedFiles.map(file => (
            <div key={file.id} className="group relative bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-square overflow-hidden">
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => setSelectedImage(file)}
                />
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 flex space-x-3">
                  <button
                    onClick={() => setSelectedImage(file)}
                    className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  >
                    <Eye className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={() => {
                      // Create download link
                      const link = document.createElement('a')
                      link.href = file.preview
                      link.download = file.name.replace(/\.[^/.]+$/, '.jpg')
                      link.click()
                    }}
                    className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  >
                    <Download className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* File Info */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-white truncate">{file.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for full-size image */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <X className="h-8 w-8" />
              </button>
              
              <img
                src={selectedImage.preview}
                alt={selectedImage.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 rounded-b-lg">
                <h3 className="text-lg font-medium">{selectedImage.name}</h3>
                <p className="text-sm text-gray-300">
                  {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Gallery
