export enum TaskStatus {
  NotStarted = "not-started",
  InProgress = "in-progress",
  Completed = "completed"
}

export interface Task {
  id: string;
  title: string;
  parent: string | null;
  status?: TaskStatus;
  dueDate?: Date | null;
  timeEstimate?: string | null;
}
