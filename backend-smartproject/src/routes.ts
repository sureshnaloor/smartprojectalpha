import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, inArray, isNull, or } from "drizzle-orm";
import {
  insertProjectSchema as projectSchema,
  insertWbsItemSchema as wbsItemSchema,
  baseWbsSchema,
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
  workPackages,
  tasks,
  insertDailyProgressSchema,
  insertResourcePlanSchema,
  insertRiskRegisterSchema,
  insertLessonLearntRegisterSchema,
  insertDirectManpowerPositionSchema,
  insertDirectManpowerEntrySchema,
  insertIndirectManpowerPositionSchema,
  insertIndirectManpowerEntrySchema,
  insertPlannedActivitySchema,
  insertWorkPackageSchema,
  insertProjectActivityDependencySchema,
  insertMaterialMasterSchema,
  insertServiceMasterSchema,
  insertServiceTypeSchema,
  insertServiceGroupSchema,
  insertVendorMasterSchema,
  insertEmployeeMasterSchema,
  insertEmployeeResourceMappingSchema,
  insertRentalManpowerResourceMappingSchema,
  insertEquipmentMasterSchema,
  insertEquipmentResourceMappingSchema,
  insertRentalEquipmentResourceMappingSchema,
  insertRentalManpowerSchema,
  materialMaster,
  serviceMaster,
  workPackageMaterials,
  workPackageServices,
  insertWorkPackageMaterialSchema,
  insertWorkPackageServiceSchema,
  serviceTypes,
  serviceGroups,
  vendorMaster,
  employeeMaster,
  rentalManpower,
  employeeResourceMappings,
  rentalManpowerResourceMappings,
  equipmentMaster,
  equipmentManufacturers,
  equipmentTypes,
  rentalEquipment,
  rentalEquipmentResourceMappings,
  insertEquipmentManufacturerSchema,
  insertEquipmentTypeSchema,
  insertRentalEquipmentSchema,
  equipmentResourceMappings,
  resources,
  fileUploads,
  uoms,
  materialTypes,
  materialGroups,
  insertUomSchema,
  insertMaterialTypeSchema,
  insertMaterialGroupSchema,
  countries,
  cities,
  insertCountrySchema,
  insertCitySchema,
  nationalities,
  employeeTitles,
  employeePositions,
  employeeGrades,
  employeeTrades,
  insertNationalitySchema,
  insertEmployeeTitleSchema,
  insertEmployeePositionSchema,
  insertEmployeeGradeSchema,
  insertEmployeeTradeSchema,
  kanbanCards,
  insertKanbanCardSchema,
  insertPlannedActivityTaskSchema,
  type KanbanCard,
  type InsertPlannedActivityTask,
  projectActivityDependencies,
  projectActivities,
  projectActivityPlanVersions,
  plannedCostWorkpackages,
  purchaseOrders,
  purchaseOrderItems,
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
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

      const topLevelWbsItems = [
        {
          projectId: project.id,
          parentId: null,
          name: "Engineering & Design",
          level: 1,
          code: "1",
          type: "Summary" as const,
          budgetedCost: (totalBudget * 0.05).toString(),
          actualCost: "0",
          percentComplete: "0",
          isTopLevel: true,
          description: "Engineering and design phase",
        },
        {
          projectId: project.id,
          parentId: null,
          name: "Procurement & Construction",
          level: 1,
          code: "2",
          type: "Summary" as const,
          budgetedCost: (totalBudget * 0.85).toString(),
          actualCost: "0",
          percentComplete: "0",
          isTopLevel: true,
          description: "Procurement and construction phase",
        },
        {
          projectId: project.id,
          parentId: null,
          name: "Testing & Commissioning",
          level: 1,
          code: "3",
          type: "Summary" as const,
          budgetedCost: (totalBudget * 0.10).toString(),
          actualCost: "0",
          percentComplete: "0",
          isTopLevel: true,
          description: "Testing and commissioning phase",
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

      // Use the project schema in partial mode for validation
      const projectData = projectSchema.partial().parse(req.body);

      // Check if budget is being changed
      if (projectData.budget !== undefined && Number(projectData.budget) !== Number(project.budget)) {
        // Get all WBS items for the project
        const wbsItems = await storage.getWbsItems(id);

        // Check if only the default 3 WBS items exist (no user-added items)
        const hasOnlyDefaultWbs = wbsItems.length === 3 &&
          wbsItems.every(item => item.isTopLevel) &&
          wbsItems.every(item => item.parentId === null);

        if (hasOnlyDefaultWbs) {
          // Calculate budget difference
          const budgetDifference = Number(projectData.budget) - Number(project.budget);

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
              budgetedCost: newBudget.toString()
            });
          }
        } else {
          // If custom WBS items exist, prevent budget changes
          return res.status(400).json({
            message: "Cannot change project budget after custom WBS items have been added"
          });
        }
      }

      const updatedProject = await storage.updateProject(id, projectData);

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

  // Bulk import activity masters
  app.post("/api/activities/bulk-upload", async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!Array.isArray(csvData)) {
        return res.status(400).json({ message: "csvData must be an array" });
      }

      const activitiesToCreate: any[] = [];
      const rowErrors: Array<{ row: number; errors: unknown[] }> = [];

      csvData.forEach((row: any, index: number) => {
        const parsed = insertActivitySchema.safeParse(row);
        if (parsed.success) {
          activitiesToCreate.push(parsed.data);
        } else {
          rowErrors.push({
            row: index + 1,
            errors: parsed.error.errors,
          });
        }
      });

      if (rowErrors.length > 0) {
        return res.status(400).json({
          message: "Validation error in uploaded rows",
          errors: rowErrors,
        });
      }

      const createdActivities = await Promise.all(
        activitiesToCreate.map((activityData) => storage.createActivity(activityData))
      );
      res.status(201).json(createdActivities);
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
  // Get all activities for a project (grouped by work package)
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

  // Get activities for a specific work package
  app.get("/api/work-packages/:wpId/activities", async (req: Request, res: Response) => {
    try {
      const wpId = parseInt(req.params.wpId);
      if (isNaN(wpId)) {
        return res.status(400).json({ message: "Invalid work package ID" });
      }

      const workPackage = await storage.getWorkPackage(wpId);
      if (!workPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }

      const activities = await storage.getProjectActivitiesByWorkPackage(wpId);
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

      // Validate wpId is provided
      if (!req.body.wpId) {
        return res.status(400).json({ message: "Work Package ID (wpId) is required" });
      }

      const wpId = parseInt(req.body.wpId);
      if (isNaN(wpId)) {
        return res.status(400).json({ message: "Invalid work package ID" });
      }

      // Verify the work package exists and belongs to the project
      const workPackage = await storage.getWorkPackage(wpId);
      if (!workPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }
      if (workPackage.projectId !== projectId) {
        return res.status(400).json({ message: "Work package does not belong to this project" });
      }

      const activityData = insertProjectActivitySchema.parse({
        ...req.body,
        projectId,
        wpId
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
        projectId, // Ensure projectId is preserved
        wpId: req.body.wpId ?? activity.wpId // Ensure wpId is present
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

  // Helper schema for project activity CSV import
  const projectActivityCsvRowSchema = z.object({
    workPackageCode: z.string().min(1, "workPackageCode is required"),
    name: z.string().min(1, "name is required"),
    description: z.string().optional().nullable(),
    unitOfMeasure: z.string().min(1, "unitOfMeasure is required"),
    unitRate: z.union([z.string(), z.number()]),
    duration: z.union([z.string(), z.number()]).optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    quantity: z.union([z.string(), z.number()]).optional().nullable(),
  });

  // Bulk import project activities from CSV (parsed on frontend)
  app.post("/api/projects/:projectId/activities/import-csv", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const { csvData } = req.body as { csvData?: unknown };
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Request body must include csvData array" });
      }

      // Preload work packages for this project to resolve workPackageCode
      const workPackages = await storage.getWorkPackagesByProject(projectId);
      const workPackagesByCode = new Map(workPackages.map(wp => [wp.code, wp]));

      // Preload global activities to reuse where possible
      const globalActivities = await storage.getActivities();
      const globalActivitiesByKey = new Map(
        globalActivities.map(act => [
          `${act.name}|${act.unitOfMeasure}|${act.unitRate}`,
          act,
        ]),
      );

      const errors: string[] = [];
      const createdActivities: any[] = [];

      for (let i = 0; i < csvData.length; i++) {
        const rawRow = csvData[i];

        const parsed = projectActivityCsvRowSchema.safeParse(rawRow);
        if (!parsed.success) {
          const message = parsed.error.errors.map(e => e.message).join("; ");
          errors.push(`Row ${i + 1}: ${message}`);
          continue;
        }

        const row = parsed.data;

        const workPackage = workPackagesByCode.get(row.workPackageCode);
        if (!workPackage) {
          errors.push(
            `Row ${i + 1}: Work Package with code '${row.workPackageCode}' not found in this project`,
          );
          continue;
        }

        const hasDuration =
          row.duration !== undefined &&
          row.duration !== null &&
          String(row.duration).trim() !== "";
        const hasDates = !!row.startDate && !!row.endDate;

        if (!hasDuration && !hasDates) {
          errors.push(
            `Row ${i + 1}: Either duration or both startDate and endDate must be provided`,
          );
          continue;
        }

        let duration: number | null = null;
        let plannedFromDate: string | null = null;
        let plannedToDate: string | null = null;

        if (hasDuration) {
          const durNum = Number(row.duration);
          if (!Number.isFinite(durNum) || durNum <= 0) {
            errors.push(`Row ${i + 1}: duration must be a positive number`);
            continue;
          }
          duration = Math.round(durNum);
        }

        if (hasDates) {
          const start = new Date(row.startDate as string);
          const end = new Date(row.endDate as string);

          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            errors.push(`Row ${i + 1}: Invalid startDate or endDate`);
            continue;
          }

          if (end < start) {
            errors.push(`Row ${i + 1}: endDate must be on or after startDate`);
            continue;
          }

          plannedFromDate = start.toISOString().split("T")[0];
          plannedToDate = end.toISOString().split("T")[0];

          if (!duration) {
            const msPerDay = 24 * 60 * 60 * 1000;
            duration = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
          }
        }

        const unitRateNumber = Number(row.unitRate);
        if (!Number.isFinite(unitRateNumber) || unitRateNumber < 0) {
          errors.push(`Row ${i + 1}: unitRate must be a non-negative number`);
          continue;
        }
        const unitRateString = unitRateNumber.toString();

        const activityKey = `${row.name}|${row.unitOfMeasure}|${unitRateString}`;
        let globalActivity = globalActivitiesByKey.get(activityKey);

        if (!globalActivity) {
          try {
            globalActivity = await storage.createActivity({
              name: row.name,
              description: row.description ?? null,
              unitOfMeasure: row.unitOfMeasure,
              unitRate: unitRateString,
              remarks: null,
            } as any);

            globalActivitiesByKey.set(activityKey, globalActivity);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to create global activity";
            errors.push(`Row ${i + 1}: ${message}`);
            continue;
          }
        }

        let quantityString = "1";
        if (row.quantity !== undefined && row.quantity !== null && String(row.quantity).trim() !== "") {
          const quantityNumber = Number(row.quantity);
          if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
            errors.push(`Row ${i + 1}: quantity must be a positive number if provided`);
            continue;
          }
          quantityString = quantityNumber.toString();
        }

        // Build payload for project activity creation
        const payload: any = {
          projectId,
          wpId: workPackage.id,
          globalActivityId: globalActivity.id,
          name: row.name,
          description: row.description ?? null,
          unitOfMeasure: row.unitOfMeasure,
          unitRate: unitRateString,
          quantity: quantityString,
          remarks: null,
          plannedFromDate,
          plannedToDate,
        };

        if (duration !== null) {
          payload.duration = duration;
        }

        try {
          const activityData = insertProjectActivitySchema.parse(payload);
          const created = await storage.createProjectActivity(activityData);
          createdActivities.push(created);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to create project activity";
          errors.push(`Row ${i + 1}: ${message}`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: "Some activities could not be imported",
          errors,
          createdCount: createdActivities.length,
        });
      }

      return res.status(201).json({
        message: "Activities imported successfully",
        createdCount: createdActivities.length,
        activities: createdActivities,
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get categorized activities for a project (for page2 view)
  app.get("/api/projects/:projectId/activities/categorized", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const categorized = await storage.getCategorizedActivities(projectId);
      res.json(categorized);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get resources for activities (planned and actual utilization)
  app.get("/api/projects/:projectId/activities/resources", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const activityResources = await storage.getActivityResources(projectId);
      res.json(activityResources);
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========== Activity Dependency Routes ==========

  // Get all activity dependencies for a project
  app.get("/api/projects/:projectId/activity-dependencies", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const dependencies = await db
        .select()
        .from(projectActivityDependencies)
        .where(eq(projectActivityDependencies.projectId, projectId));

      res.json(dependencies);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create a new activity dependency
  app.post("/api/projects/:projectId/activity-dependencies", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const depData = insertProjectActivityDependencySchema.parse({
        ...req.body,
        projectId,
      }) as any;

      const predecessorId = parseInt(req.body.predecessorId);
      const successorId = parseInt(req.body.successorId);

      if (isNaN(predecessorId) || isNaN(successorId)) {
        return res.status(400).json({ message: "predecessorId and successorId are required" });
      }

      // Verify both activities exist and belong to this project
      const [predecessor, successor] = await Promise.all([
        db.select().from(projectActivities).where(
          and(
            eq(projectActivities.id, predecessorId),
            eq(projectActivities.projectId, projectId)
          )
        ),
        db.select().from(projectActivities).where(
          and(
            eq(projectActivities.id, successorId),
            eq(projectActivities.projectId, projectId)
          )
        ),
      ]);

      if (predecessor.length === 0) {
        return res.status(404).json({ message: "Predecessor activity not found in this project" });
      }
      if (successor.length === 0) {
        return res.status(404).json({ message: "Successor activity not found in this project" });
      }

      // Prevent duplicate links
      const existing = await db
        .select()
        .from(projectActivityDependencies)
        .where(
          and(
            eq(projectActivityDependencies.projectId, projectId),
            eq(projectActivityDependencies.predecessorId, predecessorId),
            eq(projectActivityDependencies.successorId, successorId)
          )
        );

      if (existing.length > 0) {
        return res.status(409).json({ message: "This dependency link already exists" });
      }

      const [created] = await db
        .insert(projectActivityDependencies)
        .values({
          projectId,
          predecessorId,
          successorId,
          type: depData.type || "FS",
          lag: depData.lag || 0,
        })
        .returning();

      const p = await storage.getProject(projectId);
      if (p) {
        const seq = ((p as any).sequenceVersion ?? 0) + 1;
        await storage.updateProject(projectId, { sequenceVersion: seq });
      }

      res.status(201).json(created);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Update an activity dependency
  app.put("/api/projects/:projectId/activity-dependencies/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const depId = parseInt(req.params.id);
      if (isNaN(projectId) || isNaN(depId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }
      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      const [existing] = await db
        .select()
        .from(projectActivityDependencies)
        .where(
          and(
            eq(projectActivityDependencies.id, depId),
            eq(projectActivityDependencies.projectId, projectId)
          )
        );
      if (!existing) return res.status(404).json({ message: "Dependency not found" });

      const type = req.body.type != null ? String(req.body.type) : existing.type;
      const lag = req.body.lag != null ? Number(req.body.lag) : existing.lag;
      if (!["FS", "SS", "FF", "SF"].includes(type)) {
        return res.status(400).json({ message: "Invalid type" });
      }

      const [updated] = await db
        .update(projectActivityDependencies)
        .set({ type, lag })
        .where(eq(projectActivityDependencies.id, depId))
        .returning();

      const p2 = await storage.getProject(projectId);
      if (p2) {
        const seq = ((p2 as any).sequenceVersion ?? 0) + 1;
        await storage.updateProject(projectId, { sequenceVersion: seq });
      }

      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Delete an activity dependency
  app.delete("/api/projects/:projectId/activity-dependencies/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const depId = parseInt(req.params.id);

      if (isNaN(projectId) || isNaN(depId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const [dep] = await db
        .select()
        .from(projectActivityDependencies)
        .where(
          and(
            eq(projectActivityDependencies.id, depId),
            eq(projectActivityDependencies.projectId, projectId)
          )
        );

      if (!dep) {
        return res.status(404).json({ message: "Dependency not found" });
      }

      await db
        .delete(projectActivityDependencies)
        .where(eq(projectActivityDependencies.id, depId));

      const p = await storage.getProject(projectId);
      if (p) {
        const seq = ((p as any).sequenceVersion ?? 0) + 1;
        await storage.updateProject(projectId, { sequenceVersion: seq });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========== CPM Scheduling Endpoint ==========

  app.post("/api/projects/:projectId/schedule", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (!project.startDate) {
        return res.status(400).json({ message: "Project must have a start date set before scheduling" });
      }

      const projectStartDate = new Date(project.startDate);
      const currentPlanVersion = (project as any).planVersion ?? 0;
      const isInitialPlan = currentPlanVersion === 0;

      // Fetch all activities and dependencies
      const activitiesRaw = await db
        .select()
        .from(projectActivities)
        .where(eq(projectActivities.projectId, projectId));

      const deps = await db
        .select()
        .from(projectActivityDependencies)
        .where(eq(projectActivityDependencies.projectId, projectId));

      if (activitiesRaw.length === 0) {
        return res.status(400).json({ message: "No activities found for this project" });
      }

      // Build activity map with durations and firmed start offsets
      const getDayOffset = (base: Date, targetStr: string | null): number => {
        if (!targetStr) return 0;
        const target = new Date(targetStr);
        const diffTime = target.getTime() - base.getTime();
        return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      };

      const actMap = new Map<number, { id: number; duration: number; name: string; firmedOffset: number }>();
      for (const act of activitiesRaw) {
        actMap.set(act.id, {
          id: act.id,
          duration: act.duration && act.duration > 0 ? act.duration : 1,
          name: act.name,
          firmedOffset: getDayOffset(projectStartDate, act.plannedFromDate),
        });
      }

      // Build adjacency lists
      const successors = new Map<number, { actId: number; type: string; lag: number }[]>();
      const predecessors = new Map<number, { actId: number; type: string; lag: number }[]>();
      const inDegree = new Map<number, number>();

      for (const act of activitiesRaw) {
        successors.set(act.id, []);
        predecessors.set(act.id, []);
        inDegree.set(act.id, 0);
      }

      for (const dep of deps) {
        // Only process deps where both activities exist in this project
        if (!actMap.has(dep.predecessorId) || !actMap.has(dep.successorId)) continue;

        successors.get(dep.predecessorId)!.push({
          actId: dep.successorId,
          type: dep.type,
          lag: dep.lag ?? 0,
        });
        predecessors.get(dep.successorId)!.push({
          actId: dep.predecessorId,
          type: dep.type,
          lag: dep.lag ?? 0,
        });
        inDegree.set(dep.successorId, (inDegree.get(dep.successorId) || 0) + 1);
      }

      // ─── Topological Sort (Kahn's algorithm) ─────────────────
      const topoOrder: number[] = [];
      const queue: number[] = [];

      for (const [actId, degree] of inDegree) {
        if (degree === 0) queue.push(actId);
      }

      const tempInDegree = new Map(inDegree);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        topoOrder.push(curr);

        for (const succ of successors.get(curr) || []) {
          const newDeg = (tempInDegree.get(succ.actId) || 0) - 1;
          tempInDegree.set(succ.actId, newDeg);
          if (newDeg === 0) queue.push(succ.actId);
        }
      }

      // Check for circular dependencies
      if (topoOrder.length < activitiesRaw.length) {
        for (const act of activitiesRaw) {
          if (!topoOrder.includes(act.id)) {
            topoOrder.push(act.id);
          }
        }
      }

      // ─── Forward Pass ────────────────────────────────────────
      const es = new Map<number, number>(); // Early Start (day offset from project start)
      const ef = new Map<number, number>(); // Early Finish

      for (const actId of topoOrder) {
        const act = actMap.get(actId)!;
        const preds = predecessors.get(actId) || [];

        let earliestStart = 0;

        if (preds.length === 0) {
          // ROOT activity - respect user-defined firmed date
          earliestStart = act.firmedOffset;
        } else {
          for (const pred of preds) {
            const predAct = actMap.get(pred.actId)!;
            const predES = es.get(pred.actId) ?? 0;
            const predEF = ef.get(pred.actId) ?? 0;

            let constraint: number;
            switch (pred.type) {
              case "FS":
                constraint = predEF + 1 + pred.lag;
                break;
              case "SS":
                constraint = predES + pred.lag;
                break;
              case "FF":
                constraint = predEF + pred.lag - act.duration + 1;
                break;
              case "SF":
                constraint = predES + pred.lag - act.duration + 1;
                break;
              default:
                constraint = predEF + 1 + pred.lag;
            }
            earliestStart = Math.max(earliestStart, constraint);
          }
        }

        es.set(actId, earliestStart);
        ef.set(actId, earliestStart + act.duration - 1);
      }

      // ─── Backward Pass ───────────────────────────────────────
      let projectEndDay = 0;
      for (const [, finish] of ef) {
        projectEndDay = Math.max(projectEndDay, finish);
      }

      const ls = new Map<number, number>(); // Late Start
      const lf = new Map<number, number>(); // Late Finish
      const totalFloat = new Map<number, number>();

      for (const act of activitiesRaw) {
        lf.set(act.id, projectEndDay);
      }

      for (let i = topoOrder.length - 1; i >= 0; i--) {
        const actId = topoOrder[i];
        const act = actMap.get(actId)!;
        const succs = successors.get(actId) || [];

        let latestFinish = projectEndDay;

        for (const succ of succs) {
          const succLS = ls.get(succ.actId) ?? projectEndDay;
          const succLF = lf.get(succ.actId) ?? projectEndDay;

          let constraint: number;
          switch (succ.type) {
            case "FS":
              constraint = (succLS) - 1 - succ.lag;
              break;
            case "SS":
              constraint = (succLS) - succ.lag + act.duration - 1;
              break;
            case "FF":
              constraint = (succLF) - succ.lag;
              break;
            case "SF":
              constraint = (succLF) - succ.lag + act.duration - 1;
              break;
            default:
              constraint = (succLS) - 1 - succ.lag;
          }
          latestFinish = Math.min(latestFinish, constraint);
        }

        lf.set(actId, latestFinish);
        ls.set(actId, latestFinish - act.duration + 1);
        totalFloat.set(actId, (latestFinish - act.duration + 1) - (es.get(actId) ?? 0));
      }

      // ─── Critical Path ───────────────────────────────────────
      const criticalPath: number[] = [];
      for (const actId of topoOrder) {
        if ((totalFloat.get(actId) ?? Infinity) === 0) {
          criticalPath.push(actId);
        }
      }

      // ─── Convert day offsets to dates & update DB ────────────
      const addDays = (base: Date, days: number): string => {
        const d = new Date(base);
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
      };

      const results: any[] = [];

      for (const actId of topoOrder) {
        const act = actMap.get(actId)!;
        const earlyStart = es.get(actId) ?? 0;
        const earlyFinish = ef.get(actId) ?? 0;
        const lateStart = ls.get(actId) ?? 0;
        const lateFinish = lf.get(actId) ?? 0;
        const float = totalFloat.get(actId) ?? 0;
        const isCritical = float === 0;

        const esDate = addDays(projectStartDate, earlyStart);
        const efDate = addDays(projectStartDate, earlyFinish);
        const lsDate = addDays(projectStartDate, lateStart);
        const lfDate = addDays(projectStartDate, lateFinish);

        // Only persist schedule dates back to project_activities for the initial plan (baseline).
        // Revised plans are stored in project_activity_plan_versions without overwriting baseline columns.
        if (isInitialPlan) {
          await db
            .update(projectActivities)
            .set({
              plannedFromDate: esDate,
              plannedToDate: efDate,
              duration: act.duration,
              earlyStartDay: earlyStart,
              earlyFinishDay: earlyFinish,
              lateStartDay: lateStart,
              lateFinishDay: lateFinish,
              totalFloatDays: float,
            })
            .where(eq(projectActivities.id, actId));
        }

        results.push({
          id: actId,
          name: act.name,
          duration: act.duration,
          es: earlyStart,
          ef: earlyFinish,
          ls: lateStart,
          lf: lateFinish,
          es_date: esDate,
          ef_date: efDate,
          ls_date: lsDate,
          lf_date: lfDate,
          float,
          isCritical,
          plannedFromDate: esDate,
          plannedToDate: efDate,
        });
      }

      // Persist this plan version (schedule + sequence) without overwriting previous versions
      const projectEndDate = addDays(projectStartDate, projectEndDay);
      const nextVersion = currentPlanVersion + 1;

      await db.insert(projectActivityPlanVersions).values({
        projectId,
        version: nextVersion,
        activitiesJson: JSON.stringify(results),
        dependenciesJson: JSON.stringify(deps),
      });

      // Update project with latest plan version and end date
      await storage.updateProject(projectId, { planVersion: nextVersion, endDate: projectEndDate });

      res.json({
        projectStartDate: project.startDate,
        projectEndDate,
        totalDuration: projectEndDay + 1,
        criticalPath,
        activities: results,
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========== Plan Versions (Schedule History) ==========

  // List all plan versions for a project (with basic summary)
  app.get("/api/projects/:projectId/plan-versions", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const rows = await db
        .select()
        .from(projectActivityPlanVersions)
        .where(eq(projectActivityPlanVersions.projectId, projectId))
        .orderBy(projectActivityPlanVersions.version);

      const summaries = rows.map(row => {
        let activities: any[] = [];
        let deps: any[] = [];
        try {
          activities = JSON.parse(row.activitiesJson || "[]");
        } catch {
          activities = [];
        }
        try {
          deps = JSON.parse(row.dependenciesJson || "[]");
        } catch {
          deps = [];
        }

        const activityCount = activities.length;
        const dependencyCount = deps.length;

        let startDate: string | null = null;
        let endDate: string | null = null;
        for (const a of activities) {
          const esDate = a.es_date ?? a.plannedFromDate;
          const lfDate = a.lf_date ?? a.plannedToDate;
          if (esDate) {
            if (!startDate || new Date(esDate) < new Date(startDate)) startDate = esDate;
          }
          if (lfDate) {
            if (!endDate || new Date(lfDate) > new Date(endDate)) endDate = lfDate;
          }
        }

        return {
          id: row.id,
          version: row.version,
          createdAt: (row as any).createdAt,
          activityCount,
          dependencyCount,
          startDate,
          endDate,
        };
      });

      res.json(summaries);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get details for a specific plan version (activities + dependencies)
  app.get("/api/projects/:projectId/plan-versions/:version", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const version = parseInt(req.params.version);
      if (isNaN(projectId) || isNaN(version)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const [row] = await db
        .select()
        .from(projectActivityPlanVersions)
        .where(
          and(
            eq(projectActivityPlanVersions.projectId, projectId),
            eq(projectActivityPlanVersions.version, version),
          )
        );

      if (!row) {
        return res.status(404).json({ message: "Plan version not found" });
      }

      let activities: any[] = [];
      let deps: any[] = [];
      try {
        activities = JSON.parse(row.activitiesJson || "[]");
      } catch {
        activities = [];
      }
      try {
        deps = JSON.parse(row.dependenciesJson || "[]");
      } catch {
        deps = [];
      }

      res.json({
        id: row.id,
        projectId: row.projectId,
        version: row.version,
        createdAt: (row as any).createdAt,
        activities,
        dependencies: deps,
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Project Task routes
  // Get all tasks for a project
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

  // Get open tasks for a project (not closed)
  app.get("/api/projects/:projectId/tasks/open", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const tasks = await storage.getOpenProjectTasks(projectId);
      res.json(tasks);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get tasks for a specific activity
  app.get("/api/activities/:activityId/tasks", async (req: Request, res: Response) => {
    try {
      const activityId = parseInt(req.params.activityId);
      if (isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }

      const activity = await storage.getProjectActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      const tasks = await storage.getProjectTasksByActivity(activityId);
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

      // Validate activityId is provided
      if (!req.body.activityId) {
        return res.status(400).json({ message: "Activity ID (activityId) is required" });
      }

      const activityId = parseInt(req.body.activityId);
      if (isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }

      // Verify the activity exists and belongs to the project
      const activity = await storage.getProjectActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      if (activity.projectId !== projectId) {
        return res.status(400).json({ message: "Activity does not belong to this project" });
      }

      const taskData = insertProjectTaskSchema.parse({
        ...req.body,
        projectId,
        activityId
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

      // Use partial schema for updates - preserve existing activityId if not provided
      const partialTaskSchema = insertProjectTaskSchema.partial();
      const taskData = partialTaskSchema.parse({
        ...req.body,
        projectId, // Ensure projectId is preserved
        activityId: req.body.activityId ?? task.activityId, // Preserve existing activityId if not provided
      });

      const updatedTask = await storage.updateProjectTask(taskId, taskData);
      res.json(updatedTask);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Close a task (set closedDate to today)
  app.patch("/api/projects/:projectId/tasks/:taskId/close", async (req: Request, res: Response) => {
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

      const closedTask = await storage.closeProjectTask(taskId);
      if (!closedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(closedTask);
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

  app.get("/api/projects/:projectId/work-packages", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const workPackages = await storage.getWorkPackagesByProject(projectId);
      res.json(workPackages);
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

      const allWbsItems = await storage.getWbsItems(wbsItemData.projectId);
      let level = 1;
      let code = "";
      let type: "Summary" | "WBS" | "Activity" | "WorkPackage" = wbsItemData.type;
      let isTopLevel = false;

      if (!wbsItemData.parentId) {
        // Root level
        level = 1;
        type = "Summary";
        isTopLevel = true;

        // Count existing top-level items to determine next number
        const topLevelItems = allWbsItems.filter(item => !item.parentId);
        code = (topLevelItems.length + 1).toString();
      } else {
        // Child level
        const parentWbsItem = await storage.getWbsItem(wbsItemData.parentId);
        if (!parentWbsItem) {
          return res.status(404).json({ message: "Parent WBS item not found" });
        }

        level = parentWbsItem.level + 1;
        if (level > 3) {
          return res.status(400).json({ message: "Maximum WBS hierarchy level (3) reached" });
        }

        type = "WBS";
        isTopLevel = false;

        // Count existing siblings to determine next sub-number
        const siblings = allWbsItems.filter(item => item.parentId === wbsItemData.parentId);
        code = `${parentWbsItem.code}.${siblings.length + 1}`;

        // BUDGET VALIDATION
        if (wbsItemData.budgetedCost && Number(wbsItemData.budgetedCost) > Number(parentWbsItem.budgetedCost)) {
          return res.status(400).json({
            message: `Budget cannot exceed parent's budget of ${parentWbsItem.budgetedCost}`
          });
        }

        const siblingsSum = siblings.reduce((sum, sibling) => sum + Number(sibling.budgetedCost), 0);
        if (wbsItemData.budgetedCost && (siblingsSum + Number(wbsItemData.budgetedCost)) > Number(parentWbsItem.budgetedCost)) {
          return res.status(400).json({
            message: `Sum of all child budgets (${siblingsSum + wbsItemData.budgetedCost}) cannot exceed parent's budget (${parentWbsItem.budgetedCost})`
          });
        }
      }

      const finalWbsItemData = {
        ...wbsItemData,
        level,
        code,
        type,
        isTopLevel,
        actualCost: "0",
        percentComplete: "0",
      };

      const wbsItem = await storage.createWbsItem(finalWbsItemData as any);
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

      const partialWbsSchema = baseWbsSchema.partial();
      const wbsItemData = partialWbsSchema.parse(req.body);

      // BUDGET VALIDATION
      // Check if the budget is being changed
      if (wbsItemData.budgetedCost !== undefined && Number(wbsItemData.budgetedCost) !== Number(wbsItem.budgetedCost)) {
        // Get all WBS items for the project to validate budget constraints
        const projectWbsItems = await storage.getWbsItems(wbsItem.projectId);

        // 1. If item has a parent, check that new budget doesn't exceed parent budget
        if (wbsItem.parentId) {
          const parentWbsItem = projectWbsItems.find(item => item.id === wbsItem.parentId);
          if (parentWbsItem) {
            // Only apply this constraint to Summary and WorkPackage types (Activity can't have budget)
            if (wbsItem.type !== "Activity" && Number(wbsItemData.budgetedCost) > Number(parentWbsItem.budgetedCost)) {
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

            if (childBudgetSum > Number(wbsItemData.budgetedCost)) {
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

          // Apply same rules as in the POST endpoint (Summary and WBS can have Summary/WBS/WorkPackage children, not Activity directly)
          if (parentWbsItem.type === "Summary" || parentWbsItem.type === "WBS") {
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

      const updatedWbsItem = await storage.updateWbsItem(id, updateData as any);
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

  // Work Package routes
  app.get("/api/wbs/:wbsItemId/work-packages", async (req: Request, res: Response) => {
    try {
      const wbsItemId = parseInt(req.params.wbsItemId);
      if (isNaN(wbsItemId)) {
        return res.status(400).json({ message: "Invalid WBS item ID" });
      }

      const wbsItem = await storage.getWbsItem(wbsItemId);
      if (!wbsItem) {
        return res.status(404).json({ message: "WBS item not found" });
      }

      // Don't allow work packages for root level WBS
      if (wbsItem.isTopLevel) {
        return res.status(400).json({ message: "Cannot add work packages to root level WBS" });
      }

      const workPackages = await storage.getWorkPackages(wbsItemId);
      res.json(workPackages);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/work-packages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid work package ID" });
      }

      const workPackage = await storage.getWorkPackage(id);
      if (!workPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }

      res.json(workPackage);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/work-packages", async (req: Request, res: Response) => {
    try {
      const workPackageData = insertWorkPackageSchema.parse(req.body);

      // Validate that the WBS item exists
      const wbsItem = await storage.getWbsItem(workPackageData.wbsItemId);
      if (!wbsItem) {
        return res.status(404).json({ message: "WBS item not found" });
      }

      // Don't allow work packages for root level WBS
      if (wbsItem.isTopLevel) {
        return res.status(400).json({ message: "Cannot add work packages to root level WBS" });
      }

      // Validate that the project exists
      const project = await storage.getProject(workPackageData.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Generate code based on WBS code + sequential index
      let code = workPackageData.code;
      if (!code) {
        const existingWorkPackages = await storage.getWorkPackages(workPackageData.wbsItemId);
        const sequentialIndex = existingWorkPackages.length + 1;
        // Code format: {wbsCode}.{sequentialIndex}
        // e.g., if WBS code is "1.2.1.1", WP codes will be "1.2.1.1.1", "1.2.1.1.2", etc.
        code = `${wbsItem.code}.${sequentialIndex}`;
      } else {
        // Validate code uniqueness within project
        const allProjectWorkPackages = await storage.getWorkPackagesByProject(workPackageData.projectId);
        const codeExists = allProjectWorkPackages.some(wp => wp.code === code);
        if (codeExists) {
          return res.status(400).json({
            message: `Work Package code "${code}" already exists in this project. Code must be unique within a project.`
          });
        }
      }

      // Budget validation - check against parent WBS budget
      if (Number(workPackageData.budgetedCost) > Number(wbsItem.budgetedCost)) {
        return res.status(400).json({
          message: `Budget cannot exceed parent WBS budget of ${wbsItem.budgetedCost}`
        });
      }

      // Check sum of existing work packages
      const existingWorkPackages = await storage.getWorkPackages(workPackageData.wbsItemId);
      const totalBudget = existingWorkPackages.reduce((sum, wp) => sum + Number(wp.budgetedCost), 0);
      if ((totalBudget + Number(workPackageData.budgetedCost)) > Number(wbsItem.budgetedCost)) {
        return res.status(400).json({
          message: `Sum of all work package budgets (${totalBudget + Number(workPackageData.budgetedCost)}) cannot exceed parent WBS budget (${wbsItem.budgetedCost})`
        });
      }

      const finalWorkPackageData = {
        ...workPackageData,
        code,
        actualCost: "0",
        percentComplete: "0",
      };

      const workPackage = await storage.createWorkPackage(finalWorkPackageData as any);
      res.status(201).json(workPackage);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/work-packages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid work package ID" });
      }

      const workPackage = await storage.getWorkPackage(id);
      if (!workPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }

      const partialWorkPackageSchema = insertWorkPackageSchema.partial();
      const workPackageData = partialWorkPackageSchema.parse(req.body);

      // Code uniqueness validation if code is being changed
      if (workPackageData.code && workPackageData.code !== workPackage.code) {
        const allProjectWorkPackages = await storage.getWorkPackagesByProject(workPackage.projectId);
        const codeExists = allProjectWorkPackages.some(wp => wp.code === workPackageData.code && wp.id !== id);
        if (codeExists) {
          return res.status(400).json({
            message: `Work Package code "${workPackageData.code}" already exists in this project. Code must be unique within a project.`
          });
        }
      }

      // Budget validation
      if (workPackageData.budgetedCost !== undefined) {
        const wbsItem = await storage.getWbsItem(workPackage.wbsItemId);
        if (wbsItem) {
          // Check against parent WBS budget
          if (Number(workPackageData.budgetedCost) > Number(wbsItem.budgetedCost)) {
            return res.status(400).json({
              message: `Budget cannot exceed parent WBS budget of ${wbsItem.budgetedCost}`
            });
          }

          // Check sum of other work packages
          const allWorkPackages = await storage.getWorkPackages(workPackage.wbsItemId);
          const otherWorkPackagesTotal = allWorkPackages
            .filter(wp => wp.id !== id)
            .reduce((sum, wp) => sum + Number(wp.budgetedCost), 0);

          if ((otherWorkPackagesTotal + Number(workPackageData.budgetedCost)) > Number(wbsItem.budgetedCost)) {
            return res.status(400).json({
              message: `Sum of all work package budgets (${otherWorkPackagesTotal + Number(workPackageData.budgetedCost)}) cannot exceed parent WBS budget (${wbsItem.budgetedCost})`
            });
          }
        }
      }

      const updatedWorkPackage = await storage.updateWorkPackage(id, workPackageData);
      if (!updatedWorkPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }

      res.json(updatedWorkPackage);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/work-packages/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid work package ID" });
      }

      const workPackage = await storage.getWorkPackage(id);
      if (!workPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }

      await storage.deleteWorkPackage(id);
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
      const dependencyData = z.object({
        predecessorId: z.number(),
        successorId: z.number(),
        type: z.enum(["FinishToStart", "StartToStart", "FinishToFinish", "StartToFinish"]),
        lag: z.number().default(0),
      }).parse(req.body);

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
      const costEntryData = z.object({
        wbsItemId: z.number(),
        amount: z.string().or(z.number()).transform(v => v.toString()),
        entryDate: z.string().or(z.date()).transform(d => new Date(d).toISOString().split('T')[0]),
        description: z.string().default(""),
      }).parse(req.body);

      // Validate that the WBS item exists
      const wbsItem = await storage.getWbsItem(costEntryData.wbsItemId);
      if (!wbsItem) {
        return res.status(404).json({ message: "WBS item not found" });
      }

      // Only WorkPackage items can have cost entries
      if (wbsItem.type !== "WorkPackage" && wbsItem.type !== "Summary" && wbsItem.type !== "WBS") {
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
          if (wbsItem.type !== "WorkPackage" && wbsItem.type !== "Summary" && wbsItem.type !== "WBS") {
            errors.push(`Row ${i + 1}: WBS code '${row.wbsCode}' is of type '${wbsItem.type}'. Cost entries can only be added to 'Summary', 'WBS', or 'WorkPackage' types. 'Activity' type items cannot have costs.`);
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

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const normalizeWbsTypeCsv = (raw: unknown): string | null => {
        if (raw == null) return null;
        const s = String(raw)
          .replace(/^\uFEFF/g, "")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .normalize("NFKC")
          .trim();
        const compact = s.replace(/\s+/g, "");
        if (["SUMMARY", "WBS", "WorkPackage"].includes(compact)) return compact;
        const key = s.toLowerCase().replace(/[\s_-]+/g, "");
        if (key === "summary") return "SUMMARY";
        if (key === "wbs") return "WBS";
        if (key === "workpackage") return "WorkPackage";
        return null;
      };

      const existingWbsItems = await storage.getWbsItems(projectId);
      const wbsItemsByCode = new Map(existingWbsItems.map((item: { code: string; id: number }) => [item.code, item]));

      const existingWorkPackages = await storage.getWorkPackagesByProject(projectId);
      const workPackagesByCode = new Map(existingWorkPackages.map((wp: { code: string; id: number }) => [wp.code, wp]));

      const errors: string[] = [];
      const results: unknown[] = [];

      // CSV: Level 1 (root) -> wbs_items type "Summary"; Level 2/3 -> type "WBS". CSV WorkPackage -> work_packages table only.
      const CSV_TYPE_SUMMARY = "SUMMARY";
      const CSV_TYPE_WBS = "WBS";
      const CSV_TYPE_WP = "WorkPackage";

      // Sort by code so parent is always before children (1, 1.1, 1.1.1, 1.1.1.1, 2, 2.1, ...)
      const sortedRows = [...csvData].sort((a: { wbsCode: string }, b: { wbsCode: string }) => {
        const aParts = a.wbsCode.split(".").map(Number);
        const bParts = b.wbsCode.split(".").map(Number);
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const av = aParts[i] ?? 0;
          const bv = bParts[i] ?? 0;
          if (av !== bv) return av - bv;
        }
        return 0;
      });

      for (const row of sortedRows) {
        const n = normalizeWbsTypeCsv((row as { wbsType?: unknown }).wbsType);
        if (n) (row as { wbsType: string }).wbsType = n;
      }

      // First pass: validate hierarchy rules (level vs type, and same-level children consistency)
      const rowsByCode = new Map(sortedRows.map((r: { wbsCode: string }, idx: number) => [r.wbsCode, { ...r, _index: idx + 1 }]));
      const childrenByParent = new Map<string, typeof sortedRows>();
      for (const row of sortedRows) {
        const code = row.wbsCode;
        const parts = code.split(".");
        const level = parts.length;
        const csvType = (row.wbsType || "").trim();

        if (!["SUMMARY", "WBS", "WorkPackage"].includes(csvType)) {
          errors.push(`Row ${code}: Invalid wbsType '${row.wbsType}' - must be SUMMARY, WBS, or WorkPackage`);
          continue;
        }
        if (level === 1 && csvType !== "SUMMARY") {
          errors.push(`Row ${code}: Level 1 (root) must be type SUMMARY`);
          continue;
        }
        if (level === 2 && csvType !== "WBS") {
          errors.push(`Row ${code}: Level 2 must be type WBS`);
          continue;
        }
        if (level === 3) {
          if (csvType !== "WBS" && csvType !== "WorkPackage") {
            errors.push(`Row ${code}: Level 3 must be type WBS or WorkPackage`);
            continue;
          }
        }
        if (level >= 4) {
          if (csvType !== "WorkPackage") {
            errors.push(`Row ${code}: Level ${level} must be type WorkPackage`);
            continue;
          }
          if (level > 4) {
            errors.push(`Row ${code}: Maximum depth is 4 (SUMMARY -> WBS -> WBS or WorkPackage -> WorkPackage if level 3 is WBS)`);
            continue;
          }
        }

        const budgetVal = row.budget != null ? row.budget : row.amount;
        const budgetNum = Number(budgetVal);
        if (budgetVal === undefined || budgetVal === null || budgetVal === "" || isNaN(budgetNum) || budgetNum < 0) {
          errors.push(`Row ${code}: Valid budget (number >= 0) required`);
          continue;
        }

        if (level > 1) {
          const parentCode = parts.slice(0, -1).join(".");
          if (!childrenByParent.has(parentCode)) childrenByParent.set(parentCode, []);
          childrenByParent.get(parentCode)!.push(row);
        }
      }

      // Level-2 WBS: children must be either all WBS or all WorkPackage (not mixed)
      for (const [parentCode, children] of Array.from(childrenByParent.entries())) {
        const parentParts = parentCode.split(".");
        if (parentParts.length !== 2) continue;
        const types = new Set(children.map((c: { wbsType: string }) => (c.wbsType || "").trim()));
        if (types.has("WBS") && types.has("WorkPackage")) {
          errors.push(`Parent ${parentCode}: Level 2 WBS cannot have both WBS and WorkPackage children - use only one type`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: "WBS import validation failed",
          errors,
          results: []
        });
      }

      // Process in sorted order: SUMMARY/WBS -> wbs_items (type Summary); WorkPackage -> work_packages table
      for (let i = 0; i < sortedRows.length; i++) {
        const row = sortedRows[i];
        const code = row.wbsCode;
        const codeParts = code.split(".");
        const level = codeParts.length;
        const csvType = (row.wbsType || "").trim();
        const budgetVal = row.budget != null ? row.budget : row.amount;
        const budgetStr = String(Number(budgetVal));

        if (csvType === CSV_TYPE_WP) {
          // WorkPackage: insert into work_packages table; parent must be a WBS (Summary) node
          const parentCode = codeParts.slice(0, -1).join(".");
          const parentItem = wbsItemsByCode.get(parentCode);
          if (!parentItem) {
            errors.push(`Row ${i + 1}: Parent '${parentCode}' not found for Work Package (ensure parent WBS row appears before this row)`);
            continue;
          }
          try {
            const existingWp = workPackagesByCode.get(code);
            const wpData = {
              wbsItemId: parentItem.id,
              projectId,
              name: row.wbsName || code,
              description: row.wbsDescription || null,
              code,
              budgetedCost: budgetStr,
              actualCost: "0",
              percentComplete: "0"
            };
            if (existingWp) {
              await storage.updateWorkPackage(existingWp.id, wpData);
              results.push({ code, type: "WorkPackage", status: "updated" });
            } else {
              const created = await storage.createWorkPackage(wpData as any);
              results.push({ ...created, status: "created" });
              workPackagesByCode.set(code, created as { code: string; id: number });
            }
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            errors.push(`Row ${i + 1} (${code}): ${msg}`);
          }
          continue;
        }

        // SUMMARY (level 1 only) -> type "Summary"; WBS (level 2/3) -> type "WBS"
        let parentId: number | null = null;
        if (level > 1) {
          const parentCode = codeParts.slice(0, -1).join(".");
          const parentItem = wbsItemsByCode.get(parentCode);
          if (!parentItem) {
            errors.push(`Row ${i + 1}: Parent '${parentCode}' not found (ensure rows are ordered so parent appears before children)`);
            continue;
          }
          parentId = parentItem.id;
        }

        const wbsType = level === 1 ? "Summary" : "WBS";

        const wbsItemData = {
          projectId,
          parentId,
          name: row.wbsName || code,
          description: row.wbsDescription || "",
          level,
          code,
          type: wbsType,
          budgetedCost: budgetStr,
          isTopLevel: level === 1,
          actualCost: "0",
          percentComplete: "0"
        };

        try {
          const existingItem = wbsItemsByCode.get(code);
          let result;
          if (existingItem) {
            result = await storage.updateWbsItem(existingItem.id, wbsItemData as any);
            results.push({ ...result, status: "updated" });
          } else {
            result = await storage.createWbsItem(wbsItemData as any);
            results.push({ ...result, status: "created" });
            wbsItemsByCode.set((result as { code: string }).code, result as { code: string; id: number });
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          errors.push(`Row ${i + 1} (${code}): ${msg}`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: "Some WBS items could not be imported",
          errors,
          results
        });
      }

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

  app.get("/api/projects/:projectId/activity-dependencies", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const dependencies = await storage.getProjectActivityDependencies(projectId);
      res.json(dependencies);
    } catch (err: unknown) {
      handleError(err, res);
    }
  });

  app.post("/api/activity-dependencies", async (req: Request, res: Response) => {
    try {
      const data = insertProjectActivityDependencySchema.parse(req.body);
      const newDependency = await storage.createProjectActivityDependency(data as any);
      res.status(201).json(newDependency);
    } catch (err: unknown) {
      handleError(err, res);
    }
  });

  app.delete("/api/activity-dependencies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid dependency ID" });
      }
      await storage.deleteProjectActivityDependency(id);
      res.sendStatus(204);
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

        // WBS Items no longer use dates or durations.
        // We'll proceed with creating or updating based only on structural and progress data.

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
              percentComplete: row.percentComplete !== undefined ? Number(row.percentComplete).toString() : existingItem.percentComplete
            };

            // Update the existing activity
            const updatedItem = await storage.updateWbsItem(existingItem.id, activityData as any);
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
              budgetedCost: "0", // Activities don't have budget
              actualCost: "0",
              percentComplete: row.percentComplete ? Number(row.percentComplete).toString() : "0",
              isTopLevel: false,
            };

            // Create the new activity
            const createdItem = await storage.createWbsItem(newActivity as any);
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
      // WBS dates have been removed, so this route is currently disabled
      res.json({ message: "Schedule finalization is currently disabled as WBS dates have been removed.", updatedCount: 0 });
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // Task routes
  app.get("/api/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const tasks = await storage.getProjectTasks(projectId);
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

      // Try validation
      try {
        // Attempt validation
        const validationResult = taskSchema.extend({
          startDate: z.string().optional().nullable(),
          endDate: z.string().optional().nullable(),
          duration: z.number().optional().nullable(),
        }).safeParse(taskRequest);
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
        const activity = await storage.getActivity((taskData as any).activityId);
        if (!activity) {
          return res.status(404).json({ message: "Activity not found" });
        }



        const task = await storage.createTask(taskData as any);
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
        name: string;
        description?: string;
        percentComplete?: number;
        startDate?: string;
        endDate?: string;
        duration?: number;
      }) => ({
        activityId: task.activityId,
        name: task.name,
        description: task.description || "",
        percentComplete: (task.percentComplete || 0).toString(),
        startDate: task.startDate || null,
        endDate: task.endDate || null,
        duration: task.duration || null,
      }));

      const createdTasks = await Promise.all(
        tasks.map((task: {
          activityId: number;
          name: string;
          description: string;
          percentComplete: string;
          startDate?: string;
          endDate?: string;
          duration?: number;
        }) => storage.createTask(task as any))
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
        percentComplete: z.number().min(0).max(100).optional(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        duration: z.number().optional().nullable(),
      }).parse(req.body);

      // If changing activity, check if it exists
      if (taskData.activityId && taskData.activityId !== task.activityId) {
        const activity = await storage.getActivity(taskData.activityId);
        if (!activity) {
          return res.status(404).json({ message: "Activity not found" });
        }


      }

      // Create a properly typed object for the update
      const taskDataToSend: any = {
        ...taskData,
        percentComplete: taskData.percentComplete !== undefined ? taskData.percentComplete.toString() : undefined
      };

      const updatedTask = await storage.updateTask(id, taskDataToSend);
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
        }) => storage.createCostEntry(entry as any))
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

  // Get entities mapped to a resource (manpower: own + rental; equipment: own + rental)
  app.get("/api/resources/:id/mapped-entities", async (req: Request, res: Response) => {
    try {
      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      const [resource] = await db.select().from(resources).where(eq(resources.id, resourceId));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      const type = resource.type;

      const result: {
        resourceType: string;
        ownManpower: any[];
        rentalManpower: any[];
        ownEquipment: any[];
        rentalEquipment: any[];
      } = {
        resourceType: type,
        ownManpower: [],
        rentalManpower: [],
        ownEquipment: [],
        rentalEquipment: [],
      };

      if (type === "manpower") {
        const empMappings = await db
          .select({ employeeId: employeeResourceMappings.employeeId })
          .from(employeeResourceMappings)
          .where(eq(employeeResourceMappings.resourceId, resourceId));
        if (empMappings.length > 0) {
          const ids = empMappings.map((m) => m.employeeId);
          const employees = await db
            .select()
            .from(employeeMaster)
            .where(inArray(employeeMaster.id, ids));
          result.ownManpower = employees;
        }
      } else if (type === "rental_manpower") {
        const rmMappings = await db
          .select({ rentalManpowerId: rentalManpowerResourceMappings.rentalManpowerId })
          .from(rentalManpowerResourceMappings)
          .where(eq(rentalManpowerResourceMappings.resourceId, resourceId));
        if (rmMappings.length > 0) {
          const ids = rmMappings.map((m) => m.rentalManpowerId);
          const rentalEmployees = await db
            .select()
            .from(rentalManpower)
            .where(inArray(rentalManpower.id, ids));
          result.rentalManpower = rentalEmployees;
        }
      } else if (type === "equipment") {
        const eqMappings = await db
          .select({ equipmentId: equipmentResourceMappings.equipmentId })
          .from(equipmentResourceMappings)
          .where(eq(equipmentResourceMappings.resourceId, resourceId));
        if (eqMappings.length > 0) {
          const ids = eqMappings.map((m) => m.equipmentId);
          const equipment = await db
            .select()
            .from(equipmentMaster)
            .where(inArray(equipmentMaster.id, ids));
          result.ownEquipment = equipment;
        }
      } else if (type === "rental_equipment") {
        const reMappings = await db
          .select({ rentalEquipmentId: rentalEquipmentResourceMappings.rentalEquipmentId })
          .from(rentalEquipmentResourceMappings)
          .where(eq(rentalEquipmentResourceMappings.resourceId, resourceId));
        if (reMappings.length > 0) {
          const ids = reMappings.map((m) => m.rentalEquipmentId);
          const rentalEq = await db
            .select()
            .from(rentalEquipment)
            .where(inArray(rentalEquipment.id, ids));
          result.rentalEquipment = rentalEq;
        }
      }

      res.json(result);
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
      const resource = await storage.createResource(resourceData as any);
      res.status(201).json(resource);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Bulk import resources
  app.post("/api/resources/bulk-upload", async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!Array.isArray(csvData)) {
        return res.status(400).json({ message: "csvData must be an array" });
      }

      const resourcesToCreate: any[] = [];
      const rowErrors: Array<{ row: number; errors: unknown[] }> = [];

      csvData.forEach((row: any, index: number) => {
        const parsed = insertResourceSchema.safeParse(row);
        if (parsed.success) {
          resourcesToCreate.push(parsed.data);
        } else {
          rowErrors.push({
            row: index + 1,
            errors: parsed.error.errors,
          });
        }
      });

      if (rowErrors.length > 0) {
        return res.status(400).json({
          message: "Validation error in uploaded rows",
          errors: rowErrors,
        });
      }

      const createdResources = await db.insert(resources).values(resourcesToCreate as any).returning();
      res.status(201).json(createdResources);
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
      const updatedResource = await storage.updateResource(id, resourceData as any);
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
      const taskResource = await storage.createTaskResource(taskResourceData as any);
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
      const updatedTaskResource = await storage.updateTaskResource(id, taskResourceData as any);
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
        query = (query as any).where(eq(collaborationThreads.type, type));
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
        query = (query as any).where(eq(collaborationThreads.type, type));
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
      const threadData = z.object({
        title: z.string(),
        type: z.enum(["issue", "info", "announcement", "awards"]),
        createdById: z.string(),
        createdByName: z.string(),
        isClosed: z.boolean().default(false),
        projectId: z.number().optional().nullable(),
      }).parse(req.body);

      // If projectId is provided, validate that the project exists
      if (threadData.projectId) {
        const project = await storage.getProject(threadData.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
      }

      const [thread] = await db
        .insert(collaborationThreads)
        .values(threadData as any)
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
        .set({ ...updateData, updatedAt: new Date() } as any)
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

      const messageData = z.object({
        threadId: z.number(),
        content: z.string(),
        authorId: z.string(),
        authorName: z.string(),
      }).parse({ ...req.body, threadId });

      const [message] = await db
        .insert(collaborationMessages)
        .values(messageData as any)
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
        query = (query as any).where(eq(projectCollaborationThreads.type, type));
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

      const threadData = z.object({
        projectId: z.number(),
        title: z.string(),
        type: z.enum(["issue", "info", "announcement", "awards"]),
        createdById: z.string(),
        createdByName: z.string(),
        isClosed: z.boolean().default(false),
      }).parse({ ...req.body, projectId });

      const [thread] = await db
        .insert(projectCollaborationThreads)
        .values(threadData as any)
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
        .set({ ...updateData, updatedAt: new Date() } as any)
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

      const messageData = z.object({
        threadId: z.number(),
        content: z.string(),
        authorId: z.string(),
        authorName: z.string(),
      }).parse({ ...req.body, threadId });

      const [message] = await db
        .insert(projectCollaborationMessages)
        .values(messageData as any)
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

  // Get resources for a specific work package
  app.get("/api/work-packages/:wpId/resources", async (req: Request, res: Response) => {
    try {
      const wpId = parseInt(req.params.wpId);
      if (isNaN(wpId)) {
        return res.status(400).json({ message: "Invalid work package ID" });
      }

      const workPackage = await storage.getWorkPackage(wpId);
      if (!workPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }

      const resources = await storage.getProjectResourcesByWorkPackage(wpId);
      const withEstimatedValue = resources.map((r: Record<string, unknown>) => {
        const unitRate = Number(r.unitRate ?? r.unit_rate ?? 0);
        const quantity = Number(r.quantity ?? r.qty ?? 0);
        const estimatedValue =
          Number.isFinite(unitRate) && Number.isFinite(quantity) ? unitRate * quantity : 0;
        return {
          ...r,
          estimatedValue: estimatedValue.toFixed(2),
        };
      });
      res.json(withEstimatedValue);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Capture planned cost snapshot for a specific work package
  app.post("/api/work-packages/:wpId/planned-cost", async (req: Request, res: Response) => {
    try {
      const wpId = parseInt(req.params.wpId);
      if (isNaN(wpId)) {
        return res.status(400).json({ message: "Invalid work package ID" });
      }

      const workPackage = await storage.getWorkPackage(wpId);
      if (!workPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }

      const projectId = workPackage.projectId;

      const materialRows = await db.select().from(workPackageMaterials).where(eq(workPackageMaterials.wpId, wpId));
      const serviceRows = await db.select().from(workPackageServices).where(eq(workPackageServices.wpId, wpId));
      const resourceRows = await storage.getProjectResourcesByWorkPackage(wpId);

      const materialsPlannedValue = materialRows.reduce((sum, m: any) => sum + Number(m.estimatedValue || 0), 0);
      const servicesPlannedValue = serviceRows.reduce((sum, s: any) => sum + Number(s.estimatedValue || 0), 0);
      const resourcesPlannedValue = resourceRows.reduce(
        (sum: number, r: any) => sum + Number(r.unitRate || 0) * Number(r.quantity || 0),
        0
      );
      const totalPlannedValue = materialsPlannedValue + servicesPlannedValue + resourcesPlannedValue;

      const [existing] = await db
        .select()
        .from(plannedCostWorkpackages)
        .where(
          and(
            eq(plannedCostWorkpackages.projectId, projectId),
            eq(plannedCostWorkpackages.wpId, wpId)
          )
        );

      let row;
      if (existing) {
        [row] = await db
          .update(plannedCostWorkpackages)
          .set({
            materialsPlannedValue: materialsPlannedValue.toFixed(2),
            servicesPlannedValue: servicesPlannedValue.toFixed(2),
            resourcesPlannedValue: resourcesPlannedValue.toFixed(2),
            totalPlannedValue: totalPlannedValue.toFixed(2),
            isLocked: true,
            updatedAt: new Date(),
          } as any)
          .where(
            and(
              eq(plannedCostWorkpackages.projectId, projectId),
              eq(plannedCostWorkpackages.wpId, wpId)
            )
          )
          .returning();
      } else {
        [row] = await db
          .insert(plannedCostWorkpackages)
          .values({
            projectId,
            wpId,
            materialsPlannedValue: materialsPlannedValue.toFixed(2),
            servicesPlannedValue: servicesPlannedValue.toFixed(2),
            resourcesPlannedValue: resourcesPlannedValue.toFixed(2),
            totalPlannedValue: totalPlannedValue.toFixed(2),
            isLocked: true,
          } as any)
          .returning();
      }

      res.status(existing ? 200 : 201).json(row);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get planned cost snapshot for a specific work package
  app.get("/api/work-packages/:wpId/planned-cost", async (req: Request, res: Response) => {
    try {
      const wpId = parseInt(req.params.wpId);
      if (isNaN(wpId)) {
        return res.status(400).json({ message: "Invalid work package ID" });
      }

      const workPackage = await storage.getWorkPackage(wpId);
      if (!workPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }

      const projectId = workPackage.projectId;

      const [row] = await db
        .select()
        .from(plannedCostWorkpackages)
        .where(
          and(
            eq(plannedCostWorkpackages.projectId, projectId),
            eq(plannedCostWorkpackages.wpId, wpId)
          )
        );

      if (!row) {
        return res.status(404).json({ message: "No planned cost snapshot for this work package" });
      }

      res.json(row);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Purchase Orders
  app.get("/api/purchase-orders", async (req: Request, res: Response) => {
    try {
      const orders = await db.select().from(purchaseOrders);
      if (orders.length === 0) {
        return res.json(orders);
      }
      const orderIds = orders.map((o: any) => o.id);
      const allItems = await db
        .select()
        .from(purchaseOrderItems)
        .where(inArray(purchaseOrderItems.poId, orderIds));
      const itemsByPo = new Map<number, typeof allItems>();
      for (const item of allItems) {
        const list = itemsByPo.get(item.poId) ?? [];
        list.push(item);
        itemsByPo.set(item.poId, list);
      }
      const itemTypeFilter = typeof req.query.itemType === "string" ? req.query.itemType : null;
      const result = orders.map((o: any) => {
        const poItems = itemsByPo.get(o.id) ?? [];
        const isDelivered =
          poItems.length > 0 &&
          poItems.every((i: any) => i.actualDeliveryDate != null && String(i.actualDeliveryDate).trim() !== "");
        const typeSet = new Set(poItems.map((i: any) => i.itemType));
        const primaryItemType = typeSet.size === 1 ? Array.from(typeSet)[0] : null;
        return { ...o, isDelivered: !!isDelivered, primaryItemType };
      });
      const filtered = itemTypeFilter
        ? result.filter((o: any) => o.primaryItemType === itemTypeFilter)
        : result;
      res.json(filtered);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/purchase-orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase order ID" });
      }

      const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      const items = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, id));

      res.json({ order, items });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/purchase-orders", async (req: Request, res: Response) => {
    try {
      const { items, ...header } = req.body as {
        items?: any[];
        poNumber: string;
        poDate: string;
        vendor: string;
        remarks?: string | null;
      };

      const headerData = insertPurchaseOrderSchema.parse(header);
      const [createdOrder] = await db.insert(purchaseOrders).values(headerData as any).returning();

      if (items && Array.isArray(items) && items.length > 0) {
        const parsedItems = items.map((raw, index) =>
          insertPurchaseOrderItemSchema.parse({
            ...raw,
            poId: createdOrder.id,
            lineNumber: raw.lineNumber ?? index + 1,
            totalPrice:
              raw.totalPrice ??
              String(
                Number(raw.quantity ?? 0) *
                  Number(raw.unitPrice ?? 0)
              ),
          })
        );
        await db.insert(purchaseOrderItems).values(parsedItems as any);
      }

      res.status(201).json(createdOrder);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/purchase-orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase order ID" });
      }
      const [existing] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
      if (!existing) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      const poItems = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
      const isDelivered =
        poItems.length > 0 &&
        poItems.every((i: any) => i.actualDeliveryDate != null && String(i.actualDeliveryDate).trim() !== "");
      if (isDelivered) {
        return res.status(403).json({ message: "Purchase order is already delivered; editing is not allowed." });
      }
      const body = req.body as {
        poNumber?: string;
        poDate?: string;
        vendor?: string;
        remarks?: string | null;
        items?: any[];
      };
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (body.poNumber !== undefined) updates.poNumber = body.poNumber;
      if (body.poDate !== undefined) updates.poDate = body.poDate;
      if (body.vendor !== undefined) updates.vendor = body.vendor;
      if (body.remarks !== undefined) updates.remarks = body.remarks;
      if (Object.keys(updates).length > 1) {
        await db.update(purchaseOrders).set(updates as any).where(eq(purchaseOrders.id, id));
      }
      if (body.items && Array.isArray(body.items)) {
        await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
        if (body.items.length > 0) {
          const parsedItems = body.items.map((raw: any, index: number) =>
            insertPurchaseOrderItemSchema.parse({
              ...raw,
              poId: id,
              lineNumber: raw.lineNumber ?? index + 1,
              totalPrice:
                raw.totalPrice ??
                String(Number(raw.quantity ?? 0) * Number(raw.unitPrice ?? 0)),
            })
          );
          await db.insert(purchaseOrderItems).values(parsedItems as any);
        }
      }
      const [updated] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/purchase-orders/:id/items/bulk", async (req: Request, res: Response) => {
    try {
      const poId = parseInt(req.params.id);
      if (isNaN(poId)) {
        return res.status(400).json({ message: "Invalid purchase order ID" });
      }

      const { items } = req.body as { items: any[] };
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items provided" });
      }

      const existingItems = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.poId, poId));
      const usedLineNumbers = new Set(existingItems.map((i: any) => Number(i.lineNumber)));

      let nextLineNumber = existingItems.length + 1;
      const parsedItems = items.map((raw) => {
        let lineNumber = raw.lineNumber ? Number(raw.lineNumber) : nextLineNumber;
        while (usedLineNumbers.has(lineNumber)) {
          lineNumber += 1;
        }
        usedLineNumbers.add(lineNumber);
        nextLineNumber = lineNumber + 1;

        return insertPurchaseOrderItemSchema.parse({
          ...raw,
          poId,
          lineNumber,
          totalPrice:
            raw.totalPrice ??
            String(
              Number(raw.quantity ?? 0) *
                Number(raw.unitPrice ?? 0)
            ),
        });
      });

      const inserted = await db.insert(purchaseOrderItems).values(parsedItems as any).returning();
      res.status(201).json(inserted);
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

      // Validate wpId is provided
      if (!req.body.wpId) {
        return res.status(400).json({ message: "Work Package ID (wpId) is required" });
      }

      const wpId = parseInt(req.body.wpId);
      if (isNaN(wpId)) {
        return res.status(400).json({ message: "Invalid work package ID" });
      }

      // Verify the work package exists and belongs to the project
      const workPackage = await storage.getWorkPackage(wpId);
      if (!workPackage) {
        return res.status(404).json({ message: "Work package not found" });
      }
      if (workPackage.projectId !== projectId) {
        return res.status(400).json({ message: "Work package does not belong to this project" });
      }

      // Validate resource type
      const validTypes = ["manpower", "equipment", "rental_manpower", "rental_equipment", "tools"];
      if (req.body.type && !validTypes.includes(req.body.type)) {
        return res.status(400).json({
          message: `Resource type must be one of: ${validTypes.join(", ")}`
        });
      }

      const resourceData = insertProjectResourceSchema.parse({
        ...req.body,
        projectId,
        wpId
      });

      const resource = await storage.createProjectResource(resourceData as any);
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

      // Use partial schema for updates - preserve existing wpId if not provided
      const partialResourceSchema = insertProjectResourceSchema.partial();
      const resourceData = partialResourceSchema.parse({
        ...req.body,
        projectId, // Ensure projectId is preserved
        wpId: req.body.wpId ?? resource.wpId, // Preserve existing wpId if not provided
      });

      const updatedResource = await storage.updateProjectResource(resourceId, resourceData as any);
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


  // Project Drawings routes
  app.post("/api/projects/:projectId/drawings/upload", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }

      const file = req.files.file as fileUpload.UploadedFile;
      const fileName = `projects/${projectId}/drawings/${Date.now()}_${file.name}`;

      // Extract metadata from body
      const drawingName = req.body.drawingName || file.name;
      const description = req.body.description || "";
      const user = (req as any).user;
      const uploadedByName = user?.name || req.body.uploadedBy || "Unknown User";
      const uploadedById = user?.id || null;
      const uploadedByEmail = user?.email || null;

      // Import dynamically to avoid top-level await issues if any
      const { uploadFile } = await import("./b2");
      const fs = await import("fs");

      let fileData: Buffer;
      if (file.tempFilePath) {
        fileData = fs.readFileSync(file.tempFilePath);
      } else {
        fileData = file.data;
      }

      // B2 metadata keys must be alphanumeric. We'll prefix them.
      // Actually B2 allows custom headers X-Bz-Info-*, keys in the info object.
      const fileInfo = {
        drawingName: drawingName,
        description: description,
        uploadedBy: uploadedByName
      };

      const result = await uploadFile(fileName, fileData, file.mimetype, fileInfo);

      await db.insert(fileUploads).values({
        projectId,
        category: "drawings",
        fileName: result.fileName || fileName,
        originalName: file.name,
        displayName: drawingName,
        description,
        fileSize: file.size,
        contentType: file.mimetype,
        b2FileId: result.fileId,
        uploadedById,
        uploadedByName,
        uploadedByEmail,
      } as any);

      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/drawings", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/drawings", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/drawings/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/drawings/:fileName/download", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileName = req.params.fileName;
      // Reconstruct full path
      // Note: The fileName param might not contain the full path if it has slashes. 
      // However, listFiles returns full names like "projects/8/drawings/123_foo.pdf".
      // We should probably pass the full path or ID. 
      // Let's assume the frontend passes the full path encoded or we just use the ID if B2 supports it easily.
      // Actually, B2 listFiles returns fileId and fileName. 
      // Let's change this route to accept fileId or full path via query param?
      // Or just use the full path constructed:

      // Better approach: The frontend will likely have the full fileName from the list.
      // But passing slashes in URL params can be tricky.
      // Let's use a query parameter for the file name or ID.

      const fullFileName = req.query.fileName as string;

      if (!fullFileName) {
        return res.status(400).json({ message: "File name is required" });
      }

      const { getDownloadUrl } = await import("./b2");
      const url = await getDownloadUrl(fullFileName);

      res.json({ url });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Project BOQ routes
  app.post("/api/projects/:projectId/boq/upload", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }

      const file = req.files.file as fileUpload.UploadedFile;
      const fileName = `projects/${projectId}/boq/${Date.now()}_${file.name}`;

      // Extract metadata from body
      const boqName = req.body.boqName || file.name;
      const description = req.body.description || "";
      const user = (req as any).user;
      const uploadedByName = user?.name || req.body.uploadedBy || "Unknown User";
      const uploadedById = user?.id || null;
      const uploadedByEmail = user?.email || null;

      // Import dynamically
      const { uploadFile } = await import("./b2");
      const fs = await import("fs");

      let fileData: Buffer;
      if (file.tempFilePath) {
        fileData = fs.readFileSync(file.tempFilePath);
      } else {
        fileData = file.data;
      }

      const fileInfo = {
        boqName: boqName,
        description: description,
        uploadedBy: uploadedByName
      };

      const result = await uploadFile(fileName, fileData, file.mimetype, fileInfo);

      await db.insert(fileUploads).values({
        projectId,
        category: "boq",
        fileName: result.fileName || fileName,
        originalName: file.name,
        displayName: boqName,
        description,
        fileSize: file.size,
        contentType: file.mimetype,
        b2FileId: result.fileId,
        uploadedById,
        uploadedByName,
        uploadedByEmail,
      } as any);

      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/boq", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/boq/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/boq", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/boq/:fileName/download", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fullFileName = req.query.fileName as string;

      if (!fullFileName) {
        return res.status(400).json({ message: "File name is required" });
      }

      const { getDownloadUrl } = await import("./b2");
      const url = await getDownloadUrl(fullFileName);

      res.json({ url });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Project Scope routes
  app.post("/api/projects/:projectId/scope/upload", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }

      const file = req.files.file as fileUpload.UploadedFile;
      const fileName = `projects/${projectId}/scope/${Date.now()}_${file.name}`;

      // Extract metadata from body
      const scopeName = req.body.scopeName || file.name;
      const description = req.body.description || "";
      const user = (req as any).user;
      const uploadedByName = user?.name || req.body.uploadedBy || "Unknown User";
      const uploadedById = user?.id || null;
      const uploadedByEmail = user?.email || null;

      // Import dynamically
      const { uploadFile } = await import("./b2");
      const fs = await import("fs");

      let fileData: Buffer;
      if (file.tempFilePath) {
        fileData = fs.readFileSync(file.tempFilePath);
      } else {
        fileData = file.data;
      }

      const fileInfo = {
        scopeName: scopeName,
        description: description,
        uploadedBy: uploadedByName
      };

      const result = await uploadFile(fileName, fileData, file.mimetype, fileInfo);

      await db.insert(fileUploads).values({
        projectId,
        category: "scope",
        fileName: result.fileName || fileName,
        originalName: file.name,
        displayName: scopeName,
        description,
        fileSize: file.size,
        contentType: file.mimetype,
        b2FileId: result.fileId,
        uploadedById,
        uploadedByName,
        uploadedByEmail,
      } as any);

      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/scope", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/scope/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/scope", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/scope/:fileName/download", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fullFileName = req.query.fileName as string;

      if (!fullFileName) {
        return res.status(400).json({ message: "File name is required" });
      }

      const { getDownloadUrl } = await import("./b2");
      const url = await getDownloadUrl(fullFileName);

      res.json({ url });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Client Correspondence routes
  app.post("/api/projects/:projectId/correspondence/create", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { name, link, description } = req.body;
      const user = (req as any).user;
      const uploadedByName = user?.name || req.body.uploadedBy || "Unknown User";
      const uploadedById = user?.id || null;
      const uploadedByEmail = user?.email || null;

      if (!name || !link) {
        return res.status(400).json({ message: "Name and Link are required." });
      }

      // Create a dummy file content containing the link
      const fileContent = JSON.stringify({ link, description, name, createdAt: new Date() });
      const fileName = `projects/${projectId}/correspondence/${Date.now()}_link.json`;

      // Import dynamically
      const { uploadFile } = await import("./b2");

      const fileInfo = {
        correspondenceName: name,
        description: description || "",
        linkUrl: link,
        uploadedBy: uploadedByName
      };

      const result = await uploadFile(fileName, Buffer.from(fileContent), "application/json", fileInfo);

      await db.insert(fileUploads).values({
        projectId,
        category: "correspondence",
        fileName: result.fileName || fileName,
        originalName: "link.json",
        displayName: name,
        description,
        fileSize: Buffer.from(fileContent).length,
        contentType: "application/json",
        b2FileId: result.fileId,
        uploadedById,
        uploadedByName,
        uploadedByEmail,
      } as any);

      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/correspondence", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/correspondence/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/correspondence", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "Correspondence deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Supplier Correspondence routes
  app.post("/api/projects/:projectId/supplier-correspondence/create", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { name, link, description, uploadedBy } = req.body;

      if (!name || !link) {
        return res.status(400).json({ message: "Name and Link are required." });
      }

      // Create a dummy file content containing the link
      const fileContent = JSON.stringify({ link, description, name, createdAt: new Date() });
      const fileName = `projects/${projectId}/supplier-correspondence/${Date.now()}_link.json`;

      // Import dynamically
      const { uploadFile } = await import("./b2");

      const fileInfo = {
        correspondenceName: name,
        description: description || "",
        linkUrl: link,
        uploadedBy: uploadedBy || "Unknown User"
      };

      const result = await uploadFile(fileName, Buffer.from(fileContent), "application/json", fileInfo);
      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/supplier-correspondence", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/supplier-correspondence/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/supplier-correspondence", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "Correspondence deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Subcontract Correspondence routes
  app.post("/api/projects/:projectId/subcontract-correspondence/create", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { name, link, description, uploadedBy } = req.body;

      if (!name || !link) {
        return res.status(400).json({ message: "Name and Link are required." });
      }

      // Create a dummy file content containing the link
      const fileContent = JSON.stringify({ link, description, name, createdAt: new Date() });
      const fileName = `projects/${projectId}/subcontract-correspondence/${Date.now()}_link.json`;

      // Import dynamically
      const { uploadFile } = await import("./b2");

      const fileInfo = {
        correspondenceName: name,
        description: description || "",
        linkUrl: link,
        uploadedBy: uploadedBy || "Unknown User"
      };

      const result = await uploadFile(fileName, Buffer.from(fileContent), "application/json", fileInfo);
      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/subcontract-correspondence", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/subcontract-correspondence/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/subcontract-correspondence", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "Correspondence deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  // DELETE a WBS item (recursively deletes children)
  app.delete("/api/wbs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const wbsItem = await storage.getWbsItem(id);
      if (!wbsItem) {
        return res.status(404).json({ message: "WBS item not found" });
      }

      // Recursive function to get all child IDs
      const getAllChildIds = async (parentId: number): Promise<number[]> => {
        const children = await storage.getWbsItemsByParentId(parentId);
        let ids = children.map(c => c.id);
        for (const child of children) {
          const subChildIds = await getAllChildIds(child.id);
          ids = [...ids, ...subChildIds];
        }
        return ids;
      };

      const childIds = await getAllChildIds(id);

      // Delete all children first
      for (const childId of childIds.reverse()) { // Reverse to delete from bottom up
        await storage.deleteWbsItem(childId);
      }

      // Finally delete the item itself
      await storage.deleteWbsItem(id);

      res.json({ message: "WBS item and all children deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting WBS item:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Request For Inspection routes
  app.post("/api/projects/:projectId/request-for-inspection/upload", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }

      const file = req.files.file as any;
      const fileName = `projects/${projectId}/request-for-inspection/${Date.now()}_${file.name}`;

      const rfiName = req.body.rfiName || file.name;
      const description = req.body.description || "";
      const user = (req as any).user;
      const uploadedByName = user?.name || req.body.uploadedBy || "Unknown User";
      const uploadedById = user?.id || null;
      const uploadedByEmail = user?.email || null;

      const { uploadFile } = await import("./b2");

      const fileData = file.data;

      const fileInfo = {
        rfiName: rfiName,
        description: description,
        uploadedBy: uploadedByName
      };

      const result = await uploadFile(fileName, fileData, file.mimetype, fileInfo);

      await db.insert(fileUploads).values({
        projectId,
        category: "request-for-inspection",
        fileName: result.fileName || fileName,
        originalName: file.name,
        displayName: rfiName,
        description,
        fileSize: file.size,
        contentType: file.mimetype,
        b2FileId: result.fileId,
        uploadedById,
        uploadedByName,
        uploadedByEmail,
      } as any);

      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/request-for-inspection", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/request-for-inspection/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/request-for-inspection", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "RFI deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/request-for-inspection/download", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const fileId = req.query.fileId as string;

      if (isNaN(projectId) || !fileId) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      const { downloadFile } = await import("./b2");
      const { data, info } = await downloadFile(fileId);

      res.setHeader("Content-Type", info.contentType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${info.fileName}"`);
      res.send(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  // ITP & Reports routes
  app.post("/api/projects/:projectId/itp-and-reports/upload", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }

      const file = req.files.file as any;
      const fileName = `projects/${projectId}/itp-and-reports/${Date.now()}_${file.name}`;

      const docName = req.body.docName || file.name;
      const description = req.body.description || "";
      const user = (req as any).user;
      const uploadedByName = user?.name || req.body.uploadedBy || "Unknown User";
      const uploadedById = user?.id || null;
      const uploadedByEmail = user?.email || null;

      const { uploadFile } = await import("./b2");

      const fileData = file.data;

      const fileInfo = {
        docName: docName,
        description: description,
        uploadedBy: uploadedByName
      };

      const result = await uploadFile(fileName, fileData, file.mimetype, fileInfo);

      await db.insert(fileUploads).values({
        projectId,
        category: "itp-and-reports",
        fileName: result.fileName || fileName,
        originalName: file.name,
        displayName: docName,
        description,
        fileSize: file.size,
        contentType: file.mimetype,
        b2FileId: result.fileId,
        uploadedById,
        uploadedByName,
        uploadedByEmail,
      } as any);

      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/itp-and-reports", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/itp-and-reports/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/itp-and-reports", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "Document deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/itp-and-reports/download", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const fileId = req.query.fileId as string;

      if (isNaN(projectId) || !fileId) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      const { downloadFile } = await import("./b2");
      const { data, info } = await downloadFile(fileId);

      res.setHeader("Content-Type", info.contentType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${info.fileName}"`);
      res.send(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Other Documents routes
  app.post("/api/projects/:projectId/other-documents/upload", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }

      const file = req.files.file as any;
      const fileName = `projects/${projectId}/other-documents/${Date.now()}_${file.name}`;

      const docName = req.body.docName || file.name;
      const description = req.body.description || "";
      const user = (req as any).user;
      const uploadedByName = user?.name || req.body.uploadedBy || "Unknown User";
      const uploadedById = user?.id || null;
      const uploadedByEmail = user?.email || null;

      const { uploadFile } = await import("./b2");

      const fileData = file.data;

      const fileInfo = {
        docName: docName,
        description: description,
        uploadedBy: uploadedByName
      };

      const result = await uploadFile(fileName, fileData, file.mimetype, fileInfo);

      await db.insert(fileUploads).values({
        projectId,
        category: "other-documents",
        fileName: result.fileName || fileName,
        originalName: file.name,
        displayName: docName,
        description,
        fileSize: file.size,
        contentType: file.mimetype,
        b2FileId: result.fileId,
        uploadedById,
        uploadedByName,
        uploadedByEmail,
      } as any);

      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/other-documents", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/other-documents/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/other-documents", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "Document deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/other-documents/download", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const fileId = req.query.fileId as string;

      if (isNaN(projectId) || !fileId) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      const { downloadFile } = await import("./b2");
      const { data, info } = await downloadFile(fileId);

      res.setHeader("Content-Type", info.contentType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${info.fileName}"`);
      res.send(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Equipment Catalogue routes
  app.post("/api/projects/:projectId/equipment-catalogue/upload", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }

      const file = req.files.file as any;
      const fileName = `projects/${projectId}/equipment-catalogue/${Date.now()}_${file.name}`;

      const docName = req.body.docName || file.name;
      const description = req.body.description || "";
      const user = (req as any).user;
      const uploadedByName = user?.name || req.body.uploadedBy || "Unknown User";
      const uploadedById = user?.id || null;
      const uploadedByEmail = user?.email || null;

      const { uploadFile } = await import("./b2");

      const fileData = file.data;

      const fileInfo = {
        docName: docName,
        description: description,
        uploadedBy: uploadedByName
      };

      const result = await uploadFile(fileName, fileData, file.mimetype, fileInfo);

      await db.insert(fileUploads).values({
        projectId,
        category: "equipment-catalogue",
        fileName: result.fileName || fileName,
        originalName: file.name,
        displayName: docName,
        description,
        fileSize: file.size,
        contentType: file.mimetype,
        b2FileId: result.fileId,
        uploadedById,
        uploadedByName,
        uploadedByEmail,
      } as any);

      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/equipment-catalogue", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { listFiles } = await import("./b2");
      const prefix = `projects/${projectId}/equipment-catalogue/`;
      const files = await listFiles(prefix);

      res.json(files);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/equipment-catalogue", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileId = req.query.fileId as string;
      const fileName = req.query.fileName as string;

      if (!fileId || !fileName) {
        return res.status(400).json({ message: "fileId and fileName are required" });
      }

      const { deleteFile } = await import("./b2");
      await deleteFile(fileId, fileName);

      res.status(200).json({ message: "Document deleted successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/projects/:projectId/equipment-catalogue/download", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const fileId = req.query.fileId as string;

      if (isNaN(projectId) || !fileId) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      const { downloadFile } = await import("./b2");
      const { data, info } = await downloadFile(fileId);

      res.setHeader("Content-Type", info.contentType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${info.fileName}"`);
      res.send(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Daily Progress routes
  app.get("/api/projects/:projectId/daily-progress", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const data = await storage.getDailyProgress(projectId);
      res.json(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/daily-progress", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      // Inject projectId into body for validation
      const bodyWithId = { ...req.body, projectId };
      const entryData = insertDailyProgressSchema.parse(bodyWithId);
      const entry = await storage.createDailyProgress(entryData as any);
      res.json(entry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/daily-progress/bulk", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Body must be an array of entries" });
      }

      // Inject projectId into each entry
      const bodiesWithId = req.body.map((item: any) => ({ ...item, projectId }));

      const entriesData = z.array(insertDailyProgressSchema).parse(bodiesWithId);
      const entries = await storage.createDailyProgressBulk(entriesData as any);
      res.json(entries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/daily-progress/:entryId", async (req: Request, res: Response) => {
    try {
      const entryId = parseInt(req.params.entryId);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }

      const updateData = insertDailyProgressSchema.partial().parse(req.body);
      const updatedEntry = await storage.updateDailyProgress(entryId, updateData as any);

      if (!updatedEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      res.json(updatedEntry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/daily-progress/:entryId", async (req: Request, res: Response) => {
    try {
      const entryId = parseInt(req.params.entryId);
      if (isNaN(entryId)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }

      await storage.deleteDailyProgress(entryId);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Resource Plan routes
  app.get("/api/projects/:projectId/resource-plans", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const data = await storage.getResourcePlans(projectId);
      res.json(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/resource-plans", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      // Inject projectId into body for validation
      const bodyWithId = { ...req.body, projectId };
      const entryData = insertResourcePlanSchema.parse(bodyWithId);
      const entry = await storage.createResourcePlan(entryData as any);
      res.json(entry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/resource-plans/bulk", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Body must be an array of entries" });
      }

      // Inject projectId into each entry
      const bodiesWithId = req.body.map((item: any) => ({ ...item, projectId }));

      const entriesData = z.array(insertResourcePlanSchema).parse(bodiesWithId);
      const entries = await storage.createResourcePlanBulk(entriesData as any);
      res.json(entries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/resource-plans/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const updateData = insertResourcePlanSchema.partial().parse(req.body);
      const updatedEntry = await storage.updateResourcePlan(id, updateData as any);

      if (!updatedEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      res.json(updatedEntry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/resource-plans/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      await storage.deleteResourcePlan(id);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Risk Register routes
  app.get("/api/projects/:projectId/risk-register", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const data = await storage.getRiskRegisters(projectId);
      res.json(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/risk-register", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      // Inject projectId into body for validation
      const bodyWithId = { ...req.body, projectId };
      const entryData = insertRiskRegisterSchema.parse(bodyWithId);
      const entry = await storage.createRiskRegister(entryData as any);
      res.json(entry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/risk-register/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const id = parseInt(req.params.id);
      if (isNaN(projectId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID or risk register ID" });
      }
      const updateData = insertRiskRegisterSchema.partial().parse(req.body);
      const updatedEntry = await storage.updateRiskRegister(id, updateData as any);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Risk register entry not found" });
      }
      res.json(updatedEntry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/risk-register/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid risk register ID" });
      }
      await storage.deleteRiskRegister(id);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Lesson Learnt Register routes
  app.get("/api/projects/:projectId/lesson-learnt-register", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const data = await storage.getLessonLearntRegisters(projectId);
      res.json(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/lesson-learnt-register", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      // Inject projectId into body for validation
      const bodyWithId = { ...req.body, projectId };
      const entryData = insertLessonLearntRegisterSchema.parse(bodyWithId);
      const entry = await storage.createLessonLearntRegister(entryData as any);
      res.json(entry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/lesson-learnt-register/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const id = parseInt(req.params.id);
      if (isNaN(projectId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID or lesson learnt register ID" });
      }
      const updateData = insertLessonLearntRegisterSchema.partial().parse(req.body);
      const updatedEntry = await storage.updateLessonLearntRegister(id, updateData as any);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Lesson learnt register entry not found" });
      }
      res.json(updatedEntry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/lesson-learnt-register/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid lesson learnt register ID" });
      }
      await storage.deleteLessonLearntRegister(id);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Direct Manpower Position routes
  app.get("/api/projects/:projectId/direct-manpower-positions", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const data = await storage.getDirectManpowerPositions(projectId);
      res.json(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/direct-manpower-positions", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const bodyWithId = { ...req.body, projectId };
      const positionData = insertDirectManpowerPositionSchema.parse(bodyWithId);
      const position = await storage.createDirectManpowerPosition(positionData as any);
      res.json(position);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/direct-manpower-positions", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const positionsData = z.array(insertDirectManpowerPositionSchema).parse(
        req.body.map((p: any) => ({ ...p, projectId }))
      );
      const positions = await storage.updateDirectManpowerPositions(projectId, positionsData as any);
      res.json(positions);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/direct-manpower-positions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid position ID" });
      }
      const updateData = insertDirectManpowerPositionSchema.partial().parse(req.body);
      const updatedPosition = await storage.updateDirectManpowerPosition(id, updateData as any);
      if (!updatedPosition) {
        return res.status(404).json({ message: "Position not found" });
      }
      res.json(updatedPosition);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/direct-manpower-positions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid position ID" });
      }
      await storage.deleteDirectManpowerPosition(id);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Direct Manpower Entry routes
  app.get("/api/projects/:projectId/direct-manpower-entries", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const data = await storage.getDirectManpowerEntries(projectId);
      // Parse JSON positions field
      const entries = data.map(entry => ({
        ...entry,
        positions: JSON.parse(entry.positions as string)
      }));
      res.json(entries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/direct-manpower-entries", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const bodyWithId = { ...req.body, projectId };
      const entryData = insertDirectManpowerEntrySchema.parse(bodyWithId);
      const entry = await storage.createDirectManpowerEntry(entryData as any);
      res.json({
        ...entry,
        positions: JSON.parse(entry.positions as string)
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/direct-manpower-entries/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const id = parseInt(req.params.id);
      if (isNaN(projectId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID or entry ID" });
      }
      const updateData = insertDirectManpowerEntrySchema.partial().parse(req.body);
      const updatedEntry = await storage.updateDirectManpowerEntry(id, updateData as any);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Manpower entry not found" });
      }
      res.json({
        ...updatedEntry,
        positions: JSON.parse(updatedEntry.positions as string)
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/direct-manpower-entries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      await storage.deleteDirectManpowerEntry(id);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Indirect Manpower Position routes
  app.get("/api/projects/:projectId/indirect-manpower-positions", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const data = await storage.getIndirectManpowerPositions(projectId);
      res.json(data);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/indirect-manpower-positions", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const bodyWithId = { ...req.body, projectId };
      const positionData = insertIndirectManpowerPositionSchema.parse(bodyWithId);
      const position = await storage.createIndirectManpowerPosition(positionData as any);
      res.json(position);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/indirect-manpower-positions", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const positionsData = z.array(insertIndirectManpowerPositionSchema).parse(
        req.body.map((p: any) => ({ ...p, projectId }))
      );
      const positions = await storage.updateIndirectManpowerPositions(projectId, positionsData as any);
      res.json(positions);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/indirect-manpower-positions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid position ID" });
      }
      const updateData = insertIndirectManpowerPositionSchema.partial().parse(req.body);
      const updatedPosition = await storage.updateIndirectManpowerPosition(id, updateData as any);
      if (!updatedPosition) {
        return res.status(404).json({ message: "Position not found" });
      }
      res.json(updatedPosition);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/indirect-manpower-positions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid position ID" });
      }
      await storage.deleteIndirectManpowerPosition(id);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Indirect Manpower Entry routes
  app.get("/api/projects/:projectId/indirect-manpower-entries", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const data = await storage.getIndirectManpowerEntries(projectId);
      // Parse JSON positions field
      const entries = data.map(entry => ({
        ...entry,
        positions: JSON.parse(entry.positions as string),
        totalOverhead: parseFloat(entry.totalOverhead as string)
      }));
      res.json(entries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/indirect-manpower-entries", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const bodyWithId = { ...req.body, projectId };
      const entryData = insertIndirectManpowerEntrySchema.parse(bodyWithId);
      const entry = await storage.createIndirectManpowerEntry(entryData as any);
      res.json({
        ...entry,
        positions: JSON.parse(entry.positions as string),
        totalOverhead: parseFloat(entry.totalOverhead as string)
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/indirect-manpower-entries/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const id = parseInt(req.params.id);
      if (isNaN(projectId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID or entry ID" });
      }
      const updateData = insertIndirectManpowerEntrySchema.partial().parse(req.body);
      const updatedEntry = await storage.updateIndirectManpowerEntry(id, updateData as any);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Manpower entry not found" });
      }
      res.json({
        ...updatedEntry,
        positions: JSON.parse(updatedEntry.positions as string),
        totalOverhead: parseFloat(updatedEntry.totalOverhead as string)
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/indirect-manpower-entries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid entry ID" });
      }
      await storage.deleteIndirectManpowerEntry(id);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Kanban board routes
  const KANBAN_COLUMNS = ["wish", "ready", "doing", "done"] as const;
  app.get("/api/projects/:projectId/kanban", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const cards = await storage.getKanbanCards(projectId);
      const lanes = KANBAN_COLUMNS.map((col) => ({
        id: col,
        title: col.charAt(0).toUpperCase() + col.slice(1),
        cards: cards
          .filter((c) => c.column === col)
          .sort((a, b) => a.position - b.position)
          .map((c) => ({
            id: String(c.id),
            title: c.title,
            description: c.description ?? undefined,
          })),
      }));
      res.json({ lanes });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/kanban/cards", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const existing = await storage.getKanbanCards(projectId);
      const wishCards = existing.filter((c) => c.column === "wish");
      const nextPosition = wishCards.length ? Math.max(...wishCards.map((c) => c.position)) + 1 : 0;
      const body = insertKanbanCardSchema.parse({
        ...req.body,
        projectId,
        column: "wish",
        position: nextPosition,
      });
      const card = await storage.createKanbanCard(body as any);
      res.status(201).json(card);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/projects/:projectId/kanban/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }
      const body = req.body as { column?: string; position?: number; title?: string; description?: string };
      const update: Parameters<typeof storage.updateKanbanCard>[1] = {};
      if (body.column !== undefined) {
        if (!KANBAN_COLUMNS.includes(body.column as any)) {
          return res.status(400).json({ message: "Invalid column" });
        }
        update.column = body.column;
      }
      if (body.position !== undefined) update.position = body.position;
      if (body.title !== undefined) update.title = body.title;
      if (body.description !== undefined) update.description = body.description;
      const card = await storage.updateKanbanCard(id, update as any);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/kanban/cards/:id/archive", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }
      const card = await storage.updateKanbanCard(id, { archivedAt: new Date() } as any);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Planned Activity routes
  app.get("/api/projects/:projectId/planned-activities", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const activities = await storage.getPlannedActivities(projectId, startDate, endDate);

      // Fetch tasks for each activity
      const activitiesWithTasks = await Promise.all(
        activities.map(async (activity) => {
          const tasks = await storage.getPlannedActivityTasks(activity.id);
          return { ...activity, tasks };
        })
      );

      res.json(activitiesWithTasks);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/planned-activities", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      const bodyWithId = { ...req.body, projectId };
      const activityData = insertPlannedActivitySchema.parse(bodyWithId);
      const activity = await storage.createPlannedActivity(activityData as any);
      res.json({ ...activity, tasks: [] });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/planned-activities/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const id = parseInt(req.params.id);
      if (isNaN(projectId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID or activity ID" });
      }
      const updateData = insertPlannedActivitySchema.partial().parse(req.body);
      const updatedActivity = await storage.updatePlannedActivity(id, updateData as any);
      if (!updatedActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      const tasks = await storage.getPlannedActivityTasks(id);
      res.json({ ...updatedActivity, tasks });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/planned-activities/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      await storage.deletePlannedActivity(id);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Planned Activity Task routes
  app.get("/api/projects/:projectId/planned-activities/:activityId/tasks", async (req: Request, res: Response) => {
    try {
      const activityId = parseInt(req.params.activityId);
      if (isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      const tasks = await storage.getPlannedActivityTasks(activityId);
      res.json(tasks);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/planned-activities/:activityId/tasks", async (req: Request, res: Response) => {
    try {
      const activityId = parseInt(req.params.activityId);
      if (isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      const bodyWithId = { ...req.body, activityId };
      const taskData = insertPlannedActivityTaskSchema.parse(bodyWithId);
      const task = await storage.createPlannedActivityTask(taskData as any);
      res.json(task);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put("/api/projects/:projectId/planned-activities/:activityId/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      const updateData = insertPlannedActivityTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updatePlannedActivityTask(id, updateData as any);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(updatedTask);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/projects/:projectId/planned-activities/:activityId/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      await storage.deletePlannedActivityTask(id);
      res.sendStatus(204);
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // MATERIAL MASTER ROUTES
  // ========================================

  app.get("/api/material-masters", async (req: Request, res: Response) => {
    try {
      const materials = await db.select().from(materialMaster).orderBy(materialMaster.materialCode);
      res.json(materials);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/material-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      const material = await db.select().from(materialMaster).where(eq(materialMaster.id, id));
      if (material.length === 0) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json(material[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/material-masters", async (req: Request, res: Response) => {
    try {
      const materialData = insertMaterialMasterSchema.parse(req.body);
      const [inserted] = await db.insert(materialMaster).values(materialData as any).returning();
      res.status(201).json(inserted);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/material-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      const materialData = insertMaterialMasterSchema.partial().parse(req.body);
      const [updatedMaterial] = await db
        .update(materialMaster)
        .set({ ...materialData, updatedAt: new Date() })
        .where(eq(materialMaster.id, id))
        .returning();
      if (!updatedMaterial) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json(updatedMaterial);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/material-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      await db.delete(materialMaster).where(eq(materialMaster.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Bulk import material masters
  app.post("/api/material-masters/bulk-upload", async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!Array.isArray(csvData)) {
        return res.status(400).json({ message: "csvData must be an array" });
      }

      const materials = csvData.map((row: any) => insertMaterialMasterSchema.parse(row));
      const createdMaterials = await db.insert(materialMaster).values(materials as any).returning();
      res.status(201).json(createdMaterials);
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // UOM ROUTES
  // ========================================

  app.get("/api/uoms", async (req: Request, res: Response) => {
    try {
      const allUoms = await db.select().from(uoms).orderBy(uoms.name);
      res.json(allUoms);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/uoms", async (req: Request, res: Response) => {
    try {
      const uomData = insertUomSchema.parse(req.body);
      const [uom] = await db.insert(uoms).values(uomData as any).returning();
      res.status(201).json(uom);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/uoms/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const uomData = insertUomSchema.partial().parse(req.body);
      const [updated] = await db.update(uoms)
        .set({ ...uomData, updatedAt: new Date() })
        .where(eq(uoms.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "UOM not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/uoms/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      await db.delete(uoms).where(eq(uoms.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // MATERIAL TYPE ROUTES
  // ========================================

  app.get("/api/material-types", async (req: Request, res: Response) => {
    try {
      const allTypes = await db.select().from(materialTypes).orderBy(materialTypes.name);
      res.json(allTypes);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/material-types", async (req: Request, res: Response) => {
    try {
      const typeData = insertMaterialTypeSchema.parse(req.body);
      const [materialType] = await db.insert(materialTypes).values(typeData).returning();
      res.status(201).json(materialType);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/material-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const typeData = insertMaterialTypeSchema.partial().parse(req.body);
      const [updated] = await db.update(materialTypes)
        .set({ ...typeData, updatedAt: new Date() })
        .where(eq(materialTypes.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "Material Type not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/material-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      await db.delete(materialTypes).where(eq(materialTypes.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // MATERIAL GROUP ROUTES
  // ========================================

  app.get("/api/material-groups", async (req: Request, res: Response) => {
    try {
      const allGroups = await db.select().from(materialGroups).orderBy(materialGroups.name);
      res.json(allGroups);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/material-groups", async (req: Request, res: Response) => {
    try {
      const groupData = insertMaterialGroupSchema.parse(req.body);
      const [materialGroup] = await db.insert(materialGroups).values(groupData).returning();
      res.status(201).json(materialGroup);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/material-groups/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const groupData = insertMaterialGroupSchema.partial().parse(req.body);
      const [updated] = await db.update(materialGroups)
        .set({ ...groupData, updatedAt: new Date() })
        .where(eq(materialGroups.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "Material Group not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/material-groups/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      await db.delete(materialGroups).where(eq(materialGroups.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // SERVICE MASTER ROUTES
  // ========================================

  app.get("/api/service-masters", async (req: Request, res: Response) => {
    try {
      const services = await db.select().from(serviceMaster).orderBy(serviceMaster.serviceCode);
      res.json(services);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/service-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid service ID" });
      const [service] = await db.select().from(serviceMaster).where(eq(serviceMaster.id, id));
      if (!service) return res.status(404).json({ message: "Service not found" });
      res.json(service);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/service-masters", async (req: Request, res: Response) => {
    try {
      const data = insertServiceMasterSchema.parse(req.body);
      const [service] = await db.insert(serviceMaster).values(data).returning();
      res.status(201).json(service);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/service-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid service ID" });
      const data = insertServiceMasterSchema.partial().parse(req.body);
      const [updated] = await db
        .update(serviceMaster)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(serviceMaster.id, id))
        .returning();
      if (!updated) return res.status(404).json({ message: "Service not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/service-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid service ID" });
      await db.delete(serviceMaster).where(eq(serviceMaster.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/service-masters/bulk-upload", async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!Array.isArray(csvData)) return res.status(400).json({ message: "csvData must be an array" });
      const services = csvData.map((row: any) => insertServiceMasterSchema.parse(row));
      const created = await db.insert(serviceMaster).values(services as any).returning();
      res.status(201).json(created);
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // ALLOCATION (cross-project rollups for materials / resources on work packages)
  // ========================================

  /** Global material master rows with total qty across all WPs and per-WP breakdown (project + WP). */
  app.get("/api/allocation/materials", async (_req: Request, res: Response) => {
    try {
      const allMaterials = await db.select().from(materialMaster);
      const allocationRows = await db
        .select({
          id: workPackageMaterials.id,
          materialId: workPackageMaterials.materialId,
          quantity: workPackageMaterials.quantity,
          wpId: workPackages.id,
          wpName: workPackages.name,
          wpCode: workPackages.code,
          projectId: projects.id,
          projectName: projects.name,
        })
        .from(workPackageMaterials)
        .innerJoin(workPackages, eq(workPackageMaterials.wpId, workPackages.id))
        .innerJoin(projects, eq(workPackageMaterials.projectId, projects.id));

      type Alloc = {
        allocationId: number;
        projectId: number;
        projectName: string;
        wpId: number;
        wpCode: string;
        wpName: string;
        quantity: number;
      };
      const byMaterial = new Map<number, { total: number; allocations: Alloc[] }>();
      for (const row of allocationRows) {
        const q = parseFloat(String(row.quantity ?? "0"));
        const qty = Number.isFinite(q) ? q : 0;
        const cur = byMaterial.get(row.materialId) ?? { total: 0, allocations: [] as Alloc[] };
        cur.total += qty;
        cur.allocations.push({
          allocationId: row.id,
          projectId: row.projectId,
          projectName: row.projectName,
          wpId: row.wpId,
          wpCode: row.wpCode,
          wpName: row.wpName,
          quantity: qty,
        });
        byMaterial.set(row.materialId, cur);
      }

      const materials = allMaterials.map((m) => {
        const agg = byMaterial.get(m.id);
        const allocations = [...(agg?.allocations ?? [])].sort((a, b) => {
          const pc = a.projectName.localeCompare(b.projectName, undefined, { sensitivity: "base" });
          if (pc !== 0) return pc;
          return a.wpCode.localeCompare(b.wpCode, undefined, { numeric: true });
        });
        return {
          ...m,
          totalQuantityRequired: agg?.total ?? 0,
          allocations,
        };
      });
      materials.sort((a, b) =>
        String(a.materialCode ?? "").localeCompare(String(b.materialCode ?? ""), undefined, { sensitivity: "base" })
      );

      /** PO lines store free-text description (usually material master description); match to material rows. */
      const poMaterialLines = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.itemType, "material"));
      const poIdSet = [...new Set(poMaterialLines.map((r) => r.poId))];
      const orderRows =
        poIdSet.length > 0
          ? await db.select().from(purchaseOrders).where(inArray(purchaseOrders.id, poIdSet))
          : [];
      const orderById = new Map(orderRows.map((o) => [o.id, o]));

      const lineMatchesMaterial = (
        itemDescription: string,
        row: { materialCode: string; materialDescription: string }
      ): boolean => {
        const d = (itemDescription ?? "").trim();
        if (!d) return false;
        const md = (row.materialDescription ?? "").trim();
        const code = (row.materialCode ?? "").trim();
        if (d === md) return true;
        const combinedEm = `${code} — ${md}`;
        const combinedHyphen = `${code} - ${md}`;
        if (code && (d === combinedEm || d === combinedHyphen)) return true;
        if (code && (d.startsWith(`${code} —`) || d.startsWith(`${code} -`))) return true;
        return false;
      };

      type PoLineOut = {
        id: number;
        lineNumber: number;
        itemDescription: string;
        quantity: string;
        unitOfMeasure: string;
        unitPrice: string;
        totalPrice: string;
        estimatedDeliveryDate: string | null;
        actualDeliveryDate: string | null;
        projectId: number | null;
        wpId: number | null;
      };
      type PoOut = {
        poId: number;
        poNumber: string;
        poDate: string;
        vendor: string;
        remarks: string | null;
        lines: PoLineOut[];
      };

      const materialsWithPo = materials.map((m) => {
        const matching = poMaterialLines.filter((line) => lineMatchesMaterial(line.itemDescription, m));
        const byPoId = new Map<number, (typeof purchaseOrderItems.$inferSelect)[]>();
        for (const line of matching) {
          const list = byPoId.get(line.poId) ?? [];
          list.push(line);
          byPoId.set(line.poId, list);
        }
        const purchaseOrders: PoOut[] = [];
        for (const [poId, lines] of byPoId) {
          const hdr = orderById.get(poId);
          if (!hdr) continue;
          const sorted = [...lines].sort((a, b) => a.lineNumber - b.lineNumber);
          purchaseOrders.push({
            poId: hdr.id,
            poNumber: hdr.poNumber,
            poDate:
              hdr.poDate instanceof Date
                ? hdr.poDate.toISOString().slice(0, 10)
                : String(hdr.poDate ?? ""),
            vendor: hdr.vendor,
            remarks: hdr.remarks ?? null,
            lines: sorted.map((line) => ({
              id: line.id,
              lineNumber: line.lineNumber,
              itemDescription: line.itemDescription,
              quantity: String(line.quantity),
              unitOfMeasure: line.unitOfMeasure,
              unitPrice: String(line.unitPrice),
              totalPrice: String(line.totalPrice),
              estimatedDeliveryDate: line.estimatedDeliveryDate
                ? String(line.estimatedDeliveryDate)
                : null,
              actualDeliveryDate: line.actualDeliveryDate ? String(line.actualDeliveryDate) : null,
              projectId: line.projectId ?? null,
              wpId: line.wpId ?? null,
            })),
          });
        }
        purchaseOrders.sort((a, b) => String(b.poDate).localeCompare(String(a.poDate)));
        return { ...m, purchaseOrders };
      });

      res.json({ materials: materialsWithPo });
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // WORK PACKAGE MATERIALS (assign materials to WP; estimated value = quantity * base_rate)
  // ========================================

  app.get("/api/projects/:projectId/work-package-materials", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
      const rows = await db.select().from(workPackageMaterials).where(eq(workPackageMaterials.projectId, projectId));
      const materials = await db.select().from(materialMaster);
      const byId = new Map(materials.map((m: any) => [m.id, m]));
      const result = rows.map((r: typeof workPackageMaterials.$inferSelect) => {
        const mat = byId.get(r.materialId);
        return {
          ...r,
          materialCode: (mat as any)?.materialCode,
          materialDescription: (mat as any)?.materialDescription,
          uom: (mat as any)?.uom,
          baseRate: (mat as any)?.baseRate,
        };
      });
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/work-packages/:wpId/materials", async (req: Request, res: Response) => {
    try {
      const wpId = parseInt(req.params.wpId);
      if (isNaN(wpId)) return res.status(400).json({ message: "Invalid work package ID" });
      const rows = await db.select().from(workPackageMaterials).where(eq(workPackageMaterials.wpId, wpId));
      const materials = await db.select().from(materialMaster);
      const byId = new Map(materials.map((m: any) => [m.id, m]));
      const result = rows.map((r: typeof workPackageMaterials.$inferSelect) => {
        const mat = byId.get(r.materialId);
        return {
          ...r,
          materialCode: (mat as any)?.materialCode,
          materialDescription: (mat as any)?.materialDescription,
          uom: (mat as any)?.uom,
          baseRate: (mat as any)?.baseRate,
        };
      });
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/work-package-materials", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
      const body = { ...req.body, projectId };
      const data = insertWorkPackageMaterialSchema.parse(body);
      const [row] = await db.insert(workPackageMaterials).values({
        projectId: data.projectId,
        wpId: data.wpId,
        materialId: data.materialId,
        quantity: data.quantity,
        estimatedValue: data.estimatedValue,
        updatedAt: new Date(),
      } as any).returning();
      res.status(201).json(row);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/work-package-materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const body = req.body as { quantity?: string | number; estimatedValue?: string | number };
      const updates: { quantity?: string; estimatedValue?: string; updatedAt: Date } = { updatedAt: new Date() };
      if (body.quantity !== undefined) updates.quantity = String(body.quantity);
      if (body.estimatedValue !== undefined) updates.estimatedValue = String(body.estimatedValue);
      const [updated] = await db.update(workPackageMaterials).set(updates).where(eq(workPackageMaterials.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/work-package-materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(workPackageMaterials).where(eq(workPackageMaterials.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // WORK PACKAGE SERVICES
  // ========================================

  app.get("/api/projects/:projectId/work-package-services", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
      const rows = await db.select().from(workPackageServices).where(eq(workPackageServices.projectId, projectId));
      const services = await db.select().from(serviceMaster);
      const byId = new Map(services.map((s: any) => [s.id, s]));
      const result = rows.map((r: typeof workPackageServices.$inferSelect) => {
        const svc = byId.get(r.serviceId);
        return {
          ...r,
          serviceCode: (svc as any)?.serviceCode,
          serviceDescription: (svc as any)?.serviceDescription,
          uom: (svc as any)?.uom,
          baseRate: (svc as any)?.baseRate,
        };
      });
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/work-packages/:wpId/services", async (req: Request, res: Response) => {
    try {
      const wpId = parseInt(req.params.wpId);
      if (isNaN(wpId)) return res.status(400).json({ message: "Invalid work package ID" });
      const rows = await db.select().from(workPackageServices).where(eq(workPackageServices.wpId, wpId));
      const services = await db.select().from(serviceMaster);
      const byId = new Map(services.map((s: any) => [s.id, s]));
      const result = rows.map((r: typeof workPackageServices.$inferSelect) => {
        const svc = byId.get(r.serviceId);
        return {
          ...r,
          serviceCode: (svc as any)?.serviceCode,
          serviceDescription: (svc as any)?.serviceDescription,
          uom: (svc as any)?.uom,
          baseRate: (svc as any)?.baseRate,
        };
      });
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/projects/:projectId/work-package-services", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
      const body = { ...req.body, projectId };
      const data = insertWorkPackageServiceSchema.parse(body);
      const [row] = await db.insert(workPackageServices).values({
        projectId: data.projectId,
        wpId: data.wpId,
        serviceId: data.serviceId,
        quantity: data.quantity,
        estimatedValue: data.estimatedValue,
        updatedAt: new Date(),
      } as any).returning();
      res.status(201).json(row);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/work-package-services/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const body = req.body as { quantity?: string | number; estimatedValue?: string | number };
      const updates: { quantity?: string; estimatedValue?: string; updatedAt: Date } = { updatedAt: new Date() };
      if (body.quantity !== undefined) updates.quantity = String(body.quantity);
      if (body.estimatedValue !== undefined) updates.estimatedValue = String(body.estimatedValue);
      const [updated] = await db.update(workPackageServices).set(updates).where(eq(workPackageServices.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/work-package-services/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(workPackageServices).where(eq(workPackageServices.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Bulk CSV upload: material code, quantity, work package id or code → lookup master, compute estimated value, insert
  const wpMaterialsBulkUploadSchema = z.object({
    csvData: z.array(z.object({
      materialCode: z.string().min(1),
      quantity: z.union([z.string(), z.number()]).transform((v) => (typeof v === "number" ? String(v) : String(v).trim())),
      wpIdOrCode: z.union([z.string(), z.number()]).transform((v) => String(v).trim()),
    })),
  });

  app.post("/api/projects/:projectId/work-package-materials/bulk-upload", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
      const { csvData } = wpMaterialsBulkUploadSchema.parse({ csvData: req.body?.csvData });
      if (!csvData.length) return res.status(400).json({ message: "csvData must be a non-empty array" });

      const materials = await db.select().from(materialMaster);
      const materialByCode = new Map(materials.map((m: { materialCode: string; id: number; baseRate: string }) => [m.materialCode.trim().toLowerCase(), m]));
      const projectWps = await storage.getWorkPackagesByProject(projectId);
      const validWpIds = new Set(projectWps.map((wp: { id: number }) => wp.id));
      const wpByCode = new Map(projectWps.map((wp: { code: string; id: number }) => [wp.code.trim().toLowerCase(), wp.id]));

      const created: unknown[] = [];
      const errors: { row: number; message: string }[] = [];

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const qty = parseFloat(row.quantity);
        if (isNaN(qty) || qty <= 0) {
          errors.push({ row: i + 1, message: `Invalid quantity: ${row.quantity}` });
          continue;
        }
        let wpId: number;
        const raw = row.wpIdOrCode;
        const asNum = /^\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
        if (!Number.isNaN(asNum) && validWpIds.has(asNum)) {
          wpId = asNum;
        } else {
          const byCode = wpByCode.get(raw.toLowerCase());
          if (byCode !== undefined) wpId = byCode;
          else {
            errors.push({ row: i + 1, message: `Work package "${raw}" not found (use ID or code from the list, e.g. 1.2.1.1)` });
            continue;
          }
        }
        const mat = materialByCode.get(row.materialCode.trim().toLowerCase());
        if (!mat) {
          errors.push({ row: i + 1, message: `Material code not found: ${row.materialCode}` });
          continue;
        }
        const baseRate = Number(mat.baseRate ?? 0);
        const estimatedValue = (qty * baseRate).toFixed(2);
        const [inserted] = await db.insert(workPackageMaterials).values({
          projectId,
          wpId,
          materialId: mat.id,
          quantity: row.quantity,
          estimatedValue,
          updatedAt: new Date(),
        } as any).returning();
        if (inserted) created.push(inserted);
      }

      res.status(201).json({ created: created.length, rows: created, errors: errors.length ? errors : undefined });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Bulk CSV upload: service code, quantity, work package id or code → lookup master, compute estimated value, insert
  const wpServicesBulkUploadSchema = z.object({
    csvData: z.array(z.object({
      serviceCode: z.string().min(1),
      quantity: z.union([z.string(), z.number()]).transform((v) => (typeof v === "number" ? String(v) : String(v).trim())),
      wpIdOrCode: z.union([z.string(), z.number()]).transform((v) => String(v).trim()),
    })),
  });

  app.post("/api/projects/:projectId/work-package-services/bulk-upload", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
      const { csvData } = wpServicesBulkUploadSchema.parse({ csvData: req.body?.csvData });
      if (!csvData.length) return res.status(400).json({ message: "csvData must be a non-empty array" });

      const services = await db.select().from(serviceMaster);
      const serviceByCode = new Map(services.map((s: { serviceCode: string; id: number; baseRate: string }) => [s.serviceCode.trim().toLowerCase(), s]));
      const projectWps = await storage.getWorkPackagesByProject(projectId);
      const validWpIds = new Set(projectWps.map((wp: { id: number }) => wp.id));
      const wpByCode = new Map(projectWps.map((wp: { code: string; id: number }) => [wp.code.trim().toLowerCase(), wp.id]));

      const created: unknown[] = [];
      const errors: { row: number; message: string }[] = [];

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const qty = parseFloat(row.quantity);
        if (isNaN(qty) || qty <= 0) {
          errors.push({ row: i + 1, message: `Invalid quantity: ${row.quantity}` });
          continue;
        }
        let wpId: number;
        const raw = row.wpIdOrCode;
        const asNum = /^\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
        if (!Number.isNaN(asNum) && validWpIds.has(asNum)) {
          wpId = asNum;
        } else {
          const byCode = wpByCode.get(raw.toLowerCase());
          if (byCode !== undefined) wpId = byCode;
          else {
            errors.push({ row: i + 1, message: `Work package "${raw}" not found (use ID or code from the list, e.g. 1.2.1.1)` });
            continue;
          }
        }
        const svc = serviceByCode.get(row.serviceCode.trim().toLowerCase());
        if (!svc) {
          errors.push({ row: i + 1, message: `Service code not found: ${row.serviceCode}` });
          continue;
        }
        const baseRate = Number(svc.baseRate ?? 0);
        const estimatedValue = (qty * baseRate).toFixed(2);
        const [inserted] = await db.insert(workPackageServices).values({
          projectId,
          wpId,
          serviceId: svc.id,
          quantity: row.quantity,
          estimatedValue,
          updatedAt: new Date(),
        } as any).returning();
        if (inserted) created.push(inserted);
      }

      res.status(201).json({ created: created.length, rows: created, errors: errors.length ? errors : undefined });
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // SERVICE TYPE ROUTES
  // ========================================

  app.get("/api/service-types", async (req: Request, res: Response) => {
    try {
      const all = await db.select().from(serviceTypes).orderBy(serviceTypes.name);
      res.json(all);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/service-types", async (req: Request, res: Response) => {
    try {
      const data = insertServiceTypeSchema.parse(req.body);
      const [row] = await db.insert(serviceTypes).values(data as any).returning();
      res.status(201).json(row);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/service-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertServiceTypeSchema.partial().parse(req.body);
      const [updated] = await db
        .update(serviceTypes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(serviceTypes.id, id))
        .returning();
      if (!updated) return res.status(404).json({ message: "Service Type not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/service-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(serviceTypes).where(eq(serviceTypes.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // SERVICE GROUP ROUTES
  // ========================================

  app.get("/api/service-groups", async (req: Request, res: Response) => {
    try {
      const all = await db.select().from(serviceGroups).orderBy(serviceGroups.name);
      res.json(all);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/service-groups", async (req: Request, res: Response) => {
    try {
      const data = insertServiceGroupSchema.parse(req.body);
      const [row] = await db.insert(serviceGroups).values(data as any).returning();
      res.status(201).json(row);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/service-groups/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertServiceGroupSchema.partial().parse(req.body);
      const [updated] = await db
        .update(serviceGroups)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(serviceGroups.id, id))
        .returning();
      if (!updated) return res.status(404).json({ message: "Service Group not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/service-groups/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(serviceGroups).where(eq(serviceGroups.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // COUNTRY ROUTES
  // ========================================

  app.get("/api/countries", async (req: Request, res: Response) => {
    try {
      const allCountries = await db.select().from(countries).orderBy(countries.name);
      res.json(allCountries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/countries", async (req: Request, res: Response) => {
    try {
      const countryData = insertCountrySchema.parse(req.body);
      const [country] = await db.insert(countries).values(countryData as any).returning();
      res.status(201).json(country);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/countries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const countryData = insertCountrySchema.partial().parse(req.body);
      const [updated] = await db.update(countries)
        .set({ ...countryData, updatedAt: new Date() } as any)
        .where(eq(countries.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "Country not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/countries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      await db.delete(countries).where(eq(countries.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // CITY ROUTES
  // ========================================

  app.get("/api/cities", async (req: Request, res: Response) => {
    try {
      // Return cities joined with country name for better UX
      const allCities = await db
        .select({
          id: cities.id,
          name: cities.name,
          countryId: cities.countryId,
          countryName: countries.name,
          createdAt: cities.createdAt,
          updatedAt: cities.updatedAt,
        })
        .from(cities)
        .leftJoin(countries, eq(cities.countryId, countries.id))
        .orderBy(cities.name);
      res.json(allCities);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/cities", async (req: Request, res: Response) => {
    try {
      const cityData = insertCitySchema.parse(req.body);
      const [city] = await db.insert(cities).values(cityData as any).returning();
      res.status(201).json(city);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/cities/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const cityData = insertCitySchema.partial().parse(req.body);
      const [updated] = await db.update(cities)
        .set({ ...cityData, updatedAt: new Date() } as any)
        .where(eq(cities.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "City not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/cities/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      await db.delete(cities).where(eq(cities.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // VENDOR MASTER ROUTES
  // ========================================

  app.get("/api/vendor-masters", async (req: Request, res: Response) => {
    try {
      const vendors = await db.select().from(vendorMaster).orderBy(vendorMaster.vendorCode);
      res.json(vendors);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/vendor-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vendor ID" });
      }
      const vendor = await db.select().from(vendorMaster).where(eq(vendorMaster.id, id));
      if (vendor.length === 0) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/vendor-masters", async (req: Request, res: Response) => {
    try {
      const vendorData = insertVendorMasterSchema.parse(req.body);
      const [vendor] = await db.insert(vendorMaster).values(vendorData as any).returning();
      res.status(201).json(vendor);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/vendor-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vendor ID" });
      }
      const vendorData = insertVendorMasterSchema.partial().parse(req.body);
      const [updatedVendor] = await db
        .update(vendorMaster)
        .set({ ...vendorData, updatedAt: new Date() } as any)
        .where(eq(vendorMaster.id, id))
        .returning();
      if (!updatedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(updatedVendor);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/vendor-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vendor ID" });
      }
      await db.delete(vendorMaster).where(eq(vendorMaster.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Bulk import vendor masters
  app.post("/api/vendor-masters/bulk-upload", async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!Array.isArray(csvData)) {
        return res.status(400).json({ message: "csvData must be an array" });
      }

      const vendors = csvData.map((row: any) => insertVendorMasterSchema.parse(row));
      const createdVendors = await db.insert(vendorMaster).values(vendors as any).returning();
      res.status(201).json(createdVendors);
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // EMPLOYEE SETTINGS ROUTES
  // ========================================

  // Nationality Routes
  app.get("/api/nationalities", async (_req: Request, res: Response) => {
    try {
      const results = await db.select().from(nationalities).orderBy(nationalities.name);
      res.json(results);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Alias for compatibility
  app.get("/api/nationality", async (req: Request, res: Response) => {
    const results = await db.select().from(nationalities).orderBy(nationalities.name);
    res.json(results);
  });

  app.post("/api/nationalities", async (req: Request, res: Response) => {
    try {
      const data = insertNationalitySchema.parse(req.body);
      const [result] = await db.insert(nationalities).values(data as any).returning();
      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/nationalities/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertNationalitySchema.partial().parse(req.body);
      const [result] = await db.update(nationalities).set({ ...data, updatedAt: new Date() } as any).where(eq(nationalities.id, id)).returning();
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/nationalities/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(nationalities).where(eq(nationalities.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Employee Title Routes
  app.get("/api/employee-titles", async (_req: Request, res: Response) => {
    try {
      const results = await db.select().from(employeeTitles).orderBy(employeeTitles.name);
      res.json(results);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Alias for compatibility
  app.get("/api/titles", async (_req: Request, res: Response) => {
    const results = await db.select().from(employeeTitles).orderBy(employeeTitles.name);
    res.json(results);
  });

  app.post("/api/employee-titles", async (req: Request, res: Response) => {
    try {
      const data = insertEmployeeTitleSchema.parse(req.body);
      const [result] = await db.insert(employeeTitles).values(data as any).returning();
      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/employee-titles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertEmployeeTitleSchema.partial().parse(req.body);
      const [result] = await db.update(employeeTitles).set({ ...data, updatedAt: new Date() } as any).where(eq(employeeTitles.id, id)).returning();
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/employee-titles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(employeeTitles).where(eq(employeeTitles.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Employee Position Routes
  app.get("/api/employee-positions", async (_req: Request, res: Response) => {
    try {
      const results = await db.select().from(employeePositions).orderBy(employeePositions.name);
      res.json(results);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Alias for compatibility
  app.get("/api/positions", async (_req: Request, res: Response) => {
    const results = await db.select().from(employeePositions).orderBy(employeePositions.name);
    res.json(results);
  });

  app.post("/api/employee-positions", async (req: Request, res: Response) => {
    try {
      const data = insertEmployeePositionSchema.parse(req.body);
      const [result] = await db.insert(employeePositions).values(data as any).returning();
      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/employee-positions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertEmployeePositionSchema.partial().parse(req.body);
      const [result] = await db.update(employeePositions).set({ ...data, updatedAt: new Date() } as any).where(eq(employeePositions.id, id)).returning();
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/employee-positions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(employeePositions).where(eq(employeePositions.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Employee Grade Routes
  app.get("/api/employee-grades", async (_req: Request, res: Response) => {
    try {
      const results = await db.select().from(employeeGrades).orderBy(employeeGrades.name);
      res.json(results);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Alias for compatibility
  app.get("/api/grades", async (_req: Request, res: Response) => {
    const results = await db.select().from(employeeGrades).orderBy(employeeGrades.name);
    res.json(results);
  });

  app.post("/api/employee-grades", async (req: Request, res: Response) => {
    try {
      const data = insertEmployeeGradeSchema.parse(req.body);
      const [result] = await db.insert(employeeGrades).values(data as any).returning();
      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/employee-grades/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertEmployeeGradeSchema.partial().parse(req.body);
      const [result] = await db.update(employeeGrades).set({ ...data, updatedAt: new Date() } as any).where(eq(employeeGrades.id, id)).returning();
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/employee-grades/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(employeeGrades).where(eq(employeeGrades.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Employee Trade Routes
  app.get("/api/employee-trades", async (_req: Request, res: Response) => {
    try {
      const results = await db.select().from(employeeTrades).orderBy(employeeTrades.name);
      res.json(results);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Alias for compatibility
  app.get("/api/trades", async (_req: Request, res: Response) => {
    const results = await db.select().from(employeeTrades).orderBy(employeeTrades.name);
    res.json(results);
  });

  app.post("/api/employee-trades", async (req: Request, res: Response) => {
    try {
      const data = insertEmployeeTradeSchema.parse(req.body);
      const [result] = await db.insert(employeeTrades).values(data as any).returning();
      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/employee-trades/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertEmployeeTradeSchema.partial().parse(req.body);
      const [result] = await db.update(employeeTrades).set({ ...data, updatedAt: new Date() } as any).where(eq(employeeTrades.id, id)).returning();
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/employee-trades/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(employeeTrades).where(eq(employeeTrades.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // EMPLOYEE MASTER ROUTES
  // ========================================

  app.get("/api/employee-masters", async (req: Request, res: Response) => {
    try {
      const employees = await db.select().from(employeeMaster).orderBy(employeeMaster.employeeNumber);
      res.json(employees);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/employee-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      const employee = await db.select().from(employeeMaster).where(eq(employeeMaster.id, id));
      if (employee.length === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/employee-masters", async (req: Request, res: Response) => {
    try {
      const employeeData = insertEmployeeMasterSchema.parse(req.body);
      const [employee] = await db.insert(employeeMaster).values(employeeData as any).returning();
      res.status(201).json(employee);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/employee-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      const employeeData = insertEmployeeMasterSchema.partial().parse(req.body);
      const [updatedEmployee] = await db
        .update(employeeMaster)
        .set({ ...employeeData, updatedAt: new Date() } as any)
        .where(eq(employeeMaster.id, id))
        .returning();
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(updatedEmployee);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/employee-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      await db.delete(employeeMaster).where(eq(employeeMaster.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Bulk import employee masters
  app.post("/api/employee-masters/bulk-upload", async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!Array.isArray(csvData)) {
        return res.status(400).json({ message: "csvData must be an array" });
      }

      const employeesWithRow: Array<{ row: number; data: any }> = [];
      const rowErrors: Array<{ row: number; errors: unknown[] }> = [];

      csvData.forEach((row: any, index: number) => {
        const parsed = insertEmployeeMasterSchema.safeParse(row);
        if (parsed.success) {
          employeesWithRow.push({ row: index + 1, data: parsed.data });
        } else {
          rowErrors.push({
            row: index + 1,
            errors: parsed.error.errors,
          });
        }
      });

      if (rowErrors.length > 0) {
        return res.status(400).json({
          message: "Validation error in uploaded rows",
          errors: rowErrors,
        });
      }

      const employees = employeesWithRow.map(item => item.data);

      // Check duplicate unique fields inside CSV itself before DB insert.
      const nationalIdRows = new Map<string, number[]>();
      const employeeNumberRows = new Map<string, number[]>();
      employeesWithRow.forEach(({ row, data }) => {
        const nationalId = String(data.empNationalId).trim();
        const employeeNumber = String(data.employeeNumber).trim();
        nationalIdRows.set(nationalId, [...(nationalIdRows.get(nationalId) ?? []), row]);
        employeeNumberRows.set(employeeNumber, [...(employeeNumberRows.get(employeeNumber) ?? []), row]);
      });

      nationalIdRows.forEach((rows, value) => {
        if (rows.length > 1) {
          rows.forEach(row => {
            rowErrors.push({
              row,
              errors: [{ message: `Duplicate empNationalId in upload: ${value}`, path: ["empNationalId"] }],
            });
          });
        }
      });

      employeeNumberRows.forEach((rows, value) => {
        if (rows.length > 1) {
          rows.forEach(row => {
            rowErrors.push({
              row,
              errors: [{ message: `Duplicate employeeNumber in upload: ${value}`, path: ["employeeNumber"] }],
            });
          });
        }
      });

      // Check duplicates against existing DB rows (unique constraints).
      const nationalIds = [...new Set(employees.map(emp => String(emp.empNationalId).trim()))];
      const employeeNumbers = [...new Set(employees.map(emp => String(emp.employeeNumber).trim()))];

      const existingByNationalId = nationalIds.length
        ? await db
            .select({ empNationalId: employeeMaster.empNationalId })
            .from(employeeMaster)
            .where(inArray(employeeMaster.empNationalId, nationalIds))
        : [];
      const existingByEmployeeNumber = employeeNumbers.length
        ? await db
            .select({ employeeNumber: employeeMaster.employeeNumber })
            .from(employeeMaster)
            .where(inArray(employeeMaster.employeeNumber, employeeNumbers))
        : [];

      const existingNationalIdSet = new Set(existingByNationalId.map(item => item.empNationalId));
      const existingEmployeeNumberSet = new Set(existingByEmployeeNumber.map(item => item.employeeNumber));

      employeesWithRow.forEach(({ row, data }) => {
        const nationalId = String(data.empNationalId).trim();
        const employeeNumber = String(data.employeeNumber).trim();
        if (existingNationalIdSet.has(nationalId)) {
          rowErrors.push({
            row,
            errors: [{ message: `empNationalId already exists: ${nationalId}`, path: ["empNationalId"] }],
          });
        }
        if (existingEmployeeNumberSet.has(employeeNumber)) {
          rowErrors.push({
            row,
            errors: [{ message: `employeeNumber already exists: ${employeeNumber}`, path: ["employeeNumber"] }],
          });
        }
      });

      const rowsWithErrors = new Set(rowErrors.map(item => item.row));
      const validEmployees = employeesWithRow
        .filter(item => !rowsWithErrors.has(item.row))
        .map(item => item.data);

      if (validEmployees.length === 0) {
        return res.status(400).json({
          message: "No valid rows to import",
          createdCount: 0,
          skippedCount: rowErrors.length,
          errors: rowErrors,
        });
      }

      const createdEmployees = await db.insert(employeeMaster).values(validEmployees as any).returning();
      res.status(201).json({
        message: rowErrors.length > 0 ? "Imported with skipped rows" : "Imported successfully",
        createdCount: createdEmployees.length,
        skippedCount: rowErrors.length,
        createdEmployees,
        skippedRows: rowErrors,
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // ========================================
  // RENTAL MANPOWER ROUTES
  // ========================================

  app.get("/api/rental-manpower", async (req: Request, res: Response) => {
    try {
      const rentalEmployees = await db.select().from(rentalManpower).orderBy(rentalManpower.employeeNumber);
      res.json(rentalEmployees);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/rental-manpower/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rental employee ID" });
      }
      const employee = await db.select().from(rentalManpower).where(eq(rentalManpower.id, id));
      if (employee.length === 0) {
        return res.status(404).json({ message: "Rental employee not found" });
      }
      res.json(employee[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/rental-manpower", async (req: Request, res: Response) => {
    try {
      const employeeData = insertRentalManpowerSchema.parse(req.body);
      const [employee] = await db.insert(rentalManpower).values(employeeData as any).returning();
      res.status(201).json(employee);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/rental-manpower/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rental employee ID" });
      }
      const employeeData = insertRentalManpowerSchema.partial().parse(req.body);
      const [updatedEmployee] = await db
        .update(rentalManpower)
        .set({ ...employeeData, updatedAt: new Date() } as any)
        .where(eq(rentalManpower.id, id))
        .returning();
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Rental employee not found" });
      }
      res.json(updatedEmployee);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/rental-manpower/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid rental employee ID" });
      }
      await db.delete(rentalManpower).where(eq(rentalManpower.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Bulk import rental manpower
  app.post("/api/rental-manpower/bulk-upload", async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!Array.isArray(csvData)) {
        return res.status(400).json({ message: "csvData must be an array" });
      }

      // Fetch all vendors to map vendorCode to vendorId
      const allVendors = await db.select().from(vendorMaster);
      const vendorMap = new Map(allVendors.map((v) => [String(v.vendorCode).trim(), v.id]));

      const employees: any[] = [];
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const vendorCode = row.vendorCode != null ? String(row.vendorCode).trim() : "";
        if (!vendorCode) {
          return res.status(400).json({
            message: `Row ${i + 1}: vendorCode is required. Add a vendorCode column or ensure it has a value.`,
          });
        }
        const vendorId = vendorMap.get(vendorCode);
        if (vendorId == null) {
          const validCodes = Array.from(vendorMap.keys()).slice(0, 10).join(", ");
          return res.status(400).json({
            message: `Row ${i + 1}: vendorCode "${vendorCode}" not found. Ensure the vendor exists in Vendor Master. Valid codes include: ${validCodes}${vendorMap.size > 10 ? "..." : ""}`,
          });
        }
        const mappedRow = { ...row, vendorId };
        employees.push(insertRentalManpowerSchema.parse(mappedRow));
      }

      const createdEmployees = await db.insert(rentalManpower).values(employees as any).returning();
      res.status(201).json(createdEmployees);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get all manpower type resources for the mapping dialog
  app.get("/api/resources/manpower/all", async (req: Request, res: Response) => {
    try {
      const manpowerResources = await db
        .select()
        .from(resources)
        .where(eq(resources.type, "manpower"));
      res.json(manpowerResources);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/resources/rental_manpower/all", async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(resources)
        .where(eq(resources.type, "rental_manpower"));
      res.json(rows);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/resources/rental_equipment/all", async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(resources)
        .where(eq(resources.type, "rental_equipment"));
      res.json(rows);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get resource mapping for an employee
  app.get("/api/employee/:id/resource-mapping", async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      const mapping = await db
        .select()
        .from(employeeResourceMappings)
        .where(eq(employeeResourceMappings.employeeId, employeeId));

      if (mapping.length === 0) {
        return res.json(null);
      }

      res.json(mapping[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create or update resource mapping for an employee (one-to-one)
  app.post("/api/employee/:id/map-resource", async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      const mappingData = insertEmployeeResourceMappingSchema.parse({
        employeeId,
        resourceId: req.body.resourceId,
      });

      // Check if employee exists
      const employee = await db
        .select()
        .from(employeeMaster)
        .where(eq(employeeMaster.id, employeeId));

      if (employee.length === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check if resource exists
      const resource = await db
        .select()
        .from(resources)
        .where(eq(resources.id, (mappingData as any).resourceId));

      if (resource.length === 0) {
        return res.status(404).json({ message: "Resource not found" });
      }

      // Check if resource is of type manpower
      if (resource[0].type !== "manpower") {
        return res.status(400).json({ message: "Resource must be of type 'manpower'" });
      }

      // Check if mapping already exists for this employee
      const existingMapping = await db
        .select()
        .from(employeeResourceMappings)
        .where(eq(employeeResourceMappings.employeeId, employeeId));

      if (existingMapping.length > 0) {
        // Update existing mapping
        const updatedMapping = await db
          .update(employeeResourceMappings)
          .set({
            resourceId: (mappingData as any).resourceId,
            updatedAt: new Date(),
          })
          .where(eq(employeeResourceMappings.employeeId, employeeId))
          .returning();
        return res.json(updatedMapping[0]);
      }

      // Create new mapping
      const newMapping = await db
        .insert(employeeResourceMappings)
        .values(mappingData as any)
        .returning();
      res.status(201).json(newMapping[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Delete resource mapping for an employee
  app.delete("/api/employee/:id/resource-mapping", async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }

      const result = await db
        .delete(employeeResourceMappings)
        .where(eq(employeeResourceMappings.employeeId, employeeId))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Mapping not found" });
      }

      res.json({ message: "Mapping deleted successfully", deletedMapping: result[0] });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Rental manpower ↔ rental_manpower resource mapping (one-to-one)
  app.get("/api/rental-manpower/:id/resource-mapping", async (req: Request, res: Response) => {
    try {
      const rentalId = parseInt(req.params.id);
      if (isNaN(rentalId)) {
        return res.status(400).json({ message: "Invalid rental manpower ID" });
      }
      const mapping = await db
        .select()
        .from(rentalManpowerResourceMappings)
        .where(eq(rentalManpowerResourceMappings.rentalManpowerId, rentalId));
      if (mapping.length === 0) {
        return res.json(null);
      }
      res.json(mapping[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/rental-manpower/:id/map-resource", async (req: Request, res: Response) => {
    try {
      const rentalId = parseInt(req.params.id);
      if (isNaN(rentalId)) {
        return res.status(400).json({ message: "Invalid rental manpower ID" });
      }
      const mappingData = insertRentalManpowerResourceMappingSchema.parse({
        rentalManpowerId: rentalId,
        resourceId: req.body.resourceId,
      });
      const [rentalRow] = await db.select().from(rentalManpower).where(eq(rentalManpower.id, rentalId));
      if (!rentalRow) {
        return res.status(404).json({ message: "Rental manpower record not found" });
      }
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, (mappingData as { resourceId: number }).resourceId));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      if (resource.type !== "rental_manpower") {
        return res.status(400).json({ message: "Resource must be of type 'rental_manpower'" });
      }
      const existingMapping = await db
        .select()
        .from(rentalManpowerResourceMappings)
        .where(eq(rentalManpowerResourceMappings.rentalManpowerId, rentalId));
      if (existingMapping.length > 0) {
        const [updated] = await db
          .update(rentalManpowerResourceMappings)
          .set({
            resourceId: (mappingData as { resourceId: number }).resourceId,
            updatedAt: new Date(),
          })
          .where(eq(rentalManpowerResourceMappings.rentalManpowerId, rentalId))
          .returning();
        return res.json(updated);
      }
      const [created] = await db
        .insert(rentalManpowerResourceMappings)
        .values(mappingData as any)
        .returning();
      res.status(201).json(created);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/rental-manpower/:id/resource-mapping", async (req: Request, res: Response) => {
    try {
      const rentalId = parseInt(req.params.id);
      if (isNaN(rentalId)) {
        return res.status(400).json({ message: "Invalid rental manpower ID" });
      }
      const result = await db
        .delete(rentalManpowerResourceMappings)
        .where(eq(rentalManpowerResourceMappings.rentalManpowerId, rentalId))
        .returning();
      if (result.length === 0) {
        return res.status(404).json({ message: "Mapping not found" });
      }
      res.json({ message: "Mapping deleted successfully", deletedMapping: result[0] });
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== EQUIPMENT MASTER ENDPOINTS =====

  app.get("/api/equipment-masters", async (req: Request, res: Response) => {
    try {
      const equipment = await db.select().from(equipmentMaster);
      res.json(equipment);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/equipment-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid equipment ID" });
      }

      const equipment = await db
        .select()
        .from(equipmentMaster)
        .where(eq(equipmentMaster.id, id));

      if (equipment.length === 0) {
        return res.status(404).json({ message: "Equipment not found" });
      }

      res.json(equipment[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/equipment-masters", async (req: Request, res: Response) => {
    try {
      const equipmentData = insertEquipmentMasterSchema.parse(req.body);
      const equipment = await db
        .insert(equipmentMaster)
        .values(equipmentData)
        .returning();
      res.status(201).json(equipment[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/equipment-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid equipment ID" });
      }

      const equipmentData = insertEquipmentMasterSchema.partial().parse(req.body);
      const equipment = await db
        .update(equipmentMaster)
        .set(equipmentData)
        .where(eq(equipmentMaster.id, id))
        .returning();

      if (equipment.length === 0) {
        return res.status(404).json({ message: "Equipment not found" });
      }

      res.json(equipment[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/equipment-masters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid equipment ID" });
      }

      const result = await db
        .delete(equipmentMaster)
        .where(eq(equipmentMaster.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Equipment not found" });
      }

      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/equipment-masters/bulk-upload", async (req: Request, res: Response) => {
    try {
      const { csvData } = req.body;
      if (!Array.isArray(csvData)) {
        return res.status(400).json({ message: "csvData must be an array" });
      }

      const equipmentList = csvData.map((row: any) =>
        insertEquipmentMasterSchema.parse(row)
      );
      const createdEquipment = await db
        .insert(equipmentMaster)
        .values(equipmentList)
        .returning();
      res.status(201).json(createdEquipment);
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== EQUIPMENT MANUFACTURERS (OEM) ENDPOINTS =====
  app.get("/api/equipment-manufacturers", async (req: Request, res: Response) => {
    try {
      const list = await db.select().from(equipmentManufacturers).orderBy(equipmentManufacturers.name);
      res.json(list);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/equipment-manufacturers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const [row] = await db.select().from(equipmentManufacturers).where(eq(equipmentManufacturers.id, id));
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/equipment-manufacturers", async (req: Request, res: Response) => {
    try {
      const data = insertEquipmentManufacturerSchema.parse(req.body);
      const [created] = await db.insert(equipmentManufacturers).values(data as any).returning();
      res.status(201).json(created);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/equipment-manufacturers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertEquipmentManufacturerSchema.partial().parse(req.body);
      const [updated] = await db.update(equipmentManufacturers).set({ ...data, updatedAt: new Date() } as any).where(eq(equipmentManufacturers.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/equipment-manufacturers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(equipmentManufacturers).where(eq(equipmentManufacturers.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== EQUIPMENT TYPES ENDPOINTS =====
  app.get("/api/equipment-types", async (req: Request, res: Response) => {
    try {
      const list = await db.select().from(equipmentTypes).orderBy(equipmentTypes.name);
      res.json(list);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/equipment-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const [row] = await db.select().from(equipmentTypes).where(eq(equipmentTypes.id, id));
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/equipment-types", async (req: Request, res: Response) => {
    try {
      const data = insertEquipmentTypeSchema.parse(req.body);
      const [created] = await db.insert(equipmentTypes).values(data as any).returning();
      res.status(201).json(created);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/equipment-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertEquipmentTypeSchema.partial().parse(req.body);
      const [updated] = await db.update(equipmentTypes).set({ ...data, updatedAt: new Date() } as any).where(eq(equipmentTypes.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/equipment-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(equipmentTypes).where(eq(equipmentTypes.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== RENTAL EQUIPMENT ENDPOINTS =====
  app.get("/api/rental-equipment", async (req: Request, res: Response) => {
    try {
      const list = await db.select().from(rentalEquipment).orderBy(rentalEquipment.equipmentNumber);
      res.json(list);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/rental-equipment/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const [row] = await db.select().from(rentalEquipment).where(eq(rentalEquipment.id, id));
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/rental-equipment", async (req: Request, res: Response) => {
    try {
      const data = insertRentalEquipmentSchema.parse(req.body);
      const [created] = await db.insert(rentalEquipment).values(data as any).returning();
      res.status(201).json(created);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/rental-equipment/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertRentalEquipmentSchema.partial().parse(req.body);
      const [updated] = await db.update(rentalEquipment).set({ ...data, updatedAt: new Date() } as any).where(eq(rentalEquipment.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/rental-equipment/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.delete(rentalEquipment).where(eq(rentalEquipment.id, id));
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/rental-equipment/:id/resource-mapping", async (req: Request, res: Response) => {
    try {
      const rentalId = parseInt(req.params.id);
      if (isNaN(rentalId)) {
        return res.status(400).json({ message: "Invalid rental equipment ID" });
      }
      const mapping = await db
        .select()
        .from(rentalEquipmentResourceMappings)
        .where(eq(rentalEquipmentResourceMappings.rentalEquipmentId, rentalId));
      if (mapping.length === 0) {
        return res.json(null);
      }
      res.json(mapping[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/rental-equipment/:id/map-resource", async (req: Request, res: Response) => {
    try {
      const rentalId = parseInt(req.params.id);
      if (isNaN(rentalId)) {
        return res.status(400).json({ message: "Invalid rental equipment ID" });
      }
      const mappingData = insertRentalEquipmentResourceMappingSchema.parse({
        rentalEquipmentId: rentalId,
        resourceId: req.body.resourceId,
      });
      const [rentalRow] = await db.select().from(rentalEquipment).where(eq(rentalEquipment.id, rentalId));
      if (!rentalRow) {
        return res.status(404).json({ message: "Rental equipment not found" });
      }
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, (mappingData as { resourceId: number }).resourceId));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      if (resource.type !== "rental_equipment") {
        return res.status(400).json({ message: "Resource must be of type 'rental_equipment'" });
      }
      const existingMapping = await db
        .select()
        .from(rentalEquipmentResourceMappings)
        .where(eq(rentalEquipmentResourceMappings.rentalEquipmentId, rentalId));
      if (existingMapping.length > 0) {
        const [updated] = await db
          .update(rentalEquipmentResourceMappings)
          .set({
            resourceId: (mappingData as { resourceId: number }).resourceId,
            updatedAt: new Date(),
          })
          .where(eq(rentalEquipmentResourceMappings.rentalEquipmentId, rentalId))
          .returning();
        return res.json(updated);
      }
      const [created] = await db
        .insert(rentalEquipmentResourceMappings)
        .values(mappingData as any)
        .returning();
      res.status(201).json(created);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/rental-equipment/:id/resource-mapping", async (req: Request, res: Response) => {
    try {
      const rentalId = parseInt(req.params.id);
      if (isNaN(rentalId)) {
        return res.status(400).json({ message: "Invalid rental equipment ID" });
      }
      const result = await db
        .delete(rentalEquipmentResourceMappings)
        .where(eq(rentalEquipmentResourceMappings.rentalEquipmentId, rentalId))
        .returning();
      if (result.length === 0) {
        return res.status(404).json({ message: "Mapping not found" });
      }
      res.json({ message: "Mapping deleted successfully", deletedMapping: result[0] });
    } catch (err) {
      handleError(err, res);
    }
  });

  // ===== EQUIPMENT RESOURCE MAPPING ENDPOINTS =====

  // Get all equipment type resources for the mapping dialog
  app.get("/api/resources/equipment/all", async (req: Request, res: Response) => {
    try {
      const equipmentResources = await db
        .select()
        .from(resources)
        .where(eq(resources.type, "equipment"));
      res.json(equipmentResources);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get resource mapping for equipment
  app.get("/api/equipment/:id/resource-mapping", async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);
      if (isNaN(equipmentId)) {
        return res.status(400).json({ message: "Invalid equipment ID" });
      }

      const mapping = await db
        .select()
        .from(equipmentResourceMappings)
        .where(eq(equipmentResourceMappings.equipmentId, equipmentId));

      if (mapping.length === 0) {
        return res.json(null);
      }

      res.json(mapping[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create or update resource mapping for equipment (one-to-one)
  app.post("/api/equipment/:id/map-resource", async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);
      if (isNaN(equipmentId)) {
        return res.status(400).json({ message: "Invalid equipment ID" });
      }

      const mappingData = insertEquipmentResourceMappingSchema.parse({
        equipmentId,
        resourceId: req.body.resourceId,
      });

      // Check if equipment exists
      const equipment = await db
        .select()
        .from(equipmentMaster)
        .where(eq(equipmentMaster.id, equipmentId));

      if (equipment.length === 0) {
        return res.status(404).json({ message: "Equipment not found" });
      }

      // Check if resource exists
      const resource = await db
        .select()
        .from(resources)
        .where(eq(resources.id, (mappingData as any).resourceId));

      if (resource.length === 0) {
        return res.status(404).json({ message: "Resource not found" });
      }

      // Check if resource is of type equipment
      if (resource[0].type !== "equipment") {
        return res.status(400).json({ message: "Resource must be of type 'equipment'" });
      }

      // Check if mapping already exists for this equipment
      const existingMapping = await db
        .select()
        .from(equipmentResourceMappings)
        .where(eq(equipmentResourceMappings.equipmentId, equipmentId));

      if (existingMapping.length > 0) {
        // Update existing mapping
        const updatedMapping = await db
          .update(equipmentResourceMappings)
          .set({
            resourceId: (mappingData as any).resourceId,
            updatedAt: new Date(),
          })
          .where(eq(equipmentResourceMappings.equipmentId, equipmentId))
          .returning();
        return res.json(updatedMapping[0]);
      }

      // Create new mapping
      const newMapping = await db
        .insert(equipmentResourceMappings)
        .values(mappingData as any)
        .returning();
      res.status(201).json(newMapping[0]);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Delete resource mapping for equipment
  app.delete("/api/equipment/:id/resource-mapping", async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);
      if (isNaN(equipmentId)) {
        return res.status(400).json({ message: "Invalid equipment ID" });
      }

      const result = await db
        .delete(equipmentResourceMappings)
        .where(eq(equipmentResourceMappings.equipmentId, equipmentId))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Mapping not found" });
      }

      res.json({ message: "Mapping deleted successfully", deletedMapping: result[0] });
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
