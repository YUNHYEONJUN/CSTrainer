// 수강생 데이터 로드 및 표시
document.addEventListener('DOMContentLoaded', async function() {
    // 로그인 상태 확인
    checkLoginStatus();
    
    try {
        console.log('📋 수강생 목록 로드 시작...');
        
        // 1. 항상 JSON 파일에서 최신 데이터 로드 (캐시 무시)
        const response = await fetch('data/members.json?v=' + Date.now());
        const members = await response.json();
        console.log('✅ JSON 파일 로드 완료:', members.length + '명');
        
        // 2. localStorage에 저장된 업데이트된 정보 확인
        const cachedData = localStorage.getItem('membersData');
        let updatedMembers = members;
        
        if (cachedData) {
            try {
                const cachedMembers = JSON.parse(cachedData);
                console.log('💾 localStorage에서 업데이트된 데이터 발견:', cachedMembers.length + '명');
                
                // 3. JSON 데이터와 localStorage 데이터 병합
                updatedMembers = members.map(member => {
                    const cached = cachedMembers.find(m => m.id === member.id);
                    if (cached) {
                        // localStorage의 수정된 데이터 우선 사용
                        // 단, profileImage는 JSON 파일이 비어있지 않으면 JSON 우선
                        return {
                            ...member,        // JSON 기본 데이터
                            ...cached,        // localStorage 수정 데이터
                            profileImage: member.profileImage || cached.profileImage,  // JSON 우선
                            emoji: member.emoji || cached.emoji  // JSON 우선
                        };
                    }
                    return member;
                });
                
                console.log('🔄 데이터 병합 완료');
            } catch (parseError) {
                console.warn('⚠️ localStorage 데이터 파싱 실패, JSON 데이터만 사용:', parseError);
            }
        }
        
        displayMembers(updatedMembers);
        console.log('✅ 수강생 목록 표시 완료');
        
    } catch (error) {
        console.error('❌ 수강생 데이터를 불러오는데 실패했습니다:', error);
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
