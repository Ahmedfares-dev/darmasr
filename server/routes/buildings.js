const express = require('express');
const router = express.Router();
const Building = require('../models/Building');
const User = require('../models/User');

// Get all buildings
router.get('/', async (req, res) => {
  try {
    const buildings = await Building.find();
    
    // Get resident count for each building
    const buildingsWithCount = await Promise.all(
      buildings.map(async (building) => {
        const residentCount = await User.countDocuments({ buildingId: building._id });
        return {
          ...building.toObject(),
          residentCount
        };
      })
    );
    
    // Sort numerically by building number (convert string to number for proper sorting)
    buildingsWithCount.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
    
    res.json(buildingsWithCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get building by ID
router.get('/:id', async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: 'لم يتم العثور على العماره' });
    }
    res.json(building);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed buildings (creates 56 buildings numbered 1-56)
router.post('/seed', async (req, res) => {
  try {
    // Check if buildings already exist
    const existingCount = await Building.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({ error: 'المباني موجودة بالفعل. قم بحذفها أولاً إذا كنت تريد إعادة البذر' });
    }

    // Create 56 buildings
    const buildings = [];
    for (let i = 1; i <= 56; i++) {
      buildings.push({
        number: i.toString(),
        status: 'active'
      });
    }

    await Building.insertMany(buildings);
    res.status(201).json({ message: `تم إنشاء ${buildings.length} عماره بنجاح` });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'رقم العماره موجود بالفعل' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update building
router.put('/:id', async (req, res) => {
  try {
    const building = await Building.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!building) {
      return res.status(404).json({ error: 'لم يتم العثور على العماره' });
    }
    res.json(building);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete building
router.delete('/:id', async (req, res) => {
  try {
    const building = await Building.findByIdAndDelete(req.params.id);
    if (!building) {
      return res.status(404).json({ error: 'لم يتم العثور على العماره' });
    }
    res.json({ message: 'Building deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

