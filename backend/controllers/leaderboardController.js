module.exports = {
  ...require('./leaderboard/publicController'),
  ...require('./leaderboard/submissionController'),
  ...require('./leaderboard/adminController')
};
