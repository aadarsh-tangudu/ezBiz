export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    ...options.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
  
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    // Session token expired or became invalid. Clear state and trigger a refresh.
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }
  
  return res;
};
