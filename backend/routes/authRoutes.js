// Add this to the generateToken function
const generateToken = (userId, role, username) => {
  return jwt.sign({ userId, role, username }, JWT_SECRET, { expiresIn: '7d' });
};

// Update the login response to include username in token
// In the login route, change:
const token = generateToken(user.id, user.role, user.username);

// In the register route, change:
const token = generateToken(newUser.id, 'user', username);
