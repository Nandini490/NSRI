const getAuthHeaders = () => {
  const token = localStorage.getItem('nsri_token');
  if (!token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const createSnapshot = async (data = {}) => {
  const headers = getAuthHeaders();
  const response = await fetch('/api/v1/snapshots', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to capture snapshot');
  }

  return await response.json();
};

export const getSnapshots = async () => {
  const headers = getAuthHeaders();
  const response = await fetch('/api/v1/snapshots', {
    method: 'GET',
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    throw new Error('Failed to retrieve snapshots');
  }

  return await response.json();
};

export const getSnapshotById = async (snapshotId) => {
  const headers = getAuthHeaders();
  const response = await fetch(`/api/v1/snapshots/${snapshotId}`, {
    method: 'GET',
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch snapshot');
  }

  return await response.json();
};

export const deleteSnapshot = async (snapshotId) => {
  const headers = getAuthHeaders();
  const response = await fetch(`/api/v1/snapshots/${snapshotId}`, {
    method: 'DELETE',
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    throw new Error('Failed to delete snapshot');
  }

  return await response.json();
};

export const compareSnapshots = async (snapshotIdA, snapshotIdB) => {
  const headers = getAuthHeaders();
  const response = await fetch('/api/v1/snapshots/compare', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      snapshot_id_a: snapshotIdA,
      snapshot_id_b: snapshotIdB
    })
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to compare snapshots');
  }

  return await response.json();
};
