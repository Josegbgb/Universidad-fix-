import { Router } from "express";
import { jsonResponse } from "../lib/jsonResponse.js";
export const signupRouter = Router();

signupRouter.post("/", (req, res) => {
  const { email, password } = req.body;
  if (!!!email || !!!password) {
    return res
      .status(400)
      .json(jsonResponse(400, { error: "Fields are required" }));
  }

  res
    .status(200)
    .json(jsonResponse(200, { message: "User signed out successfully" }));
  res.send("signout");
});
