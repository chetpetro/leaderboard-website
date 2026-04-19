const currentPointCalculationMethod = "top3:150,50,25;base:50;comp:sqrt;scale:.15" // just so when the score changes, it recalculates all scores for a user

// placement is 0 indexed so wr = index 0
function calculatePoints(submittedTimesAmnt, placement, difficultyBonus) {
    const placementBonusValues = [150, 50, 25]
    const basePoints = 50;
    const scaleFactor = .15;

    const competitivePoints = Math.sqrt(submittedTimesAmnt)
    const top3Bonus = placementBonusValues[placement] || 0
    const base = basePoints * (submittedTimesAmnt - placement) / Math.max(submittedTimesAmnt-1, 1)
    return (base + top3Bonus) * competitivePoints * scaleFactor + difficultyBonus;
}

module.exports = {
    calculatePoints,
    currentPointCalculationMethod
}