import { Router, Request, Response } from "express";
import passport from "./passport";
import { isAuthenticated } from "./middleware";

const router = Router();

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/login?error=google_failed`
      : "http://localhost:5173/login?error=google_failed",
    successRedirect: process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/`
      : "http://localhost:5173/",
  })
);

// LinkedIn OAuth routes
router.get(
  "/linkedin",
  passport.authenticate("linkedin", {
    scope: ["openid", "profile", "email"],
  })
);

router.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", {
    failureRedirect: process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/login?error=linkedin_failed`
      : "http://localhost:5173/login?error=linkedin_failed",
    successRedirect: process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/`
      : "http://localhost:5173/",
  })
);

// Get current user
router.get("/me", isAuthenticated, (req: Request, res: Response) => {
  if (req.user) {
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      provider: req.user.provider,
    });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Logout
router.post("/logout", (req: Request, res: Response) => {
  req.logout((err: any) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Error destroying session" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

// Check authentication status
router.get("/status", (req: Request, res: Response) => {
  const isAuth = req.isAuthenticated();
  
  // Debug session data
  const sessionPassport = (req.session as any).passport;
  console.log("🔍 Auth status check:", {
    isAuthenticated: isAuth,
    hasUser: !!req.user,
    userId: req.user?.id,
    userName: req.user?.name,
    sessionID: req.sessionID,
    hasPassportInSession: !!sessionPassport,
    passportUserId: sessionPassport?.user,
  });
  
  // If not authenticated but has passport data in session, try to manually deserialize
  if (!isAuth && sessionPassport?.user) {
    console.log("⚠️ Session has passport data but user not authenticated. Attempting manual deserialize...");
    // This will trigger deserializeUser
    passport.deserializeUser(sessionPassport.user, (err: any, user: any) => {
      if (err || !user) {
        console.log("❌ Manual deserialize failed:", err);
      } else {
        console.log("✅ Manual deserialize succeeded:", { id: user.id, name: user.name });
      }
    });
  }
  
  const user = isAuth && req.user ? {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture,
    provider: req.user.provider,
  } : null;

  res.json({
    authenticated: isAuth,
    user,
  });
});

export default router;

