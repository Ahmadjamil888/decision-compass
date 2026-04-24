import { createStartHandler } from "@tanstack/react-start/server";
import { getRouter } from "../router";

const handler = createStartHandler({
  createRouter: getRouter,
});

export default async function handler(request: Request) {
  return handler(request);
}
