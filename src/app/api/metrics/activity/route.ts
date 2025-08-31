export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import records from "@/mock/records.json";

type Granularity = "day" | "week" | "month";

type RecordItem = {
    record_id: string;
    animal_id: string;
    date: string;        // YYYY-MM-DD
    weight: number;
    food_intake: number; // g
    sleep_hours: number;
    activity_level: "low" | "moderate" | "high";
    symptoms: string;
    created_at: string;
    updated_at: string;
};

// ------- handler -------
export async function GET(req: NextRequest) {
    console.log("get metrics called")
    try {
        const { searchParams } = new URL(req.url);
        const animalId = searchParams.get("animalId");
        const granularity = (searchParams.get("granularity") as Granularity) || "week";

        if (!animalId) {
            return NextResponse.json({ message: "Missing animalId" }, { status: 400 });
        }

        const { start, end, buckets, bucketHours } = getRange(granularity);
        const byAnimal = (records as RecordItem[]).filter(r => r.animal_id === animalId);

        // 버킷 시작시각들
        const bucketStarts: Date[] = [];
        for (let i = 0; i < buckets; i++) {
            const b = new Date(start);
            b.setHours(b.getHours() + i * bucketHours);
            bucketStarts.push(b);
        }

        // 집계
        const points = bucketStarts.map((bStart) => {
            const bEnd = new Date(bStart);
            bEnd.setHours(bStart.getHours() + bucketHours);

            // records.json은 “일 단위”라 시간 버킷(day)일 땐 근사치
            const inBucket = byAnimal.filter((r) => {
                const d = startOfDay(new Date(r.date));
                return d >= startOfDay(bStart) && d < startOfDay(bEnd);
            });

            const label =
                granularity === "day"
                    ? `${String(bStart.getHours()).padStart(2, "0")}:00`
                    : granularity === "week"
                        ? weekdayLabels[(bStart.getDay() + 6) % 7]
                        : fmtMMDD(bStart);

            if (!inBucket.length) {
                return { name: label, calories: 0, heartRate: 0, t: bStart.toISOString() };
            }

            let cSum = 0, hSum = 0;
            inBucket.forEach((r) => {
                const { calories, heartRate } = toCaloriesAndBpm(r);
                cSum += calories;
                hSum += heartRate;
            });

            return {
                name: label,
                calories: Math.round(cSum / inBucket.length),
                heartRate: Math.round(hSum / inBucket.length),
                t: bStart.toISOString(),
            };
        });

        return NextResponse.json({
            animalId,
            granularity,
            range: { start: start.toISOString(), end: end.toISOString() },
            data: points,
        });
    } catch (e) {
        console.error("[/api/metrics/activity] error:", e);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}


// ------- helpers -------
function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function fmtMMDD(d: Date) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
}
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function getRange(granularity: Granularity, now = new Date()) {
    const end = startOfDay(now);
    if (granularity === "day") {
        const start = new Date(end);
        start.setDate(end.getDate() - 1);
        return { start, end, buckets: 24, bucketHours: 1 };
    }
    if (granularity === "week") {
        const start = addDays(end, -6);
        return { start, end, buckets: 7, bucketHours: 24 };
    }
    const start = addDays(end, -29); // month = 최근 30일(일단위)
    return { start, end, buckets: 30, bucketHours: 24 };
}

// “유의미한 더미 변환”: 활동레벨/섭취량 기반으로 칼로리/심박 생성
function toCaloriesAndBpm(r: RecordItem) {
    const level = r.activity_level;
    const w =
        level === "high" ? 1.0 :
            level === "moderate" ? 0.65 : 0.35;

    // 섭취량 영향(먹은게 많으면 활동량 대비 칼로리 소모 추정 상향)
    const intakeFactor = Math.min(1.3, 0.8 + r.food_intake / 1000); // 0.8~1.3
    const calories = Math.round((180 + 420 * w) * intakeFactor);

    // 심박: 활동레벨 + 수면시간(수면 많으면 전반적 평균 조금 낮아짐)
    const sleepAdj = Math.max(-6, Math.min(2, 2 - (r.sleep_hours - 7)));
    const base =
        level === "high" ? 94 :
            level === "moderate" ? 82 : 72;
    const heartRate = Math.max(
        48,
        Math.round(base + sleepAdj + (Math.sin(Date.parse(r.date) / 1e7) * 4))
    );

    return { calories, heartRate };
}
