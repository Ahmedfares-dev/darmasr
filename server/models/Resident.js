const mongoose = require('mongoose');
const { normalizePhoneNumber, validateEgyptianPhone } = require('../utils/phoneUtils');

const residentSchema = new mongoose.Schema({
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    validate: {
      validator: function(v) {
        return validateEgyptianPhone(v);
      },
      message: 'رقم الهاتف غير صحيح. يجب أن يكون رقم هاتف مصري صالح (01X XXXX XXXX أو 02 XXXX XXXX)'
    },
    set: function(v) {
      // Normalize phone number before saving (convert Arabic numerals to regular)
      return normalizePhoneNumber(v);
    }
  },
  idDocument: {
    type: String,
    trim: true
  },
  idCardImage: {
    type: String,
    trim: true
  },
  ownershipProof: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  },
  ownerType: {
    type: String,
    enum: ['owner', 'rental'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index to ensure unique residents per building unit
residentSchema.index({ buildingId: 1, unit: 1 });
// Index to ensure unique phone numbers
residentSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model('Resident', residentSchema);

