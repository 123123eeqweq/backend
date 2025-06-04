const express = require('express');
const router = express.Router();

router.post('/:caseId', async (req, res) => {
  res.status(501).json({ message: 'Спин в разработке, скоро будет зажигать, братан!' });
});

module.exports = router;