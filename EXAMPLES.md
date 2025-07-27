# RAW Processor API Examples

This document provides examples of how to use the RAW Image Editor's processing capabilities.

## Basic RAW Processing

```javascript
import { processRAWFile, isRawFormat } from './utils/rawProcessor';

// Check if file is RAW format
const handleFileUpload = async (file) => {
  if (!isRawFormat(file.name)) {
    console.log('Not a RAW file');
    return;
  }
  
  try {
    const result = await processRAWFile(file);
    console.log('Processing successful:', result);
    
    // Display the processed image
    const img = document.createElement('img');
    img.src = result.url;
    document.body.appendChild(img);
    
  } catch (error) {
    console.error('Processing failed:', error.message);
  }
};
```

## Batch Processing

```javascript
import { processBatchRAWFiles } from './utils/rawProcessor';

const handleBatchUpload = async (files) => {
  const rawFiles = files.filter(file => isRawFormat(file.name));
  
  const result = await processBatchRAWFiles(
    rawFiles,
    { quality: 'high' },
    (progress) => {
      console.log(`Processing: ${progress.current}/${progress.total} (${progress.percentage.toFixed(1)}%)`);
    }
  );
  
  console.log(`Successfully processed: ${result.summary.successful}/${result.summary.total} files`);
  
  // Handle results
  result.results.forEach((processedFile, index) => {
    console.log(`File ${index + 1}: ${processedFile.strategy} - ${processedFile.processingTime.toFixed(2)}ms`);
  });
  
  // Handle errors
  result.errors.forEach((error) => {
    console.error(`Failed to process ${error.file.name}: ${error.error}`);
  });
};
```

## Performance Monitoring

```javascript
import { getPerformanceMetrics, getCacheStatistics } from './utils/rawProcessor';

// Monitor performance
const monitorPerformance = () => {
  const metrics = getPerformanceMetrics();
  const cacheStats = getCacheStatistics();
  
  console.log('Performance Metrics:', {
    processedFiles: metrics.processedFiles,
    averageProcessingTime: `${metrics.averageProcessingTime.toFixed(2)}ms`,
    successRate: `${metrics.successRate.toFixed(1)}%`,
    cacheEfficiency: `${metrics.cacheEfficiency.toFixed(1)}%`
  });
  
  console.log('Cache Statistics:', {
    size: cacheStats.size,
    maxSize: cacheStats.maxSize,
    hitRate: `${cacheStats.hitRate.toFixed(1)}%`
  });
};
```

## Error Handling

```javascript
import { processRAWFile, RAWProcessingError } from './utils/rawProcessor';

const robustProcessing = async (file) => {
  try {
    const result = await processRAWFile(file, { 
      retryAttempts: 3,
      timeout: 30000 
    });
    
    return result;
    
  } catch (error) {
    if (error instanceof RAWProcessingError) {
      switch (error.code) {
        case 'FILE_TOO_LARGE':
          console.error('File exceeds maximum size limit');
          break;
        case 'INVALID_SIGNATURE':
          console.error('File appears to be corrupted or not a valid RAW file');
          break;
        case 'PROCESSING_TIMEOUT':
          console.error('Processing took too long and was cancelled');
          break;
        case 'NO_THUMBNAIL':
          console.error('No embedded thumbnail found in RAW file');
          break;
        default:
          console.error('Unknown processing error:', error.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    
    throw error;
  }
};
```

## React Component Integration

```jsx
import React, { useState, useCallback } from 'react';
import { processRAWFile, cleanupRAWResources } from '../utils/rawProcessor';

const RAWUploader = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const processedResult = await processRAWFile(file);
      setResult(processedResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (result) {
        cleanupRAWResources(result);
      }
    };
  }, [result]);

  return (
    <div>
      <input 
        type="file" 
        accept=".cr2,.cr3,.nef,.arw,.dng,.orf,.rw2,.pef,.raf,.srw"
        onChange={handleFileChange}
        disabled={processing}
      />
      
      {processing && <p>Processing RAW file...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      {result && (
        <div>
          <img src={result.url} alt="Processed RAW" />
          <p>Strategy: {result.strategy}</p>
          <p>Processing time: {result.processingTime.toFixed(2)}ms</p>
        </div>
      )}
    </div>
  );
};

export default RAWUploader;
```

## Health Check

```javascript
import { healthCheck } from './utils/rawProcessor';

const checkSystemHealth = async () => {
  const health = await healthCheck();
  
  console.log('System Status:', health.status);
  console.log('Features:', health.features);
  console.log('Performance:', health.performance);
  console.log('Configuration:', health.configuration);
  
  if (health.status === 'unhealthy') {
    console.error('System health check failed:', health.error);
  }
};

// Run health check periodically
setInterval(checkSystemHealth, 5 * 60 * 1000); // Every 5 minutes
```

## Configuration Validation

```javascript
import { validateConfiguration } from './utils/rawProcessor';

const checkConfiguration = () => {
  const validation = validateConfiguration();
  
  if (!validation.valid) {
    console.warn('Configuration issues detected:');
    validation.issues.forEach(issue => {
      console.warn(`- ${issue}`);
    });
  } else {
    console.log('Configuration is valid');
  }
  
  console.log('Current configuration:', validation.configuration);
};
```

## Custom Processing Options

```javascript
// Advanced processing with custom options
const advancedProcessing = async (file) => {
  const options = {
    quality: 'high',           // 'low', 'medium', 'high'
    extractThumbnail: true,    // Extract embedded thumbnail
    simulateProcessing: true,  // Fallback to simulation if needed
    enableCaching: true,       // Use LRU cache
    timeout: 45000,           // Custom timeout in ms
    retryAttempts: 5,         // Number of retry attempts
    forceRefresh: false       // Bypass cache
  };
  
  return await processRAWFile(file, options);
};
```

## Working with Different RAW Formats

```javascript
import { getRawFormatInfo, getRAWWorkflowRecommendation } from './utils/rawProcessor';

const analyzeRAWFile = (file) => {
  const formatInfo = getRawFormatInfo(file.name);
  const recommendation = getRAWWorkflowRecommendation(file);
  
  if (formatInfo) {
    console.log(`Detected: ${formatInfo.brand} ${formatInfo.description}`);
  }
  
  if (recommendation.supported) {
    console.log('Processing capabilities:', recommendation.capabilities);
    console.log('Recommendations:', recommendation.recommendations);
  } else {
    console.log('Format not supported:', recommendation.message);
  }
};
```

For more examples and advanced usage, see the [component implementations](../src/components/) in the source code.
