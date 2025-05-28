const Election = require('../models/Election');
const Vote = require('../models/Vote');
const Voter = require('../models/Voter');

// Create a new election
exports.createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, candidates, contractAddress } = req.body;

    const election = new Election({
      title,
      description,
      startDate,
      endDate,
      candidates,
      contractAddress
    });

    await election.save();

    res.status(201).json({
      message: 'Election created successfully',
      election
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating election', error: error.message });
  }
};

// Get all elections
exports.getElections = async (req, res) => {
  try {
    const elections = await Election.find().select('-__v');
    res.json({ success: true, elections });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching elections', error: error.message });
  }
};

// Get election by ID
exports.getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).select('-__v');
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }
    res.json({ success: true, election });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching election', error: error.message });
  }
};

// Cast a vote
exports.castVote = async (req, res) => {
  try {
    const { candidateId, signature } = req.body;
    const electionId = req.params.id;
    const voterId = req.voter.id;

    // Check if election exists
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if election is active
    const now = new Date();
    if (now < election.startDate || now > election.endDate) {
      return res.status(400).json({ message: 'Election is not active' });
    }

    // Check if voter has already voted
    const existingVote = await Vote.findOne({ election: electionId, voter: voterId });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Create vote
    const vote = new Vote({
      election: electionId,
      voter: voterId,
      candidateId,
      signature,
      transactionHash: 'pending' // This should be updated with actual blockchain transaction hash
    });

    await vote.save();

    // Update candidate votes
    const candidate = election.candidates[candidateId];
    if (candidate) {
      candidate.votes += 1;
      await election.save();
    }

    // Update voter's hasVoted status
    await Voter.findByIdAndUpdate(voterId, { hasVoted: true });

    res.status(201).json({
      message: 'Vote cast successfully',
      vote
    });
  } catch (error) {
    res.status(500).json({ message: 'Error casting vote', error: error.message });
  }
};

// Get election results
exports.getResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).select('-__v');
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

    const results = {
      success: true,
      election: {
        id: election._id,
        title: election.title,
        description: election.description,
        status: election.status,
        totalVotes
      },
      candidates: election.candidates.map(candidate => ({
        name: candidate.name,
        description: candidate.description,
        votes: candidate.votes,
        percentage: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0
      }))
    };

    res.json(results);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching results', error: error.message });
  }
}; 