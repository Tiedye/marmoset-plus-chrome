let table_data = Array.from(document.querySelectorAll('tr.r0, tr.r1')).map(row => Array.from(row.querySelectorAll('td')).map(td => td.innerHTML.trim().replace(/\s+/g, ' ')));

document.styleSheets[0].disabled = true

let client = new XMLHttpRequest();
client.open('GET', chrome.extension.getURL('views/main.html'));
client.onreadystatechange = ev => {
    document.body.innerHTML = `<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.4/css/bootstrap.min.css" integrity="sha384-2hfp1SzUoho7/TsGGGDaFdsuuDL0LX2hnUp6VkX3CUQ2K4K+xjboZdsXyp4oUHZj" crossorigin="anonymous">
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.4/js/bootstrap.min.js" integrity="sha384-VjEeINv9OSwtWFLAtmc4JCtEJXXBub00gtSnszmspDLCtC0I4z4nqz7rEFbIZLLU" crossorigin="anonymous"></script>` + client.responseText;
    table_data.forEach(projectData => {
        
    });
};
client.send();