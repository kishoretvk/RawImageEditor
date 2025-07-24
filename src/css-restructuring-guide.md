# CSS Restructuring Guide for RAW Converter

This document provides instructions for organizing the CSS files in the RAW Converter project.

## New CSS Structure

We've created a modular CSS structure with separate files for different parts of the application:

1. `global.css` - Base styles, resets, and utilities (already exists)
2. `navigation.css` - Styles for navigation bars and menus (newly created)
3. `landing.css` - Styles for the landing page and upload UI (newly created)
4. `editor.css` - Styles specific to the editor page (newly created)
5. `lightroom-theme.css` - Special Lightroom-inspired theme (already exists)

## Implementation Steps

### 1. Update your main.jsx or App.jsx to import the right CSS files

```jsx
// In main.jsx or App.jsx
import './index.css'; // For Tailwind
import './styles/global.css';
import './styles/navigation.css';
// Other CSS files will be imported by their respective components
```

### 2. Import page-specific CSS in their components

```jsx
// In EditorPage.jsx or similar
import '../styles/editor.css';

// In LandingPage.jsx
import '../styles/landing.css';
```

### 3. Clean Up CSS Conflicts

We should remove any duplicate or conflicting styles:

- Remove editor-specific styles from `global.css`
- Remove navigation styles from `pages.css`
- Either keep using `lightroom-theme.css` OR use our new `editor.css`, not both

### 4. Use CSS Classes Consistently

The new CSS files use these naming conventions:
- Editor page: `.editor-*` (e.g., `.editor-container`, `.editor-sidebar`, `.editor-panel`)
- Navigation: `.main-navigation`, `.nav-*`
- Landing: `.landing-*`, `.upload-*`

## Benefits

- Smaller CSS per page (better performance)
- Easier to maintain (styles are where you expect them)
- Reduced conflicts between pages
- Better organization and readability

## Example

See `EditorLayout.example.jsx` for how to use the new CSS classes with your existing components.
