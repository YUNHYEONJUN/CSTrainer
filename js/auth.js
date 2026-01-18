// 등록된 수강생 전화번호 목록 (회원가입 허용 대상)
const ALLOWED_PHONES = [
    '010-2714-1109', // 김경희
    '010-9609-7288', // 박윤정
    '010-2528-8264', // 박현천
    '010-2295-9684', // 손유주
    '010-7216-5458', // 윤현준
    '010-2736-0652', // 이선유
    '010-6388-0522', // 이재균
    '010-2667-3501', // 임유연
    '010-2486-2070', // 최예진
    '010-3407-3307'  // 최정협
];

// 관리자 계정 정보
const ADMIN_ACCOUNT = {
    username: 'admin',
    password: 'admin2025!',
    name: '관리자',
    email: 'admin@cstraining.kr',
    phone: '010-0000-0000',
    role: 'admin'
};

// 로그인 폼 처리
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // 관리자 로그인 체크
        if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
            const adminUser = {
                id: 0,
                username: ADMIN_ACCOUNT.username,
                name: ADMIN_ACCOUNT.name,
                email: ADMIN_ACCOUNT.email,
                phone: ADMIN_ACCOUNT.phone,
                role: 'admin'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            localStorage.setItem('authToken', 'admin_token_' + Date.now());
            
            alert('관리자 로그인 성공!');
            window.location.href = 'index.html';
            return;
        }

        // 일반 사용자 로그인
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            // 비밀번호 제외하고 저장
            const { password, ...userInfo } = user;
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            localStorage.setItem('authToken', 'token_' + user.id + '_' + Date.now());
            
            alert('로그인 성공!');
            window.location.href = 'index.html';
        } else {
            showError('errorMessage', '아이디 또는 비밀번호가 올바르지 않습니다.');
        }
    });
}

// 회원가입 폼 처리
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirm_password = document.getElementById('confirm_password').value;
        const full_name = document.getElementById('full_name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const organization = document.getElementById('organization').value.trim();
        const expertise = document.getElementById('expertise').value.trim();

        // 비밀번호 확인
        if (password !== confirm_password) {
            showError('errorMessage', '비밀번호가 일치하지 않습니다.');
            return;
        }

        // 전화번호 형식 검증
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        if (!phoneRegex.test(phone)) {
            showError('errorMessage', '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)');
            return;
        }

        // 등록된 수강생 전화번호 확인
        if (!ALLOWED_PHONES.includes(phone)) {
            showError('errorMessage', '⚠️ 등록된 수강생이 아닙니다.\n\nCS강사양성과정 8기 수강생으로 등록된 전화번호만 회원가입이 가능합니다.\n\n입력하신 전화번호: ' + phone + '\n\n담당자에게 문의해주세요.');
            return;
        }

        // 기존 사용자 목록 가져오기
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // 중복 체크 - 아이디
        if (users.find(u => u.username === username)) {
            showError('errorMessage', '이미 사용 중인 아이디입니다.');
            return;
        }

        // 중복 체크 - 이메일
        if (users.find(u => u.email === email)) {
            showError('errorMessage', '이미 등록된 이메일입니다.');
            return;
        }

        // 중복 체크 - 전화번호 (이미 가입한 경우)
        if (users.find(u => u.phone === phone)) {
            showError('errorMessage', '이미 가입된 전화번호입니다.');
            return;
        }

        // members.json에서 해당 전화번호의 수강생 정보 찾기
        try {
            const response = await fetch('data/members.json?v=' + Date.now());
            const members = await response.json();
            const member = members.find(m => m.phone === phone);

            if (!member) {
                showError('errorMessage', '등록된 수강생 정보를 찾을 수 없습니다.\nmembers.json에 해당 전화번호가 없습니다.');
                return;
            }

            // 이름 일치 확인
            if (member.name !== full_name) {
                showError('errorMessage', `입력하신 이름(${full_name})이 등록된 수강생 이름(${member.name})과 일치하지 않습니다.\n정확한 이름을 입력해주세요.`);
                return;
            }

            // 새 사용자 생성
            const newUser = {
                id: member.id,
                username: username,
                email: email,
                password: password, // 실제 서비스에서는 해시 처리 필요
                name: full_name,
                phone: phone,
                organization: organization,
                expertise: expertise,
                role: 'user',
                created_at: new Date().toISOString()
            };

            // 사용자 목록에 추가
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            // 자동 로그인
            const { password: _, ...userInfo } = newUser;
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            localStorage.setItem('authToken', 'token_' + newUser.id + '_' + Date.now());

            // 수강생 정보와 연결
            console.log('✅ 회원가입 성공:', {
                user: newUser.name,
                memberId: member.id,
                phone: phone
            });

            alert(`✅ 회원가입이 완료되었습니다!\n\n환영합니다, ${member.name}님!\n\n"우리 동기들" 메뉴에서 프로필을 확인하고 수정할 수 있습니다.`);
            window.location.href = 'members.html';

        } catch (error) {
            console.error('회원가입 처리 중 오류:', error);
            showError('errorMessage', '회원가입 처리 중 오류가 발생했습니다.');
        }
    });
}

// 에러 메시지 표시
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // 5초 후 자동 숨김
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// 로그아웃 처리
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    alert('로그아웃되었습니다.');
    window.location.href = 'login.html';
}

// 로그인 상태 확인
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

// 관리자 권한 확인
function isAdmin() {
    const user = checkAuth();
    return user && user.role === 'admin';
}
