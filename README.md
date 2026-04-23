# Sync2Access Extension

> Tiện ích Chrome Manifest V3 giúp quản lý hồ sơ cookie, chia sẻ phiên truy cập được mã hóa, chống đăng xuất ngoài ý muốn và hỗ trợ giao diện đa ngôn ngữ.

<p align="center">
  <a href="./README.en.md">
    <img alt="Đọc README tiếng Anh" src="https://img.shields.io/badge/README-Ti%E1%BA%BFng%20Anh-2563eb?style=for-the-badge" />
  </a>
  <a href="https://github.com/WeanSpaces/Sync2Access/releases/download/v1.7.1/sync2access-extension-v1.7.1.zip">
    <img alt="Tải tệp ZIP extension" src="https://img.shields.io/badge/T%E1%BA%A3i%20t%E1%BB%87p-ZIP-16a34a?style=for-the-badge&logo=googlechrome&logoColor=white" />
  </a>
  <a href="https://github.com/WeanSpaces/Sync2Access/releases/tag/v1.7.1">
    <img alt="Bản phát hành mới nhất" src="https://img.shields.io/badge/B%E1%BA%A3n-v1.7.1-111827?style=for-the-badge" />
  </a>
</p>

## Tổng Quan

Sync2Access là extension dành cho trình duyệt Chromium, tập trung vào các luồng làm việc với phiên đăng nhập trên website. Extension cho phép lưu cookie hiện tại thành nhiều hồ sơ, chuyển đổi nhanh giữa các tài khoản theo từng domain, chia sẻ phiên truy cập bằng liên kết được mã hóa và hạn chế việc bị đăng xuất ngoài ý muốn.

Dự án được xây dựng bằng TypeScript, React, Vite và Chrome Extension Manifest V3. Mã nguồn chính nằm trong thư mục `sync2access`.

## Tính Năng Chính

- **Quản lý hồ sơ cookie theo domain:** lưu, đổi tên, chuyển đổi, xóa, import và export hồ sơ.
- **Chia sẻ phiên truy cập an toàn:** mã hóa cookie bằng AES-GCM, dẫn xuất khóa bằng PBKDF2, xác thực payload bằng HMAC và hỗ trợ xác minh chữ ký RSA.
- **Chống đăng xuất:** chặn các URL đăng xuất phổ biến bằng Declarative Net Request và hiển thị trang xác nhận trước khi cho phép đăng xuất.
- **Bypass có kiểm soát:** dùng token một lần, thời gian sống ngắn, để cho phép đăng xuất khi người dùng xác nhận.
- **Hỗ trợ localStorage:** có thể kèm dữ liệu localStorage trong luồng chia sẻ khi người dùng bật tùy chọn này.
- **Giao diện đa ngôn ngữ:** English, Tiếng Việt, Korean, Russian và Simplified Chinese.
- **Chế độ giao diện:** light, dark và system theme.
- **Build hiện đại:** React 18, Radix UI, Tailwind CSS v4, Vite 5 và TypeScript.

## Tải Và Cài Đặt Nhanh

### Cách 1: Tải bản ZIP đã build sẵn

