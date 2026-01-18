// 강사 데이터 로드 및 표시
document.addEventListener('DOMContentLoaded', async function() {
    // 로그인 상태 확인
    checkLoginStatus();
    
    try {
        // localStorage에 저장된 전체 강사 데이터 확인
        const savedData = localStorage.getItem('instructorsData');
        if (savedData) {
            const instructors = JSON.parse(savedData);
            displayInstructors(instructors);
            return;
        }
        
        // localStorage에 없으면 JSON 파일에서 로드
        const response = await fetch('data/instructors.json');
        const instructors = await response.json();
        
        // 개별 강사의 업데이트된 정보가 있으면 반영
        const updatedInstructors = instructors.map(inst => {
            const saved = localStorage.getItem('instructor_' + inst.id);
            return saved ? JSON.parse(saved) : inst;
        });
        
        displayInstructors(updatedInstructors);
    } catch (error) {
        console.error('강사 데이터를 불러오는데 실패했습니다:', error);
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

function displayInstructors(instructors) {
    const grid = document.getElementById('instructorsGrid');
    
    if (!grid) return;
    
    grid.innerHTML = '';
    
    instructors.forEach(instructor => {
        const card = createInstructorCard(instructor);
        grid.appendChild(card);
    });
}

function createInstructorCard(instructor) {
    const card = document.createElement('a');
    card.href = `instructor-detail.html?id=${instructor.id}`;
    card.className = 'instructor-card';
    
    // 프로필 이미지 또는 이모지 선택
    const profileDisplay = instructor.profileImage 
        ? `<img src="${instructor.profileImage}" alt="${instructor.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
        : instructor.emoji;
    
    // 조직명이 길면 줄여서 표시
    const orgShort = instructor.organization 
        ? (instructor.organization.length > 30 
            ? instructor.organization.substring(0, 27) + '...' 
            : instructor.organization)
        : '정보 미입력';
    
    card.innerHTML = `
        <div class="instructor-photo">
            ${profileDisplay}
        </div>
        <div class="instructor-info">
            <h3>${instructor.name} 강사</h3>
            <p><strong>소속:</strong> ${orgShort}</p>
            <p><strong>전문분야:</strong> ${instructor.expertise || '정보 미입력'}</p>
            <p><strong>연락처:</strong> ${instructor.phone || '정보 미입력'}</p>
        </div>
    `;
    
    return card;
}

function displayError() {
    const grid = document.getElementById('instructorsGrid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
            <p style="color: #666; font-size: 1.1rem;">강사 정보를 불러올 수 없습니다.</p>
        </div>
    `;
}
