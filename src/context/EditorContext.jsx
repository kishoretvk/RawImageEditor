import React, { createContext, useReducer } from 'react';

const initialState = {
  selectedImage: null,
  edits: [],
  history: [],
  historyIndex: -1,
  // Add detailed adjustment states
  basic: { exposure: 1, contrast: 1, highlights: 1, shadows: 1, whites: 1, blacks: 1, gamma: 1 },
  color: { temperature: 6500, tint: 0, vibrance: 0, saturation: 1 },
  curves: { points: [{x: 0, y: 0}, {x: 255, y: 255}] },
  sharpness: { amount: 0, radius: 1, detail: 25 },
  effects: { vignette: 0, grain: 0 },
  geometry: { rotation: 0, scale: 1, crop: { x: 0, y: 0, width: 1, height: 1 } },
  advanced: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_IMAGE':
      return { ...state, selectedImage: action.payload };
    case 'APPLY_EDIT':
      // If new edit after undo, discard redo history
      const baseHistory = state.history.slice(0, state.historyIndex + 1);
      const newEdits = [...state.edits, action.payload];
      const newHistory = [...baseHistory, newEdits];
      return { ...state, edits: newEdits, history: newHistory, historyIndex: newHistory.length - 1 };
    case 'UNDO':
      if (state.historyIndex > 0) {
        return { ...state, edits: state.history[state.historyIndex - 1], historyIndex: state.historyIndex - 1 };
      }
      return state;
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        return { ...state, ...state.history[state.historyIndex + 1], historyIndex: state.historyIndex + 1 };
      }
      return state;
    case 'LOAD_STATE':
      // Replace the current state with the preset's state, but keep history for undo
      const newState = { ...state, ...action.payload };
      const newHistoryFromLoad = [...state.history.slice(0, state.historyIndex + 1), newState];
      return { ...newState, history: newHistoryFromLoad, historyIndex: newHistoryFromLoad.length - 1 };
    case 'RESET_STATE':
      const resetState = { ...initialState, selectedImage: state.selectedImage };
      const newHistoryFromReset = [...state.history.slice(0, state.historyIndex + 1), resetState];
      return { ...resetState, history: newHistoryFromReset, historyIndex: newHistoryFromReset.length - 1 };
    case 'SET_BASIC':
      return { ...state, basic: action.payload };
    case 'SET_COLOR':
      return { ...state, color: action.payload };
    case 'SET_SHARPNESS':
      return { ...state, sharpness: action.payload };
    case 'SET_EFFECTS':
      return { ...state, effects: action.payload };
    case 'SET_GEOMETRY':
      return { ...state, geometry: action.payload };
    case 'SET_ADVANCED':
      return { ...state, advanced: action.payload };
    case 'SET_CURVES':
      return { ...state, curves: action.payload };
    default:
      return state;
  }
}

export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
};