1. Tải file ZIP tại nút **Tải Extension ZIP** ở đầu README hoặc tại [Release v1.7.1](https://github.com/WeanSpaces/Sync2Access/releases/tag/v1.7.1).
2. Giải nén `sync2access-extension-v1.7.1.zip` vào một thư mục cố định trên máy.
3. Mở Chrome, Edge hoặc Brave và truy cập `chrome://extensions`.
4. Bật **Developer mode** (Chế độ dành cho nhà phát triển).
5. Chọn **Load unpacked** (Tải tiện ích đã giải nén).
6. Chọn thư mục vừa giải nén.
7. Ghim Sync2Access trên thanh extension để sử dụng nhanh.

### Cách 2: Build từ source

```bash
git clone https://github.com/WeanSpaces/Sync2Access.git
cd Sync2Access/sync2access
npm ci
npm run build
```

Sau khi build xong:

1. Mở `chrome://extensions`.
2. Bật **Developer mode** (Chế độ dành cho nhà phát triển).
3. Chọn **Load unpacked** (Tải tiện ích đã giải nén).
4. Chọn thư mục `sync2access/dist`.

## Hướng Dẫn Sử Dụng

### 1. Chia Sẻ Phiên Truy Cập

1. Mở website đang có phiên đăng nhập cần chia sẻ.
2. Bấm biểu tượng Sync2Access trên thanh extension.
3. Ở tab **Chia sẻ**, kiểm tra domain và số lượng cookie được phát hiện.
4. Nhập mật khẩu nếu muốn tạo chia sẻ riêng tư. Nếu để trống, chia sẻ sẽ dùng cơ chế chia sẻ công khai của tiện ích.
5. Chọn thời hạn hết hạn, giới hạn lượt truy cập và URL chuyển hướng sau khi import.
6. Bật tùy chọn kèm localStorage nếu website cần dữ liệu localStorage để khôi phục phiên.
7. Bấm **Tạo chia sẻ**.
8. Sao chép liên kết được tạo và gửi cho người nhận.

Lưu ý: cookie được mã hóa trước khi gửi tới backend chia sẻ đã cấu hình trong source.

### 2. Lưu Và Chuyển Hồ Sơ Cookie

1. Mở website cần quản lý nhiều tài khoản.
2. Mở popup Sync2Access.
3. Vào tab **Hồ sơ**.
4. Chọn lưu cookie hiện tại thành hồ sơ mới.
5. Đặt tên hồ sơ, ví dụ `Tài khoản cá nhân`, `Tài khoản công việc`.
6. Khi cần đổi tài khoản, chọn hồ sơ mong muốn và bấm **Chuyển**.

Tiện ích sẽ xóa cookie hiện tại của domain đó và khôi phục cookie từ hồ sơ đã chọn.

### 3. Import Và Export Hồ Sơ

1. Vào tab **Hồ sơ**.
2. Dùng **Xuất** để tạo file sao lưu hồ sơ.
3. Dùng **Nhập** để phục hồi hồ sơ từ file đã export.
4. Kiểm tra domain trước khi import để tránh ghi nhầm cookie sang website khác.

Tính năng này phù hợp để sao lưu tài khoản, di chuyển cấu hình giữa máy cá nhân hoặc khôi phục sau khi cài lại trình duyệt.

### 4. Chống Đăng Xuất Ngoài Ý Muốn

1. Vào tab **Cài đặt**.
2. Bật chống đăng xuất toàn cục hoặc bật riêng cho domain hiện tại.
3. Khi website truy cập URL giống luồng đăng xuất, tiện ích sẽ chuyển tới trang xác nhận.
4. Chọn ở lại nếu không muốn đăng xuất.
5. Chọn đăng xuất nếu thật sự muốn tiếp tục. Tiện ích sẽ tạo bypass token một lần để cho phép thao tác.

### 5. Xóa Cookie Hiện Tại

1. Vào tab **Chia sẻ**.
2. Bấm nút xóa cookie nếu muốn xóa cookie của domain hiện tại.
3. Tiện ích sẽ cố gắng sao lưu dữ liệu cookie theo định dạng JSON vào clipboard trước khi xóa.
4. Tab hiện tại có thể được reload để phản ánh trạng thái mới.

## Quyền Trình Duyệt

Sync2Access cần một số quyền rộng vì tiện ích thao tác trực tiếp với cookie, tab hiện tại, localStorage và điều hướng đăng xuất.

| Quyền | Mục Đích |
| --- | --- |
| `cookies` | Đọc, lưu, xóa và khôi phục cookie theo domain |
| `storage` | Lưu hồ sơ, cài đặt, dữ liệu chia sẻ tạm thời và tùy chọn giao diện |
| `tabs`, `activeTab` | Xác định tab/domain hiện tại và reload tab sau khi đổi hồ sơ |
| `scripting` | Đọc/ghi localStorage và dọn tham số bypass khỏi URL |
| `webNavigation` | Theo dõi điều hướng để xử lý bypass token |
| `declarativeNetRequest`, `declarativeNetRequestWithHostAccess` | Chặn URL đăng xuất bằng rule MV3 |
| `notifications` | Thông báo khi khôi phục hồ sơ hoặc xử lý đăng xuất |
| `<all_urls>` | Hỗ trợ workflow phiên đăng nhập trên các website người dùng chọn |

## Cấu Trúc Dự Án

```text
.
├── sync2access/                     # Mã nguồn chính của tiện ích Chrome
│   ├── public/                      # manifest.json, icons, DNR rules, Chrome locales
│   ├── src/
│   │   ├── background/              # service worker, crypto, profile manager, DNR
│   │   ├── content/                 # cầu nối webpage <-> extension
│   │   ├── pages/                   # trang xác nhận đăng xuất
│   │   ├── popup/                   # giao diện React popup
│   │   └── shared/                  # types, constants, domain utilities
│   ├── cloudflare-worker/           # worker proxy API tùy chọn
│   ├── package.json
│   └── vite.config.ts
├── docs/                            # Tài liệu cài đặt và kiến trúc
├── CHANGELOG.md
├── CONTRIBUTING.md
├── PRIVACY.md
├── SECURITY.md
└── README.en.md
```

## Lệnh Phát Triển

```bash
cd sync2access
npm ci
npm run dev
```

`npm run dev` chạy Vite ở chế độ watch build. Sau mỗi lần build, vào `chrome://extensions` và bấm reload extension.

## Build Bản Phát Hành

```bash
cd sync2access
npm run build
```

Kết quả build nằm tại `sync2access/dist`. Khi phát hành thủ công, zip nội dung trong thư mục `dist` rồi đính kèm vào GitHub Releases.

## Cấu Hình Backend

Tiện ích hiện trỏ tới:

- API tạo chia sẻ: `https://friendshouse.io.vn/api`
- Website tạo link chia sẻ: `https://friendshouse.io.vn`

Các cấu hình này nằm trong:

- `sync2access/src/shared/constants.ts`
- `sync2access/src/popup/App.tsx`

## Bảo Mật Và Riêng Tư

- Cookie profile được lưu trong Chrome extension storage của người dùng.
- Cookie trong payload chia sẻ được mã hóa trước khi gửi tới backend.
- Chia sẻ riêng tư nên dùng mật khẩu mạnh.
- Không commit `node_modules`, `dist`, `.crx`, private key, token hoặc file môi trường cục bộ.
- Xem thêm [PRIVACY.md](PRIVACY.md) và [SECURITY.md](SECURITY.md).

## Tài Liệu Liên Quan

- [Hướng dẫn cài đặt](docs/INSTALLATION.md)
- [Kiến trúc dự án](docs/ARCHITECTURE.md)
- [Quyền riêng tư](PRIVACY.md)
- [Bảo mật](SECURITY.md)
- [Đóng góp](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Giấy Phép

Copyright (c) WeanSpaces. All rights reserved unless a separate license is added by the repository owner.
