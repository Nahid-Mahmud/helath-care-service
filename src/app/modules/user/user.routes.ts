import { Router } from "express";
import { UserController } from "./user.controller";

const router = Router();

// Create a user
router.post("/users", UserController.CreateUser);

export const userRoutes = router;
