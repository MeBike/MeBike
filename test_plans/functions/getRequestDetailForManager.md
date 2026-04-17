# Test Cases cho Hàm: `getRequestDetailForManager`

**Nằm trong file**: manager.controller.ts
**Function Code**: FUNC_GETREQUESTDETAILFORMANAGER
**Function Name**: `getRequestDetailForManager`

---

### 1. Test Cases (Danh sách chi tiết)

#### TC_001: Khởi tạo/Thực thi thành công (Normal Flow)
**a. Condition:**
- **Precondition**: Dữ liệu đầu vào và trạng thái nghiệp vụ hoàn toàn hợp lệ.
- **Values of inputs (Normal)**: Các thông số bắt buộc (query, param, body) điền đúng định dạng và logic.
**b. Confirmation:**
- **Output result**: Lệnh xử lý thành công, API trả về HTTP 200/201 kèm dữ liệu kết quả.
**c. Type & Result:**
- **Type**: Normal
- **Result**: [ ] P / F

#### TC_002: Xử lý ngoại lệ `UserNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `UserNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `UserNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_003: Xử lý ngoại lệ `RedistributionRequestNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `RedistributionRequestNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `RedistributionRequestNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_004: Xử lý ngoại lệ `UnauthorizedRedistributionAccess` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `UnauthorizedRedistributionAccess` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `UnauthorizedRedistributionAccess`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

