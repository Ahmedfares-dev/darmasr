const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true,
    unique: true
  },
  nominationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nomination',
    required: true
  },
  voteCount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  },
  confirmedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Winner', winnerSchema);

