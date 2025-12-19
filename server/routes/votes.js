const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const Election = require('../models/Election');
const Nomination = require('../models/Nomination');
const User = require('../models/User');

// Get all votes
router.get('/', async (req, res) => {
  try {
    const { electionId } = req.query;
    const query = electionId ? { electionId } : {};
    
    const votes = await Vote.find(query)
      .populate('electionId', 'title')
      .populate('residentId', 'fullName unit')
      .populate('nominationId')
      .populate('nominationId.residentId', 'fullName unit')
      .sort({ castAt: -1 });
    
    res.json(votes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vote by ID
router.get('/:id', async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id)
      .populate('electionId', 'title')
      .populate('residentId', 'fullName unit')
      .populate('nominationId')
      .populate('nominationId.residentId', 'fullName unit');
    
    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }
    res.json(vote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cast a vote
router.post('/', async (req, res) => {
  try {
    const { electionId, residentId, nominationId } = req.body;

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

    // Validate nomination exists
    const nomination = await Nomination.findById(nominationId);
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }

    // Check if nomination belongs to this election
    if (nomination.electionId.toString() !== electionId) {
      return res.status(400).json({ error: 'Nomination does not belong to this election' });
    }

    // Check if nomination is approved
    if (nomination.status !== 'approved') {
      return res.status(400).json({ error: 'يمكن التصويت فقط للترشيحات المعتمدة' });
    }

    // Check if election is currently running
    const now = new Date();
    if (now < new Date(election.startDate) || now > new Date(election.endDate)) {
      return res.status(400).json({ error: 'الانتخابات غير مفتوحة للتصويت حالياً' });
    }

    // Check if resident has already voted
    const existingVote = await Vote.findOne({ electionId, residentId });
    if (existingVote) {
      return res.status(400).json({ error: 'لقد قمت بالتصويت بالفعل في هذه الانتخابات' });
    }

    const vote = new Vote({
      electionId,
      residentId,
      nominationId
    });

    await vote.save();
    await vote.populate('nominationId');
    await vote.populate('nominationId.residentId', 'fullName unit');
    await vote.populate('residentId', 'fullName unit');
    
    res.status(201).json(vote);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'You have already voted in this election' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get vote count for an election
router.get('/election/:electionId/count', async (req, res) => {
  try {
    const { electionId } = req.params;
    const totalVotes = await Vote.countDocuments({ electionId });
    
    // Get vote counts per nomination
    const votes = await Vote.find({ electionId });
    const voteCounts = {};
    
    votes.forEach(vote => {
      const nomId = vote.nominationId.toString();
      voteCounts[nomId] = (voteCounts[nomId] || 0) + 1;
    });

    res.json({
      totalVotes,
      voteCounts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete vote
router.delete('/:id', async (req, res) => {
  try {
    const vote = await Vote.findByIdAndDelete(req.params.id);
    if (!vote) {
      return res.status(404).json({ error: 'Vote not found' });
    }
    res.json({ message: 'Vote deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

