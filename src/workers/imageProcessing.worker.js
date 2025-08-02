self.onmessage = async (event) => {
  const { file } = event.data;

  // Simulate RAW to JPEG conversion
  // Remove any artificial delay; resolve immediately with available preview.
  const convertRawToJpeg = (file) => {
    return Promise.resolve({
      ...file,
      status: 'completed',
      preview: file.preview // In a real app, this becomes a generated JPEG preview
    });
  };

  const result = await convertRawToJpeg(file);
  self.postMessage(result);
};
