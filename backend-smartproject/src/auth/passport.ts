import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";

// Serialize user for session
passport.serializeUser((user: any, done) => {
  console.log("🔍 Serializing user:", { id: user.id, name: user.name, email: user.email });
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    console.log("🔍 Deserializing user with ID:", id);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
      console.log("✅ User deserialized:", { id: user.id, name: user.name, email: user.email });
    } else {
      console.log("❌ User not found with ID:", id);
    }
    done(null, user || null);
  } catch (error) {
    console.error("❌ Error deserializing user:", error);
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || `${process.env.BASE_URL || "http://localhost:8080"}/api/auth/google/callback`;
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: googleCallbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, profile.emails?.[0]?.value || ""));

          if (existingUser) {
            return done(null, existingUser);
          }

          // Create new user
          const [newUser] = await db
            .insert(users)
            .values({
              email: profile.emails?.[0]?.value || "",
              name: profile.displayName || profile.name?.givenName || "User",
              picture: profile.photos?.[0]?.value || null,
              provider: "google",
              providerId: profile.id,
            })
            .returning();

          return done(null, newUser);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// LinkedIn OAuth Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: process.env.LINKEDIN_CALLBACK_URL || `${process.env.BASE_URL || "http://localhost:8080"}/api/auth/linkedin/callback`,
        scope: ["r_emailaddress", "r_liteprofile"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // LinkedIn profile structure - profile may have different structure
          // The profile object structure depends on the LinkedIn API version
          const email = (profile as any).emails?.[0]?.value || (profile as any).email || "";
          const name = (profile as any).displayName || 
                       `${(profile as any).name?.givenName || ""} ${(profile as any).name?.familyName || ""}`.trim() || 
                       "User";
          const picture = (profile as any).photos?.[0]?.value || (profile as any).pictureUrl || null;

          // Check if user exists
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

          if (existingUser) {
            return done(null, existingUser);
          }

          // Create new user
          const [newUser] = await db
            .insert(users)
            .values({
              email,
              name,
              picture,
              provider: "linkedin",
              providerId: profile.id,
            })
            .returning();

          return done(null, newUser);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;

