export async function callFn(url: string, method = 'POST', body?: any) {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json().catch(() => ({}));
    logResult({ ok: res.ok, status: res.status, json });
    return { ok: res.ok, status: res.status, json };
  } catch (error) {
    console.error('Error occurred while calling the API:', error);
    logResult({ ok: false, status: 'Network error', json: {} });
    return { ok: false, status: 'Network error', json: {} };
  }
}

// Example log function to manage state
function logResult(result: { ok: boolean, status: string | number, json: any }) {
  // Implement your logic to push the result to Vue/React state or console.log
  // For example, you might use a Redux action or Vuex mutation
  console.log('API Call Result:', result);
}

