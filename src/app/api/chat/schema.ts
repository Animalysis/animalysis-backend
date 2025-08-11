import { z } from "zod";

export const MessageSchema = z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1),
});

export const ChatRequestSchema = z.object({
    user_id: z.string().min(1),           // user_id
    animal_id: z.string().optional(),               // animal_id
    messages: z.array(MessageSchema).min(1),
    temperature: z.number().min(0).max(2).optional(),
    model: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;