// HistoryContext.jsx
// Context for managing undo stack and history
import { createContext } from 'react';
const HistoryContext = createContext({ history: [], addStep: () => {} });
export default HistoryContext;
