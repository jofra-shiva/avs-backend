const User = require('../models/User');
const Employee = require('../models/Employee');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: 'Server Error during registration: ' + error.message });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    username = username.trim();
    console.log(`Login attempt for: ${username}`);

    const employee = await Employee.findOne({ username });

    if (!employee) {
      console.log(`Login failed: Employee ${username} not found in database.`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await employee.matchPassword(password);
    console.log(`Password match result for ${username}: ${isMatch}`);

    if (isMatch) {
      console.log(`✅ Login SUCCESS for ${username}`);
      
      // Generate JWT with employeeId, role, modules
      const token = generateToken({
        id: employee._id,
        role: employee.role,
        modules: employee.modules
      });

      res.json({
        _id: employee._id,
        name: employee.name,
        username: employee.username,
        role: employee.role,
        modules: employee.modules,
        token: token,
      });
    } else {
      console.log(`❌ Login FAILED: Password mismatch for ${username}`);
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login Technical Error:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
