import React from "react";
import { ApolloProvider, Query } from "react-apollo";
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
import { client } from "./apollo";
import gql from "graphql-tag";

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

function StatusText(props: { status: TaskStatus }) {
  if (props.status === TaskStatus.NotStarted) {
    return <>Not Started</>;
  } else if (props.status === TaskStatus.InProgress) {
    return <>In Progress</>;
  } else {
    return <>Completed</>;
  }
}

function StatusColumn(props: { status: TaskStatus, children?: React.ReactNode }) {
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

function TaskBoard(props: {  }) {
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
    <Query query={}
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
    <ApolloProvider client={client}>
        <TaskBoard
          query={{
            parent: "1"
          }}
        />
    </ApolloProvider>
  );
}
