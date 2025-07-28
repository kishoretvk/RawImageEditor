# RawConverter Pro - Professional RAW Image Editor

A browser-based professional RAW image editing application with advanced batch processing capabilities, built entirely with JavaScript and WebAssembly.

## Features

### 📸 Professional RAW Processing
- Support for all major RAW formats (CR2, NEF, ARW, DNG, etc.)
- Embedded thumbnail extraction for instant previews
- Simulated RAW processing for browsers without WebAssembly
- Privacy-first processing (all operations happen in-browser)

### 🎨 Advanced Editing Tools
- Professional-grade adjustments:
  - Exposure, contrast, highlights, shadows
  - Whites, blacks, clarity, vibrance, saturation
  - Temperature and tint (white balance)
  - Tone curve editing
  - HSL/Color adjustments
- Non-destructive editing with edit history
- Preset management system for saving and applying editing settings

### ⚡ Batch Workflow Processing
- Create custom processing workflows
- Apply presets to multiple images simultaneously
- Convert RAW files to JPEG with quality enhancement
- Download processed images as a ZIP archive

### 📱 Cross-Platform Compatibility
- Works on desktop, tablet, and mobile devices
- Touch-optimized controls for mobile editing
- Responsive design for all screen sizes
- Progressive Web App (PWA) support for offline use

### 🔧 Technical Features
- WebAssembly acceleration for performance
- Canvas-based image processing
- Efficient memory management with LRU caching
- Performance monitoring and optimization
- Modern React architecture with hooks

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/rawconverter-pro.git

# Navigate to the project directory
cd rawconverter-pro

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Building for Production
```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Usage

### Editing Images
1. Navigate to the Editor page
2. Upload a RAW or standard image file
3. Use the professional editing tools to adjust your image
4. Save your edits as a preset for future use
5. Export the final image in your preferred format

### Batch Processing
1. Go to the Workflow page
2. Create a new workflow or select an existing one
3. Upload multiple images
4. Configure processing options (format conversion, preset application)
5. Process all images with a single click
6. Download the processed images as a ZIP archive

### Preset Management
1. Create presets from your favorite editing settings
2. Save presets with descriptive names
3. Apply presets to single images or batches
4. Organize and manage your preset library

## Architecture

### Core Components
- **EnhancedImageCanvas**: Main image processing component with professional filters
- **BatchWorkflowProcessor**: Handles batch processing with customizable workflows
- **PresetManager**: Manages saving, loading, and applying editing presets
- **RAWProcessor**: Handles RAW file processing with multiple fallback strategies

### Technical Stack
- React with hooks for UI components
- Canvas API for image processing
- WebAssembly for performance-critical operations
- LocalStorage for client-side data persistence
- Tailwind CSS for styling
- Vite for build tooling

## Performance Optimization

### Caching
- LRU cache for processed images to reduce reprocessing
- Browser caching for static assets
- Memory management for large image files

### WebAssembly
- Accelerated image processing operations
- Fallback to JavaScript for browsers without WebAssembly support
- Efficient memory usage with typed arrays

### Responsive Design
- Adaptive UI for different screen sizes
- Touch-optimized controls for mobile devices
- Progressive enhancement for modern browsers

## Browser Support

| Browser | Support Level | Notes |
|---------|---------------|-------|
| Chrome  | Full | Recommended |
| Firefox | Full | Recommended |
| Safari  | Full | Recommended |
| Edge    | Full | Recommended |
| Mobile Browsers | Partial | Touch-optimized but limited by device capabilities |

## Privacy & Security

- All image processing happens in the browser
- No images are uploaded to any server
- Data is stored locally in the browser (LocalStorage)
- No tracking or analytics by default

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who have helped build this project
- Inspired by professional photo editing software like Adobe Lightroom and Capture One
- Built with modern web technologies for maximum performance and compatibility

## Support

For support, please open an issue on GitHub or contact the development team.
