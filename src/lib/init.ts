interface Project {
    key: string;
    jarfile_key: string;
    name: string;
    due: Date;
}

interface SubmissionResult {
    score: number;
    max: number;
    date: Date;
    key: string;
    result?: Array<TestResult>;
}

interface TestResult {
    type:'public'|'private'|'release';
    index: number;
    passed: boolean;
    points: number;
    name: string;
    shortResult: string;
    longResult: string;
}

interface ResultSet {
    best: SubmissionResult;
    last: SubmissionResult;
    all: Array<SubmissionResult>;
}

let dtFormat = new Intl.DateTimeFormat(window.navigator.language, {
    
});

let pendingCount = 0;
let allResultsByProject: Map<string, ResultSet> = new Map<string, ResultSet>();
let allResultsByKey: Map<string, SubmissionResult> = new Map<string, SubmissionResult>();

let test_open = false;
let test_open_count = 0;
let test_listener;
let test_box: HTMLElement;
let test_content: HTMLElement;

function moveTestBox(ev: MouseEvent) {
    test_box.style.left = ''+ev.clientX;
    test_box.style.top = ''+ev.clientY;
}

function openTest(): void {
    console.log()
    ++test_open_count;
    if (!test_open) {
        document.addEventListener('mousemove', moveTestBox);
        test_box.classList.add('open');
        test_open = true;
    }
}

function closeTest(): void {
    --test_open_count;
    if (!test_open_count) {
        document.removeEventListener('mousemove', moveTestBox);
        test_box.classList.remove('open');
        test_open = false;
    }
}



function showTestDetails(test: string): void {
    console.log(`mouse over: ${test}`);
    let result: SubmissionResult;
    if (test.startsWith('lr_')) {
        result = allResultsByProject.get(test.substr(3)).last;
    } else if (test.startsWith('br_')) {
        result = allResultsByProject.get(test.substr(3)).best;
    } else {
        result = allResultsByKey.get(test);
    }
    getResultDetails(result).then(result => {
        while(test_content.lastChild) {
            test_content.removeChild(test_content.lastChild);
        }
        result.result.forEach(result => {
            let row = document.createElement('tr');
            let passed = document.createElement('td');
            let p_icon = document.createElement('i');
            p_icon.classList.add('fa', `fa-${result.passed ? 'check' : 'times'}-circle`);
            passed.appendChild(p_icon);
            let points = document.createElement('td');
            points.innerText = ''+result.points;
            let type = document.createElement('td');
            type.innerText = result.type;
            let name = document.createElement('td');
            name.innerText = result.name;
            row.appendChild(passed);
            row.appendChild(points);
            row.appendChild(type);
            row.appendChild(name);
            test_content.appendChild(row);
        });

        openTest();
    });
}

function hideTestDetails(): void {
    console.log(`mouse out`);
    closeTest();
}

function showSubmitDialogue(key: string): void {

}

function showMore(project: Project, row: HTMLElement) {

}

function getResultDetails(result: SubmissionResult): Promise<SubmissionResult> {
    if (!result.result) {
        return getHTML(`https://marmoset.student.cs.uwaterloo.ca/view/submission.jsp?submissionPK=${result.key}`).then(html => {
            let rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
            rows.shift();
            let results = rows.map(row => {
                let tds = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
                let type = tds[0].match(/>([^<]*)</)[1];
                let index = +tds[1].match(/>([^<]*)</)[1];
                let passed = tds[2].match(/>([^<]*)</)[1] == 'passed';
                let points = +tds[3].match(/>([^<]*)</)[1];
                let name = tds[4].match(/>([^<]*)</)[1];
                let shortResult = tds[5].match(/>\s*([^<]+?)\s*</)[1];
                let longResult = tds[6].match(/>\s*([^<]+?)\s*</)[1];
                return <TestResult>{
                    index: index,
                    longResult: longResult,
                    name: name,
                    passed: passed,
                    points: points,
                    shortResult: shortResult,
                    type: type
                };
            });
            result.result = results;
            return result;
        });
    } else {
        return Promise.resolve<SubmissionResult>(result);
    }
}

