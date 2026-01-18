// 순수 정적 사이트 설정 (localStorage 기반)
// API 호출 없음 - 모든 데이터는 로컬에서 관리

// 로컬 스토리지 키
const TOKEN_KEY = 'cs_platform_token';
const USER_KEY = 'cs_platform_user';

// 인증 확인
function isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
}

// 사용자 정보 가져오기
function getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

// 로그인 정보 저장
function saveAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// 로그아웃
function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
}

// 인증 필요 페이지 보호
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 에러 메시지 표시
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// 성공 메시지 표시
function showSuccess(message) {
    alert(message);
}

// 에러 메시지 표시 (일반)
function showErrorMessage(message) {
    alert(message);
}
