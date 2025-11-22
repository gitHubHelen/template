function fetchData(studentName, examId) {
    return fetch(`http://121.43.26.102:3000/api/error-questions/${studentName}/${examId}`, {
  method: 'GET',
  mode: 'cors',
  credentials: 'include'
})
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // 解析JSON数据
        })
        .then(data => {
            console.log(data); // 使用数据
            return data
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            return error
        });
}

// 模拟发送到服务器的函数
function sendToServer(data) {
    console.log(data, JSON.stringify(data))
    // 在实际应用中，这里应该使用fetch或XMLHttpRequest将数据发送到服务器
    fetch(`http://121.43.26.102:3000/api/error-questions/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('提交成功:', data);
        })
        .catch((error) => {
            console.error('提交错误:', error);
        });
}

// 下载数据
function DownloadExam() {
    const exportData = {}
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.download = `错题记录_${studentName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// 计时器功能
let totalSeconds = 60 * 60; // 60分钟
const timerInterval = null;
function updateTimer(timerElement) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    console.log(totalSeconds)
    if (totalSeconds <= 0) {
        clearInterval(timerInterval);
        // alert('考试时间到！系统将自动提交试卷。');
        submitExam();
    } else {
        totalSeconds--;
    }
}

window.onload = function () {
    let examData = [],
        examId = 'CIE202406',
        wrongtitles = [];


    const timerElement = document.getElementById('timer');


    // 初始化考试
    // document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('get-btn').addEventListener('click', function () {
        let studentName = document.getElementById('student-name').value.trim()
        if (!studentName) {
            alert('宝儿，输入你的姓名哈！')
            return
        }
        fetchData(studentName, examId).then(res => {
            if (!res.data && res.status == '0') {
                alert('宝儿，检查检查你的姓名有没有输错 😯')
                alert(`宝儿，你参加过${examId}的考试吗？`)
                alert('那么，宝儿，你应该是满分选手，没有错题哦')
                return
            }
            examData = res.data
            // 渲染题目总数、总分值、总时间
            document.getElementById('total-titles').textContent = examData.length;
            document.getElementById('total-score').textContent = examData.length * 2;
            document.getElementById('total-time').textContent = examData.length * 1;

            // 填充学生 id
            document.getElementById('student-id').value = res.id

            //计时器
            totalSeconds = examData.length * 60;
            renderQuestions();
            setInterval(updateTimer.bind(null, timerElement), 1000);
        }).catch(error => {
            console.log(error)
        })
    });
    document.getElementById('submit-btn').addEventListener('click', submitExam);
    document.getElementById('reset-btn').addEventListener('click', resetExam);
    document.getElementById('export-btn').addEventListener('click', exportWrongList);


    // });

    // 渲染题目
    function renderQuestions() {
        const container = document.getElementById('titles-container');
        container.innerHTML = '';

        examData.forEach(title => {
            const titleEl = document.createElement('div');
            titleEl.className = 'title';
            titleEl.id = `title-${title.id}`;

            let titleHTML = `
                    <div class="title-title">
                        ${title.id}. ${title.title}
                    </div>
                `;

            let imgs = JSON.parse(title.image)
            if (imgs) {
                titleHTML += `
                        <div class="title-image">
                            <img src="${imgs[0]}" alt="题目图片">
                    `;
                if (imgs[1]) {
                    titleHTML += `<img src="${imgs[1]}" alt="题目图片">
                        </div>`
                }
            }

            titleHTML += `<div class="options">`;

            JSON.parse(title.options).forEach(option => {
                titleHTML += `
                        <div class="option">
                            <input type="radio" id="q${title.id}_${option.id}" name="${title.id}" value="${option.id}">
                            <label for="q${title.id}_${option.id}">
                                <div class="option-content">
                                    ${option.id}. ${option.text || ''}
                                    ${option.image ? `<img src="${option.image}" alt="选项图片">` : ''}
                                </div>
                            </label>
                        </div>
                    `;
            });

            titleHTML += `</div>`;
            titleHTML += `<div class="title-result" id="result-${title.id}"></div>`;

            titleEl.innerHTML = titleHTML;
            container.appendChild(titleEl);
        });
    }

    // 提交考试
    function submitExam() {
        const studentName = document.getElementById('student-name').value.trim();
        const studentId = document.getElementById('student-id').value.trim();
        const studentClass = document.getElementById('student-class').value.trim();

        // 验证个人信息
        if (!studentName) {
            alert('请填写完整的个人信息！');
            return;
        }

        let score = 0;
        const totaltitles = examData.length;
        wrongtitles = []; // 重置错题数组

        examData.forEach(title => {
            const selectedOption = document.querySelector(`input[name="${title.id}"]:checked`);
            const resultEl = document.getElementById(`result-${title.id}`);

            if (selectedOption) {
                if (selectedOption.value === title.correctAnswer) {
                    score += 2;
                    resultEl.innerHTML = `
                            <div class="correct">
                                <span class="answer-status correct-answer">✓ 回答正确</span>
                                <div class="explanation">${title.explanation}</div>
                            </div>
                        `;
                } else {
                    resultEl.innerHTML = `
                            <div class="incorrect">
                                <span class="answer-status incorrect-answer">✗ 回答错误</span>
                                <div>正确答案: <span class="correct-answer">${title.correctAnswer}</span></div>
                                <div class="explanation">${title.explanation}</div>
                            </div>
                        `;

                    // 添加到错题数组
                    wrongtitles.push({
                        id: title.id,
                        title: title.title,
                        correctAnswer: title.correctAnswer,
                        userAnswer: selectedOption.value,
                        explanation: title.explanation
                    });
                }
            } else {
                resultEl.innerHTML = `
                        <div class="incorrect">
                            <span class="answer-status incorrect-answer">未作答</span>
                            <div>正确答案: <span class="correct-answer">${title.correctAnswer}</span></div>
                            <div class="explanation">${title.explanation}</div>
                        </div>
                    `;

                // 添加到错题数组
                wrongtitles.push({
                    id: title.id,
                    title: title.title,
                    correctAnswer: title.correctAnswer,
                    userAnswer: "未作答",
                    explanation: title.explanation
                });
            }
        });

        const resultContainer = document.getElementById('result');
        let wrongtitlesHTML = '';

        if (wrongtitles.length > 0) {
            wrongtitlesHTML = `
                    <div class="wrong-titles-summary">
                        <h3>错题汇总 (${wrongtitles.length}题)</h3>
                        ${wrongtitles.map(q => `
                            <div class="wrong-title-item">
                                <p><strong>题目${q.id}:</strong> ${q.title}</p>
                                <p><strong>你的答案:</strong> ${q.userAnswer}</p>
                                <p><strong>正确答案:</strong> ${q.correctAnswer}</p>
                                <p><strong>解析:</strong> ${q.explanation}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
        }

        resultContainer.innerHTML = `
                <div class="student-info-display">
                    <p><strong>考生信息</strong></p>
                    <p>姓名: ${studentName}</p>
                    <p>学号: ${studentId}</p>
                    <p>班级: ${studentClass}</p>
                </div>
                <div class="score">得分: ${score}/${totaltitles * 2}</div>
                ${wrongtitlesHTML}
            `;
        resultContainer.style.display = 'block';

        // 禁用所有选项
        document.querySelectorAll('input[type="radio"]').forEach(input => {
            input.disabled = true;
        });

        // 禁用个人信息输入
        document.getElementById('student-name').disabled = true;
        document.getElementById('student-id').disabled = true;
        document.getElementById('student-class').disabled = true;

        // 显示导出按钮
        if (wrongtitles.length > 0) {
            document.getElementById('export-btn').style.display = 'inline-block';
        }

        // 滚动到结果区域
        resultContainer.scrollIntoView({ behavior: 'smooth' });

        // 停止计时器
        clearInterval(timerInterval);

        // 保存错题
        exportWrongList()
    }

    // 重置考试
    function resetExam() {
        document.querySelectorAll('input[type="radio"]').forEach(input => {
            input.checked = false;
            input.disabled = false;
        });

        document.querySelectorAll('.title-result').forEach(el => {
            el.innerHTML = '';
        });

        document.getElementById('result').style.display = 'none';
        document.getElementById('export-btn').style.display = 'none';

        // 启用个人信息输入
        document.getElementById('student-name').disabled = false;
        document.getElementById('student-id').disabled = false;
        document.getElementById('student-class').disabled = false;

        // 清空错题数组
        wrongtitles = [];
    }

    // 导出错题为JSON文件
    function exportWrongList() {
        if (wrongtitles.length === 0) {
            alert('没有错题可以导出！');
            return;
        }

        // const studentName = document.getElementById('student-name').value.trim();
        const studentId = document.getElementById('student-id').value.trim();
        // const studentClass = document.getElementById('student-class').value.trim();

        console.log(wrongtitles.map(item => item.id))
        const exportData = {
            uId: studentId,
            examId: 'CIE202406',
            wrongList: wrongtitles.map(item => item.id),
            exportTime: new Date().toLocaleString('zh-CN'),
            timeUsed: timerElement.textContent
        };

        sendToServer(exportData)
    }
}
