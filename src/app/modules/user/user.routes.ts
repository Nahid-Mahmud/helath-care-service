import { Router } from "express";
import { UserController } from "./user.controller";

const router = Router();

// Create a user
router.post("/create-user", UserController.CreateUser);

export const userRoutes = router;
