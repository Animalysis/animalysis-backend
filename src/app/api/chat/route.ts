import { NextRequest } from "next/server";
import OpenAI from "openai";
import { corsHeaders } from "../_utils/cors";
import { ChatRequestSchema } from "./schema";
import { getAnimalsByUser, getAnimalForUser } from "@/lib/animals";
import { summarizeRecords, getRecordsByAnimal } from "@/lib/records";

export const runtime = "edge";

export async function OPTIONS(req: NextRequest) {
    return new Response(null, { headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest) {
    const headers = corsHeaders(req.headers.get("origin"));

    try {
        const url = new URL(req.url);
        const streamOff = url.searchParams.get("stream") === "false";

        const json = await req.json();
        const parsed = ChatRequestSchema.safeParse(json);
        if (!parsed.success) return new Response("Invalid request body", { status: 400, headers });

        const { user_id, animal_id, messages, temperature = 0.7, model = "gpt-4.1" } = parsed.data;

        // Validate user/animal relationship
        const userAnimals = getAnimalsByUser(user_id);
        const selected = getAnimalForUser(user_id, animal_id);
        if (animal_id && !selected) {
            return new Response("Forbidden: animal not found for user", { status: 403, headers });
        }

        // Record summary / recent raw data (only if an animal is selected)
        const summary = selected ? summarizeRecords(selected.animal_id, 60) : null;
        const recentRecords = selected ? getRecordsByAnimal(selected.animal_id, 30) : [];

        // System prompt
        const system = `
You are Animalysis's veterinary/health assistant chatbot.
Use ONLY the information from "User's Registered Animals", "Recent Record Summary", and "Recent Raw Records" below.
If the information is missing, say "No registered data available" without guessing.

[Today] ${new Date().toISOString()}
[User ID] ${user_id}
[Selected Animal] ${selected ? selected.animal_id : "(none)"}

[User's Registered Animals (JSON)]
${JSON.stringify(userAnimals, null, 2)}

[Recent Record Summary (60 days)]
${summary ? JSON.stringify(summary, null, 2) : "(none)"}

[Recent Raw Records (30 days)]
${recentRecords.length ? JSON.stringify(recentRecords, null, 2) : "(none)"}

Response rules:
- If the question is about a specific animal but animal_id is not provided, first ask which animal the user means.
- When age calculation is needed, compute it from birth_date relative to today, and express as 'X years Y months'.
- Provide concrete, number-based recommendations based on:
  • weight_trend_kg, avg.food_g, avg.sleep_h, avg.activity
- If there is a rapid weight change (±5% within ~2 weeks) or recent symptoms (symptoms_recent), give a caution and recommend consulting a veterinarian.
- End your answer with: "Data range: {range}, recent records: {count}" as metadata.
`.trim();

        const finalMessages = [
            { role: "system", content: system },
            ...messages,
        ] as const;

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        if (streamOff) {
            const resp = await client.chat.completions.create({
                model, temperature, messages: finalMessages as any, stream: false,
            });
            const content = resp.choices?.[0]?.message?.content ?? "";
            return Response.json({ content }, { headers });
        }

        const stream = await client.chat.completions.create({
            model, temperature, messages: finalMessages as any, stream: true,
        });

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const token = chunk.choices?.[0]?.delta?.content ?? "";
                        if (token) controller.enqueue(encoder.encode(token));
                    }
                } catch (e) {
                    controller.error(e);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                ...headers,
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (e: any) {
        return new Response(e?.message ?? "Server error", { status: 500, headers });
    }
}