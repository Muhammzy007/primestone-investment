// Session Manager to prevent role mixing
class SessionManager {
  constructor() {
    this.USER_KEY = 'primestone_user';
    this.TOKEN_KEY = 'primestone_token';
    this.ROLE_KEY = 'primestone_role';
  }

  // Set session for specific role
  setSession(user, token, role) {
    // Clear any existing session first
    this.clearSession();
    
    // Set new session with role-specific keys
    localStorage.setItem(`${this.USER_KEY}_${role}`, JSON.stringify(user));
    localStorage.setItem(`${this.TOKEN_KEY}_${role}`, token);
    localStorage.setItem(this.ROLE_KEY, role);
    
    // Also set a timestamp
    localStorage.setItem(`${this.ROLE_KEY}_timestamp`, Date.now().toString());
  }

  // Get session based on expected role
  getSession(expectedRole) {
    const userStr = localStorage.getItem(`${this.USER_KEY}_${expectedRole}`);
    const token = localStorage.getItem(`${this.TOKEN_KEY}_${expectedRole}`);
    const currentRole = localStorage.getItem(this.ROLE_KEY);
    
    // If role doesn't match expected, return null
    if (currentRole !== expectedRole) {
      return null;
    }
    
    if (userStr && token) {
      try {
        return {
          user: JSON.parse(userStr),
          token,
          role: expectedRole
        };
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  // Clear all sessions
  clearSession() {
    const roles = ['admin', 'user'];
    roles.forEach(role => {
      localStorage.removeItem(`${this.USER_KEY}_${role}`);
      localStorage.removeItem(`${this.TOKEN_KEY}_${role}`);
    });
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(`${this.ROLE_KEY}_timestamp`);
  }

  // Check if user is authenticated for a specific role
  isAuthenticated(role) {
    return this.getSession(role) !== null;
  }

  // Get current role
  getCurrentRole() {
    return localStorage.getItem(this.ROLE_KEY);
  }
}

export default new SessionManager();
