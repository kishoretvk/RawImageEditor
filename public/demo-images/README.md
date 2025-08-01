# Demo Images

This directory contains demo images for the Before/After comparison features.

## Required Images

The following images are needed for the demo functionality:

### RAW Processing Demo
- `raw-before.jpg` - Unprocessed RAW image showing the original state
- `raw-after.jpg` - Professionally processed RAW image with enhanced details and colors

### Color Grading Demo
- `color-before.jpg` - Image before color grading
- `color-after.jpg` - Image after professional color grading with LUTs

### Portrait Enhancement Demo
- `portrait-before.jpg` - Portrait before retouching
- `portrait-after.jpg` - Portrait after professional retouching

### Landscape Enhancement Demo
- `landscape-before.jpg` - Landscape before processing
- `landscape-after.jpg` - Landscape after HDR and detail enhancement

## Image Specifications

- **Format**: JPG for web compatibility
- **Size**: 800x600 pixels recommended
- **Quality**: High quality (80-90%)
- **File size**: Under 500KB each for optimal loading

## Usage

These images are automatically loaded by the `BeforeAfterDemo` component when users visit the demo page. The images showcase the capabilities of the RAW processing engine.

## Adding New Demo Images

To add new demo comparisons:

1. Add the before/after image pairs to this directory
2. Update the `demoImages` array in `src/components/BeforeAfterDemo.jsx`
3. Ensure consistent naming pattern: `{type}-before.jpg` and `{type}-after.jpg`
