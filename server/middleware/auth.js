const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'غير مصرح. يرجى تسجيل الدخول' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'المستخدم غير موجود' });
    }

    // Check if token exists in user's tokens array
    const tokenExists = user.tokens.some(t => t.token === token);
    if (!tokenExists) {
      return res.status(401).json({ error: 'رمز غير صالح' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'الحساب معطل' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'رمز غير صالح' });
  }
};

// Middleware to check if user is manager (must be used after auth middleware)
const manager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'غير مصرح. يرجى تسجيل الدخول' });
  }
  
  if (req.user.userType !== 'manager') {
    return res.status(403).json({ error: 'غير مصرح. يجب أن تكون مديراً للوصول إلى هذه الصفحة' });
  }
  
  next();
};

module.exports = { auth, manager };
