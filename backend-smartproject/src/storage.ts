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
  type InsertProjectResource
} from "./schema";
import { db } from "./db";
import { and, eq, or, inArray, sql } from "drizzle-orm";
import { projects, wbsItems, dependencies, costEntries, tasks, activities, resources, taskResources, projectActivities, projectTasks, projectResources } from "./schema";

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

  // Project Resource methods
  getProjectResources(projectId: number): Promise<ProjectResource[]>;
  getProjectResource(id: number): Promise<ProjectResource | undefined>;
  createProjectResource(data: InsertProjectResource): Promise<ProjectResource>;
  updateProjectResource(id: number, data: InsertProjectResource): Promise<ProjectResource | undefined>;
  deleteProjectResource(id: number): Promise<void>;
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
