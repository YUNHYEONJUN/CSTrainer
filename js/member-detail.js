// 수강생 상세 정보 로드 및 표시
document.addEventListener('DOMContentLoaded', async function() {
    // ⭐ 배포 버전 확인 및 캐시 정리
    const CURRENT_VERSION = '1.0.2';
    const savedVersion = localStorage.getItem('site_version');
    if (savedVersion !== CURRENT_VERSION) {
        // 버전이 다르면 수강생 관련 캐시만 삭제
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('member_') || key === 'membersData') {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        localStorage.setItem('site_version', CURRENT_VERSION);
        console.log('✅ 캐시 업데이트 완료: v' + CURRENT_VERSION + ' (삭제된 항목: ' + keysToRemove.length + '개)');
    }
    
    // URL에서 수강생 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const memberId = parseInt(urlParams.get('id'));
    
    if (!memberId) {
        displayError('수강생 정보를 찾을 수 없습니다.');
        return;
    }
    
    try {
        // 항상 JSON 파일에서 최신 데이터 로드 (캐시 무시)
        const response = await fetch('data/members.json?v=' + Date.now());
        const members = await response.json();
        let member = members.find(m => m.id === memberId);
        
        if (!member) {
            displayError('해당 수강생 정보를 찾을 수 없습니다.');
            return;
        }
        
        // localStorage에 저장된 개별 수강생 정보가 있으면 병합
        const savedMember = localStorage.getItem('member_' + memberId);
        if (savedMember) {
            const saved = JSON.parse(savedMember);
            console.log('📦 localStorage에서 로드:', saved);
            console.log('📄 JSON 파일에서 로드:', member);
            // ⭐ JSON 파일의 profileImage를 항상 우선 사용
            saved.profileImage = member.profileImage || saved.profileImage;
            saved.emoji = member.emoji || saved.emoji;
            console.log('✅ 병합 결과:', saved);
            member = saved;
        } else {
            console.log('📄 JSON 파일에서만 로드:', member);
        }
        
        console.log('🎨 최종 렌더링 데이터:', member);
        displayMemberDetail(member);
    } catch (error) {
        console.error('수강생 정보를 불러오는데 실패했습니다:', error);
        displayError('수강생 정보를 불러올 수 없습니다.');
    }
});

function displayMemberDetail(member) {
    const detailDiv = document.getElementById('memberDetail');
    
    if (!detailDiv) return;
    
    // 페이지 타이틀 업데이트
    document.title = `${member.name} 수강생 - CS강사양성과정 8기`;
    
    // 프로필 이미지 또는 이모지
    console.log('🖼️ profileImage 체크:', member.profileImage);
    console.log('🎭 emoji 체크:', member.emoji);
    
    const profileDisplay = member.profileImage 
        ? `<img src="${member.profileImage}" alt="${member.name}" style="width: 100%; height: 100%; border-radius: 15px; object-fit: cover;">`
        : `<div style="font-size: 8rem;">${member.emoji}</div>`;
    
    console.log('🎨 렌더링 HTML:', profileDisplay.substring(0, 100));
    
    // 기본 정보 섹션
    let basicInfoHTML = `
        <div class="info-row">
            <span class="info-label">💡 관심 분야:</span>
            <span class="info-value">${member.interests || '정보 없음'}</span>
        </div>
    `;
    
    // 추가 정보가 있는 경우
    if (member.email) {
        basicInfoHTML += `
            <div class="info-row">
                <span class="info-label">📧 이메일:</span>
                <span class="info-value">${member.email}</span>
            </div>
        `;
    }
    
    if (member.phone) {
        basicInfoHTML += `
            <div class="info-row">
                <span class="info-label">📱 연락처:</span>
                <span class="info-value">${member.phone}</span>
            </div>
        `;
    }
    
    if (member.affiliation) {
        basicInfoHTML += `
            <div class="info-row">
                <span class="info-label">🏢 소속:</span>
                <span class="info-value">${member.affiliation}</span>
            </div>
        `;
    }
    
    if (member.position) {
        basicInfoHTML += `
            <div class="info-row">
                <span class="info-label">💼 직위:</span>
                <span class="info-value">${member.position}</span>
            </div>
        `;
    }
    
    // 상세 섹션들
    let detailSectionsHTML = '';
    
    // 자기소개
    if (member.introduction) {
        detailSectionsHTML += `
            <div class="detail-section">
                <h3>✨ 자기소개</h3>
                <p>${member.introduction}</p>
            </div>
        `;
    }
    
    // 학습 목표
    if (member.learningGoals) {
        detailSectionsHTML += `
            <div class="detail-section">
                <h3>🎯 학습 목표</h3>
                <p>${member.learningGoals}</p>
            </div>
        `;
    }
    
    // 경력 사항
    if (member.experience) {
        detailSectionsHTML += `
            <div class="detail-section">
                <h3>💼 경력 사항</h3>
                <p>${member.experience}</p>
            </div>
        `;
    }
    
    // 학력 사항
    if (member.education) {
        detailSectionsHTML += `
            <div class="detail-section">
                <h3>🎓 학력 사항</h3>
                <p>${member.education}</p>
            </div>
        `;
    }
    
    // 프로필 수정 버튼 (로그인한 본인만 보이도록)
    let editButtonHTML = '';
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.id === member.id) {
            editButtonHTML = `
                <div style="text-align: center; margin-top: 30px;">
                    <a href="profile-edit.html?id=${member.id}" class="btn-primary">✏️ 프로필 수정</a>
                </div>
            `;
        }
    }
    
    // 전체 HTML 구성
    detailDiv.innerHTML = `
        <div class="instructor-header">
            <div class="instructor-photo-large">
                ${profileDisplay}
            </div>
            <div class="instructor-basic-info">
                <h2>${member.name}</h2>
                ${basicInfoHTML}
            </div>
        </div>
        <div class="instructor-body">
            ${detailSectionsHTML || '<div class="detail-section"><h3>ℹ️ 정보</h3><p>아직 상세 프로필이 작성되지 않았습니다. 로그인 후 프로필을 작성해주세요!</p></div>'}
            ${editButtonHTML}
        </div>
    `;
}

function displayError(message) {
    const detailDiv = document.getElementById('memberDetail');
    if (!detailDiv) return;
    
    detailDiv.innerHTML = `
        <div class="instructor-body" style="text-align: center; padding: 100px 50px;">
            <h3 style="color: #e74c3c; margin-bottom: 20px; font-size: 1.5rem;">⚠️ 오류</h3>
            <p style="color: #666; font-size: 1.1rem; margin-bottom: 30px;">${message}</p>
            <a href="members.html" class="btn-primary">우리 동기들로 돌아가기</a>
        </div>
    `;
}
