addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  // HTML 表单
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MJJ图床</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        #uploadForm {
          text-align: center;
          margin-bottom: 20px;
        }
        input[type="file"] {
          display: none;
        }
        .custom-file-upload {
          display: inline-block;
          padding: 10px 20px;
          cursor: pointer;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
        }
        .custom-file-upload:hover {
          background-color: #45a049;
        }
        #result {
          text-align: center;
          margin-bottom: 20px;
        }
        #links {
          width: 100%;
          box-sizing: border-box;
          padding: 10px;
          margin-bottom: 20px;
          border: 1px solid #ccc;
          border-radius: 5px;
          resize: none;
        }
        #copyButton {
          display: block;
          margin-left: auto;
          padding: 10px 20px;
          cursor: pointer;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
        }
        #copyButton:hover {
          background-color: #45a049;
        }
        #urlButton, #bbcodeButton, #markdownButton {
          margin-right: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <form id="uploadForm" enctype="multipart/form-data">
          <label for="file" class="custom-file-upload">选择文件</label>
          <input type="file" id="file" name="file" accept="image/*" required>
        </form>
        <div id="result"></div>
        <textarea id="links" rows="4" readonly></textarea>
        <button id="urlButton">URL</button>
        <button id="bbcodeButton">BBCode</button>
        <button id="markdownButton">Markdown</button>
        <button id="copyButton" disabled>复制链接</button>
      </div>
      <script>
        document.getElementById('uploadForm').addEventListener('change', async function(event) {
          const formData = new FormData();
          formData.append('file', event.target.files[0]);
          try {
            const response = await fetch('/upload', {
              method: 'POST',
              body: formData
            });
            const data = await response.json();
            if (response.ok) {
              const imageURL = data.data.replace('http://', 'https://'); // 将 http:// 替换为 https://
              document.getElementById('result').innerText = '上传成功！';
              document.getElementById('links').value = imageURL;
              enableCopyButton();
            } else {
              document.getElementById('result').innerText = '上传失败，请重试。';
            }
          } catch (error) {
            console.error('Error:', error);
            document.getElementById('result').innerText = '上传失败，请重试。';
          }
        });

        function enableCopyButton() {
          document.getElementById('copyButton').disabled = false;
          document.getElementById('copyButton').addEventListener('click', function() {
            const links = document.getElementById('links');
            links.select();
            document.execCommand('copy');
            links.setSelectionRange(0, 0);
          });
        }

        document.getElementById('urlButton').addEventListener('click', function() {
          const imageURL = document.getElementById('links').value;
          document.getElementById('links').value = imageURL;
        });

        document.getElementById('bbcodeButton').addEventListener('click', function() {
          const imageURL = document.getElementById('links').value;
          document.getElementById('links').value = '[img]' + imageURL + '[/img]';
        });

        document.getElementById('markdownButton').addEventListener('click', function() {
          const imageURL = document.getElementById('links').value;
          document.getElementById('links').value = '![image](' + imageURL + ')';
        });
      </script>
    </body>
    </html>
  `;

  // 如果请求根路径，则返回 HTML 表单
  if (pathname === '/') {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  }

  // 如果请求上传路径并且是 POST 方法，则处理上传请求
  if (pathname === '/upload' && request.method === 'POST') {
    return handleUpload(request);
  }

  // 其他情况返回 404
  return new Response('Not Found', { status: 404 });
}

// 处理上传请求
async function handleUpload(request) {
  try {
    // 获取上传图片数据
    const formData = await request.formData();

    // 构建上传请求
    const uploadRequest = new Request('https://service2.tcl.com/api.php/Center/uploadQiniu', {
      method: 'POST',
      body: formData,
    });

    // 发送上传请求
    const response = await fetch(uploadRequest);

    // 检查上传是否成功
    if (response.ok) {
      // 解析上传成功后返回的数据
      const responseData = await response.json();

      // 检查返回的数据是否包含图片链接
      if (responseData && responseData.code === 1 && responseData.data) {
        const imageURL = responseData.data;
        return new Response(JSON.stringify({ data: imageURL }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else {
        return new Response('Upload Failed - Invalid Response Data', { status: 500 });
      }
    } else {
      return new Response('Upload Failed - Server Error', { status: 500 });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
