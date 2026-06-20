export async function analyzeMessage(message) {

    await new Promise(resolve =>
        setTimeout(resolve, 1000)
    );

    const text = message.toLowerCase();

    // Nguy hiểm
    if (
        text.includes("otp") ||
        text.includes("khóa tài khoản") ||
        text.includes("chuyển tiền") ||
        text.includes("xác minh")
    ) {
        return {
            risk: "Nguy hiểm",

            signs: [
                {
                    quote: "Phát hiện từ khóa nguy hiểm",
                    reason: "Có dấu hiệu lừa đảo hoặc đánh cắp thông tin"
                }
            ],

            actions: [
                "Không cung cấp OTP",
                "Không chuyển tiền",
                "Liên hệ đơn vị chính thức"
            ]
        };
    }

    // Nghi ngờ
    if (
        text.includes("trúng thưởng") ||
        text.includes("quà tặng") ||
        text.includes("miễn phí")
    ) {
        return {
            risk: "Nghi ngờ",

            signs: [
                {
                    quote: "Có nội dung hấp dẫn bất thường",
                    reason: "Cần kiểm tra nguồn gửi"
                }
            ],

            actions: [
                "Không bấm link lạ",
                "Kiểm tra thông tin trước khi tin tưởng"
            ]
        };
    }

    // An toàn
    return {
        risk: "An toàn",

        signs: [
            {
                quote: "Không phát hiện dấu hiệu đáng ngờ",
                reason: "Nội dung có vẻ bình thường"
            }
        ],

        actions: [
            "Tiếp tục thận trọng khi tương tác"
        ]
    };
}