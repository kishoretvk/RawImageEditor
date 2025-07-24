import JSZip from 'jszip';

export async function downloadAsZip(files) {
  const zip = new JSZip();
  files.forEach((item, idx) => {
    if (item.after) {
      zip.file(item.file.name.replace(/\.[^/.]+$/, '.jpg'), fetch(item.after).then(r => r.blob()));
    }
  });
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = 'batch_images.zip';
  link.click();
  URL.revokeObjectURL(link.href);
}
