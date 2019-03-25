import faker from "faker";
import { Task, TaskStatus } from "./typedefs";

let _idcounter = 0;
const getId = () => String(_idcounter++);

const CACHE: Map<string, Task> = new Map();
const PARENT_MAP: Map<string, string[]> = new Map();

function chooseStatus(): TaskStatus {
  let rand = Math.random();
  let notStartedChance = 0.4;
  let inProgressChance = 0.2;
  if (rand < notStartedChance) {
    return TaskStatus.NotStarted;
  }
  if (rand < notStartedChance + inProgressChance) {
    return TaskStatus.InProgress;
  }
  return TaskStatus.Completed;
}

function genTask(parent: string | null = null): Task {
  let task: Task = {
    id: getId(),
    title: faker.lorem.words(3),
    parent,
    dueDate: faker.date.future(),
    status: chooseStatus()
  };

  CACHE.set(task.id, task);
  if (parent) {
    let parentList = PARENT_MAP.get(parent);
    if (!parentList) {
      parentList = [];
      PARENT_MAP.set(parent, parentList);
    }
    parentList.push(task.id);
  }
  return task;
}

function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export async function findTask(id: string): Promise<Task> {
  await wait(50);
  if (CACHE.has(id)) {
    return CACHE.get(id) as Task;
  }
  return genTask(null);
}

export interface TaskQuery {
  parent?: string;
}

export async function queryTasks(query: TaskQuery): Promise<Task[]> {
  await wait(74);
  if (!query.parent) {
    return [];
  }
  let existing = PARENT_MAP.get(query.parent);
  if (existing) {
    return existing.map(id => CACHE.get(id) as Task);
  }
  let result = Array.from({
    length: faker.random.number({ min: 3, max: 6 })
  }).map(() => genTask(query.parent));
  return result;
}

export async function updateTask(
  id: string,
  update: Partial<Task>
): Promise<Task> {
  await wait(60);
  let foundTask = CACHE.get(id);
  if (!foundTask) {
    throw new Error("cannot update a task that doesnt exist");
  }
  let nextTask = {
    ...foundTask,
    ...update
  };
  CACHE.set(id, nextTask);

  return nextTask;
}

export async function insertTask(
  id: string,
  task: Partial<Task>
): Promise<Task> {
  await wait(60);

  let nextTask = genTask();
  Object.assign(nextTask, task);
  return nextTask;
}

export async function deleteTask(id: string): Promise<string> {
  await wait(20);
  CACHE.delete(id);
  PARENT_MAP.delete(id);
  return id;
}
