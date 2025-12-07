import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, isNull } from "drizzle-orm";
import {
  insertProjectSchema as projectSchema,
  insertWbsItemSchema as wbsItemSchema,
  insertDependencySchema as dependencySchema,
  insertCostEntrySchema as costEntrySchema,
  insertTaskSchema as taskSchema,
  insertActivitySchema,
  insertProjectActivitySchema,
  insertProjectTaskSchema,
  insertResourceSchema,
  insertTaskResourceSchema,
  insertProjectResourceSchema,
  insertCollaborationThreadSchema,
  insertCollaborationMessageSchema,
  insertProjectCollaborationThreadSchema,
  insertProjectCollaborationMessageSchema,
  type Project,
  type WbsItem,
  type Dependency,
  type CostEntry,
  type Task,
  type Activity,
  type Resource,
  type TaskResource,
  collaborationThreads,
  collaborationMessages,
  projectCollaborationThreads,
  projectCollaborationMessages,
  projects,
  tasks
} from "./schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import fileUpload from "express-fileupload";
// Create an inline implementation for cors
const cors = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  };
};
import { DatabaseStorage } from "./storage";
// Create uploadMiddleware using express-fileupload
const uploadMiddleware = fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
// Create an inline error handler
const handleError = (err: unknown, res: Response) => {
  console.error("Server error:", err);

  if (err instanceof ZodError) {
    const validationError = fromZodError(err);
    return res.status(400).json({
      message: "Validation error: " + validationError.message,
      errors: err.errors
    });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "An unexpected error occurred" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Simple test endpoint that doesn't need database
  app.get("/api/hello", (_req: Request, res: Response) => {
    res.json({ message: "Hello from SmartConstruct API!" });
  });

  // Middleware
  app.use(cors());
  app.use(uploadMiddleware);

  // Project routes
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const projectData = projectSchema.parse(req.body);
      const project = await storage.createProject(projectData);

      // Create default top-level WBS items for the project - now all will be Summary type
      const totalBudget = Number(project.budget);
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);

      const topLevelWbsItems = [
        {
          projectId: project.id,
          parentId: null,
          name: "Engineering & Design",
          level: 1,
          code: "1",
          type: "Summary" as const,  // Use const assertion to fix type error
          budgetedCost: totalBudget * 0.05, // 5% of total budget
          isTopLevel: true,
          description: "Engineering and design phase",
          startDate: startDate,
          endDate: endDate,
          duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        {
          projectId: project.id,
          parentId: null,
          name: "Procurement & Construction",
          level: 1,
          code: "2",
          type: "Summary" as const,  // Use const assertion to fix type error
          budgetedCost: totalBudget * 0.85, // 85% of total budget
          isTopLevel: true,
          description: "Procurement and construction phase",
          startDate: startDate,
          endDate: endDate,
          duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        {
          projectId: project.id,
          parentId: null,
          name: "Testing & Commissioning",
          level: 1,
          code: "3",
          type: "Summary" as const,  // Use const assertion to fix type error
          budgetedCost: totalBudget * 0.10, // 10% of total budget
          isTopLevel: true,
          description: "Testing and commissioning phase",
          startDate: startDate,
          endDate: endDate,
          duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        }
      ];

      for (const wbsItem of topLevelWbsItems) {
        await storage.createWbsItem(wbsItem);
      }

      res.status(201).json(project);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Create a partial schema for the project update
      const partialProjectSchema = z.object({
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        budget: z.coerce.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        currency: z.enum(["USD", "EUR", "SAR"]).optional(),
      });

      const projectData = partialProjectSchema.parse(req.body);

      // Check if budget is being changed
      if (projectData.budget !== undefined && projectData.budget !== Number(project.budget)) {
        // Get all WBS items for the project
        const wbsItems = await storage.getWbsItems(id);

        // Check if only the default 3 WBS items exist (no user-added items)
        const hasOnlyDefaultWbs = wbsItems.length === 3 &&
          wbsItems.every(item => item.isTopLevel) &&
          wbsItems.every(item => item.parentId === null);

        if (hasOnlyDefaultWbs) {
          // Calculate budget difference
          const budgetDifference = projectData.budget - Number(project.budget);

          // Find the "Procurement & Construction" WBS item
          const procurementWbs = wbsItems.find(item => item.name === "Procurement & Construction");

          if (procurementWbs) {
            // Adjust the budget of the "Procurement & Construction" WBS item
            const newBudget = Number(procurementWbs.budgetedCost) + budgetDifference;

            // Ensure budget doesn't go negative
            if (newBudget < 0) {
              return res.status(400).json({
                message: "Cannot reduce project budget by this amount as it would result in a negative budget for the Procurement & Construction WBS item"
              });
            }

            // Update the WBS item budget
            await storage.updateWbsItem(procurementWbs.id, {
              budgetedCost: newBudget
            });
          }
        } else {
          // If custom WBS items exist, prevent budget changes
          return res.status(400).json({
            message: "Cannot change project budget after custom WBS items have been added"
          });
        }
      }

      // Convert budget to string if it's a number for storage compatibility
      const storageData = {
        ...projectData,
        budget: projectData.budget !== undefined ? projectData.budget.toString() : undefined
      };

      const updatedProject = await storage.updateProject(id, storageData);

      res.json(updatedProject);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      await storage.deleteProject(id);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Activity routes
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/activities/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }

      const activity = await storage.getActivity(id);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      res.json(activity);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/activities/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }

      const activity = await storage.getActivity(id);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      const activityData = insertActivitySchema.parse(req.body);
      const updatedActivity = await storage.updateActivity(id, activityData);
      res.json(updatedActivity);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/activities/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }

      const activity = await storage.getActivity(id);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      await storage.deleteActivity(id);
      res.json({ message: "Activity deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Project Activity routes
  app.get("/api/projects/:projectId/activities", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const activities = await storage.getProjectActivities(projectId);
      res.json(activities);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/activities", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const activityData = insertProjectActivitySchema.parse({
        ...req.body,
        projectId
      });

      const activity = await storage.createProjectActivity(activityData);
      res.status(201).json(activity);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/activities/:activityId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const activityId = parseInt(req.params.activityId);

      if (isNaN(projectId) || isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const activity = await storage.getProjectActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      if (activity.projectId !== projectId) {
        return res.status(400).json({ message: "Activity does not belong to this project" });
      }

      const activityData = insertProjectActivitySchema.parse({
        ...req.body,
        projectId // Ensure projectId is preserved
      });

      const updatedActivity = await storage.updateProjectActivity(activityId, activityData);
      res.json(updatedActivity);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/activities/:activityId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const activityId = parseInt(req.params.activityId);

      if (isNaN(projectId) || isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const activity = await storage.getProjectActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      if (activity.projectId !== projectId) {
        return res.status(400).json({ message: "Activity does not belong to this project" });
      }

      await storage.deleteProjectActivity(activityId);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Project Task routes
  app.get("/api/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const tasks = await storage.getProjectTasks(projectId);
      res.json(tasks);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const taskData = insertProjectTaskSchema.parse({
        ...req.body,
        projectId
      });

      const task = await storage.createProjectTask(taskData);
      res.status(201).json(task);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/tasks/:taskId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const taskId = parseInt(req.params.taskId);

      if (isNaN(projectId) || isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const task = await storage.getProjectTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.projectId !== projectId) {
        return res.status(400).json({ message: "Task does not belong to this project" });
      }

      const taskData = insertProjectTaskSchema.parse({
        ...req.body,
        projectId // Ensure projectId is preserved
      });

      const updatedTask = await storage.updateProjectTask(taskId, taskData);
      res.json(updatedTask);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/tasks/:taskId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const taskId = parseInt(req.params.taskId);

      if (isNaN(projectId) || isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const task = await storage.getProjectTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.projectId !== projectId) {
        return res.status(400).json({ message: "Task does not belong to this project" });
      }

      await storage.deleteProjectTask(taskId);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // WBS routes
  app.get("/api/projects/:projectId/wbs", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const wbsItems = await storage.getWbsItems(projectId);
      res.json(wbsItems);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/wbs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid WBS item ID" });
      }

      const wbsItem = await storage.getWbsItem(id);
      if (!wbsItem) {
        return res.status(404).json({ message: "WBS item not found" });
      }

      res.json(wbsItem);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/wbs", async (req: Request, res: Response) => {
    try {
      const wbsItemData = wbsItemSchema.parse(req.body);

      // Validate that the project exists
      const project = await storage.getProject(wbsItemData.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Apply additional business rules for WBS hierarchy

      // Rule 1: Top-level items must be Summary
      if (!wbsItemData.parentId && wbsItemData.type !== "Summary") {
        return res.status(400).json({
          message: "Top-level WBS items must be of type 'Summary'"
        });
      }

      // BUDGET VALIDATION
      // If the WBS item has a parent, validate budget constraints
      if (wbsItemData.parentId && wbsItemData.type !== "Activity") {
        const parentWbsItem = await storage.getWbsItem(wbsItemData.parentId);
        if (!parentWbsItem) {
          return res.status(404).json({ message: "Parent WBS item not found" });
        }

        // Check that the new item's budget doesn't exceed parent's budget
        if (wbsItemData.budgetedCost > Number(parentWbsItem.budgetedCost)) {
          return res.status(400).json({
            message: `Budget cannot exceed parent's budget of ${parentWbsItem.budgetedCost}`
          });
        }

        // Get all siblings to validate that total budget doesn't exceed parent budget
        const allWbsItems = await storage.getWbsItems(wbsItemData.projectId);
        const siblings = allWbsItems.filter(
          item => item.parentId === wbsItemData.parentId && item.type !== "Activity"
        );

        // Calculate sum of existing sibling budgets
        const siblingsSum = siblings.reduce((sum, sibling) => sum + Number(sibling.budgetedCost), 0);

        // Check that new item + siblings doesn't exceed parent budget
        if (siblingsSum + wbsItemData.budgetedCost > Number(parentWbsItem.budgetedCost)) {
          return res.status(400).json({
            message: `Sum of all child budgets (${siblingsSum + wbsItemData.budgetedCost}) cannot exceed parent's budget (${parentWbsItem.budgetedCost})`
          });
        }
      }

      // TYPE VALIDATION
      // Rule 2: If parent exists, validate parent-child type relationships
      if (wbsItemData.parentId) {
        const parentWbsItem = await storage.getWbsItem(wbsItemData.parentId);
        if (!parentWbsItem) {
          return res.status(404).json({ message: "Parent WBS item not found" });
        }

        // Rule 2a: If parent is Summary, child can be either WorkPackage or Summary
        if (parentWbsItem.type === "Summary") {
          if (wbsItemData.type === "Activity") {
            return res.status(400).json({
              message: "A 'Summary' WBS item cannot have an 'Activity' as a direct child. It must have a 'WorkPackage' in between."
            });
          }
        }
        // Rule 2b: If parent is WorkPackage, child can only be Activity
        else if (parentWbsItem.type === "WorkPackage") {
          if (wbsItemData.type !== "Activity") {
            return res.status(400).json({
              message: "A 'WorkPackage' can only have 'Activity' items as children"
            });
          }
        }
        // Rule 2c: Activity cannot have children
        else if (parentWbsItem.type === "Activity") {
          return res.status(400).json({
            message: "An 'Activity' item cannot have children"
          });
        }

        // Rule 3: Check if creating a WorkPackage under a non-top-level Summary
        if (wbsItemData.type === "WorkPackage" && parentWbsItem.type === "Summary" && !parentWbsItem.isTopLevel) {
          // Check if there's already a WorkPackage in the hierarchy between top level and this item
          const projectWbsItems = await storage.getWbsItems(wbsItemData.projectId);
          const hasWorkPackageInPath = checkForWorkPackageInPath(projectWbsItems, parentWbsItem);

          if (hasWorkPackageInPath) {
            return res.status(400).json({
              message: "Cannot create a 'WorkPackage' at this level. Only one level of 'WorkPackage' is allowed in the hierarchy."
            });
          }
        }
      }

      const wbsItem = await storage.createWbsItem(wbsItemData);
      res.status(201).json(wbsItem);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/wbs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid WBS item ID" });
      }

      const wbsItem = await storage.getWbsItem(id);
      if (!wbsItem) {
        return res.status(404).json({ message: "WBS item not found" });
      }

      // Use z.object to create a partial schema for validation
      const partialWbsSchema = z.object({
        projectId: z.number().optional(),
        parentId: z.number().nullable().optional(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        level: z.number().optional(),
        code: z.string().optional(),
        type: z.enum(["Summary", "WorkPackage", "Activity"]).optional(),
        budgetedCost: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        duration: z.number().optional(),
        isTopLevel: z.boolean().optional(),
      });

      const wbsItemData = partialWbsSchema.parse(req.body);

      // BUDGET VALIDATION
      // Check if the budget is being changed
      if (wbsItemData.budgetedCost !== undefined && wbsItemData.budgetedCost !== Number(wbsItem.budgetedCost)) {
        // Get all WBS items for the project to validate budget constraints
        const projectWbsItems = await storage.getWbsItems(wbsItem.projectId);

        // 1. If item has a parent, check that new budget doesn't exceed parent budget
        if (wbsItem.parentId) {
          const parentWbsItem = projectWbsItems.find(item => item.id === wbsItem.parentId);
          if (parentWbsItem) {
            // Only apply this constraint to Summary and WorkPackage types (Activity can't have budget)
            if (wbsItem.type !== "Activity" && wbsItemData.budgetedCost > Number(parentWbsItem.budgetedCost)) {
              return res.status(400).json({
                message: `Budget cannot exceed parent's budget of ${parentWbsItem.budgetedCost}`
              });
            }
          }
        }

        // 2. If item has children, check that sum of all children's budgets doesn't exceed this item's budget
        // We don't enforce this for "Activity" types since they can't have children
        if (wbsItem.type !== "Activity") {
          const childItems = projectWbsItems.filter(item => item.parentId === wbsItem.id);
          if (childItems.length > 0) {
            // Calculate sum of child budgets, not including Activities (they have 0 budget)
            const childBudgetSum = childItems
              .filter(child => child.type !== "Activity")
              .reduce((sum, child) => sum + Number(child.budgetedCost), 0);

            if (childBudgetSum > wbsItemData.budgetedCost) {
              return res.status(400).json({
                message: `Budget cannot be less than the sum of child budgets (${childBudgetSum})`
              });
            }
          }
        }
      }

      // TYPE VALIDATION
      // If changing type, apply the same business rules
      if (wbsItemData.type && wbsItemData.type !== wbsItem.type) {
        // Top-level items must be Summary
        if (wbsItem.isTopLevel && wbsItemData.type !== "Summary") {
          return res.status(400).json({
            message: "Top-level WBS items must be of type 'Summary'"
          });
        }

        // Check parent-child type relationships if changing type
        if (wbsItem.parentId) {
          const parentWbsItem = await storage.getWbsItem(wbsItem.parentId);
          if (!parentWbsItem) {
            return res.status(404).json({ message: "Parent WBS item not found" });
          }

          // Apply same rules as in the POST endpoint
          if (parentWbsItem.type === "Summary") {
            if (wbsItemData.type === "Activity") {
              return res.status(400).json({
                message: "A 'Summary' WBS item cannot have an 'Activity' as a direct child. It must have a 'WorkPackage' in between."
              });
            }
          } else if (parentWbsItem.type === "WorkPackage") {
            if (wbsItemData.type !== "Activity") {
              return res.status(400).json({
                message: "A 'WorkPackage' can only have 'Activity' items as children"
              });
            }
          }
        }

        // Check for children compatibility with new type
        const projectWbsItems = await storage.getWbsItems(wbsItem.projectId);
        const children = projectWbsItems.filter(item => item.parentId === wbsItem.id);

        if (children.length > 0) {
          if (wbsItemData.type === "Activity") {
            return res.status(400).json({
              message: "Cannot change to 'Activity' type because this item has children. 'Activity' items cannot have children."
            });
          }

          if (wbsItemData.type === "WorkPackage") {
            const hasNonActivityChildren = children.some(child => child.type !== "Activity");
            if (hasNonActivityChildren) {
              return res.status(400).json({
                message: "Cannot change to 'WorkPackage' type because this item has non-Activity children. 'WorkPackage' items can only have 'Activity' children."
              });
            }
          }
        }
      }

      const updatedWbsItem = await storage.updateWbsItem(id, wbsItemData);

      res.json(updatedWbsItem);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/wbs/:id/progress", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid WBS item ID" });
      }

      const wbsItem = await storage.getWbsItem(id);
      if (!wbsItem) {
        return res.status(404).json({ message: "WBS item not found" });
      }

      const updateData = {
        percentComplete: req.body.percentComplete,
        actualStartDate: req.body.actualStartDate,
        actualEndDate: req.body.actualEndDate
      };

      const updatedWbsItem = await storage.updateWbsItem(id, updateData);
      res.json(updatedWbsItem);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/wbs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid WBS item ID" });
      }

      const wbsItem = await storage.getWbsItem(id);
      if (!wbsItem) {
        return res.status(404).json({ message: "WBS item not found" });
      }

      // Don't allow deletion of top-level WBS items
      if (wbsItem.isTopLevel) {
        return res.status(400).json({ message: "Cannot delete top-level WBS items" });
      }

      await storage.deleteWbsItem(id);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Dependency routes
  app.get("/api/wbs/:wbsItemId/dependencies", async (req: Request, res: Response) => {
    try {
      const wbsItemId = parseInt(req.params.wbsItemId);
      if (isNaN(wbsItemId)) {
        return res.status(400).json({ message: "Invalid WBS item ID" });
      }

      const dependencies = await storage.getDependencies(wbsItemId);
      res.json(dependencies);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/dependencies", async (req: Request, res: Response) => {
    try {
      const dependencyData = dependencySchema.parse(req.body);

      // Check for circular dependencies
      if (dependencyData.predecessorId === dependencyData.successorId) {
        return res.status(400).json({ message: "Cannot create self-dependency" });
      }

      // Validate that both WBS items exist
      const predecessor = await storage.getWbsItem(dependencyData.predecessorId);
      if (!predecessor) {
        return res.status(404).json({ message: "Predecessor WBS item not found" });
      }

      const successor = await storage.getWbsItem(dependencyData.successorId);
      if (!successor) {
        return res.status(404).json({ message: "Successor WBS item not found" });
      }

      // Only Activity items should have dependencies
      if (predecessor.type !== "Activity" || successor.type !== "Activity") {
        return res.status(400).json({
          message: "Dependencies can only be created between 'Activity' items"
        });
      }

      const dependency = await storage.createDependency(dependencyData);
      res.status(201).json(dependency);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/dependencies/:predecessorId/:successorId", async (req: Request, res: Response) => {
    try {
      const predecessorId = parseInt(req.params.predecessorId);
      const successorId = parseInt(req.params.successorId);

      if (isNaN(predecessorId) || isNaN(successorId)) {
        return res.status(400).json({ message: "Invalid dependency IDs" });
      }

      // Get the dependency ID first
      const dependencies = await storage.getDependencies(predecessorId);
      const dependency = dependencies.find(d => d.successorId === successorId);
      if (!dependency) {
        return res.status(404).json({ message: "Dependency not found" });
      }

      await storage.deleteDependency(dependency.id);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Cost entry routes
  app.get("/api/wbs/:wbsItemId/costs", async (req: Request, res: Response) => {
    try {
      const wbsItemId = parseInt(req.params.wbsItemId);
      if (isNaN(wbsItemId)) {
        return res.status(400).json({ message: "Invalid WBS item ID" });
      }

      const costEntries = await storage.getCostEntries(wbsItemId);
      res.json(costEntries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/costs", async (req: Request, res: Response) => {
    try {
      const costEntryData = costEntrySchema.parse(req.body);

      // Validate that the WBS item exists
      const wbsItem = await storage.getWbsItem(costEntryData.wbsItemId);
      if (!wbsItem) {
        return res.status(404).json({ message: "WBS item not found" });
      }

      // Only WorkPackage items can have cost entries
      if (wbsItem.type !== "WorkPackage" && wbsItem.type !== "Summary") {
        return res.status(400).json({
          message: "Cost entries can only be added to 'WorkPackage' or 'Summary' items"
        });
      }

      const costEntry = await storage.createCostEntry(costEntryData);
      res.status(201).json(costEntry);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Fix the CSV import schema
  const csvImportSchema = z.object({
    wbsCode: z.string(),
    amount: z.number(),
    description: z.string().optional(),
    entryDate: z.string().transform(str => new Date(str))
  });

  // Fix the cost import endpoint
  app.post("/api/costs/import", async (req: Request, res: Response) => {
    try {
      const { projectId, csvData } = req.body;

      if (!projectId || !csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Invalid request body" });
      }

      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      try {
        // Validate the CSV data
        const validatedData = csvData.map(row => csvImportSchema.parse(row));

        // Get all WBS items for the project to map codes to IDs
        const wbsItems = await storage.getWbsItems(projectId);
        const wbsItemsByCode = new Map(wbsItems.map(item => [item.code, item]));

        // Transform validated data to cost entries
        const costEntries: Array<{
          wbsItemId: number;
          amount: string;
          description: string;
          entryDate: string;
        }> = [];
        const errors = [];

        for (let i = 0; i < validatedData.length; i++) {
          const row = validatedData[i];
          const wbsItem = wbsItemsByCode.get(row.wbsCode);

          if (!wbsItem) {
            errors.push(`Row ${i + 1}: WBS code '${row.wbsCode}' not found`);
            continue;
          }

          // Check if WBS item is of a type that can accept costs
          if (wbsItem.type !== "WorkPackage" && wbsItem.type !== "Summary") {
            errors.push(`Row ${i + 1}: WBS code '${row.wbsCode}' is of type '${wbsItem.type}'. Cost entries can only be added to 'Summary' or 'WorkPackage' types. 'Activity' type items cannot have costs.`);
            continue;
          }

          costEntries.push({
            wbsItemId: wbsItem.id,
            amount: row.amount.toString(),
            description: row.description || "",
            entryDate: row.entryDate.toISOString()
          });
        }

        if (errors.length > 0) {
          return res.status(400).json({
            message: "Validation errors in CSV data",
            errors
          });
        }

        if (costEntries.length === 0) {
          return res.status(400).json({ message: "No valid cost entries found in the CSV data" });
        }

        // Create entries one by one
        const createdEntries = await Promise.all(
          costEntries.map(entry => storage.createCostEntry(entry))
        );
        return res.status(201).json(createdEntries);
      } catch (validationError) {
        console.error("CSV validation error:", validationError);
        return res.status(400).json({
          message: "Invalid CSV data format",
          error: validationError instanceof Error ? validationError.message : "Unknown validation error"
        });
      }
    } catch (err) {
      console.error("Error importing costs:", err);
      handleError(err, res);
    }
  });

  app.delete("/api/costs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cost entry ID" });
      }

      await storage.deleteCostEntry(id);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/wbs/import", async (req: Request, res: Response) => {
    try {
      const { projectId, csvData } = req.body;

      if (!projectId || !csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Invalid request body" });
      }

      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get all existing WBS items for the project
      const existingWbsItems = await storage.getWbsItems(projectId);

      // Create a mapping of WBS codes to WBS items for easy lookup
      const wbsItemsByCode = new Map(existingWbsItems.map(item => [item.code, item]));

      // Track any validation errors
      const errors = [];
      const results = [];

      // Process each WBS item in the CSV data
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];

        // Skip invalid rows
        if (!row.wbsCode || !row.wbsName || !row.wbsType) {
          errors.push(`Row ${i + 1}: Missing required fields (wbsCode, wbsName, wbsType)`);
          continue;
        }

        // Validate WBS type
        if (!["Summary", "WorkPackage", "Activity"].includes(row.wbsType)) {
          errors.push(`Row ${i + 1}: Invalid WBS type '${row.wbsType}' - must be Summary, WorkPackage, or Activity`);
          continue;
        }

        // Parse level and parent from the WBS code
        const codeParts = row.wbsCode.split('.');
        const level = codeParts.length;
        let parentCode = null;
        let parentId = null;

        if (level > 1) {
          // If not top level, get parent code by removing the last part
          parentCode = codeParts.slice(0, -1).join('.');
          const parentItem = wbsItemsByCode.get(parentCode);

          if (!parentItem) {
            errors.push(`Row ${i + 1}: Parent WBS item with code '${parentCode}' not found`);
            continue;
          }

          parentId = parentItem.id;

          // Parent-child type validation
          if (parentItem.type === "Summary" && row.wbsType === "Activity") {
            errors.push(`Row ${i + 1}: 'Summary' parent cannot have 'Activity' as a direct child`);
            continue;
          } else if (parentItem.type === "WorkPackage" && row.wbsType !== "Activity") {
            errors.push(`Row ${i + 1}: 'WorkPackage' parent can only have 'Activity' children`);
            continue;
          } else if (parentItem.type === "Activity") {
            errors.push(`Row ${i + 1}: 'Activity' items cannot have children`);
            continue;
          }
        }

        // Type-specific validations
        if (row.wbsType === "Summary" || row.wbsType === "WorkPackage") {
          // Validate budget (required for these types)
          if (!row.amount || isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
            errors.push(`Row ${i + 1}: ${row.wbsType} type must have a positive budget amount`);
            continue;
          }

          // Summary and WorkPackage should not have dates
          if (row.startDate || row.endDate || row.duration) {
            errors.push(`Row ${i + 1}: ${row.wbsType} type cannot have dates (startDate, endDate, or duration)`);
            continue;
          }
        } else if (row.wbsType === "Activity") {
          // Validate dates for Activity items
          if ((!row.startDate && !row.endDate) || (!row.startDate && !row.duration)) {
            errors.push(`Row ${i + 1}: Activity type must have startDate and either endDate or duration`);
            continue;
          }

          // Parse dates if provided
          let startDate = null;
          let endDate = null;
          let duration = null;

          if (row.startDate) {
            try {
              startDate = new Date(row.startDate);
              if (isNaN(startDate.getTime())) {
                errors.push(`Row ${i + 1}: Invalid startDate format`);
                continue;
              }
            } catch (e) {
              errors.push(`Row ${i + 1}: Invalid startDate format`);
              continue;
            }
          }

          if (row.endDate) {
            try {
              endDate = new Date(row.endDate);
              if (isNaN(endDate.getTime())) {
                errors.push(`Row ${i + 1}: Invalid endDate format`);
                continue;
              }
            } catch (e) {
              errors.push(`Row ${i + 1}: Invalid endDate format`);
              continue;
            }
          }

          if (row.duration) {
            duration = Number(row.duration);
            if (isNaN(duration) || duration <= 0) {
              errors.push(`Row ${i + 1}: Duration must be a positive number`);
              continue;
            }
          }

          // Calculate missing values
          if (startDate && endDate && !duration) {
            // Calculate duration from start and end dates
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else if (startDate && duration && !endDate) {
            // Calculate end date from start date and duration
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);
          }

          // Ensure dates are consistent
          if (startDate && endDate && startDate > endDate) {
            errors.push(`Row ${i + 1}: Start date cannot be after end date`);
            continue;
          }

          // Activities can't have budget
          if (row.amount && Number(row.amount) !== 0) {
            errors.push(`Row ${i + 1}: Activity type cannot have a budget amount (must be 0 or empty)`);
            continue;
          }
        }

        // Prepare WBS item data
        const wbsItemData = {
          projectId,
          parentId,
          name: row.wbsName,
          description: row.wbsDescription || "",
          level,
          code: row.wbsCode,
          type: row.wbsType,
          budgetedCost: row.wbsType === "Activity" ? 0 : Number(row.amount),
          startDate: row.wbsType === "Activity" && row.startDate ? new Date(row.startDate) : undefined,
          endDate: row.wbsType === "Activity" && row.endDate ? new Date(row.endDate) : undefined,
          duration: row.wbsType === "Activity" && row.duration ? Number(row.duration) : undefined,
          isTopLevel: level === 1,
        };

        try {
          let result;
          const existingItem = wbsItemsByCode.get(row.wbsCode);

          if (existingItem) {
            // Update existing WBS item
            result = await storage.updateWbsItem(existingItem.id, wbsItemData);
            results.push({ ...result, status: "updated" });
          } else {
            // Create new WBS item
            result = await storage.createWbsItem(wbsItemData);
            results.push({ ...result, status: "created" });

            // Add to the mapping for parent-child validation of subsequent items
            wbsItemsByCode.set(result.code, result);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Row ${i + 1}: Failed to process WBS item - ${errorMessage}`);
        }
      }

      // Return errors if any
      if (errors.length > 0) {
        return res.status(400).json({
          message: "Some WBS items could not be imported",
          errors,
          results
        });
      }

      // Return success
      return res.status(200).json({
        message: "All WBS items imported successfully",
        count: results.length,
        results
      });
    } catch (err) {
      console.error("Error importing WBS items:", err);
      handleError(err, res);
    }
  });

  // Add endpoint to get all dependencies for a project
  app.get("/api/projects/:projectId/dependencies", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get all WBS items for the project
      const wbsItems = await storage.getWbsItems(projectId);
      const activityIds = wbsItems
        .filter(item => item.type === "Activity")
        .map(item => item.id);

      // Get dependencies for all activities
      const allDependencies = await Promise.all(
        activityIds.map(id => storage.getDependencies(id))
      );

      // Flatten and return all dependencies
      const dependencies = allDependencies.flat();
      res.json(dependencies);
    } catch (err: unknown) {
      handleError(err, res);
    }
  });

  app.post("/api/wbs/activities/import", async (req: Request, res: Response) => {
    try {
      const { projectId, workPackageId, csvData } = req.body;

      if (!projectId || !csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Invalid request body" });
      }

      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get all WBS items for the project to map codes to IDs
      const wbsItems = await storage.getWbsItems(projectId);
      const wbsItemsByCode = new Map(wbsItems.map(item => [item.code, item]));

      // Check if the workPackage exists if provided
      let parentWorkPackage = null;
      if (workPackageId) {
        parentWorkPackage = wbsItems.find(item => item.id === workPackageId);
        if (!parentWorkPackage) {
          return res.status(404).json({ message: "Work Package not found" });
        }
        if (parentWorkPackage.type !== "WorkPackage") {
          return res.status(400).json({ message: "Provided ID is not a Work Package" });
        }
      }

      // Track any validation errors
      const errors = [];
      const results = [];

      // Process each activity in the CSV data
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];

        // Skip invalid rows
        if (!row.code) {
          errors.push(`Row ${i + 1}: Missing required activity code`);
          continue;
        }

        if (!row.name) {
          errors.push(`Row ${i + 1}: Missing required activity name`);
          continue;
        }

        // Find the WBS item by code
        const existingItem = wbsItemsByCode.get(row.code);
        const isUpdate = !!existingItem;

        // Parse dates if provided
        let startDate = null;
        let endDate = null;
        let duration = null;

        if (row.startDate) {
          try {
            startDate = new Date(row.startDate);
            if (isNaN(startDate.getTime())) {
              errors.push(`Row ${i + 1}: Invalid startDate format`);
              continue;
            }
          } catch (e) {
            errors.push(`Row ${i + 1}: Invalid startDate format`);
            continue;
          }
        } else {
          errors.push(`Row ${i + 1}: startDate is required for Activities`);
          continue;
        }

        if (row.endDate) {
          try {
            endDate = new Date(row.endDate);
            if (isNaN(endDate.getTime())) {
              errors.push(`Row ${i + 1}: Invalid endDate format`);
              continue;
            }
          } catch (e) {
            errors.push(`Row ${i + 1}: Invalid endDate format`);
            continue;
          }
        }

        if (row.duration) {
          duration = Number(row.duration);
          if (isNaN(duration) || duration <= 0) {
            errors.push(`Row ${i + 1}: Duration must be a positive number`);
            continue;
          }
        }

        // For new activities, require either duration or endDate
        if (!isUpdate && !row.duration && !row.endDate) {
          errors.push(`Row ${i + 1}: Either duration or endDate must be provided for new activities`);
          continue;
        }

        // Calculate missing values
        if (startDate && endDate && !duration) {
          // Calculate duration from start and end dates
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include end day
        } else if (startDate && duration && !endDate) {
          // Calculate end date from start date and duration
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + duration - 1); // -1 because duration includes the start day
        }

        // Ensure dates are consistent
        if (startDate && endDate && startDate > endDate) {
          errors.push(`Row ${i + 1}: Start date cannot be after end date`);
          continue;
        }

        try {
          // If existing item and it's an activity, update it
          if (isUpdate) {
            if (existingItem.type !== "Activity") {
              errors.push(`Row ${i + 1}: Item with code '${row.code}' exists but is not an Activity (type: ${existingItem.type})`);
              continue;
            }

            // If workPackageId is specified, validate that the activity belongs to this work package
            if (workPackageId && existingItem.parentId !== workPackageId) {
              errors.push(`Row ${i + 1}: Activity with code '${row.code}' exists but belongs to a different Work Package`);
              continue;
            }

            // Update activity data
            const activityData = {
              name: row.name,
              description: row.description || existingItem.description || "",
              startDate: startDate || undefined,
              endDate: endDate || undefined,
              duration: duration || undefined,
              percentComplete: row.percentComplete !== undefined ? Number(row.percentComplete) : existingItem.percentComplete
            };

            // Update the existing activity
            const updatedItem = await storage.updateWbsItem(existingItem.id, activityData);
            results.push({ ...updatedItem, status: "updated" });
          } else {
            // Create new activity
            if (!workPackageId) {
              errors.push(`Row ${i + 1}: Cannot create new activity '${row.code}' without specifying a Work Package`);
              continue;
            }

            if (!parentWorkPackage) {
              errors.push(`Row ${i + 1}: Parent Work Package not found`);
              continue;
            }

            // Prepare new activity data
            const newActivity = {
              projectId,
              parentId: workPackageId,
              name: row.name,
              description: row.description || "",
              level: parentWorkPackage.level + 1,
              code: row.code,
              type: "Activity" as "Summary" | "WorkPackage" | "Activity",
              budgetedCost: 0, // Activities don't have budget
              actualCost: 0,
              percentComplete: row.percentComplete ? Number(row.percentComplete) : 0,
              startDate: startDate as Date,
              endDate: endDate || undefined,
              duration: duration || undefined,
              isTopLevel: false,
            };

            // Create the new activity
            const createdItem = await storage.createWbsItem(newActivity);
            results.push({ ...createdItem, status: "created" });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Row ${i + 1}: Failed to ${isUpdate ? 'update' : 'create'} Activity - ${errorMessage}`);
        }
      }

      // Return errors if any
      if (errors.length > 0) {
        return res.status(400).json({
          message: "Some activities could not be processed",
          errors,
          results
        });
      }

      // Return success
      return res.status(200).json({
        message: "Activities processed successfully",
        count: results.length,
        created: results.filter(r => r.status === "created").length,
        updated: results.filter(r => r.status === "updated").length,
        results
      });
    } catch (err) {
      console.error("Error importing activities:", err);
      handleError(err, res);
    }
  });

  // Endpoint for finalizing a project schedule - simplified approach to avoid linter errors
  app.post("/api/projects/:projectId/schedule/finalize", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Fetch all WBS items for the project
      const wbsItems = await storage.getWbsItems(projectId);

      // Get all dependencies for the project
      const activityIds = wbsItems
        .filter(item => item.type === "Activity")
        .map(item => item.id);
      const allDependencies = await Promise.all(
        activityIds.map(id => storage.getDependencies(id))
      );
      const dependencies = allDependencies.flat();

      // Keep track of updated items
      const updatedItems: any[] = [];
      const errors: string[] = [];

      // Skip activity items that don't have dates
      const activitiesWithDates = wbsItems.filter(
        item => item.type === "Activity" && item.startDate && item.endDate
      );

      // Create a map for quick lookup
      const itemMap = new Map();
      activitiesWithDates.forEach(item => {
        itemMap.set(item.id, { ...item });
      });

      // Group dependencies by successor
      const successorDeps = new Map<number, Dependency[]>();
      dependencies.forEach((dep: Dependency) => {
        const sucDeps = successorDeps.get(dep.successorId) || [];
        sucDeps.push(dep);
        successorDeps.set(dep.successorId, sucDeps);
      });

      // Update dates based on dependencies
      for (const item of activitiesWithDates) {
        const deps = successorDeps.get(item.id);
        if (!deps || deps.length === 0) continue;

        let newStartDate = item.startDate ? new Date(item.startDate) : new Date();
        let newEndDate = item.endDate ? new Date(item.endDate) : new Date();
        let datesChanged = false;

        for (const dep of deps) {
          const predecessor = itemMap.get(dep.predecessorId);
          if (!predecessor) continue;

          const predStartDate = new Date(predecessor.startDate);
          const predEndDate = new Date(predecessor.endDate);
          const lag = dep.lag || 0;

          // Apply constraints based on dependency type
          switch (dep.type) {
            case "FS": // Finish-to-Start: successor can't start until predecessor finishes
              const fsDate = new Date(predEndDate);
              fsDate.setDate(fsDate.getDate() + lag);
              if (fsDate > newStartDate) {
                // Calculate the shift in days
                const shiftDays = Math.ceil((fsDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
                newStartDate = fsDate;
                newEndDate.setDate(newEndDate.getDate() + shiftDays);
                datesChanged = true;
              }
              break;

            case "SS": // Start-to-Start: successor can't start until predecessor starts
              const ssDate = new Date(predStartDate);
              ssDate.setDate(ssDate.getDate() + lag);
              if (ssDate > newStartDate) {
                // Calculate the shift in days
                const shiftDays = Math.ceil((ssDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
                newStartDate = ssDate;
                newEndDate.setDate(newEndDate.getDate() + shiftDays);
                datesChanged = true;
              }
              break;

            case "FF": // Finish-to-Finish: successor can't finish until predecessor finishes
              const ffDate = new Date(predEndDate);
              ffDate.setDate(ffDate.getDate() + lag);
              if (ffDate > newEndDate) {
                // Keep the duration the same, shift both dates
                const duration = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
                newEndDate = ffDate;
                newStartDate = new Date(newEndDate);
                newStartDate.setDate(newStartDate.getDate() - duration);
                datesChanged = true;
              }
              break;

            case "SF": // Start-to-Finish: successor can't finish until predecessor starts
              const sfDate = new Date(predStartDate);
              sfDate.setDate(sfDate.getDate() + lag);
              if (sfDate > newEndDate) {
                // Keep the duration the same, shift both dates
                const duration = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
                newEndDate = sfDate;
                newStartDate = new Date(newEndDate);
                newStartDate.setDate(newStartDate.getDate() - duration);
                datesChanged = true;
              }
              break;
          }
        }

        // If dates have changed, update the item
        if (datesChanged) {
          try {
            const updatedItem = await storage.updateWbsItem(item.id, {
              startDate: newStartDate,
              endDate: newEndDate,
              duration: Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
            });

            updatedItems.push(updatedItem);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push(`Failed to update item ${item.id} (${item.code}): ${errorMessage}`);
          }
        }
      }

      return res.status(200).json({
        message: "Schedule finalized successfully",
        updatedCount: updatedItems.length,
        errorCount: errors.length,
        errors
      });
    } catch (err: any) {
      console.error("Error finalizing schedule:", err);
      res.status(500).json({
        message: err.message || "Internal server error"
      });
    }
  });

  // Task routes
  app.get("/api/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const tasks = await storage.getTasks(projectId);
      res.json(tasks);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/activities/:activityId/tasks", async (req: Request, res: Response) => {
    try {
      const activityId = parseInt(req.params.activityId);
      if (isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }

      const tasks = await storage.getTasks(activityId);
      res.json(tasks);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      console.log("Creating task with request body:", JSON.stringify(req.body, null, 2));

      // Ensure required fields have default values if missing
      const taskRequest = {
        ...req.body,
        percentComplete: req.body.percentComplete ?? 0,
        projectId: req.body.projectId || null // Will be set from activity later
      };

      console.log("Adjusted task request:", JSON.stringify(taskRequest, null, 2));

      // Pre-validate
      if (taskRequest.startDate) {
        // If start date is provided, check that we have either endDate OR duration, but not both
        if (taskRequest.endDate !== undefined && taskRequest.duration !== undefined) {
          return res.status(400).json({
            message: "Validation error: Cannot provide both end date and duration",
            errors: [{
              code: "custom",
              message: "Either end date or duration must be provided, but not both",
              path: ["endDate"]
            }]
          });
        }

        // Check that at least one of endDate or duration is provided
        if (taskRequest.endDate === undefined && taskRequest.duration === undefined) {
          return res.status(400).json({
            message: "Validation error: When start date is provided, either end date or duration must be provided",
            errors: [{
              code: "custom",
              message: "When start date is provided, either end date or duration must be provided",
              path: ["endDate"]
            }]
          });
        }
      }

      // Try validation
      try {
        // Attempt validation
        const validationResult = taskSchema.safeParse(taskRequest);
        if (!validationResult.success) {
          console.error("Task validation failed:", JSON.stringify(validationResult.error, null, 2));
          return res.status(400).json({
            message: "Validation error",
            errors: validationResult.error.errors
          });
        }

        const taskData = validationResult.data;
        console.log("Validated task data:", JSON.stringify(taskData, null, 2));

        // Check if the activity exists
        const activity = await storage.getActivity(taskData.activityId);
        if (!activity) {
          return res.status(404).json({ message: "Activity not found" });
        }

        // Set the project ID to null since tasks are not directly linked to projects
        taskData.projectId = null;

        // Ensure dates are properly converted to Date objects for storage
        if (typeof taskData.startDate === 'string' && taskData.startDate) {
          taskData.startDate = new Date(taskData.startDate);
        }

        if (typeof taskData.endDate === 'string' && taskData.endDate) {
          taskData.endDate = new Date(taskData.endDate);
        }

        const task = await storage.createTask(taskData);
        res.status(201).json(task);
      } catch (validationError) {
        console.error("Validation processing error:", validationError);
        throw validationError;
      }
    } catch (err) {
      console.error("Error creating task:", err);
      handleError(err, res);
    }
  });

  // Fix the bulk tasks endpoint
  app.post("/api/tasks/bulk", async (req: Request, res: Response) => {
    try {
      const tasks = req.body.map((task: {
        activityId: number;
        projectId: number;
        name: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        duration?: number;
        percentComplete?: number;
      }) => ({
        activityId: task.activityId,
        projectId: task.projectId,
        name: task.name,
        description: task.description || "",
        startDate: task.startDate ? new Date(task.startDate).toISOString() : null,
        endDate: task.endDate ? new Date(task.endDate).toISOString() : null,
        duration: task.duration || null,
        percentComplete: (task.percentComplete || 0).toString()
      }));

      const createdTasks = await Promise.all(
        tasks.map((task: {
          activityId: number;
          projectId: number;
          name: string;
          description: string;
          startDate: string | null;
          endDate: string | null;
          duration: number | null;
          percentComplete: string;
        }) => storage.createTask(task))
      );

      res.status(201).json(createdTasks);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Fix the task update endpoint
  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Validate and parse the task data
      const taskData = z.object({
        activityId: z.number().optional(),
        projectId: z.number().optional(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        duration: z.number().optional(),
        percentComplete: z.number().min(0).max(100).optional(),
      }).parse(req.body);

      // If changing activity, check if it exists
      if (taskData.activityId && taskData.activityId !== task.activityId) {
        const activity = await storage.getActivity(taskData.activityId);
        if (!activity) {
          return res.status(404).json({ message: "Activity not found" });
        }

        // Set project ID to null since tasks are not directly linked to projects
        taskData.projectId = null;
      }

      // Create a properly typed object for the update
      const taskDataWithDateConversion: Partial<Task> = {
        ...taskData,
        startDate: taskData.startDate ? new Date(taskData.startDate).toISOString() : null,
        endDate: taskData.endDate ? new Date(taskData.endDate).toISOString() : null,
        duration: taskData.duration || null,
        percentComplete: taskData.percentComplete !== undefined ? taskData.percentComplete : null
      };

      const updatedTask = await storage.updateTask(id, taskDataWithDateConversion);
      res.json(updatedTask);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      await storage.deleteTask(id);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/dependencies", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.query.projectId as string);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const dependencies = await storage.getDependencies(projectId);
      res.json(dependencies);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      const activityId = req.query.activityId ? parseInt(req.query.activityId as string) : null;

      if (activityId !== null && isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }

      // If activityId is provided, filter tasks by activity
      if (activityId !== null) {
        const result = await db.select().from(tasks).where(eq(tasks.activityId, activityId));
        res.json(result);
      } else {
        // Return all tasks if no activityId is provided
        const result = await db.select().from(tasks);
        res.json(result);
      }
    } catch (err) {
      handleError(err, res);
    }
  });

  // Fix the bulk cost entries endpoint
  app.post("/api/costs/bulk", async (req: Request, res: Response) => {
    try {
      const costEntries = req.body.map((entry: {
        wbsItemId: number;
        amount: number;
        description?: string;
        entryDate: string;
      }) => ({
        wbsItemId: entry.wbsItemId,
        amount: entry.amount.toString(),
        description: entry.description || "",
        entryDate: new Date(entry.entryDate).toISOString()
      }));

      const createdEntries = await Promise.all(
        costEntries.map((entry: {
          wbsItemId: number;
          amount: string;
          description: string;
          entryDate: string;
        }) => storage.createCostEntry(entry))
      );

      res.status(201).json(createdEntries);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Resource routes
  app.get("/api/resources", async (req: Request, res: Response) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }

      const resource = await storage.getResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      res.json(resource);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/resources", async (req: Request, res: Response) => {
    try {
      const resourceData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(resourceData);
      res.status(201).json(resource);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }

      const resource = await storage.getResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      const resourceData = insertResourceSchema.partial().parse(req.body);
      const updatedResource = await storage.updateResource(id, resourceData);
      res.json(updatedResource);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/resources/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }

      const resource = await storage.getResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      await storage.deleteResource(id);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Task Resource routes
  app.get("/api/tasks/:taskId/resources", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const taskResources = await storage.getTaskResources(taskId);
      res.json(taskResources);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/tasks/:taskId/resources", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const taskResourceData = insertTaskResourceSchema.parse({
        ...req.body,
        taskId
      });
      const taskResource = await storage.createTaskResource(taskResourceData);
      res.status(201).json(taskResource);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/task-resources/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task resource ID" });
      }

      const taskResourceData = insertTaskResourceSchema.partial().parse(req.body);
      const updatedTaskResource = await storage.updateTaskResource(id, taskResourceData);
      res.json(updatedTaskResource);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/task-resources/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task resource ID" });
      }

      await storage.deleteTaskResource(id);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // Collaboration Routes
  // ========================================

  // Get all global threads (no project filter)
  app.get("/api/collaboration/threads", async (req: Request, res: Response) => {
    try {
      const { type, search, limit, offset } = req.query;

      let query = db
        .select()
        .from(collaborationThreads)
        .where(isNull(collaborationThreads.projectId))
        .orderBy(collaborationThreads.updatedAt);

      // Apply filters
      if (type && typeof type === 'string') {
        query = query.where(eq(collaborationThreads.type, type));
      }

      // Note: Search filtering would need to be done after fetching
      // For now, we'll fetch all and filter in memory
      const allThreads = await query;

      let filteredThreads = allThreads;

      // Apply search filter
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredThreads = allThreads.filter(thread =>
          thread.title.toLowerCase().includes(searchLower) ||
          thread.createdByName.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const offsetNum = offset ? parseInt(offset as string) : 0;

      if (limitNum) {
        filteredThreads = filteredThreads.slice(offsetNum, offsetNum + limitNum);
      }

      // Get message counts for each thread
      const threadsWithCounts = await Promise.all(
        filteredThreads.map(async (thread) => {
          const messages = await db
            .select()
            .from(collaborationMessages)
            .where(eq(collaborationMessages.threadId, thread.id));

          return {
            ...thread,
            messageCount: messages.length,
            lastMessageAt: messages.length > 0
              ? messages[messages.length - 1].createdAt
              : thread.createdAt,
          };
        })
      );

      res.json(threadsWithCounts);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get threads for a specific project
  app.get("/api/collaboration/threads/:projectId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { type, search, limit, offset } = req.query;

      let query = db
        .select()
        .from(collaborationThreads)
        .where(eq(collaborationThreads.projectId, projectId))
        .orderBy(collaborationThreads.updatedAt);

      // Apply type filter
      if (type && typeof type === 'string') {
        query = query.where(eq(collaborationThreads.type, type));
      }

      const allThreads = await query;

      let filteredThreads = allThreads;

      // Apply search filter
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredThreads = allThreads.filter(thread =>
          thread.title.toLowerCase().includes(searchLower) ||
          thread.createdByName.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const offsetNum = offset ? parseInt(offset as string) : 0;

      if (limitNum) {
        filteredThreads = filteredThreads.slice(offsetNum, offsetNum + limitNum);
      }

      // Get message counts for each thread
      const threadsWithCounts = await Promise.all(
        filteredThreads.map(async (thread) => {
          const messages = await db
            .select()
            .from(collaborationMessages)
            .where(eq(collaborationMessages.threadId, thread.id));

          return {
            ...thread,
            messageCount: messages.length,
            lastMessageAt: messages.length > 0
              ? messages[messages.length - 1].createdAt
              : thread.createdAt,
          };
        })
      );

      res.json(threadsWithCounts);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create a new thread
  app.post("/api/collaboration/threads", async (req: Request, res: Response) => {
    try {
      const threadData = insertCollaborationThreadSchema.parse(req.body);

      // If projectId is provided, validate that the project exists
      if (threadData.projectId) {
        const project = await storage.getProject(threadData.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
      }

      const [thread] = await db
        .insert(collaborationThreads)
        .values(threadData)
        .returning();

      res.status(201).json(thread);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Update a thread (e.g., close/reopen)
  app.patch("/api/collaboration/threads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid thread ID" });
      }

      const updateSchema = z.object({
        title: z.string().optional(),
        isClosed: z.boolean().optional(),
      });

      const updateData = updateSchema.parse(req.body);

      const [updatedThread] = await db
        .update(collaborationThreads)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(collaborationThreads.id, id))
        .returning();

      if (!updatedThread) {
        return res.status(404).json({ message: "Thread not found" });
      }

      res.json(updatedThread);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Delete a thread
  app.delete("/api/collaboration/threads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid thread ID" });
      }

      await db
        .delete(collaborationThreads)
        .where(eq(collaborationThreads.id, id));

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get all messages in a thread
  app.get("/api/collaboration/threads/:threadId/messages", async (req: Request, res: Response) => {
    try {
      const threadId = parseInt(req.params.threadId);
      if (isNaN(threadId)) {
        return res.status(400).json({ message: "Invalid thread ID" });
      }

      // Verify thread exists
      const [thread] = await db
        .select()
        .from(collaborationThreads)
        .where(eq(collaborationThreads.id, threadId));

      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }

      const messages = await db
        .select()
        .from(collaborationMessages)
        .where(eq(collaborationMessages.threadId, threadId))
        .orderBy(collaborationMessages.createdAt);

      res.json(messages);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create a new message in a thread
  app.post("/api/collaboration/threads/:threadId/messages", async (req: Request, res: Response) => {
    try {
      const threadId = parseInt(req.params.threadId);
      if (isNaN(threadId)) {
        return res.status(400).json({ message: "Invalid thread ID" });
      }

      // Verify thread exists
      const [thread] = await db
        .select()
        .from(collaborationThreads)
        .where(eq(collaborationThreads.id, threadId));

      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }

      const messageData = insertCollaborationMessageSchema.parse({
        ...req.body,
        threadId,
      });

      const [message] = await db
        .insert(collaborationMessages)
        .values(messageData)
        .returning();

      // Update thread's updatedAt timestamp
      await db
        .update(collaborationThreads)
        .set({ updatedAt: new Date() })
        .where(eq(collaborationThreads.id, threadId));

      res.status(201).json(message);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Delete a message
  app.delete("/api/collaboration/messages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      await db
        .delete(collaborationMessages)
        .where(eq(collaborationMessages.id, id));

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========== PROJECT COLLABORATION ROUTES ==========

  // Get all threads for a specific project
  app.get("/api/projects/:projectId/collaboration/threads", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { type, search, limit, offset } = req.query;

      let query = db
        .select()
        .from(projectCollaborationThreads)
        .where(eq(projectCollaborationThreads.projectId, projectId))
        .orderBy(projectCollaborationThreads.updatedAt);

      // Apply type filter
      if (type && typeof type === 'string') {
        query = query.where(eq(projectCollaborationThreads.type, type));
      }

      const allThreads = await query;

      let filteredThreads = allThreads;

      // Apply search filter
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredThreads = allThreads.filter(thread =>
          thread.title.toLowerCase().includes(searchLower) ||
          thread.createdByName.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const offsetNum = offset ? parseInt(offset as string) : 0;

      if (limitNum) {
        filteredThreads = filteredThreads.slice(offsetNum, offsetNum + limitNum);
      }

      // Get message counts for each thread
      const threadsWithCounts = await Promise.all(
        filteredThreads.map(async (thread) => {
          const messages = await db
            .select()
            .from(projectCollaborationMessages)
            .where(eq(projectCollaborationMessages.threadId, thread.id));

          return {
            ...thread,
            messageCount: messages.length,
            lastMessageAt: messages.length > 0
              ? messages[messages.length - 1].createdAt
              : thread.createdAt,
          };
        })
      );

      res.json(threadsWithCounts);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create a new thread in a project
  app.post("/api/projects/:projectId/collaboration/threads", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Verify project exists
      const project = await db.select().from(projects).where(eq(projects.id, projectId));
      if (project.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }

      const threadData = insertProjectCollaborationThreadSchema.parse({
        ...req.body,
        projectId,
      });

      const [thread] = await db
        .insert(projectCollaborationThreads)
        .values(threadData)
        .returning();

      res.status(201).json(thread);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Update a project thread (close/reopen)
  app.patch("/api/projects/:projectId/collaboration/threads/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const id = parseInt(req.params.id);

      if (isNaN(projectId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid project or thread ID" });
      }

      const updateSchema = z.object({
        title: z.string().optional(),
        isClosed: z.boolean().optional(),
      });

      const updateData = updateSchema.parse(req.body);

      const [updatedThread] = await db
        .update(projectCollaborationThreads)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(projectCollaborationThreads.id, id))
        .returning();

      if (!updatedThread) {
        return res.status(404).json({ message: "Thread not found" });
      }

      res.json(updatedThread);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Delete a project thread
  app.delete("/api/projects/:projectId/collaboration/threads/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const id = parseInt(req.params.id);

      if (isNaN(projectId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid project or thread ID" });
      }

      await db
        .delete(projectCollaborationThreads)
        .where(eq(projectCollaborationThreads.id, id));

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get all messages in a project thread
  app.get("/api/projects/:projectId/collaboration/threads/:threadId/messages", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const threadId = parseInt(req.params.threadId);

      if (isNaN(projectId) || isNaN(threadId)) {
        return res.status(400).json({ message: "Invalid project or thread ID" });
      }

      const messages = await db
        .select()
        .from(projectCollaborationMessages)
        .where(eq(projectCollaborationMessages.threadId, threadId))
        .orderBy(projectCollaborationMessages.createdAt);

      res.json(messages);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create a message in a project thread
  app.post("/api/projects/:projectId/collaboration/threads/:threadId/messages", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const threadId = parseInt(req.params.threadId);

      if (isNaN(projectId) || isNaN(threadId)) {
        return res.status(400).json({ message: "Invalid project or thread ID" });
      }

      const messageData = insertProjectCollaborationMessageSchema.parse({
        ...req.body,
        threadId,
      });

      const [message] = await db
        .insert(projectCollaborationMessages)
        .values(messageData)
        .returning();

      // Update thread's updatedAt timestamp
      await db
        .update(projectCollaborationThreads)
        .set({ updatedAt: new Date() })
        .where(eq(projectCollaborationThreads.id, threadId));

      res.status(201).json(message);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Delete a project message
  app.delete("/api/projects/:projectId/collaboration/messages/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const id = parseInt(req.params.id);

      if (isNaN(projectId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid project or message ID" });
      }

      await db
        .delete(projectCollaborationMessages)
        .where(eq(projectCollaborationMessages.id, id));

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Project Resource routes
  app.get("/api/projects/:projectId/resources", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const resources = await storage.getProjectResources(projectId);
      res.json(resources);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/resources", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const resourceData = insertProjectResourceSchema.parse({
        ...req.body,
        projectId
      });

      const resource = await storage.createProjectResource(resourceData);
      res.status(201).json(resource);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/resources/:resourceId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const resourceId = parseInt(req.params.resourceId);

      if (isNaN(projectId) || isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const resource = await storage.getProjectResource(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      if (resource.projectId !== projectId) {
        return res.status(400).json({ message: "Resource does not belong to this project" });
      }

      const resourceData = insertProjectResourceSchema.parse({
        ...req.body,
        projectId // Ensure projectId is preserved
      });

      const updatedResource = await storage.updateProjectResource(resourceId, resourceData);
      res.json(updatedResource);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/resources/:resourceId", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const resourceId = parseInt(req.params.resourceId);

      if (isNaN(projectId) || isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const resource = await storage.getProjectResource(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      if (resource.projectId !== projectId) {
        return res.status(400).json({ message: "Resource does not belong to this project" });
      }

      await storage.deleteProjectResource(resourceId);
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  return httpServer;
}

// Helper function to check if there's a WorkPackage in the parent path of a WBS item
function checkForWorkPackageInPath(wbsItems: any[], item: any): boolean {
  if (!item.parentId) return false;

  const parent = wbsItems.find(wbs => wbs.id === item.parentId);
  if (!parent) return false;

  if (parent.type === "WorkPackage") return true;

  return checkForWorkPackageInPath(wbsItems, parent);
}
