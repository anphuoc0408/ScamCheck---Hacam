// Cô tâm lý giải thích chiêu thức tâm lý qua Gemini trên backend.
export async function getPsychologyAdvice(message, detectiveResult)
{
    const response = await fetch("/api/psychology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, detectiveResult })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok)
    {
        throw new Error(data.error || `network ${response.status}`);
    }

    const advice = String(data.text || "").trim();
    if (!advice)
    {
        throw new Error("empty_psychology_response");
    }

    return advice;
}
