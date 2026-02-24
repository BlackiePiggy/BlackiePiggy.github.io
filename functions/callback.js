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
    
    // 构造 Decap CMS 需要的消息
    const content = {
      token: tokenData.access_token,
      provider: "github"
    };
    const msg = `authorization:github:success:${JSON.stringify(content)}`;

    // 返回自动执行脚本
    const html = `
      <!doctype html>
      <html><body>
      <script>
        const msg = ${JSON.stringify(msg)};
        // 使用 window.location.origin 确保源匹配
        const targetOrigin = window.location.origin;
        
        if (window.opener) {
          console.log("Sending message to opener:", targetOrigin);
          window.opener.postMessage(msg, targetOrigin);
          // 稍微延迟后关闭，给主窗口一点处理时间
          setTimeout(() => { window.close(); }, 50);
        }
      </script>
      </body></html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });

  } catch (err) {
    return new Response(`Server Error: ${err.message}`, { status: 500 });
  }
}