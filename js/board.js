// 게시판 데이터 저장소 (localStorage 사용)
let currentPage = 1;
const postsPerPage = 10;
let currentView = 'list'; // 'list' or 'detail'
let currentPostId = null;
let searchKeyword = '';

// 게시판 타입 확인
function getBoardType() {
    const path = window.location.pathname;
    if (path.includes('board-info')) return 'info';
    if (path.includes('board-free')) return 'free';
    if (path.includes('board-study')) return 'study';
    return 'info';
}

// localStorage 키 생성
function getStorageKey(type = 'posts') {
    const boardType = getBoardType();
    return `board_${boardType}_${type}`;
}

// 게시글 가져오기
function getPosts() {
    const key = getStorageKey('posts');
    const posts = localStorage.getItem(key);
    return posts ? JSON.parse(posts) : [];
}

// 게시글 저장
function savePosts(posts) {
    const key = getStorageKey('posts');
    localStorage.setItem(key, JSON.stringify(posts));
}

// 댓글 가져오기
function getComments(postId) {
    const key = getStorageKey('comments');
    const allComments = localStorage.getItem(key);
    const comments = allComments ? JSON.parse(allComments) : {};
    return comments[postId] || [];
}

// 댓글 저장
function saveComments(postId, comments) {
    const key = getStorageKey('comments');
    const allComments = JSON.parse(localStorage.getItem(key) || '{}');
    allComments[postId] = comments;
    localStorage.setItem(key, JSON.stringify(allComments));
}

// 파일 첨부 정보 저장 (Base64)
function saveFile(file) {
    return new Promise((resolve, reject) => {
        // 파일 크기 제한: 500KB (localStorage 용량 절약)
        const MAX_FILE_SIZE = 500 * 1024; // 500KB
        
        if (file.size > MAX_FILE_SIZE) {
            console.warn(`⚠️ 파일 크기 초과: ${file.name} (${(file.size / 1024).toFixed(2)}KB > 500KB)`);
            // 파일 정보만 저장 (데이터는 저장하지 않음)
            resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                data: null, // 데이터 저장 안 함
                note: '파일이 너무 커서 미리보기를 지원하지 않습니다.'
            });
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 현재 로그인 사용자 정보
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// localStorage 사용량 확인
function checkStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    const totalKB = (total / 1024).toFixed(2);
    const totalMB = (total / 1024 / 1024).toFixed(2);
    console.log(`💾 localStorage 사용량: ${totalKB}KB (${totalMB}MB)`);
    
    // 5MB 이상 사용 시 경고
    if (total > 5 * 1024 * 1024) {
        console.warn('⚠️ localStorage 사용량이 5MB를 초과했습니다!');
        return false;
    }
    return true;
}

// 게시글 목록 표시
function displayPosts() {
    let posts = getPosts();
    const boardList = document.getElementById('boardList');
    
    if (!boardList) return;
    
    // 검색 필터링
    if (searchKeyword) {
        posts = posts.filter(post => 
            post.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            post.content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            post.author.toLowerCase().includes(searchKeyword.toLowerCase())
        );
    }
    
    // 최신순 정렬
    posts.sort((a, b) => b.id - a.id);
    
    // 페이지네이션
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentPosts = posts.slice(startIndex, endIndex);
    
    boardList.innerHTML = '';
    
    if (currentPosts.length === 0) {
        boardList.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 80px 20px; color: #999;">
                    ${searchKeyword ? '검색 결과가 없습니다.' : ''}
                </td>
            </tr>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    currentPosts.forEach((post, index) => {
        const row = document.createElement('tr');
        const displayNumber = posts.length - startIndex - index;
        const commentCount = getComments(post.id).length;
        const hasFile = post.files && post.files.length > 0;
        
        row.innerHTML = `
            <td>${displayNumber}</td>
            <td class="col-title">
                <a href="#" onclick="viewPost(${post.id}); return false;">
                    ${post.title}
                    ${commentCount > 0 ? `<span style="color: var(--secondary-color); margin-left: 5px;">[${commentCount}]</span>` : ''}
                    ${hasFile ? '<span style="color: var(--accent-color); margin-left: 5px;">📎</span>' : ''}
                </a>
            </td>
            <td>${post.author}</td>
            <td>${post.date}</td>
            <td>${post.views}</td>
        `;
        
        boardList.appendChild(row);
    });
    
    // 페이지네이션 업데이트
    updatePagination(posts.length);
}

// 페이지네이션 업데이트
function updatePagination(totalPosts) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    pagination.innerHTML = '';
    
    // 이전 버튼
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '‹';
        prevBtn.onclick = () => {
            currentPage--;
            displayPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        pagination.appendChild(prevBtn);
    }
    
    // 페이지 번호
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = i === currentPage ? 'active' : '';
        button.onclick = () => {
            currentPage = i;
            displayPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        pagination.appendChild(button);
    }
    
    // 다음 버튼
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '›';
        nextBtn.onclick = () => {
            currentPage++;
            displayPosts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        pagination.appendChild(nextBtn);
    }
}

// 글쓰기 폼 표시
function showWriteForm() {
    const user = getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    // 공지사항 게시판은 관리자만 글쓰기 가능
    const boardType = getBoardType();
    if (boardType === 'info' && user.role !== 'admin') {
        alert('공지사항은 관리자만 작성할 수 있습니다.');
        return;
    }
    
    const formSection = document.getElementById('writeFormSection');
    if (formSection) {
        formSection.style.display = 'block';
        document.getElementById('author').value = user.name;
        document.getElementById('title').focus();
        window.scrollTo({ 
            top: formSection.offsetTop - 100, 
            behavior: 'smooth' 
        });
    }
}

// 글쓰기 폼 숨기기
function hideWriteForm() {
    const formSection = document.getElementById('writeFormSection');
    if (formSection) {
        formSection.style.display = 'none';
        document.getElementById('writeForm').reset();
        document.getElementById('fileList').innerHTML = '';
    }
}

// 파일 선택 처리
function handleFileSelect(event) {
    const files = event.target.files;
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    if (files.length > 0) {
        fileList.style.display = 'block';
        Array.from(files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.style.padding = '5px';
            fileItem.style.marginBottom = '5px';
            fileItem.style.backgroundColor = '#f5f5f5';
            fileItem.style.borderRadius = '3px';
            fileItem.innerHTML = `
                <span>📎 ${file.name}</span>
                <span style="color: #999; margin-left: 10px;">(${(file.size / 1024).toFixed(1)} KB)</span>
            `;
            fileList.appendChild(fileItem);
        });
    } else {
        fileList.style.display = 'none';
    }
}

