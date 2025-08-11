export function corsHeaders(originFromReq?: string | null) {
    const allowOrigin = process.env.ALLOW_ORIGIN || originFromReq || "*";
    return {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
}