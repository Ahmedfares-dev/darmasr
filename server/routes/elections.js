const express = require('express');
const router = express.Router();
const Election = require('../models/Election');
const Building = require('../models/Building');
const Nomination = require('../models/Nomination');
const Vote = require('../models/Vote');
const Winner = require('../models/Winner');

// Get all elections
router.get('/', async (req, res) => {
  try {
    const { buildingId } = req.query;
    const query = buildingId ? { buildingId } : {};
    const elections = await Election.find(query)
      .populate('buildingId', 'number')
      .sort({ createdAt: -1 });
    res.json(elections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get election by ID with details
router.get('/:id', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate('buildingId', 'number')
      .populate('createdBy', 'fullName');
    
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Update election status based on current time (if not already confirmed)
    if (election.status !== 'winner_confirmed') {
      const now = new Date();
      const start = new Date(election.startDate);
      const end = new Date(election.endDate);

      let newStatus = election.status;
      if (now < start) {
        newStatus = 'scheduled';
      } else if (now >= start && now <= end) {
        newStatus = 'running';
      } else if (now > end && election.status !== 'winner_pending') {
        newStatus = 'ended';
      }

      if (newStatus !== election.status) {
        election.status = newStatus;
        await election.save();
      }
    }

    // Get nominations count
    const nominations = await Nomination.find({ electionId: election._id })
      .populate('residentId', 'fullName unit profilePic');
    
    // Get votes count
    const votes = await Vote.find({ electionId: election._id });
    
    // Get winner if exists
    const winner = await Winner.findOne({ electionId: election._id })
      .populate('nominationId')
      .populate('nominationId.residentId', 'fullName unit profilePic');

    res.json({
      ...election.toObject(),
      nominations,
      votesCount: votes.length,
      winner
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create election
router.post('/', async (req, res) => {
  try {
    const { buildingId, number, startDate, endDate } = req.body;

    // Validate building exists
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const election = new Election({
      buildingId,
      number,
      startDate,
      endDate,
      status: new Date() >= new Date(startDate) && new Date() <= new Date(endDate) 
        ? 'running' 
        : new Date() > new Date(endDate) 
        ? 'ended' 
        : 'scheduled'
    });

    await election.save();
    await election.populate('buildingId', 'number');
    res.status(201).json(election);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Election number already exists for this building' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update election
router.put('/:id', async (req, res) => {
  try {
    const election = await Election.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('buildingId', 'number');
    
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }
    res.json(election);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tally votes and determine winner
router.post('/:id/tally', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    if (new Date() < new Date(election.endDate)) {
      return res.status(400).json({ error: 'Election has not ended yet' });
    }

    // Count votes per nomination
    const votes = await Vote.find({ electionId: election._id });
    const voteCounts = {};
    
    votes.forEach(vote => {
      voteCounts[vote.nominationId] = (voteCounts[vote.nominationId] || 0) + 1;
    });

    // Find winner (nomination with most votes)
    let maxVotes = 0;
    let winnerNominationId = null;

    for (const [nominationId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winnerNominationId = nominationId;
      }
    }

    if (!winnerNominationId) {
      return res.status(400).json({ error: 'No votes cast in this election' });
    }

    // Check if winner already exists
    let winner = await Winner.findOne({ electionId: election._id });
    
    if (winner) {
      // Update existing winner
      winner.nominationId = winnerNominationId;
      winner.voteCount = maxVotes;
      winner.status = 'pending';
      await winner.save();
    } else {
      // Create new winner
      winner = new Winner({
        electionId: election._id,
        nominationId: winnerNominationId,
        voteCount: maxVotes,
        status: 'pending'
      });
      await winner.save();
    }

    // Update election status
    election.status = 'winner_pending';
    await election.save();

    await winner.populate('nominationId');
    await winner.populate('nominationId.residentId', 'fullName unit');

    res.json({
      message: 'Votes tallied successfully',
      winner,
      election
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete election
router.delete('/:id', async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Delete related data: nominations, votes, winners
    await Nomination.deleteMany({ electionId: election._id });
    await Vote.deleteMany({ electionId: election._id });
    await Winner.deleteMany({ electionId: election._id });

    // Delete the election
    await Election.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'تم حذف الانتخابات وجميع البيانات المرتبطة بها بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

