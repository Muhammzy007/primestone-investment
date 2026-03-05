import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('blue');

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const { darkMode: savedDark, primaryColor: savedColor } = JSON.parse(savedTheme);
      setDarkMode(savedDark);
      setPrimaryColor(savedColor);
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify({ darkMode, primaryColor }));
    
    // Apply theme classes to body
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode, primaryColor]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const changePrimaryColor = (color) => {
    setPrimaryColor(color);
  };

  // Color variations based on primary color
  const colors = {
    blue: {
      primary: '#3b82f6',
      light: '#93c5fd',
      dark: '#1d4ed8',
      gradient: 'from-blue-500 to-blue-700'
    },
    indigo: {
      primary: '#6366f1',
      light: '#a5b4fc',
      dark: '#4f46e5',
      gradient: 'from-indigo-500 to-indigo-700'
    },
    purple: {
      primary: '#8b5cf6',
      light: '#c4b5fd',
      dark: '#7c3aed',
      gradient: 'from-purple-500 to-purple-700'
    }
  };

  const currentColors = colors[primaryColor] || colors.blue;

  const value = {
    darkMode,
    primaryColor,
    currentColors,
    toggleDarkMode,
    changePrimaryColor,
    colors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
