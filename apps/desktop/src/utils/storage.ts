// Storage utilities
export async function getStoredData(key: string): Promise<any> {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting stored data:', error);
    return null;
  }
}

export async function setStoredData(key: string, value: any): Promise<void> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting stored data:', error);
  }
}