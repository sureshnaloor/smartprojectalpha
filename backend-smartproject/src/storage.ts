import {
  type Project,
  type InsertProject,
  type WbsItem,
  type InsertWbsItem,
  type Dependency,
  type InsertDependency,
  type CostEntry,
  type InsertCostEntry,
  type Task,
  type InsertTask,
  type Activity,
  type InsertActivity,
  type Resource,
  type InsertResource,
  type TaskResource,
  type InsertTaskResource,
  type ProjectActivity,
  type InsertProjectActivity,
  type ProjectTask,
  type InsertProjectTask,
  type ProjectResource,
  type InsertProjectResource,
  type DailyProgress,
  type InsertDailyProgress,
  type ResourcePlan,
  type InsertResourcePlan,
  type RiskRegister,
  type InsertRiskRegister,
  type LessonLearntRegister,
  type InsertLessonLearntRegister,
  type DirectManpowerPosition,
  type InsertDirectManpowerPosition,
  type DirectManpowerEntry,
  type InsertDirectManpowerEntry,
  type IndirectManpowerPosition,
  type InsertIndirectManpowerPosition,
  type IndirectManpowerEntry,
  type InsertIndirectManpowerEntry,
  type PlannedActivity,
  type InsertPlannedActivity,
  type PlannedActivityTask,
  type InsertPlannedActivityTask
} from "./schema";
import { db } from "./db";
import { and, eq, or, inArray, sql, gte, lte } from "drizzle-orm";
import { projects, wbsItems, dependencies, costEntries, tasks, activities, resources, taskResources, projectActivities, projectTasks, projectResources, dailyProgress, resourcePlans, riskRegister, lessonLearntRegister, directManpowerPositions, directManpowerEntries, indirectManpowerPositions, indirectManpowerEntries, plannedActivities, plannedActivityTasks } from "./schema";

