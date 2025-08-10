import { z } from "zod";

// Project schemas
export const insertProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().nullable().optional(),
  budget: z.coerce.string(),
  currency: z.enum(["USD", "EUR", "SAR"]).default("USD"),
  startDate: z.coerce.string(),
  endDate: z.coerce.string(),
});

// WBS schemas
export const insertWbsItemSchema = z.object({
  projectId: z.number(),
  parentId: z.number().nullable().optional(),
  name: z.string().min(1, "WBS item name is required"),
  description: z.string().nullable().optional(),
  level: z.number(),
  code: z.string(),
  type: z.enum(["Summary", "WorkPackage", "Activity"]),
  budgetedCost: z.coerce.string(),
  startDate: z.coerce.string().optional(),
  endDate: z.coerce.string().optional(),
  duration: z.coerce.number().optional(),
  isTopLevel: z.boolean().optional(),
}).refine(
  (data) => {
    // Summary and WorkPackage types must have budgetedCost
    if (data.type === "Summary" || data.type === "WorkPackage") {
      return data.budgetedCost !== undefined && parseFloat(data.budgetedCost) >= 0;
    }
    return true;
  },
  {
    message: "Summary and WorkPackage types must have a budget",
    path: ["budgetedCost"],
  }
).refine(
  (data) => {
    // Activity types should not have budgetedCost (or set to 0)
    if (data.type === "Activity") {
      return parseFloat(data.budgetedCost) === 0;
    }
    return true;
  },
  {
    message: "Activity types cannot have a budget",
    path: ["budgetedCost"],
  }
).refine(
  (data) => {
    // Activity types must have startDate, endDate and duration
    if (data.type === "Activity") {
      return (
        data.startDate !== undefined && 
        data.endDate !== undefined && 
        data.duration !== undefined && 
        data.duration > 0
      );
    }
    return true;
  },
  {
    message: "Activity types must have start date, end date, and duration",
    path: ["startDate"],
  }
).refine(
  (data) => {
    // Summary and WorkPackage should not have dates
    if (data.type === "Summary" || data.type === "WorkPackage") {
      return data.startDate === undefined && data.endDate === undefined;
    }
    return true;
  },
  {
    message: "Summary and WorkPackage types should not have dates",
    path: ["startDate"],
  }
);

// Dependency schemas
export const insertDependencySchema = z.object({
  type: z.string(),
  predecessorId: z.number(),
  successorId: z.number(),
  lag: z.number().nullable().optional(),
});

// Cost entry schemas
export const insertCostEntrySchema = z.object({
  wbsItemId: z.number(),
  amount: z.coerce.string(),
  description: z.string().nullable().optional(),
  entryDate: z.coerce.string(),
});

// Task schemas
export const insertTaskSchema = z.object({
  activityId: z.number(),
  name: z.string().min(1, "Task name is required"),
  description: z.string().nullable().optional(),
  duration: z.coerce.number(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
});

// Task Resource schemas
export const insertTaskResourceSchema = z.object({
  taskId: z.number(),
  resourceId: z.number(),
  quantity: z.coerce.string(),
});

// Resource schemas
export const insertResourceSchema = z.object({
  name: z.string().min(1, "Resource name is required"),
  description: z.string().nullable().optional(),
  type: z.enum(["manpower", "equipment", "material"]),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  unitRate: z.coerce.string(),
  currency: z.enum(["USD", "EUR", "SAR"]).default("USD"),
  availability: z.coerce.string().default("100"),
  remarks: z.string().nullable().optional(),
});

// Activity schemas
export const insertActivitySchema = z.object({
  name: z.string().min(1, "Activity name is required"),
  description: z.string().nullable().optional(),
  unitOfMeasure: z.string().optional(),
  unitRate: z.coerce.string(),
  currency: z.enum(["USD", "EUR", "GBP", "SAR"]).default("USD"),
  remarks: z.string().nullable().optional(),
});

// Export types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertWbsItem = z.infer<typeof insertWbsItemSchema>;
export type InsertDependency = z.infer<typeof insertDependencySchema>;
export type InsertCostEntry = z.infer<typeof insertCostEntrySchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertTaskResource = z.infer<typeof insertTaskResourceSchema>;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Extended schemas for validation
export const extendedInsertProjectSchema = insertProjectSchema.extend({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  budget: z.coerce.number().positive("Budget must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  currency: z.enum(["USD", "EUR", "SAR"]).default("USD").describe("Project currency"),
});

export const extendedInsertWbsItemSchema = z.object({
  projectId: z.number(),
  parentId: z.number().nullable().optional(),
  name: z.string().min(3, "WBS item name must be at least 3 characters"),
  description: z.string().nullable().optional(),
  level: z.number(),
  code: z.string(),
  type: z.enum(["Summary", "WorkPackage", "Activity"]),
  budgetedCost: z.coerce.string(),
  startDate: z.coerce.string().optional(),
  endDate: z.coerce.string().optional(),
  duration: z.coerce.number().nonnegative().optional(),
  isTopLevel: z.boolean().optional(),
}).refine(
  (data: any) => {
    // Activity types must have startDate, endDate and duration
    if (data.type === "Activity") {
      return (
        data.startDate !== undefined &&
        data.endDate !== undefined &&
        data.duration !== undefined &&
        data.duration > 0
      );
    }
    return true;
  },
  {
    message: "Activity types must have start date, end date, and duration",
    path: ["startDate"],
  }
)
.refine(
  (data: any) => {
    // Summary and WorkPackage should not have dates
    if (data.type === "Summary" || data.type === "WorkPackage") {
      return data.startDate === undefined && data.endDate === undefined;
    }
    return true;
  },
  {
    message: "Summary and WorkPackage types should not have dates",
    path: ["startDate"],
  }
);

// WBS Progress Update Schema
export const updateWbsProgressSchema = z.object({
  id: z.number(),
  percentComplete: z.number().min(0).max(100),
  actualCost: z.number().min(0).optional(),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
});

// Import schemas
export const importCostsSchema = z.object({
  wbsItemId: z.number(),
  costs: z.array(z.object({
    description: z.string(),
    amount: z.number().positive(),
    entryDate: z.string(),
  })),
});

// CSV Import Schema
export const csvImportSchema = z.object({
  projectId: z.number(),
  data: z.array(z.record(z.string())),
  type: z.enum(["wbs", "tasks", "resources", "costs"]),
});

export type UpdateWbsProgress = z.infer<typeof updateWbsProgressSchema>;
export type ImportCosts = z.infer<typeof importCostsSchema>;
export type CsvImportData = z.infer<typeof csvImportSchema>;
