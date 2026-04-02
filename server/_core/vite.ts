import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Use process.cwd() which is the current working directory (project root)
  const distPath = path.join(process.cwd(), "dist", "public");
  
  console.log(`[Server] Current working directory: ${process.cwd()}`);
  console.log(`[Server] Looking for dist at: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(`[Server] ERROR: dist/public not found at ${distPath}`);
    
    // Try to find where dist actually is
    const possibleDirs = [
      path.join(process.cwd(), "dist"),
      path.join(process.cwd(), "src", "dist"),
      path.join(process.cwd(), "..", "dist"),
    ];
    
    for (const dir of possibleDirs) {
      if (fs.existsSync(dir)) {
        console.log(`[Server] Found dist directory at: ${dir}`);
        const files = fs.readdirSync(dir);
        console.log(`[Server] Contents: ${files.join(", ")}`);
      }
    }
  } else {
    console.log(`[Server] ✓ Found dist/public at ${distPath}`);
    const files = fs.readdirSync(distPath);
    console.log(`[Server] Files in dist/public: ${files.join(", ")}`);
  }

  // Serve static files
  app.use(express.static(distPath));

  // SPA routing: serve index.html for all routes
  app.use("*", (req, res) => {
    const indexPath = path.join(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`[Server] index.html not found at ${indexPath}`);
      res.status(404).send("index.html not found");
    }
  });
}
