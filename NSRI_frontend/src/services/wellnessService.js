export const saveMoodCheckIn = async (data) => {
  const token = localStorage.getItem('nsri_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/v1/wellness/mood', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to save mood check-in');
  }

  return await response.json();
};

export const getRecentMoodCheckIns = async () => {
  const token = localStorage.getItem('nsri_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/v1/wellness/mood/recent', {
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
    throw new Error('Failed to fetch recent mood check-ins');
  }

  return await response.json();
};

const makeAuthPost = async (url, data) => {
  const token = localStorage.getItem('nsri_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save entry');
  }
  return await response.json();
};

const makeAuthGet = async (url) => {
  const token = localStorage.getItem('nsri_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('nsri_token');
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return await response.json();
};

export const saveWaterEntry = (amount_ml) => makeAuthPost('/api/v1/wellness/water', { amount_ml });
export const getTodaysWater = () => makeAuthGet('/api/v1/wellness/water/today');

export const saveCaffeineEntry = (data) => makeAuthPost('/api/v1/wellness/caffeine', data);
export const getTodaysCaffeine = () => makeAuthGet('/api/v1/wellness/caffeine/today');

export const saveExerciseEntry = (data) => makeAuthPost('/api/v1/wellness/exercise', data);
export const getTodaysExercise = () => makeAuthGet('/api/v1/wellness/exercise/today');
