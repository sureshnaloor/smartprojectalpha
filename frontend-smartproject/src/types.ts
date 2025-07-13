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