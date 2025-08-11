import records from "@/mock/records.json";

export type RecordItem = {
    record_id: string;
    animal_id: string;
    date: string;        // YYYY-MM-DD
    weight: number;      // kg
    food_intake: number; // grams
    sleep_hours: number; // hours
    activity_level: "low" | "moderate" | "high";
    symptoms: string;    // "none" or simple text
    created_at: string;
    updated_at: string;
};

export const allRecords = records as RecordItem[];

export function getRecordsByAnimal(animalId: string, days?: number) {
    const list = allRecords
        .filter(r => r.animal_id === animalId)
        .sort((a,b) => a.date.localeCompare(b.date));
    if (!days) return list;
    const since = new Date(); since.setDate(since.getDate() - days);
    return list.filter(r => new Date(r.date) >= since);
}

export function summarizeRecords(animalId: string, days = 60) {
    const rs = getRecordsByAnimal(animalId, days);
    if (rs.length === 0) return null;

    const last = rs[rs.length - 1];
    const n = rs.length;
    const avgWeight = rs.reduce((s,r)=>s+r.weight,0)/n;
    const avgFood = rs.reduce((s,r)=>s+r.food_intake,0)/n;
    const avgSleep = rs.reduce((s,r)=>s+r.sleep_hours,0)/n;

    const actScore = { low: 1, moderate: 2, high: 3 } as const;
    const avgAct = rs.reduce((s,r)=>s+actScore[r.activity_level],0)/n;
    const avgActivity =
        avgAct < 1.5 ? "low" : avgAct < 2.5 ? "moderate" : "high";

    const symptoms = rs
        .map(r => r.symptoms)
        .filter(s => s && s.toLowerCase() !== "none");

    // 단순 추세(마지막-처음)
    const trend = rs.length >= 2 ? rs[rs.length-1].weight - rs[0].weight : 0;

    return {
        count: n,
        range: `${rs[0].date} ~ ${rs[rs.length-1].date}`,
        last,
        avg: {
            weight_kg: Number(avgWeight.toFixed(2)),
            food_g: Math.round(avgFood),
            sleep_h: Number(avgSleep.toFixed(1)),
            activity: avgActivity
        },
        weight_trend_kg: Number(trend.toFixed(2)),
        symptoms_recent: symptoms.slice(-3)
    };
}