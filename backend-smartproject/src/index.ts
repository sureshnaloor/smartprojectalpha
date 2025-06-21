import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import dotenv from 'dotenv';
import { corsMiddleware } from "./cors-middleware";
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get('/api/hello', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'API is running' });
});

// Serve static files from the React app build directory
const frontendBuildPath = path.join(__dirname, '../../frontend-smartproject/dist');
app.use(express.static(frontendBuildPath));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // Serve the React app for all other routes
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });

  // ALWAYS serve the API on port 8080
  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    console.log(`🚀 Production server running on port ${port}`);
    console.log(`📁 Serving static files from: ${frontendBuildPath}`);
    console.log(`🌐 Frontend: http://localhost:${port}`);
    console.log(`🔌 API: http://localhost:${port}/api`);
  });
})();
