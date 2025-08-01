self.onmessage = async (event) => {
  const { file } = event.data;

  // Simulate RAW to JPEG conversion
  const convertRawToJpeg = (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...file,
          status: 'completed',
          preview: file.preview, // In a real app, this would be the JPEG preview
        });
      }, 2000);
    });
  };

  const result = await convertRawToJpeg(file);
  self.postMessage(result);
};
