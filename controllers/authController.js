const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

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

// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const searchRegex = new RegExp(`^${email.trim()}$`, 'i');
    const employee = await Employee.findOne({
      $or: [{ email: searchRegex }, { username: searchRegex }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry (15 minutes) on the employee document
    employee.resetPasswordToken = resetTokenHash;
    employee.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await employee.save({ validateBeforeSave: false });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1b5e20, #2e7d32); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">AVSECO</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Management Portal</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #1b5e20; margin: 0 0 16px; font-size: 22px;">Password Reset Request</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">Hello <strong>${employee.name}</strong>,</p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #1b5e20; color: #ffffff; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.6;">This link will expire in <strong>15 minutes</strong>. If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">AVSECO Management System &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: employee.email || email,
      subject: 'AVSECO - Password Reset Request',
      html: htmlContent,
    });

    res.json({ message: 'Password reset link has been sent to your email' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please provide a new password' });
    }

    if (password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    // Hash the incoming token and find the employee
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const employee = await Employee.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!employee) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Set new password (pre-save hook will hash it)
    employee.password = password;
    employee.resetPasswordToken = undefined;
    employee.resetPasswordExpire = undefined;
    employee.isFirstLogin = false;
    await employee.save();

    res.json({ message: 'Password has been reset successfully! You can now login.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  updateProfilePassword,
  updateMe,
  getMe,
  forgotPassword,
  resetPassword
};
