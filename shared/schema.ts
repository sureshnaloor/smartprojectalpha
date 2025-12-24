import { pgTable, text, serial, integer, numeric, date, timestamp, boolean, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Projects Table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  budget: numeric("budget", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  projectType: text("project_type"), // Highway, Infrastructure, Power, Commercial, Petrochem, Oil&Gas
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// WBS Table - Updated with revised structure
export const wbsItems = pgTable("wbs_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  name: text("name").notNull(),
  description: text("description"),
  level: integer("level").notNull(), // 1, 2, 3, etc.
  code: text("code").notNull(), // e.g. 1, 1.1, 1.1.1
  type: text("type").notNull(), // Summary, WorkPackage, Activity (removed Task)
  budgetedCost: numeric("budgeted_cost", { precision: 12, scale: 2 }).notNull(),
  actualCost: numeric("actual_cost", { precision: 12, scale: 2 }).default("0"),
  percentComplete: numeric("percent_complete", { precision: 5, scale: 2 }).default("0"),
  startDate: date("start_date"),  // Now optional - only for Activities
  endDate: date("end_date"),      // Now optional - only for Activities
  duration: integer("duration"),  // Now optional - only for Activities
  actualStartDate: date("actual_start_date"),
  actualEndDate: date("actual_end_date"),
  isTopLevel: boolean("is_top_level").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dependencies Table
export const dependencies = pgTable("dependencies", {
  id: serial("id").primaryKey(),
  predecessorId: integer("predecessor_id").notNull().references(() => wbsItems.id, { onDelete: "cascade" }),
  successorId: integer("successor_id").notNull().references(() => wbsItems.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // FS (Finish-to-Start), SS (Start-to-Start), etc.
  lag: integer("lag").default(0), // in days
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cost Entries Table
export const costEntries = pgTable("cost_entries", {
  id: serial("id").primaryKey(),
  wbsItemId: integer("wbs_item_id").notNull().references(() => wbsItems.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  entryDate: date("entry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activities Table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  unitOfMeasure: text("unit_of_measure").notNull(),
  unitRate: numeric("unit_rate", { precision: 12, scale: 2 }).notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Resources Table
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // manpower, equipment, material
  unitOfMeasure: text("unit_of_measure").notNull(), // hours, days, pieces, etc.
  unitRate: numeric("unit_rate", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  availability: numeric("availability", { precision: 5, scale: 2 }).default("100"), // percentage
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks Table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id, { onDelete: "cascade" }), // Made nullable
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // Duration in minutes
  status: text("status").default("pending").notNull(), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Task Resources Table (for the many-to-many relationship between tasks and resources)
export const taskResources = pgTable("task_resources", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  resourceId: integer("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project Activities Table
export const projectActivities = pgTable("project_activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  globalActivityId: integer("global_activity_id").references(() => activities.id, { onDelete: "set null" }), // nullable for project-specific activities
  name: text("name").notNull(),
  description: text("description"),
  unitOfMeasure: text("unit_of_measure").notNull(),
  unitRate: numeric("unit_rate", { precision: 12, scale: 2 }).notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Collaboration Threads Table
export const collaborationThreads = pgTable("collaboration_threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // issue, info, announcement, awards
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }), // null for global threads
  createdById: text("created_by_id").notNull(),
  createdByName: text("created_by_name").notNull(),
  isClosed: boolean("is_closed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Collaboration Messages Table
export const collaborationMessages = pgTable("collaboration_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => collaborationThreads.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project Collaboration Threads Table (project-specific)
export const projectCollaborationThreads = pgTable("project_collaboration_threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // issue, info, announcement, awards
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }), // required for project threads
  createdById: text("created_by_id").notNull(),
  createdByName: text("created_by_name").notNull(),
  isClosed: boolean("is_closed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project Collaboration Messages Table (project-specific)
export const projectCollaborationMessages = pgTable("project_collaboration_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => projectCollaborationThreads.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Insert Schemas
export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, createdAt: true } as any)
  .extend({
    budget: z.string().or(z.number()).transform(val => val.toString()),
    currency: z.enum(["USD", "EUR", "SAR"]).default("USD"),
    projectType: z.enum(["Highway", "Infrastructure", "Power", "Commercial", "Petrochem", "Oil&Gas"]).optional().nullable(),
    startDate: z.date().or(z.string()).transform(val => {
      if (typeof val === 'string') {
        return new Date(val).toISOString().split('T')[0];
      }
      return val.toISOString().split('T')[0];
    }),
    endDate: z.date().or(z.string()).transform(val => {
      if (typeof val === 'string') {
        return new Date(val).toISOString().split('T')[0];
      }
      return val.toISOString().split('T')[0];
    }),
  });

// Base WBS schema - a simpler version without all the refinements
const baseWbsSchema = createInsertSchema(wbsItems)
  .omit({ id: true, createdAt: true, actualCost: true, percentComplete: true, actualStartDate: true, actualEndDate: true } as any)
  .extend({
    budgetedCost: z.string().or(z.number()).transform(val => val.toString()),
    type: z.enum(["Summary", "WorkPackage", "Activity"]),
    startDate: z.date().or(z.string()).transform(val => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'string') {
        return new Date(val).toISOString().split('T')[0];
      }
      return val.toISOString().split('T')[0];
    }).optional(),
    endDate: z.date().or(z.string()).transform(val => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === 'string') {
        return new Date(val).toISOString().split('T')[0];
      }
      return val.toISOString().split('T')[0];
    }).optional(),
    duration: z.string().or(z.number()).transform(val => {
      if (val === undefined || val === null) return undefined;
      return typeof val === 'string' ? parseInt(val) : val;
    }).optional(),
  });

// Updated WBS schema with conditional validations
export const insertWbsItemSchema = baseWbsSchema
  .refine(
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
  )
  .refine(
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
  )
  .refine(
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
  )
  .refine(
    (data) => {
      // Summary and WorkPackage should not have dates
      if (data.type === "Summary" || data.type === "WorkPackage") {
        return data.startDate === undefined && data.endDate === undefined;
      }
      return true;
    },
    {
      message: "Summary and WorkPackage types cannot have dates",
      path: ["startDate"],
    }
  );

export const insertDependencySchema = createInsertSchema(dependencies).omit({ id: true, createdAt: true } as any);
export const insertCostEntrySchema = createInsertSchema(costEntries)
  .omit({ id: true, createdAt: true } as any)
  .extend({
    amount: z.string().or(z.number()).transform(val => val.toString()),
    entryDate: z.date().or(z.string()).transform(val => {
      if (typeof val === 'string') {
        return new Date(val).toISOString().split('T')[0];
      }
      return val.toISOString().split('T')[0];
    }),
  });

// Task schema
export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true, updatedAt: true } as any)
  .extend({
    duration: z.string().or(z.number()).transform(val => {
      return typeof val === 'string' ? parseInt(val) : val;
    }),
    status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  });

// Resource schema
export const insertResourceSchema = createInsertSchema(resources)
  .omit({ id: true, createdAt: true, updatedAt: true } as any)
  .extend({
    unitRate: z.string().or(z.number()).transform(val => val.toString()),
    availability: z.string().or(z.number()).transform(val => val.toString()).default("100"),
    type: z.enum(["manpower", "equipment", "material"]),
    currency: z.enum(["USD", "EUR", "SAR"]).default("USD"),
  });

// Task Resource schema
export const insertTaskResourceSchema = createInsertSchema(taskResources)
  .omit({ id: true, createdAt: true, updatedAt: true } as any)
  .extend({
    quantity: z.string().or(z.number()).transform(val => val.toString()),
  });

// Activity schema
export const insertActivitySchema = createInsertSchema(activities)
  .omit({ id: true, createdAt: true, updatedAt: true } as any)
  .extend({
    unitRate: z.string().or(z.number()).transform(val => val.toString()),
  });

// Project Activity schema
export const insertProjectActivitySchema = createInsertSchema(projectActivities)
  .omit({ id: true, createdAt: true, updatedAt: true } as any)
  .extend({
    unitRate: z.string().or(z.number()).transform(val => val.toString()),
    quantity: z.string().or(z.number()).transform(val => val.toString()),
  });

// Collaboration Thread schema
export const insertCollaborationThreadSchema = createInsertSchema(collaborationThreads)
  .omit({ id: true, createdAt: true, updatedAt: true } as any)
  .extend({
    type: z.enum(["issue", "info", "announcement", "awards"]),
    isClosed: z.boolean().default(false),
  });

// Collaboration Message schema
export const insertCollaborationMessageSchema = createInsertSchema(collaborationMessages)
  .omit({ id: true, createdAt: true } as any);

// Project Collaboration Thread schema
export const insertProjectCollaborationThreadSchema = createInsertSchema(projectCollaborationThreads)
  .omit({ id: true, createdAt: true, updatedAt: true } as any)
  .extend({
    type: z.enum(["issue", "info", "announcement", "awards"]),
    isClosed: z.boolean().default(false),
  });

// Project Collaboration Message schema
export const insertProjectCollaborationMessageSchema = createInsertSchema(projectCollaborationMessages)
  .omit({ id: true, createdAt: true } as any);


// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type WbsItem = typeof wbsItems.$inferSelect;
export type InsertWbsItem = z.infer<typeof insertWbsItemSchema>;

export type Dependency = typeof dependencies.$inferSelect;
export type InsertDependency = z.infer<typeof insertDependencySchema>;

export type CostEntry = typeof costEntries.$inferSelect;
export type InsertCostEntry = z.infer<typeof insertCostEntrySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type TaskResource = typeof taskResources.$inferSelect;
export type InsertTaskResource = z.infer<typeof insertTaskResourceSchema>;

export type ProjectActivity = typeof projectActivities.$inferSelect;
export type InsertProjectActivity = z.infer<typeof insertProjectActivitySchema>;

export type CollaborationThread = typeof collaborationThreads.$inferSelect;
export type InsertCollaborationThread = z.infer<typeof insertCollaborationThreadSchema>;

export type CollaborationMessage = typeof collaborationMessages.$inferSelect;
export type InsertCollaborationMessage = z.infer<typeof insertCollaborationMessageSchema>;

export type ProjectCollaborationThread = typeof projectCollaborationThreads.$inferSelect;
export type InsertProjectCollaborationThread = z.infer<typeof insertProjectCollaborationThreadSchema>;

export type ProjectCollaborationMessage = typeof projectCollaborationMessages.$inferSelect;
export type InsertProjectCollaborationMessage = z.infer<typeof insertProjectCollaborationMessageSchema>;



// Extended schemas for client-side validation
export const extendedInsertProjectSchema = insertProjectSchema.extend({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  budget: z.string().or(z.number()).transform(val => val.toString()),
  startDate: z.coerce.date().transform(val => val.toISOString().split('T')[0]),
  endDate: z.coerce.date().transform(val => val.toISOString().split('T')[0]),
  currency: z.enum(["USD", "EUR", "SAR"]).default("USD").describe("Project currency"),
});

// Extended validation for WBS Items - use the base schema for extension
export const extendedInsertWbsItemSchema = baseWbsSchema.extend({
  name: z.string().min(3, "WBS item name must be at least 3 characters"),
  duration: z.string().or(z.number()).transform(val => {
    if (val === undefined || val === null) return undefined;
    return typeof val === 'string' ? parseInt(val) : val;
  }).optional(),
})
  .refine(
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
  )
  .refine(
    (data) => {
      // Summary and WorkPackage should not have dates
      if (data.type === "Summary" || data.type === "WorkPackage") {
        return (
          data.startDate === undefined &&
          data.endDate === undefined &&
          data.duration === undefined
        );
      }
      return true;
    },
    {
      message: "Summary and WorkPackage types cannot have dates",
      path: ["startDate"],
    }
  );

export const updateWbsProgressSchema = z.object({
  id: z.number(),
  percentComplete: z.string().or(z.number()).transform(val => val.toString()),
  actualStartDate: z.date().optional(),
  actualEndDate: z.date().optional(),
});

export const importCostsSchema = z.object({
  wbsItemId: z.number(),
  amount: z.string().or(z.number()).transform(val => val.toString()),
  description: z.string().optional(),
  entryDate: z.date(),
});

export type UpdateWbsProgress = z.infer<typeof updateWbsProgressSchema>;
export type ImportCosts = z.infer<typeof importCostsSchema>;

// Extended schema for CSV import validation
export const csvImportSchema = z.array(
  z.object({
    wbsCode: z.string().min(1, "WBS code is required"),
    amount: z.string().or(z.number()).transform(val => val.toString()),
    description: z.string().optional(),
    entryDate: z.string().transform((val) => new Date(val).toISOString().split('T')[0]),
  })
);

export type CsvImportData = z.infer<typeof csvImportSchema>;

// Project Tasks Table
export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  globalTaskId: integer("global_task_id").references(() => tasks.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration"), // Duration in minutes
  status: text("status").default("pending").notNull(), // pending, in_progress, completed
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas
export const insertProjectTaskSchema = createInsertSchema(projectTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as any);

export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = z.infer<typeof insertProjectTaskSchema>;

// Project Resources Table
export const projectResources = pgTable("project_resources", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  globalResourceId: integer("global_resource_id").references(() => resources.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // manpower, equipment, material
  unitOfMeasure: text("unit_of_measure").notNull(),
  unitRate: numeric("unit_rate", { precision: 12, scale: 2 }).notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectResourceSchema = createInsertSchema(projectResources)
  .omit({ id: true, createdAt: true, updatedAt: true } as any)
  .extend({
    unitRate: z.string().or(z.number()).transform(val => val.toString()),
    quantity: z.string().or(z.number()).transform(val => val.toString()),
  });

export type ProjectResource = typeof projectResources.$inferSelect;
export type InsertProjectResource = z.infer<typeof insertProjectResourceSchema>;