// 게시글 작성
async function submitPost(e) {
    e.preventDefault();
    console.log('📝 게시글 작성 시작');
    
    try {
        const user = getCurrentUser();
        console.log('👤 현재 사용자:', user);
        
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        const title = document.getElementById('title').value.trim();
        const content = document.getElementById('content').value.trim();
        const fileInput = document.getElementById('fileAttachment');
        
        console.log('📄 제목:', title);
        console.log('📄 내용 길이:', content.length);
        
        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }
        
        const posts = getPosts();
        const newId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
        
        // 파일 처리
        const files = [];
        if (fileInput && fileInput.files.length > 0) {
            console.log('📎 파일 첨부 개수:', fileInput.files.length);
            
            // 전체 파일 크기 확인
            let totalSize = 0;
            for (let i = 0; i < fileInput.files.length; i++) {
                totalSize += fileInput.files[i].size;
            }
            console.log(`📊 전체 파일 크기: ${(totalSize / 1024).toFixed(2)}KB`);
            
            // 1MB 초과 시 경고
            if (totalSize > 1024 * 1024) {
                if (!confirm('⚠️ 첨부 파일이 1MB를 초과합니다.\n\n큰 파일은 미리보기가 지원되지 않을 수 있습니다.\n\n계속 진행하시겠습니까?')) {
                    return;
                }
            }
            
            for (let i = 0; i < fileInput.files.length; i++) {
                try {
                    const fileData = await saveFile(fileInput.files[i]);
                    files.push(fileData);
                    console.log('✅ 파일 저장:', fileInput.files[i].name);
                } catch (error) {
                    console.error('❌ 파일 저장 오류:', error);
                    alert(`파일 저장 실패: ${fileInput.files[i].name}`);
                }
            }
        }
        
        const newPost = {
            id: newId,
            title: title,
            author: user.name,
            authorId: user.id,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            views: 0,
            content: content,
            files: files
        };
        
        posts.push(newPost);
        
        // localStorage 용량 확인
        checkStorageUsage();
        
        try {
            savePosts(posts);
            console.log('✅ 게시글 저장 완료:', newPost);
            console.log('📊 전체 게시글 수:', posts.length);
        } catch (error) {
            console.error('❌ 게시글 저장 실패:', error);
            
            if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                alert('⚠️ 저장 공간이 부족합니다!\n\n해결 방법:\n1. 파일 첨부를 줄이세요 (500KB 이하 권장)\n2. F12 → Console에서 다음 명령 실행:\n   localStorage.clear();\n\n이전 게시글 데이터가 삭제될 수 있습니다.');
            } else {
                alert('게시글 저장 중 오류가 발생했습니다.');
            }
            
            // 실패한 게시글 제거
            posts.pop();
            return;
        }
        
        hideWriteForm();
        currentPage = 1;
        searchKeyword = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        displayPosts();
        
        alert('게시글이 등록되었습니다.');
    } catch (error) {
        console.error('❌ 게시글 등록 중 오류 발생:', error);
        alert('게시글 등록 중 오류가 발생했습니다.\n\n오류: ' + error.message);
    }
}

