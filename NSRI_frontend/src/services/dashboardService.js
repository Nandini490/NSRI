export const fetchDashboardData = async () => {
  const token = localStorage.getItem('nsri_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/v1/nsri/latest', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch NSRI data');
  }

  const data = await response.json();
  return data;
};

export const fetchHistory = async (days = 7) => {
  const token = localStorage.getItem('nsri_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`/api/v1/nsri/history?days=${days}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch history data');
  }

  const data = await response.json();
  return data;
};
