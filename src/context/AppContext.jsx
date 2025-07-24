import React, { createContext, useReducer } from 'react';

const initialState = {
  queue: [],
  settings: { quality: 80, format: 'jpeg', resize: 0 },
  notifications: [],
  history: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, action.payload] };
    case 'REMOVE_FROM_QUEUE':
      return { ...state, queue: state.queue.filter(f => f.id !== action.payload) };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter((_, i) => i !== action.payload) };
    case 'ADD_TO_HISTORY':
      return { ...state, history: [...state.history, action.payload] };
    default:
      return state;
  }
}

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