// 게시글 상세보기
function viewPost(postId) {
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        alert('게시글을 찾을 수 없습니다.');
        return;
    }
    
    // 조회수 증가
    post.views++;
    savePosts(posts);
    
    currentView = 'detail';
    currentPostId = postId;
    
    // 게시글 상세 HTML 생성
    const boardList = document.querySelector('.board-list');
    const pagination = document.getElementById('pagination');
    const boardActions = document.querySelector('.board-actions');
    
    if (boardList) {
        boardList.style.display = 'none';
    }
    if (pagination) {
        pagination.style.display = 'none';
    }
    if (boardActions) {
        boardActions.style.display = 'none';
    }
    
    // 상세보기 HTML 생성
    let detailHtml = `
        <div id="postDetail" class="post-detail">
            <div class="post-header">
                <h2 class="post-title">${post.title}</h2>
                <div class="post-meta">
                    <span>작성자: ${post.author}</span>
                    <span>작성일: ${post.date} ${post.time || ''}</span>
                    <span>조회수: ${post.views}</span>
                </div>
            </div>
            <div class="post-content">
                ${post.content.replace(/\n/g, '<br>')}
            </div>
    `;
    
    // 첨부파일 표시
    if (post.files && post.files.length > 0) {
        detailHtml += `
            <div class="post-files">
                <h4>📎 첨부파일</h4>
                <ul>
        `;
        post.files.forEach((file, index) => {
            detailHtml += `
                <li>
                    <a href="${file.data}" download="${file.name}">
                        ${file.name} (${(file.size / 1024).toFixed(1)} KB)
                    </a>
                </li>
            `;
        });
        detailHtml += `
                </ul>
            </div>
        `;
    }
    
    // 댓글 섹션
    detailHtml += `
            <div class="post-comments">
                <h3>💬 댓글 <span id="commentCount">(${getComments(postId).length})</span></h3>
                <div id="commentsList"></div>
                <div class="comment-form">
                    <textarea id="commentContent" placeholder="댓글을 입력하세요..."></textarea>
                    <button onclick="submitComment()" class="btn-primary">댓글 작성</button>
                </div>
            </div>
            <div class="post-actions">
                <button onclick="backToList()" class="btn-secondary">목록으로</button>
            </div>
        </div>
    `;
    
    // 게시글 목록 테이블 뒤에 상세보기 추가
    const container = document.querySelector('.board-section .container');
    const detailDiv = document.createElement('div');
    detailDiv.innerHTML = detailHtml;
    container.appendChild(detailDiv);
    
    // 삭제 버튼 추가 (작성자 또는 관리자만)
    const user = getCurrentUser();
    const boardType = getBoardType();
    const postActions = detailDiv.querySelector('.post-actions');
    
    if (user && (post.authorId === user.id || user.role === 'admin')) {
        // 공지사항은 관리자만 삭제 가능
        if (boardType !== 'info' || user.role === 'admin') {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️ 삭제';
            deleteBtn.className = 'btn-danger';
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.onclick = () => deletePost(postId);
            postActions.appendChild(deleteBtn);
        }
    }
    
    // 댓글 표시
    displayComments(postId);
    
    // 스크롤을 상단으로
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 댓글 표시
function displayComments(postId) {
    const comments = getComments(postId);
    const commentsList = document.getElementById('commentsList');
    
    if (!commentsList) return;
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="text-align: center; color: #999; padding: 30px;">첫 번째 댓글을 작성해보세요!</p>';
        return;
    }
    
    commentsList.innerHTML = '';
    
    comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.innerHTML = `
            <div class="comment-header">
                <strong>${comment.author}</strong>
                <span>${comment.date} ${comment.time}</span>
            </div>
            <div class="comment-content">
                ${comment.content.replace(/\n/g, '<br>')}
            </div>
        `;
        commentsList.appendChild(commentDiv);
    });
}

