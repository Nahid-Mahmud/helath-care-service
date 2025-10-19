import { Router } from "express";
import { UserController } from "./user.controller";

const router = Router();

// Create a patient (creates both User and Patient records)
router.post("/patients", UserController.CreatePatient);

export const userRoutes = router;
