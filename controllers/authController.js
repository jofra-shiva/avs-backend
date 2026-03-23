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

    const searchRegex = new RegExp(`^${username}$`, 'i');
    let employee = await Employee.findOne({ 
      $or: [
        { username: searchRegex }, 
        { email: searchRegex }
      ]
    });

    // --- SELF-HEAL MIGRATION LOGIC ---
    if (!employee || !employee.password) {
      const legacyUser = await User.findOne({ email: searchRegex });
      
      if (legacyUser) {
        console.log(`Self-Heal: Found legacy user ${username} with role ${legacyUser.role}. Migrating...`);
        const isAdmin = legacyUser.role && legacyUser.role.toLowerCase() === 'admin';
        const adminModules = ["dashboard", "stock", "products", "production", "employees", "attendance", "clients", "sales", "reports"];

        if (!employee) {
          employee = await Employee.create({
            name: legacyUser.name,
            email: legacyUser.email,
            username: legacyUser.email,
            password: legacyUser.password,
            role: isAdmin ? 'admin' : 'employee',
            department: isAdmin ? 'Management' : 'Others',
            modules: isAdmin ? adminModules : []
          });
        } else {
          employee.password = legacyUser.password;
          employee.role = isAdmin ? 'admin' : 'employee';
          if (isAdmin) employee.modules = adminModules;
          await employee.save();
        }
      }
    }

    if (!employee) {
      console.log(`Login failed: No account found for "${username}"`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    console.log(`Employee found: ${employee.name} (Role: ${employee.role}, HasPassword: ${!!employee.password})`);

    const isMatch = await employee.matchPassword(password);
    console.log(`Password match result for ${username}: ${isMatch}`);

    if (isMatch) {
      console.log(`✅ Login SUCCESS for ${username}`);
      
      // Generate JWT with employeeId, role, modules
      const token = generateToken({
        id: employee._id,
        role: employee.role,
        modules: employee.modules,
        isFirstLogin: employee.isFirstLogin
      });

      res.json({
        _id: employee._id,
        name: employee.name,
        username: employee.username,
        role: employee.role,
        modules: employee.modules,
        isFirstLogin: employee.isFirstLogin,
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

const updateProfilePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const employee = await Employee.findById(req.employee._id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Verify old password
    const isMatch = await employee.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    employee.password = newPassword;
    employee.isFirstLogin = false;
    await employee.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password after first login (Forced)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const employee = await Employee.findById(req.employee._id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.password = newPassword;
    employee.isFirstLogin = false;
    await employee.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id).select('-password');
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update current user profile info (name, phone, address, etc.)
// @route   PUT /api/auth/profile
// @access  Private
const updateMe = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Explicitly update only allowed fields
    if (req.body.name) employee.name = req.body.name;
    if (req.body.email) employee.email = req.body.email;
    if (req.body.phone) employee.phone = req.body.phone;
    if (req.body.address) employee.address = req.body.address;
    if (req.body.avatar) employee.avatar = req.body.avatar;
    if (req.body.dob) employee.dob = req.body.dob;

    await employee.save();
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  updateProfilePassword,
  updateMe,
  getMe
};
