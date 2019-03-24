import React from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult
} from "react-beautiful-dnd";
import Grid from "@material-ui/core/Grid";
import { Card, CardHeader, CardContent } from "@material-ui/core";
import CalendarIcon from "@material-ui/icons/CalendarToday";
import formatDate from "date-fns/format";
import { Task, TaskStatus } from "./typedefs";
import { queryTasks, TaskQuery, updateTask } from "./fauxBackend";

interface TaskCardProps {
  task: Task;
  index: number;
}

function TaskCard(props: TaskCardProps) {
  let { task } = props;
  return (
    <Draggable draggableId={task.id} index={props.index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Card>
            <CardHeader title={task.title} />
            <CardContent>
              {task.dueDate && (
                <>
                  <CalendarIcon />
                  {formatDate(task.dueDate, "MMM DD, YYYY")}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

interface StatusColumnProps {
  status: TaskStatus;
  children?: React.ReactNode;
}

function StatusText(props: { status: TaskStatus }) {
  if (props.status === TaskStatus.NotStarted) {
    return <>Not Started</>;
  } else if (props.status === TaskStatus.InProgress) {
    return <>In Progress</>;
  } else {
    return <>Completed</>;
  }
}

function StatusColumn(props: StatusColumnProps) {
  return (
    <>
      <h2>
        <StatusText status={props.status} />
      </h2>

      <Droppable droppableId={props.status}>
        {(provided, snapshot) => {
          return (
            <div
              ref={provided.innerRef}
              style={{
                backgroundColor: snapshot.isDraggingOver ? "blue" : "grey",
                minHeight: "200px",
                padding: 24
              }}
              {...provided.droppableProps}
            >
              {provided.placeholder}
              {props.children}
            </div>
          );
        }}
      </Droppable>
    </>
  );
}

interface TaskMap {
  notStarted: Task[];
  inProgress: Task[];
  completed: Task[];
}
function taskStatusToTaskMapKey(status: TaskStatus): keyof TaskMap {
  if (status === TaskStatus.NotStarted) {
    return "notStarted";
  } else if (status === TaskStatus.InProgress) {
    return "inProgress";
  } else {
    return "completed";
  }
}
function tasksReducer(tasks: TaskMap, action: DropResult) {
  if (!action.destination) {
    return tasks;
  }

  let taskList =
    tasks[taskStatusToTaskMapKey(action.source.droppableId as TaskStatus)];
  let task = taskList[action.source.index];

  let taskListWithoutTask = taskList.filter(
    (task, index) => index !== action.source.index
  );
  let nextTaskMap = {
    ...tasks,
    [taskStatusToTaskMapKey(action.source
      .droppableId as TaskStatus)]: taskListWithoutTask
  };
  let nextTask: Task = {
    ...task,
    status: action.destination.droppableId as TaskStatus
  };
  let taskListWithNewTask = Array.from(
    nextTaskMap[
      taskStatusToTaskMapKey(action.destination.droppableId as TaskStatus)
    ]
  );
  taskListWithNewTask.splice(action.destination.index, 0, nextTask);
  nextTaskMap[
    taskStatusToTaskMapKey(action.destination.droppableId as TaskStatus)
  ] = taskListWithNewTask;

  return nextTaskMap;
}

function initializeTaskMap(tasks: Task[]): TaskMap {
  let taskMap: TaskMap = {
    notStarted: [],
    inProgress: [],
    completed: []
  };
  for (let task of tasks) {
    if (!task.status) {
      // todo:: some stuff with children
      continue;
    }
    taskMap[taskStatusToTaskMapKey(task.status)].push(task);
  }
  let sortfn = (a: Task, b: Task): number => {
    if (!a.dueDate) {
      return -1;
    }
    if (!b.dueDate) {
      return 1;
    }
    return a.dueDate.getTime() - b.dueDate.getTime();
  };
  taskMap.notStarted.sort(sortfn);
  taskMap.inProgress.sort(sortfn);
  taskMap.completed.sort(sortfn);
  return taskMap;
}

function useTaskLoader(
  query: TaskQuery
): [boolean, Task[] | null, (action: DropResult) => void] {
  let [tasks, setTasks] = React.useState<Task[] | null>(null);
  let [isLoading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    queryTasks(query).then(tasks => {
      setTasks(tasks);
      setLoading(false);
    });
  }, [...Object.values(query), setTasks, setLoading]);
  let update = React.useCallback(
    async (action: DropResult) => {
      if (!action.destination) {
        return;
      }
      await updateTask(action.draggableId, {
        status: action.destination.droppableId as TaskStatus
      });
      let tasks = await queryTasks(query);
      setTasks(tasks);
    },
    [setTasks, query]
  );
  return [isLoading, tasks, update];
}

function TaskBoard(props: { query: TaskQuery }) {
  let [isLoading, taskList, update] = useTaskLoader(props.query);
  let tasks = initializeTaskMap(taskList || []);

  const filterByStatus = (status: TaskStatus) =>
    tasks[taskStatusToTaskMapKey(status)];

  const renderCard = (task: Task, index: number) => (
    <Grid item key={task.id}>
      <TaskCard task={task} index={index} />
    </Grid>
  );

  const renderStatusColumn = (status: TaskStatus) => (
    <Grid item>
      <StatusColumn status={status}>
        <Grid container spacing={2} direction={"column"} justify={"flex-start"}>
          {filterByStatus(status).map(renderCard)}
        </Grid>
      </StatusColumn>
    </Grid>
  );
  return (
    <DragDropContext onDragEnd={dropResult => update(dropResult)}>
      <Grid container direction={"row"} alignItems={"stretch"} spacing={2}>
        {renderStatusColumn(TaskStatus.NotStarted)}
        {renderStatusColumn(TaskStatus.InProgress)}
        {renderStatusColumn(TaskStatus.Completed)}
      </Grid>
    </DragDropContext>
  );
}

export default function App() {
  return (
    <TaskBoard
      query={{
        parent: "1"
      }}
    />
  );
}
