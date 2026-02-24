export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  // 1. 获取 GitHub Client ID (需在 Pages 设置中配置环境变量)
  const client_id = env.GITHUB_CLIENT_ID;
  if (!client_id) {
    return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });
  }

  // 2. 构建跳转 GitHub 的地址
  // 这里的 redirect_uri 必须和你 GitHub App 设置的一致
  // 建议动态获取当前域名，或者硬编码为你的 Pages 域名
  const redirect_uri = `${url.origin}/callback`; 
  
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", client_id);
  githubAuthUrl.searchParams.set("redirect_uri", redirect_uri);
  githubAuthUrl.searchParams.set("scope", "repo user"); // Decap CMS 通常需要 repo 权限
  
  // 生成随机 state 防止 CSRF (简单实现)
  const state = crypto.randomUUID();
  githubAuthUrl.searchParams.set("state", state);

  return Response.redirect(githubAuthUrl.toString(), 302);
}