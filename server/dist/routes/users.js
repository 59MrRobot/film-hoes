"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all users (Admin only)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Only admins can view users' });
        }
        const users = await db_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                isAdmin: true,
                createdAt: true,
            },
            orderBy: {
                id: 'asc'
            }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Update user admin status (Admin only)
router.put('/:id/role', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Only admins can change roles' });
        }
        const targetUserId = parseInt(req.params.id);
        const { isAdmin } = req.body;
        if (isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        // Prevent removing your own admin status
        if (targetUserId === req.user.userId && !isAdmin) {
            return res.status(400).json({ error: 'You cannot revoke your own admin rights' });
        }
        const updatedUser = await db_1.prisma.user.update({
            where: { id: targetUserId },
            data: { isAdmin },
            select: {
                id: true,
                username: true,
                isAdmin: true,
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map