const express = require('express');
const router = express.Router();
const Nomination = require('../models/Nomination');
const Election = require('../models/Election');
const User = require('../models/User');

// Get all nominations
router.get('/', async (req, res) => {
  try {
    const { electionId, status } = req.query;
    const query = {};
    if (electionId) query.electionId = electionId;
    if (status) query.status = status;

    const nominations = await Nomination.find(query)
      .populate('electionId', 'title buildingId')
      .populate('electionId.buildingId', 'number')
      .populate('residentId', 'fullName unit phone profilePic')
      .sort({ submittedAt: -1 });
    
    res.json(nominations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nomination by ID
router.get('/:id', async (req, res) => {
  try {
    const nomination = await Nomination.findById(req.params.id)
      .populate('electionId', 'title buildingId startDate endDate')
      .populate('electionId.buildingId', 'number')
      .populate('residentId', 'fullName unit phone profilePic');
    
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }
    res.json(nomination);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create nomination (self-nomination)
router.post('/', async (req, res) => {
  try {
    const { electionId, residentId, statement, qualifications, goals } = req.body;

    // Validate election exists
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Validate user/resident exists
    const user = await User.findById(residentId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // Check if user belongs to the same building as election
    const userBuildingId = user.buildingId?._id || user.buildingId;
    if (!userBuildingId || userBuildingId.toString() !== election.buildingId.toString()) {
      return res.status(400).json({ error: 'المستخدم لا ينتمي إلى هذه العماره' });
    }

    // Check if nomination period is still open (before election ends)
    if (new Date() >= new Date(election.endDate)) {
      return res.status(400).json({ error: 'انتهت فترة الترشيح. انتهت الانتخابات.' });
    }

    const nomination = new Nomination({
      electionId,
      residentId,
      statement,
      qualifications,
      goals,
      status: 'pending'
    });

    await nomination.save();
    await nomination.populate('residentId', 'fullName unit profilePic');
    await nomination.populate('electionId', 'title');
    
    res.status(201).json(nomination);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'لقد قمت بالترشح بالفعل في هذه الانتخابات' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Approve nomination
router.post('/:id/approve', async (req, res) => {
  try {
    const nomination = await Nomination.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).populate('residentId', 'fullName unit profilePic');
    
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }
    res.json(nomination);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject nomination
router.post('/:id/reject', async (req, res) => {
  try {
    const nomination = await Nomination.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('residentId', 'fullName unit profilePic');
    
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }
    res.json(nomination);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update nomination
router.put('/:id', async (req, res) => {
  try {
    const nomination = await Nomination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('residentId', 'fullName unit profilePic');
    
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }
    res.json(nomination);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete nomination
router.delete('/:id', async (req, res) => {
  try {
    const nomination = await Nomination.findByIdAndDelete(req.params.id);
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }
    res.json({ message: 'Nomination deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

