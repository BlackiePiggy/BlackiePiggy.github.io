export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(`GitHub Error: ${error}`, { status: 400 });
  }
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const client_id = env.GITHUB_CLIENT_ID;
  const client_secret = env.GITHUB_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return new Response("Missing Secrets", { status: 500 });
  }

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
        // 这里的 redirect_uri 必须和你 GitHub App 设置的完全一致
        redirect_uri: `${url.origin}/callback` 
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`Token Exchange Error: ${JSON.stringify(tokenData)}`, { status: 500 });
    }

    // --- 关键修改开始 ---
    
    // 1. 构建 Decap CMS 需要的消息对象
    const content = {
      token: tokenData.access_token,
      provider: "github"
    };

    // 2. 拼接完整的消息字符串，格式必须是 "authorization:provider:success:JSON"
    // 注意：这里手动拼接字符串，避免双重 JSON 序列化导致的问题
    const msg = `authorization:github:success:${JSON.stringify(content)}`;

    // 3. 返回 HTML
    // 修改点：使用 postMessage(msg, "*")。
    // "*" 表示允许发送给任何源，虽然安全性稍低，但能解决所有跨域/协议不匹配导致的“无反应”问题。
    const html = `
      <!doctype html>
      <html><body>
      <script>
        const msg = ${JSON.stringify(msg)};
        console.log("Sending message to opener:", msg);
        
        if (window.opener) {
          // 发送消息
          window.opener.postMessage(msg, "*");
          // 发送完毕后关闭窗口
          window.close();
        } else {
          document.body.innerText = "Error: Cannot find the main window (window.opener is null). Please ensure you are not blocking popups.";
        }
      </script>
      <p>Authentication successful. You can close this window now.</p>
      </body></html>
    `;
    // --- 关键修改结束 ---

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });

  } catch (err) {
    return new Response(`Server Error: ${err.message}`, { status: 500 });
  }
}