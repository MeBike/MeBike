# Test Cases cho Hàm: `calculateFromRental`

**Nằm trong file**: impact.controller.ts
**Function Code**: FUNC_CALCULATEFROMRENTAL
**Function Name**: `calculateFromRental`

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

#### TC_002: Xử lý ngoại lệ `EnvironmentImpactRentalNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `EnvironmentImpactRentalNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `EnvironmentImpactRentalNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_003: Xử lý ngoại lệ `EnvironmentImpactRentalNotCompleted` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `EnvironmentImpactRentalNotCompleted` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `EnvironmentImpactRentalNotCompleted`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_004: Xử lý ngoại lệ `ActiveEnvironmentPolicyNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `ActiveEnvironmentPolicyNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `ActiveEnvironmentPolicyNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

