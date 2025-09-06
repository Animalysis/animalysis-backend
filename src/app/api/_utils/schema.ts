import { z } from "zod";

export const petResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.string(),
  age: z.number(),
  weight: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
});

export const healthRecordResponseSchema = z.object({
  id: z.string(),
  animalId: z.string(),
  animalName: z.string(),
  type: z.enum(["vaccination", "checkup", "treatment", "appointment"]),
  title: z.string(),
  description: z.string().nullable(),
  date: z.string(), // ISO date string
  veterinarian: z.string().nullable(),
  clinic: z.string().nullable(),
  status: z.enum(["completed", "ongoing", "scheduled"]),
  priority: z.enum(["high", "medium", "routine"]),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const healthRecordCreateSchema = z.object({
  animalId: z.string().min(1, "Animal ID is required"),
  animalName: z.string().min(1, "Animal name is required"),
  type: z.enum(["vaccination", "checkup", "treatment", "appointment"], {
    required_error: "Type is required",
  }),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  veterinarian: z.string().max(100, "Veterinarian name too long").optional(),
  clinic: z.string().max(200, "Clinic name too long").optional(),
  status: z.enum(["completed", "ongoing", "scheduled"], {
    required_error: "Status is required",
  }),
  priority: z.enum(["high", "medium", "routine"], {
    required_error: "Priority is required",
  }),
  userId: z.string().min(1, "User ID is required"),
});

export const healthRecordUpdateSchema = healthRecordCreateSchema.partial();

export type PetResponse = z.infer<typeof petResponseSchema>;
export type HealthRecordResponse = z.infer<typeof healthRecordResponseSchema>;
export type HealthRecordCreate = z.infer<typeof healthRecordCreateSchema>;
export type HealthRecordUpdate = z.infer<typeof healthRecordUpdateSchema>;
