# ScamCheck

Ứng dụng kiểm tra tin nhắn lừa đảo bằng Gemini AI.

## Thành viên

- An Phước
- Quốc Hưng
- Nguyễn Quân
- Thân Quốc Hưng
- Khánh An

## Công nghệ

- HTML / CSS / JavaScript (frontend)
- Node.js + Express (backend, file `server.js`)
- Gemini API

## Cài đặt và chạy

```bash
npm install
cp .env.example .env   # rồi điền GEMINI_API_KEY của bạn vào file .env
npm start
```

Server chạy tại `http://localhost:3000` (hoặc theo biến `PORT` nếu có đặt).
Frontend (`index.html`) được Express phục vụ trực tiếp từ cùng server này,
và gọi Gemini qua route `POST /api/analyze` trên server, **không gọi
Gemini trực tiếp từ trình duyệt** — đây là điểm quan trọng để không lộ
API key ra phía client.

## Biến môi trường (tạo file `.env` ở thư mục gốc)

- `GEMINI_API_KEY`: khóa API Gemini của bạn (lấy tại
  [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)).
- `GEMINI_MODEL` (tùy chọn): tên model, ví dụ `gemini-2.5-flash`. Nếu không
  đặt, server mặc định dùng `gemini-1.5-flash`.
- `GEMINI_API_URL` (tùy chọn, nâng cao): nếu bạn muốn gọi một endpoint
  Gemini-compatible khác thay vì endpoint chính thức của Google, đặt URL đầy
  đủ ở đây. Khi đã đặt biến này, `GEMINI_MODEL` sẽ không được dùng nữa.

**Không bao giờ commit file `.env` thật lên Git** — file này đã có trong
`.gitignore`, chỉ commit `.env.example` (không chứa key thật) để đồng đội
biết cần điền biến gì.

## Lưu ý kỹ thuật

- Cần Node.js 18+ (dùng `fetch` toàn cục). Nếu máy bạn dùng Node cũ hơn,
  cài thêm `node-fetch@2`.
- Khi Gemini từ chối phân tích nội dung (do bộ lọc an toàn của Google),
  server trả mã `422` kèm `error: "refused"` và `message` giải thích lý do
  cụ thể — frontend (`script.js`) đọc đúng field này để hiển thị thông báo
  thân thiện cho người dùng.
