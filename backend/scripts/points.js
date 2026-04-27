const placementBonusValues = [150, 50, 25]
const basePoints = 50;
const scaleFactor = .25;

function currentPointCalculationMethod() {
    return `top3:${placementBonusValues[0]}:${placementBonusValues[1]}:${placementBonusValues[2]};base:${basePoints};comp:sqrt;scale:${scaleFactor}`;
}

// placement is 0 indexed so wr = index 0
function calculatePoints(submittedTimesAmnt, placement, difficultyBonus) {
    const competitivePoints = Math.sqrt(submittedTimesAmnt)
    const top3Bonus = placementBonusValues[placement] || 0
    const base = basePoints * (submittedTimesAmnt - placement) / Math.max(submittedTimesAmnt-1, 1)
    return (base + top3Bonus) * competitivePoints * scaleFactor + difficultyBonus;
}

module.exports = {
    calculatePoints,
    currentPointCalculationMethod
}