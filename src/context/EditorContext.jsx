import React, { createContext, useReducer } from 'react';

const initialState = {
  selectedImage: null,
  edits: [],
  history: [],
  historyIndex: -1,
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
        return { ...state, edits: state.history[state.historyIndex + 1], historyIndex: state.historyIndex + 1 };
      }
      return state;
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
