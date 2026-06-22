const sampleMessages = {
    bank: "THÔNG BÁO: Tài khoản ngân hàng của quý khách đang bị khóa do nghi ngờ giao dịch bất thường. Vui lòng đăng nhập ngay tại https://secure-vcb-xacminh.com và nhập OTP để xác minh trong 15 phút.",
    police:
        "Tôi là cán bộ công an. Số căn cước của anh/chị liên quan đến đường dây rửa tiền. Để chứng minh vô tội, chuyển ngay 35 triệu đồng vào tài khoản tạm giữ và không được báo cho người thân.",
    prize:
        "Chúc mừng thuê bao của bạn đã trúng thưởng iPhone 15 Pro Max. Bấm vào bit.ly/nhan-qua-ngay và đóng phí hồ sơ 299.000đ để nhận quà trong hôm nay.",
};

// Cau hinh chinh va cac khoa localStorage dung trong trinh duyet.
const HISTORY_KEY = "scamcheck_history";
const MAX_HISTORY = 10;
const MAX_LENGTH = 5000;
const THEME_STORAGE = "scamcheck_theme";
const TUTORIAL_STORAGE = "scamcheck_tutorial_seen";
const PRODUCT_URL = "https://scamcheck-hacam.onrender.com/";
const TRAINING_DATA_URL = "data/training-messages.json";
const TRAINING_POOL_COUNT = 15;
const TRAINING_QUIZ_COUNT = 10;
const LINK_PATTERN =
    /(?:https?:\/\/|www\.)[^\s<>"'`]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com\.vn|net\.vn|org\.vn|edu\.vn|gov\.vn|vn|com|net|org|info|biz|io|co|me|app|dev|link|ly|gl|cc|top|xyz|shop|site|online|icu|click|live|asia|store|vip|cloud|at|so|id|in)(?:\/[^\s<>"'`]*)?/gi;
const KNOWN_PUBLIC_SUFFIXES = [
    "com.vn",
    "net.vn",
    "org.vn",
    "edu.vn",
    "gov.vn",
];
const SHORTENER_DOMAINS = new Set([
    "bit.ly",
    "bitly.com",
    "tinyurl.com",
    "goo.gl",
    "t.co",
    "is.gd",
    "ow.ly",
    "rebrand.ly",
    "cutt.ly",
    "s.id",
    "shorturl.at",
    "bom.so",
    "vnurl.net",
    "short.io",
    "lnkd.in",
]);
const OFFICIAL_ORGANIZATIONS = [
    {
        name: "Vietcombank",
        aliases: ["vietcombank", "vcb"],
        domains: ["vietcombank.com.vn", "vcb.com.vn"],
    },
    {
        name: "VietinBank",
        aliases: ["vietinbank", "vietin"],
        domains: ["vietinbank.vn"],
    },
    { name: "BIDV", aliases: ["bidv"], domains: ["bidv.com.vn"] },
    {
        name: "Techcombank",
        aliases: ["techcombank", "tcb"],
        domains: ["techcombank.com"],
    },
    { name: "Agribank", aliases: ["agribank"], domains: ["agribank.com.vn"] },
    { name: "MBBank", aliases: ["mbbank"], domains: ["mbbank.com.vn"] },
    { name: "ACB", aliases: ["acb"], domains: ["acb.com.vn"] },
    { name: "VPBank", aliases: ["vpbank"], domains: ["vpbank.com.vn"] },
    { name: "TPBank", aliases: ["tpbank"], domains: ["tpb.vn", "tpbank.vn"] },
    { name: "MoMo", aliases: ["momo"], domains: ["momo.vn"] },
    { name: "VNPay", aliases: ["vnpay"], domains: ["vnpay.vn"] },
    { name: "ZaloPay", aliases: ["zalopay"], domains: ["zalopay.vn"] },
    {
        name: "Bộ Công an",
        aliases: ["bocongan", "congan"],
        domains: ["bocongan.gov.vn"],
    },
    { name: "VNeID", aliases: ["vneid"], domains: ["vneid.gov.vn"] },
    { name: "VNPost", aliases: ["vnpost"], domains: ["vnpost.vn"] },
    {
        name: "Giao Hàng Nhanh",
        aliases: ["ghn", "giaohangnhanh"],
        domains: ["ghn.vn"],
    },
    {
        name: "Giao Hàng Tiết Kiệm",
        aliases: ["ghtk", "giaohangtietkiem"],
        domains: ["giaohangtietkiem.vn", "ghtk.vn"],
    },
    {
        name: "Viettel Post",
        aliases: ["viettelpost"],
        domains: ["viettelpost.com.vn"],
    },
    {
        name: "J&T Express",
        aliases: ["jtexpress", "jnt"],
        domains: ["jtexpress.vn"],
    },
    {
        name: "Shopee Express",
        aliases: ["spx", "shopeeexpress"],
        domains: ["spx.vn"],
    },
];
const SUSPICIOUS_DOMAIN_WORDS = [
    "xacminh",
    "capnhat",
    "baomat",
    "khoa",
    "mokhoa",
    "hotro",
    "khancap",
    "kiemtra",
    "nhanqua",
    "trungthuong",
    "thanhtoan",
    "lephi",
    "hoantien",
    "hoso",
    "dieutra",
    "baolanh",
];

// Ket qua du phong giu cho giao dien khong bi gay khi AI tra ve sai cau truc.
const DEFAULT_RESULT = {
    risk: "Nghi ngờ",
    signs: [],
    actions: [
        "Không bấm vào liên kết lạ.",
        "Không cung cấp OTP, mật khẩu hoặc thông tin cá nhân.",
        "Liên hệ kênh chính thức để kiểm tra lại.",
    ],
    usedFallback: true,
};

const RESPONDER_GUIDELINES = {
    none: {
        text: "🟢 <strong>Bác đã xử lý rất an toàn!</strong> Hãy xóa ngay tin nhắn này khỏi điện thoại của bác. Tuyệt đối không bấm hay làm theo bất kỳ hướng dẫn nào từ nguồn gửi đáng ngờ này.",
        class: "guidance-none",
    },
    clicked: {
        text: "⚠️ <strong>Chỉ dẫn khẩn cấp khi lỡ bấm link:</strong><br>1. Hãy tạm thời <strong>ngắt ngay lập tức kết nối mạng Wi-Fi hoặc 3G/4G</strong> trên điện thoại.<br>2. Tuyệt đối không đăng nhập tài khoản ngân hàng hay ví điện tử vào lúc này.<br>3. Mang điện thoại của bác tới các trung tâm dịch vụ uy tín để kiểm tra, quét mã độc ẩn.",
        class: "guidance-clicked",
    },
    transferred: {
        text: "🚨 <strong>Hành động ngay lập tức - Bác đã chuyển tiền:</strong><br>1. Hãy gọi điện trực tiếp lên <strong>Tổng đài hỗ trợ của ngân hàng bác đang dùng</strong>, yêu cầu hỗ trợ khẩn cấp phong tỏa tài khoản hoặc dòng tiền vừa giao dịch.<br>2. Chụp ảnh lại màn hình giao dịch chuyển khoản đầy đủ thông tin.<br>3. Chuẩn bị bằng chứng và tới ngay đồn Công an gần nhất để làm đơn trình báo lừa đảo.",
        class: "guidance-transferred",
    },
    otp: {
        text: "❌ <strong>Cảnh báo cực kỳ nguy hiểm - Lộ mã xác thực:</strong><br>1. Hãy liên hệ ngay với ngân hàng của bác để <strong>khóa khẩn cấp chức năng giao dịch trực tuyến (Internet Banking)</strong>.<br>2. Đổi mật khẩu tài khoản ngân hàng ngay lập tức trên một thiết bị an toàn khác để bảo toàn số dư.",
        class: "guidance-otp",
    },
}; //

// Ham cu tu ban dau, giu lai de tranh pha vo neu file khac dang goi.
function parseAIResponse(aiText)
{
    try
    {
        if (!aiText) return DEFAULT_RESULT;

        const parsedData = JSON.parse(aiText);

        if (!parsedData.risk || !parsedData.actions)
        {
            return DEFAULT_RESULT;
        }

        return parsedData;
    } catch (error)
    {
        console.warn("AI trả về dữ liệu lỗi, kích hoạt dự phòng!", error);
        return DEFAULT_RESULT;
    }
}

const FALLBACK_SCAM_LIBRARY = [
    {
        id: "bank-account-lock",
        name: "Khóa tài khoản khẩn cấp",
        group: "GIẢ NGÂN HÀNG",
        description:
            "Kẻ lừa đảo giả danh ngân hàng, tạo cảm giác tài khoản đang gặp nguy hiểm để ép người nhận bấm vào liên kết và nhập thông tin đăng nhập hoặc mã OTP.",
        exampleMessage:
            "Tài khoản ngân hàng của quý khách đang bị khóa do phát hiện giao dịch bất thường. Vui lòng xác minh ngay tại https://secure-bank-capnhat.com trong 15 phút.",
    },
    {
        id: "bank-otp-verification",
        name: "Yêu cầu cung cấp OTP",
        group: "GIẢ NGÂN HÀNG",
        description:
            "Tin nhắn yêu cầu người dùng gửi mã OTP, mã xác thực hoặc mật khẩu với lý do hỗ trợ giao dịch.",
        exampleMessage:
            "Giao dịch của bạn đang bị treo. Vui lòng gửi lại mã OTP vừa nhận được để nhân viên ngân hàng hoàn tất xác minh.",
    },
    {
        id: "bank-fee-refund",
        name: "Hoàn phí dịch vụ giả",
        group: "GIẢ NGÂN HÀNG",
        description:
            "Kẻ gian hứa hoàn phí, hoàn tiền hoặc nhận ưu đãi ngân hàng để dụ người nhận truy cập trang giả mạo.",
        exampleMessage:
            "Bạn được hoàn 680.000đ phí thường niên. Bấm vào https://refund-bank-vn.com và điền thông tin thẻ để nhận tiền.",
    },
    {
        id: "bank-fake-loan-approval",
        name: "Duyệt khoản vay giả",
        group: "GIẢ NGÂN HÀNG",
        description:
            "Tin nhắn báo duyệt vay hoặc tăng hạn mức, sau đó yêu cầu đóng phí hồ sơ trước khi giải ngân.",
        exampleMessage:
            "Hồ sơ vay 50.000.000đ đã được duyệt. Đóng phí bảo hiểm 450.000đ tại https://vaynhanh-bankvn.com để giải ngân.",
    },
    {
        id: "police-criminal-case",
        name: "Liên quan vụ án",
        group: "GIẢ CƠ QUAN CÔNG AN",
        description:
            "Đối tượng tự xưng là công an hoặc điều tra viên, nói người nhận liên quan đến vụ án để gây hoảng sợ.",
        exampleMessage:
            "Số căn cước của anh/chị có liên quan đến đường dây rửa tiền. Chuyển 30 triệu vào tài khoản tạm giữ để xác minh.",
    },
    {
        id: "police-court-summons",
        name: "Giấy triệu tập giả",
        group: "GIẢ CƠ QUAN CÔNG AN",
        description:
            "Tin nhắn gửi đường dẫn hoặc tệp giả mạo giấy triệu tập, biên bản phạt hoặc lệnh điều tra.",
        exampleMessage:
            "Bạn có giấy triệu tập khẩn cấp. Tải hồ sơ tại https://congan-hoso-khan.com để xem lịch làm việc.",
    },
    {
        id: "police-sim-lock-warning",
        name: "Đe dọa khóa SIM vì vi phạm",
        group: "GIẢ CƠ QUAN CÔNG AN",
        description:
            "Kẻ lừa đảo nói số điện thoại vi phạm pháp luật hoặc sắp bị khóa để ép người nhận xác minh qua kênh giả.",
        exampleMessage:
            "Số thuê bao của bạn bị ghi nhận vi phạm. Bấm vào https://xacminh-congan24h.com để khai báo trong 2 giờ.",
    },
    {
        id: "police-fake-video-call",
        name: "Gọi video điều tra giả",
        group: "GIẢ CƠ QUAN CÔNG AN",
        description:
            "Đối tượng yêu cầu gọi video, giữ bí mật và quay giấy tờ hoặc ứng dụng ngân hàng để lấy thông tin.",
        exampleMessage:
            "Vào cuộc gọi video với điều tra viên ngay. Chuẩn bị CCCD, mở ứng dụng ngân hàng và không tắt máy trong lúc xác minh.",
    },
    {
        id: "prize-phone",
        name: "Trúng điện thoại giá trị cao",
        group: "TRÚNG THƯỞNG",
        description:
            "Tin nhắn thông báo trúng điện thoại hoặc quà lớn dù người nhận không tham gia chương trình nào.",
        exampleMessage:
            "Chúc mừng bạn đã trúng iPhone 15 Pro Max. Vui lòng đóng phí hồ sơ 299.000đ để nhận quà.",
    },
    {
        id: "prize-cash-transfer",
        name: "Nhận tiền thưởng giả",
        group: "TRÚNG THƯỞNG",
        description:
            "Kẻ gian hứa chuyển khoản tiền thưởng nhưng yêu cầu nhập tài khoản, mật khẩu hoặc trả trước một khoản phí.",
        exampleMessage:
            "Bạn đã trúng 20.000.000đ từ chương trình tri ân. Xác nhận tài khoản nhận thưởng tại https://quatang-tienmat.com.",
    },
    {
        id: "prize-lucky-spin",
        name: "Vòng quay may mắn giả",
        group: "TRÚNG THƯỞNG",
        description:
            "Tin nhắn mời tham gia vòng quay hoặc khảo sát nhận quà, sau đó yêu cầu thông tin cá nhân hoặc phí nhận quà.",
        exampleMessage:
            "Bạn còn 1 lượt quay may mắn miễn phí. Vào https://vongquay-trian.com để nhận phần thưởng.",
    },
    {
        id: "delivery-address-fail",
        name: "Không giao được vì sai địa chỉ",
        group: "GIẢ ĐƠN VỊ GIAO HÀNG",
        description:
            "Đối tượng giả danh đơn vị vận chuyển, báo đơn hàng lỗi địa chỉ để dụ người nhận bấm link cập nhật.",
        exampleMessage:
            "Đơn hàng giao không thành công do thiếu số nhà. Cập nhật địa chỉ tại https://giaohang-capnhat.com.",
    },
    {
        id: "delivery-extra-fee",
        name: "Yêu cầu thanh toán phí phát sinh",
        group: "GIẢ ĐƠN VỊ GIAO HÀNG",
        description:
            "Tin nhắn yêu cầu trả thêm phí lưu kho, phí hải quan hoặc phí giao lại với số tiền nhỏ.",
        exampleMessage:
            "Kiện hàng đang bị giữ tại kho do thiếu phí xử lý 18.000đ. Thanh toán tại https://ship-fee-vn.com.",
    },
    {
        id: "delivery-fake-tracking",
        name: "Mã vận đơn giả",
        group: "GIẢ ĐƠN VỊ GIAO HÀNG",
        description:
            "Kẻ lừa đảo gửi mã vận đơn hoặc trạng thái giao hàng giả để người nhận mở đường dẫn theo dõi.",
        exampleMessage:
            "Mã vận đơn GH938201 vừa cập nhật trạng thái. Xem chi tiết tại https://tracking-ghn-vn.com.",
    },
    {
        id: "delivery-customs-tax",
        name: "Phí hải quan đơn quốc tế giả",
        group: "GIẢ ĐƠN VỊ GIAO HÀNG",
        description:
            "Tin nhắn giả danh giao hàng quốc tế, báo kiện bị giữ hải quan và yêu cầu đóng phí qua đường dẫn lạ.",
        exampleMessage:
            "Bưu kiện quốc tế đang bị giữ tại hải quan. Đóng thuế 42.000đ tại https://customs-ship-vn.com để thông quan.",
    },
];

// Du lieu du phong cho che do luyen tap khi file JSON khong tai duoc.
const FALLBACK_TRAINING_MESSAGES = [
    {
        id: "training-scam-bank-limit",
        message:
            "TK cua quy khach bi gioi han giao dich do dang nhap la. Xac minh trong 20 phut tai https://vietcombank-capnhat24h.com neu khong se tam khoa dich vu.",
        label: "scam",
        category: "Gia ngan hang",
        explanation:
            "Tin tao ap luc thoi gian, gan danh ngan hang va dua den ten mien la khong phai ten mien chinh thuc cua ngan hang.",
    },
    {
        id: "training-safe-bank-warning",
        message:
            "Vietcombank khuyen cao khach hang khong cung cap OTP, mat khau cho bat ky ai. Neu nghi ngo, vui long goi tong dai in tren mat sau the hoac ung dung chinh thuc.",
        label: "safe",
        category: "Canh bao an toan",
        explanation:
            "Tin khong yeu cau bam link, khong doi OTP va huong nguoi nhan ve kenh chinh thuc.",
    },
    {
        id: "training-scam-police-app",
        message:
            "Toi la dieu tra vien. So CCCD cua anh chi lien quan ho so rua tien. Tai ung dung lam viec tai http://congan-dieutra-hoso.net va nop tien bao lanh de tranh bi bat.",
        label: "scam",
        category: "Gia co quan cong an",
        explanation:
            "Co quan cong an khong yeu cau tai ung dung qua link la, nop tien bao lanh qua tin nhan hay giu bi mat voi nguoi than.",
    },
    {
        id: "training-safe-family",
        message:
            "Me nho con toi nay ve som an com. Neu mua duoc thi ghe cho mua them it rau va sua tuoi.",
        label: "safe",
        category: "Tin ca nhan",
        explanation:
            "Noi dung doi thuong, khong co lien ket, khong yeu cau tien gap, OTP hay thong tin nhay cam.",
    },
    {
        id: "training-scam-delivery-fee",
        message:
            "Don hang GH78320 thieu phi luu kho 18.000d. Thanh toan ngay tai https://ghn-thanhtoan-lephi.vip de duoc giao lai trong hom nay.",
        label: "scam",
        category: "Gia don vi giao hang",
        explanation:
            "Tin yeu cau tra phi nho qua ten mien la co gan ten don vi giao hang, day la cach lua dao rat pho bien.",
    },
    {
        id: "training-safe-delivery",
        message:
            "Don hang cua ban du kien giao trong hom nay. Shipper se goi truoc khi den. Ban co the kiem tra ma van don tren ung dung mua hang da dat.",
        label: "safe",
        category: "Thong bao giao hang",
        explanation:
            "Tin chi thong bao trang thai giao hang, khong chen link la va khong yeu cau thanh toan hay cung cap thong tin rieng.",
    },
    {
        id: "training-scam-prize-fee",
        message:
            "Chuc mung ban trung thuong xe may Vision. Vui long nop phi ho so 350.000d tai bit.ly/nhanxe2026 truoc 17h de giu suat nhan qua.",
        label: "scam",
        category: "Trung thuong",
        explanation:
            "Nguoi nhan khong tham gia chuong trinh nhung bi yeu cau nop phi truoc qua link rut gon, day la dau hieu lua dao.",
    },
    {
        id: "training-safe-school",
        message:
            "Lop 12A1 hop phu huynh luc 19h30 thu Sau tai phong 203. Noi dung gom lich on thi va ke hoach tong ket hoc ky.",
        label: "safe",
        category: "Thong bao lop hoc",
        explanation:
            "Thong bao co thoi gian va dia diem ro rang, khong yeu cau chuyen tien gap hay truy cap duong dan bat thuong.",
    },
    {
        id: "training-scam-job-task",
        message:
            "Nhan viec online luong 500k/ngay. Chuyen truoc 200k kich hoat tai khoan, sau 5 phut he thong hoan lai ca goc lan hoa hong.",
        label: "scam",
        category: "Viec lam gia",
        explanation:
            "Loi hua thu nhap cao bat thuong va yeu cau chuyen tien truoc la dau hieu cua lua dao viec lam, nhiem vu ao.",
    },
    {
        id: "training-safe-electricity",
        message:
            "Hoa don tien dien thang nay da phat hanh. Gia dinh co the thanh toan qua ung dung ngan hang dang su dung hoac diem thu gan nha.",
        label: "safe",
        category: "Thong bao dich vu",
        explanation:
            "Tin chi nhac thanh toan qua cac kenh quen thuoc, khong gui link la hay doi thong tin dang nhap.",
    },
    {
        id: "training-scam-investment-profit",
        message:
            "Dau tu goi AI loi nhuan 30% moi tuan. Nap toi thieu 1.000.000d vao vi rieng, cam ket hoan von trong 7 ngay neu khong co loi.",
        label: "scam",
        category: "Dau tu loi nhuan cao",
        explanation:
            "Cam ket loi nhuan cao, hoan von va yeu cau nap tien vao vi rieng la dau hieu lua dao dau tu.",
    },
    {
        id: "training-safe-clinic",
        message:
            "Phong kham thong bao lich tai kham cua bac si Minh vao 8h30 ngay 20/06. Neu can doi lich, vui long goi so tong dai da in tren phieu hen.",
        label: "safe",
        category: "Thong bao y te",
        explanation:
            "Tin co noi dung hen lich ro rang, khong yeu cau bam link la, chuyen tien gap hay cung cap ma xac thuc.",
    },
    {
        id: "training-scam-social-account",
        message:
            "Tai khoan Facebook cua ban bi to cao vi pham ban quyen. Xac minh chu so huu tai https://meta-baomat-page.com trong 12 gio neu khong page se bi khoa.",
        label: "scam",
        category: "Chiem tai khoan mang xa hoi",
        explanation:
            "Tin gia danh nen tang mang xa hoi, tao ap luc khoa tai khoan va dua den ten mien khong chinh thuc de lay mat khau.",
    },
    {
        id: "training-safe-store-promo",
        message:
            "Cua hang da gui ma giam gia 10% cho don hang tiep theo. Ma co the nhap truc tiep trong ung dung mua hang, khong can cung cap thong tin ca nhan.",
        label: "safe",
        category: "Khuyen mai an toan",
        explanation:
            "Tin khuyen mai khong bat bam link, khong doi phi truoc va khong yeu cau thong tin dang nhap hay OTP.",
    },
    {
        id: "training-scam-tax-refund",
        message:
            "Ho so hoan thue ca nhan cua ban duoc duyet 2.400.000d. Cap nhat so tai khoan nhan tien tai https://thue-hoantien-gov.com truoc 16h hom nay.",
        label: "scam",
        category: "Gia co quan nha nuoc",
        explanation:
            "Tin dung chu de hoan thue de du nguoi nhan vao ten mien gia mao co chu gov, nhung khong phai cong dich vu cong chinh thuc.",
    },
];

const input = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");
const checkBtn = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const themeToggle = document.getElementById("themeToggle");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const loadingArea = document.getElementById("loadingArea");
const resultArea = document.getElementById("resultArea");
const riskBadge = document.getElementById("riskBadge");
const highlightedMessage = document.getElementById("highlightedMessage");
const signList = document.getElementById("signList");
const actionList = document.getElementById("actionList");
const rawResponse = document.getElementById("rawResponse");
const psychologyAdvice = document.getElementById("psychologyAdvice");
const friendlyMessage = document.getElementById("friendlyMessage");
const historyList = document.getElementById("historyList");
const checkView = document.getElementById("checkView");
const linkView = document.getElementById("linkView");
const libraryView = document.getElementById("libraryView");
const viewTabs = document.querySelector(".view-tabs");
const checkTab = document.getElementById("checkTab");
const linkTab = document.getElementById("linkTab");
const libraryTab = document.getElementById("libraryTab");
const trainingTab = document.getElementById("trainingTab");
const backToCheckBtn = document.getElementById("backToCheckBtn");
const libraryFilters = document.getElementById("libraryFilters");
const libraryList = document.getElementById("libraryList");
const libraryDetail = document.getElementById("libraryDetail");
const libraryStatus = document.getElementById("libraryStatus");
const trainingView = document.getElementById("trainingView");
const backFromTrainingBtn = document.getElementById("backFromTrainingBtn");
const trainingStatus = document.getElementById("trainingStatus");
const trainingIntro = document.getElementById("trainingIntro");
const startTrainingBtn = document.getElementById("startTrainingBtn");
const trainingCard = document.getElementById("trainingCard");
const trainingProgress = document.getElementById("trainingProgress");
const trainingScore = document.getElementById("trainingScore");
const trainingMessage = document.getElementById("trainingMessage");
const trainingAnswerButtons = document.querySelector(
    ".training-answer-buttons",
);
const guessScamBtn = document.getElementById("guessScamBtn");
const guessSafeBtn = document.getElementById("guessSafeBtn");
const trainingFeedback = document.getElementById("trainingFeedback");
const nextTrainingBtn = document.getElementById("nextTrainingBtn");
const trainingSummary = document.getElementById("trainingSummary");
const trainingSummaryScore = document.getElementById("trainingSummaryScore");
const trainingSummaryComment = document.getElementById(
    "trainingSummaryComment",
);
const restartTrainingBtn = document.getElementById("restartTrainingBtn");
const linkScanPanel = document.getElementById("linkScanPanel");
const linkInput = document.getElementById("linkInput");
const linkCharCount = document.getElementById("linkCharCount");
const linkClearBtn = document.getElementById("linkClearBtn");
const linkScanStatus = document.getElementById("linkScanStatus");
const linkScanList = document.getElementById("linkScanList");
const warningCardPanel = document.getElementById("warningCardPanel");
const warningCardCanvas = document.getElementById("warningCardCanvas");
const downloadWarningCardBtn = document.getElementById(
    "downloadWarningCardBtn",
);
const warningCardStatus = document.getElementById("warningCardStatus");
const tutorialModal = document.getElementById("tutorialModal");
const tutorialOpenBtn = document.getElementById("tutorialOpenBtn");
const tutorialCloseBtn = document.getElementById("tutorialCloseBtn");
const tutorialDoneBtn = document.getElementById("tutorialDoneBtn");
const responderQuestionArea = document.getElementById("responderQuestionArea"); //
const btnResponds = document.querySelectorAll(".btn-respond"); //
const responderGuidance = document.getElementById("responderGuidance"); //

// Trang hien tai khong dung framework, nen trang thai duoc giu bang cac bien nho nay.
let scamLibrary = [];
let activeLibraryGroup = "Tất cả";
let selectedLibraryId = "";
let latestWarningCardName = "scamcheck-warning-card.png";
let trainingPool = [];
let trainingItems = [];
let trainingIndex = 0;
let trainingPoints = 0;
let trainingAnswered = false;
let latestAnalysis = null;
const VIEW_NAMES = ["check", "link", "library", "training"];
const VIEW_ORDER = { check: 0, link: 1, library: 2, training: 3 };
const VIEW_EXIT_DELAY = 90;
const VIEW_ENTER_DURATION = 580;
const THEME_TRANSITION_DURATION = 900;
let activeViewName = "check";
let viewSwitchTimer = null;
let viewEnterTimer = null;
let themeSwitchTimer = null;

// Gemini is called only through the local backend so the API key never appears in the browser.
async function analyzeMessage(message)
{
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try
    {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({ message }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok)
        {
            // Một số lỗi server trả kèm "message" thân thiện sẵn (ví dụ lý do bị
            // từ chối: SAFETY/RECITATION) - giữ nguyên message này thay vì chỉ
            // ném error code, để showMessage() bên dưới đọc được nội dung gốc.
            const err = new Error(data.error || `network ${response.status}`);
            if (data.message) err.friendlyMessage = data.message;
            throw err;
        }

        const rawText = data.rawText || data.text || "";
        if (!rawText)
        {
            throw new Error("empty_response");
        }

        return {
            rawText,
            detectiveResult: data.detectiveResult,
        };
    } catch (error)
    {
        if (error?.name === "AbortError")
        {
            throw new Error("timeout");
        }
        throw error;
    } finally
    {
        clearTimeout(timeoutId);
    }
}

async function analyzeWithPsychology(message)
{
    const detectiveResponse = await analyzeMessage(message);
    const detectiveResult = normalizeStructuredResult(
        detectiveResponse.detectiveResult,
    );

    let psychologyAdvice = null;
    if (
        detectiveResult.risk === "Nghi ngờ" ||
        detectiveResult.risk === "Nguy hiểm"
    )
    {
        try
        {
            const { getPsychologyAdvice } = await import("./js/psychologist.js");
            psychologyAdvice = await getPsychologyAdvice(message, detectiveResult);
        } catch (error)
        {
            console.warn("Psychology advice error", error);
            psychologyAdvice = "Cô tâm lý đang bận, vui lòng thử lại sau.";
        }
    }

    return {
        rawText: detectiveResponse.rawText,
        detectiveResult,
        psychologyAdvice,
    };
}

// Chuan hoa JSON cua AI ve mot format duy nhat de renderResult chi can doc mot kieu du lieu.
function normalizeStructuredResult(data)
{
    const risk = normalizeRisk(data?.risk);
    const signs = Array.isArray(data?.signs)
        ? data.signs
            .map((sign) => ({
                quote: String(sign?.quote || "").trim(),
                reason: String(sign?.reason || "").trim(),
            }))
            .filter((sign) => sign.quote || sign.reason)
        : [];

    const actions = Array.isArray(data?.actions)
        ? data.actions
            .map((action) => String(action || "").trim())
            .filter(Boolean)
            .slice(0, 3)
        : [];

    return {
        risk,
        signs,
        actions: fillActions(actions),
        usedFallback: false,
    };
}

function normalizeRisk(risk)
{
    const value = String(risk || "").toLowerCase();
    if (value.includes("an")) return "An toàn";
    if (value.includes("nguy")) return "Nguy hiểm";
    return "Nghi ngờ";
}

function fillActions(actions)
{
    const result = [...actions];
    for (const fallbackAction of DEFAULT_RESULT.actions)
    {
        if (result.length >= 3) break;
        if (!result.includes(fallbackAction)) result.push(fallbackAction);
    }
    return result.slice(0, 3);
}

function getHistory()
{
    try
    {
        const items = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(items) ? items.slice(0, MAX_HISTORY) : [];
    } catch
    {
        return [];
    }
}

function addHistoryItem(item)
{
    const history = getHistory();
    const next = [item, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function clearHistory()
{
    localStorage.removeItem(HISTORY_KEY);
}

function setLoading(isLoading)
{
    loadingArea.classList.toggle("hidden", !isLoading);
}

function showMessage(text, isError = false)
{
    friendlyMessage.textContent = text;
    friendlyMessage.classList.toggle("error", isError);
}

function listen(target, eventName, handler)
{
    if (!target) return;
    target.addEventListener(eventName, handler);
}

// First-use guide: stored locally so returning users are not interrupted again.
function hasSeenTutorial()
{
    try
    {
        return localStorage.getItem(TUTORIAL_STORAGE) === "true";
    } catch
    {
        return true;
    }
}

function openTutorial()
{
    if (!tutorialModal) return;
    tutorialModal.classList.remove("hidden");
    tutorialDoneBtn?.focus();
}

function closeTutorial()
{
    if (!tutorialModal) return;
    tutorialModal.classList.add("hidden");
    try
    {
        localStorage.setItem(TUTORIAL_STORAGE, "true");
    } catch
    {
        /* Ignore storage errors; the popup can safely show again next time. */
    }
}

function initializeTutorial()
{
    if (!tutorialModal || hasSeenTutorial()) return;
    setTimeout(openTutorial, 350);
}

// URL scanner is deliberately local: it warns before the user opens any link.
function updateLinkScan()
{
    if (!linkScanPanel || !linkScanList || !linkScanStatus) return;

    const sourceText = linkInput ? linkInput.value : input.value;
    const links = extractLinksFromText(sourceText);
    linkScanList.innerHTML = "";

    if (links.length === 0)
    {
        linkScanStatus.textContent = "Chưa có đường dẫn.";
        linkScanStatus.className = "link-scan-status";
        return;
    }

    const dangerousCount = links.filter(
        (link) => link.severity === "danger",
    ).length;
    const warningCount = links.filter(
        (link) => link.severity === "warning",
    ).length;

    if (dangerousCount > 0)
    {
        linkScanStatus.textContent = `${links.length} đường dẫn, ${dangerousCount} cảnh báo nguy hiểm`;
        linkScanStatus.className = "link-scan-status danger";
    } else if (warningCount > 0)
    {
        linkScanStatus.textContent = `${links.length} đường dẫn, ${warningCount} cần kiểm tra`;
        linkScanStatus.className = "link-scan-status warning";
    } else
    {
        linkScanStatus.textContent = `${links.length} đường dẫn chưa thấy giả mạo rõ`;
        linkScanStatus.className = "link-scan-status safe";
    }

    links.forEach((link) =>
    {
        const item = document.createElement("article");
        item.className = `link-scan-item ${link.severity}`;

        const reasons =
            link.warnings.length > 0
                ? link.warnings
                : [
                    {
                        title: link.officialOrg
                            ? "Tên miền chính thống"
                            : "Chưa xác định tổ chức",
                        detail: link.officialOrg
                            ? `Tên miền này khớp với ${link.officialOrg.name}.`
                            : "ScamCheck chưa thấy tên miền này giả mạo tổ chức trong danh sách, nhưng bạn vẫn nên kiểm tra nguồn gửi.",
                    },
                ];

        item.innerHTML = `
            <div class="link-scan-head">
                <strong>${escapeHtml(link.host)}</strong>
                <span>${escapeHtml(link.label)}</span>
            </div>
            <code>${escapeHtml(link.raw)}</code>
            <ul>
                ${reasons.map((reason) => `<li><strong>${escapeHtml(reason.title)}:</strong> ${escapeHtml(reason.detail)}</li>`).join("")}
            </ul>
        `;
        linkScanList.appendChild(item);
    });
}

function updateLinkCounter()
{
    if (!linkInput || !linkCharCount) return;
    linkCharCount.textContent = `${linkInput.value.length}/${MAX_LENGTH} ký tự`;
}

function syncLinkScannerWithMessage(message)
{
    if (!linkInput) return;
    linkInput.value = message || "";
    updateLinkCounter();
    updateLinkScan();
}

function prepareLinkScanner()
{
    if (linkInput && !linkInput.value.trim() && input?.value.trim())
    {
        linkInput.value = input.value;
    }

    updateLinkCounter();
    updateLinkScan();
}

function extractLinksFromText(text)
{
    const value = String(text || "");
    const results = [];
    const seen = new Set();
    LINK_PATTERN.lastIndex = 0;

    let match;
    while ((match = LINK_PATTERN.exec(value)) !== null)
    {
        const previousChar = value[match.index - 1] || "";
        if (previousChar === "@") continue;

        const raw = cleanRawLink(match[0]);
        if (!raw || seen.has(raw.toLowerCase())) continue;

        const parsed = parseLink(raw);
        if (!parsed) continue;

        seen.add(raw.toLowerCase());
        results.push(analyzeLink(parsed));
    }

    return results;
}

function cleanRawLink(raw)
{
    return String(raw || "")
        .trim()
        .replace(/^[([{<]+/, "")
        .replace(/[)\]}>.,!?;:]+$/g, "");
}

function parseLink(raw)
{
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw)
        ? raw
        : `https://${raw}`;
    try
    {
        const url = new URL(candidate);
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (!host || !host.includes(".")) return null;
        return {
            raw,
            href: url.href,
            host,
            rootDomain: getRootDomain(host),
        };
    } catch
    {
        return null;
    }
}

function analyzeLink(link)
{
    const warnings = [];
    const officialOrg = OFFICIAL_ORGANIZATIONS.find((org) =>
        isOfficialHost(link.host, org),
    );
    const shortener =
        SHORTENER_DOMAINS.has(link.rootDomain) || SHORTENER_DOMAINS.has(link.host);

    if (shortener)
    {
        warnings.push({
            title: "Link rút gọn",
            detail:
                "Đường dẫn bị che tên miền thật. Chỉ mở sau khi kiểm tra nguồn gửi hoặc dùng công cụ mở rộng link.",
        });
    }

    if (!officialOrg)
    {
        const spoofWarnings = detectSpoofedDomain(link.host);
        warnings.push(...spoofWarnings);
    }

    const hasDanger = warnings.some(
        (warning) =>
            warning.title.includes("giả mạo") ||
            warning.title.includes("gần giống") ||
            warning.title.includes("thay thế"),
    );
    const severity = hasDanger
        ? "danger"
        : warnings.length > 0
            ? "warning"
            : officialOrg
                ? "safe"
                : "neutral";

    return {
        ...link,
        officialOrg,
        warnings,
        severity,
        label: getLinkLabel(severity, officialOrg),
    };
}

function getLinkLabel(severity, officialOrg)
{
    if (severity === "danger") return "Cảnh báo giả mạo";
    if (severity === "warning") return "Cần kiểm tra";
    if (officialOrg) return "Chính thống";
    return "Chưa xác định";
}

function detectSpoofedDomain(host)
{
    const warnings = [];
    const compactHost = compactDomainText(host);
    const normalizedHost = normalizeLookalikeText(host);
    const suspiciousWord = SUSPICIOUS_DOMAIN_WORDS.find((word) =>
        normalizedHost.includes(word),
    );

    OFFICIAL_ORGANIZATIONS.forEach((org) =>
    {
        org.aliases.forEach((alias) =>
        {
            const compactAlias = compactDomainText(alias);
            const normalizedAlias = normalizeLookalikeText(alias);
            if (normalizedAlias.length < 3) return;

            if (compactHost.includes(compactAlias))
            {
                warnings.push({
                    title: "Tên miền giả mạo tổ chức",
                    detail: `${host} có nhắc tới ${org.name} nhưng không thuộc tên miền chính thức của tổ chức này.`,
                });
                return;
            }

            if (normalizedHost.includes(normalizedAlias))
            {
                warnings.push({
                    title: "Tên miền dùng ký tự thay thế",
                    detail: `${host} trông gần giống ${org.name}, có thể dùng ký tự thay thế như rn/m, 0/o hoặc thêm bớt chữ.`,
                });
                return;
            }

            const lookalike = getClosestDomainLabel(host, normalizedAlias);
            if (lookalike)
            {
                warnings.push({
                    title: "Tên miền gần giống chính thống",
                    detail: `${lookalike} gần giống ${alias} của ${org.name}; hãy kiểm tra thật kỹ trước khi mở.`,
                });
            }
        });
    });

    if (warnings.length > 0 && suspiciousWord)
    {
        warnings.push({
            title: "Từ khóa gây áp lực",
            detail: `Tên miền có từ "${suspiciousWord}", thường xuất hiện trong trang giả mạo yêu cầu xác minh, cập nhật hoặc thanh toán gấp.`,
        });
    }

    return dedupeWarnings(warnings);
}

function getClosestDomainLabel(host, normalizedAlias)
{
    if (normalizedAlias.length < 5) return "";

    const labels = host
        .split(".")
        .map((label) => label.toLowerCase())
        .filter((label) => label && label !== "www");

    for (const label of labels)
    {
        const normalizedLabel = normalizeLookalikeText(label);
        if (Math.abs(normalizedLabel.length - normalizedAlias.length) > 2) continue;

        const distance = levenshteinDistance(normalizedLabel, normalizedAlias);
        const allowedDistance = normalizedAlias.length >= 10 ? 2 : 1;
        if (distance > 0 && distance <= allowedDistance)
        {
            return label;
        }
    }

    return "";
}

function dedupeWarnings(warnings)
{
    const seen = new Set();
    return warnings.filter((warning) =>
    {
        const key = `${warning.title}|${warning.detail}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function isOfficialHost(host, org)
{
    return org.domains.some(
        (domain) => host === domain || host.endsWith(`.${domain}`),
    );
}

function getRootDomain(host)
{
    const parts = String(host || "")
        .toLowerCase()
        .split(".")
        .filter(Boolean);
    if (parts.length <= 2) return parts.join(".");

    const twoPartSuffix = parts.slice(-2).join(".");
    if (KNOWN_PUBLIC_SUFFIXES.includes(twoPartSuffix) && parts.length >= 3)
    {
        return parts.slice(-3).join(".");
    }

    return parts.slice(-2).join(".");
}

function compactDomainText(value)
{
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function normalizeLookalikeText(value)
{
    return compactDomainText(value)
        .replaceAll("rn", "m")
        .replaceAll("vv", "w")
        .replaceAll("0", "o")
        .replaceAll("1", "l")
        .replaceAll("5", "s");
}

function levenshteinDistance(a, b)
{
    const left = String(a || "");
    const right = String(b || "");
    const matrix = Array.from({ length: left.length + 1 }, () => []);

    for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= left.length; i += 1)
    {
        for (let j = 1; j <= right.length; j += 1)
        {
            const cost = left[i - 1] === right[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            );
        }
    }

    return matrix[left.length][right.length];
}

function renderResult(message, result, rawText, advice = null)
{
    resultArea.classList.remove("hidden");
    riskBadge.textContent = result.risk;
    riskBadge.className = `risk-badge ${riskClass(result.risk)}`;
    highlightedMessage.innerHTML = highlightQuotes(message, result.signs);
    psychologyAdvice.textContent =
        advice || "Chưa có phần giải thích tâm lý cho kết quả này.";

    signList.innerHTML = "";
    if (result.signs.length === 0)
    {
        const item = document.createElement("li");
        item.textContent = "Chưa phát hiện dấu hiệu lừa đảo rõ ràng.";
        signList.appendChild(item);
    } else
    {
        result.signs.forEach((sign) =>
        {
            const item = document.createElement("li");
            item.innerHTML = `<strong>${escapeHtml(sign.reason || "Dấu hiệu cần chú ý")}</strong>`;
            if (sign.quote) item.append(` - "${sign.quote}"`);
            signList.appendChild(item);
        });
    }

    actionList.innerHTML = "";
    result.actions.slice(0, 3).forEach((action) =>
    {
        const item = document.createElement("li");
        item.textContent = action;
        actionList.appendChild(item);
    });

    if (rawResponse)
    {
        rawResponse.textContent =
            typeof rawText === "string" ? rawText : JSON.stringify(rawText, null, 2);
    }
    renderWarningCard(message, result);

    btnResponds.forEach((btn) =>
    {
        btn.disabled = false;
        btn.classList.remove("active");
    });

    // Ẩn khung chứa lời khuyên cũ đi
    if (responderGuidance)
    {
        responderGuidance.className = "responder-guidance hidden";
        responderGuidance.innerHTML = "";
    }

    // Thực hiện kiểm tra rủi ro: Chỉ hiển thị khi kết quả không phải là "An toàn"
    if (responderQuestionArea && result && result.risk !== "An toàn")
    {
        responderQuestionArea.classList.remove("hidden"); // Hiện khung câu hỏi
    } else if (responderQuestionArea)
    {
        responderQuestionArea.classList.add("hidden"); // Ẩn khung câu hỏi
    }
}

function wrapTextDynamic(
    ctx,
    text,
    x,
    y,
    maxWidth,
    lineHeight,
    maxLines,
    draw = true,
)
{
    const words = String(text || "").split(/\s+/);
    let line = "";
    let lines = [];

    for (let i = 0; i < words.length; i += 1)
    {
        const testLine = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(testLine).width > maxWidth && line)
        {
            lines.push(line);
            line = words[i];
        } else
        {
            line = testLine;
        }
    }
    if (line) lines.push(line);

    if (maxLines && lines.length > maxLines)
    {
        lines = lines.slice(0, maxLines);
        if (lines.length > 0)
        {
            lines[lines.length - 1] += "...";
        }
    }

    if (draw)
    {
        lines.forEach((l, idx) =>
        {
            ctx.fillText(l, x, y + idx * lineHeight);
        });
    }

    return lines.length * lineHeight;
}

async function renderWarningCard(message, result)
{
    if (!warningCardCanvas) return;

    warningCardPanel.classList.remove("hidden");
    warningCardStatus.textContent = "Đang tạo ảnh tóm tắt...";

    const ctx = warningCardCanvas.getContext("2d");
    const width = warningCardCanvas.width;
    const palette = getWarningCardPalette(result.risk);
    const mainSign = getMainSignText(result);
    const productUrl = getProductUrl();
    const qrCanvas = await createQrCanvas(productUrl);

    // Hàm dùng chung để chạy thử đo đạc chiều cao (dryRun = true) và vẽ thật (dryRun = false)
    function drawContent(dryRun = false)
    {
        let y = 150;

        if (!dryRun)
        {
            ctx.clearRect(0, 0, width, warningCardCanvas.height);
            ctx.fillStyle = "#f6f8fb";
            ctx.fillRect(0, 0, width, warningCardCanvas.height);

            ctx.fillStyle = "#17202a";
            roundRect(ctx, 60, 60, width - 120, warningCardCanvas.height - 120, 42);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            roundRect(ctx, 90, 90, width - 180, warningCardCanvas.height - 180, 34);
            ctx.fill();

            ctx.fillStyle = palette.bg;
            roundRect(ctx, 130, 150, width - 260, 210, 28);
            ctx.fill();

            // Font hệ thống cao cấp hiển thị tiếng Việt mượt mà, không bị lỗi dấu thanh
            ctx.fillStyle = palette.text;
            ctx.font =
                "900 54px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText("ScamCheck", 170, 225);

            ctx.font =
                "800 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText("THẺ CẢNH BÁO TIN NHẮN", 170, 285);

            ctx.fillStyle = "#ffffff";
            roundRect(ctx, width - 380, 185, 220, 90, 24);
            ctx.fill();
            ctx.fillStyle = palette.text;
            ctx.font =
                "900 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(result.risk || "Nghi ngờ", width - 270, 243);
            ctx.textAlign = "left";
        }

        y += 210 + 95;

        if (!dryRun)
        {
            ctx.fillStyle = "#17202a";
            ctx.font =
                "900 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText("Mức rủi ro", 130, y);
            ctx.fillStyle = palette.text;
            ctx.font =
                "900 72px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText(result.risk || "Nghi ngờ", 130, y + 80);
        }

        y += 120 + 40;

        if (!dryRun)
        {
            ctx.fillStyle = "#17202a";
            ctx.font =
                "900 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText("Dấu hiệu chính", 130, y);
        }

        ctx.fillStyle = "#2f3b47";
        ctx.font =
            "34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const signHeight = wrapTextDynamic(
            ctx,
            mainSign,
            130,
            y + 60,
            width - 260,
            48,
            10,
            !dryRun,
        );

        y += 60 + signHeight + 65;

        const bottomStartY = y;

        if (!dryRun)
        {
            ctx.fillStyle = "#17202a";
            ctx.font =
                "900 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText("Tin được kiểm tra", 130, bottomStartY);
        }

        ctx.fillStyle = "#4b5563";
        ctx.font =
            "28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const msgHeight = wrapTextDynamic(
            ctx,
            shortenForCard(message, 150),
            130,
            bottomStartY + 50,
            560,
            38,
            5,
            !dryRun,
        );

        if (!dryRun)
        {
            ctx.fillStyle = "#f1f5f9";
            roundRect(ctx, 730, bottomStartY - 30, 250, 330, 18);
            ctx.fill();

            if (qrCanvas)
            {
                ctx.drawImage(qrCanvas, 755, bottomStartY - 15, 200, 200);
            } else
            {
                ctx.fillStyle = "#17202a";
                ctx.font =
                    "900 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                wrapTextDynamic(
                    ctx,
                    "QR chưa sẵn sàng",
                    765,
                    bottomStartY + 60,
                    180,
                    34,
                    2,
                    true,
                );
            }

            ctx.fillStyle = "#475569";
            ctx.font =
                "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.textAlign = "center";
            wrapTextDynamic(
                ctx,
                "Quét mã để mở ScamCheck",
                855,
                bottomStartY + 225,
                230,
                32,
                2,
                true,
            );
            ctx.fillStyle = "#64748b";
            ctx.font =
                "19px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            wrapTextDynamic(
                ctx,
                PRODUCT_URL.replace("https://", ""),
                855,
                bottomStartY + 270,
                220,
                26,
                2,
                true,
            );
            ctx.textAlign = "left";
        }

        const blockHeight = Math.max(50 + msgHeight, 360);
        y += blockHeight + 70;

        if (!dryRun)
        {
            ctx.fillStyle = "#17202a";
            ctx.font =
                "28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        }

        const footerText =
            "Không bấm link lạ, không cung cấp OTP, không chuyển tiền khi chưa xác minh qua kênh chính thức.";
        const footerHeight = wrapTextDynamic(
            ctx,
            footerText,
            130,
            y,
            width - 260,
            38,
            3,
            !dryRun,
        );

        y += footerHeight + 120;
        return y;
    }

    // Bước 1: Chạy đo chiều cao thực tế cần dùng
    const totalHeight = drawContent(true);
    warningCardCanvas.height = totalHeight;

    // Bước 2: Tiến hành vẽ thật lên Canvas với kích cỡ mới
    drawContent(false);

    if (qrCanvas)
    {
        warningCardStatus.textContent =
            "Ảnh đã sẵn sàng. Mã quét dẫn về ScamCheck.";
    } else
    {
        warningCardStatus.textContent =
            "Ảnh đã sẵn sàng. QR cần kết nối mạng để tải thư viện tạo mã.";
    }

    latestWarningCardName = `scamcheck-${Date.now()}.png`;
}

// Bang mau rieng cho canvas tai anh canh bao.
function getWarningCardPalette(risk)
{
    if (risk === "An toàn") return { bg: "#d8f3dc", text: "#0f5132" };
    if (risk === "Nguy hiểm") return { bg: "#ffd9d6", text: "#842029" };
    return { bg: "#fff1b8", text: "#684b00" };
}

function getMainSignText(result)
{
    const sign = result.signs?.[0];
    return (
        sign?.reason ||
        sign?.quote ||
        "Chưa phát hiện dấu hiệu cụ thể, nhưng vẫn nên kiểm tra nguồn gửi trước khi làm theo."
    );
}

function getProductUrl()
{
    return PRODUCT_URL;
}

async function createQrCanvas(text)
{
    if (!window.QRCode?.toCanvas) return null;

    const canvas = document.createElement("canvas");
    try
    {
        await window.QRCode.toCanvas(canvas, text, {
            width: 220,
            margin: 1,
            errorCorrectionLevel: "M",
            color: {
                dark: "#17202a",
                light: "#ffffff",
            },
        });
        return canvas;
    } catch
    {
        return null;
    }
}

function downloadWarningCard()
{
    if (!warningCardCanvas) return;

    warningCardCanvas.toBlob((blob) =>
    {
        if (!blob)
        {
            window.open(warningCardCanvas.toDataURL("image/png"), "_blank");
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = latestWarningCardName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
}

function roundRect(ctx, x, y, width, height, radius)
{
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines)
{
    const words = String(text || "").split(/\s+/);
    let line = "";
    let lines = 0;

    for (let i = 0; i < words.length; i += 1)
    {
        const testLine = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(testLine).width > maxWidth && line)
        {
            lines += 1;
            if (lines >= maxLines)
            {
                ctx.fillText(`${line}...`, x, y);
                return;
            }
            ctx.fillText(line, x, y);
            line = words[i];
            y += lineHeight;
        } else
        {
            line = testLine;
        }
    }

    if (line)
    {
        ctx.fillText(line, x, y);
    }
}

function shortenForCard(text, maxLength)
{
    const value = String(text || "")
        .replace(/\s+/g, " ")
        .trim();
    return value.length > maxLength
        ? `${value.slice(0, maxLength - 3)}...`
        : value;
}

function renderHistory(history, onOpenItem)
{
    historyList.innerHTML = "";
    if (history.length === 0)
    {
        const empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = "Chưa có tin nào được kiểm tra.";
        historyList.appendChild(empty);
        return;
    }

    history.forEach((item) =>
    {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history-item";
        button.innerHTML = `
            <strong>${escapeHtml(item.result?.risk || "Nghi ngờ")} - ${formatDate(item.checkedAt)}</strong>
            <span>${escapeHtml(shorten(item.message || ""))}</span>
        `;
        button.addEventListener("click", () => onOpenItem(item));
        historyList.appendChild(button);
    });
}

function getViewElement(viewName)
{
    if (viewName === "link") return linkView;
    if (viewName === "library") return libraryView;
    if (viewName === "training") return trainingView;
    return checkView;
}

function getVisibleViewName()
{
    return VIEW_NAMES.find((name) =>
    {
        const view = getViewElement(name);
        return view && !view.classList.contains("hidden");
    }) || activeViewName;
}

function clearViewAnimationClasses(view)
{
    view?.classList.remove(
        "view-enter-right",
        "view-enter-left",
        "view-exit-left",
        "view-exit-right",
    );
}

function showOnlyView(viewName)
{
    VIEW_NAMES.forEach((name) =>
    {
        const view = getViewElement(name);
        if (!view) return;
        clearViewAnimationClasses(view);
        view.classList.toggle("hidden", name !== viewName);
    });
}

function updateViewTabs(viewName)
{
    const isLink = viewName === "link";
    const isLibrary = viewName === "library";
    const isTraining = viewName === "training";
    if (viewTabs)
    {
        viewTabs.dataset.active = isLink
            ? "link"
            : isLibrary
                ? "library"
                : isTraining
                    ? "training"
                    : "check";
    }
    checkTab?.classList.toggle("active", !isLink && !isLibrary && !isTraining);
    linkTab?.classList.toggle("active", isLink);
    libraryTab?.classList.toggle("active", isLibrary);
    trainingTab?.classList.toggle("active", isTraining);
    checkTab?.setAttribute(
        "aria-current",
        !isLink && !isLibrary && !isTraining ? "page" : "false",
    );
    linkTab?.setAttribute("aria-current", isLink ? "page" : "false");
    libraryTab?.setAttribute("aria-current", isLibrary ? "page" : "false");
    trainingTab?.setAttribute("aria-current", isTraining ? "page" : "false");
}

function prepareViewData(viewName)
{
    if (viewName === "link")
    {
        prepareLinkScanner();
    }

    if (viewName === "library")
    {
        loadScamLibrary();
    }

    if (viewName === "training")
    {
        loadTrainingMessages();
    }
}

function setView(viewName)
{
    const nextViewName = VIEW_NAMES.includes(viewName) ? viewName : "check";
    const previousViewName = getVisibleViewName();
    const previousView = getViewElement(previousViewName);
    const nextView = getViewElement(nextViewName);
    const isSameView = previousViewName === nextViewName;

    window.clearTimeout(viewSwitchTimer);
    window.clearTimeout(viewEnterTimer);
    VIEW_NAMES.forEach((name) => clearViewAnimationClasses(getViewElement(name)));

    updateViewTabs(nextViewName);
    prepareViewData(nextViewName);

    if (!nextView)
    {
        return;
    }

    if (isSameView || !previousView || previousView.classList.contains("hidden"))
    {
        showOnlyView(nextViewName);
        activeViewName = nextViewName;
        return;
    }

    const movingForward = VIEW_ORDER[nextViewName] > VIEW_ORDER[previousViewName];
    previousView.classList.add(movingForward ? "view-exit-left" : "view-exit-right");
    activeViewName = nextViewName;

    viewSwitchTimer = window.setTimeout(() =>
    {
        previousView.classList.add("hidden");
        clearViewAnimationClasses(previousView);

        VIEW_NAMES.forEach((name) =>
        {
            const view = getViewElement(name);
            if (view && name !== nextViewName)
            {
                view.classList.add("hidden");
            }
        });

        nextView.classList.remove("hidden");
        nextView.classList.add(movingForward ? "view-enter-right" : "view-enter-left");

        viewEnterTimer = window.setTimeout(() =>
        {
            clearViewAnimationClasses(nextView);
        }, VIEW_ENTER_DURATION);
    }, VIEW_EXIT_DELAY);
}

// Dieu huong bang hash giup chuyen man hinh ma khong tai lai toan bo ung dung.
function navigateTo(viewName)
{
    const nextHash =
        viewName === "link"
            ? "#link"
            : viewName === "library"
                ? "#library"
                : viewName === "training"
                    ? "#training"
                    : "#check";
    if (window.location.hash !== nextHash)
    {
        window.location.hash = nextHash;
    } else
    {
        setView(viewName);
    }
}

function syncViewFromHash()
{
    if (window.location.hash === "#link")
    {
        setView("link");
    } else if (window.location.hash === "#library")
    {
        setView("library");
    } else if (window.location.hash === "#training")
    {
        setView("training");
    } else
    {
        setView("check");
    }
}

function normalizeScamLibrary(items)
{
    return Array.isArray(items)
        ? items
            .map((item, index) => ({
                id: String(item?.id || `scam-type-${index + 1}`),
                name: String(item?.name || "Kiểu lừa đảo").trim(),
                group: formatLibraryGroup(item?.group),
                description: String(item?.description || "").trim(),
                exampleMessage: String(item?.exampleMessage || "").trim(),
            }))
            .filter((item) => item.name && item.description && item.exampleMessage)
            .slice(0, 15)
        : [];
}

function formatLibraryGroup(group)
{
    return String(group || "KHÁC")
        .trim()
        .toLocaleUpperCase("vi-VN");
}

// Thu vien uu tien file data/scam-library.json, fallback sang du lieu nhung san trong JS.
async function loadScamLibrary()
{
    if (scamLibrary.length > 0)
    {
        renderLibrary();
        return;
    }

    libraryStatus.textContent = "Đang tải thư viện...";
    libraryStatus.classList.remove("error");

    try
    {
        const response = await fetch("data/scam-library.json", {
            cache: "no-store",
        });
        if (!response.ok) throw new Error(`library ${response.status}`);
        scamLibrary = normalizeScamLibrary(await response.json());
        selectedLibraryId = scamLibrary[0]?.id || "";
        libraryStatus.textContent = "";
        renderLibrary();
    } catch
    {
        scamLibrary = normalizeScamLibrary(FALLBACK_SCAM_LIBRARY);
        selectedLibraryId = scamLibrary[0]?.id || "";
        libraryStatus.textContent = "";
        libraryStatus.classList.remove("error");
        renderLibrary();
    }
}

function renderLibrary()
{
    renderLibraryFilters();
    renderLibraryList();
    renderLibraryDetail();
}

function renderLibraryFilters()
{
    const groups = [
        "Tất cả",
        ...new Set(scamLibrary.map((item) => item.group).filter(Boolean)),
    ];
    libraryFilters.innerHTML = "";

    groups.forEach((group) =>
    {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `filter-button${group === activeLibraryGroup ? " active" : ""}`;
        button.textContent = group;
        button.addEventListener("click", () =>
        {
            activeLibraryGroup = group;
            const firstItem = getFilteredLibraryItems()[0];
            selectedLibraryId = firstItem?.id || "";
            renderLibrary();
        });
        libraryFilters.appendChild(button);
    });
}

function getFilteredLibraryItems()
{
    if (activeLibraryGroup === "Tất cả")
    {
        return scamLibrary;
    }
    return scamLibrary.filter((item) => item.group === activeLibraryGroup);
}

function renderLibraryList()
{
    const items = getFilteredLibraryItems();
    libraryList.innerHTML = "";

    if (items.length === 0)
    {
        const empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = "Không có kiểu lừa đảo trong nhóm này.";
        libraryList.appendChild(empty);
        return;
    }

    if (!items.some((item) => item.id === selectedLibraryId))
    {
        selectedLibraryId = items[0].id;
    }

    items.forEach((item) =>
    {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `library-item${item.id === selectedLibraryId ? " active" : ""}`;
        button.innerHTML = `
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.group)}</span>
        `;
        button.addEventListener("click", () =>
        {
            selectedLibraryId = item.id;
            renderLibraryList();
            renderLibraryDetail();
        });
        libraryList.appendChild(button);
    });
}

function renderLibraryDetail()
{
    const item =
        scamLibrary.find((entry) => entry.id === selectedLibraryId) ||
        getFilteredLibraryItems()[0];

    if (!item)
    {
        libraryDetail.innerHTML = "";
        return;
    }

    libraryDetail.innerHTML = `
        <span class="library-group">${escapeHtml(item.group)}</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <h4>Ví dụ tin nhắn</h4>
        <blockquote>${escapeHtml(item.exampleMessage)}</blockquote>
    `;
}

async function loadTrainingMessages()
{
    if (trainingPool.length > 0)
    {
        renderTrainingIntroIfIdle();
        return;
    }

    trainingStatus.textContent = "Đang tải bộ câu hỏi luyện tập...";
    trainingStatus.classList.remove("error");

    try
    {
        const response = await fetch(TRAINING_DATA_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`training ${response.status}`);
        const data = await response.json();
        trainingPool = normalizeTrainingMessages(data);
    } catch
    {
        trainingPool = normalizeTrainingMessages(FALLBACK_TRAINING_MESSAGES);
    }

    if (trainingPool.length < 12 || trainingPool.length > TRAINING_POOL_COUNT)
    {
        trainingPool = normalizeTrainingMessages(FALLBACK_TRAINING_MESSAGES);
    }

    trainingStatus.textContent = `Đã sẵn sàng ${trainingPool.length} tin, mỗi lượt lấy ${TRAINING_QUIZ_COUNT} câu.`;
    renderTrainingIntroIfIdle();
}

function normalizeTrainingMessages(items)
{
    return Array.isArray(items)
        ? items
            .map((item, index) => ({
                id: String(item?.id || `training-${index + 1}`),
                message: String(item?.message || "").trim(),
                label: item?.label === "safe" ? "safe" : "scam",
                category: String(item?.category || "Tổng hợp").trim(),
                explanation: String(
                    item?.explanation ||
                    "Hãy kiểm tra nguồn gửi, đường dẫn và yêu cầu trong tin nhắn.",
                ).trim(),
            }))
            .filter((item) => item.message)
            .slice(0, TRAINING_POOL_COUNT)
        : [];
}

// Moi luot chi lay 10 cau tu ngan hang 15 cau de bai tap co tinh moi.
function pickTrainingQuestions(pool)
{
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i -= 1)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, TRAINING_QUIZ_COUNT);
}

function renderTrainingIntroIfIdle()
{
    if (
        !trainingCard.classList.contains("hidden") ||
        !trainingSummary.classList.contains("hidden")
    )
        return;
    trainingIntro.classList.remove("hidden");
}

async function startTraining()
{
    await loadTrainingMessages();
    trainingItems = pickTrainingQuestions(trainingPool);
    trainingIndex = 0;
    trainingPoints = 0;
    trainingAnswered = false;
    trainingIntro.classList.add("hidden");
    trainingSummary.classList.add("hidden");
    trainingCard.classList.remove("hidden");
    renderTrainingQuestion();
}

function renderTrainingQuestion()
{
    const item = trainingItems[trainingIndex];
    if (!item) return;

    trainingAnswered = false;
    trainingProgress.textContent = `Câu ${trainingIndex + 1}/${trainingItems.length}`;
    trainingScore.textContent = `${trainingPoints} điểm`;
    trainingMessage.textContent = item.message;
    trainingFeedback.className = "training-feedback hidden";
    trainingFeedback.innerHTML = "";
    nextTrainingBtn.classList.add("hidden");
    nextTrainingBtn.textContent =
        trainingIndex === trainingItems.length - 1
            ? "Xem tổng kết"
            : "Câu tiếp theo";
    if (trainingAnswerButtons)
    {
        delete trainingAnswerButtons.dataset.choice;
        delete trainingAnswerButtons.dataset.result;
    }

    [guessScamBtn, guessSafeBtn].forEach((button) =>
    {
        button.disabled = false;
        button.classList.remove("active", "correct", "incorrect");
    });
}

function submitTrainingAnswer(label)
{
    if (trainingAnswered) return;

    const item = trainingItems[trainingIndex];
    if (!item) return;

    trainingAnswered = true;
    const isCorrect = item.label === label;
    if (isCorrect) trainingPoints += 1;
    if (trainingAnswerButtons)
    {
        trainingAnswerButtons.dataset.choice = label;
        trainingAnswerButtons.dataset.result = isCorrect ? "correct" : "incorrect";
    }

    const correctButton = item.label === "scam" ? guessScamBtn : guessSafeBtn;
    const chosenButton = label === "scam" ? guessScamBtn : guessSafeBtn;

    [guessScamBtn, guessSafeBtn].forEach((button) =>
    {
        button.disabled = true;
        button.classList.remove("active");
    });

    correctButton.classList.add("correct");
    chosenButton.classList.add(isCorrect ? "active" : "incorrect");

    trainingScore.textContent = `${trainingPoints} điểm`;
    trainingFeedback.className = `training-feedback ${isCorrect ? "correct" : "incorrect"}`;
    trainingFeedback.innerHTML = `
        <strong>${isCorrect ? "Đúng rồi." : "Chưa đúng."} Nhãn đúng: ${getTrainingLabelText(item.label)}.</strong>
        <p>${escapeHtml(item.explanation)}</p>
        <span>${escapeHtml(item.category)}</span>
    `;
    nextTrainingBtn.classList.remove("hidden");
}

function goToNextTrainingQuestion()
{
    if (trainingIndex >= trainingItems.length - 1)
    {
        renderTrainingSummary();
        return;
    }

    trainingIndex += 1;
    renderTrainingQuestion();
}

function renderTrainingSummary()
{
    trainingCard.classList.add("hidden");
    trainingIntro.classList.add("hidden");
    trainingSummary.classList.remove("hidden");
    trainingSummaryScore.textContent = `${trainingPoints}/${trainingItems.length} câu đúng`;
    trainingSummaryComment.textContent = getTrainingSummaryComment(
        trainingPoints,
        trainingItems.length,
    );
}

function getTrainingLabelText(label)
{
    return label === "scam" ? "Lừa đảo" : "An toàn";
}

function getTrainingSummaryComment(score, total = TRAINING_QUIZ_COUNT)
{
    const ratio = total > 0 ? score / total : 0;
    if (ratio >= 0.9)
        return "Rất tốt. Bạn nhận diện được hầu hết dấu hiệu nguy hiểm, đặc biệt là link lạ và yêu cầu chuyển tiền.";
    if (ratio >= 0.7)
        return "Tốt. Bạn đã có nền khá chắc, chỉ cần cẩn thận hơn với tin có tên miền gần giống tổ chức thật.";
    if (ratio >= 0.5)
        return "Ổn nhưng nên luyện thêm. Hãy chú ý các yếu tố: gấp gáp, phí nhỏ, OTP, link rút gọn và tên miền lạ.";
    return "Cần luyện thêm. Trước khi làm theo tin nhắn, hãy dừng lại, kiểm tra nguồn gửi và hỏi người thân hoặc kênh chính thức.";
}

function riskClass(risk)
{
    if (risk === "An toàn") return "risk-safe";
    if (risk === "Nguy hiểm") return "risk-danger";
    return "risk-warning";
}

function highlightQuotes(message, signs)
{
    let html = escapeHtml(message);
    signs
        .map((sign) => sign.quote)
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)
        .forEach((quote) =>
        {
            const escapedQuote = escapeHtml(quote);
            if (!escapedQuote || !html.includes(escapedQuote)) return;
            html = html.replaceAll(escapedQuote, `<mark>${escapedQuote}</mark>`);
        });
    return html;
}

function escapeHtml(value)
{
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function shorten(text)
{
    return text.length > 90 ? `${text.slice(0, 87)}...` : text;
}

function formatDate(value)
{
    if (!value) return "";
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    }).format(new Date(value));
}

function updateCounter()
{
    charCount.textContent = `${input.value.length}/${MAX_LENGTH} ký tự`;
}

function refreshHistory()
{
    renderHistory(getHistory(), (item) =>
    {
        input.value = item.message;
        updateCounter();
        syncLinkScannerWithMessage(item.message);
        renderResult(item.message, item.result, item.rawText);
        showMessage("Đã mở lại kết quả cũ, không gọi Gemini thêm.");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

async function runCheck()
{
    const message = input.value.trim();
    showMessage("");

    // 1. Kiểm tra tính hợp lệ của tin nhắn đầu vào
    if (!message)
    {
        showMessage("Bạn hãy dán nội dung tin nhắn trước khi kiểm tra.", true);
        input.focus();
        return;
    }

    if (message.length > MAX_LENGTH)
    {
        showMessage(
            "Tin nhắn dài hơn 5000 ký tự. Bạn hãy rút gọn phần cần kiểm tra.",
            true,
        );
        return;
    }

    syncLinkScannerWithMessage(message);

    // 2. LẬP TỨC ẨN KẾT QUẢ CŨ (Biến mất hoàn toàn chữ và ảnh cũ)
    if (resultArea)
    {
        resultArea.classList.add("hidden");
    }

    // 3. BẬT TRẠNG THÁI ĐANG PHÂN TÍCH (Hiện spinner và chữ "Thám tử đang phân tích...")
    setLoading(true);
    checkBtn.disabled = true;
    latestAnalysis = null;

    try
    {
        // Gửi dữ liệu lên hệ thống phân tích
        const analysis = await analyzeWithPsychology(message);
        latestAnalysis = analysis;

        const result = analysis.detectiveResult;
        const rawText = analysis.rawText;

        // Hàm này sẽ tự động nạp kết quả mới và gọi resultArea.classList.remove("hidden") để hiển thị lại
        renderResult(message, result, rawText, analysis.psychologyAdvice);

        addHistoryItem({
            message,
            result,
            rawText,
            checkedAt: new Date().toISOString(),
        });
        refreshHistory();
        showMessage(
            result.usedFallback
                ? "AI trả về dữ liệu chưa đúng cấu trúc, ScamCheck đã dùng kết quả dự phòng."
                : "Đã phân tích xong.",
        );
    } catch (error)
    {
        // Xử lý các lỗi hiển thị nếu có sự cố kết nối
        if (error?.friendlyMessage)
        {
            showMessage(error.friendlyMessage, true);
            return;
        }

        const text = String(error?.message || "");
        if (text.includes("Thiếu cấu hình") || text.includes("missing_api_key"))
        {
            showMessage("Máy chủ chưa được cấu hình khóa Gemini.", true);
        } else if (text.includes("refused"))
        {
            showMessage(
                "AI từ chối phân tích nội dung này. Bạn có thể thử rút gọn hoặc bỏ thông tin nhạy cảm.",
                true,
            );
        } else if (text.includes("timeout"))
        {
            showMessage(
                "Quá 30 giây chưa có kết quả. Bạn hãy thử lại sau ít phút.",
                true,
            );
        } else
        {
            showMessage(
                "Lỗi kết nối tới server. Hãy kiểm tra backend và file .env.",
                true,
            );
        }
    } finally
    {
        // 4. TẮT HIỆU ỨNG LOADING KHI HOÀN THÀNH
        setLoading(false);
        checkBtn.disabled = false;
    }
}

document.querySelectorAll("[data-sample]").forEach((button) =>
{
    listen(button, "click", () =>
    {
        input.value = sampleMessages[button.dataset.sample] || "";
        updateCounter();
        showMessage("Đã điền tin mẫu. Bạn có thể bấm Kiểm tra ngay.");
        input.focus();
    });
});

listen(input, "input", () =>
{
    updateCounter();
});
listen(checkBtn, "click", runCheck);
listen(clearBtn, "click", () =>
{
    input.value = "";
    updateCounter();
    input.focus();
});

listen(linkInput, "input", () =>
{
    updateLinkCounter();
    updateLinkScan();
});
listen(linkClearBtn, "click", () =>
{
    if (!linkInput) return;
    linkInput.value = "";
    updateLinkCounter();
    updateLinkScan();
    linkInput.focus();
});

listen(clearHistoryBtn, "click", () =>
{
    clearHistory();
    refreshHistory();
    showMessage("Đã xóa lịch sử kiểm tra.");
});
listen(downloadWarningCardBtn, "click", downloadWarningCard);
listen(tutorialOpenBtn, "click", openTutorial);
listen(tutorialCloseBtn, "click", closeTutorial);
listen(tutorialDoneBtn, "click", closeTutorial);
listen(tutorialModal, "click", (event) =>
{
    if (event.target === tutorialModal)
    {
        closeTutorial();
    }
});
listen(document, "keydown", (event) =>
{
    if (
        event.key === "Escape" &&
        tutorialModal &&
        !tutorialModal.classList.contains("hidden")
    )
    {
        closeTutorial();
    }
});

listen(checkTab, "click", () => navigateTo("check"));
listen(linkTab, "click", () => navigateTo("link"));
listen(libraryTab, "click", () => navigateTo("library"));
listen(trainingTab, "click", () => navigateTo("training"));
listen(backToCheckBtn, "click", () => navigateTo("check"));
listen(backFromTrainingBtn, "click", () => navigateTo("check"));
listen(window, "hashchange", syncViewFromHash);
listen(startTrainingBtn, "click", startTraining);
listen(restartTrainingBtn, "click", startTraining);
listen(guessScamBtn, "click", () => submitTrainingAnswer("scam"));
listen(guessSafeBtn, "click", () => submitTrainingAnswer("safe"));
listen(nextTrainingBtn, "click", goToNextTrainingQuestion);

function setThemeToggleLabel(theme)
{
    if (themeToggle) themeToggle.textContent = theme === "dark" ? "☀" : "☾";
}

function applyTheme(theme)
{
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE, theme);
    setThemeToggleLabel(theme);
}

listen(themeToggle, "click", () =>
{
    const current =
        document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";

    window.clearTimeout(themeSwitchTimer);
    document.documentElement.classList.add("theme-switching");

    themeSwitchTimer = window.setTimeout(() =>
    {
        applyTheme(next);

        window.setTimeout(() =>
        {
            document.documentElement.classList.remove("theme-switching");
        }, THEME_TRANSITION_DURATION);
    }, 0);
});

const savedTheme = localStorage.getItem(THEME_STORAGE) || "light";
applyTheme(savedTheme);
updateCounter();
updateLinkCounter();
updateLinkScan();
refreshHistory();
syncViewFromHash();
initializeTutorial();

btnResponds.forEach(button =>
{
    listen(button, "click", async () =>
    {
        const choice = button.dataset.choice;
        const currentMessage = input.value.trim(); // Lấy nội dung tin nhắn lừa đảo hiện tại

        // Khóa tất cả các nút ngay khi được click để chống bấm đè/spam
        btnResponds.forEach(btn =>
        {
            btn.disabled = true;
            btn.classList.remove("active");
        });

        // Làm nổi bật nút đã click
        button.classList.add("active");

        // L5-05: Xử lý tình huống "Chưa làm gì" (Không gọi AI)
        if (choice === "none")
        {
            responderGuidance.innerHTML = RESPONDER_GUIDELINES.none.text;
            responderGuidance.className = `responder-guidance ${RESPONDER_GUIDELINES.none.class}`;
            responderGuidance.classList.remove("hidden");
            return; // Dừng tiến trình tại đây để tiết kiệm lượt gọi Gemini
        }

        // Hiện hiệu ứng tải khi đang liên hệ với AI Người ứng cứu (L5-03, L5-04)
        responderGuidance.innerHTML = "<div class='spinner' style='width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;'></div> Đang lấy hướng dẫn khẩn cấp...";
        responderGuidance.className = "responder-guidance";
        responderGuidance.classList.remove("hidden");

        try
        {
            const response = await fetch('/api/rescue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: currentMessage, choice: choice })
            });

            if (!response.ok)
            {
                throw new Error(`Lỗi server: ${response.status}`);
            }

            const data = await response.json();

            // Định dạng lại phản hồi từ AI để hiển thị đẹp hơn
            // Chuyển ký tự xuống dòng \n thành thẻ <br>
            let formattedText = data.text.replace(/\n/g, "<br>");

            // Định dạng chữ in đậm dạng markdown **chữ** thành thẻ <strong>chữ</strong>
            formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

            responderGuidance.innerHTML = formattedText;

            // Đổi màu nền đại diện tùy tình huống
            if (choice === "clicked")
            {
                responderGuidance.className = "responder-guidance guidance-clicked";
            }
            else if (choice === "transferred" || choice === "otp")
            {
                responderGuidance.className = "responder-guidance guidance-otp";
            }

        } catch (error)
        {
            console.error("Lỗi lấy chỉ dẫn:", error);
            responderGuidance.innerHTML = "⚠️ Lỗi kết nối hệ thống khi lấy hướng dẫn khẩn cấp. Bác hãy gọi ngay cho Ngân hàng để khóa tài khoản hoặc ra đồn Công an gần nhất để được hỗ trợ.";
            responderGuidance.className = "responder-guidance guidance-otp";
        }
    });
});