function calculatePoints(submittedTimesAmnt, placement, difficultyBonus) {
    const placementBonusValues = [150, 50, 25]
    const basePoints = 50;

    const competitivePoints = Math.sqrt(submittedTimesAmnt)
    const top3Bonus = placementBonusValues[placement] || 0
    const base = basePoints * (submittedTimesAmnt - placement) / Math.max(submittedTimesAmnt-1, 1)
    return (base + top3Bonus) * competitivePoints * .15 + difficultyBonus;
}