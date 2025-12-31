import express from "express";
const router = express.Router();
import validateParamsId from "../validators/params-id";
import validateUserIsSelfOrAdmin from "../validators/user-is-self-or-admin";
import validateUserIsAdmin from "../validators/user-is-admin";

import {
    getAllUsers,
    getUser,
    blockUser
} from "../controllers/users";

router.route("/").get(validateUserIsAdmin, getAllUsers);
router.route("/:id").get(validateParamsId, validateUserIsSelfOrAdmin, getUser);
router.route("/:id/:newStatus").post(validateParamsId, validateUserIsSelfOrAdmin, blockUser);

export default router;
