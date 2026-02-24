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

  // 1. 准备向 GitHub 换取 Token
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
        // 这里的 redirect_uri 必须和 auth.js 中的完全一致
        redirect_uri: `${url.origin}/callback` 
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`Token Exchange Error: ${JSON.stringify(tokenData)}`, { status: 500 });
    }

    // 2. 返回消息给 Decap CMS 窗口
    // 构建正确的 postMessage 内容
    const message = JSON.stringify({
      token: tokenData.access_token,
      provider: "github"
    });
    
    // 生成 HTML 脚本关闭窗口并传递消息
    // 注意：window.opener.postMessage 的第二个参数建议填具体域名，这里用 * 简化，或者用 url.origin
    const html = `
      <!doctype html>
      <html><body>
      <script>
        const msg = ${JSON.stringify(`authorization:github:success:${message}`)};
        window.opener.postMessage(msg, "${url.origin}");
        window.close();
      </script>
      <p>Login successful. Closing...</p>
      </body></html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });

  } catch (err) {
    return new Response(`Server Error: ${err.message}`, { status: 500 });
  }
}