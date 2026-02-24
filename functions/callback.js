export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) return new Response(`GitHub Error: ${error}`, { status: 400 });
  if (!code) return new Response("Missing code", { status: 400 });

  const client_id = env.GITHUB_CLIENT_ID;
  const client_secret = env.GITHUB_CLIENT_SECRET;

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Cloudflare-Pages-Function"
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        redirect_uri: `${url.origin}/callback`
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) return new Response(`Token Error: ${JSON.stringify(tokenData)}`, { status: 500 });

    // 调试模式：不自动关闭，打印详细信息
    const content = {
      token: tokenData.access_token,
      provider: "github"
    };
    const msg = `authorization:github:success:${JSON.stringify(content)}`;

    const html = `
      <!doctype html>
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h3>调试模式 (Debug Mode)</h3>
          <p><strong>1. Token 获取状态:</strong> ✅ 成功</p>
          <p><strong>2. 准备发送的消息:</strong></p>
          <code style="background: #eee; padding: 5px; display: block; word-break: break-all;">${msg}</code>
          <p><strong>3. Window.opener 状态:</strong> <span id="opener-status">检测中...</span></p>
          
          <script>
            const msg = ${JSON.stringify(msg)};
            const statusSpan = document.getElementById("opener-status");
            
            if (window.opener) {
              statusSpan.innerText = "✅ 存在 (Connected)";
              statusSpan.style.color = "green";
              
              // 尝试发送消息
              try {
                window.opener.postMessage(msg, "*");
                document.body.insertAdjacentHTML('beforeend', '<p>📨 消息已通过 postMessage 发送。</p>');
              } catch (e) {
                document.body.insertAdjacentHTML('beforeend', '<p style="color:red">❌ 发送失败: ' + e.message + '</p>');
              }
            } else {
              statusSpan.innerText = "❌ 丢失 (Null)";
              statusSpan.style.color = "red";
              document.body.insertAdjacentHTML('beforeend', '<p>原因推测：浏览器安全策略阻止了窗口通信，或者你是直接在新标签页打开了这个链接。</p>');
            }
          </script>
        </body>
      </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });

  } catch (err) {
    return new Response(`Server Error: ${err.message}`, { status: 500 });
  }
}