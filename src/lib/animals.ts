// JSON static import (Edge에서도 OK)
import data from "@/mock/animals.json";

export type Animal = {
    animal_id: string;
    user_id: string;
    species: string;
    breed: string;
    gender: string;
    birth_date: string;   // "YYYY-MM-DD"
    created_at: string;
    updated_at: string;
};

export const animals = data as Animal[];

export function getAnimalsByUser(userId: string) {
    return animals.filter((a) => a.user_id === userId);
}

export function getAnimalForUser(userId: string, animalId?: string) {
    if (!animalId) return null;
    const a = animals.find((x) => x.animal_id === animalId && x.user_id === userId);
    return a ?? null;
}