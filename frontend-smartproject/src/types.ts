// Re-export types from shared schema
export type {
  Project,
  InsertProject,
  WbsItem,
  InsertWbsItem,
  Dependency,
  InsertDependency,
  CostEntry,
  InsertCostEntry,
  Task,
  InsertTask,
  UpdateWbsProgress,
  ImportCosts,
  CsvImportData
} from '@shared/schema';

// Re-export schemas
export {
  insertProjectSchema,
  insertWbsItemSchema,
  insertDependencySchema,
  insertCostEntrySchema,
  insertTaskSchema,
  csvImportSchema
} from '@shared/schema';

// Thread and Message types
export type ThreadType = 'issue' | 'info' | 'announcement' | 'awards';

export interface Thread {
  id: number;
  title: string;
  type: ThreadType;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  isClosed: boolean;
  projectId?: number;
}

export interface Message {
  id: number;
  threadId: number;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isThreadCreator?: boolean;
} 