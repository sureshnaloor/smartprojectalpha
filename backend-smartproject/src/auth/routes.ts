import { Router, Request, Response } from "express";
import passport from "./passport";
import { isAuthenticated } from "./middleware";

const router = Router();
// Prefer BASE_URL (server/frontend host) then FRONTEND_URL, then fallback to 8080
const FRONTEND = process.env.BASE_URL || process.env.FRONTEND_URL || "http://localhost:8080";

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
    failureRedirect: `${FRONTEND}/login?error=google_failed`,
    successRedirect: `${FRONTEND}/`,
  })
);

// LinkedIn OAuth routes - Using OpenID Connect manually since passport-linkedin-oauth2 doesn't support it
router.get("/linkedin", (req: Request, res: Response) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_CALLBACK_URL || 
    `${process.env.BASE_URL || "http://localhost:8080"}/api/auth/linkedin/callback`;
  const state = Math.random().toString(36).substring(7);
  
  // Store state in session for CSRF protection
  (req.session as any).linkedinState = state;
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid%20profile%20email` +
    `&state=${state}`;
  
  res.redirect(authUrl);
});

router.get("/linkedin/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;
    
    // LinkedIn callback received
    
    if (error) {
      console.error("❌ LinkedIn OAuth error:", error);
      return res.redirect(`${FRONTEND}/login?error=linkedin_failed`);
    }
    
    // Verify state
    if (state !== (req.session as any).linkedinState) {
      console.error("❌ State mismatch");
      return res.redirect(`${FRONTEND}/login?error=linkedin_failed`);
    }
    
    if (!code) {
      return res.redirect(`${FRONTEND}/login?error=linkedin_failed`);
    }
    
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_CALLBACK_URL || 
      `${process.env.BASE_URL || "http://localhost:8080"}/api/auth/linkedin/callback`;
    
    // Exchange code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: redirectUri,
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Token exchange failed:", tokenResponse.status, errorText);
      return res.redirect(`${FRONTEND}/login?error=linkedin_failed`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Fetch user info from OpenID Connect userinfo endpoint
    const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error("❌ User info fetch failed:", userInfoResponse.status, errorText);
      return res.redirect(`${FRONTEND}/login?error=linkedin_failed`);
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Extract user data
    const email = userInfo.email || "";
    const name = userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim() || "User";
    const picture = userInfo.picture || null;
    const providerId = userInfo.sub || userInfo.id || "";
    
    if (!email) {
      console.error("❌ No email in user info");
      return res.redirect(`${FRONTEND}/login?error=linkedin_failed`);
    }
    
    // Check if user exists
    const { db } = await import("../db");
    const { users } = await import("../schema");
    const { eq } = await import("drizzle-orm");
    
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name,
          picture,
          provider: "linkedin",
          providerId,
        })
        .returning();
      user = newUser;
    }
    
    // Log user in
    req.login(user, (err) => {
      if (err) {
        console.error("❌ Login failed:", err);
        return res.redirect(`${FRONTEND}/login?error=linkedin_failed`);
      }
      
      // Clear state
      delete (req.session as any).linkedinState;
      
      // Redirect to frontend
      res.redirect(`${FRONTEND}/`);
    });
  } catch (error) {
    console.error("❌ LinkedIn callback error:", error);
    res.redirect(`${FRONTEND}/login?error=linkedin_failed`);
  }
});

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

