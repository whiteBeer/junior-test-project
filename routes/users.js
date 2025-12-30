const express = require("express")
const router = express.Router()
const validateParamsId = require("../validators/params-id")

const {
    getAllUsers,
    getUser,
    blockUser
} = require("../controllers/users")

router.route("/").get(getAllUsers)
router.route("/:id").get(validateParamsId, getUser)
router.route("/:id/:newStatus").post(validateParamsId, blockUser)

module.exports = router
