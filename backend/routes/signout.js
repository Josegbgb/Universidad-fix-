import { Router } from "express";
import { jsonResponse } from "../lib/jsonResponse.js";
export const signoutRouter = Router();

signoutRouter.get("/", (req, res) => {
  const { username, name, password } = req.body;
  if (!!username || !!!name || !!!password) {
    return res
      .status(400)
      .json(jsonResponse(400, { error: "Fields are required" }));
  }

  res
    .status(200)
    .json(jsonResponse(200, { message: "User signed out successfully" }));
  res.send("signout");
});
