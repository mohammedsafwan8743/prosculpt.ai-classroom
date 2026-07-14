import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";

/**
 * Request validation middleware factory using Zod schemas.
 *
 * Usage:
 * ```ts
 * router.post("/", validate(createClassroomSchema), controller.create);
 * ```
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        res.status(400).json({
          error: "Validation failed",
          details: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
}
