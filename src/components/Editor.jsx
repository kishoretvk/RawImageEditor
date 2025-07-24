// Editor.jsx
// Main editor component integrating sidebar and canvas
import { Link } from 'react-router-dom';

export default function Editor({ rawPixels, channelCount, originalBuffer }) {
  const [editGraph] = useState(new EditGraph());
  const [imageBuffer, setImageBuffer] = useState(originalBuffer);
  const [history, setHistory] = useState([{ imageBuffer: originalBuffer }]);
  const undoStack = useRef(new UndoStack());

  const addStep = (buffer) => {
    setHistory((prev) => [...prev, { imageBuffer: buffer }]);
    undoStack.current.push(buffer);
  };

  const handleWhiteBalance = ({ temp, tint }) => {
    editGraph.addNode(new WhiteBalanceNode(temp, tint));
    const newBuffer = editGraph.resolve(originalBuffer);
    setImageBuffer(newBuffer);
    addStep(newBuffer);
  };

  const handleCrop = ({ x, y, w, h }) => {
    editGraph.addNode(new CropNode({ x, y, w, h }));
    const newBuffer = editGraph.resolve(originalBuffer);
    setImageBuffer(newBuffer);
    addStep(newBuffer);
  };

  const handleReset = (orig) => {
    editGraph.nodes = [];
    setImageBuffer(orig);
    setHistory([{ imageBuffer: orig }]);
    undoStack.current.reset();
    undoStack.current.push(orig);
  };

  const handleUndo = () => {
    const prev = undoStack.current.undo();
    if (prev) setImageBuffer(prev);
  };

  const handleRedo = () => {
    const next = undoStack.current.redo();
    if (next) setImageBuffer(next);
  };

  const handleSaveSession = async () => {
    await saveSession({ history, imageBuffer });
  };

  const handleLoadSession = async () => {
    const session = await loadSession();
    if (session) {
      setHistory(session.history);
      setImageBuffer(session.imageBuffer);
    }
  };

  const handleExport = async ({ format, quality, filename }) => {
    // For MVP, export current imageBuffer
    const exported = await exportBatch([imageBuffer], quality);
    if (exported && exported[0]) {
      const blob = new Blob([exported[0]], { type: `image/${format}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Example plugin extension point
  usePluginExtension('onRender', imageBuffer);

  const handleCloudImport = (fileBuffer) => {
    // TODO: decode and set as originalBuffer
    setImageBuffer(fileBuffer);
    setHistory([{ imageBuffer: fileBuffer }]);
    undoStack.current.reset();
    undoStack.current.push(fileBuffer);
  };

  return (
    <HistoryContext.Provider value={{ history, addStep }}>
      <div className="flex editor-page">
        <header className="editor-header">
          <h1>Editor</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/settings">Settings</Link>
          </nav>
        </header>
        <EditorSidebar
          rawPixels={rawPixels}
          channelCount={channelCount}
          onWhiteBalance={handleWhiteBalance}
          onCrop={handleCrop}
          onReset={handleReset}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
        <main className="flex-1 bg-editor-bg">
          <SessionControls session={{ history, imageBuffer }} onSave={handleSaveSession} onLoad={handleLoadSession} />
          <ExportDialog onExport={handleExport} />
          <CloudPicker onImport={handleCloudImport} />
          <ImageCanvas imageData={imageBuffer} />
          <HistoryPanel history={history} />
        </main>
      </div>
    </HistoryContext.Provider>
  );
}
