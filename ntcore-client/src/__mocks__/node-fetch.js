// Mock implementation of node-fetch
const nodeFetch = function() {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: {
      get: () => null,
      getSetCookie: () => []
    }
  });
};

// Add AbortSignal.timeout for Node.js environments that don't have it
if (!AbortSignal.timeout) {
  AbortSignal.timeout = (ms) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

export default nodeFetch;