// 댓글 작성
function submitComment() {
    const user = getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const content = document.getElementById('commentContent').value.trim();
    
    if (!content) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }
    
    const comments = getComments(currentPostId);
    const newComment = {
        id: comments.length > 0 ? Math.max(...comments.map(c => c.id)) + 1 : 1,
        author: user.name,
        authorId: user.id,
        content: content,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    
    comments.push(newComment);
    saveComments(currentPostId, comments);
    
    document.getElementById('commentContent').value = '';
    document.getElementById('commentCount').textContent = `(${comments.length})`;
    displayComments(currentPostId);
    
    alert('댓글이 등록되었습니다.');
}

// 목록으로 돌아가기
function backToList() {
    const postDetail = document.getElementById('postDetail');
    if (postDetail) {
        postDetail.parentElement.remove();
    }
    
    const boardList = document.querySelector('.board-list');
    const pagination = document.getElementById('pagination');
    const boardActions = document.querySelector('.board-actions');
    
    if (boardList) {
        boardList.style.display = 'block';
    }
    if (pagination) {
        pagination.style.display = 'flex';
    }
    if (boardActions) {
        boardActions.style.display = 'flex';
    }
    
    currentView = 'list';
    currentPostId = null;
    
    displayPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 검색 기능
function searchPosts() {
    searchKeyword = document.getElementById('searchInput').value.trim();
    currentPage = 1;
    displayPosts();
}

// Enter 키로 검색
function handleSearchKeyPress(event) {
    if (event.key === 'Enter') {
        searchPosts();
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    const writeForm = document.getElementById('writeForm');
    
    if (writeForm) {
        writeForm.addEventListener('submit', submitPost);
    }
    
    const fileInput = document.getElementById('fileAttachment');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // 초기 게시글 목록 표시
    if (currentView === 'list') {
        displayPosts();
    }
});

// 게시글 삭제 (작성자 또는 관리자만 가능)
function deletePost(postId) {
    const user = getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        alert('게시글을 찾을 수 없습니다.');
        return;
    }
    
    // 공지사항은 관리자만 삭제 가능
    const boardType = getBoardType();
    if (boardType === 'info' && user.role !== 'admin') {
        alert('공지사항은 관리자만 삭제할 수 있습니다.');
        return;
    }
    
    // 작성자 또는 관리자만 삭제 가능
    if (post.authorId !== user.id && user.role !== 'admin') {
        alert('자신이 작성한 글만 삭제할 수 있습니다.');
        return;
    }
    
    if (!confirm('정말 삭제하시겠습니까?')) {
        return;
    }
    
    // 게시글 삭제
    const updatedPosts = posts.filter(p => p.id !== postId);
    savePosts(updatedPosts);
    
    // 댓글도 삭제
    const key = getStorageKey('comments');
    const allComments = JSON.parse(localStorage.getItem(key) || '{}');
    delete allComments[postId];
    localStorage.setItem(key, JSON.stringify(allComments));
    
    alert('게시글이 삭제되었습니다.');
    backToList();
}