function getResults(project: Project): Promise<ResultSet> {
    return getHTML(`https://marmoset.student.cs.uwaterloo.ca/view/project.jsp?projectPK=${project.key}`).then(html => {
        let rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
        rows.shift();
        let results = rows.map(row => {
            let tds = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
            let date = new Date(tds[1].match(/>([^<]*)</)[1]);
            let score = +tds[2].match(/(\d+) \//)[1];
            let max = +tds[2].match(/\/ (\d+)/)[1];
            let key = tds[3].match(/submissionPK=(\d+)/)[1];
            return <SubmissionResult>{
                date: date,
                key: key,
                max: max,
                score: score
            };
        });
        results = results.sort((a, b) => a.date.getDate() - b.date.getDate());
        let last = results[0];
        results = results.sort((a, b) => b.score - a.score);
        let best = results[0];
        results = results.sort((a, b) => a.date.getDate() - b.date.getDate());
        let resultSet = <ResultSet>{
            all: results,
            best: best,
            last: last
        };
        allResultsByProject.set(project.key, resultSet);
        results.forEach(result => allResultsByKey.set(result.key, result));
        return resultSet;
    });
}

function getHTML(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let client = new XMLHttpRequest();
        client.open('GET', url);
        client.onreadystatechange = () => {
            if (client.readyState === XMLHttpRequest.DONE) {
                if (client.status === 200) {
                    resolve(client.responseText);
                } else {
                    reject(`error: ${client.status}`);
                }
            }
        };
        client.send();
    });
}

let projects = Array.from(document.querySelectorAll('tr.r0, tr.r1')).map(row => {
    let tds = Array.from(row.querySelectorAll('td')).map(td => td.innerHTML);
    let projectPK = tds[1].match(/projectPK=(\d+)/)[1];
    let projectJarPK = tds[2].match(/projectJarfilePK=(\d+)/)[1]
    let projectName = tds[0].match(/>\s*(\S+)\s*</)[1]
    let projectDue = new Date(tds[3]);
    projectDue.setFullYear(2016);
    return <Project>{
        key: projectPK,
        jarfile_key: projectJarPK,
        name: projectName,
        due: projectDue
    };
});

document.styleSheets[0].disabled = true;

getHTML(chrome.runtime.getURL('views/main.html')).then(html => {
    document.body.innerHTML = `<link rel="stylesheet" href="${chrome.runtime.getURL('style/main.css')}">`;
    document.body.innerHTML += html;

    test_box = <HTMLElement>document.querySelector('.info-box');
    test_content = <HTMLElement>test_box.querySelector('tbody');

    let tbody = document.querySelector('#projects');

    projects.forEach(project => {
        // create row
        let row = document.createElement('tr');
        row.id = 'project_' + project.key;
        let name = document.createElement('th');
        name.scope = 'row';
        name.innerText = project.name;
        let lastResult = document.createElement('td');
        lastResult.id = `lr_${project.key}`;
        lastResult.classList.add('text-xs-center');
        lastResult.innerText = 'Loading';
        lastResult.addEventListener('mouseenter', () => showTestDetails('lr_' + project.key));
        lastResult.addEventListener('mouseleave', () => hideTestDetails());
        let bestResult = document.createElement('td');
        bestResult.id = `br_${project.key}`;
        bestResult.classList.add('text-xs-center');
        bestResult.innerText = 'Loading';
        bestResult.addEventListener('mouseenter', () => showTestDetails('br_' + project.key));
        bestResult.addEventListener('mouseleave', () => hideTestDetails());
        let due = document.createElement('td');
        due.innerText = dtFormat.format(project.due);
        let buttons = document.createElement('td');
        let detailBtn = document.createElement('button');
        detailBtn.classList.add('btn', 'btn-primary', 'btn-sm');
        detailBtn.innerText = 'Show';
        detailBtn.addEventListener('click', () => showMore(project, row));
        buttons.appendChild(detailBtn);
        let submitBtn = document.createElement('button');
        submitBtn.classList.add('btn', 'btn-success', 'btn-sm');
        submitBtn.innerText = 'Submit';
        submitBtn.addEventListener('click', () => showSubmitDialogue(project.key));
        buttons.appendChild(submitBtn);
        row.appendChild(name);
        row.appendChild(lastResult);
        row.appendChild(bestResult);
        row.appendChild(due);
        row.appendChild(buttons);
        tbody.appendChild(row);

        // load tests
        getResults(project).then(resultSet => {
            lastResult.innerText = `${resultSet.last.score} / ${resultSet.last.max}`;
            bestResult.innerText = `${resultSet.best.score} / ${resultSet.best.max}`;
        });
    });
});