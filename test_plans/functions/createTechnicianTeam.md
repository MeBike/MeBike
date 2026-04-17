# Test Cases cho Hàm: `createTechnicianTeam`

**Nằm trong file**: admin.controller.ts
**Function Code**: FUNC_CREATETECHNICIANTEAM
**Function Name**: `createTechnicianTeam`

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

#### TC_002: Xử lý ngoại lệ `TechnicianTeamInternalStationRequired` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `TechnicianTeamInternalStationRequired` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `TechnicianTeamInternalStationRequired`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

#### TC_003: Xử lý ngoại lệ `TechnicianTeamStationNotFound` (Abnormal Flow)
**a. Condition:**
- **Precondition**: Gặp trường hợp ngoại lệ liên quan đến `TechnicianTeamStationNotFound` trong quá trình xử lý.
- **Values of inputs (Abnormal)**: Thông số đầu vào không hợp lệ với yêu cầu của trạng thái hiện tại (hoặc đối tượng không tồn tại).
**b. Confirmation:**
- **Output result**: Lỗi 400/403/404, hiển thị mã error: `TechnicianTeamStationNotFound`.
**c. Type & Result:**
- **Type**: Abnormal
- **Result**: [ ] P / F

