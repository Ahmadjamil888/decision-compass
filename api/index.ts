import { createStartHandler } from "@tanstack/react-start/server";
import { getRouter } from "../src/router";

export const config = {
  runtime: "edge",
};

const handler = createStartHandler({
  createRouter: getRouter,
});

export default async function handler(request: Request) {
  return handler(request);
}
