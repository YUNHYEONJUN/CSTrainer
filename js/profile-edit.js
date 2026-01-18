// 프로필 수정 JavaScript

// 로그인 확인
function checkLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(currentUser);
}

// 현재 사용자 정보
let currentUser = checkLogin();
let currentInstructorData = null;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async function() {
    if (!currentUser) return;

    // 인증 링크 업데이트
    updateAuthLink();

    // 현재 강사 정보 불러오기
    await loadInstructorData();

    // 이벤트 리스너 설정
    setupEventListeners();
});

// 인증 링크 업데이트
function updateAuthLink() {
    const authLink = document.getElementById('authLink');
    if (currentUser) {
        authLink.textContent = `${currentUser.name} (로그아웃)`;
        authLink.href = '#';
        authLink.onclick = function(e) {
            e.preventDefault();
            logout();
        };
    }
}

// 로그아웃
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// 수강생 정보 불러오기
async function loadInstructorData() {
    try {
        // 수강생 데이터 로드 (members.json)
        const response = await fetch('data/members.json?v=' + Date.now());
        const members = await response.json();
        
        // 현재 로그인한 수강생 찾기 (ID로 매칭)
        currentInstructorData = members.find(member => member.id === currentUser.id);
        
        if (!currentInstructorData) {
            alert('수강생 정보를 찾을 수 없습니다.');
            window.location.href = 'members.html';
            return;
        }

        // 폼에 데이터 채우기
        fillFormData(currentInstructorData);
    } catch (error) {
        console.error('수강생 정보 로드 실패:', error);
        alert('수강생 정보를 불러오는데 실패했습니다.');
    }
}

// 폼 데이터 채우기 (수강생용)
function fillFormData(data) {
    document.getElementById('name').value = data.name || '';
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('organization').value = data.affiliation || '';
    document.getElementById('position').value = data.position || '';
    document.getElementById('additionalRole').value = data.additionalRole || '';
    document.getElementById('expertise').value = data.interests || '';
    document.getElementById('education').value = data.education || '';
    document.getElementById('career').value = data.experience || '';
    document.getElementById('teachingCareer').value = data.teachingCareer || '';
    document.getElementById('publication').value = data.publication || '';
    document.getElementById('description').value = data.introduction || '';
    
    // 프로필 이미지
    if (data.profileImage) {
        document.getElementById('profilePreview').src = data.profileImage;
        document.getElementById('profileImageUrl').value = data.profileImage;
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 이미지 파일 선택
    const imageUpload = document.getElementById('profileImageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // 파일 선택
    document.getElementById('profileImageInput').addEventListener('change', handleFileSelect);
    
    // URL에서 이미지 불러오기
    document.getElementById('loadImageBtn').addEventListener('click', loadImageFromUrl);
    
    // 폼 제출
    document.getElementById('profileEditForm').addEventListener('submit', handleFormSubmit);
    
    // 취소 버튼
    document.getElementById('cancelBtn').addEventListener('click', function() {
        if (confirm('수정을 취소하시겠습니까?')) {
            window.location.href = 'member-detail.html?id=' + currentInstructorData.id;
        }
    });
}

// 파일 선택 처리
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 이미지 파일 확인
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택할 수 있습니다.');
        return;
    }

    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
    }

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        document.getElementById('profilePreview').src = imageUrl;
        document.getElementById('profileImageUrl').value = imageUrl;
    };
    reader.readAsDataURL(file);
}

// URL에서 이미지 불러오기
function loadImageFromUrl() {
    const url = document.getElementById('profileImageUrl').value.trim();
    if (!url) {
        alert('이미지 URL을 입력해주세요.');
        return;
    }

    // URL 유효성 검사
    try {
        new URL(url);
    } catch (e) {
        alert('올바른 URL을 입력해주세요.');
        return;
    }

    // 이미지 로드 테스트
    const img = new Image();
    img.onload = function() {
        document.getElementById('profilePreview').src = url;
        alert('이미지를 불러왔습니다.');
    };
    img.onerror = function() {
        alert('이미지를 불러올 수 없습니다. URL을 확인해주세요.');
    };
    img.src = url;
}

// 폼 제출 처리
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!confirm('프로필을 저장하시겠습니까?')) {
        return;
    }

    // 폼 데이터 수집 (수강생용)
    const formData = {
        id: currentInstructorData.id,
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        affiliation: document.getElementById('organization').value,
        position: document.getElementById('position').value,
        interests: document.getElementById('expertise').value,
        introduction: document.getElementById('description').value,
        education: document.getElementById('education').value,
        experience: document.getElementById('career').value,
        learningGoals: currentInstructorData.learningGoals || '',
        profileImage: document.getElementById('profileImageUrl').value,
        emoji: currentInstructorData.emoji || '👤'
    };

    try {
        // 실제 서버가 없으므로 localStorage에 저장
        await saveToLocalStorage(formData);
        
        alert('프로필이 저장되었습니다!');
        window.location.href = 'member-detail.html?id=' + currentInstructorData.id;
    } catch (error) {
        console.error('저장 실패:', error);
        alert('프로필 저장에 실패했습니다.');
    }
}

// localStorage에 프로필 데이터 저장 (수강생용)
async function saveToLocalStorage(formData) {
    try {
        // 전체 수강생 목록 가져오기
        const response = await fetch('data/members.json?v=' + Date.now());
        const members = await response.json();
        
        // 현재 수강생 정보 업데이트
        const index = members.findIndex(member => member.id === formData.id);
        if (index !== -1) {
            // 기존 데이터와 병합
            members[index] = { ...members[index], ...formData };
        }
        
        // localStorage에 업데이트된 목록 저장
        localStorage.setItem('membersData', JSON.stringify(members));
        
        // 개별 수강생 데이터도 저장 (빠른 접근용)
        localStorage.setItem('member_' + formData.id, JSON.stringify(formData));
        
        console.log('✅ 프로필 저장 완료:', formData);
        
        return true;
    } catch (error) {
        console.error('저장 실패:', error);
        throw error;
    }
}

// 이미지 파일 업로드 처리
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB를 초과할 수 없습니다.');
        event.target.value = '';
        return;
    }
    
    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        event.target.value = '';
        return;
    }
    
    // 파일을 Base64로 변환하여 미리보기
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        document.getElementById('profilePreview').src = imageUrl;
        document.getElementById('profileImageUrl').value = imageUrl;
    };
    reader.readAsDataURL(file);
}

// URL로 이미지 설정
function setImageFromUrl() {
    const url = document.getElementById('profileImageUrl').value.trim();
    if (url) {
        document.getElementById('profilePreview').src = url;
    }
}
