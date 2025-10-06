import express from "express";
import { login, logout, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { onboard } from "../controllers/auth.controller.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout); //why post for logout? ➡️ change the server state = destroy a session and invalid a token

router.post("/onboarding", protectRoute , onboard)

//checks user logged in or not
router.get("/me", protectRoute, (req,res)=> {
    res.status(200).json({success: true, user: req.user});
})

export default router;