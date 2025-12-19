const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nominationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nomination',
    required: true
  },
  castAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index to ensure one vote per resident per election
voteSchema.index({ electionId: 1, residentId: 1 }, { unique: true });
voteSchema.index({ nominationId: 1 });

module.exports = mongoose.model('Vote', voteSchema);

