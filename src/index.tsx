import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import CssBaseline from "@material-ui/core/CssBaseline";

let root = document.getElementById("root") as HTMLElement;
let render = (App: typeof import("./App").default) => {
  ReactDOM.render(
    <>
      <CssBaseline />
      <App />
    </>,
    root
  );
};

render(App);

if ((module as any).hot) {
  (module as any).hot.accept("./App", () => {
    let NextApp = require("./App").default;
    ReactDOM.unmountComponentAtNode(root);
    render(NextApp);
  });
}
