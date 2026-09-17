"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Helper to get active week
async function getActiveWeek() {
    return await db_1.prisma.week.findFirst({
        where: { isActive: true },
    });
}
// Cast a vote
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { nominationId } = req.body;
        if (!nominationId) {
            return res.status(400).json({ error: 'Nomination ID is required' });
        }
        const week = await getActiveWeek();
        if (!week) {
            return res.status(400).json({ error: 'No active week found' });
        }
        // 1. Get the nomination and verify it's in the current week
        const nomination = await db_1.prisma.nomination.findUnique({
            where: { id: nominationId },
        });
        if (!nomination || nomination.weekId !== week.id) {
            return res.status(404).json({ error: 'Nomination not found in the current week' });
        }
        // 2. Rule: Cannot vote for your own nomination
        if (nomination.userId === userId) {
            return res.status(400).json({ error: 'You cannot vote for your own nomination' });
        }
        // 3. Rule: Check if already voted for this nomination
        const existingVote = await db_1.prisma.vote.findUnique({
            where: {
                userId_nominationId: {
                    userId,
                    nominationId,
                },
            },
        });
        if (existingVote) {
            // Toggle vote off if they click again
            await db_1.prisma.vote.delete({
                where: { id: existingVote.id },
            });
            return res.json({ message: 'Vote removed' });
        }
        // 4. Rule: Max 2 votes per week
        const userVotesThisWeek = await db_1.prisma.vote.count({
            where: {
                userId,
                nomination: {
                    weekId: week.id,
                },
            },
        });
        if (userVotesThisWeek >= 2) {
            return res.status(400).json({ error: 'You can only vote for up to 2 movies per week' });
        }
        // Cast the vote
        const vote = await db_1.prisma.vote.create({
            data: {
                userId,
                nominationId,
            },
        });
        res.status(201).json(vote);
    }
    catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({ error: 'Failed to cast vote' });
    }
});
exports.default = router;
//# sourceMappingURL=votes.js.map