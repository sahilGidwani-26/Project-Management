import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
    if (parsed.body) req.body = parsed.body;
    next();
  };
}
