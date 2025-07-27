// Demo script to showcase the new components
console.log('Raw Image Editor Demo');

// Function to initialize demo
function initDemo() {
  console.log('Initializing demo components...');
  
  // Check if required components are available
  if (typeof BeforeAfterDemo !== 'undefined') {
    console.log('BeforeAfterDemo component is available');
  }
  
  if (typeof ImageSlider !== 'undefined') {
    console.log('ImageSlider component is available');
  }
  
  if (typeof BatchWorkflowProcessor !== 'undefined') {
    console.log('BatchWorkflowProcessor component is available');
  }
  
  console.log('Demo initialization complete');
}

// Run demo initialization when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDemo);
} else {
  initDemo();
}

export { initDemo };
