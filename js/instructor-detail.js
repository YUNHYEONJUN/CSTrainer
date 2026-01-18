// URL 파라미터에서 강사 ID 가져오기
function getInstructorIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

// 강사 상세 정보 로드
document.addEventListener('DOMContentLoaded', async function() {
    const instructorId = getInstructorIdFromURL();
    
    if (!instructorId) {
        displayError('강사 정보를 찾을 수 없습니다.');
        return;
    }
    
    // 로그인 상태 확인
    checkLoginStatus();
    
    try {
        // 먼저 localStorage에서 업데이트된 데이터 확인
        const savedData = localStorage.getItem('instructor_' + instructorId);
        if (savedData) {
            const instructor = JSON.parse(savedData);
            displayInstructorDetail(instructor, instructorId);
            return;
        }
        
        // localStorage에 없으면 JSON 파일에서 로드
        const response = await fetch('data/instructors.json');
        const instructors = await response.json();
        
        const instructor = instructors.find(i => i.id === instructorId);
        
        if (instructor) {
            displayInstructorDetail(instructor, instructorId);
        } else {
            displayError('해당 강사 정보를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('강사 데이터를 불러오는데 실패했습니다:', error);
        displayError('강사 정보를 불러올 수 없습니다.');
    }
});

// 로그인 상태 확인 및 네비게이션 업데이트
function checkLoginStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const authLink = document.querySelector('#authLink');
    
    if (currentUser && authLink) {
        const user = JSON.parse(currentUser);
        authLink.textContent = `${user.name} (로그아웃)`;
        authLink.href = '#';
        authLink.onclick = function(e) {
            e.preventDefault();
            if (confirm('로그아웃 하시겠습니까?')) {
                localStorage.removeItem('currentUser');
                window.location.reload();
            }
        };
    }
}

function displayInstructorDetail(instructor, instructorId) {
    const detailContainer = document.getElementById('instructorDetail');
    
    if (!detailContainer) return;
    
    // 현재 로그인한 사용자 확인
    const currentUser = localStorage.getItem('currentUser');
    let editButton = '';
    
    if (currentUser) {
        const user = JSON.parse(currentUser);
        // 본인의 프로필인 경우에만 수정 버튼 표시
        if (user.name === instructor.name) {
            editButton = `
                <div style="text-align: center; margin: 20px 0;">
                    <a href="profile-edit.html" class="btn-primary" style="display: inline-block; text-decoration: none; padding: 12px 30px;">
                        ✏️ 프로필 수정
                    </a>
                </div>
            `;
        }
    }
    
    // 프로필 이미지 또는 이모지 선택
    const profileDisplay = instructor.profileImage 
        ? `<img src="${instructor.profileImage}" alt="${instructor.name}" style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">`
        : `<div style="font-size: 120px; line-height: 1;">${instructor.emoji}</div>`;
    
    // 추가 정보 섹션 구성
    let additionalInfo = '';
    
    if (instructor.email) {
        additionalInfo += `
            <div class="info-row">
                <span class="info-label">📧 이메일:</span>
                <span class="info-value"><a href="mailto:${instructor.email}" style="color: #667eea; text-decoration: none;">${instructor.email}</a></span>
            </div>`;
    }
    
    if (instructor.position) {
        additionalInfo += `
            <div class="info-row">
                <span class="info-label">👔 직위:</span>
                <span class="info-value">${instructor.position}</span>
            </div>`;
    }
    
    if (instructor.additionalRole) {
        additionalInfo += `
            <div class="info-row">
                <span class="info-label">🎓 겸직:</span>
                <span class="info-value">${instructor.additionalRole}</span>
            </div>`;
    }
    
    // 학력/경력/저서 섹션
    let detailSections = '';
    
    if (instructor.education) {
        detailSections += `
            <div class="detail-section">
                <h3>🎓 학력사항</h3>
                <p>${instructor.education}</p>
            </div>`;
    }
    
    if (instructor.career) {
        detailSections += `
            <div class="detail-section">
                <h3>💼 현장경력</h3>
                <p>${instructor.career}</p>
            </div>`;
    }
    
    if (instructor.teachingCareer) {
        detailSections += `
            <div class="detail-section">
                <h3>👨‍🏫 강의경력</h3>
                <p>${instructor.teachingCareer}</p>
            </div>`;
    }
    
    if (instructor.publication) {
        detailSections += `
            <div class="detail-section">
                <h3>📚 저서</h3>
                <p>${instructor.publication}</p>
            </div>`;
    }
    
    detailContainer.innerHTML = `
        ${editButton}
        <div class="instructor-header">
            <div class="instructor-photo-large">
                ${profileDisplay}
            </div>
            <div class="instructor-basic-info">
                <h2>${instructor.name} 강사</h2>
                <div class="info-row">
                    <span class="info-label">📞 연락처:</span>
                    <span class="info-value">${instructor.phone || '정보 미입력'}</span>
                </div>
                ${additionalInfo}
                <div class="info-row">
                    <span class="info-label">🏢 소속:</span>
                    <span class="info-value">${instructor.organization || '정보 미입력'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">💼 전문분야:</span>
                    <span class="info-value">${instructor.expertise || '정보 미입력'}</span>
                </div>
            </div>
        </div>
        <div class="instructor-body">
            <div class="detail-section">
                <h3>소개</h3>
                <p>${instructor.description || '프로필 정보를 입력해주세요.'}</p>
            </div>
            ${detailSections}
        </div>
    `;
    
    // 페이지 타이틀 업데이트
    document.title = `${instructor.name} 강사 - CS강사양성과정`;
}

function displayError(message) {
    const detailContainer = document.getElementById('instructorDetail');
    if (!detailContainer) return;
    
    detailContainer.innerHTML = `
        <div style="text-align: center; padding: 100px 20px;">
            <p style="color: #666; font-size: 1.2rem; margin-bottom: 30px;">${message}</p>
            <a href="instructors.html" class="btn-primary" style="display: inline-block; text-decoration: none;">
                강사 목록으로 돌아가기
            </a>
        </div>
    `;
}
