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

    // 저장 버튼 비활성화
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';

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
        // localStorage에 저장
        await saveToLocalStorage(formData);
        
        // 성공 메시지 표시
        showSuccessMessage('프로필이 성공적으로 저장되었습니다!');
        
        // 3초 후 상세 페이지로 이동
        setTimeout(() => {
            window.location.href = 'member-detail.html?id=' + currentInstructorData.id;
        }, 2000);
        
    } catch (error) {
        console.error('❌ 저장 실패:', error);
        
        // 버튼 복원
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        // 상세 오류 메시지 표시
        showErrorMessage('프로필 저장에 실패했습니다.<br>오류: ' + error.message + '<br><br>다시 시도해주세요.');
    }
}

// localStorage에 프로필 데이터 저장 (수강생용)
async function saveToLocalStorage(formData) {
    try {
        console.log('📝 프로필 저장 시작...', formData);
        
        // 전체 수강생 목록 가져오기
        const response = await fetch('data/members.json?v=' + Date.now());
        if (!response.ok) {
            throw new Error('수강생 데이터를 불러올 수 없습니다.');
        }
        
        const members = await response.json();
        console.log('📋 전체 수강생 목록 로드 완료:', members.length + '명');
        
        // 현재 수강생 정보 업데이트
        const index = members.findIndex(member => member.id === formData.id);
        
        if (index === -1) {
            throw new Error('해당 수강생 정보를 찾을 수 없습니다. (ID: ' + formData.id + ')');
        }
        
        // 기존 데이터와 병합 (기존 필드 유지)
        members[index] = { 
            ...members[index],  // 기존 데이터 유지
            ...formData         // 수정된 데이터로 덮어쓰기
        };
        
        console.log('✏️ 수강생 정보 업데이트 완료:', members[index]);
        
        // localStorage에 업데이트된 목록 저장
        try {
            localStorage.setItem('membersData', JSON.stringify(members));
            console.log('💾 전체 목록 localStorage 저장 완료');
        } catch (storageError) {
            console.warn('⚠️ localStorage 용량 초과. 캐시를 정리합니다...');
            
            // 오래된 캐시 삭제
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('board_') || key.startsWith('member_cache_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // 재시도
            localStorage.setItem('membersData', JSON.stringify(members));
            console.log('💾 캐시 정리 후 저장 완료');
        }
        
        // 개별 수강생 데이터도 저장 (빠른 접근용)
        localStorage.setItem('member_' + formData.id, JSON.stringify(formData));
        console.log('💾 개별 수강생 데이터 저장 완료');
        
        // 버전 업데이트 (캐시 무효화)
        const currentVersion = localStorage.getItem('site_version') || '1.0.0';
        const newVersion = incrementVersion(currentVersion);
        localStorage.setItem('site_version', newVersion);
        console.log('🔄 사이트 버전 업데이트:', currentVersion, '→', newVersion);
        
        console.log('✅ 프로필 저장 완료!');
        
        return true;
    } catch (error) {
        console.error('❌ 저장 실패:', error);
        throw error;
    }
}

// 버전 증가 함수
function incrementVersion(version) {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || 0) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
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

// 성공 메시지 표시
function showSuccessMessage(message) {
    // 기존 메시지 제거
    const existingMsg = document.querySelector('.message-overlay');
    if (existingMsg) existingMsg.remove();
    
    // 메시지 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'message-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    // 메시지 박스
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        background: white;
        padding: 30px 40px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 400px;
    `;
    
    messageBox.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
        <div style="font-size: 18px; font-weight: bold; color: #2ecc71; margin-bottom: 10px;">저장 완료!</div>
        <div style="font-size: 14px; color: #666;">${message}</div>
        <div style="font-size: 12px; color: #999; margin-top: 15px;">잠시 후 프로필 페이지로 이동합니다...</div>
    `;
    
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
}

// 오류 메시지 표시
function showErrorMessage(message) {
    // 기존 메시지 제거
    const existingMsg = document.querySelector('.message-overlay');
    if (existingMsg) existingMsg.remove();
    
    // 메시지 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'message-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    // 메시지 박스
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        background: white;
        padding: 30px 40px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 500px;
    `;
    
    messageBox.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
        <div style="font-size: 18px; font-weight: bold; color: #e74c3c; margin-bottom: 10px;">저장 실패</div>
        <div style="font-size: 14px; color: #666; line-height: 1.6;">${message}</div>
        <button onclick="document.querySelector('.message-overlay').remove()" 
                style="margin-top: 20px; padding: 10px 30px; background: #3498db; color: white; 
                       border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            확인
        </button>
    `;
    
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
    
    // 오버레이 클릭 시 닫기
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}
