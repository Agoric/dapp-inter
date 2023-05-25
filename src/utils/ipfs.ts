export const ipfsHashLength = 59;

export const currentlyVisitedHash = () => {
  const firstChunk = window.location.hostname.split('.')[0];

  if (firstChunk.length !== ipfsHashLength) {
    return undefined;
  }

  return firstChunk;
};
