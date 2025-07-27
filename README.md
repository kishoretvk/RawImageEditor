# RAW Image Editor

A professional-grade web application for viewing, editing, and processing RAW image files directly in your browser. Built with React 18 and Vite, featuring enterprise-level RAW processing capabilities with advanced security, performance monitoring, and batch processing.

![RAW Image Editor](./screenshots/hero-section.png)

## 🌟 Features

### **Advanced RAW Processing**
- **Multi-format Support**: Canon (.cr2, .cr3, .crw), Nikon (.nef, .nrw), Sony (.arw, .srf, .sr2), Adobe (.dng), Olympus (.orf), Panasonic (.rw2, .raw), Pentax (.pef, .ptx), Fujifilm (.raf), Samsung (.srw), Leica (.rwl), and many more
- **Production-Ready Processing**: Enterprise-grade RAW processor with security validation, performance monitoring, and error handling
- **Intelligent Thumbnail Extraction**: Advanced EXIF thumbnail extraction with quality optimization
- **Simulated RAW Processing**: Bayer pattern demosaicing simulation for enhanced preview quality
- **LRU Caching System**: Memory-efficient caching for processed images with automatic cleanup

### **Professional Image Editing**
- **Before/After Slider**: Interactive comparison tool with smooth transitions
- **Enhanced Image Canvas**: Professional-grade editing interface with high-quality rendering
- **Batch Processing**: Process multiple RAW files simultaneously with progress tracking
- **Quality Enhancement**: Advanced post-processing algorithms for optimal image quality
- **Export Options**: High-quality JPEG export with customizable compression settings

### **Enterprise Features**
- **Security Validation**: File signature verification and input sanitization
- **Performance Monitoring**: Real-time metrics tracking and performance analytics
- **Health Checks**: System monitoring with detailed status reporting
- **Error Handling**: Comprehensive error management with retry logic and exponential backoff
- **Memory Management**: Chunked file reading and automatic resource cleanup

### **User Experience**
- **Modern UI/UX**: Clean, professional interface built with Tailwind CSS
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Interactive Demos**: Live before/after demonstrations with sample images
- **Onboarding Tour**: Guided introduction for new users
- **Keyboard Shortcuts**: Professional workflow shortcuts for power users

## 🖼️ Screenshots

### Landing Page
![Landing Page](./screenshots/landing-page.png)
*Professional landing page with hero section and feature highlights*

### RAW Image Processing
![RAW Processing](./screenshots/raw-processing.png)
*Advanced RAW processing with thumbnail extraction and quality enhancement*

### Before/After Comparison
![Before/After](./screenshots/before-after-slider.png)
*Interactive before/after slider for comparing original and processed images*

### Image Editor Interface
![Image Editor](./screenshots/editor-interface.png)
*Professional image editing interface with advanced tools and controls*

### Batch Processing
![Batch Processing](./screenshots/batch-processing.png)
*Efficient batch processing with progress tracking and error handling*

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or higher
- npm 9.0 or higher
- Modern web browser with WebAssembly support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kishoretvk/RawImageEditor.git
   cd RawImageEditor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture

### **Core Components**

- **RAW Processor** (`src/utils/rawProcessor.js`): Enterprise-grade RAW file processing engine
- **Enhanced Image Canvas** (`src/components/EnhancedImageCanvas.jsx`): Professional image display with quality enhancement
- **Editor Context** (`src/context/EditorContext.jsx`): Centralized state management for image editing
- **Before/After Demo** (`src/components/BeforeAfterDemo.jsx`): Interactive comparison component

### **Processing Pipeline**

1. **File Validation**: Security checks and format validation
2. **Thumbnail Extraction**: EXIF thumbnail extraction with quality optimization
3. **RAW Processing**: Multi-strategy processing with fallback mechanisms
4. **Quality Enhancement**: Post-processing for optimal visual quality
5. **Caching**: LRU cache for performance optimization

