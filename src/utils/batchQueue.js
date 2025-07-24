// Simple async batch queue with concurrency limit
export async function processBatch(files, processFn, concurrency = 3) {
  let results = [];
  let idx = 0;
  let active = 0;

  return new Promise((resolve) => {
    const next = async () => {
      if (idx >= files.length && active === 0) {
        resolve(results);
        return;
      }
      while (active < concurrency && idx < files.length) {
        active++;
        const file = files[idx++];
        processFn(file).then(result => {
          results.push(result);
          active--;
          next();
        });
      }
    };
    next();
  });
}
