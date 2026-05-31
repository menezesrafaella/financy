import { Router } from "express";
import { authRouter } from "./auth";
import { categoriesRouter } from "./categories";
import { transactionsRouter } from "./transactions";
import { summaryRouter } from "./summary";

const router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/transactions", transactionsRouter);
router.use("/summary", summaryRouter);

export { router };
