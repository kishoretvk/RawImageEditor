import React, { useContext, useState } from 'react';
import BasicAdjustmentsPanel from '../components/editorPanels/BasicAdjustmentsPanel';
import ColorAdjustmentsPanel from '../components/editorPanels/ColorAdjustmentsPanel';
import SharpnessPanel from '../components/editorPanels/SharpnessPanel';
import EffectsPanel from '../components/editorPanels/EffectsPanel';
import GeometryPanel from '../components/editorPanels/GeometryPanel';
import AdvancedPanel from '../components/editorPanels/AdvancedPanel';
import SmoothPanelContainer from '../components/SmoothPanelContainer';
import { EditorContext, EditorProvider } from '../context/EditorContext';
import ImageCanvas from '../components/ImageCanvas';
import UndoRedoPanel from '../components/UndoRedoPanel';
import ZoomPanControl from '../components/ZoomPanControl';
import ExifPanel from '../components/ExifPanel';
import { decodeRawWASM } from '../utils/wasm/libraw';
import natureImg from '../assets/images/nature-horizontal.jpg';
import northernlightsImg from '../assets/images/northernlights.jpg';
import elephantImg from '../assets/images/elephant-hotirontal.jpg';
import lavaImg from '../assets/images/lava.jpg';
import treeImg from '../assets/images/tree-horozontal.jpg';

const filterImages = {
  basic: natureImg,
  color: northernlightsImg,
  sharpness: elephantImg,
  effects: lavaImg,
  geometry: treeImg,
};

const Editor = ({ imageFile, metadata }) => {
  // imageFile: raw file object, metadata: EXIF
  const { state, dispatch } = useContext(EditorContext);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [decodedImage, setDecodedImage] = useState(null);
  const [activePanel, setActivePanel] = useState('basic');
  const [showOriginal, setShowOriginal] = useState(true);

  // Decode RAW file on mount
  React.useEffect(() => {
    if (imageFile) {
      decodeRawWASM(imageFile).then(res => setDecodedImage(res.jpegPreview));
    }
  }, [imageFile]);

  const handleEdit = (edit) => {
    dispatch({ type: 'APPLY_EDIT', payload: edit });
  };
  const handleUndo = () => dispatch({ type: 'UNDO' });
  const handleRedo = () => dispatch({ type: 'REDO' });
  const handleZoom = (z) => setZoom(z);
  const handlePan = (p) => setPan(p);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-300 text-black flex flex-col items-center py-20">
      <h1 className="text-4xl font-bold mb-8">Edit Photo</h1>
      <div className="flex gap-8">
        <div className="bg-white bg-opacity-90 rounded-2xl p-6 shadow-2xl w-[500px]">
          {/* Smooth Panel Container */}
          <SmoothPanelContainer
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            minHeight="300px"
            panels={{
              basic: {
                title: 'Basic',
                component: (
                  <BasicAdjustmentsPanel 
                    adjustments={state.basic || { exposure: 1, contrast: 1, highlights: 1, shadows: 1, whites: 1, blacks: 1, gamma: 1 }} 
                    onChange={adj => dispatch({type:'SET_BASIC', payload:adj})} 
                  />
                )
              },
              color: {
                title: 'Color',
                component: (
                  <ColorAdjustmentsPanel 
                    colorAdjustments={state.color} 
                    onChange={adj => dispatch({type:'SET_COLOR', payload:adj})} 
                  />
                )
              },
              sharpness: {
                title: 'Sharpness',
                component: (
                  <SharpnessPanel 
                    sharpness={state.sharpness} 
                    onChange={adj => dispatch({type:'SET_SHARPNESS', payload:adj})} 
                  />
                )
              },
              effects: {
                title: 'Effects',
                component: (
                  <EffectsPanel 
                    effects={state.effects} 
                    onChange={adj => dispatch({type:'SET_EFFECTS', payload:adj})} 
                  />
                )
              },
              geometry: {
                title: 'Geometry',
                component: (
                  <GeometryPanel 
                    geometry={state.geometry} 
                    onChange={adj => dispatch({type:'SET_GEOMETRY', payload:adj})} 
                  />
                )
              },
              advanced: {
                title: 'Advanced',
                component: (
                  <AdvancedPanel 
                    advanced={state.advanced} 
                    onChange={adj => dispatch({type:'SET_ADVANCED', payload:adj})} 
                  />
                )
              }
            }}
          />
          
          {/* Format Selector & Download */}
          <div className="flex flex-wrap gap-4 mt-8">
            <select className="bg-blue-500 text-black font-bold px-6 py-3 rounded-xl shadow-lg border-2 border-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-200">
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="raw">RAW</option>
            </select>
            <button className="bg-blue-700 text-black font-bold px-6 py-3 rounded-xl shadow border-2 border-blue-800 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-400 transition duration-200">
              Download
            </button>
            <button className="bg-blue-500 text-black font-bold px-6 py-3 rounded-xl shadow border-2 border-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-200">
              Save
            </button>
          </div>
        </div>
        {/* Side-by-side Preview */}
        <div className="flex flex-col gap-4 w-[700px]">
          <div className="flex gap-4 items-center">
            <div className={`rounded-2xl shadow-lg bg-white bg-opacity-80 border border-blue-200 ${showOriginal ? 'w-1/2' : 'hidden'}`}>
              <ImageCanvas image={decodedImage} edits={[]} zoom={zoom} pan={pan} />
              <div className="text-center text-xs font-bold text-blue-700">Original</div>
            </div>
            <div className={`rounded-2xl shadow-lg bg-white bg-opacity-80 border border-blue-200 ${showOriginal ? 'w-1/2' : 'w-full'}`}>
              <ImageCanvas image={decodedImage} edits={state.edits} zoom={zoom} pan={pan} />
              <div className="text-center text-xs font-bold text-blue-700">Edited</div>
            </div>
            <button className="ml-4 px-3 py-2 rounded-xl bg-blue-500 text-black font-bold border-2 border-blue-700 shadow hover:bg-blue-600 transition duration-200" onClick={()=>setShowOriginal(!showOriginal)}>
              {showOriginal ? 'Minimize Original' : 'Show Original'}
            </button>
          </div>
          <ZoomPanControl onZoom={handleZoom} onPan={handlePan} />
          <UndoRedoPanel canUndo={state.historyIndex > 0} canRedo={state.historyIndex < state.history.length - 1} onUndo={handleUndo} onRedo={handleRedo} />
          <ExifPanel metadata={metadata} />
        </div>
      </div>
    </div>
  );
};

const EditorPage = (props) => (
  <EditorProvider>
    <Editor {...props} />
  </EditorProvider>
);

export default EditorPage;