### **Security Features**

- File signature validation
- Size limit enforcement (500MB max)
- Input sanitization
- Memory leak prevention
- Resource cleanup automation

## 🔧 Configuration

The RAW processor can be configured through the `CONFIG` object in `rawProcessor.js`:

```javascript
const CONFIG = {
  MAX_FILE_SIZE: 500 * 1024 * 1024,     // 500MB max file size
  MAX_THUMBNAIL_SIZE: 50 * 1024 * 1024, // 50MB max thumbnail
  PROCESSING_TIMEOUT: 30000,             // 30 seconds timeout
  MAX_RESOLUTION: { width: 4096, height: 4096 },
  CHUNK_SIZE: 1024 * 1024,              // 1MB chunks
  RETRY_ATTEMPTS: 3,
  CACHE_TTL: 5 * 60 * 1000              // 5 minutes cache TTL
};
```

## 📊 Performance Monitoring

The application includes comprehensive performance monitoring:

```javascript
// Get performance metrics
import { getPerformanceMetrics } from './utils/rawProcessor';

const metrics = getPerformanceMetrics();
console.log({
  processedFiles: metrics.processedFiles,
  averageProcessingTime: metrics.averageProcessingTime,
  successRate: metrics.successRate,
  cacheEfficiency: metrics.cacheEfficiency
});
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📚 API Reference

### **RAW Processing Functions**

- `processRAWFile(file, options)`: Main RAW processing function
- `isRawFormat(fileName)`: Check if file is RAW format
- `getRawFormatInfo(fileName)`: Get RAW format information
- `getRAWWorkflowRecommendation(file)`: Get processing recommendations

### **Cache Management**

- `getCacheStatistics()`: Get cache performance statistics
- `clearProcessingCache()`: Clear the processing cache
- `resetPerformanceMetrics()`: Reset performance counters

### **Batch Processing**

- `processBatchRAWFiles(files, options, onProgress)`: Process multiple files
- `healthCheck()`: System health validation
- `validateConfiguration()`: Configuration validation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📋 Supported RAW Formats

| Brand | Formats | Description |
|-------|---------|-------------|
| Canon | .cr2, .cr3, .crw | Canon RAW formats |
| Nikon | .nef, .nrw | Nikon Electronic Format |
| Sony | .arw, .srf, .sr2 | Sony Alpha RAW |
| Adobe | .dng | Digital Negative |
| Olympus | .orf | Olympus RAW Format |
| Panasonic | .rw2, .raw | Panasonic RAW |
| Pentax | .pef, .ptx | Pentax Electronic Format |
| Fujifilm | .raf | RAW Format |
| Samsung | .srw | Samsung RAW |
| Leica | .rwl | Leica RAW |
| Phase One | .iiq | Intelligent Image Quality |
| Hasselblad | .3fr | Hasselblad RAW |

## 🔒 Security

This application implements multiple security measures:

- **File Signature Validation**: Prevents malicious file uploads
- **Size Limits**: Protects against DoS attacks
- **Input Sanitization**: Validates all user inputs
- **Memory Management**: Prevents memory leaks and overconsumption
- **Error Boundaries**: Graceful error handling and recovery

## 📈 Performance Optimization

- **LRU Caching**: Intelligent cache management for processed images
- **Chunked Processing**: Memory-efficient file reading
- **Worker Threads**: Offload processing to prevent UI blocking
- **Lazy Loading**: Load components and images on demand
- **Code Splitting**: Optimize bundle size and loading times

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements**: WebAssembly support for advanced RAW processing features.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite team for the lightning-fast build tool
- Tailwind CSS for the utility-first CSS framework
- All contributors who helped make this project better

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/kishoretvk/RawImageEditor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kishoretvk/RawImageEditor/discussions)
- **Documentation**: [Wiki](https://github.com/kishoretvk/RawImageEditor/wiki)

---

**Built with ❤️ by the RAW Image Editor team**
