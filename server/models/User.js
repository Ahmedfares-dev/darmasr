const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { normalizePhoneNumber, validateEgyptianPhone } = require('../utils/phoneUtils');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return validateEgyptianPhone(v);
      },
      message: 'رقم الهاتف غير صحيح'
    },
    set: function(v) {
      // Normalize phone number before saving (convert Arabic numerals to regular)
      return normalizePhoneNumber(v);
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePic: {
    type: String,
    trim: true
  },
  ownerType: {
    type: String,
    enum: ['owner', 'rental'],
    required: true
  },
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        const unitNumber = parseInt(v);
        return !isNaN(unitNumber) && unitNumber >= 1 && unitNumber <= 24;
      },
      message: 'رقم الشقة يجب أن يكون بين 1 و 24'
    }
  },
  idCardImage: {
    type: String,
    trim: true
  },
  ownershipProof: {
    type: String,
    trim: true
  },
  userType: {
    type: String,
    enum: ['resident', 'manager'],
    default: 'resident',
    required: true
  },
  tokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400 // 24 hours
    }
  }],
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index to ensure unique users per building unit
userSchema.index({ buildingId: 1, unit: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateToken = function() {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: this._id, phone: this.phone, userType: this.userType },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Save token to user's tokens array
  this.tokens.push({ token });
  this.save();
  
  return token;
};

// Method to remove token
userSchema.methods.removeToken = function(tokenToRemove) {
  this.tokens = this.tokens.filter(t => t.token !== tokenToRemove);
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
