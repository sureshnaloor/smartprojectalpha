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
  type InsertTaskResource
} from "./schema";
import { db } from "./db";
import { and, eq, or, inArray, sql } from "drizzle-orm";
import { projects, wbsItems, dependencies, costEntries, tasks, activities, resources, taskResources } from "./schema";

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
  createTaskResource(data: InsertTaskResource): Promise<TaskResource>;
  updateTaskResource(id: number, data: InsertTaskResource): Promise<TaskResource | undefined>;
  deleteTaskResource(id: number): Promise<void>;
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // Project methods
  async getProjects(): Promise<Project[]> {
    const dbProjects = await db.select().from(projects);
    return dbProjects.map(p => ({
      ...p,
      budget: Number(p.budget),
      startDate: new Date(p.startDate),
      endDate: new Date(p.endDate),
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
      budget: Number(project.budget),
      startDate: new Date(project.startDate),
      endDate: new Date(project.endDate),
      currency: project.currency as "USD" | "EUR" | "SAR"
    };
  }

  async createProject(project: Omit<Project, "id" | "createdAt">): Promise<Project> {
    // Handle both string and Date types for dates
  const startDate = typeof project.startDate === 'string' ? project.startDate : project.startDate.toISOString().split('T')[0];
  const endDate = typeof project.endDate === 'string' ? project.endDate : project.endDate.toISOString().split('T')[0];
  
  const [newProject] = await db.insert(projects).values({
    ...project,
    budget: project.budget.toString(),
    startDate,
    endDate
  }).returning();

  return {
    ...newProject,
    budget: Number(newProject.budget),
    startDate: new Date(newProject.startDate),
    endDate: new Date(newProject.endDate),
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
        : updatedValues.startDate.toISOString().split('T')[0];
    }
    if (updatedValues.endDate) {
      updatedValues.endDate = typeof updatedValues.endDate === 'string' 
        ? updatedValues.endDate 
        : updatedValues.endDate.toISOString().split('T')[0];
    }

    const [updatedProject] = await db
      .update(projects)
      .set(updatedValues)
      .where(eq(projects.id, id))
      .returning();

    if (!updatedProject) return undefined;

    return {
      ...updatedProject,
      budget: Number(updatedProject.budget),
      startDate: new Date(updatedProject.startDate),
      endDate: new Date(updatedProject.endDate),
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
      budgetedCost: Number(item.budgetedCost),
      actualCost: Number(item.actualCost),
      percentComplete: Number(item.percentComplete),
      startDate: item.startDate ? new Date(item.startDate) : null,
      endDate: item.endDate ? new Date(item.endDate) : null,
      actualStartDate: item.actualStartDate ? new Date(item.actualStartDate) : null,
      actualEndDate: item.actualEndDate ? new Date(item.actualEndDate) : null,
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
      budgetedCost: Number(item.budgetedCost),
      actualCost: Number(item.actualCost),
      percentComplete: Number(item.percentComplete),
      startDate: item.startDate ? new Date(item.startDate) : null,
      endDate: item.endDate ? new Date(item.endDate) : null,
      actualStartDate: item.actualStartDate ? new Date(item.actualStartDate) : null,
      actualEndDate: item.actualEndDate ? new Date(item.actualEndDate) : null,
    };
  }

  async createWbsItem(wbsItem: Omit<WbsItem, "id" | "createdAt">): Promise<WbsItem> {
    const insertData: any = {
      projectId: wbsItem.projectId,
      parentId: wbsItem.parentId,
      name: wbsItem.name,
      description: wbsItem.description,
      level: wbsItem.level,
      code: wbsItem.code,
      type: wbsItem.type,
      budgetedCost: wbsItem.budgetedCost.toString(),
      actualCost: "0",
      percentComplete: "0",
      isTopLevel: wbsItem.isTopLevel,
    };

    if (wbsItem.startDate) {
      insertData.startDate = wbsItem.startDate.toISOString().split('T')[0];
    }
    if (wbsItem.endDate) {
      insertData.endDate = wbsItem.endDate.toISOString().split('T')[0];
    }
    if (wbsItem.duration) {
      insertData.duration = wbsItem.duration;
    }

    const [newWbsItem] = await db.insert(wbsItems).values(insertData).returning();

    return {
      ...newWbsItem,
      budgetedCost: Number(newWbsItem.budgetedCost),
      actualCost: Number(newWbsItem.actualCost),
      percentComplete: Number(newWbsItem.percentComplete),
      startDate: newWbsItem.startDate ? new Date(newWbsItem.startDate) : null,
      endDate: newWbsItem.endDate ? new Date(newWbsItem.endDate) : null,
      actualStartDate: newWbsItem.actualStartDate ? new Date(newWbsItem.actualStartDate) : null,
      actualEndDate: newWbsItem.actualEndDate ? new Date(newWbsItem.actualEndDate) : null,
    };
  }

  async updateWbsItem(id: number, wbsItem: Partial<Omit<WbsItem, "id" | "createdAt">>): Promise<WbsItem | undefined> {
    const updatedValues: any = { ...wbsItem };
    
    if (updatedValues.name !== undefined) updatedValues.name = updatedValues.name;
    if (updatedValues.description !== undefined) updatedValues.description = updatedValues.description;
    if (updatedValues.level !== undefined) updatedValues.level = updatedValues.level;
    if (updatedValues.code !== undefined) updatedValues.code = updatedValues.code;
    if (updatedValues.type !== undefined) updatedValues.type = updatedValues.type;
    if (updatedValues.budgetedCost !== undefined) updatedValues.budgetedCost = updatedValues.budgetedCost.toString();
    if (updatedValues.actualCost !== undefined) updatedValues.actualCost = updatedValues.actualCost.toString();
    if (updatedValues.percentComplete !== undefined) updatedValues.percentComplete = updatedValues.percentComplete.toString();
    if (updatedValues.isTopLevel !== undefined) updatedValues.isTopLevel = updatedValues.isTopLevel;
    if (updatedValues.duration !== undefined) updatedValues.duration = updatedValues.duration;

    if (updatedValues.startDate !== undefined) {
      updatedValues.startDate = updatedValues.startDate.toISOString().split('T')[0];
    }
    if (updatedValues.endDate !== undefined) {
      updatedValues.endDate = updatedValues.endDate.toISOString().split('T')[0];
    }
    if (updatedValues.actualStartDate !== undefined) {
      updatedValues.actualStartDate = updatedValues.actualStartDate.toISOString().split('T')[0];
    }
    if (updatedValues.actualEndDate !== undefined) {
      updatedValues.actualEndDate = updatedValues.actualEndDate.toISOString().split('T')[0];
    }

    const [updatedWbsItem] = await db
      .update(wbsItems)
      .set(updatedValues)
      .where(eq(wbsItems.id, id))
      .returning();

    if (!updatedWbsItem) return undefined;

    return {
      ...updatedWbsItem,
      budgetedCost: Number(updatedWbsItem.budgetedCost),
      actualCost: Number(updatedWbsItem.actualCost),
      percentComplete: Number(updatedWbsItem.percentComplete),
      startDate: updatedWbsItem.startDate ? new Date(updatedWbsItem.startDate) : null,
      endDate: updatedWbsItem.endDate ? new Date(updatedWbsItem.endDate) : null,
      actualStartDate: updatedWbsItem.actualStartDate ? new Date(updatedWbsItem.actualStartDate) : null,
      actualEndDate: updatedWbsItem.actualEndDate ? new Date(updatedWbsItem.actualEndDate) : null,
    };
  }

  async deleteWbsItem(id: number): Promise<void> {
    await db.delete(wbsItems).where(eq(wbsItems.id, id));
  }

  // Dependency methods
  async getDependencies(projectId: number): Promise<Dependency[]> {
    // First get all WBS items for this project
    const wbsItems = await this.getWbsItems(projectId);
    if (!wbsItems.length) return [];
    
    // Extract all WBS item IDs
    const wbsItemIds = wbsItems.map(item => item.id);
    
    // Find all dependencies where either predecessor or successor belongs to this project
    const result = await db
      .select()
      .from(dependencies)
      .where(
        or(
          inArray(dependencies.predecessorId, wbsItemIds),
          inArray(dependencies.successorId, wbsItemIds)
        )
      );
      
    return result;
  }

  async getDependency(id: number): Promise<Dependency | undefined> {
    const result = await db.select().from(dependencies).where(eq(dependencies.id, id));
    return result[0];
  }

  async createDependency(dependency: Omit<Dependency, "id" | "createdAt">): Promise<Dependency> {
    const [newDependency] = await db
      .insert(dependencies)
      .values(dependency)
      .returning();
    return newDependency;
  }

  async updateDependency(id: number, dependency: Partial<Omit<Dependency, "id" | "createdAt">>): Promise<Dependency | undefined> {
    const updatedValues: any = { ...dependency };
    
    if (updatedValues.predecessorId) {
      updatedValues.predecessorId = updatedValues.predecessorId.toString();
    }
    if (updatedValues.successorId) {
      updatedValues.successorId = updatedValues.successorId.toString();
    }

    const [updatedDependency] = await db
      .update(dependencies)
      .set(updatedValues)
      .where(eq(dependencies.id, id))
      .returning();

    if (!updatedDependency) return undefined;

    return {
      ...updatedDependency,
      predecessorId: updatedDependency.predecessorId ? Number(updatedDependency.predecessorId) : undefined,
      successorId: updatedDependency.successorId ? Number(updatedDependency.successorId) : undefined
    };
  }

  async deleteDependency(id: number): Promise<void> {
    await db.delete(dependencies).where(eq(dependencies.id, id));
  }

  // Cost entry methods
  async getCostEntries(wbsItemId: number): Promise<CostEntry[]> {
    return await db
      .select()
      .from(costEntries)
      .where(eq(costEntries.wbsItemId, wbsItemId));
  }

  async getCostEntry(id: number): Promise<CostEntry | undefined> {
    const result = await db.select().from(costEntries).where(eq(costEntries.id, id));
    return result[0];
  }

  async createCostEntry(costEntry: Omit<CostEntry, "id" | "createdAt">): Promise<CostEntry> {
    const [newCostEntry] = await db
      .insert(costEntries)
      .values({
        ...costEntry,
        amount: costEntry.amount.toString(),
        entryDate: new Date(costEntry.entryDate).toISOString()
      })
      .returning();
    
    // Update the actual cost of the WBS item
    await this.updateWbsItemCost(costEntry.wbsItemId, Number(costEntry.amount));
    
    return {
      ...newCostEntry,
      amount: Number(newCostEntry.amount),
      entryDate: new Date(newCostEntry.entryDate)
    };
  }

  async updateCostEntry(id: number, costEntry: Partial<Omit<CostEntry, "id" | "createdAt">>): Promise<CostEntry | undefined> {
    const updatedValues: any = { ...costEntry };
    
    if (updatedValues.amount !== undefined) {
      updatedValues.amount = updatedValues.amount.toString();
    }
    if (updatedValues.entryDate) {
      updatedValues.entryDate = updatedValues.entryDate.toISOString();
    }

    const [updatedCostEntry] = await db
      .update(costEntries)
      .set(updatedValues)
      .where(eq(costEntries.id, id))
      .returning();

    if (!updatedCostEntry) return undefined;

    return {
      ...updatedCostEntry,
      amount: updatedCostEntry.amount ? Number(updatedCostEntry.amount) : undefined,
      entryDate: updatedCostEntry.entryDate ? new Date(updatedCostEntry.entryDate) : undefined
    };
  }

  async deleteCostEntry(id: number): Promise<void> {
    // First get the cost entry to know the amount and WBS item ID
    const [costEntry] = await db
      .select()
      .from(costEntries)
      .where(eq(costEntries.id, id));
    
    if (!costEntry) return;
    
    // Delete the cost entry
    await db
      .delete(costEntries)
      .where(eq(costEntries.id, id));
    
    // Update the actual cost of the WBS item (subtract the amount)
    await this.updateWbsItemCost(costEntry.wbsItemId, -Number(costEntry.amount));
  }

  // Helper method to update WBS item actual cost
  private async updateWbsItemCost(wbsItemId: number, amountChange: number): Promise<void> {
    const [wbsItem] = await db
      .select()
      .from(wbsItems)
      .where(eq(wbsItems.id, wbsItemId));
    
    if (wbsItem) {
      const newActualCost = Number(wbsItem.actualCost) + amountChange;
      
      await db
        .update(wbsItems)
        .set({ actualCost: newActualCost.toString() }) // Convert number to string
        .where(eq(wbsItems.id, wbsItemId));
    }
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    const result = await db.select().from(tasks);
    return result;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [result] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    return result;
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [result] = await db.insert(tasks).values(data).returning();
    return result;
    }
    
  async updateTask(id: number, data: InsertTask): Promise<Task | undefined> {
    const [result] = await db
      .update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();
    return result;
    }
    
  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Activity methods
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(activities.name);
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
    return result[0];
    }

  async createActivity(data: InsertActivity): Promise<Activity> {
    const [result] = await db.insert(activities).values({
      ...data,
      updatedAt: new Date(),
    }).returning();

    return {
      ...result,
      unitRate: Number(result.unitRate),
    };
  }

  async updateActivity(id: number, data: InsertActivity): Promise<Activity | undefined> {
    const [result] = await db
      .update(activities)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, id))
      .returning();
    
    return result || undefined;
  }

  async deleteActivity(id: number): Promise<void> {
    await db
      .delete(activities)
      .where(eq(activities.id, id))
      .returning();
  }

  // Resource methods
  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources).orderBy(resources.name);
    }
    
  async getResource(id: number): Promise<Resource | undefined> {
    const result = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
    return result[0];
      }

  async createResource(data: InsertResource): Promise<Resource> {
    const [result] = await db.insert(resources).values({
      ...data,
      updatedAt: new Date(),
    }).returning();

    return {
      ...result,
      unitRate: Number(result.unitRate),
      availability: Number(result.availability),
    };
    }
    
  async updateResource(id: number, data: InsertResource): Promise<Resource | undefined> {
    const [result] = await db
      .update(resources)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, id))
      .returning();

    return result || undefined;
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
    }
    
  // Task Resource methods
  async getTaskResources(taskId: number): Promise<TaskResource[]> {
    return await db.select().from(taskResources).where(eq(taskResources.taskId, taskId));
  }

  async createTaskResource(data: InsertTaskResource): Promise<TaskResource> {
    const [result] = await db.insert(taskResources).values({
      ...data,
      updatedAt: new Date(),
    }).returning();

    return {
      ...result,
      quantity: Number(result.quantity),
    };
  }

  async updateTaskResource(id: number, data: InsertTaskResource): Promise<TaskResource | undefined> {
    const [result] = await db
      .update(taskResources)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(taskResources.id, id))
      .returning();
    
    return result || undefined;
  }

  async deleteTaskResource(id: number): Promise<void> {
    await db.delete(taskResources).where(eq(taskResources.id, id));
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
