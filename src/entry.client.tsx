import { start } from "@tanstack/react-start";
import { getRouter } from "./router";

start({
  createRouter: getRouter,
});
