const placementBonusValues = [150, 50, 25]
const basePoints = 50;
const scaleFactor = .25;
// Bump this when point-affecting logic changes without touching the constants above
// (rev 2: 0-indexed placement fix in the update-points rebuild), so stored user
// points lazily rebuild on the next user fetch. A one-shot recompute over all maps
// is not an option: it exceeds Vercel's request timeout.
const calculationRevision = 2;

function currentPointCalculationMethod() {
    return `top3:${placementBonusValues[0]}:${placementBonusValues[1]}:${placementBonusValues[2]};base:${basePoints};comp:sqrt;scale:${scaleFactor};rev:${calculationRevision}`;
}

// placement is 1 indexed so wr = 1
function calculatePoints(submittedTimesAmnt, placement, difficultyBonus) {
    const competitivePoints = Math.sqrt(submittedTimesAmnt)
    const top3Bonus = placementBonusValues[placement - 1] || 0
    const base = basePoints * (submittedTimesAmnt - placement + 1) / Math.max(submittedTimesAmnt-1, 1)
    return (base + top3Bonus) * competitivePoints * scaleFactor + difficultyBonus;
}

module.exports = {
    calculatePoints,
    currentPointCalculationMethod
}