const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Building = require('../models/Building');
const { normalizePhoneNumber, validateEgyptianPhone } = require('../utils/phoneUtils');
const { auth, manager } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, password, buildingId, unit, ownerType, idCardImage, ownershipProof, profilePic } = req.body;

    // Validate input
    if (!fullName || !phone || !password) {
      return res.status(400).json({ error: 'الاسم الكامل ورقم الهاتف وكلمة المرور مطلوبان' });
    }

    if (!buildingId || !unit) {
      return res.status(400).json({ error: 'العماره ورقم الشقة مطلوبان' });
    }

    if (!ownerType || !['owner', 'rental'].includes(ownerType)) {
      return res.status(400).json({ error: 'نوع الملكية مطلوب (مالك أو مستأجر)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    // Validate building exists
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ error: 'لم يتم العثور على العماره' });
    }

    // Validate unit number (1-24)
    const unitNumber = parseInt(unit);
    if (isNaN(unitNumber) || unitNumber < 1 || unitNumber > 24) {
      return res.status(400).json({ error: 'رقم الشقة يجب أن يكون بين 1 و 24' });
    }

    // Normalize phone number (convert Arabic numerals to regular)
    const cleanedPhone = normalizePhoneNumber(phone);
    
    console.log('Registration - Original phone:', phone);
    console.log('Registration - Normalized phone:', cleanedPhone);

    // Validate phone number format (validate the normalized version)
    if (!validateEgyptianPhone(cleanedPhone)) {
      console.log('Phone validation failed for:', cleanedPhone);
      return res.status(400).json({ error: 'رقم الهاتف غير صحيح. يجب أن يكون رقم هاتف مصري صالح (01X XXXX XXXX أو 02 XXXX XXXX)' });
    }

    // Check if user already exists by phone
    const existingUserByPhone = await User.findOne({ phone: cleanedPhone });
    if (existingUserByPhone) {
      return res.status(400).json({ error: 'رقم الهاتف مستخدم بالفعل' });
    }

    // Check if unit is already taken in this building
    const existingUserByUnit = await User.findOne({ buildingId, unit: unit.toString() })
      .select('fullName phone');
    if (existingUserByUnit) {
      return res.status(400).json({ 
        error: `هذه الشقة مسجلة بالفعل`,
        existingUser: {
          fullName: existingUserByUnit.fullName,
          phone: existingUserByUnit.phone
        },
        message: `الشقة رقم ${unit} في هذه العماره مسجلة للمستخدم: ${existingUserByUnit.fullName}`
      });
    }

    // Create new user (use normalized phone number)
    const user = new User({
      fullName: fullName.trim(),
      phone: cleanedPhone, // Already normalized
      password,
      buildingId,
      unit: unit.toString(),
      ownerType,
      idCardImage: idCardImage || '',
      ownershipProof: ownershipProof || '',
      profilePic: profilePic || ''
    });

    await user.save();
    await user.populate('buildingId', 'number');

    // Generate JWT token
    const token = user.generateToken();

    res.status(201).json({
      message: 'تم التسجيل بنجاح',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        buildingId: user.buildingId,
        unit: user.unit,
        ownerType: user.ownerType,
        userType: user.userType,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.phone) {
        return res.status(400).json({ error: 'رقم الهاتف مستخدم بالفعل' });
      } else if (error.keyPattern && error.keyPattern.buildingId && error.keyPattern.unit) {
        // Try to get the existing user info
        try {
          const existingUser = await User.findOne({ buildingId, unit: unit.toString() })
            .select('fullName phone');
          if (existingUser) {
            return res.status(400).json({ 
              error: `هذه الشقة مسجلة بالفعل`,
              existingUser: {
                fullName: existingUser.fullName,
                phone: existingUser.phone
              },
              message: `الشقة رقم ${unit} في هذه العماره مسجلة للمستخدم: ${existingUser.fullName}`
            });
          }
        } catch (err) {
          console.error('Error fetching existing user:', err);
        }
        return res.status(400).json({ error: 'هذه الشقة مسجلة بالفعل لمستخدم آخر' });
      }
      return res.status(400).json({ error: 'البيانات المدخلة مستخدمة بالفعل' });
    }
    res.status(500).json({ error: error.message || 'فشل التسجيل' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({ error: 'رقم الهاتف وكلمة المرور مطلوبان' });
    }

    // Normalize phone number (convert Arabic numerals to regular)
    const cleanedPhone = normalizePhoneNumber(phone);

    // Find user
    const user = await User.findOne({ phone: cleanedPhone });
    if (!user) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }
    
    // Note: Allow login even if not active, so user can see approval status

    // Generate JWT token
    const token = user.generateToken();

    await user.populate('buildingId', 'number');
    
    res.json({
      message: user.isActive ? 'تم تسجيل الدخول بنجاح' : 'تم تسجيل الدخول. في انتظار موافقة المدير',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        buildingId: user.buildingId,
        unit: user.unit,
        ownerType: user.ownerType,
        userType: user.userType,
        profilePic: user.profilePic,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'فشل تسجيل الدخول' });
  }
});