// Storage interface
export interface IStorage {
  // Project methods
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: Omit<Project, "id" | "createdAt">): Promise<Project>;
  updateProject(id: number, project: Partial<Omit<Project, "id" | "createdAt">>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // WBS methods
  getWbsItems(projectId: number): Promise<WbsItem[]>;
  getWbsItem(id: number): Promise<WbsItem | undefined>;
  createWbsItem(wbsItem: Omit<WbsItem, "id" | "createdAt">): Promise<WbsItem>;
  updateWbsItem(id: number, wbsItem: Partial<Omit<WbsItem, "id" | "createdAt">>): Promise<WbsItem | undefined>;
  deleteWbsItem(id: number): Promise<void>;

  // Dependency methods
  getDependencies(projectId: number): Promise<Dependency[]>;
  getDependency(id: number): Promise<Dependency | undefined>;
  createDependency(dependency: Omit<Dependency, "id" | "createdAt">): Promise<Dependency>;
  updateDependency(id: number, dependency: Partial<Omit<Dependency, "id" | "createdAt">>): Promise<Dependency | undefined>;
  deleteDependency(id: number): Promise<void>;

  // Cost entry methods
  getCostEntries(wbsItemId: number): Promise<CostEntry[]>;
  getCostEntry(id: number): Promise<CostEntry | undefined>;
  createCostEntry(costEntry: Omit<CostEntry, "id" | "createdAt">): Promise<CostEntry>;
  updateCostEntry(id: number, costEntry: Partial<Omit<CostEntry, "id" | "createdAt">>): Promise<CostEntry | undefined>;
  deleteCostEntry(id: number): Promise<void>;

  // Task methods
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: number, data: InsertTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;

  // Activity methods
  getActivities(): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(data: InsertActivity): Promise<Activity>;
  updateActivity(id: number, data: InsertActivity): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<void>;

  // Resource methods
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(data: InsertResource): Promise<Resource>;
  updateResource(id: number, data: InsertResource): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<void>;

  // Task Resource methods
  getTaskResources(taskId: number): Promise<TaskResource[]>;
  getTaskResource(id: number): Promise<TaskResource | undefined>;
  createTaskResource(data: InsertTaskResource): Promise<TaskResource>;
  updateTaskResource(id: number, data: InsertTaskResource): Promise<TaskResource | undefined>;
  deleteTaskResource(id: number): Promise<void>;

  // Project Activity methods
  getProjectActivities(projectId: number): Promise<ProjectActivity[]>;
  getProjectActivity(id: number): Promise<ProjectActivity | undefined>;
  createProjectActivity(data: InsertProjectActivity): Promise<ProjectActivity>;
  updateProjectActivity(id: number, data: InsertProjectActivity): Promise<ProjectActivity | undefined>;
  deleteProjectActivity(id: number): Promise<void>;

  // Project Task methods
  getProjectTasks(projectId: number): Promise<ProjectTask[]>;
  getProjectTask(id: number): Promise<ProjectTask | undefined>;
  createProjectTask(data: InsertProjectTask): Promise<ProjectTask>;
  updateProjectTask(id: number, data: InsertProjectTask): Promise<ProjectTask | undefined>;
  deleteProjectTask(id: number): Promise<void>;

  // Resource Plan methods
  getResourcePlans(projectId: number): Promise<ResourcePlan[]>;
  getResourcePlan(id: number): Promise<ResourcePlan | undefined>;
  createResourcePlan(data: InsertResourcePlan): Promise<ResourcePlan>;
  createResourcePlanBulk(data: InsertResourcePlan[]): Promise<ResourcePlan[]>;
  updateResourcePlan(id: number, data: Partial<InsertResourcePlan>): Promise<ResourcePlan | undefined>;
  deleteResourcePlan(id: number): Promise<void>;

  // Project Resource methods
  getProjectResources(projectId: number): Promise<ProjectResource[]>;
  getProjectResource(id: number): Promise<ProjectResource | undefined>;
  createProjectResource(data: InsertProjectResource): Promise<ProjectResource>;
  updateProjectResource(id: number, data: InsertProjectResource): Promise<ProjectResource | undefined>;
  deleteProjectResource(id: number): Promise<void>;

  // Daily Progress methods
  getDailyProgress(projectId: number): Promise<DailyProgress[]>;
  getDailyProgressEntry(id: number): Promise<DailyProgress | undefined>;
  createDailyProgress(data: InsertDailyProgress): Promise<DailyProgress>;
  createDailyProgressBulk(data: InsertDailyProgress[]): Promise<DailyProgress[]>;
  updateDailyProgress(id: number, data: Partial<InsertDailyProgress>): Promise<DailyProgress | undefined>;
  deleteDailyProgress(id: number): Promise<void>;

  // Risk Register methods
  getRiskRegisters(projectId: number): Promise<RiskRegister[]>;
  getRiskRegister(id: number): Promise<RiskRegister | undefined>;
  createRiskRegister(data: InsertRiskRegister): Promise<RiskRegister>;
  updateRiskRegister(id: number, data: Partial<InsertRiskRegister>): Promise<RiskRegister | undefined>;
  deleteRiskRegister(id: number): Promise<void>;

  // Lesson Learnt Register methods
  getLessonLearntRegisters(projectId: number): Promise<LessonLearntRegister[]>;
  getLessonLearntRegister(id: number): Promise<LessonLearntRegister | undefined>;
  createLessonLearntRegister(data: InsertLessonLearntRegister): Promise<LessonLearntRegister>;
  updateLessonLearntRegister(id: number, data: Partial<InsertLessonLearntRegister>): Promise<LessonLearntRegister | undefined>;
  deleteLessonLearntRegister(id: number): Promise<void>;

  // Direct Manpower Position methods
  getDirectManpowerPositions(projectId: number): Promise<DirectManpowerPosition[]>;
  getDirectManpowerPosition(id: number): Promise<DirectManpowerPosition | undefined>;
  createDirectManpowerPosition(data: InsertDirectManpowerPosition): Promise<DirectManpowerPosition>;
  updateDirectManpowerPosition(id: number, data: Partial<InsertDirectManpowerPosition>): Promise<DirectManpowerPosition | undefined>;
  deleteDirectManpowerPosition(id: number): Promise<void>;
  updateDirectManpowerPositions(projectId: number, positions: InsertDirectManpowerPosition[]): Promise<DirectManpowerPosition[]>;

  // Direct Manpower Entry methods
  getDirectManpowerEntries(projectId: number): Promise<DirectManpowerEntry[]>;
  getDirectManpowerEntry(id: number): Promise<DirectManpowerEntry | undefined>;
  createDirectManpowerEntry(data: InsertDirectManpowerEntry): Promise<DirectManpowerEntry>;
  updateDirectManpowerEntry(id: number, data: Partial<InsertDirectManpowerEntry>): Promise<DirectManpowerEntry | undefined>;
  deleteDirectManpowerEntry(id: number): Promise<void>;

  // Indirect Manpower Position methods
  getIndirectManpowerPositions(projectId: number): Promise<IndirectManpowerPosition[]>;
  getIndirectManpowerPosition(id: number): Promise<IndirectManpowerPosition | undefined>;
  createIndirectManpowerPosition(data: InsertIndirectManpowerPosition): Promise<IndirectManpowerPosition>;
  updateIndirectManpowerPosition(id: number, data: Partial<InsertIndirectManpowerPosition>): Promise<IndirectManpowerPosition | undefined>;
  deleteIndirectManpowerPosition(id: number): Promise<void>;
  updateIndirectManpowerPositions(projectId: number, positions: InsertIndirectManpowerPosition[]): Promise<IndirectManpowerPosition[]>;

  // Indirect Manpower Entry methods
  getIndirectManpowerEntries(projectId: number): Promise<IndirectManpowerEntry[]>;
  getIndirectManpowerEntry(id: number): Promise<IndirectManpowerEntry | undefined>;
  createIndirectManpowerEntry(data: InsertIndirectManpowerEntry): Promise<IndirectManpowerEntry>;
  updateIndirectManpowerEntry(id: number, data: Partial<InsertIndirectManpowerEntry>): Promise<IndirectManpowerEntry | undefined>;
  deleteIndirectManpowerEntry(id: number): Promise<void>;

  // Planned Activity methods
  getPlannedActivities(projectId: number, startDate?: string, endDate?: string): Promise<PlannedActivity[]>;
  getPlannedActivity(id: number): Promise<PlannedActivity | undefined>;
  createPlannedActivity(data: InsertPlannedActivity): Promise<PlannedActivity>;
  updatePlannedActivity(id: number, data: Partial<InsertPlannedActivity>): Promise<PlannedActivity | undefined>;
  deletePlannedActivity(id: number): Promise<void>;

  // Planned Activity Task methods
  getPlannedActivityTasks(activityId: number): Promise<PlannedActivityTask[]>;
  getPlannedActivityTask(id: number): Promise<PlannedActivityTask | undefined>;
  createPlannedActivityTask(data: InsertPlannedActivityTask): Promise<PlannedActivityTask>;
  updatePlannedActivityTask(id: number, data: Partial<InsertPlannedActivityTask>): Promise<PlannedActivityTask | undefined>;
  deletePlannedActivityTask(id: number): Promise<void>;
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // Project methods
  async getProjects(): Promise<Project[]> {
    const dbProjects = await db.select().from(projects);
    return dbProjects.map(p => ({
      ...p,
      budget: p.budget,
      startDate: p.startDate,
      endDate: p.endDate,
      currency: p.currency as "USD" | "EUR" | "SAR"
    }));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) return undefined;

    return {
      ...project,
      budget: project.budget,
      startDate: project.startDate,
      endDate: project.endDate,
      currency: project.currency as "USD" | "EUR" | "SAR"
    };
  }

  async createProject(project: Omit<Project, "id" | "createdAt">): Promise<Project> {
    // Handle both string and Date types for dates
    const startDate = typeof project.startDate === 'string' ? project.startDate : project.startDate;
    const endDate = typeof project.endDate === 'string' ? project.endDate : project.endDate;

    const [newProject] = await db.insert(projects).values({
      ...project,
      budget: project.budget.toString(),
      startDate,
      endDate
    }).returning();

    return {
      ...newProject,
      budget: newProject.budget,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      currency: newProject.currency as "USD" | "EUR" | "SAR"
    };
  }

  async updateProject(id: number, project: Partial<Omit<Project, "id" | "createdAt">>): Promise<Project | undefined> {
    const updatedValues: any = { ...project };

    if (updatedValues.budget !== undefined) {
      updatedValues.budget = updatedValues.budget.toString();
    }
    if (updatedValues.startDate) {
      updatedValues.startDate = typeof updatedValues.startDate === 'string'
        ? updatedValues.startDate
        : updatedValues.startDate;
    }
    if (updatedValues.endDate) {
      updatedValues.endDate = typeof updatedValues.endDate === 'string'
        ? updatedValues.endDate
        : updatedValues.endDate;
    }

    const [updatedProject] = await db
      .update(projects)
      .set(updatedValues)
      .where(eq(projects.id, id))
      .returning();

    if (!updatedProject) return undefined;

    return {
      ...updatedProject,
      budget: updatedProject.budget,
      startDate: updatedProject.startDate,
      endDate: updatedProject.endDate,
      currency: updatedProject.currency as "USD" | "EUR" | "SAR"
    };
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // WBS methods
  async getWbsItems(projectId: number): Promise<WbsItem[]> {
    const dbItems = await db
      .select()
      .from(wbsItems)
      .where(eq(wbsItems.projectId, projectId))
      .orderBy(wbsItems.code);

    return dbItems.map(item => ({
      ...item,
      budgetedCost: item.budgetedCost,
      actualCost: item.actualCost,
      percentComplete: item.percentComplete,
      startDate: item.startDate,
      endDate: item.endDate,
      actualStartDate: item.actualStartDate,
      actualEndDate: item.actualEndDate,
    }));
  }

  async getWbsItem(id: number): Promise<WbsItem | undefined> {
    const [item] = await db
      .select()
      .from(wbsItems)
      .where(eq(wbsItems.id, id));

    if (!item) return undefined;

    return {
      ...item,
      budgetedCost: item.budgetedCost,
      actualCost: item.actualCost,
      percentComplete: item.percentComplete,
      startDate: item.startDate,
      endDate: item.endDate,
      actualStartDate: item.actualStartDate,
      actualEndDate: item.actualEndDate,
    };
  }

  async createWbsItem(wbsItem: Omit<WbsItem, "id" | "createdAt">): Promise<WbsItem> {
    const insertData: any = { ...wbsItem };

    // Handle date conversions
    if (wbsItem.startDate) {
      insertData.startDate = typeof wbsItem.startDate === 'string' ? wbsItem.startDate : wbsItem.startDate;
    }
    if (wbsItem.endDate) {
      insertData.endDate = typeof wbsItem.endDate === 'string' ? wbsItem.endDate : wbsItem.endDate;
    }

    const [newWbsItem] = await db.insert(wbsItems).values(insertData).returning();

    return {
      ...newWbsItem,
      budgetedCost: newWbsItem.budgetedCost,
      actualCost: newWbsItem.actualCost,
      percentComplete: newWbsItem.percentComplete,
      startDate: newWbsItem.startDate,
      endDate: newWbsItem.endDate,
      actualStartDate: newWbsItem.actualStartDate,
      actualEndDate: newWbsItem.actualEndDate,
    };
  }

  async updateWbsItem(id: number, wbsItem: Partial<Omit<WbsItem, "id" | "createdAt">>): Promise<WbsItem | undefined> {
    const updateData: any = { ...wbsItem };

    // Handle date conversions
    if (updateData.startDate) {
      updateData.startDate = typeof updateData.startDate === 'string' ? updateData.startDate : updateData.startDate;
    }
    if (updateData.endDate) {
      updateData.endDate = typeof updateData.endDate === 'string' ? updateData.endDate : updateData.endDate;
    }

    const [updatedWbsItem] = await db
      .update(wbsItems)
      .set(updateData)
      .where(eq(wbsItems.id, id))
      .returning();

    if (!updatedWbsItem) return undefined;

    return {
      ...updatedWbsItem,
      budgetedCost: updatedWbsItem.budgetedCost,
      actualCost: updatedWbsItem.actualCost,
      percentComplete: updatedWbsItem.percentComplete,
      startDate: updatedWbsItem.startDate,
      endDate: updatedWbsItem.endDate,
      actualStartDate: updatedWbsItem.actualStartDate,
      actualEndDate: updatedWbsItem.actualEndDate,
    };
  }

  async deleteWbsItem(id: number): Promise<void> {
    await db.delete(wbsItems).where(eq(wbsItems.id, id));
  }

  // Dependency methods
  async getDependencies(projectId: number): Promise<Dependency[]> {
    const dbDependencies = await db
      .select()
      .from(dependencies)
      .innerJoin(wbsItems, eq(dependencies.predecessorId, wbsItems.id))
      .where(eq(wbsItems.projectId, projectId));

    return dbDependencies.map(d => ({
      id: d.dependencies.id,
      predecessorId: d.dependencies.predecessorId,
      successorId: d.dependencies.successorId,
      type: d.dependencies.type,
      lag: d.dependencies.lag,
      createdAt: d.dependencies.createdAt,
    }));
  }

  async getDependency(id: number): Promise<Dependency | undefined> {
    const [dependency] = await db.select().from(dependencies).where(eq(dependencies.id, id));
    return dependency;
  }

  async createDependency(dependency: Omit<Dependency, "id" | "createdAt">): Promise<Dependency> {
    const [newDependency] = await db.insert(dependencies).values(dependency).returning();
    return newDependency;
  }

  async updateDependency(id: number, dependency: Partial<Omit<Dependency, "id" | "createdAt">>): Promise<Dependency | undefined> {
    const [updatedDependency] = await db
      .update(dependencies)
      .set(dependency)
      .where(eq(dependencies.id, id))
      .returning();

    if (!updatedDependency) return undefined;

    return {
      ...updatedDependency,
      predecessorId: updatedDependency.predecessorId,
      successorId: updatedDependency.successorId,
    };
  }

  async deleteDependency(id: number): Promise<void> {
    await db.delete(dependencies).where(eq(dependencies.id, id));
  }

  // Cost entry methods
  async getCostEntries(wbsItemId: number): Promise<CostEntry[]> {
    const dbEntries = await db.select().from(costEntries).where(eq(costEntries.wbsItemId, wbsItemId));
    return dbEntries.map(entry => ({
      ...entry,
      amount: entry.amount,
      entryDate: entry.entryDate,
    }));
  }

  async getCostEntry(id: number): Promise<CostEntry | undefined> {
    const [entry] = await db.select().from(costEntries).where(eq(costEntries.id, id));
    return entry ? {
      ...entry,
      amount: entry.amount,
      entryDate: entry.entryDate,
    } : undefined;
  }

  async createCostEntry(costEntry: Omit<CostEntry, "id" | "createdAt">): Promise<CostEntry> {
    const [newCostEntry] = await db.insert(costEntries).values(costEntry).returning();
    return {
      ...newCostEntry,
      amount: newCostEntry.amount,
      entryDate: newCostEntry.entryDate,
    };
  }

  async updateCostEntry(id: number, costEntry: Partial<Omit<CostEntry, "id" | "createdAt">>): Promise<CostEntry | undefined> {
    const [updatedCostEntry] = await db
      .update(costEntries)
      .set(costEntry)
      .where(eq(costEntries.id, id))
      .returning();

    if (!updatedCostEntry) return undefined;

    return {
      ...updatedCostEntry,
      amount: updatedCostEntry.amount,
      entryDate: updatedCostEntry.entryDate,
    };
  }

  async deleteCostEntry(id: number): Promise<void> {
    await db.delete(costEntries).where(eq(costEntries.id, id));
  }

  // Helper method to update WBS item cost
  private async updateWbsItemCost(wbsItemId: number, amountChange: number): Promise<void> {
    const [currentItem] = await db
      .select({ actualCost: wbsItems.actualCost })
      .from(wbsItems)
      .where(eq(wbsItems.id, wbsItemId));

    if (currentItem) {
      const newActualCost = parseFloat(currentItem.actualCost || "0") + amountChange;
      await db
        .update(wbsItems)
        .set({ actualCost: newActualCost.toString() })
        .where(eq(wbsItems.id, wbsItemId));
    }
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    const dbTasks = await db.select().from(tasks);
    return dbTasks;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [result] = await db.insert(tasks).values(data).returning();
    return result;
  }

  async updateTask(id: number, data: InsertTask): Promise<Task | undefined> {
    const [result] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return result;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Activity methods
  async getActivities(): Promise<Activity[]> {
    const dbActivities = await db.select().from(activities);
    return dbActivities;
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async createActivity(data: InsertActivity): Promise<Activity> {
    const [result] = await db.insert(activities).values(data).returning();
    return {
      ...result,
      unitRate: result.unitRate,
    };
  }

  async updateActivity(id: number, data: InsertActivity): Promise<Activity | undefined> {
    const [result] = await db.update(activities).set(data).where(eq(activities.id, id)).returning();
    return result ? {
      ...result,
      unitRate: result.unitRate,
    } : undefined;
  }

  async deleteActivity(id: number): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  // Resource methods
  async getResources(): Promise<Resource[]> {
    const dbResources = await db.select().from(resources);
    return dbResources;
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async createResource(data: InsertResource): Promise<Resource> {
    const [result] = await db.insert(resources).values(data).returning();
    return {
      ...result,
      unitRate: result.unitRate,
      availability: result.availability,
    };
  }

  async updateResource(id: number, data: InsertResource): Promise<Resource | undefined> {
    const [result] = await db.update(resources).set(data).where(eq(resources.id, id)).returning();
    return result ? {
      ...result,
      unitRate: result.unitRate,
      availability: result.availability,
    } : undefined;
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  // Task Resource methods
  async getTaskResources(taskId: number): Promise<TaskResource[]> {
    const dbTaskResources = await db.select().from(taskResources).where(eq(taskResources.taskId, taskId));
    return dbTaskResources;
  }

  async getTaskResource(id: number): Promise<TaskResource | undefined> {
    const [taskResource] = await db.select().from(taskResources).where(eq(taskResources.id, id));
    return taskResource;
  }

  async createTaskResource(data: InsertTaskResource): Promise<TaskResource> {
    const [result] = await db.insert(taskResources).values(data).returning();
    return {
      ...result,
      quantity: result.quantity,
    };
  }

  async updateTaskResource(id: number, data: InsertTaskResource): Promise<TaskResource | undefined> {
    const [result] = await db.update(taskResources).set(data).where(eq(taskResources.id, id)).returning();
    return result ? {
      ...result,
      quantity: result.quantity,
    } : undefined;
  }

  async deleteTaskResource(id: number): Promise<void> {
    await db.delete(taskResources).where(eq(taskResources.id, id));
  }

  // Project Activity methods
  async getProjectActivities(projectId: number): Promise<ProjectActivity[]> {
    const dbActivities = await db.select().from(projectActivities).where(eq(projectActivities.projectId, projectId));
    return dbActivities;
  }

  async getProjectActivity(id: number): Promise<ProjectActivity | undefined> {
    const [activity] = await db.select().from(projectActivities).where(eq(projectActivities.id, id));
    return activity;
  }

  async createProjectActivity(data: InsertProjectActivity): Promise<ProjectActivity> {
    const [result] = await db.insert(projectActivities).values(data).returning();
    return result;
  }

  async updateProjectActivity(id: number, data: InsertProjectActivity): Promise<ProjectActivity | undefined> {
    const [result] = await db.update(projectActivities).set(data).where(eq(projectActivities.id, id)).returning();
    return result;
  }

  async deleteProjectActivity(id: number): Promise<void> {
    await db.delete(projectActivities).where(eq(projectActivities.id, id));
  }

  // Project Task methods
  async getProjectTasks(projectId: number): Promise<ProjectTask[]> {
    const dbTasks = await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId));
    return dbTasks;
  }

  async getProjectTask(id: number): Promise<ProjectTask | undefined> {
    const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, id));
    return task;
  }

  async createProjectTask(data: InsertProjectTask): Promise<ProjectTask> {
    const [result] = await db.insert(projectTasks).values(data).returning();
    return result;
  }

  async updateProjectTask(id: number, data: InsertProjectTask): Promise<ProjectTask | undefined> {
    const [result] = await db.update(projectTasks).set(data).where(eq(projectTasks.id, id)).returning();
    return result;
  }

  async deleteProjectTask(id: number): Promise<void> {
    await db.delete(projectTasks).where(eq(projectTasks.id, id));
  }

  // Project Resource methods
  async getProjectResources(projectId: number): Promise<ProjectResource[]> {
    const dbResources = await db.select().from(projectResources).where(eq(projectResources.projectId, projectId));
    return dbResources;
  }

  async getProjectResource(id: number): Promise<ProjectResource | undefined> {
    const [resource] = await db.select().from(projectResources).where(eq(projectResources.id, id));
    return resource;
  }

  async createProjectResource(data: InsertProjectResource): Promise<ProjectResource> {
    const [result] = await db.insert(projectResources).values(data).returning();
    return result;
  }

  async updateProjectResource(id: number, data: InsertProjectResource): Promise<ProjectResource | undefined> {
    const [result] = await db.update(projectResources).set(data).where(eq(projectResources.id, id)).returning();
    return result;
  }

  async deleteProjectResource(id: number): Promise<void> {
    await db.delete(projectResources).where(eq(projectResources.id, id));
  }

  // Daily Progress methods
  async getDailyProgress(projectId: number): Promise<DailyProgress[]> {
    const entries = await db
      .select()
      .from(dailyProgress)
      .where(eq(dailyProgress.projectId, projectId))
      .orderBy(dailyProgress.date);
    return entries;
  }

  async getDailyProgressEntry(id: number): Promise<DailyProgress | undefined> {
    const [entry] = await db.select().from(dailyProgress).where(eq(dailyProgress.id, id));
    return entry;
  }

  async createDailyProgress(data: InsertDailyProgress): Promise<DailyProgress> {
    const [entry] = await db.insert(dailyProgress).values(data).returning();
    return entry;
  }

  async createDailyProgressBulk(data: InsertDailyProgress[]): Promise<DailyProgress[]> {
    const entries = await db.insert(dailyProgress).values(data).returning();
    return entries;
  }

  async updateDailyProgress(id: number, data: Partial<InsertDailyProgress>): Promise<DailyProgress | undefined> {
    const [entry] = await db
      .update(dailyProgress)
      .set(data)
      .where(eq(dailyProgress.id, id))
      .returning();
    return entry;
  }

  async deleteDailyProgress(id: number): Promise<void> {
    await db.delete(dailyProgress).where(eq(dailyProgress.id, id));
  }

  // Resource Plan methods
  async getResourcePlans(projectId: number): Promise<ResourcePlan[]> {
    const entries = await db
      .select()
      .from(resourcePlans)
      .where(eq(resourcePlans.projectId, projectId))
      .orderBy(resourcePlans.startDate);
    return entries;
  }

  async getResourcePlan(id: number): Promise<ResourcePlan | undefined> {
    const [entry] = await db.select().from(resourcePlans).where(eq(resourcePlans.id, id));
    return entry;
  }

  async createResourcePlan(data: InsertResourcePlan): Promise<ResourcePlan> {
    const [entry] = await db.insert(resourcePlans).values(data).returning();
    return entry;
  }

  async createResourcePlanBulk(data: InsertResourcePlan[]): Promise<ResourcePlan[]> {
    const entries = await db.insert(resourcePlans).values(data).returning();
    return entries;
  }

  async updateResourcePlan(id: number, data: Partial<InsertResourcePlan>): Promise<ResourcePlan | undefined> {
    const [entry] = await db
      .update(resourcePlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(resourcePlans.id, id))
      .returning();
    return entry;
  }

  async deleteResourcePlan(id: number): Promise<void> {
    await db.delete(resourcePlans).where(eq(resourcePlans.id, id));
  }

  // Risk Register methods
  async getRiskRegisters(projectId: number): Promise<RiskRegister[]> {
    const entries = await db
      .select()
      .from(riskRegister)
      .where(eq(riskRegister.projectId, projectId))
      .orderBy(riskRegister.dateLogged);
    return entries;
  }

  async getRiskRegister(id: number): Promise<RiskRegister | undefined> {
    const [entry] = await db.select().from(riskRegister).where(eq(riskRegister.id, id));
    return entry;
  }

  async createRiskRegister(data: InsertRiskRegister): Promise<RiskRegister> {
    const [entry] = await db.insert(riskRegister).values(data).returning();
    return entry;
  }

  async updateRiskRegister(id: number, data: Partial<InsertRiskRegister>): Promise<RiskRegister | undefined> {
    const [entry] = await db
      .update(riskRegister)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(riskRegister.id, id))
      .returning();
    return entry;
  }

  async deleteRiskRegister(id: number): Promise<void> {
    await db.delete(riskRegister).where(eq(riskRegister.id, id));
  }

  // Lesson Learnt Register methods
  async getLessonLearntRegisters(projectId: number): Promise<LessonLearntRegister[]> {
    const entries = await db
      .select()
      .from(lessonLearntRegister)
      .where(eq(lessonLearntRegister.projectId, projectId))
      .orderBy(lessonLearntRegister.dateLogged);
    return entries;
  }

  async getLessonLearntRegister(id: number): Promise<LessonLearntRegister | undefined> {
    const [entry] = await db.select().from(lessonLearntRegister).where(eq(lessonLearntRegister.id, id));
    return entry;
  }

  async createLessonLearntRegister(data: InsertLessonLearntRegister): Promise<LessonLearntRegister> {
    const [entry] = await db.insert(lessonLearntRegister).values(data).returning();
    return entry;
  }

  async updateLessonLearntRegister(id: number, data: Partial<InsertLessonLearntRegister>): Promise<LessonLearntRegister | undefined> {
    const [entry] = await db
      .update(lessonLearntRegister)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lessonLearntRegister.id, id))
      .returning();
    return entry;
  }

  async deleteLessonLearntRegister(id: number): Promise<void> {
    await db.delete(lessonLearntRegister).where(eq(lessonLearntRegister.id, id));
  }

  // Direct Manpower Position methods
  async getDirectManpowerPositions(projectId: number): Promise<DirectManpowerPosition[]> {
    const positions = await db
      .select()
      .from(directManpowerPositions)
      .where(eq(directManpowerPositions.projectId, projectId))
      .orderBy(directManpowerPositions.order);
    return positions;
  }

  async getDirectManpowerPosition(id: number): Promise<DirectManpowerPosition | undefined> {
    const [position] = await db.select().from(directManpowerPositions).where(eq(directManpowerPositions.id, id));
    return position;
  }

  async createDirectManpowerPosition(data: InsertDirectManpowerPosition): Promise<DirectManpowerPosition> {
    const [position] = await db.insert(directManpowerPositions).values(data).returning();
    return position;
  }

  async updateDirectManpowerPosition(id: number, data: Partial<InsertDirectManpowerPosition>): Promise<DirectManpowerPosition | undefined> {
    const [position] = await db
      .update(directManpowerPositions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(directManpowerPositions.id, id))
      .returning();
    return position;
  }

  async deleteDirectManpowerPosition(id: number): Promise<void> {
    await db.delete(directManpowerPositions).where(eq(directManpowerPositions.id, id));
  }

  async updateDirectManpowerPositions(projectId: number, positions: InsertDirectManpowerPosition[]): Promise<DirectManpowerPosition[]> {
    // Delete existing positions for this project
    await db.delete(directManpowerPositions).where(eq(directManpowerPositions.projectId, projectId));
    
    // Insert new positions
    if (positions.length > 0) {
      const newPositions = await db.insert(directManpowerPositions).values(positions).returning();
      return newPositions;
    }
    return [];
  }

  // Direct Manpower Entry methods
  async getDirectManpowerEntries(projectId: number): Promise<DirectManpowerEntry[]> {
    const entries = await db
      .select()
      .from(directManpowerEntries)
      .where(eq(directManpowerEntries.projectId, projectId))
      .orderBy(directManpowerEntries.date);
    return entries;
  }

  async getDirectManpowerEntry(id: number): Promise<DirectManpowerEntry | undefined> {
    const [entry] = await db.select().from(directManpowerEntries).where(eq(directManpowerEntries.id, id));
    return entry;
  }

  async createDirectManpowerEntry(data: InsertDirectManpowerEntry): Promise<DirectManpowerEntry> {
    const [entry] = await db.insert(directManpowerEntries).values(data).returning();
    return entry;
  }

  async updateDirectManpowerEntry(id: number, data: Partial<InsertDirectManpowerEntry>): Promise<DirectManpowerEntry | undefined> {
    const [entry] = await db
      .update(directManpowerEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(directManpowerEntries.id, id))
      .returning();
    return entry;
  }

  async deleteDirectManpowerEntry(id: number): Promise<void> {
    await db.delete(directManpowerEntries).where(eq(directManpowerEntries.id, id));
  }

  // Indirect Manpower Position methods
  async getIndirectManpowerPositions(projectId: number): Promise<IndirectManpowerPosition[]> {
    const positions = await db
      .select()
      .from(indirectManpowerPositions)
      .where(eq(indirectManpowerPositions.projectId, projectId))
      .orderBy(indirectManpowerPositions.order);
    return positions;
  }

  async getIndirectManpowerPosition(id: number): Promise<IndirectManpowerPosition | undefined> {
    const [position] = await db.select().from(indirectManpowerPositions).where(eq(indirectManpowerPositions.id, id));
    return position;
  }

  async createIndirectManpowerPosition(data: InsertIndirectManpowerPosition): Promise<IndirectManpowerPosition> {
    const [position] = await db.insert(indirectManpowerPositions).values(data).returning();
    return position;
  }

  async updateIndirectManpowerPosition(id: number, data: Partial<InsertIndirectManpowerPosition>): Promise<IndirectManpowerPosition | undefined> {
    const [position] = await db
      .update(indirectManpowerPositions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(indirectManpowerPositions.id, id))
      .returning();
    return position;
  }

  async deleteIndirectManpowerPosition(id: number): Promise<void> {
    await db.delete(indirectManpowerPositions).where(eq(indirectManpowerPositions.id, id));
  }

  async updateIndirectManpowerPositions(projectId: number, positions: InsertIndirectManpowerPosition[]): Promise<IndirectManpowerPosition[]> {
    // Delete existing positions for this project
    await db.delete(indirectManpowerPositions).where(eq(indirectManpowerPositions.projectId, projectId));
    
    // Insert new positions
    if (positions.length > 0) {
      const newPositions = await db.insert(indirectManpowerPositions).values(positions).returning();
      return newPositions;
    }
    return [];
  }

  // Indirect Manpower Entry methods
  async getIndirectManpowerEntries(projectId: number): Promise<IndirectManpowerEntry[]> {
    const entries = await db
      .select()
      .from(indirectManpowerEntries)
      .where(eq(indirectManpowerEntries.projectId, projectId))
      .orderBy(indirectManpowerEntries.date);
    return entries;
  }

  async getIndirectManpowerEntry(id: number): Promise<IndirectManpowerEntry | undefined> {
    const [entry] = await db.select().from(indirectManpowerEntries).where(eq(indirectManpowerEntries.id, id));
    return entry;
  }

  async createIndirectManpowerEntry(data: InsertIndirectManpowerEntry): Promise<IndirectManpowerEntry> {
    const [entry] = await db.insert(indirectManpowerEntries).values(data).returning();
    return entry;
  }

  async updateIndirectManpowerEntry(id: number, data: Partial<InsertIndirectManpowerEntry>): Promise<IndirectManpowerEntry | undefined> {
    const [entry] = await db
      .update(indirectManpowerEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(indirectManpowerEntries.id, id))
      .returning();
    return entry;
  }

  async deleteIndirectManpowerEntry(id: number): Promise<void> {
    await db.delete(indirectManpowerEntries).where(eq(indirectManpowerEntries.id, id));
  }

  // Planned Activity methods
  async getPlannedActivities(projectId: number, startDate?: string, endDate?: string): Promise<PlannedActivity[]> {
    // Filter by date range if provided (2-week rolling window)
    if (startDate && endDate) {
      const activities = await db
        .select()
        .from(plannedActivities)
        .where(
          and(
            eq(plannedActivities.projectId, projectId),
            or(
              and(gte(plannedActivities.startDate, startDate), lte(plannedActivities.startDate, endDate)),
              and(gte(plannedActivities.endDate, startDate), lte(plannedActivities.endDate, endDate)),
              and(lte(plannedActivities.startDate, startDate), gte(plannedActivities.endDate, endDate))
            )
          )
        )
        .orderBy(plannedActivities.startDate);
      return activities;
    }

    const activities = await db
      .select()
      .from(plannedActivities)
      .where(eq(plannedActivities.projectId, projectId))
      .orderBy(plannedActivities.startDate);
    return activities;
  }

  async getPlannedActivity(id: number): Promise<PlannedActivity | undefined> {
    const [activity] = await db.select().from(plannedActivities).where(eq(plannedActivities.id, id));
    return activity;
  }

  async createPlannedActivity(data: InsertPlannedActivity): Promise<PlannedActivity> {
    const [activity] = await db.insert(plannedActivities).values(data).returning();
    return activity;
  }

  async updatePlannedActivity(id: number, data: Partial<InsertPlannedActivity>): Promise<PlannedActivity | undefined> {
    const [activity] = await db
      .update(plannedActivities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plannedActivities.id, id))
      .returning();
    return activity;
  }

  async deletePlannedActivity(id: number): Promise<void> {
    await db.delete(plannedActivities).where(eq(plannedActivities.id, id));
  }

  // Planned Activity Task methods
  async getPlannedActivityTasks(activityId: number): Promise<PlannedActivityTask[]> {
    const tasks = await db
      .select()
      .from(plannedActivityTasks)
      .where(eq(plannedActivityTasks.activityId, activityId))
      .orderBy(plannedActivityTasks.startDate);
    return tasks;
  }

  async getPlannedActivityTask(id: number): Promise<PlannedActivityTask | undefined> {
    const [task] = await db.select().from(plannedActivityTasks).where(eq(plannedActivityTasks.id, id));
    return task;
  }

  async createPlannedActivityTask(data: InsertPlannedActivityTask): Promise<PlannedActivityTask> {
    const [task] = await db.insert(plannedActivityTasks).values(data).returning();
    return task;
  }

  async updatePlannedActivityTask(id: number, data: Partial<InsertPlannedActivityTask>): Promise<PlannedActivityTask | undefined> {
    const [task] = await db
      .update(plannedActivityTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plannedActivityTasks.id, id))
      .returning();
    return task;
  }

  async deletePlannedActivityTask(id: number): Promise<void> {
    await db.delete(plannedActivityTasks).where(eq(plannedActivityTasks.id, id));
  }
}

export const storage = new DatabaseStorage();

// Activity Storage Functions
export async function getActivities() {
  return await db.select().from(activities).orderBy(activities.name);
}

export async function getActivity(id: number) {
  const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  return result[0];
}

export async function createActivity(data: InsertActivity) {
  return await db.insert(activities).values({
    ...data,
    updatedAt: new Date(),
  }).returning();
}

export async function updateActivity(id: number, data: InsertActivity) {
  return await db
    .update(activities)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(activities.id, id))
    .returning();
}

export async function deleteActivity(id: number) {
  return await db
    .delete(activities)
    .where(eq(activities.id, id))
    .returning();
}
