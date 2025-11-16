// src/backend/routes/superadminRoutes.ts
import { Router } from "express";
import { listApprovalRequests, approveRequest, rejectRequest } from "../controllers/superadminController";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

// superadmin only
router.use(authenticate);
router.use(authorizeRoles("superadmin"));

router.get("/requests", listApprovalRequests);
router.patch("/requests/:id/approve", approveRequest);
router.patch("/requests/:id/reject", rejectRequest);

export default router;