// Logout user (remove token)
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ error: 'رمز غير موجود' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    await user.removeToken(token);

    res.json({ message: 'تم تسجيل الخروج بنجاح' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message || 'فشل تسجيل الخروج' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId)
      .select('-password -tokens')
      .populate('buildingId', 'number');
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'رمز غير صالح' });
  }
});

// Get users by buildingId (residents)
router.get('/building/:buildingId', async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    const users = await User.find({ buildingId })
      .select('-password -tokens')
      .populate('buildingId', 'number')
      .sort({ unit: 1, fullName: 1 });
    
    res.json(users);
  } catch (error) {
    console.error('Get users by building error:', error);
    res.status(500).json({ error: error.message || 'فشل تحميل السكان' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // Update allowed fields
    const { profilePic, fullName, idCardImage, ownershipProof } = req.body;
    
    if (profilePic !== undefined) {
      user.profilePic = profilePic || '';
    }
    
    if (fullName !== undefined && fullName.trim().length > 0) {
      user.fullName = fullName.trim();
    }
    
    if (idCardImage !== undefined) {
      user.idCardImage = idCardImage || '';
    }
    
    if (ownershipProof !== undefined) {
      user.ownershipProof = ownershipProof || '';
    }

    await user.save();
    await user.populate('buildingId', 'number');

    res.json({
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        buildingId: user.buildingId,
        unit: user.unit,
        ownerType: user.ownerType,
        userType: user.userType,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'فشل تحديث الملف الشخصي' });
  }
});

// Get pending users (for manager)
router.get('/pending', auth, manager, async (req, res) => {
  try {
    const pendingUsers = await User.find({ isActive: false })
      .select('-password -tokens')
      .populate('buildingId', 'number')
      .sort({ createdAt: -1 });
    
    res.json(pendingUsers);
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ error: error.message || 'فشل تحميل المستخدمين المعلقين' });
  }
});

// Approve user (for manager)
router.post('/approve/:userId', auth, manager, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    user.isActive = true;
    await user.save();
    
    await user.populate('buildingId', 'number');
    
    res.json({
      message: 'تم الموافقة على المستخدم بنجاح',
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        buildingId: user.buildingId,
        unit: user.unit,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: error.message || 'فشل الموافقة على المستخدم' });
  }
});

// Reject user (for manager)
router.post('/reject/:userId', auth, manager, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    
    // Delete the user or mark as rejected
    await User.findByIdAndDelete(userId);
    
    res.json({
      message: 'تم رفض المستخدم بنجاح',
      reason: reason || 'لم يتم تحديد السبب'
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: error.message || 'فشل رفض المستخدم' });
  }
});

module.exports = router;
