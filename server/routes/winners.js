const express = require('express');
const router = express.Router();
const Winner = require('../models/Winner');
const Election = require('../models/Election');

// Get all winners
router.get('/', async (req, res) => {
  try {
    const { status, buildingId } = req.query;
    const query = {};
    if (status) query.status = status;

    let winners = await Winner.find(query)
      .populate('electionId', 'title buildingId number')
      .populate('electionId.buildingId', 'number')
      .populate('nominationId')
      .populate('nominationId.residentId', 'fullName unit')
      .populate('confirmedBy', 'fullName')
      .sort({ createdAt: -1 });

    // Filter by building if specified
    if (buildingId) {
      winners = winners.filter(w => 
        w.electionId && w.electionId.buildingId && 
        w.electionId.buildingId._id.toString() === buildingId
      );
    }

    res.json(winners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get winner by ID
router.get('/:id', async (req, res) => {
  try {
    const winner = await Winner.findById(req.params.id)
      .populate('electionId', 'title buildingId number')
      .populate('electionId.buildingId', 'number')
      .populate('nominationId')
      .populate('nominationId.residentId', 'fullName unit phone')
      .populate('confirmedBy', 'fullName');
    
    if (!winner) {
      return res.status(404).json({ error: 'Winner not found' });
    }
    res.json(winner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get winner by election ID
router.get('/election/:electionId', async (req, res) => {
  try {
    const winner = await Winner.findOne({ electionId: req.params.electionId })
      .populate('electionId', 'title buildingId number')
      .populate('electionId.buildingId', 'number')
      .populate('nominationId')
      .populate('nominationId.residentId', 'fullName unit phone')
      .populate('confirmedBy', 'fullName');
    
    if (!winner) {
      return res.status(404).json({ error: 'No winner found for this election' });
    }
    res.json(winner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm winner
router.post('/:id/confirm', async (req, res) => {
  try {
    const { confirmedBy } = req.body;
    
    const winner = await Winner.findById(req.params.id);
    if (!winner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    if (winner.status === 'confirmed') {
      return res.status(400).json({ error: 'Winner is already confirmed' });
    }

    winner.status = 'confirmed';
    winner.confirmedBy = confirmedBy;
    winner.confirmedAt = new Date();
    await winner.save();

    // Update election status
    const election = await Election.findById(winner.electionId);
    if (election) {
      election.status = 'winner_confirmed';
      await election.save();
    }

    await winner.populate('nominationId');
    await winner.populate('nominationId.residentId', 'fullName unit');
    await winner.populate('confirmedBy', 'fullName');

    res.json(winner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject winner
router.post('/:id/reject', async (req, res) => {
  try {
    const winner = await Winner.findById(req.params.id);
    if (!winner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    winner.status = 'rejected';
    await winner.save();

    // Update election status back to ended
    const election = await Election.findById(winner.electionId);
    if (election) {
      election.status = 'ended';
      await election.save();
    }

    await winner.populate('nominationId');
    await winner.populate('nominationId.residentId', 'fullName unit');

    res.json(winner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get confirmed winners for a building
router.get('/building/:buildingId/confirmed', async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    const winners = await Winner.find({ status: 'confirmed' })
      .populate({
        path: 'electionId',
        match: { buildingId: buildingId },
        populate: { path: 'buildingId', select: 'number' }
      })
      .populate('nominationId')
      .populate('nominationId.residentId', 'fullName unit')
      .populate('confirmedBy', 'fullName');

    // Filter out null elections (from the match)
    const filteredWinners = winners.filter(w => w.electionId !== null);

    res.json(filteredWinners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

