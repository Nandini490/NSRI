export const fetchExternalContext = async (lat = null, lon = null) => {
  const token = localStorage.getItem('nsri_token');
  if (!token) return null;

  try {
    let url = '/api/v1/external/context';
    if (lat !== null && lon !== null) {
      url += `?latitude=${lat}&longitude=${lon}`;
    }

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch external environmental context:', err);
    return null;
  }
};
