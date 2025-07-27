import React, { createContext, useContext, useReducer } from 'react';

// Initial curve state
const initialCurveState = {
  curveRgb: [[0, 0], [1, 1]],
  curveR: [[0, 0], [1, 1]],
  curveG: [[0, 0], [1, 1]],
  curveB: [[0, 0], [1, 1]],
  curveLuminance: [[0, 0], [1, 1]],
};

// Curve reducer
const curveReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_CURVE':
      return {
        ...state,
        [action.channel]: action.points,
      };
    case 'RESET_CURVE':
      return {
        ...state,
        [action.channel]: [[0, 0], [1, 1]],
      };
    case 'RESET_ALL_CURVES':
      return initialCurveState;
    default:
      return state;
  }
};

// Create context
const CurveContext = createContext();

// Provider component
export const CurveProvider = ({ children }) => {
  const [curves, dispatch] = useReducer(curveReducer, initialCurveState);

  const updateCurve = (channel, points) => {
    dispatch({ type: 'UPDATE_CURVE', channel, points });
  };

  const resetCurve = (channel) => {
    dispatch({ type: 'RESET_CURVE', channel });
  };

  const resetAllCurves = () => {
    dispatch({ type: 'RESET_ALL_CURVES' });
  };

  return (
    <CurveContext.Provider value={{ curves, updateCurve, resetCurve, resetAllCurves }}>
      {children}
    </CurveContext.Provider>
  );
};

// Custom hook to use curve context
export const useCurve = () => {
  const context = useContext(CurveContext);
  if (!context) {
    throw new Error('useCurve must be used within a CurveProvider');
  }
  return context;
};

export default CurveContext;
