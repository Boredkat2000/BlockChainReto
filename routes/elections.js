const express = require('express');
const router = express.Router();
const {
  createElection,
  getElections,
  getElectionById,
  castVote,
  getResults
} = require('../controllers/electionController');
const { protect } = require('../middlewares/auth');

// Public routes
router.get('/', getElections);
router.get('/:id', getElectionById);
router.get('/:id/results', getResults);

// Protected routes
router.post('/', protect, createElection);
router.post('/:id/vote', protect, castVote);

module.exports = router; 