import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';

const VirtualizedGallery = ({ images }) => (
  <Grid
    columnCount={4}
    columnWidth={200}
    height={600}
    rowCount={Math.ceil(images.length / 4)}
    rowHeight={200}
    width={820}
  >
    {({ columnIndex, rowIndex, style }) => {
      const idx = rowIndex * 4 + columnIndex;
      if (!images[idx]) return null;
      return (
        <div style={style} key={idx} className="p-2">
          <img src={images[idx].src} alt="Gallery" className="rounded shadow w-full h-full object-cover" />
        </div>
      );
    }}
  </Grid>
);

export default VirtualizedGallery;
