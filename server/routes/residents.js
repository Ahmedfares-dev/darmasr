const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Building = require('../models/Building');
const { normalizePhoneNumber, validateEgyptianPhone } = require('../utils/phoneUtils');

// Get all residents (using User model)
router.get('/', async (req, res) => {
  try {
    const { buildingId } = req.query;
    const query = buildingId ? { buildingId } : {};
    
    const residents = await User.find(query)
      .select('-password -tokens')
      .populate('buildingId', 'number')
      .sort({ fullName: 1 });
    
    res.json(residents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resident by ID
router.get('/:id', async (req, res) => {
  try {
    const resident = await User.findById(req.params.id)
      .select('-password -tokens')
      .populate('buildingId', 'number');
    
    if (!resident) {
      return res.status(404).json({ error: 'Resident not found' });
    }
    res.json(resident);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create resident (using User model - this route is deprecated, use /api/auth/register instead)
router.post('/', async (req, res) => {
  try {
    return res.status(400).json({ error: 'يرجى استخدام /api/auth/register لتسجيل مستخدم جديد' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update resident (using User model)
router.put('/:id', async (req, res) => {
  try {
    const { phone, unit, idCardImage, ownershipProof, fullName } = req.body;
    
    // Validate phone number if provided
    if (phone) {
      // Normalize phone number (convert Arabic numerals to regular)
      const cleanedPhone = normalizePhoneNumber(phone);
      
      // Validate phone number format
      if (!validateEgyptianPhone(phone)) {
        return res.status(400).json({ error: 'رقم الهاتف غير صحيح. يجب أن يكون رقم هاتف مصري صالح (01X XXXX XXXX أو 02 XXXX XXXX)' });
      }

      // Check if phone number already exists (excluding current user)
      const existingUser = await User.findOne({ phone: cleanedPhone, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ error: 'رقم الهاتف مستخدم بالفعل' });
      }

      req.body.phone = cleanedPhone;
    }

    // Validate unit number if provided
    if (unit) {
      const unitNumber = parseInt(unit);
      if (isNaN(unitNumber) || unitNumber < 1 || unitNumber > 24) {
        return res.status(400).json({ error: 'رقم الشقة يجب أن يكون بين 1 و 24' });
      }
      req.body.unit = unit.toString();
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .select('-password -tokens')
    .populate('buildingId', 'number');
    
    if (!user) {
      return res.status(404).json({ error: 'لم يتم العثور على الساكن' });
    }
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'رقم الهاتف مستخدم بالفعل' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete resident (using User model)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Resident not found' });
    }
    res.json({ message: 'Resident deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

