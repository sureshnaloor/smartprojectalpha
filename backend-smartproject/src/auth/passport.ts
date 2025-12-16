import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    done(null, user || null);
  } catch (error) {
    console.error("Error deserializing user:", error);
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
        scope: ["openid", "profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔍 LinkedIn profile received:", JSON.stringify(profile, null, 2));
          console.log("🔍 LinkedIn profile._json:", JSON.stringify((profile as any)._json, null, 2));
          
          // LinkedIn OpenID Connect profile structure
          // With OpenID Connect, we may need to fetch profile manually
          let email = "";
          let name = "User";
          let picture = null;
          
          // Try to get email from profile
          if ((profile as any).emails?.[0]?.value) {
            email = (profile as any).emails[0].value;
          } else if ((profile as any).email) {
            email = (profile as any).email;
          } else if ((profile as any)._json?.email) {
            email = (profile as any)._json.email;
          } else {
            // Fetch email from LinkedIn API if not in profile
            try {
              const emailResponse = await fetch("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))", {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });
              if (emailResponse.ok) {
                const emailData = await emailResponse.json();
                email = emailData.elements?.[0]?.["handle~"]?.emailAddress || "";
              }
            } catch (err) {
              console.error("Failed to fetch email:", err);
            }
          }
          
          // Try to get name from profile
          if ((profile as any).displayName) {
            name = (profile as any).displayName;
          } else if ((profile as any).name?.displayName) {
            name = (profile as any).name.displayName;
          } else if ((profile as any).name?.givenName || (profile as any).name?.familyName) {
            name = `${(profile as any).name.givenName || ""} ${(profile as any).name.familyName || ""}`.trim();
          } else if ((profile as any)._json?.name) {
            name = (profile as any)._json.name;
          } else {
            // Fetch profile from LinkedIn OpenID Connect userinfo endpoint
            try {
              const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              });
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log("🔍 LinkedIn userinfo response:", JSON.stringify(profileData, null, 2));
                name = profileData.name || 
                       (profileData.given_name && profileData.family_name 
                         ? `${profileData.given_name} ${profileData.family_name}` 
                         : profileData.given_name || profileData.family_name || "User");
                picture = profileData.picture || null;
                if (!email && profileData.email) {
                  email = profileData.email;
                }
              } else {
                const errorText = await profileResponse.text();
                console.error("Failed to fetch userinfo:", profileResponse.status, errorText);
              }
            } catch (err) {
              console.error("Failed to fetch profile:", err);
            }
          }
          
          // Try to get picture
          if ((profile as any).photos?.[0]?.value) {
            picture = (profile as any).photos[0].value;
          } else if ((profile as any).pictureUrl) {
            picture = (profile as any).pictureUrl;
          } else if ((profile as any)._json?.picture) {
            picture = (profile as any)._json.picture;
          }
          
          console.log("✅ Parsed LinkedIn data:", { email, name, picture });
          
          if (!email) {
            console.error("❌ No email found in LinkedIn profile");
            return done(new Error("Failed to fetch user email from LinkedIn"), undefined);
          }

          // Check if user exists
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

          if (existingUser) {
            console.log("✅ Existing user found:", existingUser.email);
            return done(null, existingUser);
          }

          // Create new user
          console.log("✅ Creating new LinkedIn user:", { email, name });
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

          console.log("✅ New user created:", newUser.email);
          return done(null, newUser);
        } catch (error) {
          console.error("❌ LinkedIn OAuth error:", error);
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;

