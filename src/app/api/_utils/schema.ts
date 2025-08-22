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

export type PetResponse = z.infer<typeof petResponseSchema>;
