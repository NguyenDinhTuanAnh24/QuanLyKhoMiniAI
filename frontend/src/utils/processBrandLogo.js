export const processBrandLogo = (file, options = {}) => {
  const {
    targetSize = 512,
    safePadding = 0.1, // 10% safe padding
    alphaThreshold = 10,
    trimWhite = false
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return reject(new Error('Canvas 2D context not supported'));
      }

      const { width, height } = img;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;
      let hasContent = false;

      // Find bounding box
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          let isContent = false;
          if (a > alphaThreshold) {
            isContent = true;
            // Optionally treat near-white as background if trimWhite is enabled
            if (trimWhite && r > 245 && g > 245 && b > 245) {
               isContent = false;
            }
          }

          if (isContent) {
            hasContent = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (!hasContent) {
        // Empty or fully transparent/white image, return original
        return resolve(file);
      }

      const contentWidth = maxX - minX + 1;
      const contentHeight = maxY - minY + 1;

      // Create destination square canvas
      const destCanvas = document.createElement('canvas');
      destCanvas.width = targetSize;
      destCanvas.height = targetSize;
      const destCtx = destCanvas.getContext('2d');

      // Calculate scale to fit content into target size with safe padding
      const maxContentSize = Math.max(contentWidth, contentHeight);
      const paddingPixels = targetSize * safePadding;
      const availableSize = targetSize - (paddingPixels * 2);
      
      const scale = availableSize / maxContentSize;

      const scaledWidth = contentWidth * scale;
      const scaledHeight = contentHeight * scale;

      // Calculate center position
      const dx = (targetSize - scaledWidth) / 2;
      const dy = (targetSize - scaledHeight) / 2;

      // Draw the cropped area onto the new canvas
      destCtx.drawImage(
        canvas,
        minX, minY, contentWidth, contentHeight, // Source crop
        dx, dy, scaledWidth, scaledHeight // Destination
      );

      // Convert to file
      destCanvas.toBlob((blob) => {
        if (!blob) {
          return reject(new Error('Failed to create blob'));
        }
        // Maintain original filename but change extension to png
        const originalName = file.name || 'logo.png';
        const newName = originalName.replace(/\.[^/.]+$/, "") + "_processed.png";
        
        const processedFile = new File([blob], newName, {
          type: 'image/png',
          lastModified: Date.now(),
        });
        resolve(processedFile);
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for processing'));
    };

    img.src = objectUrl;
  });
};
