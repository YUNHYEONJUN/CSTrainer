// 수강생 데이터 로드 및 표시
document.addEventListener('DOMContentLoaded', async function() {
    // 로그인 상태 확인
    checkLoginStatus();
    
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
    
    try {
        // 항상 JSON 파일에서 최신 데이터 로드 (캐시 무시)
        const response = await fetch('data/members.json?v=' + Date.now());
        const members = await response.json();
        
        // 개별 수강생의 업데이트된 정보가 있으면 반영
        const updatedMembers = members.map(member => {
            const saved = localStorage.getItem('member_' + member.id);
            if (saved) {
                const savedMember = JSON.parse(saved);
                // ⭐ JSON 파일의 profileImage를 항상 우선 사용
                savedMember.profileImage = member.profileImage || savedMember.profileImage;
                savedMember.emoji = member.emoji || savedMember.emoji;
                return savedMember;
            }
            return member;
        });
        
        displayMembers(updatedMembers);
    } catch (error) {
        console.error('수강생 데이터를 불러오는데 실패했습니다:', error);
        displayError();
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

function displayMembers(members) {
    const grid = document.getElementById('membersGrid');
    
    if (!grid) return;
    
    grid.innerHTML = '';
    
    members.forEach(member => {
        const card = createMemberCard(member);
        grid.appendChild(card);
    });
}

function createMemberCard(member) {
    const card = document.createElement('a');
    card.href = `member-detail.html?id=${member.id}`;
    card.className = 'member-card';
    
    // 프로필 이미지 또는 이모지 선택
    const profileDisplay = member.profileImage 
        ? `<img src="${member.profileImage}" alt="${member.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
        : `<div style="font-size: 60px;">${member.emoji}</div>`;
    
    // 관심 분야 표시
    const interests = member.interests 
        ? `<p class="member-interests">💡 ${member.interests}</p>`
        : '<p class="member-interests" style="color: #999;">프로필을 작성해주세요</p>';
    
    card.innerHTML = `
        <div class="member-photo">
            ${profileDisplay}
        </div>
        <div class="member-info">
            <h3>${member.name}</h3>
            ${interests}
            <p class="member-intro">${member.introduction ? member.introduction.substring(0, 60) + '...' : '소개를 작성해주세요'}</p>
        </div>
    `;
    
    return card;
}

function displayError() {
    const grid = document.getElementById('membersGrid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
            <p style="color: #666; font-size: 1.1rem;">수강생 정보를 불러올 수 없습니다.</p>
        </div>
    `;
}
