// src/mock/mockPets.ts
export const mockPets = [
    {
        id: "a1f9c2e0-5d77-4c1f-9b32-12a5d45f1c01",
        name: "Buddy",
        species: "Dog",
        breed: "Golden Retriever",
        weight: 30,
        age: 5,
        user_id: "user_123",

        // additional fields for AnimalCard
        image: "",
        lastActivity: "30 minutes ago",
        location: "Backyard",
        heartRate: 88,            // bpm
        caloriesBurned: 450,      // today
        status: "active" as const // "active" | "resting"
    },
    {
        id: "a2b3d4f5-6a78-4e2b-91c2-56d9f23a7b12",
        name: "Mittens",
        species: "Cat",
        breed: "Siamese",
        weight: 5,
        age: 2,
        user_id: "user_123",

        // additional fields for AnimalCard
        image: "",
        lastActivity: "2 hours ago",
        location: "Living Room",
        heartRate: 150,           // cats have higher bpm
        caloriesBurned: 160,
        status: "resting" as const
    },
];