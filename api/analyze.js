const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const DETECTIVE_PROMPT = `
Bạn là Thám tử ScamCheck. Giọng văn khô khan, lý tính, không hù dọa.
Chỉ phân tích nội dung người dùng cung cấp, không bịa chi tiết ngoài tin nhắn.
Trả về JSON hợp lệ, không markdown, đúng cấu trúc:
{
  "risk": "An toàn" | "Nghi ngờ" | "Nguy hiểm",
  "signs": [
    { "quote": "đoạn trích nguyên văn từ tin gốc", "reason": "lý do ngắn gọn" }
  ],
  "actions": ["hành động 1", "hành động 2", "hành động 3"]
}
Luôn trả đúng 3 actions. Nếu không có dấu hiệu rõ ràng, risk là "An toàn" và signs có thể là mảng rỗng.
`;

const PSYCHOLOGIST_PROMPT = `
Bạn là Cô tâm lý của ScamCheck.

Nhiệm vụ:
- Giải thích chiêu thức tâm lý mà kẻ lừa đảo sử dụng.
- Giọng điệu gần gũi, nhẹ nhàng.
- Luôn xưng là "cô".
- Luôn gọi người dùng là "bác".
- Chỉ tập trung vào yếu tố tâm lý và cảm xúc.
- Không phân tích kỹ thuật.
- Không đánh giá mức độ rủi ro.
- Không liệt kê dấu hiệu lừa đảo.
- Không hù dọa.
- Không trách móc.
- Không lên giọng dạy dỗ.

Yêu cầu đầu ra:
- Chỉ từ 2 đến 3 câu.
- Trả về văn bản thuần.
- Không markdown.
- Không JSON.
- Không bullet point.
`;

function isConfiguredGeminiKey(key) {
  const normalized = String(key || "")
    .trim()
    .toLowerCase();
  return (
    Boolean(normalized) &&
    normalized !== "your_api_key_here" &&
    normalized !== "your-gemini-api-key" &&
    normalized !== "replace_me" &&
    normalized !== "changeme"
  );
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!isConfiguredGeminiKey(apiKey)) {
    response.status(500).json({ error: "missing_api_key" });
    return;
  }

  const message = String(request.body?.message || "").trim();
  if (!message) {
    response.status(400).json({ error: "empty_message" });
    return;
  }

  if (message.length > 5000) {
    response.status(400).json({ error: "message_too_long" });
    return;
  }

  try {
    const geminiResponse = await fetch(
      `${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${DETECTIVE_PROMPT}\n\nTin nhắn cần kiểm tra:\n${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      response.status(502).json({ error: "gemini_error" });
      return;
    }

    const data = await geminiResponse.json();
    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason === "SAFETY" || finishReason === "RECITATION") {
      response.status(400).json({ error: "refused" });
      return;
    }

    const rawText = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!rawText) {
      response.status(502).json({ error: "empty_response" });
      return;
    }
    let detectiveResult;

    try {
      detectiveResult = JSON.parse(rawText);
    } catch {
      response.status(502).json({ error: "invalid_json" });
      return;
    }

    response.status(200).json({
      rawText,
      detectiveResult,
    });
  } catch {
    response.status(502).json({ error: "server_error" });
  }
};
